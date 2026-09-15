import assert from "node:assert/strict";
import { existsSync } from "node:fs";
import { registerHooks } from "node:module";
import path from "node:path";
import test from "node:test";
import { fileURLToPath, pathToFileURL } from "node:url";

const projectRoot = path.resolve(import.meta.dirname, "..");
const providerOrderId = "ORD01JQ4S4KY8HWQ6NA5PXB65B3D3";
const checkoutSessionId = "018f47a2-4d7e-7c31-8a5b-11c2df98a120";

globalThis.__orderRouteMocks = {
  paymentOrder: null,
  persistenceInputs: [],
  providerInputs: [],
};

registerHooks({
  resolve(specifier, context, nextResolve) {
    if (specifier === "server-only") {
      return { shortCircuit: true, url: "mock:server-only" };
    }
    if (specifier === "next/server") {
      return nextResolve("next/server.js", context);
    }
    if (specifier === "@/lib/mercadopago/auth") {
      return { shortCircuit: true, url: "mock:mercadopago-auth" };
    }
    if (specifier === "@/lib/mercadopago/payment-orders") {
      return { shortCircuit: true, url: "mock:payment-orders" };
    }
    if (specifier === "@/lib/mercadopago/server") {
      return { shortCircuit: true, url: "mock:mercadopago-server" };
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
    if (url === "mock:mercadopago-auth") {
      return {
        format: "module",
        shortCircuit: true,
        source: `export async function getAuthenticatedPayer() {
          return { userId: "user-test", email: "comprador@exemplo.com" };
        }`,
      };
    }
    if (url === "mock:payment-orders") {
      return {
        format: "module",
        shortCircuit: true,
        source: `
          export class PaymentOrderMismatchError extends Error {}
          export class PaymentOrderPersistenceError extends Error {}
          export async function getOrCreatePaymentOrder(input) {
            globalThis.__orderRouteMocks.persistenceInputs.push(input);
            return globalThis.__orderRouteMocks.paymentOrder ?? {
              id: "local-order",
              userId: input.userId,
              serviceId: input.serviceId,
              amountInCents: input.amountInCents,
              currency: "BRL",
              providerOrderId: null,
              externalReference: "SUS-test-reference",
              checkoutSessionId: input.checkoutSessionId,
              idempotencyKey: "persisted-idempotency-key",
              paymentMethod: input.paymentMethod,
              status: "pending",
              providerStatus: null,
              statusDetail: null,
              approvedAt: null,
            };
          }
          export async function syncPaymentOrderFromProvider(order, snapshot) {
            return { ...order, providerOrderId: snapshot.providerOrderId };
          }
        `,
      };
    }
    if (url === "mock:mercadopago-server") {
      return {
        format: "module",
        shortCircuit: true,
        source: `
          export class MercadoPagoConfigurationError extends Error {}
          export function getMercadoPagoOrderClient() {
            return {
              async create(input) {
                globalThis.__orderRouteMocks.providerInputs.push(input);
                return {
                  id: "${providerOrderId}",
                  external_reference: input.body.external_reference,
                  status: "action_required",
                  status_detail: "waiting_transfer",
                  transactions: { payments: [{ payment_method: {} }] },
                };
              },
            };
          }
        `,
      };
    }
    return nextLoad(url, context);
  },
});

const { POST } = await import("../src/app/api/mercadopago/order/route.ts");

function orderRequest(sessionId = checkoutSessionId) {
  return new Request("https://example.test/api/mercadopago/order", {
    method: "POST",
    headers: {
      authorization: "Bearer authenticated-test-session",
      "content-type": "application/json",
    },
    body: JSON.stringify({
      serviceId: "site-institucional",
      paymentMethod: "pix",
      checkoutSessionId: sessionId,
    }),
  });
}

function resetMocks() {
  globalThis.__orderRouteMocks.paymentOrder = null;
  globalThis.__orderRouteMocks.persistenceInputs.length = 0;
  globalThis.__orderRouteMocks.providerInputs.length = 0;
}

function restoreSandbox(previousValue) {
  if (previousValue === undefined) {
    delete process.env.MERCADO_PAGO_SANDBOX;
  } else {
    process.env.MERCADO_PAGO_SANDBOX = previousValue;
  }
}

function restoreVercelEnv(previousValue) {
  if (previousValue === undefined) {
    delete process.env.VERCEL_ENV;
  } else {
    process.env.VERCEL_ENV = previousValue;
  }
}

test("sandbox persiste 5000 e envia o payload PIX oficial", async (t) => {
  const previousSandbox = process.env.MERCADO_PAGO_SANDBOX;
  const previousVercelEnv = process.env.VERCEL_ENV;
  process.env.VERCEL_ENV = "preview";
  process.env.MERCADO_PAGO_SANDBOX = "true";
  resetMocks();
  t.after(() => restoreSandbox(previousSandbox));
  t.after(() => restoreVercelEnv(previousVercelEnv));

  const response = await POST(orderRequest());

  assert.equal(response.status, 201);
  assert.equal(globalThis.__orderRouteMocks.persistenceInputs.length, 1);
  assert.equal(
    globalThis.__orderRouteMocks.persistenceInputs[0].amountInCents,
    5_000,
  );
  const providerInput = globalThis.__orderRouteMocks.providerInputs[0];
  assert.equal(providerInput.body.total_amount, "50.00");
  assert.equal(providerInput.body.transactions.payments[0].amount, "50.00");
  assert.deepEqual(providerInput.body.payer, {
    email: "test_user_br@testuser.com",
    first_name: "APRO",
  });
  assert.equal(
    providerInput.requestOptions.idempotencyKey,
    "persisted-idempotency-key",
  );
  assert.doesNotMatch(JSON.stringify(await response.json()), /access|service.role/i);
});

test("modo normal mantém preço do catálogo e email autenticado", async (t) => {
  const previousSandbox = process.env.MERCADO_PAGO_SANDBOX;
  delete process.env.MERCADO_PAGO_SANDBOX;
  resetMocks();
  t.after(() => restoreSandbox(previousSandbox));

  const response = await POST(orderRequest());

  assert.equal(response.status, 201);
  assert.equal(
    globalThis.__orderRouteMocks.persistenceInputs[0].amountInCents,
    149_900,
  );
  const providerInput = globalThis.__orderRouteMocks.providerInputs[0];
  assert.equal(providerInput.body.total_amount, "1499.00");
  assert.equal(providerInput.body.transactions.payments[0].amount, "1499.00");
  assert.deepEqual(providerInput.body.payer, {
    email: "comprador@exemplo.com",
  });
});

test("sandbox não reutiliza uma ordem antiga de 149900", async (t) => {
  const previousSandbox = process.env.MERCADO_PAGO_SANDBOX;
  const previousVercelEnv = process.env.VERCEL_ENV;
  process.env.VERCEL_ENV = "preview";
  process.env.MERCADO_PAGO_SANDBOX = "true";
  resetMocks();
  globalThis.__orderRouteMocks.paymentOrder = {
    id: "old-local-order",
    userId: "user-test",
    serviceId: "site-institucional",
    amountInCents: 149_900,
    currency: "BRL",
    providerOrderId: null,
    externalReference: "SUS-old-reference",
    checkoutSessionId,
    idempotencyKey: "old-idempotency-key",
    paymentMethod: "pix",
    status: "pending",
    providerStatus: null,
    statusDetail: null,
    approvedAt: null,
  };
  t.after(() => restoreSandbox(previousSandbox));
  t.after(() => restoreVercelEnv(previousVercelEnv));

  const response = await POST(orderRequest());

  assert.equal(response.status, 409);
  assert.equal(globalThis.__orderRouteMocks.providerInputs.length, 0);
  assert.deepEqual(await response.json(), {
    error: "Sessão de checkout conflitante.",
  });
});

test("Production ignora sandbox=true e mantém preço e payer reais", async (t) => {
  const previousSandbox = process.env.MERCADO_PAGO_SANDBOX;
  const previousVercelEnv = process.env.VERCEL_ENV;
  process.env.VERCEL_ENV = "production";
  process.env.MERCADO_PAGO_SANDBOX = "true";
  resetMocks();
  t.after(() => restoreSandbox(previousSandbox));
  t.after(() => restoreVercelEnv(previousVercelEnv));

  const response = await POST(orderRequest());

  assert.equal(response.status, 201);
  assert.equal(globalThis.__orderRouteMocks.persistenceInputs[0].amountInCents, 149_900);
  assert.equal(globalThis.__orderRouteMocks.providerInputs[0].body.total_amount, "1499.00");
  assert.deepEqual(globalThis.__orderRouteMocks.providerInputs[0].body.payer, {
    email: "comprador@exemplo.com",
  });
});

test("Preview com sandbox=false mantém preço e payer reais", async (t) => {
  const previousSandbox = process.env.MERCADO_PAGO_SANDBOX;
  const previousVercelEnv = process.env.VERCEL_ENV;
  process.env.VERCEL_ENV = "preview";
  process.env.MERCADO_PAGO_SANDBOX = "false";
  resetMocks();
  t.after(() => restoreSandbox(previousSandbox));
  t.after(() => restoreVercelEnv(previousVercelEnv));

  const response = await POST(orderRequest());

  assert.equal(response.status, 201);
  assert.equal(globalThis.__orderRouteMocks.persistenceInputs[0].amountInCents, 149_900);
  assert.deepEqual(globalThis.__orderRouteMocks.providerInputs[0].body.payer, {
    email: "comprador@exemplo.com",
  });
});

test("Production com sandbox=false mantém preço e payer reais", async (t) => {
  const previousSandbox = process.env.MERCADO_PAGO_SANDBOX;
  const previousVercelEnv = process.env.VERCEL_ENV;
  process.env.VERCEL_ENV = "production";
  process.env.MERCADO_PAGO_SANDBOX = "false";
  resetMocks();
  t.after(() => restoreSandbox(previousSandbox));
  t.after(() => restoreVercelEnv(previousVercelEnv));

  const response = await POST(orderRequest());

  assert.equal(response.status, 201);
  assert.equal(globalThis.__orderRouteMocks.persistenceInputs[0].amountInCents, 149_900);
  assert.deepEqual(globalThis.__orderRouteMocks.providerInputs[0].body.payer, {
    email: "comprador@exemplo.com",
  });
});
