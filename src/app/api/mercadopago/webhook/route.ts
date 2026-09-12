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
import { parseOrderWebhookNotification } from "@/lib/mercadopago/webhook";

export const runtime = "nodejs";

const MAX_WEBHOOK_BYTES = 16_384;
const SIGNATURE_TOLERANCE_SECONDS = 300;

export async function POST(request: Request) {
  const secret = process.env.MERCADO_PAGO_WEBHOOK_SECRET;
  if (!secret) {
    return errorResponse("Webhook indisponível.", 503);
  }

  const url = new URL(request.url);
  const queryDataId = url.searchParams.get("data.id");

  try {
    WebhookSignatureValidator.validate({
      xSignature: request.headers.get("x-signature"),
      xRequestId: request.headers.get("x-request-id"),
      dataId: queryDataId,
      secret,
      toleranceSeconds: SIGNATURE_TOLERANCE_SECONDS,
    });
  } catch (error: unknown) {
    if (error instanceof InvalidWebhookSignatureError) {
      return errorResponse("Assinatura inválida.", 401);
    }
    return errorResponse("Notificação inválida.", 400);
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
