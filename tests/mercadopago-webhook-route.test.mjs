import assert from "node:assert/strict";
import { createHmac } from "node:crypto";
import { existsSync, readFileSync } from "node:fs";
import { registerHooks } from "node:module";
import path from "node:path";
import test from "node:test";
import { fileURLToPath, pathToFileURL } from "node:url";

const projectRoot = path.resolve(import.meta.dirname, "..");
const orderId = "ORD01JQ4S4KY8HWQ6NA5PXB65B3D3";
const sandboxOrderId = "ORDTST01JQ4S4KY8HWQ6NA5PXB65B3D3";
globalThis.__webhookRouteMocks = { orderGets: [], providerLookups: [], syncInputs: [], paymentOrder: null, providerOrder: null, orderGetError: null };

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
        if (globalThis.__webhookRouteMocks.orderGetError) throw globalThis.__webhookRouteMocks.orderGetError;
        return globalThis.__webhookRouteMocks.providerOrder ?? { id: input.id, external_reference: "SUS-webhook", status: "processed", status_detail: "accredited", total_amount: "50.00", currency: "BRL", description: "Site Institucional", integration_data: { application_id: "8362280076817377" }, transactions: { payments: [] } };
      } }; }
    ` };
    if (url === "mock:webhook-orders") return { format: "module", shortCircuit: true, source: `
      export class PaymentOrderMismatchError extends Error {}
      export class PaymentOrderPersistenceError extends Error {}
      export async function findPaymentOrderByProviderOrderId(id) { globalThis.__webhookRouteMocks.providerLookups.push(id); return globalThis.__webhookRouteMocks.paymentOrder; }
      export async function findPaymentOrderByExternalReference(reference) { return globalThis.__webhookRouteMocks.paymentOrder?.externalReference === reference ? globalThis.__webhookRouteMocks.paymentOrder : null; }
      export async function syncPaymentOrderFromProvider(order, snapshot) { globalThis.__webhookRouteMocks.syncInputs.push({ order, snapshot }); return order; }
    ` };
    return nextLoad(url, context);
  },
});

const { POST } = await import("../src/app/api/mercadopago/webhook/route.ts");

function signedRequest({ dataId = "123456", secret = "orders-secret", signature = null, bodyStatus = "forged", type = "order", timestamp = String(Date.now()), applicationId = "8362280076817377", liveMode = false } = {}) {
  const requestId = "request-route-test";
  const digest = createHmac("sha256", secret).update(`id:${dataId};request-id:${requestId};ts:${timestamp};`).digest("hex");
  return new Request(`https://example.test/api/mercadopago/webhook?data.id=${encodeURIComponent(dataId)}&type=${type}`, {
    method: "POST",
    headers: { "content-type": "application/json", "x-request-id": requestId, "x-signature": signature ?? `ts=${timestamp},v1=${digest}` },
    body: JSON.stringify({ type, action: `${type}.updated`, status: bodyStatus, application_id: applicationId, live_mode: liveMode, data: { id: dataId } }),
  });
}

function reset(paymentMethod = "pix") {
  process.env.MERCADO_PAGO_ORDERS_WEBHOOK_SECRET = "orders-secret";
  delete process.env.VERCEL_ENV;
  delete process.env.MERCADO_PAGO_SANDBOX;
  delete process.env.MERCADO_PAGO_ORDERS_APPLICATION_ID;
  globalThis.__webhookRouteMocks.orderGets.length = 0;
  globalThis.__webhookRouteMocks.providerLookups.length = 0;
  globalThis.__webhookRouteMocks.syncInputs.length = 0;
  globalThis.__webhookRouteMocks.providerOrder = null;
  globalThis.__webhookRouteMocks.orderGetError = null;
  globalThis.__webhookRouteMocks.paymentOrder = { id: "local", userId: "user", serviceId: "site-institucional", amountInCents: 5000, currency: "BRL", externalReference: "SUS-webhook", providerOrderId: null, checkoutSessionId: "session", idempotencyKey: "key", paymentMethod, status: "pending", providerStatus: null, statusDetail: null, approvedAt: null };
}

test("fallback não consulta Orders para data.id não estrutural", async (t) => {
  reset();
  process.env.VERCEL_ENV = "preview";
  process.env.MERCADO_PAGO_SANDBOX = "true";
  t.mock.method(console, "info", () => {});

  const response = await POST(
    signedRequest({ dataId: "123456", signature: `ts=${Date.now()},v1=invalid` }),
  );

  assert.equal(response.status, 401);
  assert.equal(globalThis.__webhookRouteMocks.orderGets.length, 0);
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

test("ORDTST uppercase valida com case preservado no SDK e no provider", async () => {
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

test("Preview sandbox não usa fallback quando x-signature está ausente", async () => {
  reset();
  process.env.VERCEL_ENV = "preview";
  process.env.MERCADO_PAGO_SANDBOX = "true";
  const request = signedRequest({ dataId: sandboxOrderId });
  request.headers.delete("x-signature");

  const response = await POST(request);

  assert.equal(response.status, 401);
  assert.equal(globalThis.__webhookRouteMocks.orderGets.length, 0);
  assert.equal(globalThis.__webhookRouteMocks.syncInputs.length, 0);
});

test("Preview sandbox reconcilia HMAC inválido somente após validar a Order no provider", async (t) => {
  reset();
  process.env.VERCEL_ENV = "preview";
  process.env.MERCADO_PAGO_SANDBOX = "true";
  const info = t.mock.method(console, "info", () => {});

  const response = await POST(
    signedRequest({ dataId: sandboxOrderId, signature: `ts=${Date.now()},v1=invalid` }),
  );

  assert.equal(response.status, 200);
  assert.deepEqual(await response.json(), { received: true, result: "processed" });
  assert.deepEqual(globalThis.__webhookRouteMocks.orderGets, [{ id: sandboxOrderId }]);
  assert.equal(globalThis.__webhookRouteMocks.syncInputs.length, 1);
  assert.equal(globalThis.__webhookRouteMocks.syncInputs[0].snapshot.providerOrderId, sandboxOrderId);

  const fallbackLog = info.mock.calls
    .map((call) => JSON.parse(call.arguments[0]))
    .find((entry) => entry.webhook_stage === "sandbox_provider_verified_fallback");
  assert.deepEqual(fallbackLog, {
    route: "/api/mercadopago/webhook",
    webhook_stage: "sandbox_provider_verified_fallback",
    hmac_valid: false,
    provider_lookup_valid: true,
    application_match: true,
    external_reference_match: true,
    amount_match: true,
    environment_match: true,
    reconciled: true,
  });
});

test("Preview com sandbox=false rejeita HMAC inválido sem executar fallback", async () => {
  reset();
  process.env.VERCEL_ENV = "preview";
  process.env.MERCADO_PAGO_SANDBOX = "false";

  const response = await POST(
    signedRequest({ dataId: sandboxOrderId, signature: `ts=${Date.now()},v1=invalid` }),
  );

  assert.equal(response.status, 401);
  assert.equal(globalThis.__webhookRouteMocks.orderGets.length, 0);
  assert.equal(globalThis.__webhookRouteMocks.syncInputs.length, 0);
});

test("Preview sandbox rejeita application_id divergente", async (t) => {
  reset();
  process.env.VERCEL_ENV = "preview";
  process.env.MERCADO_PAGO_SANDBOX = "true";
  globalThis.__webhookRouteMocks.providerOrder = {
    id: sandboxOrderId, external_reference: "SUS-webhook", status: "processed", status_detail: "accredited",
    total_amount: "50.00", currency: "BRL", description: "Site Institucional",
    integration_data: { application_id: "other-application" }, transactions: { payments: [] },
  };
  t.mock.method(console, "info", () => {});

  const response = await POST(signedRequest({ dataId: sandboxOrderId, signature: `ts=${Date.now()},v1=invalid` }));

  assert.equal(response.status, 401);
  assert.equal(globalThis.__webhookRouteMocks.syncInputs.length, 0);
});

test("Preview sandbox rejeita external_reference que não pertence à Susanoo", async (t) => {
  reset();
  process.env.VERCEL_ENV = "preview";
  process.env.MERCADO_PAGO_SANDBOX = "true";
  globalThis.__webhookRouteMocks.providerOrder = {
    id: sandboxOrderId, external_reference: "SUS-outra-operacao", status: "processed", status_detail: "accredited",
    total_amount: "50.00", currency: "BRL", description: "Site Institucional",
    integration_data: { application_id: "8362280076817377" }, transactions: { payments: [] },
  };
  t.mock.method(console, "info", () => {});

  const response = await POST(signedRequest({ dataId: sandboxOrderId, signature: `ts=${Date.now()},v1=invalid` }));

  assert.equal(response.status, 401);
  assert.equal(globalThis.__webhookRouteMocks.syncInputs.length, 0);
});

test("Preview sandbox rejeita amount divergente", async (t) => {
  reset();
  process.env.VERCEL_ENV = "preview";
  process.env.MERCADO_PAGO_SANDBOX = "true";
  globalThis.__webhookRouteMocks.providerOrder = {
    id: sandboxOrderId, external_reference: "SUS-webhook", status: "processed", status_detail: "accredited",
    total_amount: "49.99", currency: "BRL", description: "Site Institucional",
    integration_data: { application_id: "8362280076817377" }, transactions: { payments: [] },
  };
  t.mock.method(console, "info", () => {});

  const response = await POST(signedRequest({ dataId: sandboxOrderId, signature: `ts=${Date.now()},v1=invalid` }));

  assert.equal(response.status, 401);
  assert.equal(globalThis.__webhookRouteMocks.syncInputs.length, 0);
});

test("Preview sandbox rejeita moeda divergente", async (t) => {
  reset();
  process.env.VERCEL_ENV = "preview";
  process.env.MERCADO_PAGO_SANDBOX = "true";
  globalThis.__webhookRouteMocks.providerOrder = {
    id: sandboxOrderId, external_reference: "SUS-webhook", status: "processed", status_detail: "accredited",
    total_amount: "50.00", currency: "USD", description: "Site Institucional",
    integration_data: { application_id: "8362280076817377" }, transactions: { payments: [] },
  };
  t.mock.method(console, "info", () => {});

  const response = await POST(signedRequest({ dataId: sandboxOrderId, signature: `ts=${Date.now()},v1=invalid` }));

  assert.equal(response.status, 401);
  assert.equal(globalThis.__webhookRouteMocks.syncInputs.length, 0);
});

test("Preview sandbox rejeita Order inexistente", async (t) => {
  reset();
  process.env.VERCEL_ENV = "preview";
  process.env.MERCADO_PAGO_SANDBOX = "true";
  globalThis.__webhookRouteMocks.orderGetError = new Error("not found");
  t.mock.method(console, "info", () => {});

  const response = await POST(signedRequest({ dataId: sandboxOrderId, signature: `ts=${Date.now()},v1=invalid` }));

  assert.equal(response.status, 401);
  assert.equal(globalThis.__webhookRouteMocks.syncInputs.length, 0);
});

test("Production rejeita HMAC inválido sem consultar ou reconciliar", async () => {
  reset();
  process.env.VERCEL_ENV = "production";
  process.env.MERCADO_PAGO_SANDBOX = "true";

  const response = await POST(signedRequest({ dataId: sandboxOrderId, signature: `ts=${Date.now()},v1=invalid` }));

  assert.equal(response.status, 401);
  assert.equal(globalThis.__webhookRouteMocks.orderGets.length, 0);
  assert.equal(globalThis.__webhookRouteMocks.syncInputs.length, 0);
});

test("HMAC válido mantém o fluxo atual mesmo em Preview sandbox", async (t) => {
  reset();
  process.env.VERCEL_ENV = "preview";
  process.env.MERCADO_PAGO_SANDBOX = "true";
  const info = t.mock.method(console, "info", () => {});

  const response = await POST(signedRequest({ dataId: sandboxOrderId }));

  assert.equal(response.status, 200);
  assert.equal(globalThis.__webhookRouteMocks.syncInputs.length, 1);
  const fallbackLogs = info.mock.calls
    .map((call) => JSON.parse(call.arguments[0]))
    .filter((entry) => entry.webhook_stage === "sandbox_provider_verified_fallback");
  assert.equal(fallbackLogs.length, 0);
});

test("webhook não mantém diagnósticos antigos nem expõe credenciais nos logs", async (t) => {
  reset();
  process.env.VERCEL_ENV = "preview";
  process.env.MERCADO_PAGO_SANDBOX = "true";
  const info = t.mock.method(console, "info", () => {});

  await POST(signedRequest({ dataId: sandboxOrderId, signature: `ts=${Date.now()},v1=invalid` }));

  const routeSource = readFileSync(
    path.join(projectRoot, "src/app/api/mercadopago/webhook/route.ts"),
    "utf8",
  );
  const logs = info.mock.calls.map((call) => call.arguments[0]).join("\n");
  for (const removedStage of [
    "secret_fingerprint",
    "header_context",
    "timestamp_context",
    "signature_matrix",
    "application_context",
  ]) {
    assert.doesNotMatch(routeSource, new RegExp(removedStage));
    assert.doesNotMatch(logs, new RegExp(removedStage));
  }
  assert.doesNotMatch(logs, /orders-secret/);
  assert.doesNotMatch(logs, /request-route-test/);
  assert.doesNotMatch(logs, /v1=/);
  assert.doesNotMatch(logs, /Authorization/i);
});

test("timestamp válido no HMAC mas fora da tolerância retorna 401", async () => {
  reset();
  const staleTimestamp = String(Date.now() - 6 * 60 * 1_000);
  const response = await POST(signedRequest({ dataId: orderId, timestamp: staleTimestamp }));
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
