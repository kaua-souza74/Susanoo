import "server-only";

import { createHmac, timingSafeEqual } from "node:crypto";

type WebhookHmacDiagnosticInput = {
  dataId: string | null;
  requestId: string;
  xSignature: string | null;
  secret: string;
};

export type WebhookHmacDiagnostic = {
  manualValid: boolean;
  manifestLength: number;
  dataIdLength: number;
  requestIdLength: number;
  tsDigits: number;
};

export type WebhookManifestDiagnostic = {
  noSpaceOriginalValid: boolean;
  spaceOriginalValid: boolean;
  noSpaceLowercaseValid: boolean;
  spaceLowercaseValid: boolean;
};

export function calculateWebhookHmacDiagnostic({
  dataId,
  requestId,
  xSignature,
  secret,
}: WebhookHmacDiagnosticInput): WebhookHmacDiagnostic {
  const { timestamp, v1 } = parseSignatureParts(xSignature);
  const tsDigits = timestamp && /^\d+$/.test(timestamp) ? timestamp.length : 0;
  const manifest =
    dataId !== null && timestamp !== null
      ? `id:${dataId};request-id:${requestId};ts:${timestamp};`
      : null;

  const receivedHash = parseReceivedHash(v1);
  const manualValid =
    manifest !== null &&
    receivedHash !== null &&
    isManifestValid(manifest, secret, receivedHash);

  return {
    manualValid,
    manifestLength: manifest?.length ?? 0,
    dataIdLength: dataId?.length ?? 0,
    requestIdLength: requestId.length,
    tsDigits,
  };
}

export function calculateWebhookManifestDiagnostic({
  dataId,
  requestId,
  xSignature,
  secret,
}: WebhookHmacDiagnosticInput): WebhookManifestDiagnostic {
  const { timestamp, v1 } = parseSignatureParts(xSignature);
  const receivedHash = parseReceivedHash(v1);
  const invalidResult: WebhookManifestDiagnostic = {
    noSpaceOriginalValid: false,
    spaceOriginalValid: false,
    noSpaceLowercaseValid: false,
    spaceLowercaseValid: false,
  };

  if (dataId === null || timestamp === null || receivedHash === null) {
    return invalidResult;
  }

  const lowercaseDataId = dataId.toLowerCase();

  return {
    noSpaceOriginalValid: isManifestValid(
      `id:${dataId};request-id:${requestId};ts:${timestamp};`,
      secret,
      receivedHash,
    ),
    spaceOriginalValid: isManifestValid(
      `id: ${dataId};request-id: ${requestId};ts: ${timestamp};`,
      secret,
      receivedHash,
    ),
    noSpaceLowercaseValid: isManifestValid(
      `id:${lowercaseDataId};request-id:${requestId};ts:${timestamp};`,
      secret,
      receivedHash,
    ),
    spaceLowercaseValid: isManifestValid(
      `id: ${lowercaseDataId};request-id: ${requestId};ts: ${timestamp};`,
      secret,
      receivedHash,
    ),
  };
}

function parseReceivedHash(v1: string | null) {
  return v1 && /^[a-f\d]{64}$/i.test(v1) ? Buffer.from(v1, "hex") : null;
}

function isManifestValid(
  manifest: string,
  secret: string,
  receivedHash: Buffer,
) {
  const calculatedHash = createHmac("sha256", secret).update(manifest).digest();

  return (
    calculatedHash.length === receivedHash.length &&
    timingSafeEqual(calculatedHash, receivedHash)
  );
}

function parseSignatureParts(xSignature: string | null) {
  let timestamp: string | null = null;
  let v1: string | null = null;

  for (const part of xSignature?.split(",") ?? []) {
    const separatorIndex = part.indexOf("=");
    if (separatorIndex === -1) continue;

    const key = part.slice(0, separatorIndex).trim().toLowerCase();
    const value = part.slice(separatorIndex + 1).trim();
    if (key === "ts" && value) timestamp = value;
    if (key === "v1" && value) v1 = value;
  }

  return { timestamp, v1 };
}
