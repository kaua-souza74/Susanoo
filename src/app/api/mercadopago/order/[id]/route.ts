import { NextResponse } from "next/server";
import { MPNotFoundError } from "mercadopago";

import { getAuthenticatedPayer } from "@/lib/mercadopago/auth";
import {
  extractMercadoPagoOrderSnapshot,
} from "@/lib/mercadopago/order-snapshot";
import {
  PaymentOrderMismatchError,
  PaymentOrderPersistenceError,
  findPaymentOrderForUser,
  syncPaymentOrderFromProvider,
} from "@/lib/mercadopago/payment-orders";
import {
  MercadoPagoConfigurationError,
  getMercadoPagoOrderClient,
} from "@/lib/mercadopago/server";
import { isProviderOrderId } from "@/lib/mercadopago/webhook";
import { PaymentPersistenceConfigurationError } from "@/lib/mercadopago/supabase-admin";
import type { PixOrderResponse } from "@/lib/mercadopago/types";

export const runtime = "nodejs";

export async function GET(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const payer = await getAuthenticatedPayer(
    request.headers.get("authorization"),
  );
  if (!payer) {
    return errorResponse("Sessão inválida ou expirada.", 401);
  }

  const { id } = await context.params;
  if (!isProviderOrderId(id)) {
    return errorResponse("Ordem inválida.", 400);
  }

  try {
    const paymentOrder = await findPaymentOrderForUser(id, payer.userId);
    if (!paymentOrder) {
      return errorResponse("Ordem não encontrada.", 404);
    }

    const providerOrder = await getMercadoPagoOrderClient().get({ id });
    const snapshot = extractMercadoPagoOrderSnapshot(providerOrder);
    if (!snapshot || snapshot.providerOrderId !== id) {
      return errorResponse("Resposta inválida do serviço de pagamento.", 502);
    }

    const syncedOrder = await syncPaymentOrderFromProvider(
      paymentOrder,
      snapshot,
    );
    const payload: PixOrderResponse = {
      orderId: snapshot.providerOrderId,
      serviceId: syncedOrder.serviceId,
      amountInCents: syncedOrder.amountInCents,
      currency: syncedOrder.currency,
      status: syncedOrder.status,
      statusDetail: syncedOrder.statusDetail,
      qrCode: snapshot.qrCode,
      qrCodeBase64: snapshot.qrCodeBase64,
      ticketUrl: snapshot.ticketUrl,
    };

    return NextResponse.json(payload, {
      headers: { "Cache-Control": "no-store" },
    });
  } catch (error: unknown) {
    if (error instanceof MPNotFoundError) {
      return errorResponse("Ordem não encontrada.", 404);
    }
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
      return errorResponse("Não foi possível consultar o pagamento.", 503);
    }

    return errorResponse("Não foi possível consultar o pagamento.", 502);
  }
}

function errorResponse(message: string, status: number) {
  return NextResponse.json(
    { error: message },
    { status, headers: { "Cache-Control": "no-store" } },
  );
}
