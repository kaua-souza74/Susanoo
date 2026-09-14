import assert from "node:assert/strict";
import { createHmac } from "node:crypto";
import { existsSync } from "node:fs";
import { registerHooks } from "node:module";
import path from "node:path";
import test from "node:test";
import { fileURLToPath, pathToFileURL } from "node:url";

const projectRoot = path.resolve(import.meta.dirname, "..");
const orderId = "ORD01JQ4S4KY8HWQ6NA5PXB65B3D3";
globalThis.__webhookRouteMocks = { orderGets: [], providerLookups: [], syncInputs: [], paymentOrder: null };

registerHooks({
  resolve(specifier, context, nextResolve) {
    if (specifier === "server-only") return { shortCircuit: true, url: "mock:server-only" };
    if (specifier === "next/server") return nextResolve("next/server.js", context);
    if (specifier === "@/lib/mercadopago/server") return { shortCircuit: true, url: "mock:webhook-server" };
    if (specifier === "@/lib/mercadopago/payment-orders") return { shortCircuit: true, url: "mock:webhook-orders" };
    if (specifier.startsWith("@/")) return nextResolve(pathToFileURL(path.join(projectRoot, "src", `${specifier.slice(2)}.ts`)).href, context);
    if (specifier.startsWith(".") && context.parentURL?.startsWith("file:")) {
      const candidate = new URL(`${specifier}.ts`, context.parentURL);
      if (existsSync(fileURLToPath(candidate))) return nextResolve(candidate.href, context);
    }
    return nextResolve(specifier, context);
  },
  load(url, context, nextLoad) {
    if (url === "mock:server-only") return { format: "module", shortCircuit: true, source: "export {};" };
    if (url === "mock:webhook-server") return { format: "module", shortCircuit: true, source: `
      export class MercadoPagoConfigurationError extends Error {}
      export function getMercadoPagoOrderClient() { return { async get(input) {
        globalThis.__webhookRouteMocks.orderGets.push(input);
        return { id: input.id, external_reference: "SUS-webhook", status: "processed", status_detail: "accredited", transactions: { payments: [] } };
      } }; }
    ` };
    if (url === "mock:webhook-orders") return { format: "module", shortCircuit: true, source: `
      export class PaymentOrderMismatchError extends Error {}
      export class PaymentOrderPersistenceError extends Error {}
      export async function findPaymentOrderByProviderOrderId(id) { globalThis.__webhookRouteMocks.providerLookups.push(id); return globalThis.__webhookRouteMocks.paymentOrder; }
      export async function findPaymentOrderByExternalReference() { return null; }
      export async function syncPaymentOrderFromProvider(order, snapshot) { globalThis.__webhookRouteMocks.syncInputs.push({ order, snapshot }); return order; }
    ` };
    return nextLoad(url, context);
  },
});

const { POST } = await import("../src/app/api/mercadopago/webhook/route.ts");
const { getSecretFingerprint } = await import("../src/lib/mercadopago/secret-fingerprint.ts");

function signedRequest({ dataId = "123456", secret = "orders-secret", signature = null, bodyStatus = "forged", type = "order" } = {}) {
  const timestamp = String(Date.now());
  const requestId = "request-route-test";
  const digest = createHmac("sha256", secret).update(`id:${dataId.toLowerCase()};request-id:${requestId};ts:${timestamp};`).digest("hex");
  return new Request(`https://example.test/api/mercadopago/webhook?data.id=${encodeURIComponent(dataId)}&type=${type}`, {
    method: "POST",
    headers: { "content-type": "application/json", "x-request-id": requestId, "x-signature": signature ?? `ts=${timestamp},v1=${digest}` },
    body: JSON.stringify({ type, action: `${type}.updated`, status: bodyStatus, data: { id: dataId } }),
  });
}

function reset(paymentMethod = "pix") {
  process.env.MERCADO_PAGO_ORDERS_WEBHOOK_SECRET = "orders-secret";
  delete process.env.VERCEL_ENV;
  globalThis.__webhookRouteMocks.orderGets.length = 0;
  globalThis.__webhookRouteMocks.providerLookups.length = 0;
  globalThis.__webhookRouteMocks.syncInputs.length = 0;
  globalThis.__webhookRouteMocks.paymentOrder = { id: "local", externalReference: "SUS-webhook", providerOrderId: null, paymentMethod, status: "pending" };
}

test("fingerprint é determinístico e nunca contém o secret", () => {
  const secret = "secret-that-must-never-be-logged";
  const first = getSecretFingerprint(secret);
  const second = getSecretFingerprint(secret);

  assert.deepEqual(first, second);
  assert.equal(first.secretLength, secret.length);
  assert.match(first.sha256Prefix, /^[a-f0-9]{8}$/);
  assert.doesNotMatch(JSON.stringify(first), new RegExp(secret));
});

test("Preview registra somente fingerprint seguro do secret", async (t) => {
  reset();
  process.env.VERCEL_ENV = "preview";
  const info = t.mock.method(console, "info", () => {});

  const response = await POST(signedRequest());

  assert.equal(response.status, 200);
  const fingerprintLog = JSON.parse(info.mock.calls[0].arguments[0]);
  assert.deepEqual(fingerprintLog, {
    route: "/api/mercadopago/webhook",
    webhook_stage: "secret_fingerprint",
    secret_length: "orders-secret".length,
    secret_sha256_prefix: getSecretFingerprint("orders-secret").sha256Prefix,
  });
  assert.doesNotMatch(info.mock.calls[0].arguments[0], /orders-secret/);
});

test("ausência do secret continua retornando 503", async () => {
  reset();
  delete process.env.MERCADO_PAGO_ORDERS_WEBHOOK_SECRET;

  const response = await POST(signedRequest());

  assert.equal(response.status, 503);
  assert.deepEqual(await response.json(), { error: "Webhook indisponível." });
});

test("simulador Orders autenticado continua ignored sem consultar provider", async () => {
  reset();
  const response = await POST(signedRequest());
  assert.equal(response.status, 200);
  assert.equal(globalThis.__webhookRouteMocks.orderGets.length, 0);
  assert.deepEqual(await response.json(), { received: true, result: "ignored" });
});

test("Orders usa lowercase apenas no HMAC e preserva ID original no provider", async () => {
  reset();
  const response = await POST(signedRequest({ dataId: orderId }));
  assert.equal(response.status, 200);
  assert.deepEqual(globalThis.__webhookRouteMocks.orderGets, [{ id: orderId }]);
  assert.deepEqual(globalThis.__webhookRouteMocks.providerLookups, [orderId]);
});

test("ordem PIX é reconciliada consultando Orders API", async () => {
  reset("pix");
  await POST(signedRequest({ dataId: orderId }));
  assert.equal(globalThis.__webhookRouteMocks.orderGets.length, 1);
  assert.equal(globalThis.__webhookRouteMocks.syncInputs.length, 1);
  assert.equal(globalThis.__webhookRouteMocks.syncInputs[0].order.paymentMethod, "pix");
});

test("ordem de cartão é reconciliada pelo mesmo fluxo Orders", async () => {
  reset("card");
  await POST(signedRequest({ dataId: orderId }));
  assert.equal(globalThis.__webhookRouteMocks.orderGets.length, 1);
  assert.equal(globalThis.__webhookRouteMocks.syncInputs.length, 1);
  assert.equal(globalThis.__webhookRouteMocks.syncInputs[0].order.paymentMethod, "card");
});

test("assinatura inválida retorna 401", async () => {
  reset();
  const response = await POST(signedRequest({ signature: `ts=${Date.now()},v1=invalid` }));
  assert.equal(response.status, 401);
  assert.equal(globalThis.__webhookRouteMocks.orderGets.length, 0);
});

test("evento payment legado é rejeitado sem consultar provider", async () => {
  reset();
  const response = await POST(signedRequest({ type: "payment", dataId: "987654321" }));
  assert.equal(response.status, 400);
  assert.equal(globalThis.__webhookRouteMocks.orderGets.length, 0);
});

test("status forjado no body nunca é persistido", async () => {
  reset();
  await POST(signedRequest({ dataId: orderId, bodyStatus: "rejected" }));
  assert.equal(globalThis.__webhookRouteMocks.syncInputs[0].snapshot.status, "approved");
});
