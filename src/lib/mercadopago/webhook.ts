export type OrderWebhookNotification = { type: "order"; dataId: string };
export type MercadoPagoWebhookNotification =
  | OrderWebhookNotification
  | { type: "payment"; dataId: string };

const MAX_WEBHOOK_DATA_ID_LENGTH = 128;
const CONTROL_CHARACTER_PATTERN = /[\u0000-\u001f\u007f-\u009f]/;
const WEBHOOK_TIMESTAMP_PATTERN = /^(?:\d{10}|\d{13})$/;
export const WEBHOOK_TOLERANCE_MS = 5 * 60 * 1_000;

export function parseOrderWebhookNotification(rawBody: string, queryDataId: string | null): OrderWebhookNotification | null {
  if (!isWebhookDataId(queryDataId)) return null;
  let value: unknown;
  try {
    value = JSON.parse(rawBody) as unknown;
  } catch {
    return null;
  }
  if (!isRecord(value) || value.type !== "order" || !isRecord(value.data) || !isWebhookDataId(value.data.id)) return null;
  return { type: "order", dataId: queryDataId };
}

export function parseMercadoPagoWebhookNotification(
  rawBody: string,
  queryDataId: string | null,
  queryType: string | null,
): MercadoPagoWebhookNotification | null {
  if (!isWebhookDataId(queryDataId)) return null;
  if (queryType !== "order" && queryType !== "payment") return null;
  let value: unknown;
  try {
    value = JSON.parse(rawBody) as unknown;
  } catch {
    return null;
  }
  if (!isRecord(value) || value.type !== queryType || !isRecord(value.data)) return null;
  const bodyDataId = normalizeBodyDataId(value.data.id);
  if (!bodyDataId || bodyDataId !== queryDataId) return null;
  return { type: queryType, dataId: queryDataId };
}

export function isWebhookDataId(value: unknown): value is string {
  return typeof value === "string" && value.trim().length > 0 && value.length <= MAX_WEBHOOK_DATA_ID_LENGTH && !CONTROL_CHARACTER_PATTERN.test(value);
}

export function isProviderOrderId(value: string): boolean {
  return /^ORD[A-Za-z0-9]{8,61}$/.test(value);
}

export function isProviderPaymentId(value: string): boolean {
  return /^\d{1,32}$/.test(value);
}

export function isWebhookTimestampValid(xSignature: string | null, nowMs = Date.now()): boolean {
  const timestamp = extractSignatureTimestamp(xSignature);
  if (!timestamp || !WEBHOOK_TIMESTAMP_PATTERN.test(timestamp)) return false;
  const timestampValue = Number(timestamp);
  if (!Number.isFinite(timestampValue) || !Number.isSafeInteger(timestampValue)) return false;
  const timestampMs = timestamp.length === 10 ? timestampValue * 1_000 : timestampValue;
  const differenceMs = Math.abs(nowMs - timestampMs);
  return Number.isFinite(differenceMs) && differenceMs <= WEBHOOK_TOLERANCE_MS;
}

function extractSignatureTimestamp(xSignature: string | null): string | null {
  if (!xSignature) return null;
  let timestamp: string | null = null;
  for (const part of xSignature.split(",")) {
    const separatorIndex = part.indexOf("=");
    if (separatorIndex === -1) continue;
    const key = part.slice(0, separatorIndex).trim().toLowerCase();
    const value = part.slice(separatorIndex + 1).trim();
    if (key === "ts" && value) timestamp = value;
  }
  return timestamp;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function normalizeBodyDataId(value: unknown): string | null {
  if (typeof value === "string") return isWebhookDataId(value) ? value : null;
  if (typeof value === "number" && Number.isSafeInteger(value) && value >= 0) return String(value);
  return null;
}
