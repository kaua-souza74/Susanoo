import assert from "node:assert/strict";
import { registerHooks } from "node:module";
import test from "node:test";

registerHooks({
  resolve(specifier, context, nextResolve) {
    if (specifier === "server-only") {
      return { shortCircuit: true, url: "mock:server-only" };
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

const {
  MercadoPagoOrderHttpError,
  createMercadoPagoOrder,
} = await import("../src/lib/mercadopago/server.ts");

const cardToken = "card-token-sensitive-1234567890";
const documentNumber = "12345678909";

test("cliente Preview preserva payload e extrai erro real de Orders", async (t) => {
  const previousVercelEnv = process.env.VERCEL_ENV;
  const previousAccessToken = process.env.MERCADO_PAGO_ORDERS_ACCESS_TOKEN;
  process.env.VERCEL_ENV = "preview";
  process.env.MERCADO_PAGO_ORDERS_ACCESS_TOKEN = "server-access-token-sensitive";

  const fetchMock = t.mock.method(globalThis, "fetch", async (_url, init) => {
    assert.equal(init.headers["X-Idempotency-Key"], "persisted-idempotency-key");
    const sentBody = JSON.parse(init.body);
    assert.equal(sentBody.transactions.payments[0].payment_method.token, cardToken);
    assert.equal(sentBody.payer.identification.number, documentNumber);

    return new Response(JSON.stringify({
      code: "invalid_card_token",
      message: "Card token is invalid",
      details: [
        {
          code: "invalid_field",
          field: "transactions.payments.0.payment_method.token",
          message: "Invalid token",
          authorization: "must-not-be-retained",
          received_value: cardToken,
          document: documentNumber,
        },
      ],
      raw_payload: { authorization: "must-not-be-retained" },
    }), {
      status: 400,
      headers: { "x-request-id": "mp-request-id-123" },
    });
  });

  t.after(() => {
    if (previousVercelEnv === undefined) delete process.env.VERCEL_ENV;
    else process.env.VERCEL_ENV = previousVercelEnv;
    if (previousAccessToken === undefined) {
      delete process.env.MERCADO_PAGO_ORDERS_ACCESS_TOKEN;
    } else {
      process.env.MERCADO_PAGO_ORDERS_ACCESS_TOKEN = previousAccessToken;
    }
  });

  const input = {
    body: {
      type: "online",
      processing_mode: "automatic",
      total_amount: "50.00",
      payer: {
        email: "buyer@example.com",
        identification: { type: "CPF", number: documentNumber },
      },
      transactions: {
        payments: [{
          amount: "50.00",
          payment_method: {
            id: "visa",
            type: "credit_card",
            token: cardToken,
            installments: 1,
          },
        }],
      },
    },
    requestOptions: { idempotencyKey: "persisted-idempotency-key" },
  };

  await assert.rejects(
    createMercadoPagoOrder(input),
    (error) => {
      assert.ok(error instanceof MercadoPagoOrderHttpError);
      assert.equal(error.status, 400);
      assert.equal(error.errorCode, "invalid_card_token");
      assert.equal(error.message, "Card token is invalid");
      assert.equal(error.requestId, "mp-request-id-123");
      assert.deepEqual(error.details, [{
        code: "invalid_field",
        field: "transactions.payments.0.payment_method.token",
        message: "Invalid token",
      }]);
      assert.doesNotMatch(JSON.stringify(error), new RegExp(cardToken));
      assert.doesNotMatch(JSON.stringify(error), new RegExp(documentNumber));
      assert.doesNotMatch(JSON.stringify(error), /authorization/i);
      return true;
    },
  );

  assert.equal(fetchMock.mock.callCount(), 1);
  assert.equal(fetchMock.mock.calls[0].arguments[0], "https://api.mercadopago.com/v1/orders");
});
