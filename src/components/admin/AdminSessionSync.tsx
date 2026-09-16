"use client";
import { useEffect } from "react";
import { supabase } from "@/lib/supabase";

export default function AdminSessionSync() {
  useEffect(() => {
    let updates = Promise.resolve();
    const { data } = supabase.auth.onAuthStateChange((_event, session) => {
      // Queue outside the auth callback; serialize refresh/logout requests.
      updates = updates.then(async () => {
        const response = await fetch("/api/admin/session", {
          method: session ? "POST" : "DELETE",
          headers: session ? { Authorization: `Bearer ${session.access_token}` } : {},
        });
        if ((!session || !response.ok) && window.location.pathname.startsWith("/admin")
            && window.location.pathname !== "/admin/login") window.location.replace("/admin/login");
      }).catch(() => {
        if (window.location.pathname.startsWith("/admin") && window.location.pathname !== "/admin/login") {
          window.location.replace("/admin/login");
        }
      });
    });
    return () => data.subscription.unsubscribe();
  }, []);
  return null;
}
