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

  let manualValid = false;
  if (manifest && v1 && /^[a-f\d]{64}$/i.test(v1)) {
    const calculatedHash = createHmac("sha256", secret)
      .update(manifest)
      .digest();
    const receivedHash = Buffer.from(v1, "hex");

    manualValid =
      calculatedHash.length === receivedHash.length &&
      timingSafeEqual(calculatedHash, receivedHash);
  }

  return {
    manualValid,
    manifestLength: manifest?.length ?? 0,
    dataIdLength: dataId?.length ?? 0,
    requestIdLength: requestId.length,
    tsDigits,
  };
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
