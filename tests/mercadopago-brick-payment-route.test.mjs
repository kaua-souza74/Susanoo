import assert from "node:assert/strict";
import { existsSync } from "node:fs";
import { registerHooks } from "node:module";
import path from "node:path";
import test from "node:test";
import { fileURLToPath, pathToFileURL } from "node:url";

const projectRoot = path.resolve(import.meta.dirname, "..");
const checkoutSessionId = "018f47a2-4d7e-7c31-8a5b-11c2df98a120";
const cardToken = "card-token-sensitive-1234567890";
const documentNumber = "12345678909";

globalThis.__brickRouteMocks = {
  authenticatedPayer: {
    userId: "user-test",
    email: "comprador@exemplo.com",
  },
  paymentOrder: null,
  persistenceInputs: [],
  createInputs: [],
  getInputs: [],
  syncInputs: [],
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
    if (specifier === "@/lib/mercadopago/auth") {
      return { shortCircuit: true, url: "mock:brick-auth" };
    }
    if (specifier === "@/lib/mercadopago/payment-orders") {
      return { shortCircuit: true, url: "mock:brick-payment-orders" };
    }
    if (specifier === "@/lib/mercadopago/server") {
      return { shortCircuit: true, url: "mock:brick-server" };
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
    if (url === "mock:brick-auth") {
      return {
        format: "module",
        shortCircuit: true,
        source: `export async function getAuthenticatedPayer() {
          return globalThis.__brickRouteMocks.authenticatedPayer;
        }`,
      };
    }
    if (url === "mock:brick-payment-orders") {
      return {
        format: "module",
        shortCircuit: true,
        source: `
          export class PaymentOrderMismatchError extends Error {}
          export class PaymentOrderPersistenceError extends Error {}
          export async function getOrCreatePaymentOrder(input) {
            globalThis.__brickRouteMocks.persistenceInputs.push(input);
            if (!globalThis.__brickRouteMocks.paymentOrder) {
              globalThis.__brickRouteMocks.paymentOrder = {
                id: "local-brick-order",
                userId: input.userId,
                serviceId: input.serviceId,
                amountInCents: input.amountInCents,
                currency: "BRL",
                providerOrderId: null,
                externalReference: "SUS-brick-reference",
                checkoutSessionId: input.checkoutSessionId,
                idempotencyKey: "persisted-brick-idempotency-key",
                paymentMethod: input.paymentMethod,
                status: "pending",
                providerStatus: null,
                statusDetail: null,
                approvedAt: null,
              };
            }
            return globalThis.__brickRouteMocks.paymentOrder;
          }
          export async function syncPaymentOrderFromProvider(order, snapshot) {
            globalThis.__brickRouteMocks.syncInputs.push({ order, snapshot });
            globalThis.__brickRouteMocks.paymentOrder = {
              ...order,
              providerOrderId: snapshot.providerOrderId,
              status: snapshot.status,
              providerStatus: snapshot.providerStatus,
              statusDetail: snapshot.providerStatusDetail,
            };
            return globalThis.__brickRouteMocks.paymentOrder;
          }
        `,
      };
    }
    if (url === "mock:brick-server") {
      return {
        format: "module",
        shortCircuit: true,
        source: `
          export class MercadoPagoConfigurationError extends Error {}
          export class MercadoPagoOrderHttpError extends Error {
            constructor({ status, errorCode, message, details, requestId }) {
              super(message);
              this.name = "MercadoPagoOrderHttpError";
              this.status = status;
              this.errorCode = errorCode;
              this.details = details;
              this.requestId = requestId;
            }
          }
          globalThis.__brickRouteMocks.makeOrderHttpError = (args) => new MercadoPagoOrderHttpError(args);
          function providerResponse() {
            const order = globalThis.__brickRouteMocks.paymentOrder;
            return {
              id: "ORD01JQ4S4KY8HWQ6NA5PXB65B3D3",
              external_reference: order.externalReference,
              status: "processed",
              status_detail: "accredited",
              transactions: { payments: [] },
            };
          }
          export function getMercadoPagoOrderClient() {
            return {
              async get(input) {
                globalThis.__brickRouteMocks.getInputs.push(input);
                if (globalThis.__brickRouteMocks.providerError) {
                  throw globalThis.__brickRouteMocks.providerError;
                }
                return providerResponse();
              },
            };
          }
          export async function createMercadoPagoOrder(input) {
            globalThis.__brickRouteMocks.createInputs.push(input);
            if (globalThis.__brickRouteMocks.providerError) {
              throw globalThis.__brickRouteMocks.providerError;
            }
            return providerResponse();
          }
        `,
      };
    }
    return nextLoad(url, context);
  },
});

const { POST } = await import(
  "../src/app/api/mercadopago/brick/payment/route.ts"
);

function brickRequest({
  amount = 50,
  installments = 1,
  token = cardToken,
  email,
  identification = { type: "CPF", number: documentNumber },
  paymentMethodId = "visa",
  issuerId = "310",
} = {}) {
  return new Request("https://example.test/api/mercadopago/brick/payment", {
    method: "POST",
    headers: {
      authorization: "Bearer authenticated-test-session",
      "content-type": "application/json",
    },
    body: JSON.stringify({
      serviceId: "site-institucional",
      checkoutSessionId,
      formData: {
        payment_method_id: paymentMethodId,
        transaction_amount: amount,
        installments,
        token,
        issuer_id: issuerId,
        payer: {
          email,
          identification,
        },
      },
    }),
  });
}

function resetMocks() {
  globalThis.__brickRouteMocks.authenticatedPayer = {
    userId: "user-test",
    email: "comprador@exemplo.com",
  };
  globalThis.__brickRouteMocks.paymentOrder = null;
  globalThis.__brickRouteMocks.persistenceInputs.length = 0;
  globalThis.__brickRouteMocks.createInputs.length = 0;
  globalThis.__brickRouteMocks.getInputs.length = 0;
  globalThis.__brickRouteMocks.syncInputs.length = 0;
  globalThis.__brickRouteMocks.providerError = null;
}

function restoreSandbox(value) {
  if (value === undefined) delete process.env.MERCADO_PAGO_SANDBOX;
  else process.env.MERCADO_PAGO_SANDBOX = value;
}

test("usuário não autenticado recebe 401", async () => {
  resetMocks();
  globalThis.__brickRouteMocks.authenticatedPayer = null;

  const response = await POST(brickRequest());

  assert.equal(response.status, 401);
  assert.equal(globalThis.__brickRouteMocks.persistenceInputs.length, 0);
  assert.equal(globalThis.__brickRouteMocks.createInputs.length, 0);
});

test("amount adulterado é ignorado e preço sandbox permanece server-side", async (t) => {
  const previousSandbox = process.env.MERCADO_PAGO_SANDBOX;
  process.env.MERCADO_PAGO_SANDBOX = "true";
  resetMocks();
  t.after(() => restoreSandbox(previousSandbox));

  const response = await POST(brickRequest({ amount: 0.01 }));

  assert.equal(response.status, 201);
  assert.equal(globalThis.__brickRouteMocks.persistenceInputs[0].amountInCents, 5_000);
  const providerInput = globalThis.__brickRouteMocks.createInputs[0];
  assert.equal(providerInput.body.type, "online");
  assert.equal(providerInput.body.processing_mode, "automatic");
  assert.equal(providerInput.body.total_amount, "50.00");
  assert.equal(providerInput.body.transactions.payments[0].amount, "50.00");
  assert.deepEqual(providerInput.body.transactions.payments[0].payment_method, {
    id: "visa",
    type: "credit_card",
    token: cardToken,
    installments: 1,
  });
  assert.equal(providerInput.body.payer.email, "comprador@exemplo.com");
  assert.equal(providerInput.body.payer.first_name, undefined);
  assert.equal(providerInput.requestOptions.idempotencyKey, "persisted-brick-idempotency-key");
  const payload = await response.json();
  assert.equal(payload.paymentMethod, "card");
});

test("Brick sanitiza o email informado pelo pagador", async () => {
  resetMocks();

  const response = await POST(
    brickRequest({ email: "  Comprador+Brick@Example.COM  " }),
  );

  assert.equal(response.status, 201);
  assert.equal(
    globalThis.__brickRouteMocks.createInputs[0].body.payer.email,
    "comprador+brick@example.com",
  );
});

test("Brick rejeita email de pagador inválido", async () => {
  resetMocks();

  const response = await POST(brickRequest({ email: "email-invalido" }));

  assert.equal(response.status, 400);
  assert.equal(globalThis.__brickRouteMocks.persistenceInputs.length, 0);
  assert.equal(globalThis.__brickRouteMocks.createInputs.length, 0);
});

test("cartão exige token", async () => {
  resetMocks();

  const response = await POST(brickRequest({ token: null }));

  assert.equal(response.status, 400);
  assert.equal(globalThis.__brickRouteMocks.persistenceInputs.length, 0);
  assert.equal(globalThis.__brickRouteMocks.createInputs.length, 0);
});

test("cartão sem identification retorna 400 antes da Orders API", async () => {
  resetMocks();

  const response = await POST(brickRequest({ identification: null }));

  assert.equal(response.status, 400);
  assert.equal(globalThis.__brickRouteMocks.persistenceInputs.length, 0);
  assert.equal(globalThis.__brickRouteMocks.createInputs.length, 0);
});

test("parcelas fora do limite são rejeitadas", async () => {
  resetMocks();

  const response = await POST(
    brickRequest({ installments: 13 }),
  );

  assert.equal(response.status, 400);
  assert.equal(globalThis.__brickRouteMocks.createInputs.length, 0);
});

test("parcelas menores que 1 são rejeitadas", async () => {
  resetMocks();
  const response = await POST(brickRequest({ installments: 0 }));
  assert.equal(response.status, 400);
  assert.equal(globalThis.__brickRouteMocks.createInputs.length, 0);
});

test("token com formato inválido é rejeitado", async () => {
  resetMocks();
  const response = await POST(brickRequest({ token: "curto" }));
  assert.equal(response.status, 400);
  assert.equal(globalThis.__brickRouteMocks.createInputs.length, 0);
});

test("PIX é rejeitado pelo endpoint exclusivo de cartão", async () => {
  resetMocks();
  const response = await POST(brickRequest({ paymentMethodId: "pix" }));
  assert.equal(response.status, 400);
  assert.equal(globalThis.__brickRouteMocks.createInputs.length, 0);
});

test("issuer_id inválido é rejeitado", async () => {
  resetMocks();
  const response = await POST(brickRequest({ issuerId: "issuer-invalido" }));
  assert.equal(response.status, 400);
  assert.equal(globalThis.__brickRouteMocks.createInputs.length, 0);
});

test("repetição reutiliza idempotency key e não cria novo pagamento", async () => {
  resetMocks();

  const firstResponse = await POST(brickRequest());
  const secondResponse = await POST(brickRequest());

  assert.equal(firstResponse.status, 201);
  assert.equal(secondResponse.status, 200);
  assert.equal(globalThis.__brickRouteMocks.createInputs.length, 1);
  assert.equal(globalThis.__brickRouteMocks.getInputs.length, 1);
  assert.equal(
    globalThis.__brickRouteMocks.createInputs[0].requestOptions.idempotencyKey,
    "persisted-brick-idempotency-key",
  );
  assert.deepEqual(globalThis.__brickRouteMocks.getInputs[0], {
    id: "ORD01JQ4S4KY8HWQ6NA5PXB65B3D3",
  });
});

test("falha da API Mercado Pago retorna erro seguro", async () => {
  resetMocks();
  globalThis.__brickRouteMocks.providerError = new Error("provider failure");

  const response = await POST(brickRequest());

  assert.equal(response.status, 502);
  assert.deepEqual(await response.json(), {
    error: "Não foi possível processar o pagamento.",
  });
});

test("erro 400 de Orders registra somente diagnóstico sanitizado", async (t) => {
  resetMocks();
  const info = t.mock.method(console, "info", () => {});
  const error = t.mock.method(console, "error", () => {});
  globalThis.__brickRouteMocks.providerError = globalThis.__brickRouteMocks.makeOrderHttpError({
    status: 400,
    message: "Payment method is unavailable",
    errorCode: "invalid_payment_method",
    requestId: "mp-request-id-safe",
    details: [
      { code: "1234", field: "transactions.payments.0.payment_method", message: "Invalid payment method" },
    ],
  });

  const response = await POST(brickRequest());

  assert.equal(response.status, 502);
  const requestLog = JSON.parse(info.mock.calls[0].arguments[0]);
  assert.deepEqual(requestLog, {
    route: "/api/mercadopago/brick/payment",
    stage: "brick_payment_request",
    payment_method_id: "visa",
    payment_type_id: "credit_card",
    installments: 1,
    has_token: true,
    amount_cents: 149900,
    sandbox: false,
  });
  const errorLog = JSON.parse(error.mock.calls[0].arguments[0]);
  assert.deepEqual(errorLog, {
    route: "/api/mercadopago/brick/payment",
    stage: "mercadopago_order_error",
    http_status: 400,
    error_code: "invalid_payment_method",
    message: "Payment method is unavailable",
    details: [
      { code: "1234", field: "transactions.payments.0.payment_method", message: "Invalid payment method" },
    ],
    request_id: "mp-request-id-safe",
  });
  const serializedLogs = [...info.mock.calls, ...error.mock.calls]
    .map(({ arguments: values }) => values.join(" "))
    .join("\n");
  assert.doesNotMatch(serializedLogs, new RegExp(cardToken));
  assert.doesNotMatch(serializedLogs, new RegExp(documentNumber));
  assert.doesNotMatch(serializedLogs, /authorization/i);
});

test("cartão usa token sem expor token ou documento nos logs", async (t) => {
  resetMocks();
  const info = t.mock.method(console, "info", () => {});

  const response = await POST(brickRequest());

  assert.equal(response.status, 201);
  const providerBody = globalThis.__brickRouteMocks.createInputs[0].body;
  const paymentMethod = providerBody.transactions.payments[0].payment_method;
  assert.equal(paymentMethod.token, cardToken);
  assert.equal(paymentMethod.installments, 1);
  assert.deepEqual(providerBody.payer.identification, {
    type: "CPF",
    number: documentNumber,
  });
  const serializedLogs = info.mock.calls
    .map(({ arguments: values }) => values.join(" "))
    .join("\n");
  assert.doesNotMatch(serializedLogs, new RegExp(cardToken));
  assert.doesNotMatch(serializedLogs, new RegExp(documentNumber));
  assert.match(serializedLogs, /"payment_method_id":"visa"/);
  assert.match(serializedLogs, /"provider_id":"ORD01JQ4S4KY8HWQ6NA5PXB65B3D3"/);
});
