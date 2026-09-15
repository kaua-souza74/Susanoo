import "server-only";

import { createHash } from "node:crypto";

export type WebhookHeaderContext = {
  requestIdPresent: boolean;
  requestIdLength: number;
  requestIdSha256Prefix: string | null;
  requestIdHasOuterWhitespace: boolean;
  requestIdSingleLogicalOccurrence: boolean;
  signaturePresent: boolean;
  signatureParts: number;
  tsDigits: number;
  v1Length: number;
};

export function getWebhookHeaderContext(headers: Headers): WebhookHeaderContext {
  const requestId = headers.get("x-request-id");
  const xSignature = headers.get("x-signature");
  const requestIdEntries = Array.from(headers.keys()).filter(
    (name) => name.toLowerCase() === "x-request-id",
  ).length;
  const signatureParts = (xSignature?.split(",") ?? []).filter(
    (part) => part.trim().length > 0,
  );
  const signatureValues = parseSignatureParts(signatureParts);

  return {
    requestIdPresent: requestId !== null && requestId.length > 0,
    requestIdLength: requestId?.length ?? 0,
    requestIdSha256Prefix: requestId
      ? createHash("sha256").update(requestId).digest("hex").slice(0, 8)
      : null,
    requestIdHasOuterWhitespace:
      requestId !== null && requestId !== requestId.trim(),
    requestIdSingleLogicalOccurrence:
      requestIdEntries === 1 && Boolean(requestId) && !requestId?.includes(","),
    signaturePresent: xSignature !== null && xSignature.length > 0,
    signatureParts: signatureParts.length,
    tsDigits: /^\d+$/.test(signatureValues.timestamp)
      ? signatureValues.timestamp.length
      : 0,
    v1Length: signatureValues.v1.length,
  };
}

function parseSignatureParts(parts: string[]) {
  let timestamp = "";
  let v1 = "";

  for (const part of parts) {
    const separatorIndex = part.indexOf("=");
    if (separatorIndex === -1) continue;

    const key = part.slice(0, separatorIndex).trim().toLowerCase();
    const value = part.slice(separatorIndex + 1).trim();
    if (key === "ts") timestamp = value;
    if (key === "v1") v1 = value;
  }

  return { timestamp, v1 };
}
