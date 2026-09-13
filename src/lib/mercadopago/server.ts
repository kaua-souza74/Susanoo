import "server-only";

import { MercadoPagoConfig, Order } from "mercadopago";

let orderClient: Order | undefined;

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

export class MercadoPagoConfigurationError extends Error {
  constructor() {
    super("Mercado Pago server credentials are not configured.");
    this.name = "MercadoPagoConfigurationError";
  }
}
