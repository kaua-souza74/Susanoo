import { NextResponse } from "next/server";

import { getAuthenticatedPayer } from "@/lib/mercadopago/auth";
import {
  getMercadoPagoCheckoutMode,
  getMercadoPagoPayer,
} from "@/lib/mercadopago/checkout-mode";
import { parseOrderRequest } from "@/lib/mercadopago/order-input";
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
  getMercadoPagoOrderClient,
} from "@/lib/mercadopago/server";
import {
  getServiceById,
  isServiceId,
} from "@/lib/mercadopago/services";
import { PaymentPersistenceConfigurationError } from "@/lib/mercadopago/supabase-admin";
import type { PixOrderResponse } from "@/lib/mercadopago/types";

export const runtime = "nodejs";

const MAX_REQUEST_BYTES = 1_024;

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

  const body = parseOrderRequest(rawBody);
  if (!body || !isServiceId(body.serviceId)) {
    return errorResponse("Dados da solicitação inválidos.", 400);
  }

  const payer = await getAuthenticatedPayer(
    request.headers.get("authorization"),
  );
  if (!payer) {
    return errorResponse("Sessão inválida ou expirada.", 401);
  }

  if (body.paymentMethod === "card") {
    return errorResponse(
      "Pagamento por cartão será habilitado em uma próxima etapa.",
      501,
    );
  }

  const service = getServiceById(body.serviceId);
  const checkoutMode = getMercadoPagoCheckoutMode(service.priceInCents);
  const providerPayer = getMercadoPagoPayer(checkoutMode, payer.email);

  try {
    const paymentOrder = await getOrCreatePaymentOrder({
      userId: payer.userId,
      serviceId: service.id,
      amountInCents: checkoutMode.amountInCents,
      checkoutSessionId: body.checkoutSessionId,
      paymentMethod: "pix",
    });

    if (
      paymentOrder.serviceId !== service.id ||
      paymentOrder.paymentMethod !== "pix" ||
      paymentOrder.amountInCents !== checkoutMode.amountInCents
    ) {
      return errorResponse("Sessão de checkout conflitante.", 409);
    }

    if (paymentOrder.providerOrderId) {
      const snapshot = await getProviderOrderSnapshot(
        paymentOrder.providerOrderId,
      );
      const syncedOrder = await syncPaymentOrderFromProvider(
        paymentOrder,
        snapshot,
      );

      return successResponse(syncedOrder, snapshot, 200);
    }

    const amount = (paymentOrder.amountInCents / 100).toFixed(2);
    const providerOrder = await getMercadoPagoOrderClient().create({
      body: {
        type: "online",
        processing_mode: "automatic",
        total_amount: amount,
        external_reference: paymentOrder.externalReference,
        description: service.name,
        payer: {
          email: providerPayer.email,
          ...(providerPayer.firstName
            ? { first_name: providerPayer.firstName }
            : {}),
        },
        transactions: {
          payments: [
            {
              amount,
              payment_method: {
                id: "pix",
                type: "bank_transfer",
              },
            },
          ],
        },
      },
      requestOptions: {
        idempotencyKey: paymentOrder.idempotencyKey,
      },
    });

    const snapshot = extractMercadoPagoOrderSnapshot(providerOrder);
    if (!snapshot) {
      return errorResponse("Resposta inválida do serviço de pagamento.", 502);
    }

    const syncedOrder = await syncPaymentOrderFromProvider(
      paymentOrder,
      snapshot,
    );

    return successResponse(syncedOrder, snapshot, 201);
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

async function getProviderOrderSnapshot(
  providerOrderId: string,
): Promise<MercadoPagoOrderSnapshot> {
  const providerOrder = await getMercadoPagoOrderClient().get({
    id: providerOrderId,
  });
  const snapshot = extractMercadoPagoOrderSnapshot(providerOrder);

  if (!snapshot || snapshot.providerOrderId !== providerOrderId) {
    throw new PaymentOrderMismatchError();
  }

  return snapshot;
}

function successResponse(
  paymentOrder: PaymentOrder,
  snapshot: MercadoPagoOrderSnapshot,
  status: 200 | 201,
) {
  const payload: PixOrderResponse = {
    orderId: snapshot.providerOrderId,
    serviceId: paymentOrder.serviceId,
    amountInCents: paymentOrder.amountInCents,
    currency: paymentOrder.currency,
    status: paymentOrder.status,
    statusDetail: paymentOrder.statusDetail,
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

function errorResponse(message: string, status: number) {
  return NextResponse.json(
    { error: message },
    { status, headers: { "Cache-Control": "no-store" } },
  );
}
