const allowedRequestKeys = new Set([
  "serviceId",
  "paymentMethod",
  "checkoutSessionId",
]);

const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export type SafeOrderRequest = {
  serviceId: string;
  paymentMethod: "pix" | "card";
  checkoutSessionId: string;
};

export function parseOrderRequest(rawBody: string): SafeOrderRequest | null {
  let value: unknown;

  try {
    value = JSON.parse(rawBody) as unknown;
  } catch {
    return null;
  }

  if (!isRecord(value)) return null;
  if (Object.keys(value).some((key) => !allowedRequestKeys.has(key))) return null;
  if (typeof value.serviceId !== "string") return null;
  if (value.paymentMethod !== "pix" && value.paymentMethod !== "card") {
    return null;
  }
  if (
    typeof value.checkoutSessionId !== "string" ||
    !UUID_PATTERN.test(value.checkoutSessionId)
  ) {
    return null;
  }

  return {
    serviceId: value.serviceId,
    paymentMethod: value.paymentMethod,
    checkoutSessionId: value.checkoutSessionId,
  };
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}
