import assert from "node:assert/strict";
import { createHmac } from "node:crypto";
import { existsSync } from "node:fs";
import { registerHooks } from "node:module";
import path from "node:path";
import test from "node:test";
import { fileURLToPath, pathToFileURL } from "node:url";

const projectRoot = path.resolve(import.meta.dirname, "..");

registerHooks({
  resolve(specifier, context, nextResolve) {
    if (specifier === "server-only") {
      return { shortCircuit: true, url: "mock:server-only" };
    }
    if (specifier === "next/server") {
      return nextResolve("next/server.js", context);
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
    return nextLoad(url, context);
  },
});

const { MPBadRequestError, MPNotFoundError, Order } = await import("mercadopago");
const { POST } = await import("../src/app/api/mercadopago/webhook/route.ts");

const providerOrderId = "ORD01JQ4S4KY8HWQ6NA5PXB65B3D3";

function restoreEnvironmentVariable(name, previousValue) {
  if (previousValue === undefined) {
    delete process.env[name];
    return;
  }
  process.env[name] = previousValue;
}

function signedRequest({ body, dataId = "123456", signature = null }) {
  const secret = "test-secret";
  const requestId = "request-route-test";
  const timestamp = String(Math.floor(Date.now() / 1000));
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

test("data.id do simulador autenticado retorna 200 ignored sem consultar Orders API", async (t) => {
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
  const response = await POST(
    signedRequest({
      body: JSON.stringify({ type: "order", data: { id: "123456" } }),
      signature: "ts=1700000000,v1=invalid",
    }),
  );

  assert.equal(get.mock.callCount(), 0);
  assert.equal(response.status, 401);
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
