import type { Metadata } from "next";

import { CheckoutExperience } from "./checkout-experience";
import { getMercadoPagoCheckoutMode } from "@/lib/mercadopago/checkout-mode";
import {
  defaultServiceId,
  formatPriceInBRL,
  getServiceById,
} from "@/lib/mercadopago/services";

export const metadata: Metadata = {
  title: "Checkout | Susanoo",
  description: "Finalize seu projeto com segurança.",
};

export default function CheckoutPage() {
  const service = getServiceById(defaultServiceId);
  const checkoutMode = getMercadoPagoCheckoutMode(service.priceInCents);

  return (
    <CheckoutExperience
      service={{
        id: service.id,
        name: service.name,
        description: service.description,
        deliveryLabel: service.deliveryLabel,
        formattedPrice: formatPriceInBRL(checkoutMode.amountInCents),
        isSandbox: checkoutMode.isSandbox,
        sessionScope: checkoutMode.sessionScope,
      }}
    />
  );
}
