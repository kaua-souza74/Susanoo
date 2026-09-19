import type { PaymentStatus } from "./status";
import { normalizeMercadoPagoStatus } from "./status";

export type MercadoPagoOrderSnapshot = {
  providerOrderId: string;
  externalReference: string;
  providerStatus: string | null;
  providerStatusDetail: string | null;
  status: PaymentStatus;
  qrCode: string | null;
  qrCodeBase64: string | null;
  ticketUrl: string | null;
};

export function extractMercadoPagoOrderSnapshot(
  value: unknown,
): MercadoPagoOrderSnapshot | null {
  if (!isRecord(value)) return null;

  const providerOrderId = readString(value.id);
  const externalReference = readString(value.external_reference);
  if (!providerOrderId || !externalReference) return null;

  const payment = readFirstPayment(value.transactions);
  const providerStatus = readString(value.status) ?? readString(payment?.status);
  const providerStatusDetail = selectProviderStatusDetail(
    readString(value.status),
    readString(value.status_detail),
    readString(payment?.status),
    readString(payment?.status_detail),
  );
  const paymentMethod = isRecord(payment?.payment_method)
    ? payment.payment_method
    : null;

  return {
    providerOrderId,
    externalReference,
    providerStatus,
    providerStatusDetail,
    status: normalizeMercadoPagoStatus(providerStatus, providerStatusDetail),
    qrCode: readBoundedString(paymentMethod?.qr_code, 8_192),
    qrCodeBase64: readBase64Png(paymentMethod?.qr_code_base64),
    ticketUrl: readHttpsUrl(paymentMethod?.ticket_url),
  };
}

function selectProviderStatusDetail(
  orderStatus: string | null,
  orderStatusDetail: string | null,
  paymentStatus: string | null,
  paymentStatusDetail: string | null,
): string | null {
  if (!paymentStatusDetail) return orderStatusDetail;
  if (!orderStatusDetail) return paymentStatusDetail;

  const normalizedOrderDetail = orderStatusDetail.toLowerCase();
  const normalizedPaymentDetail = paymentStatusDetail.toLowerCase();
  if (normalizedOrderDetail === normalizedPaymentDetail) {
    return orderStatusDetail;
  }

  if (
    isGenericStatusDetail(orderStatus, normalizedOrderDetail) &&
    !isGenericStatusDetail(paymentStatus, normalizedPaymentDetail)
  ) {
    return paymentStatusDetail;
  }

  return orderStatusDetail;
}

function isGenericStatusDetail(
  providerStatus: string | null,
  normalizedStatusDetail: string,
): boolean {
  const normalizedStatus = providerStatus?.toLowerCase();
  if (!normalizedStatus) return false;
  if (normalizedStatus === normalizedStatusDetail) return true;

  return (
    (normalizedStatus === "canceled" && normalizedStatusDetail === "cancelled") ||
    (normalizedStatus === "cancelled" && normalizedStatusDetail === "canceled")
  );
}

function readFirstPayment(transactions: unknown): Record<string, unknown> | null {
  if (!isRecord(transactions) || !Array.isArray(transactions.payments)) {
    return null;
  }

  const payment = transactions.payments[0];
  return isRecord(payment) ? payment : null;
}

function readString(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

function readHttpsUrl(value: unknown): string | null {
  const candidate = readBoundedString(value, 2_048);
  if (!candidate) return null;

  try {
    const url = new URL(candidate);
    const hostname = url.hostname.toLowerCase();
    const isMercadoPagoHost =
      hostname === "mercadopago.com" ||
      hostname.endsWith(".mercadopago.com") ||
      hostname === "mercadopago.com.br" ||
      hostname.endsWith(".mercadopago.com.br");

    return url.protocol === "https:" && isMercadoPagoHost ? candidate : null;
  } catch {
    return null;
  }
}

function readBoundedString(value: unknown, maxLength: number): string | null {
  const candidate = readString(value);
  return candidate && candidate.length <= maxLength ? candidate : null;
}

function readBase64Png(value: unknown): string | null {
  const candidate = readBoundedString(value, 1_500_000)?.replace(/\s/g, "");
  if (!candidate || !/^[A-Za-z0-9+/]+={0,2}$/.test(candidate)) return null;

  return candidate;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}
