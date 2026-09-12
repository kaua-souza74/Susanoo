import type { Metadata } from "next";

import { CheckoutExperience } from "./checkout-experience";
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

  return (
    <CheckoutExperience
      service={{
        id: service.id,
        name: service.name,
        description: service.description,
        deliveryLabel: service.deliveryLabel,
        formattedPrice: formatPriceInBRL(service.priceInCents),
      }}
    />
  );
}
