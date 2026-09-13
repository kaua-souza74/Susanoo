const allowedRequestKeys = new Set([
  "serviceId",
  "checkoutSessionId",
  "selectedPaymentMethod",
  "formData",
]);
const allowedFormDataKeys = new Set([
  "token",
  "issuer_id",
  "payment_method_id",
  "transaction_amount",
  "installments",
  "payer",
]);
const allowedPayerKeys = new Set(["identification"]);
const allowedIdentificationKeys = new Set(["type", "number"]);

const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const PAYMENT_METHOD_PATTERN = /^[a-z0-9_-]{2,64}$/i;
const CARD_TOKEN_PATTERN = /^[a-z0-9._-]{10,512}$/i;
const IDENTIFICATION_TYPE_PATTERN = /^[a-z0-9_-]{2,16}$/i;
const IDENTIFICATION_NUMBER_PATTERN = /^[a-z0-9.-]{5,32}$/i;

export type BrickPaymentMethod = "pix" | "card";

export type SafeBrickPaymentRequest = {
  serviceId: string;
  checkoutSessionId: string;
  paymentMethod: BrickPaymentMethod;
  paymentMethodId: string;
  paymentTypeId: "bank_transfer" | "credit_card";
  token: string | null;
  issuerId: number | null;
  installments: number;
  identification: { type: string; number: string } | null;
};

export function parseBrickPaymentRequest(
  rawBody: string,
): SafeBrickPaymentRequest | null {
  let value: unknown;

  try {
    value = JSON.parse(rawBody) as unknown;
  } catch {
    return null;
  }

  if (!isRecord(value) || hasUnknownKeys(value, allowedRequestKeys)) return null;
  if (typeof value.serviceId !== "string") return null;
  if (
    typeof value.checkoutSessionId !== "string" ||
    !UUID_PATTERN.test(value.checkoutSessionId)
  ) {
    return null;
  }
  if (!isRecord(value.formData) || hasUnknownKeys(value.formData, allowedFormDataKeys)) {
    return null;
  }

  const paymentMethodId = value.formData.payment_method_id;
  if (
    typeof paymentMethodId !== "string" ||
    !PAYMENT_METHOD_PATTERN.test(paymentMethodId)
  ) {
    return null;
  }

  const paymentMethod = readPaymentMethod(
    value.selectedPaymentMethod,
    paymentMethodId,
  );
  if (!paymentMethod) return null;

  const installments = readInstallments(value.formData.installments, paymentMethod);
  if (installments === null) return null;

  const token = value.formData.token;
  if (
    paymentMethod === "card" &&
    (typeof token !== "string" || !CARD_TOKEN_PATTERN.test(token))
  ) {
    return null;
  }
  if (paymentMethod === "pix" && token !== undefined && token !== null) {
    return null;
  }

  const issuerId = readIssuerId(value.formData.issuer_id, paymentMethod);
  if (issuerId === undefined) return null;

  const identification = readIdentification(value.formData.payer);
  if (identification === undefined) return null;

  return {
    serviceId: value.serviceId,
    checkoutSessionId: value.checkoutSessionId,
    paymentMethod,
    paymentMethodId,
    paymentTypeId:
      paymentMethod === "pix" ? "bank_transfer" : "credit_card",
    token: paymentMethod === "card" ? (token as string) : null,
    issuerId,
    installments,
    identification,
  };
}

function readPaymentMethod(
  selectedPaymentMethod: unknown,
  paymentMethodId: string,
): BrickPaymentMethod | null {
  if (selectedPaymentMethod === "bank_transfer" && paymentMethodId === "pix") {
    return "pix";
  }
  if (selectedPaymentMethod === "creditCard" && paymentMethodId !== "pix") {
    return "card";
  }
  return null;
}

function readInstallments(
  value: unknown,
  paymentMethod: BrickPaymentMethod,
): number | null {
  if (paymentMethod === "pix") {
    return value === undefined || value === null || value === 1 ? 1 : null;
  }
  return Number.isInteger(value) && Number(value) >= 1 && Number(value) <= 12
    ? Number(value)
    : null;
}

function readIssuerId(
  value: unknown,
  paymentMethod: BrickPaymentMethod,
): number | null | undefined {
  if (paymentMethod === "pix") {
    return value === undefined || value === null ? null : undefined;
  }
  if (value === undefined || value === null || value === "") return null;

  const parsed = typeof value === "string" && /^\d{1,12}$/.test(value)
    ? Number(value)
    : value;
  return Number.isSafeInteger(parsed) && Number(parsed) > 0
    ? Number(parsed)
    : undefined;
}

function readIdentification(
  payer: unknown,
): SafeBrickPaymentRequest["identification"] | undefined {
  if (payer === undefined || payer === null) return null;
  if (!isRecord(payer) || hasUnknownKeys(payer, allowedPayerKeys)) return undefined;

  const identification = payer.identification;
  if (identification === undefined || identification === null) return null;
  if (
    !isRecord(identification) ||
    hasUnknownKeys(identification, allowedIdentificationKeys) ||
    typeof identification.type !== "string" ||
    typeof identification.number !== "string" ||
    !IDENTIFICATION_TYPE_PATTERN.test(identification.type) ||
    !IDENTIFICATION_NUMBER_PATTERN.test(identification.number)
  ) {
    return undefined;
  }

  return {
    type: identification.type,
    number: identification.number,
  };
}

function hasUnknownKeys(
  value: Record<string, unknown>,
  allowedKeys: Set<string>,
) {
  return Object.keys(value).some((key) => !allowedKeys.has(key));
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}
