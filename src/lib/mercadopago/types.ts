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
