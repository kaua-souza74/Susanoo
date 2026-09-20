import "server-only";

import { createClient } from "@supabase/supabase-js";

type AuthenticatedPayer = {
  userId: string;
  email: string;
};

export async function getAuthenticatedPayer(
  authorizationHeader: string | null,
): Promise<AuthenticatedPayer | null> {
  const accessToken = readBearerToken(authorizationHeader);
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabasePublishableKey =
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

  if (!accessToken || !supabaseUrl || !supabasePublishableKey) {
    return null;
  }

  try {
    const supabase = createClient(supabaseUrl, supabasePublishableKey, {
      auth: {
        autoRefreshToken: false,
        detectSessionInUrl: false,
        persistSession: false,
      },
    });

    const { data, error } = await supabase.auth.getUser(accessToken);
    const email = data.user?.email;

    if (error || !data.user || !email) {
      return null;
    }

    return { userId: data.user.id, email };
  } catch {
    return null;
  }
}

function readBearerToken(header: string | null): string | null {
  if (!header) return null;

  const match = /^Bearer\s+([^\s]+)$/i.exec(header);
  return match?.[1] ?? null;
}
