"use client";

import { supabase } from "@/lib/supabase";

export async function adminApiFetch(path: string, init: RequestInit = {}): Promise<Response> {
  const { data: { session }, error } = await supabase.auth.getSession();
  if (error || !session?.access_token) throw new Error("Sessão administrativa expirada.");
  const headers = new Headers(init.headers);
  headers.set("Authorization", `Bearer ${session.access_token}`);
  if (init.body && !headers.has("Content-Type")) headers.set("Content-Type", "application/json");
  return fetch(path, { ...init, headers, cache: "no-store" });
}
