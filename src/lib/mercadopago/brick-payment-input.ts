const allowedRequestKeys = new Set([
  "serviceId",
  "checkoutSessionId",
  "deviceSessionId",
  "formData",
]);
const allowedFormDataKeys = new Set([
  "token",
  "issuer_id",
  "payment_method_id",
  "payment_type_id",
  "transaction_amount",
  "installments",
  "payer",
]);
const allowedPayerKeys = new Set(["email", "identification"]);
const allowedIdentificationKeys = new Set(["type", "number"]);

const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const PAYMENT_METHOD_PATTERN = /^[a-z0-9_-]{2,64}$/i;
const CARD_TOKEN_PATTERN = /^[a-z0-9._-]{10,512}$/i;
const IDENTIFICATION_TYPE_PATTERN = /^[a-z0-9_-]{2,16}$/i;
const IDENTIFICATION_NUMBER_PATTERN = /^[a-z0-9.-]{5,32}$/i;
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const DEVICE_SESSION_ID_MAX_LENGTH = 256;
const CONTROL_CHARACTER_PATTERN = /[\u0000-\u001f\u007f-\u009f]/;

export type SafeBrickPaymentRequest = {
  serviceId: string;
  checkoutSessionId: string;
  deviceSessionId: string | null;
  paymentMethod: "card";
  paymentMethodId: string;
  paymentTypeId: "credit_card" | "debit_card";
  token: string;
  issuerId: number | null;
  installments: number;
  payerEmail: string | null;
  identification: { type: string; number: string };
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

  if (paymentMethodId === "pix") return null;

  const paymentTypeId = value.formData.payment_type_id;
  if (paymentTypeId !== "credit_card" && paymentTypeId !== "debit_card") {
    return null;
  }

  const installments = readInstallments(value.formData.installments);
  if (installments === null) return null;
  if (paymentTypeId === "debit_card" && installments !== 1) return null;

  const token = value.formData.token;
  if (typeof token !== "string" || !CARD_TOKEN_PATTERN.test(token)) {
    return null;
  }

  const issuerId = readIssuerId(value.formData.issuer_id);
  if (issuerId === undefined) return null;

  const identification = readIdentification(value.formData.payer);
  if (!identification) return null;
  const payerEmail = readPayerEmail(value.formData.payer);
  if (payerEmail === undefined) return null;
  const deviceSessionId = readDeviceSessionId(value.deviceSessionId);
  if (deviceSessionId === undefined) return null;

  return {
    serviceId: value.serviceId,
    checkoutSessionId: value.checkoutSessionId,
    deviceSessionId,
    paymentMethod: "card",
    paymentMethodId,
    paymentTypeId,
    token,
    issuerId,
    installments,
    payerEmail,
    identification,
  };
}

function readDeviceSessionId(value: unknown): string | null | undefined {
  // The SDK may not expose a Device ID in every browser, so absence is allowed.
  if (value === undefined || value === null) return null;
  if (
    typeof value !== "string" ||
    value.length === 0 ||
    value.length > DEVICE_SESSION_ID_MAX_LENGTH ||
    CONTROL_CHARACTER_PATTERN.test(value)
  ) {
    return undefined;
  }

  return value;
}

function readInstallments(value: unknown): number | null {
  return Number.isInteger(value) && Number(value) >= 1 && Number(value) <= 12
    ? Number(value)
    : null;
}

function readIssuerId(value: unknown): number | null | undefined {
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
): SafeBrickPaymentRequest["identification"] | null | undefined {
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

function readPayerEmail(
  payer: unknown,
): SafeBrickPaymentRequest["payerEmail"] | undefined {
  if (payer === undefined || payer === null) return null;
  if (!isRecord(payer) || hasUnknownKeys(payer, allowedPayerKeys)) return undefined;
  if (payer.email === undefined || payer.email === null) return null;
  if (typeof payer.email !== "string") return undefined;

  const email = payer.email.trim().toLowerCase();
  if (email.length < 3 || email.length > 254 || !EMAIL_PATTERN.test(email)) {
    return undefined;
  }

  return email;
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
