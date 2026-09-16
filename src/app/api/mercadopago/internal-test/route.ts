import { NextResponse } from "next/server";

import { getAuthenticatedPayer } from "@/lib/mercadopago/auth";
import { canPurchaseService } from "@/lib/mercadopago/service-access";
import { formatPriceInBRL, getServiceById } from "@/lib/mercadopago/services";
import type { InternalCheckoutConfiguration } from "@/lib/mercadopago/types";

export const runtime = "nodejs";

// Read-only authorization/configuration; this endpoint never creates a payment.
export async function GET(request: Request) {
  const payer = await getAuthenticatedPayer(request.headers.get("authorization"));
  if (!payer) {
    return response({ error: "Entre na sua conta para acessar o teste interno." }, 401);
  }
  if (!canPurchaseService("internal-production-test", payer.userId)) {
    return response({ error: "Teste interno indisponível para esta conta." }, 403);
  }

  const service = getServiceById("internal-production-test");
  const configuration: InternalCheckoutConfiguration = {
    id: "internal-production-test",
    name: service.name,
    description: service.description,
    deliveryLabel: service.deliveryLabel,
    formattedPrice: formatPriceInBRL(service.priceInCents),
    amountInCents: service.priceInCents,
    isSandbox: false,
    sessionScope: `catalog-${service.priceInCents}`,
  };
  return response(configuration, 200);
}

function response(body: unknown, status: number) {
  return NextResponse.json(body, {
    status,
    headers: { "Cache-Control": "private, no-store", "X-Robots-Tag": "noindex, nofollow" },
  });
}
