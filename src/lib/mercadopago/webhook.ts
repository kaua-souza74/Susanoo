export type OrderWebhookNotification = {
  type: "order";
  dataId: string;
};

export function parseOrderWebhookNotification(
  rawBody: string,
  queryDataId: string | null,
): OrderWebhookNotification | null {
  if (!queryDataId || !isProviderOrderId(queryDataId)) return null;

  let value: unknown;
  try {
    value = JSON.parse(rawBody) as unknown;
  } catch {
    return null;
  }

  if (!isRecord(value) || value.type !== "order" || !isRecord(value.data)) {
    return null;
  }

  if (value.data.id !== queryDataId) return null;

  return { type: "order", dataId: queryDataId };
}

export function isProviderOrderId(value: string): boolean {
  return /^ORD[A-Za-z0-9]{8,61}$/.test(value);
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}
