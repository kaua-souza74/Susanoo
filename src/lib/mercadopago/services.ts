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

export type ServiceId = keyof typeof services;
export type Service = (typeof services)[ServiceId];

export const defaultServiceId: ServiceId = "site-institucional";

export function isServiceId(value: unknown): value is ServiceId {
  return typeof value === "string" && value in services;
}

export function getServiceById(serviceId: ServiceId): Service {
  return services[serviceId];
}

export function formatPriceInBRL(priceInCents: number): string {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(priceInCents / 100);
}
