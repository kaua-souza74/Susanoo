import "server-only";

import { extractOrderApplicationId } from "./application-context";
import {
  extractMercadoPagoOrderSnapshot,
  type MercadoPagoOrderSnapshot,
} from "./order-snapshot";
import type { PaymentOrder } from "./payment-orders";
import { getServiceById } from "./services";

export const DEFAULT_ORDERS_APPLICATION_ID = "8362280076817377";

export type SandboxProviderVerification = {
  snapshot: MercadoPagoOrderSnapshot | null;
  providerLookupValid: boolean;
  applicationMatch: boolean;
  externalReferenceMatch: boolean;
  amountMatch: boolean;
  environmentMatch: boolean;
  valid: boolean;
};

export function verifySandboxProviderOrder(input: {
  providerOrder: unknown;
  requestedOrderId: string;
  paymentOrder: PaymentOrder | null;
  expectedApplicationId: string;
}): SandboxProviderVerification {
  const snapshot = extractMercadoPagoOrderSnapshot(input.providerOrder);
  const providerRecord = isRecord(input.providerOrder)
    ? input.providerOrder
    : null;
  const paymentOrder = input.paymentOrder;
  const providerIdMatches = snapshot?.providerOrderId === input.requestedOrderId;
  const applicationMatch =
    extractOrderApplicationId(input.providerOrder) === input.expectedApplicationId;
  const environmentMatch = Boolean(
    snapshot && /^ORDTST[A-Za-z0-9]{8,58}$/.test(snapshot.providerOrderId),
  );
  const externalReferenceMatch = Boolean(
    snapshot &&
      paymentOrder &&
      snapshot.externalReference === paymentOrder.externalReference,
  );
  const amountInCents = readAmountInCents(providerRecord?.total_amount);
  const amountMatch = Boolean(
    paymentOrder &&
      amountInCents !== null &&
      amountInCents === paymentOrder.amountInCents,
  );
  const currencyMatch = Boolean(
    paymentOrder && providerRecord?.currency === paymentOrder.currency,
  );
  const serviceMatch = Boolean(
    paymentOrder &&
      providerRecord?.description === getServiceById(paymentOrder.serviceId).name,
  );
  const providerBindingMatch = Boolean(
    paymentOrder &&
      (!paymentOrder.providerOrderId ||
        paymentOrder.providerOrderId === input.requestedOrderId),
  );
  const providerLookupValid = Boolean(
    snapshot &&
      providerIdMatches &&
      currencyMatch &&
      serviceMatch &&
      providerBindingMatch,
  );
  const valid = Boolean(
    providerLookupValid &&
      applicationMatch &&
      environmentMatch &&
      externalReferenceMatch &&
      amountMatch,
  );

  return {
    snapshot,
    providerLookupValid,
    applicationMatch,
    externalReferenceMatch,
    amountMatch,
    environmentMatch,
    valid,
  };
}

function readAmountInCents(value: unknown): number | null {
  if (typeof value !== "string") return null;
  const match = /^(0|[1-9]\d*)\.(\d{2})$/.exec(value);
  if (!match) return null;

  const whole = Number(match[1]);
  const cents = Number(match[2]);
  const result = whole * 100 + cents;
  return Number.isSafeInteger(result) ? result : null;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}
