import "server-only";

import { MercadoPagoConfig, Order, Payment } from "mercadopago";

let orderClient: Order | undefined;
let paymentClient: Payment | undefined;

export function getMercadoPagoOrderClient(): Order {
  const accessToken = process.env.MERCADO_PAGO_ORDERS_ACCESS_TOKEN;

  if (!accessToken) {
    throw new MercadoPagoConfigurationError();
  }

  if (!orderClient) {
    const client = new MercadoPagoConfig({
      accessToken,
      options: { timeout: 10_000 },
    });

    orderClient = new Order(client);
  }

  return orderClient;
}

export function getMercadoPagoPaymentClient(): Payment {
  const accessToken = process.env.MERCADO_PAGO_BRICKS_ACCESS_TOKEN;

  if (!accessToken) {
    throw new MercadoPagoConfigurationError();
  }

  if (!paymentClient) {
    const client = new MercadoPagoConfig({
      accessToken,
      options: { timeout: 10_000 },
    });

    paymentClient = new Payment(client);
  }

  return paymentClient;
}

export class MercadoPagoConfigurationError extends Error {
  constructor() {
    super("Mercado Pago server credentials are not configured.");
    this.name = "MercadoPagoConfigurationError";
  }
}
