import assert from "node:assert/strict";
import { existsSync } from "node:fs";
import { registerHooks } from "node:module";
import path from "node:path";
import test from "node:test";
import { fileURLToPath, pathToFileURL } from "node:url";

const projectRoot = path.resolve(import.meta.dirname, "..");
const providerOrderId = "ORD01JQ4S4KY8HWQ6NA5PXB65B3D3";

registerHooks({
  resolve(specifier, context, nextResolve) {
    if (specifier.startsWith(".") && context.parentURL?.startsWith("file:")) {
      const candidateUrl = new URL(`${specifier}.ts`, context.parentURL);
      if (existsSync(fileURLToPath(candidateUrl))) {
        return nextResolve(candidateUrl.href, context);
      }
    }

    return nextResolve(specifier, context);
  },
});

const { extractMercadoPagoOrderSnapshot } = await import(
  pathToFileURL(
    path.join(projectRoot, "src/lib/mercadopago/order-snapshot.ts"),
  ).href
);

test("preserva detalhe transacional específico de cartão rejeitado", () => {
  const snapshot = createOrderSnapshot({
    orderStatus: "failed",
    orderStatusDetail: "failed",
    paymentStatus: "rejected",
    paymentStatusDetail: "cc_rejected_high_risk",
  });

  assert.equal(snapshot?.status, "rejected");
  assert.equal(snapshot?.providerStatus, "failed");
  assert.equal(snapshot?.providerStatusDetail, "cc_rejected_high_risk");
});

test("mantém rejeição genérica quando não há detalhe mais específico", () => {
  const snapshot = createOrderSnapshot({
    orderStatus: "failed",
    orderStatusDetail: "failed",
    paymentStatus: "failed",
    paymentStatusDetail: "failed",
  });

  assert.equal(snapshot?.status, "rejected");
  assert.equal(snapshot?.providerStatusDetail, "failed");
});

test("mantém detalhe específico da Order quando o payment está vazio", () => {
  const snapshot = createOrderSnapshot({
    orderStatus: "failed",
    orderStatusDetail: "rejected_by_issuer",
    paymentStatus: "failed",
    paymentStatusDetail: null,
  });

  assert.equal(snapshot?.status, "rejected");
  assert.equal(snapshot?.providerStatusDetail, "rejected_by_issuer");
});

test("mantém a Order canônica quando ambos os detalhes são específicos", () => {
  const snapshot = createOrderSnapshot({
    orderStatus: "failed",
    orderStatusDetail: "rejected_by_issuer",
    paymentStatus: "failed",
    paymentStatusDetail: "cc_rejected_high_risk",
  });

  assert.equal(snapshot?.status, "rejected");
  assert.equal(snapshot?.providerStatusDetail, "rejected_by_issuer");
});

test("preserva cartão aprovado e em revisão como estados existentes", () => {
  const approved = createOrderSnapshot({
    orderStatus: "processed",
    orderStatusDetail: "accredited",
    paymentStatus: "processed",
    paymentStatusDetail: "accredited",
  });
  const inReview = createOrderSnapshot({
    orderStatus: "processing",
    orderStatusDetail: "in_process",
    paymentStatus: "processing",
    paymentStatusDetail: "pending_review_manual",
  });

  assert.equal(approved?.status, "approved");
  assert.equal(approved?.providerStatusDetail, "accredited");
  assert.equal(inReview?.status, "pending");
  assert.equal(inReview?.providerStatusDetail, "in_process");
});

test("preserva estados de PIX aprovado, pendente, cancelado e reembolsado", () => {
  const approved = createOrderSnapshot({
    orderStatus: "processed",
    orderStatusDetail: "accredited",
    paymentStatus: "processed",
    paymentStatusDetail: "accredited",
  });
  const pending = createOrderSnapshot({
    orderStatus: "action_required",
    orderStatusDetail: "waiting_payment",
    paymentStatus: "action_required",
    paymentStatusDetail: "waiting_transfer",
  });
  const cancelled = createOrderSnapshot({
    orderStatus: "canceled",
    orderStatusDetail: "expired",
    paymentStatus: "canceled",
    paymentStatusDetail: "expired",
  });
  const refunded = createOrderSnapshot({
    orderStatus: "refunded",
    orderStatusDetail: "refunded",
    paymentStatus: "refunded",
    paymentStatusDetail: "refunded",
  });

  assert.deepEqual(
    [approved?.status, pending?.status, cancelled?.status, refunded?.status],
    ["approved", "pending", "cancelled", "refunded"],
  );
  assert.equal(approved?.providerStatusDetail, "accredited");
  assert.equal(pending?.providerStatusDetail, "waiting_payment");
});

test("aceita respostas parciais sem payments ou sem detalhes", () => {
  const withoutPayments = extractMercadoPagoOrderSnapshot({
    id: providerOrderId,
    external_reference: "SUS-partial",
    status: "processing",
  });
  const paymentOnlyDetail = createOrderSnapshot({
    orderStatus: "failed",
    orderStatusDetail: null,
    paymentStatus: "failed",
    paymentStatusDetail: "high_risk",
  });
  const withoutDetails = createOrderSnapshot({
    orderStatus: "processing",
    orderStatusDetail: null,
    paymentStatus: "processing",
    paymentStatusDetail: null,
  });

  assert.equal(withoutPayments?.status, "pending");
  assert.equal(withoutPayments?.providerStatusDetail, null);
  assert.equal(paymentOnlyDetail?.providerStatusDetail, "high_risk");
  assert.equal(paymentOnlyDetail?.status, "rejected");
  assert.equal(withoutDetails?.providerStatusDetail, null);
  assert.equal(withoutDetails?.status, "pending");
});

function createOrderSnapshot({
  orderStatus,
  orderStatusDetail,
  paymentStatus,
  paymentStatusDetail,
}) {
  return extractMercadoPagoOrderSnapshot({
    id: providerOrderId,
    external_reference: "SUS-status-detail-test",
    status: orderStatus,
    status_detail: orderStatusDetail,
    transactions: {
      payments: [
        {
          status: paymentStatus,
          status_detail: paymentStatusDetail,
          payment_method: {},
        },
      ],
    },
  });
}
