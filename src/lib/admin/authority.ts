import "server-only";

import { createClient, type User } from "@supabase/supabase-js";
import { isAdminUserId } from "./access";

const MAX_TOKEN_LENGTH = 8192;

export type AdminAuthorizationMode = "legacy-allowlist" | "sql-candidate";

function isLoopbackSupabaseUrl(value: string | undefined): boolean {
  if (!value) return false;
  try {
    const url = new URL(value);
    return url.protocol === "http:" && ["127.0.0.1", "localhost", "[::1]", "::1"].includes(url.hostname);
  } catch {
    return false;
  }
}

export function getAdminAuthorizationMode(): AdminAuthorizationMode {
  if (
    process.env.NODE_ENV === "development" &&
    process.env.SUSANOO_ADMIN_AUTH_MODE === "sql-candidate" &&
    isLoopbackSupabaseUrl(process.env.NEXT_PUBLIC_SUPABASE_URL)
  ) {
    return "sql-candidate";
  }
  return "legacy-allowlist";
}

/** Validates the same bearer JWT with Auth and, in local candidate mode, PostgREST. */
export async function authenticateAdminToken(token: string | undefined): Promise<User | null> {
  if (!token || token.length > MAX_TOKEN_LENGTH) return null;

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
  if (!url || !key) return null;

  const mode = getAdminAuthorizationMode();
  try {
    const client = createClient(url, key, {
      global: { headers: { Authorization: `Bearer ${token}` } },
      auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
    });

    const { data, error } = await client.auth.getUser(token);
    if (error || !data.user) return null;

    if (mode === "sql-candidate") {
      const { data: allowed, error: rpcError } = await client.rpc("is_admin");
      if (rpcError || allowed !== true) return null;
      return data.user;
    }

    return isAdminUserId(data.user.id) ? data.user : null;
  } catch {
    return null;
  }
}
