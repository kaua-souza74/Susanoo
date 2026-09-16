import "server-only";
import { createHash, createHmac, timingSafeEqual } from "node:crypto";
import { isProviderOrderId } from "./webhook";
import { findPaymentOrderByProviderOrderId } from "@/lib/mercadopago/payment-orders";
import { getMercadoPagoOrderClient } from "@/lib/mercadopago/server";

const ROUTE = "/api/mercadopago/webhook";
const MAX_BYTES = 16_384;

function log(fields: Record<string, unknown>) {
  console.info(JSON.stringify({ route: ROUTE, ...fields }));
}
function hashPrefix(value: string): string {
  return createHash("sha256").update(value).digest("hex").slice(0, 8);
}
function parts(header: string | null) {
  let ts = "";
  let v1 = "";
  for (const part of header?.split(",") ?? []) {
    const separator = part.indexOf("=");
    if (separator < 0) continue;
    const key = part.slice(0, separator).trim().toLowerCase();
    const value = part.slice(separator + 1).trim();
    if (key === "ts") ts = value;
    if (key === "v1") v1 = value;
  }
  return { ts, v1 };
}
function matches(secret: string, manifest: string, v1: string): boolean {
  if (!/^[a-fA-F0-9]{64}$/.test(v1)) return false;
  return timingSafeEqual(createHmac("sha256", secret).update(manifest).digest(), Buffer.from(v1, "hex"));
}

// Temporary observability only. Return values never authorize a webhook.
export function logProductionSignatureDiagnostics(input: {
  secret: string; xSignature: string | null; xRequestId: string | null;
  dataId: string | null; sdkValid: boolean;
}) {
  if (process.env.VERCEL_ENV !== "production") return;
  const { secret, xSignature, xRequestId, dataId, sdkValid } = input;
  const { ts, v1 } = parts(xSignature);
  const rawTs = /(?:^|,)\s*ts=([^,]*)/.exec(xSignature ?? "")?.[1] ?? "";
  const digits = (text: string) => /^\d+$/.test(text) ? text.length : 0;
  log({ webhook_stage: "secret_fingerprint", secret_length: secret.length, secret_sha256_prefix: hashPrefix(secret) });
  log({
    webhook_stage: "header_context", request_id_present: !!xRequestId,
    request_id_length: xRequestId?.length ?? 0,
    request_id_sha256_prefix: xRequestId ? hashPrefix(xRequestId) : null,
    request_id_has_outer_whitespace: !!xRequestId && xRequestId !== xRequestId.trim(),
    request_id_single_logical_value: !!xRequestId && !xRequestId.includes(","),
    signature_present: !!xSignature, signature_parts: xSignature?.split(",").length ?? 0,
    ts_digits: digits(ts), v1_length: v1.length,
  });
  log({
    webhook_stage: "timestamp_context", raw_ts_digits: digits(rawTs), parsed_ts_digits: digits(ts),
    raw_and_parsed_ts_match: rawTs === ts, ts_is_all_digits: /^\d+$/.test(ts),
    parser_performed_numeric_conversion: false,
  });
  const eligible = !!dataId && !!xRequestId && /^\d+$/.test(ts);
  log({
    webhook_stage: "signature_matrix",
    original_case_valid: eligible && matches(secret, `id:${dataId};request-id:${xRequestId};ts:${ts};`, v1),
    lowercase_valid: eligible && matches(secret, `id:${dataId.toLowerCase()};request-id:${xRequestId};ts:${ts};`, v1),
    sdk_valid: sdkValid,
  });
}

function record(value: unknown): Record<string, unknown> | null {
  return typeof value === "object" && value !== null && !Array.isArray(value) ? value as Record<string, unknown> : null;
}
function applicationId(value: unknown): string | null {
  if (typeof value !== "string" && typeof value !== "number") return null;
  const text = String(value);
  return /^\d{1,24}$/.test(text) ? text : null;
}
async function readDiagnosticBody(request: Request): Promise<Record<string, unknown> | null> {
  const reader = request.clone().body?.getReader();
  if (!reader) return null;
  const chunks: Uint8Array[] = [];
  let bytes = 0;
  try {
    while (true) {
      const { value, done } = await reader.read();
      if (done) break;
      bytes += value.byteLength;
      if (bytes > MAX_BYTES) {
        void reader.cancel().catch(() => {});
        return null;
      }
      chunks.push(value);
    }
    return record(JSON.parse(Buffer.concat(chunks).toString("utf8")));
  } catch { return null; }
}

export async function logProductionApplicationContext(request: Request, dataId: string | null) {
  if (process.env.VERCEL_ENV !== "production") return;
  let webhookApplicationId: string | null = null;
  let orderApplicationId: string | null = null;
  let liveMode: boolean | null = null;
  try {
    const body = await readDiagnosticBody(request);
    webhookApplicationId = applicationId(body?.application_id);
    liveMode = typeof body?.live_mode === "boolean" ? body.live_mode : null;
    // Only a known, real Order may trigger the diagnostic GET. No writes.
    if (dataId && isProviderOrderId(dataId) && !dataId.startsWith("ORDTST")
        && await findPaymentOrderByProviderOrderId(dataId)) {
      const order = record(await getMercadoPagoOrderClient().get({ id: dataId }));
      orderApplicationId = applicationId(record(order?.integration_data)?.application_id);
    }
  } catch { /* Never log raw SDK errors or let diagnostics change the response. */ }
  log({
    webhook_stage: "application_context", webhook_application_id: webhookApplicationId,
    order_application_id: orderApplicationId,
    application_ids_match: !!webhookApplicationId && !!orderApplicationId && webhookApplicationId === orderApplicationId,
    live_mode: liveMode,
  });
}
