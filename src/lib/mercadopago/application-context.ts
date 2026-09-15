import "server-only";

export type WebhookApplicationContext = {
  applicationId: string | null;
  liveMode: boolean | null;
};

export function extractWebhookApplicationContext(
  rawBody: string,
): WebhookApplicationContext | null {
  try {
    const body: unknown = JSON.parse(rawBody);
    if (!isRecord(body)) return null;

    return {
      applicationId: readApplicationId(body.application_id),
      liveMode: typeof body.live_mode === "boolean" ? body.live_mode : null,
    };
  } catch {
    return null;
  }
}

export function extractOrderApplicationId(value: unknown): string | null {
  if (!isRecord(value) || !isRecord(value.integration_data)) return null;
  return readApplicationId(value.integration_data.application_id);
}

function readApplicationId(value: unknown): string | null {
  if (typeof value === "number" && Number.isSafeInteger(value) && value >= 0) {
    return String(value);
  }

  if (typeof value !== "string") return null;
  const candidate = value.trim();
  return /^\d{1,32}$/.test(candidate) ? candidate : null;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}
