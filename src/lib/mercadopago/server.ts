import "server-only";

import { MercadoPagoConfig, Order, PaymentMethod } from "mercadopago";

let orderClient: Order | undefined;
let paymentMethodClient: PaymentMethod | undefined;
const MERCADO_PAGO_ORDERS_URL = "https://api.mercadopago.com/v1/orders";

type OrderCreateInput = Parameters<Order["create"]>[0];

export type MercadoPagoOrderErrorDetail = {
  code: string | null;
  field: string | null;
  message: string | null;
};

export function getMercadoPagoOrderClient(): Order {
  const accessToken = getOrdersAccessToken();

  if (!orderClient) {
    const client = new MercadoPagoConfig({
      accessToken,
      options: { timeout: 10_000 },
    });

    orderClient = new Order(client);
  }

  return orderClient;
}

export async function isMercadoPagoCardPaymentMethodAvailable(
  paymentMethodId: string,
  paymentTypeId: "credit_card" | "debit_card",
): Promise<boolean> {
  const accessToken = getOrdersAccessToken();

  if (!paymentMethodClient) {
    const client = new MercadoPagoConfig({
      accessToken,
      options: { timeout: 10_000 },
    });
    paymentMethodClient = new PaymentMethod(client);
  }

  const methods = await paymentMethodClient.get();
  return methods.some(
    (method) =>
      method.id === paymentMethodId &&
      method.payment_type_id === paymentTypeId &&
      method.status === "active",
  );
}

export async function createMercadoPagoOrder(
  input: OrderCreateInput,
): Promise<unknown> {
  if (process.env.VERCEL_ENV !== "preview") {
    return getMercadoPagoOrderClient().create(input);
  }

  const response = await fetch(MERCADO_PAGO_ORDERS_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${getOrdersAccessToken()}`,
      "Content-Type": "application/json",
      "X-Idempotency-Key": input.requestOptions?.idempotencyKey ?? "",
    },
    body: JSON.stringify(input.body),
    signal: AbortSignal.timeout(10_000),
  });
  const responseBody: unknown = await response.json().catch(() => null);

  if (!response.ok) {
    throw MercadoPagoOrderHttpError.fromResponse(
      response.status,
      response.headers.get("x-request-id"),
      responseBody,
    );
  }

  return responseBody;
}

function getOrdersAccessToken(): string {
  const accessToken = process.env.MERCADO_PAGO_ORDERS_ACCESS_TOKEN;

  if (!accessToken) {
    throw new MercadoPagoConfigurationError();
  }

  return accessToken;
}

export class MercadoPagoConfigurationError extends Error {
  constructor() {
    super("Mercado Pago server credentials are not configured.");
    this.name = "MercadoPagoConfigurationError";
  }
}

export class MercadoPagoOrderHttpError extends Error {
  readonly status: number;
  readonly errorCode: string | null;
  readonly details: MercadoPagoOrderErrorDetail[];
  readonly requestId: string | null;

  private constructor(args: {
    status: number;
    errorCode: string | null;
    message: string;
    details: MercadoPagoOrderErrorDetail[];
    requestId: string | null;
  }) {
    super(args.message);
    this.name = "MercadoPagoOrderHttpError";
    this.status = args.status;
    this.errorCode = args.errorCode;
    this.details = args.details;
    this.requestId = args.requestId;
  }

  static fromResponse(
    status: number,
    requestId: string | null,
    value: unknown,
  ): MercadoPagoOrderHttpError {
    const body = isRecord(value) ? value : {};
    const detailsSource = Array.isArray(body.details)
      ? body.details
      : Array.isArray(body.cause)
        ? body.cause
        : Array.isArray(body.errors)
          ? body.errors
          : [];

    return new MercadoPagoOrderHttpError({
      status,
      errorCode: readSafeText(body.code ?? body.error_code ?? body.error),
      message: readSafeText(body.message) ?? "MercadoPago API error",
      details: detailsSource.map(readSafeDetail).filter(isPresent).slice(0, 20),
      requestId: readSafeText(requestId, 256),
    });
  }
}

function readSafeDetail(value: unknown): MercadoPagoOrderErrorDetail | null {
  if (!isRecord(value)) return null;

  return {
    code: readSafeText(value.code ?? value.error),
    field: readSafeText(value.field ?? value.path),
    message: readSafeText(value.message ?? value.description),
  };
}

function readSafeText(value: unknown, maxLength = 512): string | null {
  if (typeof value !== "string") return null;
  const normalized = value.replace(/[\u0000-\u001f\u007f-\u009f]/g, " ").trim();
  return normalized ? normalized.slice(0, maxLength) : null;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isPresent<T>(value: T | null): value is T {
  return value !== null;
}
