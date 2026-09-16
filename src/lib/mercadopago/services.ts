export const services = {
  "site-institucional": {
    id: "site-institucional",
    name: "Site Institucional",
    description:
      "Presença digital profissional, responsiva e preparada para apresentar sua empresa.",
    priceInCents: 149_900,
    deliveryLabel: "Projeto digital sob medida",
  },
} as const;

// Temporary internal item: deliberately excluded from the public catalog above.
const internalServices = {
  "internal-production-test": {
    id: "internal-production-test",
    name: "Teste interno de pagamento",
    description: "Operação interna e temporária para validar o pagamento real de R$ 1,00.",
    priceInCents: 100,
    deliveryLabel: "Teste interno — não inclui um projeto",
  },
} as const;

export type ServiceId = keyof typeof services | keyof typeof internalServices;
export type Service =
  | (typeof services)[keyof typeof services]
  | (typeof internalServices)[keyof typeof internalServices];

export const defaultServiceId: ServiceId = "site-institucional";

export function isServiceId(value: unknown): value is ServiceId {
  return typeof value === "string" &&
    (Object.hasOwn(services, value) || Object.hasOwn(internalServices, value));
}

export function getServiceById(serviceId: ServiceId): Service {
  return serviceId === "internal-production-test"
    ? internalServices[serviceId]
    : services[serviceId];
}

export function formatPriceInBRL(priceInCents: number): string {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(priceInCents / 100);
}
