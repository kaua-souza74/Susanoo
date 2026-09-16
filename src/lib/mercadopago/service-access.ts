import "server-only";

import type { ServiceId } from "./services";

// Temporary allowlist. Authorization uses only the server-verified Supabase user ID.
const INTERNAL_TEST_USER_ID = "dd69d348-16b5-4ff8-9bdb-619126c6a734";

export function canPurchaseService(serviceId: ServiceId, userId: string): boolean {
  if (serviceId !== "internal-production-test") return true;

  return process.env.VERCEL_ENV === "production" && userId === INTERNAL_TEST_USER_ID;
}
