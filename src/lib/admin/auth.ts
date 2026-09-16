import "server-only";
import { createClient } from "@supabase/supabase-js";
import { isAdminUserId } from "./access";

export const ADMIN_SESSION_COOKIE = "susanoo-admin-session";
export async function isAuthenticatedAdmin(token: string | undefined): Promise<boolean> {
  if (!token || token.length > 8192) return false;
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) return false;
  try {
    const client = createClient(url, key, {
      auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
    });
    const { data, error } = await client.auth.getUser(token);
    return !error && !!data.user && isAdminUserId(data.user.id);
  } catch { return false; }
}
