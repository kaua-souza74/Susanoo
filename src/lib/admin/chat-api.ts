import "server-only";

import { createClient, type User } from "@supabase/supabase-js";
import { authenticateAdminToken } from "@/lib/admin/authority";

const MAX_TOKEN_LENGTH = 8192;

export function readBearerToken(request: Request): string | null {
  const header = request.headers.get("authorization");
  const match = header?.match(/^Bearer ([^\s]+)$/i);
  return match && match[1].length <= MAX_TOKEN_LENGTH ? match[1] : null;
}

export async function authenticateAdminRequest(request: Request): Promise<User | null> {
  const token = readBearerToken(request);
  return authenticateAdminToken(token ?? undefined);
}

export function createAdminChatClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SECRET_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return null;
  return createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
  });
}

