import { NextResponse } from "next/server";
import {
  InvalidWebhookSignatureError,
  MPNotFoundError,
  WebhookSignatureValidator,
} from "mercadopago";

import { extractMercadoPagoOrderSnapshot } from "@/lib/mercadopago/order-snapshot";
import {
  PaymentOrderMismatchError,
  PaymentOrderPersistenceError,
  findPaymentOrderByExternalReference,
  findPaymentOrderByProviderOrderId,
  syncPaymentOrderFromProvider,
} from "@/lib/mercadopago/payment-orders";
import {
  MercadoPagoConfigurationError,
  getMercadoPagoOrderClient,
} from "@/lib/mercadopago/server";
import { PaymentPersistenceConfigurationError } from "@/lib/mercadopago/supabase-admin";
import {
  isProviderOrderId,
  isWebhookTimestampValid,
  parseOrderWebhookNotification,
} from "@/lib/mercadopago/webhook";

export const runtime = "nodejs";

const MAX_WEBHOOK_BYTES = 16_384;

export async function POST(request: Request) {
  const secret = process.env.MERCADO_PAGO_WEBHOOK_SECRET;
  if (!secret) {
    return errorResponse("Webhook indisponível.", 503);
  }

  const url = new URL(request.url);
  const queryDataId = url.searchParams.get("data.id");
  const queryType = url.searchParams.get("type");
  const xSignature = request.headers.get("x-signature");
  const xRequestId = request.headers.get("x-request-id");
  const signatureDiagnostics = getSignatureDiagnostics(xSignature);

  logWebhookDiagnostic({
    webhook_stage: "received",
    has_x_request_id: Boolean(xRequestId?.trim()),
    x_request_id_length: xRequestId?.length ?? 0,
    has_x_signature: Boolean(xSignature?.trim()),
    x_signature_length: xSignature?.length ?? 0,
    has_query_data_id: Boolean(queryDataId),
    query_data_id: queryDataId,
    query_type: queryType,
    has_ts: signatureDiagnostics.hasTs,
    ts_digits: signatureDiagnostics.tsDigits,
    has_v1: signatureDiagnostics.hasV1,
    v1_length: signatureDiagnostics.v1Length,
  });

  if (!xRequestId?.trim()) {
    logWebhookDiagnostic({ webhook_stage: "x_request_id_missing" });
    return errorResponse("Assinatura inválida.", 401);
  }

  try {
    WebhookSignatureValidator.validate({
      xSignature,
      xRequestId,
      dataId: queryDataId,
      secret,
    });
  } catch (error: unknown) {
    if (error instanceof InvalidWebhookSignatureError) {
      logWebhookDiagnostic({
        webhook_stage: "hmac_invalid",
        error_name: error.name,
        error_reason: error.reason,
      });
      return errorResponse("Assinatura inválida.", 401);
    }
    return errorResponse("Notificação inválida.", 400);
  }

  logWebhookDiagnostic({ webhook_stage: "hmac_valid" });

  if (!isWebhookTimestampValid(xSignature)) {
    logWebhookDiagnostic({
      webhook_stage: "timestamp_invalid",
      ts_digits: signatureDiagnostics.tsDigits,
      timestamp_delta_seconds: signatureDiagnostics.timestampDeltaSeconds,
      reason: "timestamp_out_of_window",
    });
    return errorResponse("Assinatura inválida.", 401);
  }

  logWebhookDiagnostic({ webhook_stage: "timestamp_valid" });

  const contentLength = Number(request.headers.get("content-length") ?? 0);
  if (Number.isFinite(contentLength) && contentLength > MAX_WEBHOOK_BYTES) {
    return errorResponse("Notificação muito grande.", 413);
  }

  const rawBody = await request.text();
  if (new TextEncoder().encode(rawBody).byteLength > MAX_WEBHOOK_BYTES) {
    return errorResponse("Notificação muito grande.", 413);
  }

  const notification = parseOrderWebhookNotification(rawBody, queryDataId);
  if (!notification) {
    return errorResponse("Notificação inválida.", 400);
  }

  if (!isProviderOrderId(notification.dataId)) {
    return receivedResponse("ignored");
  }

  try {
    const providerOrder = await getMercadoPagoOrderClient().get({
      id: notification.dataId,
    });
    const snapshot = extractMercadoPagoOrderSnapshot(providerOrder);

    if (!snapshot || snapshot.providerOrderId !== notification.dataId) {
      return errorResponse("Não foi possível confirmar a ordem.", 502);
    }

    const paymentOrder =
      (await findPaymentOrderByProviderOrderId(snapshot.providerOrderId)) ??
      (await findPaymentOrderByExternalReference(snapshot.externalReference));

    if (!paymentOrder) {
      return receivedResponse("ignored");
    }

    await syncPaymentOrderFromProvider(paymentOrder, snapshot);
    return receivedResponse("processed");
  } catch (error: unknown) {
    if (error instanceof MPNotFoundError) {
      return receivedResponse("ignored");
    }
    if (
      error instanceof MercadoPagoConfigurationError ||
      error instanceof PaymentPersistenceConfigurationError
    ) {
      return errorResponse("Webhook indisponível.", 503);
    }
    if (error instanceof PaymentOrderMismatchError) {
      return errorResponse("Ordem inconsistente.", 409);
    }
    if (error instanceof PaymentOrderPersistenceError) {
      return errorResponse("Falha temporária ao reconciliar a ordem.", 503);
    }

    return errorResponse("Falha temporária ao processar a notificação.", 502);
  }
}

function receivedResponse(result: "processed" | "ignored") {
  return NextResponse.json(
    { received: true, result },
    { status: 200, headers: { "Cache-Control": "no-store" } },
  );
}

function errorResponse(message: string, status: number) {
  return NextResponse.json(
    { error: message },
    { status, headers: { "Cache-Control": "no-store" } },
  );
}

type SignatureDiagnostics = {
  hasTs: boolean;
  tsDigits: number;
  hasV1: boolean;
  v1Length: number;
  timestampDeltaSeconds: number | null;
};

function getSignatureDiagnostics(
  xSignature: string | null,
  nowMs = Date.now(),
): SignatureDiagnostics {
  let timestamp: string | null = null;
  let v1: string | null = null;

  for (const part of xSignature?.split(",") ?? []) {
    const separatorIndex = part.indexOf("=");
    if (separatorIndex === -1) continue;

    const key = part.slice(0, separatorIndex).trim().toLowerCase();
    const value = part.slice(separatorIndex + 1).trim();
    if (key === "ts" && value) timestamp = value;
    if (key === "v1" && value) v1 = value;
  }

  const timestampIsDigits = Boolean(timestamp && /^\d+$/.test(timestamp));
  const tsDigits = timestampIsDigits ? timestamp?.length ?? 0 : 0;
  let timestampDeltaSeconds: number | null = null;

  if (timestamp && (tsDigits === 10 || tsDigits === 13)) {
    const timestampValue = Number(timestamp);
    const timestampMs = tsDigits === 10 ? timestampValue * 1_000 : timestampValue;
    const deltaSeconds = Math.abs(nowMs - timestampMs) / 1_000;
    if (Number.isFinite(deltaSeconds)) {
      timestampDeltaSeconds = Math.round(deltaSeconds);
    }
  }

  return {
    hasTs: Boolean(timestamp),
    tsDigits,
    hasV1: Boolean(v1),
    v1Length: v1?.length ?? 0,
    timestampDeltaSeconds,
  };
}

function logWebhookDiagnostic(fields: Record<string, unknown>) {
  console.info(JSON.stringify({ route: "/api/mercadopago/webhook", ...fields }));
}
