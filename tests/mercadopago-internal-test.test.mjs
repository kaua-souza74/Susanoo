import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import { registerHooks } from "node:module";
import path from "node:path";
import test from "node:test";
import { fileURLToPath, pathToFileURL } from "node:url";

const root = path.resolve(import.meta.dirname, "..");
const authorizedUserId = "dd69d348-16b5-4ff8-9bdb-619126c6a734";
globalThis.__internalTestPayer = null;

registerHooks({
  resolve(specifier, context, nextResolve) {
    if (specifier === "server-only") return { shortCircuit: true, url: "mock:server-only" };
    if (specifier === "next/server") return nextResolve("next/server.js", context);
    if (specifier === "@/lib/mercadopago/auth") return { shortCircuit: true, url: "mock:internal-auth" };
    if (specifier.startsWith("@/")) {
      return nextResolve(pathToFileURL(path.join(root, "src", `${specifier.slice(2)}.ts`)).href, context);
    }
    if (specifier.startsWith(".") && context.parentURL?.startsWith("file:")) {
      const candidate = new URL(`${specifier}.ts`, context.parentURL);
      if (existsSync(fileURLToPath(candidate))) return nextResolve(candidate.href, context);
    }
    return nextResolve(specifier, context);
  },
  load(url, context, nextLoad) {
    if (url === "mock:server-only") return { format: "module", shortCircuit: true, source: "export {};" };
    if (url === "mock:internal-auth") return {
      format: "module", shortCircuit: true,
      source: "export async function getAuthenticatedPayer() { return globalThis.__internalTestPayer; }",
    };
    return nextLoad(url, context);
  },
});

const { services, getServiceById, isServiceId } = await import("../src/lib/mercadopago/services.ts");
const { canPurchaseService } = await import("../src/lib/mercadopago/service-access.ts");
const { GET } = await import("../src/app/api/mercadopago/internal-test/route.ts");

function production(t) {
  const previousEnv = process.env.VERCEL_ENV;
  process.env.VERCEL_ENV = "production";
  t.after(() => {
    if (previousEnv === undefined) delete process.env.VERCEL_ENV;
    else process.env.VERCEL_ENV = previousEnv;
    globalThis.__internalTestPayer = null;
  });
}

const request = () => new Request("https://example.test/api/mercadopago/internal-test");

test("catálogo público exclui o item interno e preserva preço oficial", () => {
  assert.equal(getServiceById("internal-production-test").priceInCents, 100);
  assert.equal(getServiceById("site-institucional").priceInCents, 149900);
  assert.deepEqual(Object.keys(services), ["site-institucional"]);
  assert.equal(isServiceId("internal-production-test"), true);
  assert.equal(isServiceId("constructor"), false);
});

test("autorização interna é server-only, por UUID verificado, e restrita a Production", (t) => {
  production(t);
  assert.equal(canPurchaseService("internal-production-test", authorizedUserId), true);
  assert.equal(canPurchaseService("internal-production-test", "normal-user"), false);
  for (const environment of ["preview", "development", ""]) {
    process.env.VERCEL_ENV = environment;
    assert.equal(canPurchaseService("internal-production-test", authorizedUserId), false);
  }
  const source = readFileSync(path.join(root, "src/lib/mercadopago/service-access.ts"), "utf8");
  assert.match(source, /import "server-only"/);
  assert.doesNotMatch(source, /user_metadata\s*\./);
});

test("configuração interna sem autenticação retorna 401", async (t) => {
  production(t);
  globalThis.__internalTestPayer = null;
  assert.equal((await GET(request())).status, 401);
});

test("configuração interna para cliente comum retorna 403 e não expõe produto", async (t) => {
  production(t);
  globalThis.__internalTestPayer = { userId: "normal-user" };
  const response = await GET(request());
  assert.equal(response.status, 403);
  assert.doesNotMatch(JSON.stringify(await response.json()), /amountInCents|formattedPrice/);
});

test("configuração interna autorizada retorna R$ 1 e não cria pagamento", async (t) => {
  production(t);
  globalThis.__internalTestPayer = { userId: authorizedUserId };
  const response = await GET(request());
  assert.equal(response.status, 200);
  assert.equal(response.headers.get("cache-control"), "private, no-store");
  const body = await response.json();
  assert.equal(body.id, "internal-production-test");
  assert.equal(body.amountInCents, 100);
  assert.equal(body.isSandbox, false);
  assert.equal(body.sessionScope, "catalog-100");
  assert.doesNotMatch(JSON.stringify(body), new RegExp(authorizedUserId));
  const source = readFileSync(path.join(root, "src/app/api/mercadopago/internal-test/route.ts"), "utf8");
  assert.doesNotMatch(source, /getOrCreatePaymentOrder|createMercadoPagoOrder|OrderClient|console\./);
});

test("Preview não expõe configuração do teste real nem modifica sandbox", async (t) => {
  production(t);
  process.env.VERCEL_ENV = "preview";
  globalThis.__internalTestPayer = { userId: authorizedUserId };
  assert.equal((await GET(request())).status, 403);
});

test("checkout interno usa o checkout existente sem submit automático e tem noindex", () => {
  const source = readFileSync(path.join(root, "src/app/checkout/internal-production-test/internal-checkout.tsx"), "utf8");
  const page = readFileSync(path.join(root, "src/app/checkout/internal-production-test/page.tsx"), "utf8");
  assert.match(source, /<CheckoutExperience service=\{service\}/);
  assert.doesNotMatch(source, /method:\s*"POST"|\/brick\/payment|\/mercadopago\/order/);
  assert.match(page, /robots: \{ index: false, follow: false \}/);
  const checkout = readFileSync(path.join(root, "src/app/checkout/checkout-experience.tsx"), "utf8");
  assert.match(checkout, /value\.serviceId === expectedServiceId/);
  assert.equal((checkout.match(/isPixOrderResponse\(payload, service\.id\)/g) ?? []).length, 2);
});
