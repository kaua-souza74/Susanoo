"use client";

import { useCallback, useMemo, useState } from "react";
import { initMercadoPago, Payment } from "@mercadopago/sdk-react";
import { CreditCard, FlaskConical, ShieldCheck } from "lucide-react";

const publicKey = process.env.NEXT_PUBLIC_MERCADO_PAGO_PUBLIC_KEY;

if (publicKey) {
  initMercadoPago(publicKey, {
    locale: "pt-BR",
    advancedFraudPrevention: true,
  });
}

type PaymentSubmitPayload = Parameters<
  NonNullable<React.ComponentProps<typeof Payment>["onSubmit"]>
>[0];

type MercadoPagoPaymentBrickProps = {
  amountInCents: number;
  diagnosticsEnabled: boolean;
};

export function MercadoPagoPaymentBrick({
  amountInCents,
  diagnosticsEnabled,
}: MercadoPagoPaymentBrickProps) {
  const [isReady, setIsReady] = useState(false);
  const [submitMessage, setSubmitMessage] = useState<string | null>(null);

  const initialization = useMemo(
    () => ({ amount: amountInCents / 100 }),
    [amountInCents],
  );
  const customization = useMemo(
    () => ({
      paymentMethods: {
        bankTransfer: ["pix"],
        creditCard: "all" as const,
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
    async (payload: PaymentSubmitPayload) => {
      if (diagnosticsEnabled) {
        console.info("[Mercado Pago Payment Brick] onSubmit", {
          selected_payment_method: safeString(payload.selectedPaymentMethod),
          form_data_keys: objectKeys(payload.formData),
          payer_keys: objectKeys(recordValue(payload.formData, "payer")),
          additional_info_keys: objectKeys(
            recordValue(payload.formData, "additional_info"),
          ),
          payment_method_id: safeString(
            recordValue(payload.formData, "payment_method_id"),
          ),
          installments: safeNumber(recordValue(payload.formData, "installments")),
          transaction_amount: safeNumber(
            recordValue(payload.formData, "transaction_amount"),
          ),
          has_token: typeof recordValue(payload.formData, "token") === "string",
        });
      }

      setSubmitMessage(
        "O onSubmit foi recebido com segurança. Nenhum pagamento foi enviado ao backend nesta etapa.",
      );
    },
    [diagnosticsEnabled],
  );

  if (!publicKey) {
    return (
      <p role="alert" className="text-sm font-medium text-amber-200/80">
        Payment Brick indisponível: Public Key não configurada.
      </p>
    );
  }

  return (
    <section className="border-t border-white/8 py-10 lg:py-14" aria-labelledby="payment-brick-title">
      <div className="mb-7 flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          <span className="inline-flex items-center gap-2 rounded-full border border-violet-400/15 bg-violet-400/8 px-3 py-1.5 text-[10px] font-black uppercase tracking-[0.2em] text-violet-300">
            <FlaskConical className="h-3.5 w-3.5" /> Nova experiência em teste
          </span>
          <h2 id="payment-brick-title" className="mt-4 text-2xl font-black tracking-[-0.03em] sm:text-3xl">
            Payment Brick
          </h2>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-white/45">
            Compare a experiência integrada do Mercado Pago. O checkout PIX atual acima continua disponível e sem alterações.
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
          <Payment
            initialization={initialization}
            customization={customization}
            locale="pt-BR"
            onReady={() => setIsReady(true)}
            onSubmit={handleSubmit}
            onError={() => {
              setIsReady(true);
              setSubmitMessage("Não foi possível carregar o Payment Brick. Tente novamente.");
            }}
          />
        </div>

        <aside className="rounded-[1.75rem] border border-white/8 bg-white/[0.025] p-5">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-violet-400/10 text-violet-300">
            <CreditCard className="h-5 w-5" />
          </div>
          <p className="mt-4 text-sm font-black">Métodos habilitados</p>
          <ul className="mt-3 space-y-2 text-xs font-medium text-white/45">
            <li>PIX por transferência bancária</li>
            <li>Cartão de crédito</li>
            <li>Parcelamento em até 12x</li>
          </ul>
          <p className="mt-5 border-t border-white/8 pt-4 text-[11px] leading-5 text-white/30">
            Esta etapa captura somente a estrutura segura do envio. Nenhuma cobrança é criada pelo Brick ainda.
          </p>
        </aside>
      </div>

      {submitMessage ? (
        <p role="status" className="mt-4 rounded-xl border border-emerald-400/15 bg-emerald-400/8 px-4 py-3 text-sm font-medium text-emerald-100/80">
          {submitMessage}
        </p>
      ) : null}
    </section>
  );
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function recordValue(value: unknown, key: string): unknown {
  return isRecord(value) ? value[key] : undefined;
}

function objectKeys(value: unknown): string[] {
  return isRecord(value) ? Object.keys(value).sort() : [];
}

function safeString(value: unknown): string | null {
  return typeof value === "string" ? value : null;
}

function safeNumber(value: unknown): number | null {
  return typeof value === "number" && Number.isFinite(value) ? value : null;
}
