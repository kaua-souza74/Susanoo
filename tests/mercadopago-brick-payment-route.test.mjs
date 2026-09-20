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
const deviceSessionId = "device-session-sensitive-1234567890";

globalThis.__brickRouteMocks = {
  authenticatedPayer: {
    userId: "user-test",
    email: "comprador@exemplo.com",
  },
  paymentOrder: null,
  paymentOrders: new Map(),
  persistenceInputs: [],
  createInputs: [],
  getInputs: [],
  syncInputs: [],
  paymentMethodChecks: [],
  availablePaymentMethods: new Set([
    "visa:credit_card",
    "master:credit_card",
    "debelo:debit_card",
  ]),
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
            let order = globalThis.__brickRouteMocks.paymentOrders.get(input.checkoutSessionId);
            if (!order) {
              order = {
                id: "local-brick-order-" + input.checkoutSessionId,
                userId: input.userId,
                serviceId: input.serviceId,
                amountInCents: input.amountInCents,
                currency: "BRL",
                providerOrderId: null,
                externalReference: "SUS-brick-reference",
                checkoutSessionId: input.checkoutSessionId,
                idempotencyKey:
                  input.checkoutSessionId === "018f47a2-4d7e-7c31-8a5b-11c2df98a120"
                    ? "persisted-brick-idempotency-key"
                    : "persisted-" + input.checkoutSessionId,
                paymentMethod: input.paymentMethod,
                status: "pending",
                providerStatus: null,
                statusDetail: null,
                approvedAt: null,
              };
              globalThis.__brickRouteMocks.paymentOrders.set(
                input.checkoutSessionId,
                order,
              );
            }
            globalThis.__brickRouteMocks.paymentOrder = order;
            return order;
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
            globalThis.__brickRouteMocks.paymentOrders.set(
              order.checkoutSessionId,
              globalThis.__brickRouteMocks.paymentOrder,
            );
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
          export async function isMercadoPagoCardPaymentMethodAvailable(id, type) {
            globalThis.__brickRouteMocks.paymentMethodChecks.push({ id, type });
            return globalThis.__brickRouteMocks.availablePaymentMethods.has(id + ":" + type);
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
const { MPPaymentError } = await import("mercadopago");

function brickRequest({
  serviceId = "site-institucional",
  amount = 50,
  installments = 1,
  token = cardToken,
  email = "titular@pagador.com",
  identification = { type: "CPF", number: documentNumber },
  paymentMethodId = "visa",
  paymentTypeId = "credit_card",
  issuerId = "310",
  sessionId = checkoutSessionId,
  deviceId = deviceSessionId,
} = {}) {
  return new Request("https://example.test/api/mercadopago/brick/payment", {
    method: "POST",
    headers: {
      authorization: "Bearer authenticated-test-session",
      "content-type": "application/json",
    },
    body: JSON.stringify({
      serviceId,
      checkoutSessionId: sessionId,
      ...(deviceId === null ? {} : { deviceSessionId: deviceId }),
      formData: {
        payment_method_id: paymentMethodId,
        payment_type_id: paymentTypeId,
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
  globalThis.__brickRouteMocks.paymentOrders.clear();
  globalThis.__brickRouteMocks.persistenceInputs.length = 0;
  globalThis.__brickRouteMocks.createInputs.length = 0;
  globalThis.__brickRouteMocks.getInputs.length = 0;
  globalThis.__brickRouteMocks.syncInputs.length = 0;
  globalThis.__brickRouteMocks.paymentMethodChecks.length = 0;
  globalThis.__brickRouteMocks.availablePaymentMethods = new Set([
    "visa:credit_card",
    "master:credit_card",
    "debelo:debit_card",
  ]);
  globalThis.__brickRouteMocks.providerError = null;
}

function restoreSandbox(value) {
  if (value === undefined) delete process.env.MERCADO_PAGO_SANDBOX;
  else process.env.MERCADO_PAGO_SANDBOX = value;
}

function restoreVercelEnv(value) {
  if (value === undefined) delete process.env.VERCEL_ENV;
  else process.env.VERCEL_ENV = value;
}

test("cartão interno bloqueia cliente comum antes de criar registro ou Order", async (t) => {
  const previousEnv = process.env.VERCEL_ENV;
  process.env.VERCEL_ENV = "production";
  t.after(() => restoreVercelEnv(previousEnv));
  resetMocks();
  const response = await POST(brickRequest({ serviceId: "internal-production-test" }));
  assert.equal(response.status, 403);
  assert.equal(globalThis.__brickRouteMocks.persistenceInputs.length, 0);
  assert.equal(globalThis.__brickRouteMocks.createInputs.length, 0);
});

test("cartão interno autorizado ignora amount adulterado e usa o fluxo Orders de 100 cents", async (t) => {
  const previousEnv = process.env.VERCEL_ENV;
  process.env.VERCEL_ENV = "production";
  t.after(() => restoreVercelEnv(previousEnv));
  resetMocks();
  globalThis.__brickRouteMocks.authenticatedPayer.userId = "dd69d348-16b5-4ff8-9bdb-619126c6a734";
  const response = await POST(brickRequest({ serviceId: "internal-production-test", amount: 0.01 }));
  assert.equal(response.status, 201);
  assert.equal(globalThis.__brickRouteMocks.persistenceInputs[0].amountInCents, 100);
  const input = globalThis.__brickRouteMocks.createInputs[0];
  assert.equal(input.body.total_amount, "1.00");
  assert.equal(input.body.transactions.payments[0].amount, "1.00");
  assert.equal(input.requestOptions.idempotencyKey, "persisted-brick-idempotency-key");
  assert.equal(input.requestOptions.meliSessionId, deviceSessionId);
  assert.equal(input.body.payer.email, "titular@pagador.com");
});

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
  const previousVercelEnv = process.env.VERCEL_ENV;
  process.env.VERCEL_ENV = "preview";
  process.env.MERCADO_PAGO_SANDBOX = "true";
  resetMocks();
  t.after(() => restoreSandbox(previousSandbox));
  t.after(() => restoreVercelEnv(previousVercelEnv));

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
  assert.equal(providerInput.body.payer.email, "test@testuser.com");
  assert.equal(providerInput.body.payer.first_name, undefined);
  assert.equal(providerInput.requestOptions.idempotencyKey, "persisted-brick-idempotency-key");
  const payload = await response.json();
  assert.equal(payload.paymentMethod, "card");
});

test("modo normal usa email do pagador validado pelo Brick sem alterar ownership", async () => {
  resetMocks();

  const response = await POST(
    brickRequest({ email: "  Comprador+Brick@Example.COM  " }),
  );

  assert.equal(response.status, 201);
  assert.equal(
    globalThis.__brickRouteMocks.createInputs[0].body.payer.email,
    "comprador+brick@example.com",
  );
  assert.equal(globalThis.__brickRouteMocks.persistenceInputs[0].userId, "user-test");
});

test("sandbox card não permite sobrescrever o email de teste", async (t) => {
  const previousSandbox = process.env.MERCADO_PAGO_SANDBOX;
  const previousVercelEnv = process.env.VERCEL_ENV;
  process.env.VERCEL_ENV = "preview";
  process.env.MERCADO_PAGO_SANDBOX = "true";
  resetMocks();
  t.after(() => restoreSandbox(previousSandbox));
  t.after(() => restoreVercelEnv(previousVercelEnv));

  const response = await POST(
    brickRequest({ email: "tentativa-de-override@example.com" }),
  );

  assert.equal(response.status, 201);
  assert.equal(
    globalThis.__brickRouteMocks.createInputs[0].body.payer.email,
    "test@testuser.com",
  );
});

test("Production ignora sandbox=true e usa preço real e email do Brick", async (t) => {
  const previousSandbox = process.env.MERCADO_PAGO_SANDBOX;
  const previousVercelEnv = process.env.VERCEL_ENV;
  process.env.VERCEL_ENV = "production";
  process.env.MERCADO_PAGO_SANDBOX = "true";
  resetMocks();
  t.after(() => restoreSandbox(previousSandbox));
  t.after(() => restoreVercelEnv(previousVercelEnv));

  const response = await POST(brickRequest({ email: "override@example.com" }));

  assert.equal(response.status, 201);
  const providerInput = globalThis.__brickRouteMocks.createInputs[0];
  assert.equal(providerInput.body.total_amount, "1499.00");
  assert.equal(providerInput.body.payer.email, "override@example.com");
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
    has_device_session_id: true,
    has_identification: true,
    has_payer_email: true,
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
  assert.doesNotMatch(serializedLogs, new RegExp(deviceSessionId));
  assert.doesNotMatch(serializedLogs, /titular@pagador\.com/i);
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
  assert.doesNotMatch(serializedLogs, new RegExp(deviceSessionId));
  assert.doesNotMatch(serializedLogs, /titular@pagador\.com/i);
  assert.match(serializedLogs, /"payment_method_id":"visa"/);
  assert.match(serializedLogs, /"provider_id":"ORD01JQ4S4KY8HWQ6NA5PXB65B3D3"/);
});

test("Device ID opcional é encaminhado ao SDK sem alterar idempotência", async () => {
  resetMocks();

  const response = await POST(brickRequest());

  assert.equal(response.status, 201);
  const requestOptions = globalThis.__brickRouteMocks.createInputs[0].requestOptions;
  assert.equal(requestOptions.meliSessionId, deviceSessionId);
  assert.equal(requestOptions.idempotencyKey, "persisted-brick-idempotency-key");
});

test("ausência de Device ID não bloqueia o pagamento", async () => {
  resetMocks();

  const response = await POST(brickRequest({ deviceId: null }));

  assert.equal(response.status, 201);
  assert.equal(
    globalThis.__brickRouteMocks.createInputs[0].requestOptions.meliSessionId,
    undefined,
  );
});

test("Device ID com tipo inválido é rejeitado antes da Orders API", async () => {
  resetMocks();

  const response = await POST(brickRequest({ deviceId: { value: "invalid" } }));

  assert.equal(response.status, 400);
  assert.equal(globalThis.__brickRouteMocks.createInputs.length, 0);
});

test("Brick exige email do pagador antes de criar registro ou Order", async () => {
  resetMocks();

  const response = await POST(brickRequest({ email: null }));

  assert.equal(response.status, 400);
  assert.equal(globalThis.__brickRouteMocks.persistenceInputs.length, 0);
  assert.equal(globalThis.__brickRouteMocks.createInputs.length, 0);
});

test("titular diferente do usuário autenticado preserva owner e documento do Brick", async () => {
  resetMocks();
  const titularDocument = "98765432100";

  const response = await POST(
    brickRequest({
      email: "titular.cartao@example.com",
      identification: { type: "CPF", number: titularDocument },
    }),
  );

  assert.equal(response.status, 201);
  assert.equal(globalThis.__brickRouteMocks.persistenceInputs[0].userId, "user-test");
  const providerPayer = globalThis.__brickRouteMocks.createInputs[0].body.payer;
  assert.equal(providerPayer.email, "titular.cartao@example.com");
  assert.deepEqual(providerPayer.identification, {
    type: "CPF",
    number: titularDocument,
  });
});

test("Device ID com caractere de controle é rejeitado", async () => {
  resetMocks();

  const response = await POST(brickRequest({ deviceId: "device\u0000session" }));

  assert.equal(response.status, 400);
  assert.equal(globalThis.__brickRouteMocks.createInputs.length, 0);
});

test("Device ID acima do limite é rejeitado", async () => {
  resetMocks();

  const response = await POST(brickRequest({ deviceId: "d".repeat(257) }));

  assert.equal(response.status, 400);
  assert.equal(globalThis.__brickRouteMocks.createInputs.length, 0);
});

test("nova sessão após rejeição preserva a tentativa antiga e cria nova Order", async () => {
  resetMocks();

  const firstResponse = await POST(brickRequest());
  const firstOrder = globalThis.__brickRouteMocks.paymentOrder;
  const nextSessionId = "118f47a2-4d7e-7c31-8a5b-11c2df98a121";
  const secondResponse = await POST(brickRequest({ sessionId: nextSessionId }));

  assert.equal(firstResponse.status, 201);
  assert.equal(secondResponse.status, 201);
  assert.equal(globalThis.__brickRouteMocks.createInputs.length, 2);
  assert.equal(globalThis.__brickRouteMocks.paymentOrders.size, 2);
  assert.equal(
    globalThis.__brickRouteMocks.paymentOrders.get(checkoutSessionId),
    firstOrder,
  );
  assert.notEqual(
    globalThis.__brickRouteMocks.createInputs[0].requestOptions.idempotencyKey,
    globalThis.__brickRouteMocks.createInputs[1].requestOptions.idempotencyKey,
  );
});

test("cartão de débito suportado preserva o tipo real na Order", async () => {
  resetMocks();

  const response = await POST(brickRequest({
    paymentMethodId: "debelo",
    paymentTypeId: "debit_card",
    installments: 1,
  }));

  assert.equal(response.status, 201);
  assert.deepEqual(globalThis.__brickRouteMocks.paymentMethodChecks[0], {
    id: "debelo",
    type: "debit_card",
  });
  assert.equal(
    globalThis.__brickRouteMocks.createInputs[0].body.transactions.payments[0]
      .payment_method.type,
    "debit_card",
  );
});

test("tipo arbitrário é rejeitado antes de consultar ou criar Order", async () => {
  resetMocks();

  const response = await POST(brickRequest({ paymentTypeId: "bitcoin" }));

  assert.equal(response.status, 400);
  assert.equal(globalThis.__brickRouteMocks.paymentMethodChecks.length, 0);
  assert.equal(globalThis.__brickRouteMocks.persistenceInputs.length, 0);
  assert.equal(globalThis.__brickRouteMocks.createInputs.length, 0);
});

test("combinação de método e tipo manipulada é rejeitada pelo catálogo do provider", async () => {
  resetMocks();

  const response = await POST(brickRequest({
    paymentMethodId: "master",
    paymentTypeId: "debit_card",
  }));

  assert.equal(response.status, 400);
  assert.deepEqual(globalThis.__brickRouteMocks.paymentMethodChecks[0], {
    id: "master",
    type: "debit_card",
  });
  assert.equal(globalThis.__brickRouteMocks.persistenceInputs.length, 0);
  assert.equal(globalThis.__brickRouteMocks.createInputs.length, 0);
});

test("débito não aceita parcelamento de crédito", async () => {
  resetMocks();

  const response = await POST(brickRequest({
    paymentMethodId: "debelo",
    paymentTypeId: "debit_card",
    installments: 2,
  }));

  assert.equal(response.status, 400);
  assert.equal(globalThis.__brickRouteMocks.paymentMethodChecks.length, 0);
  assert.equal(globalThis.__brickRouteMocks.createInputs.length, 0);
});

test("SDK 402 error is classified without relying on a minified name", async (t) => {
  resetMocks();
  const errorLog = t.mock.method(console, "error", () => {});
  t.mock.method(console, "info", () => {});
  globalThis.__brickRouteMocks.providerError = new MPPaymentError({
    status: 402,
    message: "MercadoPago API error",
    error: "",
    cause: [],
  });

  const response = await POST(brickRequest());

  assert.equal(response.status, 502);
  const entry = JSON.parse(errorLog.mock.calls[0].arguments[0]);
  assert.equal(entry.error_name, "MPPaymentError");
  assert.equal(entry.http_status, 402);
  assert.equal(entry.response_body, null);
  assert.equal(entry.mercadopago_request_id, null);
  assert.deepEqual(entry.sdk_fields_present, [
    "status",
    "message",
    "error",
    "causes",
  ]);
});

test("logger allowlists response data and redacts sensitive values", async (t) => {
  resetMocks();
  const errorLog = t.mock.method(console, "error", () => {});
  t.mock.method(console, "info", () => {});
  const providerError = new MPPaymentError({
    status: 402,
    message: `Rejected ${cardToken} for comprador@exemplo.com`,
    error: "payment_required",
    cause: [{
      code: "cc_rejected_other_reason",
      description: `CPF ${documentNumber}; CVV 123`,
    }],
  });
  Object.assign(providerError, {
    response: {
      status: 402,
      headers: { "x-request-id": ["mp-request-id-safe"] },
      data: {
        id: "ORD01SAFE",
        status: "failed",
        status_detail: "cc_rejected_other_reason",
        message: `Rejected ${cardToken}`,
        payer: { email: "comprador@exemplo.com" },
        authorization: "must-not-be-logged",
        transactions: {
          payments: [{
            id: "PAY01SAFE",
            status: "rejected",
            status_detail: "cc_rejected_other_reason",
            payment_method: {
              id: "master",
              token: cardToken,
              security_code: "123",
            },
          }],
        },
      },
    },
  });
  globalThis.__brickRouteMocks.providerError = providerError;

  const response = await POST(brickRequest());

  assert.equal(response.status, 502);
  const entry = JSON.parse(errorLog.mock.calls[0].arguments[0]);
  assert.equal(entry.error_name, "MPPaymentError");
  assert.equal(entry.http_status, 402);
  assert.equal(entry.provider_status, "failed");
  assert.equal(entry.provider_status_detail, "cc_rejected_other_reason");
  assert.equal(entry.mercadopago_request_id, "mp-request-id-safe");
  assert.deepEqual(entry.response_body.payments, [{
    id: "PAY01SAFE",
    status: "rejected",
    status_detail: "cc_rejected_other_reason",
    payment_method_id: "master",
  }]);
  const serialized = JSON.stringify(entry);
  assert.doesNotMatch(serialized, new RegExp(cardToken));
  assert.doesNotMatch(serialized, new RegExp(documentNumber));
  assert.doesNotMatch(serialized, /comprador@exemplo\.com/);
  assert.doesNotMatch(serialized, /must-not-be-logged/);
  assert.doesNotMatch(serialized, /authorization|security_code/i);
  assert.match(serialized, /\[redacted\]/);
  assert.match(serialized, /\[redacted-security-code\]/);
});
