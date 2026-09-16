import { NextResponse } from "next/server";
import { logProductionSignatureDiagnostics, logProductionApplicationContext } from "@/lib/mercadopago/production-signature-diagnostics";
import {
  InvalidWebhookSignatureError,
  MPNotFoundError,
  WebhookSignatureValidator,
} from "mercadopago";

import { extractMercadoPagoOrderSnapshot } from "@/lib/mercadopago/order-snapshot";
import { isMercadoPagoSandboxEnabled } from "@/lib/mercadopago/checkout-mode";
import {
  PaymentOrderMismatchError,
  PaymentOrderPersistenceError,
  findPaymentOrderByExternalReference,
  findPaymentOrderByProviderOrderId,
  syncPaymentOrderFromProvider,
  type PaymentOrder,
} from "@/lib/mercadopago/payment-orders";
import {
  MercadoPagoConfigurationError,
  getMercadoPagoOrderClient,
} from "@/lib/mercadopago/server";
import {
  DEFAULT_ORDERS_APPLICATION_ID,
  isSandboxProviderOrderId,
  verifySandboxProviderOrder,
} from "@/lib/mercadopago/sandbox-webhook-fallback";
import { PaymentPersistenceConfigurationError } from "@/lib/mercadopago/supabase-admin";
import {
  isProviderOrderId,
  isWebhookTimestampValid,
  parseOrderWebhookNotification,
} from "@/lib/mercadopago/webhook";

export const runtime = "nodejs";

const MAX_WEBHOOK_BYTES = 16_384;

export async function POST(request: Request) {
  const url = new URL(request.url);
  const queryType = url.searchParams.get("type");
  const secret = process.env.MERCADO_PAGO_ORDERS_WEBHOOK_SECRET;
  if (!secret) {
    return errorResponse("Webhook indisponível.", 503);
  }

  if (queryType !== "order") {
    return errorResponse("Notificação inválida.", 400);
  }

  const queryDataId = url.searchParams.get("data.id");
  const xSignature = request.headers.get("x-signature");
  const xRequestId = request.headers.get("x-request-id");

  if (!xRequestId?.trim()) {
    logWebhookDiagnostic({ webhook_stage: "x_request_id_missing" });
    return errorResponse("Assinatura inválida.", 401);
  }

  let sdkValidationError: unknown;

  try {
    WebhookSignatureValidator.validate({
      xSignature,
      xRequestId,
      dataId: queryDataId,
      secret,
    });
  } catch (error: unknown) {
    sdkValidationError = error;
  }

  if (sdkValidationError) {
    if (sdkValidationError instanceof InvalidWebhookSignatureError) {
      logProductionSignatureDiagnostics({ secret, xSignature, xRequestId, dataId: queryDataId, sdkValid: false });
      if (sdkValidationError.reason === "SignatureMismatch") {
        await logProductionApplicationContext(request, queryDataId);
      }
      if (
        sdkValidationError.reason === "SignatureMismatch" &&
        isMercadoPagoSandboxEnabled() &&
        queryDataId &&
        isSandboxProviderOrderId(queryDataId)
      ) {
        return handleSandboxProviderFallback(queryDataId);
      }
      logWebhookDiagnostic({
        webhook_stage: "hmac_invalid",
        error_reason: sdkValidationError.reason,
      });
      return errorResponse("Assinatura inválida.", 401);
    }
    return errorResponse("Notificação inválida.", 400);
  }

  const signatureDiagnostics = getSignatureDiagnostics(xSignature);
  if (!isWebhookTimestampValid(xSignature)) {
    logWebhookDiagnostic({
      webhook_stage: "timestamp_invalid",
      ts_digits: signatureDiagnostics.tsDigits,
      timestamp_delta_seconds: signatureDiagnostics.timestampDeltaSeconds,
      reason: "timestamp_out_of_window",
    });
    return errorResponse("Assinatura inválida.", 401);
  }

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
    const snapshot = extractMercadoPagoOrderSnapshot(
      await getMercadoPagoOrderClient().get({ id: notification.dataId }),
    );

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
  tsDigits: number;
  timestampDeltaSeconds: number | null;
};

function getSignatureDiagnostics(
  xSignature: string | null,
  nowMs = Date.now(),
): SignatureDiagnostics {
  let timestamp: string | null = null;

  for (const part of xSignature?.split(",") ?? []) {
    const separatorIndex = part.indexOf("=");
    if (separatorIndex === -1) continue;

    const key = part.slice(0, separatorIndex).trim().toLowerCase();
    const value = part.slice(separatorIndex + 1).trim();
    if (key === "ts" && value) timestamp = value;
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
    tsDigits,
    timestampDeltaSeconds,
  };
}

function logWebhookDiagnostic(fields: Record<string, unknown>) {
  console.info(JSON.stringify({ route: "/api/mercadopago/webhook", ...fields }));
}

async function handleSandboxProviderFallback(providerOrderId: string) {
  let paymentOrder: PaymentOrder | null = null;

  try {
    const providerOrder = await getMercadoPagoOrderClient().get({
      id: providerOrderId,
    });

    const snapshot = extractMercadoPagoOrderSnapshot(providerOrder);
    if (snapshot) {
      paymentOrder = await findPaymentOrderByExternalReference(
        snapshot.externalReference,
      );
    }

    const expectedApplicationId =
      process.env.MERCADO_PAGO_ORDERS_APPLICATION_ID?.trim() ||
      DEFAULT_ORDERS_APPLICATION_ID;
    const verification = verifySandboxProviderOrder({
      providerOrder,
      requestedOrderId: providerOrderId,
      paymentOrder,
      expectedApplicationId,
    });

    if (!verification.valid || !verification.snapshot || !paymentOrder) {
      logSandboxFallback(verification, false);
      return errorResponse("Assinatura inválida.", 401);
    }

    await syncPaymentOrderFromProvider(paymentOrder, verification.snapshot);
    logSandboxFallback(verification, true);
    return receivedResponse("processed");
  } catch {
    logSandboxFallback(null, false);
    return errorResponse("Assinatura inválida.", 401);
  }
}

function logSandboxFallback(
  verification: ReturnType<typeof verifySandboxProviderOrder> | null,
  reconciled: boolean,
) {
  logWebhookDiagnostic({
    webhook_stage: "sandbox_provider_verified_fallback",
    hmac_valid: false,
    provider_lookup_valid: verification?.providerLookupValid ?? false,
    application_match: verification?.applicationMatch ?? false,
    external_reference_match: verification?.externalReferenceMatch ?? false,
    amount_match: verification?.amountMatch ?? false,
    environment_match: verification?.environmentMatch ?? false,
    reconciled,
  });
}
