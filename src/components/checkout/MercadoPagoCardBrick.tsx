"use client";

import { useCallback, useMemo, useRef, useState } from "react";
import { CardPayment, initMercadoPago } from "@mercadopago/sdk-react";
import {
  CheckCircle2,
  CreditCard,
  ShieldCheck,
} from "lucide-react";

import type { ServiceId } from "@/lib/mercadopago/services";
import type { BrickPaymentResponse } from "@/lib/mercadopago/types";
import { supabase } from "@/lib/supabase";

const publicKey = process.env.NEXT_PUBLIC_MERCADO_PAGO_BRICKS_PUBLIC_KEY;

if (publicKey) {
  initMercadoPago(publicKey, {
    locale: "pt-BR",
    advancedFraudPrevention: true,
  });
}

type CardSubmitPayload = Parameters<
  NonNullable<React.ComponentProps<typeof CardPayment>["onSubmit"]>
>[0];

type MercadoPagoCardBrickProps = {
  amountInCents: number;
  diagnosticsEnabled: boolean;
  serviceId: ServiceId;
  sessionScope: string;
};

export function MercadoPagoCardBrick({
  amountInCents,
  diagnosticsEnabled,
  serviceId,
  sessionScope,
}: MercadoPagoCardBrickProps) {
  const [isReady, setIsReady] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitMessage, setSubmitMessage] = useState<string | null>(null);
  const [result, setResult] = useState<BrickPaymentResponse | null>(null);
  const submitLockRef = useRef(false);
  const submissionErrorRef = useRef(false);
  const checkoutSessionIdRef = useRef<string | null>(null);

  const initialization = useMemo(
    () => ({ amount: amountInCents / 100 }),
    [amountInCents],
  );
  const customization = useMemo(
    () => ({
      paymentMethods: {
        types: { included: ["credit_card" as const] },
        minInstallments: 1,
        maxInstallments: 12,
      },
      visual: {
        style: {
          theme: "dark" as const,
          customVariables: {
            formBackgroundColor: "#0d0b12",
            inputBackgroundColor: "#131019",
            textPrimaryColor: "#f5f3ff",
            textSecondaryColor: "#a1a1aa",
            baseColor: "#7c3aed",
            outlinePrimaryColor: "#3f3f46",
            borderRadiusMedium: "12px",
            borderRadiusLarge: "16px",
          },
        },
      },
    }),
    [],
  );

  const handleSubmit = useCallback(
    async (formData: CardSubmitPayload) => {
      if (submitLockRef.current) return;

      submitLockRef.current = true;
      submissionErrorRef.current = false;
      setIsSubmitting(true);
      setSubmitMessage(null);

      if (diagnosticsEnabled) {
        console.info("[Mercado Pago Card Payment Brick] onSubmit", {
          payment_method_id: safeString(recordValue(formData, "payment_method_id")),
          payment_type_id: "credit_card",
          installments: safeNumber(recordValue(formData, "installments")),
          issuer_id: safeString(recordValue(formData, "issuer_id")),
        });
      }

      try {
        const {
          data: { session },
        } = await supabase.auth.getSession();
        if (!session) {
          throw new BrickSubmissionError(
            "Entre na sua conta para continuar com o pagamento.",
          );
        }

        const checkoutSessionId =
          checkoutSessionIdRef.current ??
          getOrCreateBrickCheckoutSessionId(serviceId, sessionScope);
        checkoutSessionIdRef.current = checkoutSessionId;

        const response = await fetch("/api/mercadopago/brick/payment", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${session.access_token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            serviceId,
            checkoutSessionId,
            formData: pickSafeBrickFormData(formData),
          }),
        });
        const responseBody: unknown = await response.json();

        if (!response.ok || !isBrickPaymentResponse(responseBody)) {
          throw new BrickSubmissionError(readSafeError(responseBody));
        }

        setResult(responseBody);
        setSubmitMessage(cardStatusMessage(responseBody.status));
      } catch (error: unknown) {
        submissionErrorRef.current = true;
        setSubmitMessage(
          error instanceof BrickSubmissionError
            ? error.message
            : "Não foi possível conectar ao serviço de pagamento.",
        );
        throw new Error("Falha ao enviar pagamento pelo Brick.");
      } finally {
        submitLockRef.current = false;
        setIsSubmitting(false);
      }
    },
    [diagnosticsEnabled, serviceId, sessionScope],
  );

  if (!publicKey) {
    return (
      <p role="alert" className="text-sm font-medium text-amber-200/80">
        Cartão indisponível: Public Key do Bricks não configurada.
      </p>
    );
  }

  return (
    <section className="mt-5" aria-labelledby="card-brick-title">
      <div className="mb-7 flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          <h2 id="card-brick-title" className="text-2xl font-black tracking-[-0.03em] sm:text-3xl">
            Pagamento com cartão
          </h2>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-white/45">
            Preencha os dados no ambiente seguro do Mercado Pago e escolha o parcelamento.
          </p>
        </div>
        <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.16em] text-white/35">
          <ShieldCheck className="h-4 w-4 text-emerald-400" /> Ambiente de teste
        </div>
      </div>

      <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_18rem]">
        <div className="relative min-h-72 overflow-hidden rounded-[1.75rem] border border-white/10 bg-[#0d0b12] p-4 sm:p-6">
          {!isReady ? (
            <div className="absolute inset-0 z-10 flex items-center justify-center bg-[#0d0b12]">
              <span className="h-6 w-6 animate-spin rounded-full border-2 border-violet-300/20 border-t-violet-300" />
            </div>
          ) : null}
          {isSubmitting ? (
            <div className="absolute inset-0 z-20 flex items-center justify-center bg-[#0d0b12]/85 backdrop-blur-sm">
              <div className="text-center">
                <span className="mx-auto block h-7 w-7 animate-spin rounded-full border-2 border-violet-300/20 border-t-violet-300" />
                <p className="mt-3 text-xs font-bold text-white/55">
                  Processando com segurança…
                </p>
              </div>
            </div>
          ) : null}
          <CardPayment
            initialization={initialization}
            customization={customization}
            locale="pt-BR"
            onReady={() => setIsReady(true)}
            onSubmit={handleSubmit}
            onError={(error) => {
              setIsReady(true);

              if (diagnosticsEnabled) {
                console.error("[Mercado Pago Card Brick] error", {
                  type: error.type ?? null,
                  cause: error.cause ?? null,
                  message: error.message ?? null,
                });
              }

              if (submissionErrorRef.current) {
                submissionErrorRef.current = false;
                return;
              }
              if (!submitLockRef.current) {
                setSubmitMessage(
                  error.type === "non_critical"
                    ? "Mercado Pago não conseguiu validar este cartão no momento."
                    : "Não foi possível carregar o formulário de cartão. Tente novamente.",
                );
              }
            }}
          />
        </div>

        <aside className="rounded-[1.75rem] border border-white/8 bg-white/[0.025] p-5">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-violet-400/10 text-violet-300">
            <CreditCard className="h-5 w-5" />
          </div>
          <p className="mt-4 text-sm font-black">Pagamento protegido</p>
          <ul className="mt-3 space-y-2 text-xs font-medium text-white/45">
            <li>Cartão de crédito</li>
            <li>Parcelamento em até 12x</li>
          </ul>
          <p className="mt-5 border-t border-white/8 pt-4 text-[11px] leading-5 text-white/30">
            O pagamento só é criado após você preencher o Brick e pressionar Pagar.
          </p>
        </aside>
      </div>

      {result ? (
        <BrickCardResult result={result} />
      ) : null}

      {submitMessage ? (
        <p role="status" className="mt-4 rounded-xl border border-violet-400/15 bg-violet-400/8 px-4 py-3 text-sm font-medium text-violet-100/80">
          {submitMessage}
        </p>
      ) : null}
    </section>
  );
}

function BrickCardResult({ result }: { result: BrickPaymentResponse }) {
  return (
    <div className="mt-5 flex items-start gap-4 rounded-[1.75rem] border border-white/10 bg-white/[0.025] p-5 sm:p-6">
      <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-violet-400/10 text-violet-300">
        <CheckCircle2 className="h-5 w-5" />
      </div>
      <div>
        <p className="text-sm font-black">Status do cartão: {statusLabel(result.status)}</p>
        <p className="mt-1 text-xs text-white/40">
          Referência Mercado Pago: {result.providerId}
          {result.statusDetail ? ` · ${result.statusDetail}` : ""}
        </p>
      </div>
    </div>
  );
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function recordValue(value: unknown, key: string): unknown {
  return isRecord(value) ? value[key] : undefined;
}

function pickSafeBrickFormData(value: unknown) {
  const payer = recordValue(value, "payer");
  const identification = recordValue(payer, "identification");

  return {
    token: recordValue(value, "token"),
    issuer_id: recordValue(value, "issuer_id"),
    payment_method_id: recordValue(value, "payment_method_id"),
    transaction_amount: recordValue(value, "transaction_amount"),
    installments: recordValue(value, "installments"),
    payer: isRecord(identification)
      ? {
          email: recordValue(payer, "email"),
          identification: {
            type: identification.type,
            number: identification.number,
          },
        }
      : isRecord(payer)
        ? { email: recordValue(payer, "email") }
        : undefined,
  };
}

function safeString(value: unknown): string | null {
  return typeof value === "string" ? value : null;
}

function safeNumber(value: unknown): number | null {
  return typeof value === "number" && Number.isFinite(value) ? value : null;
}

function getOrCreateBrickCheckoutSessionId(
  serviceId: ServiceId,
  sessionScope: string,
) {
  const storageKey = `susanoo_mp_brick_${serviceId}_${sessionScope}`;
  const storedId = sessionStorage.getItem(storageKey);
  if (storedId) return storedId;

  const checkoutSessionId = crypto.randomUUID();
  sessionStorage.setItem(storageKey, checkoutSessionId);
  return checkoutSessionId;
}

function isBrickPaymentResponse(value: unknown): value is BrickPaymentResponse {
  return (
    isRecord(value) &&
    typeof value.localOrderId === "string" &&
    typeof value.providerId === "string" &&
    isPaymentStatus(value.status) &&
    (typeof value.statusDetail === "string" || value.statusDetail === null) &&
    (value.paymentMethod === "pix" || value.paymentMethod === "card") &&
    (typeof value.qrCode === "string" || value.qrCode === null) &&
    (typeof value.qrCodeBase64 === "string" || value.qrCodeBase64 === null) &&
    (typeof value.ticketUrl === "string" || value.ticketUrl === null)
  );
}

function isPaymentStatus(value: unknown) {
  return (
    value === "pending" ||
    value === "approved" ||
    value === "rejected" ||
    value === "cancelled" ||
    value === "refunded"
  );
}

function readSafeError(value: unknown) {
  return isRecord(value) && typeof value.error === "string"
    ? value.error
    : "Não foi possível processar o pagamento.";
}

function cardStatusMessage(status: BrickPaymentResponse["status"]) {
  if (status === "approved") return "Pagamento com cartão aprovado.";
  if (status === "rejected") return "Pagamento rejeitado. Revise os dados e tente novamente.";
  return "Pagamento recebido e aguardando confirmação.";
}

function statusLabel(status: BrickPaymentResponse["status"]) {
  const labels: Record<BrickPaymentResponse["status"], string> = {
    pending: "aguardando confirmação",
    approved: "aprovado",
    rejected: "rejeitado",
    cancelled: "cancelado",
    refunded: "estornado",
  };
  return labels[status];
}

class BrickSubmissionError extends Error {}
