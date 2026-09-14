import { createHash } from "node:crypto";

export type SecretFingerprint = {
  secretLength: number;
  sha256Prefix: string;
};

export function getSecretFingerprint(secret: string): SecretFingerprint {
  return {
    secretLength: secret.length,
    sha256Prefix: createHash("sha256").update(secret).digest("hex").slice(0, 8),
  };
}
