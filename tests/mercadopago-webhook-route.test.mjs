import assert from "node:assert/strict";
import { createHmac } from "node:crypto";
import { existsSync } from "node:fs";
import { registerHooks } from "node:module";
import path from "node:path";
import test from "node:test";
import { fileURLToPath, pathToFileURL } from "node:url";

const projectRoot = path.resolve(import.meta.dirname, "..");
const orderId = "ORD01JQ4S4KY8HWQ6NA5PXB65B3D3";
const paymentId = "987654321";
globalThis.__webhookRouteMocks = { orderGets: [], paymentGets: [], providerLookups: [], syncInputs: [], paymentOrder: null };

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
      export function getMercadoPagoPaymentClient() { return { async get(input) {
        globalThis.__webhookRouteMocks.paymentGets.push(input);
        return { id: Number(input.id), external_reference: "SUS-webhook", status: "approved", status_detail: "accredited" };
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

function signedRequest({ type = "order", dataId = type === "order" ? "123456" : paymentId, secret = type === "order" ? "orders-secret" : "bricks-secret", signature = null, bodyStatus = "forged" } = {}) {
  const timestamp = String(Date.now());
  const requestId = "request-route-test";
  const signatureDataId = type === "order" ? dataId.toLowerCase() : dataId;
  const digest = createHmac("sha256", secret).update(`id:${signatureDataId};request-id:${requestId};ts:${timestamp};`).digest("hex");
  return new Request(`https://example.test/api/mercadopago/webhook?data.id=${encodeURIComponent(dataId)}&type=${type}`, {
    method: "POST",
    headers: { "content-type": "application/json", "x-request-id": requestId, "x-signature": signature ?? `ts=${timestamp},v1=${digest}` },
    body: JSON.stringify({ type, action: `${type}.updated`, status: bodyStatus, data: { id: dataId } }),
  });
}

function reset() {
  Object.assign(process.env, { MERCADO_PAGO_ORDERS_WEBHOOK_SECRET: "orders-secret", MERCADO_PAGO_BRICKS_WEBHOOK_SECRET: "bricks-secret" });
  globalThis.__webhookRouteMocks.orderGets.length = 0;
  globalThis.__webhookRouteMocks.paymentGets.length = 0;
  globalThis.__webhookRouteMocks.providerLookups.length = 0;
  globalThis.__webhookRouteMocks.syncInputs.length = 0;
  globalThis.__webhookRouteMocks.paymentOrder = { id: "local", externalReference: "SUS-webhook", providerOrderId: null, status: "pending" };
}

test("simulador Orders autenticado continua ignored sem consultar provider", async () => {
  reset();
  const response = await POST(signedRequest());
  assert.equal(response.status, 200);
  assert.equal(globalThis.__webhookRouteMocks.orderGets.length, 0);
  assert.deepEqual(await response.json(), { received: true, result: "ignored" });
});

test("evento Orders usa secret Orders, lowercase no HMAC e ID original no provider", async () => {
  reset();
  const response = await POST(signedRequest({ dataId: orderId }));
  assert.equal(response.status, 200);
  assert.deepEqual(globalThis.__webhookRouteMocks.orderGets, [{ id: orderId }]);
  assert.deepEqual(globalThis.__webhookRouteMocks.providerLookups, [orderId]);
});

test("evento payment usa secret Bricks e consulta Payments API antes de persistir", async () => {
  reset();
  const response = await POST(signedRequest({ type: "payment" }));
  assert.equal(response.status, 200);
  assert.deepEqual(globalThis.__webhookRouteMocks.paymentGets, [{ id: paymentId }]);
  assert.equal(globalThis.__webhookRouteMocks.syncInputs.length, 1);
  assert.equal(globalThis.__webhookRouteMocks.syncInputs[0].snapshot.status, "approved");
});

test("payment assinado com secret Orders é rejeitado", async () => {
  reset();
  const response = await POST(signedRequest({ type: "payment", secret: "orders-secret" }));
  assert.equal(response.status, 401);
  assert.equal(globalThis.__webhookRouteMocks.paymentGets.length, 0);
});

test("assinatura inválida retorna 401", async () => {
  reset();
  const response = await POST(signedRequest({ signature: `ts=${Date.now()},v1=invalid` }));
  assert.equal(response.status, 401);
});

test("status forjado no body nunca é persistido", async () => {
  reset();
  await POST(signedRequest({ type: "payment", bodyStatus: "rejected" }));
  assert.equal(globalThis.__webhookRouteMocks.syncInputs[0].snapshot.status, "approved");
});

test("payload com data.id divergente é rejeitado antes do provider", async () => {
  reset();
  const request = signedRequest({ type: "payment" });
  const headers = Object.fromEntries(request.headers);
  const response = await POST(new Request(request.url, { method: "POST", headers, body: JSON.stringify({ type: "payment", data: { id: "111" } }) }));
  assert.equal(response.status, 400);
  assert.equal(globalThis.__webhookRouteMocks.paymentGets.length, 0);
});
