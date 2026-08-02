import { supabase } from "@/lib/supabase";

export type AccountType = "Comércio" | "Desenvolvedor";

export async function getAuthenticatedAccountType(): Promise<AccountType> {
  const { data: { user } } = await supabase.auth.getUser();
  return user?.user_metadata?.role === "developer" ? "Desenvolvedor" : "Comércio";
}

export async function getAccountStorageKey(name: string) {
  const { data: { user } } = await supabase.auth.getUser();
  return `susanoo:${user?.id ?? "anonymous"}:${name}`;
}
