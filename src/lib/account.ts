import { supabase } from "@/lib/supabase";

export type AccountType = "Comércio" | "Desenvolvedor";

async function getSessionUser() {
  try {
    const { data, error } = await supabase.auth.getSession();
    if (error) return null;
    return data.session?.user ?? null;
  } catch {
    // These helpers only support client-side presentation and local storage.
    // A temporary network failure must not break the whole dashboard.
    return null;
  }
}

export async function getAuthenticatedAccountType(): Promise<AccountType> {
  const user = await getSessionUser();
  return user?.user_metadata?.role === "developer" ? "Desenvolvedor" : "Comércio";
}

export async function getAccountStorageKey(name: string) {
  const user = await getSessionUser();
  return `susanoo:${user?.id ?? "anonymous"}:${name}`;
}

export async function hasCompletedClientProfile() {
  const user = await getSessionUser();
  if (!user) return false;
  if (user.user_metadata?.completed === true) return true;
  if (typeof window === "undefined") return false;

  return localStorage.getItem(`susanoo:${user.id}:store-profile-completed`) === "true"
    || localStorage.getItem("susanoo_store_profile_completed") === "true";
}
