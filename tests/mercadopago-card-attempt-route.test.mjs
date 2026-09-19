import assert from "node:assert/strict";
import { existsSync } from "node:fs";
import { registerHooks } from "node:module";
import path from "node:path";
import test from "node:test";
import { fileURLToPath, pathToFileURL } from "node:url";

const projectRoot = path.resolve(import.meta.dirname, "..");
const attemptId = "018f47a2-4d7e-7c31-8a5b-11c2df98a120";

globalThis.__attemptRouteMocks = {
  payer: { userId: "owner-user", email: "owner@example.com" },
  paymentOrder: null,
  lookups: [],
};

registerHooks({
  resolve(specifier, context, nextResolve) {
    if (specifier === "server-only") return { shortCircuit: true, url: "mock:server-only" };
    if (specifier === "next/server") return nextResolve("next/server.js", context);
    if (specifier === "@/lib/mercadopago/auth") return { shortCircuit: true, url: "mock:attempt-auth" };
    if (specifier === "@/lib/mercadopago/payment-orders") return { shortCircuit: true, url: "mock:attempt-orders" };
    if (specifier === "@/lib/mercadopago/supabase-admin") return { shortCircuit: true, url: "mock:attempt-admin" };
    if (specifier.startsWith("@/")) {
      return nextResolve(pathToFileURL(path.join(projectRoot, "src", `${specifier.slice(2)}.ts`)).href, context);
    }
    if (specifier.startsWith(".") && context.parentURL?.startsWith("file:")) {
      const candidateUrl = new URL(`${specifier}.ts`, context.parentURL);
      if (existsSync(fileURLToPath(candidateUrl))) return nextResolve(candidateUrl.href, context);
    }
    return nextResolve(specifier, context);
  },
  load(url, context, nextLoad) {
    if (url === "mock:server-only") return { format: "module", shortCircuit: true, source: "export {};" };
    if (url === "mock:attempt-auth") {
      return { format: "module", shortCircuit: true, source: `export async function getAuthenticatedPayer() { return globalThis.__attemptRouteMocks.payer; }` };
    }
    if (url === "mock:attempt-orders") {
      return {
        format: "module",
        shortCircuit: true,
        source: `
          export class PaymentOrderPersistenceError extends Error {}
          export async function findPaymentOrderByCheckoutSession(userId, id) {
            globalThis.__attemptRouteMocks.lookups.push({ userId, id });
            const order = globalThis.__attemptRouteMocks.paymentOrder;
            return order?.userId === userId && order?.checkoutSessionId === id ? order : null;
          }
        `,
      };
    }
    if (url === "mock:attempt-admin") {
      return { format: "module", shortCircuit: true, source: "export class PaymentPersistenceConfigurationError extends Error {};" };
    }
    return nextLoad(url, context);
  },
});

const { GET } = await import("../src/app/api/mercadopago/brick/payment/attempt/[id]/route.ts");

function request() {
  return new Request("https://example.test/api/mercadopago/brick/payment/attempt/id", {
    headers: { authorization: "Bearer test-session" },
  });
}

function context(id = attemptId) {
  return { params: Promise.resolve({ id }) };
}

function reset() {
  globalThis.__attemptRouteMocks.payer = { userId: "owner-user", email: "owner@example.com" };
  globalThis.__attemptRouteMocks.paymentOrder = {
    id: "local-order",
    userId: "owner-user",
    checkoutSessionId: attemptId,
    providerOrderId: "ORD01TEST",
    paymentMethod: "card",
    status: "rejected",
    statusDetail: "failed",
  };
  globalThis.__attemptRouteMocks.lookups.length = 0;
}

test("consulta exige autenticação", async () => {
  reset();
  globalThis.__attemptRouteMocks.payer = null;
  assert.equal((await GET(request(), context())).status, 401);
  assert.equal(globalThis.__attemptRouteMocks.lookups.length, 0);
});

test("usuário consulta somente a própria tentativa e recebe payload mínimo", async () => {
  reset();
  const response = await GET(request(), context());
  assert.equal(response.status, 200);
  assert.deepEqual(await response.json(), {
    localOrderId: "local-order",
    providerId: "ORD01TEST",
    status: "rejected",
    statusDetail: "failed",
    paymentMethod: "card",
  });
  assert.deepEqual(globalThis.__attemptRouteMocks.lookups[0], { userId: "owner-user", id: attemptId });
});

test("checkoutSessionId de outro usuário não é exposto", async () => {
  reset();
  globalThis.__attemptRouteMocks.payer.userId = "other-user";
  const response = await GET(request(), context());
  assert.equal(response.status, 404);
  assert.deepEqual(await response.json(), { error: "Tentativa não encontrada." });
});

test("payload não expõe idempotência, payer ou dados de cartão", async () => {
  reset();
  const response = await GET(request(), context());
  const serialized = JSON.stringify(await response.json());
  assert.doesNotMatch(serialized, /idempotency|email|payer|token|document|card_number|cvv/i);
});
