import type { ServiceId } from "./services";
import type { PaymentStatus } from "./status";

export type InternalCheckoutConfiguration = {
  id: "internal-production-test";
  name: string;
  description: string;
  deliveryLabel: string;
  formattedPrice: string;
  amountInCents: number;
  isSandbox: false;
  sessionScope: string;
};

export type PixOrderResponse = {
  orderId: string;
  serviceId: ServiceId;
  amountInCents: number;
  currency: "BRL";
  status: PaymentStatus;
  statusDetail: string | null;
  qrCode: string | null;
  qrCodeBase64: string | null;
  ticketUrl: string | null;
};

export type BrickPaymentResponse = {
  localOrderId: string;
  providerId: string;
  status: PaymentStatus;
  statusDetail: string | null;
  paymentMethod: "pix" | "card";
  qrCode: string | null;
  qrCodeBase64: string | null;
  ticketUrl: string | null;
};

export type CardAttemptStatusResponse = {
  localOrderId: string;
  providerId: string | null;
  status: PaymentStatus;
  statusDetail: string | null;
  paymentMethod: "card";
};
