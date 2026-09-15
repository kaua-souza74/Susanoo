import "server-only";

export type WebhookTimestampContext = {
  rawSignatureLength: number;
  rawTsDigits: number;
  parsedTsDigits: number;
  rawAndParsedTsMatch: boolean;
  tsIsAllDigits: boolean;
  parserPerformedNumericConversion: false;
};

export function getWebhookTimestampContext(
  xSignature: string | null,
): WebhookTimestampContext {
  const rawTimestamp = extractRawTimestamp(xSignature);
  const parsedTimestamp = extractManifestTimestamp(xSignature);

  return {
    rawSignatureLength: xSignature?.length ?? 0,
    rawTsDigits: /^\d+$/.test(rawTimestamp) ? rawTimestamp.length : 0,
    parsedTsDigits: /^\d+$/.test(parsedTimestamp) ? parsedTimestamp.length : 0,
    rawAndParsedTsMatch: rawTimestamp === parsedTimestamp,
    tsIsAllDigits: rawTimestamp.length > 0 && /^\d+$/.test(rawTimestamp),
    parserPerformedNumericConversion: false,
  };
}

export function extractManifestTimestamp(xSignature: string | null): string {
  let timestamp = "";

  for (const part of xSignature?.split(",") ?? []) {
    const separatorIndex = part.indexOf("=");
    if (separatorIndex === -1) continue;

    const key = part.slice(0, separatorIndex).trim().toLowerCase();
    const value = part.slice(separatorIndex + 1).trim();
    if (key === "ts") timestamp = value;
  }

  return timestamp;
}

function extractRawTimestamp(xSignature: string | null): string {
  for (const part of xSignature?.split(",") ?? []) {
    if (part.startsWith("ts=")) return part.slice(3);
  }

  return "";
}
