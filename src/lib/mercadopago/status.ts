export const paymentStatuses = [
  "pending",
  "approved",
  "rejected",
  "cancelled",
  "refunded",
] as const;

export type PaymentStatus = (typeof paymentStatuses)[number];

export function normalizeMercadoPagoStatus(
  providerStatus: string | null | undefined,
  providerStatusDetail: string | null | undefined,
): PaymentStatus {
  const status = providerStatus?.trim().toLowerCase();
  const detail = providerStatusDetail?.trim().toLowerCase();

  if (status === "refunded" || detail === "refunded") return "refunded";
  if (status === "canceled" || status === "cancelled" || status === "expired") {
    return "cancelled";
  }
  if (status === "failed" || status === "rejected") return "rejected";
  if (status === "approved") return "approved";
  if (status === "processed" && detail === "accredited") return "approved";
  if (status === "processed" && detail === "partially_refunded") {
    return "approved";
  }

  return "pending";
}

export function canApplyPaymentStatus(
  currentStatus: PaymentStatus,
  nextStatus: PaymentStatus,
): boolean {
  if (currentStatus === nextStatus) return true;
  if (currentStatus === "pending") return true;
  if (currentStatus === "approved") return nextStatus === "refunded";

  return false;
}

export function isTerminalPaymentStatus(status: PaymentStatus): boolean {
  return status !== "pending";
}
