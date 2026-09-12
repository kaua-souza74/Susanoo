"use client";

import { loadMercadoPago } from "@mercadopago/sdk-js";

type MercadoPagoBrowserClient = object;

type MercadoPagoBrowserConstructor = new (
  publicKey: string,
  options?: {
    locale?: "pt-BR";
    advancedFraudPrevention?: boolean;
  },
) => MercadoPagoBrowserClient;

declare global {
  interface Window {
    MercadoPago?: MercadoPagoBrowserConstructor;
  }
}

let mercadoPagoClientPromise: Promise<MercadoPagoBrowserClient> | undefined;

export function initializeMercadoPago(): Promise<MercadoPagoBrowserClient> {
  if (!mercadoPagoClientPromise) {
    mercadoPagoClientPromise = createMercadoPagoClient();
  }

  return mercadoPagoClientPromise;
}

async function createMercadoPagoClient(): Promise<MercadoPagoBrowserClient> {
  const publicKey = process.env.NEXT_PUBLIC_MERCADO_PAGO_PUBLIC_KEY;

  if (!publicKey) {
    throw new Error("Mercado Pago public key is not configured.");
  }

  await loadMercadoPago();

  if (!window.MercadoPago) {
    throw new Error("Mercado Pago browser SDK could not be loaded.");
  }

  return new window.MercadoPago(publicKey, {
    locale: "pt-BR",
    advancedFraudPrevention: true,
  });
}
