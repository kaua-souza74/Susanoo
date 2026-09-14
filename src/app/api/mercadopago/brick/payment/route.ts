import { NextResponse } from "next/server";
import { MercadoPagoError } from "mercadopago";

import { getAuthenticatedPayer } from "@/lib/mercadopago/auth";
import { parseBrickPaymentRequest } from "@/lib/mercadopago/brick-payment-input";
import { getMercadoPagoCheckoutMode } from "@/lib/mercadopago/checkout-mode";
import {
  extractMercadoPagoOrderSnapshot,
  type MercadoPagoOrderSnapshot,
} from "@/lib/mercadopago/order-snapshot";
import {
  PaymentOrderMismatchError,
  PaymentOrderPersistenceError,
  getOrCreatePaymentOrder,
  syncPaymentOrderFromProvider,
  type PaymentOrder,
} from "@/lib/mercadopago/payment-orders";
import {
  MercadoPagoConfigurationError,
  MercadoPagoOrderHttpError,
  createMercadoPagoOrder,
  getMercadoPagoOrderClient,
} from "@/lib/mercadopago/server";
import { getServiceById, isServiceId } from "@/lib/mercadopago/services";
import { PaymentPersistenceConfigurationError } from "@/lib/mercadopago/supabase-admin";
import type { BrickPaymentResponse } from "@/lib/mercadopago/types";

export const runtime = "nodejs";

const MAX_REQUEST_BYTES = 4_096;
const SANDBOX_CARD_PAYER_EMAIL = "test@testuser.com";

export async function POST(request: Request) {
  if (!isJsonRequest(request)) {
    return errorResponse("Content-Type deve ser application/json.", 415);
  }

  const contentLength = Number(request.headers.get("content-length") ?? 0);
  if (Number.isFinite(contentLength) && contentLength > MAX_REQUEST_BYTES) {
    return errorResponse("Requisição muito grande.", 413);
  }

  const rawBody = await request.text();
  if (new TextEncoder().encode(rawBody).byteLength > MAX_REQUEST_BYTES) {
    return errorResponse("Requisição muito grande.", 413);
  }

  const body = parseBrickPaymentRequest(rawBody);
  if (!body || !isServiceId(body.serviceId)) {
    return errorResponse("Dados do pagamento inválidos.", 400);
  }

  const payer = await getAuthenticatedPayer(
    request.headers.get("authorization"),
  );
  if (!payer) {
    return errorResponse("Sessão inválida ou expirada.", 401);
  }

  const service = getServiceById(body.serviceId);
  const checkoutMode = getMercadoPagoCheckoutMode(service.priceInCents);
  const providerPayerEmail = checkoutMode.isSandbox
    ? SANDBOX_CARD_PAYER_EMAIL
    : payer.email;

  try {
    const paymentOrder = await getOrCreatePaymentOrder({
      userId: payer.userId,
      serviceId: service.id,
      amountInCents: checkoutMode.amountInCents,
      checkoutSessionId: body.checkoutSessionId,
      paymentMethod: body.paymentMethod,
    });

    if (
      paymentOrder.serviceId !== service.id ||
      paymentOrder.paymentMethod !== body.paymentMethod ||
      paymentOrder.amountInCents !== checkoutMode.amountInCents
    ) {
      return errorResponse("Sessão de checkout conflitante.", 409);
    }

    const orderClient = getMercadoPagoOrderClient();
    logSafePaymentMetadata({
      stage: "brick_payment_request",
      payment_method_id: body.paymentMethodId,
      payment_type_id: body.paymentTypeId,
      installments: body.installments,
      has_token: Boolean(body.token),
      amount_cents: paymentOrder.amountInCents,
      sandbox: checkoutMode.isSandbox,
    });

    let providerOrder;
    try {
      const amount = (paymentOrder.amountInCents / 100).toFixed(2);
      providerOrder = paymentOrder.providerOrderId
        ? await orderClient.get({ id: paymentOrder.providerOrderId })
        : await createMercadoPagoOrder({
            body: {
              type: "online",
              processing_mode: "automatic",
              total_amount: amount,
              description: service.name,
              external_reference: paymentOrder.externalReference,
              payer: {
                email: providerPayerEmail,
                identification: {
                  type: body.identification.type,
                  number: body.identification.number,
                },
              },
              transactions: {
                payments: [
                  {
                    amount,
                    payment_method: {
                      id: body.paymentMethodId,
                      type: "credit_card",
                      token: body.token,
                      installments: body.installments,
                    },
                  },
                ],
              },
            },
            requestOptions: {
              idempotencyKey: paymentOrder.idempotencyKey,
            },
          });
    } catch (error: unknown) {
      logMercadoPagoError(error);
      throw error;
    }

    const snapshot = extractMercadoPagoOrderSnapshot(providerOrder);
    if (!snapshot) {
      return errorResponse("Resposta inválida do serviço de pagamento.", 502);
    }
    if (
      paymentOrder.providerOrderId &&
      snapshot.providerOrderId !== paymentOrder.providerOrderId
    ) {
      throw new PaymentOrderMismatchError();
    }

    const syncedOrder = await syncPaymentOrderFromProvider(
      paymentOrder,
      snapshot,
    );

    logSafePaymentMetadata({
      payment_method_id: body.paymentMethodId,
      payment_type_id: body.paymentTypeId,
      installments: body.installments,
      issuer_id: body.issuerId,
      status: snapshot.providerStatus,
      provider_id: snapshot.providerOrderId,
      external_reference: paymentOrder.externalReference,
    });

    return successResponse(
      syncedOrder,
      snapshot,
      paymentOrder.providerOrderId ? 200 : 201,
    );
  } catch (error: unknown) {
    if (
      error instanceof MercadoPagoConfigurationError ||
      error instanceof PaymentPersistenceConfigurationError
    ) {
      return errorResponse("Serviço de pagamento indisponível.", 503);
    }
    if (error instanceof PaymentOrderMismatchError) {
      return errorResponse("Inconsistência na ordem de pagamento.", 409);
    }
    if (error instanceof PaymentOrderPersistenceError) {
      return errorResponse("Não foi possível registrar o pagamento.", 503);
    }

    return errorResponse("Não foi possível processar o pagamento.", 502);
  }
}

function successResponse(
  paymentOrder: PaymentOrder,
  snapshot: MercadoPagoOrderSnapshot,
  status: 200 | 201,
) {
  const payload: BrickPaymentResponse = {
    localOrderId: paymentOrder.id,
    providerId: snapshot.providerOrderId,
    status: paymentOrder.status,
    statusDetail: paymentOrder.statusDetail,
    paymentMethod: paymentOrder.paymentMethod,
    qrCode: snapshot.qrCode,
    qrCodeBase64: snapshot.qrCodeBase64,
    ticketUrl: snapshot.ticketUrl,
  };

  return NextResponse.json(payload, {
    status,
    headers: { "Cache-Control": "no-store" },
  });
}

function isJsonRequest(request: Request): boolean {
  return request.headers
    .get("content-type")
    ?.toLowerCase()
    .startsWith("application/json") ?? false;
}

function logSafePaymentMetadata(fields: Record<string, unknown>) {
  console.info(
    JSON.stringify({ route: "/api/mercadopago/brick/payment", ...fields }),
  );
}

function logMercadoPagoError(error: unknown) {
  if (error instanceof MercadoPagoOrderHttpError) {
    console.error(
      JSON.stringify({
        route: "/api/mercadopago/brick/payment",
        stage: "mercadopago_order_error",
        http_status: error.status,
        error_code: error.errorCode,
        message: error.message,
        details: error.details,
        request_id: error.requestId,
      }),
    );
    return;
  }

  const isMercadoPagoError = error instanceof MercadoPagoError;

  console.error(
    JSON.stringify({
      route: "/api/mercadopago/brick/payment",
      stage: "mercadopago_error",
      error_name: error instanceof Error ? error.name : "UnknownError",
      http_status: isMercadoPagoError ? error.status : null,
      api_message: isMercadoPagoError ? error.message : null,
      api_error: isMercadoPagoError ? error.error : null,
      api_cause_codes: isMercadoPagoError
        ? error.causes.map(toSafeApiCause).filter((cause) => cause !== null)
        : [],
      // mercadopago@3.6.1 does not attach response headers to non-2xx errors.
      mercadopago_request_id: null,
    }),
  );
}

function toSafeApiCause(cause: unknown) {
  if (!cause || typeof cause !== "object") return null;

  const value = cause as Record<string, unknown>;
  return {
    code: typeof value.code === "string" ? value.code : null,
    description:
      typeof value.description === "string" ? value.description : null,
  };
}

function errorResponse(message: string, status: number) {
  return NextResponse.json(
    { error: message },
    { status, headers: { "Cache-Control": "no-store" } },
  );
}
