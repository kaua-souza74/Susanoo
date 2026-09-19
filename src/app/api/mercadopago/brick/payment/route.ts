import { NextResponse } from "next/server";
import { MercadoPagoError, MPPaymentError } from "mercadopago";

import { getAuthenticatedPayer } from "@/lib/mercadopago/auth";
import { canPurchaseService } from "@/lib/mercadopago/service-access";
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
  isMercadoPagoCardPaymentMethodAvailable,
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

  if (!canPurchaseService(body.serviceId, payer.userId)) {
    return errorResponse("Serviço indisponível para esta conta.", 403);
  }

  const service = getServiceById(body.serviceId);
  const checkoutMode = getMercadoPagoCheckoutMode(service.priceInCents);
  const providerPayerEmail = checkoutMode.isSandbox
    ? SANDBOX_CARD_PAYER_EMAIL
    : payer.email;

  try {
    const isPaymentMethodAvailable =
      await isMercadoPagoCardPaymentMethodAvailable(
        body.paymentMethodId,
        body.paymentTypeId,
      );
    if (!isPaymentMethodAvailable) {
      return errorResponse("Meio de pagamento indisponível.", 400);
    }

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
                      type: body.paymentTypeId,
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
      logMercadoPagoError(error, [
        body.token,
        body.identification.number,
        providerPayerEmail,
      ]);
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

function logMercadoPagoError(
  error: unknown,
  sensitiveValues: string[],
) {
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
  const errorRecord = isRecord(error) ? error : null;
  const response = isRecord(errorRecord?.response)
    ? errorRecord.response
    : null;
  const apiResponse =
    (isRecord(errorRecord?.apiResponse) && errorRecord.apiResponse) ||
    (isRecord(errorRecord?.api_response) && errorRecord.api_response) ||
    null;
  const responseBody =
    (isRecord(response?.data) && response.data) ||
    (isRecord(response?.body) && response.body) ||
    (isRecord(errorRecord?.data) && errorRecord.data) ||
    null;
  const safeResponseBody = readSafeResponseBody(
    responseBody,
    sensitiveValues,
  );
  const requestId =
    readSafeRequestId(response?.headers, sensitiveValues) ??
    readSafeRequestId(apiResponse?.headers, sensitiveValues);
  const causes = isMercadoPagoError
    ? error.causes
    : Array.isArray(errorRecord?.cause)
      ? errorRecord.cause
      : [];

  console.error(
    JSON.stringify({
      route: "/api/mercadopago/brick/payment",
      stage: "mercadopago_error",
      error_name: classifyMercadoPagoError(error),
      http_status:
        readSafeStatus(errorRecord?.status) ??
        readSafeStatus(errorRecord?.statusCode) ??
        readSafeStatus(response?.status) ??
        null,
      api_message: readSafeText(
        errorRecord?.message ?? safeResponseBody?.message,
        sensitiveValues,
      ),
      api_error: readSafeText(
        errorRecord?.error ?? safeResponseBody?.error,
        sensitiveValues,
      ),
      provider_status: safeResponseBody?.status ?? null,
      provider_status_detail: safeResponseBody?.status_detail ?? null,
      api_cause_codes: causes
        .map((cause) => toSafeApiCause(cause, sensitiveValues))
        .filter((cause) => cause !== null),
      mercadopago_request_id: requestId,
      response_body: safeResponseBody,
      sdk_fields_present: readSafeSdkFields(errorRecord),
    }),
  );
}

function classifyMercadoPagoError(error: unknown): string {
  if (error instanceof MPPaymentError) return "MPPaymentError";
  if (error instanceof MercadoPagoError) return "MercadoPagoError";
  return error instanceof Error ? error.name : "UnknownError";
}

function toSafeApiCause(cause: unknown, sensitiveValues: string[]) {
  if (!cause || typeof cause !== "object") return null;

  const value = cause as Record<string, unknown>;
  return {
    code: readSafeText(value.code ?? value.error, sensitiveValues),
    description: readSafeText(
      value.description ?? value.message,
      sensitiveValues,
    ),
  };
}

function readSafeResponseBody(
  value: Record<string, unknown> | null,
  sensitiveValues: string[],
) {
  if (!value) return null;
  const transactions = isRecord(value.transactions)
    ? value.transactions
    : null;
  const paymentsSource = Array.isArray(transactions?.payments)
    ? transactions.payments
    : [];
  const detailsSource = Array.isArray(value.details)
    ? value.details
    : Array.isArray(value.cause)
      ? value.cause
      : [];

  return {
    id: readSafeText(value.id, sensitiveValues),
    code: readSafeText(
      value.code ?? value.error_code,
      sensitiveValues,
    ),
    error: readSafeText(value.error, sensitiveValues),
    message: readSafeText(value.message, sensitiveValues),
    status: readSafeText(value.status, sensitiveValues),
    status_detail: readSafeText(value.status_detail, sensitiveValues),
    details: detailsSource
      .map((detail) => toSafeApiCause(detail, sensitiveValues))
      .filter((detail) => detail !== null)
      .slice(0, 20),
    payments: paymentsSource
      .map((payment) => readSafePayment(payment, sensitiveValues))
      .filter((payment) => payment !== null)
      .slice(0, 10),
  };
}

function readSafePayment(value: unknown, sensitiveValues: string[]) {
  if (!isRecord(value)) return null;
  const paymentMethod = isRecord(value.payment_method)
    ? value.payment_method
    : null;

  return {
    id: readSafeText(value.id, sensitiveValues),
    status: readSafeText(value.status, sensitiveValues),
    status_detail: readSafeText(value.status_detail, sensitiveValues),
    payment_method_id: readSafeText(paymentMethod?.id, sensitiveValues),
  };
}

function readSafeRequestId(
  headers: unknown,
  sensitiveValues: string[],
): string | null {
  if (headers instanceof Headers) {
    return readSafeText(headers.get("x-request-id"), sensitiveValues, 256);
  }
  if (!isRecord(headers)) return null;
  const value = headers["x-request-id"] ?? headers["X-Request-Id"];
  const candidate = Array.isArray(value) ? value[0] : value;
  return readSafeText(candidate, sensitiveValues, 256);
}

function readSafeSdkFields(
  value: Record<string, unknown> | null,
): string[] {
  if (!value) return [];
  const allowedFields = [
    "status",
    "statusCode",
    "message",
    "error",
    "causes",
    "cause",
    "response",
    "data",
    "apiResponse",
    "api_response",
  ];
  return allowedFields.filter((field) =>
    Object.prototype.hasOwnProperty.call(value, field),
  );
}

function readSafeStatus(value: unknown): number | null {
  return typeof value === "number" &&
    Number.isSafeInteger(value) &&
    value >= 100 &&
    value <= 599
    ? value
    : null;
}

function readSafeText(
  value: unknown,
  sensitiveValues: string[],
  maxLength = 512,
): string | null {
  if (typeof value !== "string") return null;
  let normalized = value
    .replace(/[\u0000-\u001f\u007f-\u009f]/g, " ")
    .trim();
  for (const sensitiveValue of sensitiveValues) {
    if (sensitiveValue) {
      normalized = normalized.replaceAll(sensitiveValue, "[redacted]");
    }
  }
  normalized = normalized
    .replace(/[\w.+-]+@[\w.-]+\.[A-Za-z]{2,}/g, "[redacted-email]")
    .replace(/\b(?:\d[ -]?){11,19}\b/g, "[redacted-number]")
    .replace(
      /\b(?:cvv|cvc|security\s*code)\s*[:=]?\s*\d{3,4}\b/gi,
      "[redacted-security-code]",
    );
  return normalized ? normalized.slice(0, maxLength) : null;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function errorResponse(message: string, status: number) {
  return NextResponse.json(
    { error: message },
    { status, headers: { "Cache-Control": "no-store" } },
  );
}
