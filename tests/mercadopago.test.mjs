import assert from "node:assert/strict";
import { createHmac } from "node:crypto";
import test from "node:test";

import {
  InvalidWebhookSignatureError,
  WebhookSignatureValidator,
} from "mercadopago";
import { parseOrderRequest } from "../src/lib/mercadopago/order-input.ts";
import {
  canApplyPaymentStatus,
  normalizeMercadoPagoStatus,
} from "../src/lib/mercadopago/status.ts";
import {
  parseOrderWebhookNotification,
} from "../src/lib/mercadopago/webhook.ts";

const checkoutSessionId = "018f47a2-4d7e-7c31-8a5b-11c2df98a120";
const providerOrderId = "ORD01JQ4S4KY8HWQ6NA5PXB65B3D3";

test("normaliza os estados conhecidos e mantém desconhecidos como pending", () => {
  assert.equal(normalizeMercadoPagoStatus("processed", "accredited"), "approved");
  assert.equal(normalizeMercadoPagoStatus("failed", "failed"), "rejected");
  assert.equal(normalizeMercadoPagoStatus("expired", "expired"), "cancelled");
  assert.equal(normalizeMercadoPagoStatus("refunded", "refunded"), "refunded");
  assert.equal(normalizeMercadoPagoStatus("future_status", "new_detail"), "pending");
});

test("repetição de status é idempotente e não regride estado terminal", () => {
  assert.equal(canApplyPaymentStatus("pending", "approved"), true);
  assert.equal(canApplyPaymentStatus("approved", "approved"), true);
  assert.equal(canApplyPaymentStatus("approved", "pending"), false);
  assert.equal(canApplyPaymentStatus("approved", "refunded"), true);
  assert.equal(canApplyPaymentStatus("rejected", "approved"), false);
});

test("aceita somente identificadores seguros na criação da order", () => {
  const validPayload = JSON.stringify({
    serviceId: "site-institucional",
    paymentMethod: "pix",
    checkoutSessionId,
  });

  assert.deepEqual(parseOrderRequest(validPayload), {
    serviceId: "site-institucional",
    paymentMethod: "pix",
    checkoutSessionId,
  });
  assert.equal(
    parseOrderRequest(
      JSON.stringify({
        serviceId: "site-institucional",
        paymentMethod: "pix",
        checkoutSessionId,
        amount: 1,
      }),
    ),
    null,
  );
  assert.equal(
    parseOrderRequest(
      JSON.stringify({
        serviceId: "inexistente",
        paymentMethod: "pix",
        checkoutSessionId: "not-a-uuid",
      }),
    ),
    null,
  );
});

test("rejeita webhook com assinatura inválida", () => {
  assert.throws(
    () =>
      WebhookSignatureValidator.validate({
        xSignature: "ts=1700000000,v1=invalid",
        xRequestId: "request-1",
        dataId: providerOrderId,
        secret: "test-secret",
      }),
    InvalidWebhookSignatureError,
  );
});

test("aceita assinatura válida e parser é idempotente para webhook repetido", () => {
  const secret = "test-secret";
  const requestId = "request-1";
  const timestamp = "1700000000";
  const manifest = `id:${providerOrderId};request-id:${requestId};ts:${timestamp};`;
  const signature = createHmac("sha256", secret).update(manifest).digest("hex");

  WebhookSignatureValidator.validate({
    xSignature: `ts=${timestamp},v1=${signature}`,
    xRequestId: requestId,
    dataId: providerOrderId,
    secret,
  });

  const rawBody = JSON.stringify({ type: "order", data: { id: providerOrderId } });
  const first = parseOrderWebhookNotification(rawBody, providerOrderId);
  const repeated = parseOrderWebhookNotification(rawBody, providerOrderId);
  assert.deepEqual(first, repeated);
  assert.equal(
    parseOrderWebhookNotification(
      rawBody,
      "ORD01JQ4S4KY8HWQ6NA5PXB65OTHER",
    ),
    null,
  );
});
