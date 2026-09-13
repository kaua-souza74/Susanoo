import assert from "node:assert/strict";
import { existsSync } from "node:fs";
import { registerHooks } from "node:module";
import path from "node:path";
import test from "node:test";
import { fileURLToPath, pathToFileURL } from "node:url";
import { MPServerError } from "mercadopago";

const projectRoot = path.resolve(import.meta.dirname, "..");
const diagnosticEmail = "diagnostic@example.com";

globalThis.__pixDiagnosticMocks = {
  createInputs: [],
  providerError: null,
};

registerHooks({
  resolve(specifier, context, nextResolve) {
    if (specifier === "server-only") {
      return { shortCircuit: true, url: "mock:server-only" };
    }
    if (specifier === "next/server") {
      return nextResolve("next/server.js", context);
    }
    if (specifier === "@/lib/mercadopago/server") {
      return { shortCircuit: true, url: "mock:diagnostic-server" };
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
    if (url === "mock:diagnostic-server") {
      return {
        format: "module",
        shortCircuit: true,
        source: `
          export class MercadoPagoConfigurationError extends Error {}
          export function getMercadoPagoPaymentClient() {
            return {
              async create(input) {
                globalThis.__pixDiagnosticMocks.createInputs.push(input);
                if (globalThis.__pixDiagnosticMocks.providerError) {
                  throw globalThis.__pixDiagnosticMocks.providerError;
                }
                return { id: 123456789, status: "pending" };
              },
            };
          }
        `,
      };
    }
    return nextLoad(url, context);
  },
});

const { POST } = await import(
  "../src/app/api/mercadopago/diagnostics/pix-minimal/route.ts"
);

function request(body = { email: diagnosticEmail }) {
  return new Request(
    "https://example.test/api/mercadopago/diagnostics/pix-minimal",
    {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(body),
    },
  );
}

function resetMocks() {
  process.env.VERCEL_ENV = "preview";
  globalThis.__pixDiagnosticMocks.createInputs.length = 0;
  globalThis.__pixDiagnosticMocks.providerError = null;
}

test("rota fica indisponível fora de Preview", async (t) => {
  const previousVercelEnv = process.env.VERCEL_ENV;
  delete process.env.VERCEL_ENV;
  t.after(() => {
    if (previousVercelEnv === undefined) delete process.env.VERCEL_ENV;
    else process.env.VERCEL_ENV = previousVercelEnv;
  });

  const response = await POST(request());

  assert.equal(response.status, 404);
  assert.equal(globalThis.__pixDiagnosticMocks.createInputs.length, 0);
});

test("exige somente email válido", async () => {
  resetMocks();

  const invalid = await POST(request({ email: "invalid" }));
  const extraField = await POST(
    request({ email: diagnosticEmail, amount: 1 }),
  );

  assert.equal(invalid.status, 400);
  assert.equal(extraField.status, 400);
  assert.equal(globalThis.__pixDiagnosticMocks.createInputs.length, 0);
});

test("envia exatamente o payload PIX mínimo com idempotência nova", async (t) => {
  resetMocks();
  const info = t.mock.method(console, "info", () => {});

  const response = await POST(request({ email: `  ${diagnosticEmail.toUpperCase()}  ` }));

  assert.equal(response.status, 201);
  assert.equal(globalThis.__pixDiagnosticMocks.createInputs.length, 1);
  const input = globalThis.__pixDiagnosticMocks.createInputs[0];
  assert.deepEqual(input.body, {
    transaction_amount: 50,
    description: "Susanoo PIX diagnostic",
    payment_method_id: "pix",
    payer: { email: diagnosticEmail },
  });
  assert.match(input.requestOptions.idempotencyKey, /^[0-9a-f-]{36}$/i);
  assert.deepEqual(await response.json(), {
    providerId: "123456789",
    status: "pending",
  });
  assert.doesNotMatch(info.mock.calls[0].arguments[0], /diagnostic@example\.com/i);
});

test("erro Mercado Pago é registrado sem email ou headers", async (t) => {
  resetMocks();
  const errorLog = t.mock.method(console, "error", () => {});
  globalThis.__pixDiagnosticMocks.providerError = new MPServerError({
    status: 500,
    message: "internal_error",
    error: "internal_error",
    cause: [{ code: "internal", description: "Internal error" }],
    headers: { authorization: "Bearer forbidden", "x-request-id": "hidden" },
  });

  const response = await POST(request());

  assert.equal(response.status, 502);
  assert.deepEqual(JSON.parse(errorLog.mock.calls[0].arguments[0]), {
    route: "/api/mercadopago/diagnostics/pix-minimal",
    stage: "mercadopago_error",
    http_status: 500,
    message: "internal_error",
    error: "internal_error",
    causes: [{ code: "internal", description: "Internal error" }],
    mercadopago_request_id: null,
  });
  const serialized = errorLog.mock.calls[0].arguments[0];
  assert.doesNotMatch(serialized, /diagnostic@example\.com/i);
  assert.doesNotMatch(serialized, /authorization|Bearer forbidden|hidden/i);
});
