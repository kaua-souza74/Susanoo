import "server-only";

import type { MercadoPagoOrderSnapshot } from "./order-snapshot";
import { isServiceId, type ServiceId } from "./services";
import {
  canApplyPaymentStatus,
  type PaymentStatus,
} from "./status";
import { getSupabaseAdminClient } from "./supabase-admin";

export type PaymentOrder = {
  id: string;
  userId: string;
  serviceId: ServiceId;
  amountInCents: number;
  currency: "BRL";
  providerOrderId: string | null;
  externalReference: string;
  checkoutSessionId: string;
  idempotencyKey: string;
  paymentMethod: "pix" | "card";
  status: PaymentStatus;
  providerStatus: string | null;
  statusDetail: string | null;
  approvedAt: string | null;
};

type CreatePaymentOrderInput = {
  userId: string;
  serviceId: ServiceId;
  amountInCents: number;
  checkoutSessionId: string;
  paymentMethod: "pix" | "card";
};

const paymentOrderColumns = [
  "id",
  "user_id",
  "service_id",
  "amount_cents",
  "currency",
  "provider_order_id",
  "external_reference",
  "checkout_session_id",
  "idempotency_key",
  "payment_method",
  "status",
  "provider_status",
  "status_detail",
  "approved_at",
].join(",");

export async function getOrCreatePaymentOrder(
  input: CreatePaymentOrderInput,
): Promise<PaymentOrder> {
  const existing = await findPaymentOrderByCheckoutSession(
    input.userId,
    input.checkoutSessionId,
  );

  if (existing) return existing;

  const supabase = getSupabaseAdminClient();
  const idempotencyKey = crypto.randomUUID();
  const externalReference = `SUS-${crypto.randomUUID()}`;
  const { data, error } = await supabase
    .from("payment_orders")
    .insert({
      user_id: input.userId,
      service_id: input.serviceId,
      amount_cents: input.amountInCents,
      currency: "BRL",
      provider: "mercadopago",
      external_reference: externalReference,
      checkout_session_id: input.checkoutSessionId,
      idempotency_key: idempotencyKey,
      payment_method: input.paymentMethod,
      status: "pending",
    })
    .select(paymentOrderColumns)
    .single();

  if (!error && data) return mapPaymentOrder(data);

  if (error?.code === "23505") {
    const concurrentOrder = await findPaymentOrderByCheckoutSession(
      input.userId,
      input.checkoutSessionId,
    );
    if (concurrentOrder) return concurrentOrder;
  }

  throw new PaymentOrderPersistenceError();
}

export async function findPaymentOrderByCheckoutSession(
  userId: string,
  checkoutSessionId: string,
): Promise<PaymentOrder | null> {
  const { data, error } = await getSupabaseAdminClient()
    .from("payment_orders")
    .select(paymentOrderColumns)
    .eq("user_id", userId)
    .eq("checkout_session_id", checkoutSessionId)
    .maybeSingle();

  if (error) throw new PaymentOrderPersistenceError();
  return data ? mapPaymentOrder(data) : null;
}

export async function findPaymentOrderByProviderOrderId(
  providerOrderId: string,
): Promise<PaymentOrder | null> {
  const { data, error } = await getSupabaseAdminClient()
    .from("payment_orders")
    .select(paymentOrderColumns)
    .eq("provider_order_id", providerOrderId)
    .maybeSingle();

  if (error) throw new PaymentOrderPersistenceError();
  return data ? mapPaymentOrder(data) : null;
}

export async function findPaymentOrderForUser(
  providerOrderId: string,
  userId: string,
): Promise<PaymentOrder | null> {
  const { data, error } = await getSupabaseAdminClient()
    .from("payment_orders")
    .select(paymentOrderColumns)
    .eq("provider_order_id", providerOrderId)
    .eq("user_id", userId)
    .maybeSingle();

  if (error) throw new PaymentOrderPersistenceError();
  return data ? mapPaymentOrder(data) : null;
}

export async function findPaymentOrderByExternalReference(
  externalReference: string,
): Promise<PaymentOrder | null> {
  const { data, error } = await getSupabaseAdminClient()
    .from("payment_orders")
    .select(paymentOrderColumns)
    .eq("external_reference", externalReference)
    .maybeSingle();

  if (error) throw new PaymentOrderPersistenceError();
  return data ? mapPaymentOrder(data) : null;
}

export async function syncPaymentOrderFromProvider(
  paymentOrder: PaymentOrder,
  snapshot: MercadoPagoOrderSnapshot,
): Promise<PaymentOrder> {
  if (snapshot.externalReference !== paymentOrder.externalReference) {
    throw new PaymentOrderMismatchError();
  }
  if (
    paymentOrder.providerOrderId &&
    paymentOrder.providerOrderId !== snapshot.providerOrderId
  ) {
    throw new PaymentOrderMismatchError();
  }

  const nextStatus = canApplyPaymentStatus(paymentOrder.status, snapshot.status)
    ? snapshot.status
    : paymentOrder.status;
  const approvedAt =
    paymentOrder.approvedAt ??
    (nextStatus === "approved" ? new Date().toISOString() : null);

  const { data, error } = await getSupabaseAdminClient()
    .from("payment_orders")
    .update({
      provider_order_id: snapshot.providerOrderId,
      status: nextStatus,
      provider_status: snapshot.providerStatus,
      status_detail: snapshot.providerStatusDetail,
      approved_at: approvedAt,
      updated_at: new Date().toISOString(),
    })
    .eq("id", paymentOrder.id)
    .select(paymentOrderColumns)
    .single();

  if (error || !data) throw new PaymentOrderPersistenceError();
  return mapPaymentOrder(data);
}

function mapPaymentOrder(value: unknown): PaymentOrder {
  if (!isRecord(value)) throw new PaymentOrderPersistenceError();

  const row = value;
  if (
    typeof row.id !== "string" ||
    typeof row.user_id !== "string" ||
    !isServiceId(row.service_id) ||
    typeof row.amount_cents !== "number" ||
    row.currency !== "BRL" ||
    (typeof row.provider_order_id !== "string" && row.provider_order_id !== null) ||
    typeof row.external_reference !== "string" ||
    typeof row.checkout_session_id !== "string" ||
    typeof row.idempotency_key !== "string" ||
    (row.payment_method !== "pix" && row.payment_method !== "card") ||
    !isPaymentStatus(row.status) ||
    (typeof row.provider_status !== "string" && row.provider_status !== null) ||
    (typeof row.status_detail !== "string" && row.status_detail !== null) ||
    (typeof row.approved_at !== "string" && row.approved_at !== null)
  ) {
    throw new PaymentOrderPersistenceError();
  }

  return {
    id: row.id,
    userId: row.user_id,
    serviceId: row.service_id,
    amountInCents: Number(row.amount_cents),
    currency: row.currency,
    providerOrderId: row.provider_order_id,
    externalReference: row.external_reference,
    checkoutSessionId: row.checkout_session_id,
    idempotencyKey: row.idempotency_key,
    paymentMethod: row.payment_method,
    status: row.status,
    providerStatus: row.provider_status,
    statusDetail: row.status_detail,
    approvedAt: row.approved_at,
  };
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isPaymentStatus(value: unknown): value is PaymentStatus {
  return (
    value === "pending" ||
    value === "approved" ||
    value === "rejected" ||
    value === "cancelled" ||
    value === "refunded"
  );
}

export class PaymentOrderPersistenceError extends Error {
  constructor() {
    super("Payment order persistence failed.");
    this.name = "PaymentOrderPersistenceError";
  }
}

export class PaymentOrderMismatchError extends Error {
  constructor() {
    super("Provider order does not match the local payment order.");
    this.name = "PaymentOrderMismatchError";
  }
}
