export type OrderWebhookNotification = {
  type: "order";
  dataId: string;
};

const MAX_WEBHOOK_DATA_ID_LENGTH = 128;
const CONTROL_CHARACTER_PATTERN = /[\u0000-\u001f\u007f-\u009f]/;

export function parseOrderWebhookNotification(
  rawBody: string,
  queryDataId: string | null,
): OrderWebhookNotification | null {
  if (!isWebhookDataId(queryDataId)) return null;

  let value: unknown;
  try {
    value = JSON.parse(rawBody) as unknown;
  } catch {
    return null;
  }

  if (!isRecord(value) || value.type !== "order" || !isRecord(value.data)) {
    return null;
  }

  if (!isWebhookDataId(value.data.id)) return null;

  return { type: "order", dataId: queryDataId };
}

export function isWebhookDataId(value: unknown): value is string {
  return (
    typeof value === "string" &&
    value.trim().length > 0 &&
    value.length <= MAX_WEBHOOK_DATA_ID_LENGTH &&
    !CONTROL_CHARACTER_PATTERN.test(value)
  );
}

export function isProviderOrderId(value: string): boolean {
  return /^ORD[A-Za-z0-9]{8,61}$/.test(value);
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}
