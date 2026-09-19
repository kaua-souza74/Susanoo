import { NextResponse } from "next/server";

import { getAuthenticatedPayer } from "@/lib/mercadopago/auth";
import {
  PaymentOrderPersistenceError,
  findPaymentOrderByCheckoutSession,
} from "@/lib/mercadopago/payment-orders";
import { PaymentPersistenceConfigurationError } from "@/lib/mercadopago/supabase-admin";
import type { CardAttemptStatusResponse } from "@/lib/mercadopago/types";

export const runtime = "nodejs";

const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

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
  if (!UUID_PATTERN.test(id)) {
    return errorResponse("Tentativa inválida.", 400);
  }

  try {
    const paymentOrder = await findPaymentOrderByCheckoutSession(
      payer.userId,
      id,
    );
    if (!paymentOrder || paymentOrder.paymentMethod !== "card") {
      return errorResponse("Tentativa não encontrada.", 404);
    }

    const payload: CardAttemptStatusResponse = {
      localOrderId: paymentOrder.id,
      providerId: paymentOrder.providerOrderId,
      status: paymentOrder.status,
      statusDetail: paymentOrder.statusDetail,
      paymentMethod: "card",
    };

    return NextResponse.json(payload, {
      headers: { "Cache-Control": "no-store" },
    });
  } catch (error: unknown) {
    if (error instanceof PaymentPersistenceConfigurationError) {
      return errorResponse("Serviço de pagamento indisponível.", 503);
    }
    if (error instanceof PaymentOrderPersistenceError) {
      return errorResponse("Não foi possível consultar o pagamento.", 503);
    }
    return errorResponse("Não foi possível consultar o pagamento.", 500);
  }
}

function errorResponse(message: string, status: number) {
  return NextResponse.json(
    { error: message },
    { status, headers: { "Cache-Control": "no-store" } },
  );
}
