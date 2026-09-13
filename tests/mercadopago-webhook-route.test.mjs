import assert from "node:assert/strict";
import { createHmac } from "node:crypto";
import { existsSync } from "node:fs";
import { registerHooks } from "node:module";
import path from "node:path";
import test from "node:test";
import { fileURLToPath, pathToFileURL } from "node:url";

const projectRoot = path.resolve(import.meta.dirname, "..");

globalThis.__webhookRouteMocks = {
  paymentOrder: null,
  providerLookups: [],
  externalReferenceLookups: [],
  syncInputs: [],
};

registerHooks({
  resolve(specifier, context, nextResolve) {
    if (specifier === "server-only") {
      return { shortCircuit: true, url: "mock:server-only" };
    }
    if (specifier === "next/server") {
      return nextResolve("next/server.js", context);
    }
    if (specifier === "@/lib/mercadopago/payment-orders") {
      return { shortCircuit: true, url: "mock:webhook-payment-orders" };
    }
    if (specifier.startsWith("@/")) {
      const sourcePath = path.join(projectRoot, "src", `${specifier.slice(2)}.ts`);
      return nextResolve(pathToFileURL(sourcePath).href, context);
    }
    if (specifier.startsWith(".") && context.parentURL?.startsWith("file:")) {
      const candidateUrl = new URL(`${specifier}.ts`, context.parentURL);
      if (existsSync(fileURLToPath(candidateUrl))) {
        return nextResolve(candidateUrl.href, context);
      }
    }
    return nextResolve(specifier, context);
  },
  load(url, context, nextLoad) {
    if (url === "mock:server-only") {
      return { format: "module", shortCircuit: true, source: "export {};" };
    }
    if (url === "mock:webhook-payment-orders") {
      return {
        format: "module",
        shortCircuit: true,
        source: `
          export class PaymentOrderMismatchError extends Error {}
          export class PaymentOrderPersistenceError extends Error {}
          export async function findPaymentOrderByProviderOrderId(id) {
            globalThis.__webhookRouteMocks.providerLookups.push(id);
            return globalThis.__webhookRouteMocks.paymentOrder;
          }
          export async function findPaymentOrderByExternalReference(reference) {
            globalThis.__webhookRouteMocks.externalReferenceLookups.push(reference);
            return null;
          }
          export async function syncPaymentOrderFromProvider(order, snapshot) {
            globalThis.__webhookRouteMocks.syncInputs.push({ order, snapshot });
            return { ...order, providerOrderId: snapshot.providerOrderId };
          }
        `,
      };
    }
    return nextLoad(url, context);
  },
});

const { MPBadRequestError, MPNotFoundError, Order } = await import("mercadopago");
const { POST } = await import("../src/app/api/mercadopago/webhook/route.ts");
const { calculateWebhookHmacDiagnostic } = await import(
  "../src/lib/mercadopago/webhook-signature-diagnostic.ts"
);

const providerOrderId = "ORD01JQ4S4KY8HWQ6NA5PXB65B3D3";

test("diagnóstico HMAC manual aceita o manifest oficial", () => {
  const dataId = "ORDTST01M2C0G58E56EZ82ZXS77E11Q9";
  const requestId = "request-real-format";
  const timestamp = "1789308000000";
  const secret = "test-secret";
  const manifest = `id:${dataId};request-id:${requestId};ts:${timestamp};`;
  const v1 = createHmac("sha256", secret).update(manifest).digest("hex");

  assert.deepEqual(
    calculateWebhookHmacDiagnostic({
      dataId,
      requestId,
      xSignature: `ts=${timestamp},v1=${v1}`,
      secret,
    }),
    {
      manualValid: true,
      manifestLength: manifest.length,
      dataIdLength: dataId.length,
      requestIdLength: requestId.length,
      tsDigits: 13,
    },
  );
});

test("diagnóstico HMAC manual rejeita secret diferente", () => {
  const dataId = "ORDTST01M2C0G58E56EZ82ZXS77E11Q9";
  const requestId = "request-real-format";
  const timestamp = "1789308000000";
  const manifest = `id:${dataId};request-id:${requestId};ts:${timestamp};`;
  const v1 = createHmac("sha256", "signing-secret")
    .update(manifest)
    .digest("hex");

  const diagnostic = calculateWebhookHmacDiagnostic({
    dataId,
    requestId,
    xSignature: `ts=${timestamp},v1=${v1}`,
    secret: "different-secret",
  });

  assert.equal(diagnostic.manualValid, false);
  assert.equal(diagnostic.manifestLength, manifest.length);
  assert.equal(diagnostic.tsDigits, 13);
});

function restoreEnvironmentVariable(name, previousValue) {
  if (previousValue === undefined) {
    delete process.env[name];
    return;
  }
  process.env[name] = previousValue;
}

function signedRequest({
  body,
  dataId = "123456",
  signature = null,
  timestamp = String(Math.floor(Date.now() / 1000)),
}) {
  const secret = "test-secret";
  const requestId = "request-route-test";
  const manifest = `id:${dataId};request-id:${requestId};ts:${timestamp};`;
  const validSignature = createHmac("sha256", secret)
    .update(manifest)
    .digest("hex");

  return new Request(
    `https://example.test/api/mercadopago/webhook?data.id=${encodeURIComponent(dataId)}&type=order`,
    {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "x-request-id": requestId,
        "x-signature": signature ?? `ts=${timestamp},v1=${validSignature}`,
      },
      body,
    },
  );
}

function resetWebhookMocks() {
  globalThis.__webhookRouteMocks.paymentOrder = null;
  globalThis.__webhookRouteMocks.providerLookups.length = 0;
  globalThis.__webhookRouteMocks.externalReferenceLookups.length = 0;
  globalThis.__webhookRouteMocks.syncInputs.length = 0;
}

test("timestamp válido em segundos mantém o simulador como 200 ignored sem consultar Orders API", async (t) => {
  const previousSecret = process.env.MERCADO_PAGO_WEBHOOK_SECRET;
  const previousAccessToken = process.env.MERCADO_PAGO_ACCESS_TOKEN;
  process.env.MERCADO_PAGO_WEBHOOK_SECRET = "test-secret";
  process.env.MERCADO_PAGO_ACCESS_TOKEN = "test-access-token";

  t.after(() => {
    restoreEnvironmentVariable("MERCADO_PAGO_WEBHOOK_SECRET", previousSecret);
    restoreEnvironmentVariable("MERCADO_PAGO_ACCESS_TOKEN", previousAccessToken);
  });

  const get = t.mock.method(Order.prototype, "get", async () => {
    throw new Error("Orders API não deveria ser chamada");
  });

  const response = await POST(
    signedRequest({
      body: JSON.stringify({
        type: "order",
        data: { id: "123456" },
      }),
    }),
  );

  assert.equal(get.mock.callCount(), 0);
  assert.equal(response.status, 200);
  assert.deepEqual(await response.json(), {
    received: true,
    result: "ignored",
  });
});

test("timestamp válido em milissegundos é aceito após o HMAC", async (t) => {
  const previousSecret = process.env.MERCADO_PAGO_WEBHOOK_SECRET;
  process.env.MERCADO_PAGO_WEBHOOK_SECRET = "test-secret";
  t.after(() => {
    restoreEnvironmentVariable("MERCADO_PAGO_WEBHOOK_SECRET", previousSecret);
  });

  const get = t.mock.method(Order.prototype, "get", async () => {
    throw new Error("Orders API não deveria ser chamada");
  });
  const response = await POST(
    signedRequest({
      timestamp: String(Date.now()),
      body: JSON.stringify({ type: "order", data: { id: "123456" } }),
    }),
  );

  assert.equal(get.mock.callCount(), 0);
  assert.equal(response.status, 200);
});

for (const testCase of [
  {
    name: "timestamp em segundos fora da tolerância",
    timestamp: () => String(Math.floor(Date.now() / 1000) - 301),
  },
  {
    name: "timestamp em milissegundos fora da tolerância",
    timestamp: () => String(Date.now() - 300_001),
  },
  { name: "timestamp malformado", timestamp: () => "not-a-timestamp" },
  { name: "timestamp ambíguo com 11 dígitos", timestamp: () => "12345678901" },
  { name: "timestamp ambíguo com 12 dígitos", timestamp: () => "123456789012" },
]) {
  test(`${testCase.name} retorna 401`, async (t) => {
    const previousSecret = process.env.MERCADO_PAGO_WEBHOOK_SECRET;
    process.env.MERCADO_PAGO_WEBHOOK_SECRET = "test-secret";
    t.after(() => {
      restoreEnvironmentVariable("MERCADO_PAGO_WEBHOOK_SECRET", previousSecret);
    });

    const get = t.mock.method(Order.prototype, "get", async () => {
      throw new Error("Orders API não deveria ser chamada");
    });
    const response = await POST(
      signedRequest({
        timestamp: testCase.timestamp(),
        body: JSON.stringify({ type: "order", data: { id: "123456" } }),
      }),
    );

    assert.equal(get.mock.callCount(), 0);
    assert.equal(response.status, 401);
  });
}

test("Order real autenticada consulta a API e sincroniza a ordem local", async (t) => {
  const previousSecret = process.env.MERCADO_PAGO_WEBHOOK_SECRET;
  const previousAccessToken = process.env.MERCADO_PAGO_ACCESS_TOKEN;
  process.env.MERCADO_PAGO_WEBHOOK_SECRET = "test-secret";
  process.env.MERCADO_PAGO_ACCESS_TOKEN = "test-access-token";
  resetWebhookMocks();
  globalThis.__webhookRouteMocks.paymentOrder = {
    id: "local-order",
    userId: "user-test",
    serviceId: "site-institucional",
    amountInCents: 5_000,
    currency: "BRL",
    providerOrderId,
    externalReference: "SUS-test-reference",
    checkoutSessionId: "018f47a2-4d7e-7c31-8a5b-11c2df98a120",
    idempotencyKey: "persisted-idempotency-key",
    paymentMethod: "pix",
    status: "pending",
    providerStatus: "action_required",
    statusDetail: "waiting_transfer",
    approvedAt: null,
  };

  t.after(() => {
    restoreEnvironmentVariable("MERCADO_PAGO_WEBHOOK_SECRET", previousSecret);
    restoreEnvironmentVariable("MERCADO_PAGO_ACCESS_TOKEN", previousAccessToken);
  });

  const get = t.mock.method(Order.prototype, "get", async ({ id }) => {
    assert.equal(id, providerOrderId);
    return {
      id: providerOrderId,
      external_reference: "SUS-test-reference",
      status: "processed",
      status_detail: "accredited",
      transactions: { payments: [] },
    };
  });

  const response = await POST(
    signedRequest({
      dataId: providerOrderId,
      timestamp: String(Date.now()),
      body: JSON.stringify({
        action: "order.processed",
        type: "order",
        data: { id: providerOrderId },
      }),
    }),
  );

  assert.equal(get.mock.callCount(), 1);
  assert.equal(response.status, 200);
  assert.deepEqual(await response.json(), { received: true, result: "processed" });
  assert.deepEqual(globalThis.__webhookRouteMocks.providerLookups, [providerOrderId]);
  assert.equal(globalThis.__webhookRouteMocks.syncInputs.length, 1);
  assert.equal(
    globalThis.__webhookRouteMocks.syncInputs[0].snapshot.status,
    "approved",
  );
});

test("Order ID válido continua consultando Orders API", async (t) => {
  const previousSecret = process.env.MERCADO_PAGO_WEBHOOK_SECRET;
  const previousAccessToken = process.env.MERCADO_PAGO_ACCESS_TOKEN;
  process.env.MERCADO_PAGO_WEBHOOK_SECRET = "test-secret";
  process.env.MERCADO_PAGO_ACCESS_TOKEN = "test-access-token";

  t.after(() => {
    restoreEnvironmentVariable("MERCADO_PAGO_WEBHOOK_SECRET", previousSecret);
    restoreEnvironmentVariable("MERCADO_PAGO_ACCESS_TOKEN", previousAccessToken);
  });

  const get = t.mock.method(Order.prototype, "get", async ({ id }) => {
    assert.equal(id, providerOrderId);
    throw new MPNotFoundError({
      status: 404,
      error: "not_found",
      message: "Order not found",
    });
  });

  const response = await POST(
    signedRequest({
      dataId: providerOrderId,
      body: JSON.stringify({ type: "order", data: { id: providerOrderId } }),
    }),
  );

  assert.equal(get.mock.callCount(), 1);
  assert.equal(response.status, 200);
  assert.deepEqual(await response.json(), {
    received: true,
    result: "ignored",
  });
});

test("erro 400 de Order ID válido não é mascarado como ignored", async (t) => {
  const previousSecret = process.env.MERCADO_PAGO_WEBHOOK_SECRET;
  const previousAccessToken = process.env.MERCADO_PAGO_ACCESS_TOKEN;
  process.env.MERCADO_PAGO_WEBHOOK_SECRET = "test-secret";
  process.env.MERCADO_PAGO_ACCESS_TOKEN = "test-access-token";

  t.after(() => {
    restoreEnvironmentVariable("MERCADO_PAGO_WEBHOOK_SECRET", previousSecret);
    restoreEnvironmentVariable("MERCADO_PAGO_ACCESS_TOKEN", previousAccessToken);
  });

  const get = t.mock.method(Order.prototype, "get", async ({ id }) => {
    assert.equal(id, providerOrderId);
    throw new MPBadRequestError({
      status: 400,
      error: "bad_request",
      message: "Legitimate Order API error",
    });
  });

  const response = await POST(
    signedRequest({
      dataId: providerOrderId,
      body: JSON.stringify({ type: "order", data: { id: providerOrderId } }),
    }),
  );

  assert.equal(get.mock.callCount(), 1);
  assert.equal(response.status, 502);
  assert.deepEqual(await response.json(), {
    error: "Falha temporária ao processar a notificação.",
  });
});

test("assinatura inválida retorna 401 antes da Orders API", async (t) => {
  const previousSecret = process.env.MERCADO_PAGO_WEBHOOK_SECRET;
  process.env.MERCADO_PAGO_WEBHOOK_SECRET = "test-secret";
  t.after(() => {
    restoreEnvironmentVariable("MERCADO_PAGO_WEBHOOK_SECRET", previousSecret);
  });

  const get = t.mock.method(Order.prototype, "get", async () => {
    throw new Error("Orders API não deveria ser chamada");
  });
  const info = t.mock.method(console, "info", () => {});
  const response = await POST(
    signedRequest({
      body: JSON.stringify({
        application_id: 8362280076817377,
        user_id: 123456789,
        live_mode: false,
        type: "order",
        action: "order.updated",
        data: { id: "123456" },
      }),
      signature: "ts=1700000000,v1=invalid",
    }),
  );

  assert.equal(get.mock.callCount(), 0);
  assert.equal(response.status, 401);
  const diagnosticLogs = info.mock.calls.map(({ arguments: [message] }) =>
    JSON.parse(message),
  );
  assert.deepEqual(
    diagnosticLogs.find(
      ({ webhook_stage: webhookStage }) =>
        webhookStage === "body_diagnostic",
    ),
    {
      webhook_stage: "body_diagnostic",
      application_id: 8362280076817377,
      user_id: 123456789,
      live_mode: false,
      type: "order",
      action: "order.updated",
      body_data_id_matches_query: true,
    },
  );
});

test("payload malformado retorna 400 antes da Orders API", async (t) => {
  const previousSecret = process.env.MERCADO_PAGO_WEBHOOK_SECRET;
  process.env.MERCADO_PAGO_WEBHOOK_SECRET = "test-secret";
  t.after(() => {
    restoreEnvironmentVariable("MERCADO_PAGO_WEBHOOK_SECRET", previousSecret);
  });

  const get = t.mock.method(Order.prototype, "get", async () => {
    throw new Error("Orders API não deveria ser chamada");
  });
  const response = await POST(signedRequest({ body: "{" }));

  assert.equal(get.mock.callCount(), 0);
  assert.equal(response.status, 400);
});
