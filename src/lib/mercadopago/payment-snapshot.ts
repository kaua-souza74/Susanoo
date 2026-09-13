import type { Payment } from "mercadopago";

import type { MercadoPagoOrderSnapshot } from "./order-snapshot";
import { normalizeMercadoPagoStatus } from "./status";

export function extractMercadoPagoPaymentSnapshot(
  payment: Awaited<ReturnType<Payment["get"]>>,
): MercadoPagoOrderSnapshot | null {
  if (
    (typeof payment.id !== "number" && typeof payment.id !== "string") ||
    typeof payment.external_reference !== "string"
  ) {
    return null;
  }

  const transactionData = payment.point_of_interaction?.transaction_data;
  const providerStatus = stringOrNull(payment.status);
  const providerStatusDetail = stringOrNull(payment.status_detail);

  return {
    providerOrderId: String(payment.id),
    externalReference: payment.external_reference,
    status: normalizeMercadoPagoStatus(
      providerStatus,
      providerStatusDetail,
    ),
    providerStatus,
    providerStatusDetail,
    qrCode: stringOrNull(transactionData?.qr_code),
    qrCodeBase64: stringOrNull(transactionData?.qr_code_base64),
    ticketUrl: stringOrNull(transactionData?.ticket_url),
  };
}

function stringOrNull(value: unknown): string | null {
  return typeof value === "string" ? value : null;
}
