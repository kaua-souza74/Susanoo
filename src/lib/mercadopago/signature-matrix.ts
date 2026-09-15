import "server-only";

import { createHmac, timingSafeEqual } from "node:crypto";

export type WebhookSignatureMatrix = {
  originalCaseValid: boolean;
  lowercaseValid: boolean;
  dataIdLength: number;
  dataIdHasUppercase: boolean;
  requestIdPresent: boolean;
  tsDigits: number;
};

export function getWebhookSignatureMatrix(input: {
  dataId: string | null;
  requestId: string | null;
  xSignature: string | null;
  secret: string;
}): WebhookSignatureMatrix {
  const dataId = input.dataId ?? "";
  const requestId = input.requestId?.trim() ?? "";
  const { timestamp, receivedHash } = parseSignatureHeader(input.xSignature);
  const canCompare = Boolean(dataId && requestId && timestamp && receivedHash);

  return {
    originalCaseValid:
      canCompare &&
      manifestMatches(dataId, requestId, timestamp, input.secret, receivedHash),
    lowercaseValid:
      canCompare &&
      manifestMatches(
        dataId.toLowerCase(),
        requestId,
        timestamp,
        input.secret,
        receivedHash,
      ),
    dataIdLength: dataId.length,
    dataIdHasUppercase: /[A-Z]/.test(dataId),
    requestIdPresent: requestId.length > 0,
    tsDigits: /^\d+$/.test(timestamp) ? timestamp.length : 0,
  };
}

function manifestMatches(
  dataId: string,
  requestId: string,
  timestamp: string,
  secret: string,
  receivedHash: string,
) {
  if (!/^[a-f\d]{64}$/i.test(receivedHash)) return false;

  const manifest = `id:${dataId};request-id:${requestId};ts:${timestamp};`;
  const calculatedHash = createHmac("sha256", secret).update(manifest).digest();
  const receivedHashBytes = Buffer.from(receivedHash, "hex");

  return (
    calculatedHash.length === receivedHashBytes.length &&
    timingSafeEqual(calculatedHash, receivedHashBytes)
  );
}

function parseSignatureHeader(xSignature: string | null) {
  let timestamp = "";
  let receivedHash = "";

  for (const part of xSignature?.split(",") ?? []) {
    const separatorIndex = part.indexOf("=");
    if (separatorIndex === -1) continue;

    const key = part.slice(0, separatorIndex).trim().toLowerCase();
    const value = part.slice(separatorIndex + 1).trim();
    if (key === "ts") timestamp = value;
    if (key === "v1") receivedHash = value;
  }

  return { timestamp, receivedHash };
}
