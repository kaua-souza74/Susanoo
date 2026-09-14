import { createHash } from "node:crypto";

const secret = process.env.MERCADO_PAGO_ORDERS_WEBHOOK_SECRET;

if (!secret) {
  console.error("MERCADO_PAGO_ORDERS_WEBHOOK_SECRET não está definida.");
  process.exitCode = 1;
} else {
  console.log(JSON.stringify({
    secret_length: secret.length,
    secret_sha256_prefix: createHash("sha256")
      .update(secret)
      .digest("hex")
      .slice(0, 8),
  }));
}
