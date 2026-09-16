import type { Metadata } from "next";

import { InternalProductionTestCheckout } from "./internal-checkout";

export const metadata: Metadata = {
  title: "Teste interno de pagamento | Susanoo",
  robots: { index: false, follow: false },
};

export default function InternalProductionTestPage() {
  return <InternalProductionTestCheckout />;
}
