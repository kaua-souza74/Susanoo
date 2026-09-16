"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

import { CheckoutExperience } from "../checkout-experience";
import type { InternalCheckoutConfiguration } from "@/lib/mercadopago/types";
import { supabase } from "@/lib/supabase";

export function InternalProductionTestCheckout() {
  const [service, setService] = useState<InternalCheckoutConfiguration | null>(null);
  const [message, setMessage] = useState("Verificando acesso ao teste interno…");

  useEffect(() => {
    const controller = new AbortController();

    async function loadConfiguration() {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (controller.signal.aborted) return;
        if (!session) {
          setMessage("Entre na conta autorizada e abra novamente esta página.");
          return;
        }

        const response = await fetch("/api/mercadopago/internal-test", {
          headers: { Authorization: `Bearer ${session.access_token}` },
          cache: "no-store",
          signal: controller.signal,
        });
        const payload: unknown = await response.json();
        if (controller.signal.aborted) return;
        if (response.ok && isInternalConfiguration(payload)) {
          setService(payload);
        } else {
          setMessage("Teste interno indisponível. Verifique a conta autorizada.");
        }
      } catch {
        if (!controller.signal.aborted) {
          setMessage("Não foi possível verificar o acesso. Recarregue a página.");
        }
      }
    }

    void loadConfiguration();
    return () => controller.abort();
  }, []);

  if (service) {
    return <CheckoutExperience service={service} brickDiagnosticsEnabled={false} />;
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-[#0d0b12] p-6 text-white">
      <section className="max-w-md rounded-3xl border border-white/10 p-8">
        <h1 className="text-xl font-bold">Teste interno de pagamento</h1>
        <p role="status" className="mt-4 text-sm text-white/60">{message}</p>
        <Link href="/login" className="mt-6 inline-block text-sm text-violet-300">
          Entrar na Susanoo
        </Link>
      </section>
    </main>
  );
}

function isInternalConfiguration(value: unknown): value is InternalCheckoutConfiguration {
  if (typeof value !== "object" || value === null) return false;
  const service = value as Record<string, unknown>;
  return service.id === "internal-production-test" &&
    service.amountInCents === 100 && service.isSandbox === false &&
    typeof service.name === "string" && typeof service.description === "string" &&
    typeof service.deliveryLabel === "string" && typeof service.formattedPrice === "string" &&
    typeof service.sessionScope === "string";
}
