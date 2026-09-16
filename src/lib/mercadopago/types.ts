import type { ServiceId } from "./services";
import type { PaymentStatus } from "./status";

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
