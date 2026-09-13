"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  ArrowLeft,
  Check,
  CheckCircle2,
  Copy,
  CreditCard,
  ExternalLink,
  LockKeyhole,
  QrCode,
  ShieldCheck,
  Sparkles,
} from "lucide-react";

import { Logo } from "@/components/logo";
import { MercadoPagoPaymentBrick } from "@/components/checkout/MercadoPagoPaymentBrick";
import { initializeMercadoPago } from "@/lib/mercadopago/client";
import type { ServiceId } from "@/lib/mercadopago/services";
import type { PaymentStatus } from "@/lib/mercadopago/status";
import type { PixOrderResponse } from "@/lib/mercadopago/types";
import { supabase } from "@/lib/supabase";

type PaymentMethod = "pix" | "card";

type CheckoutService = {
  id: ServiceId;
  name: string;
  description: string;
  deliveryLabel: string;
  formattedPrice: string;
  amountInCents: number;
  isSandbox: boolean;
  sessionScope: string;
};

const POLLING_INTERVAL_MS = 15_000;

export function CheckoutExperience({
  service,
  brickDiagnosticsEnabled,
}: {
  service: CheckoutService;
  brickDiagnosticsEnabled: boolean;
}) {
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("pix");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [order, setOrder] = useState<PixOrderResponse | null>(null);
  const [copied, setCopied] = useState(false);
  const checkoutSessionIdRef = useRef<string | null>(null);
  const activeOrderId = order?.orderId ?? null;
  const shouldMonitorOrder = order?.status === "pending";

  useEffect(() => {
    void initializeMercadoPago().catch(() => {
      // O SDK de navegador será necessário para cartão. O fluxo PIX usa a
      // Orders API exclusivamente no servidor.
    });
  }, []);

  useEffect(() => {
    if (!activeOrderId || !shouldMonitorOrder) return;

    let active = true;

    const refreshStatus = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (!session || !active) return;

      try {
        const response = await fetch(
          `/api/mercadopago/order/${encodeURIComponent(activeOrderId)}`,
          {
            headers: { Authorization: `Bearer ${session.access_token}` },
            cache: "no-store",
          },
        );
        const payload: unknown = await response.json();

        if (active && response.ok && isPixOrderResponse(payload)) {
          setOrder(payload);
          if (payload.status === "approved") {
            sessionStorage.removeItem(
              checkoutStorageKey(service.id, service.sessionScope),
            );
          }
        }
      } catch {
        // O webhook continua sendo a fonte principal de reconciliação. Uma
        // falha pontual no refresh não interrompe o checkout.
      }
    };

    const intervalId = window.setInterval(
      () => void refreshStatus(),
      POLLING_INTERVAL_MS,
    );

    return () => {
      active = false;
      window.clearInterval(intervalId);
    };
  }, [activeOrderId, service.id, service.sessionScope, shouldMonitorOrder]);

  async function handleSubmit() {
    setMessage(null);
    setCopied(false);

    if (paymentMethod === "card") {
      setMessage(
        "A tokenização e o parcelamento por cartão serão habilitados em uma próxima etapa.",
      );
      return;
    }

    setIsSubmitting(true);

    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session) {
        setMessage("Entre na sua conta para continuar com o pagamento.");
        return;
      }

      const checkoutSessionId =
        checkoutSessionIdRef.current ??
        getOrCreateCheckoutSessionId(service.id, service.sessionScope);
      checkoutSessionIdRef.current = checkoutSessionId;

      const response = await fetch("/api/mercadopago/order", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${session.access_token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          serviceId: service.id,
          paymentMethod,
          checkoutSessionId,
        }),
      });

      const payload: unknown = await response.json();

      if (!response.ok || !isPixOrderResponse(payload)) {
        setMessage(readSafeError(payload));
        return;
      }

      setOrder(payload);
      if (payload.status === "approved") {
        sessionStorage.removeItem(
          checkoutStorageKey(service.id, service.sessionScope),
        );
      }
    } catch {
      setMessage("Não foi possível conectar ao serviço de pagamento.");
    } finally {
      setIsSubmitting(false);
    }
  }

  async function copyPixCode() {
    if (!order?.qrCode) return;

    try {
      await navigator.clipboard.writeText(order.qrCode);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2_000);
    } catch {
      setMessage("Não foi possível copiar automaticamente. Selecione o código manualmente.");
    }
  }

  if (order?.status === "approved") {
    return <ApprovedPayment service={service} order={order} />;
  }

  return (
    <main className="relative min-h-screen overflow-hidden bg-[#07060a] text-white">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_20%_0%,rgba(124,58,237,0.14),transparent_38%)]" />

      <div className="relative mx-auto flex min-h-screen w-full max-w-7xl flex-col px-5 py-6 sm:px-8 lg:px-12">
        <header className="flex items-center justify-between border-b border-white/8 pb-5">
          <Logo size="xs" />
          <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.18em] text-white/45">
            <LockKeyhole className="h-3.5 w-3.5 text-emerald-400" />
            {service.isSandbox ? "Ambiente de teste" : "Pagamento seguro"}
          </div>
        </header>

        <div className="grid flex-1 items-center gap-10 py-10 lg:grid-cols-[minmax(0,1fr)_25rem] lg:gap-16 lg:py-14">
          <section className="mx-auto w-full max-w-2xl lg:mx-0">
            <Link
              href="/dashboard"
              className="mb-10 inline-flex items-center gap-2 text-sm font-bold text-white/45 transition-colors hover:text-white"
            >
              <ArrowLeft className="h-4 w-4" />
              Voltar para a Susanoo
            </Link>

            {order ? (
              <PixPaymentPanel
                copied={copied}
                formattedPrice={service.formattedPrice}
                onCopy={copyPixCode}
                order={order}
              />
            ) : (
              <PaymentSelection
                paymentMethod={paymentMethod}
                setPaymentMethod={(method) => {
                  setPaymentMethod(method);
                  setMessage(null);
                }}
              />
            )}

            {message ? (
              <p role="alert" className="mt-4 rounded-xl border border-amber-400/15 bg-amber-400/8 px-4 py-3 text-sm font-medium text-amber-100/80">
                {message}
              </p>
            ) : null}
          </section>

          <OrderSummary
            isSubmitting={isSubmitting}
            onSubmit={handleSubmit}
            order={order}
            service={service}
          />
        </div>
        {!order ? (
          <MercadoPagoPaymentBrick
            amountInCents={service.amountInCents}
            diagnosticsEnabled={brickDiagnosticsEnabled}
            serviceId={service.id}
            sessionScope={service.sessionScope}
          />
        ) : null}
      </div>
    </main>
  );
}

function PaymentSelection({
  paymentMethod,
  setPaymentMethod,
}: {
  paymentMethod: PaymentMethod;
  setPaymentMethod: (method: PaymentMethod) => void;
}) {
  return (
    <>
      <div className="mb-9">
        <span className="mb-4 inline-flex items-center gap-2 rounded-full border border-violet-400/15 bg-violet-400/8 px-3 py-1.5 text-[10px] font-black uppercase tracking-[0.2em] text-violet-300">
          <Sparkles className="h-3.5 w-3.5" /> Checkout transparente
        </span>
        <h1 className="max-w-xl text-3xl font-black tracking-[-0.04em] sm:text-5xl">
          Seu próximo projeto começa aqui.
        </h1>
        <p className="mt-4 max-w-xl text-sm font-medium leading-6 text-white/45 sm:text-base">
          Escolha como deseja pagar. Seus dados financeiros serão processados com segurança pelo Mercado Pago.
        </p>
      </div>

      <fieldset>
        <legend className="mb-4 text-xs font-black uppercase tracking-[0.18em] text-white/40">
          Método de pagamento
        </legend>
        <div className="grid gap-3 sm:grid-cols-2">
          <PaymentMethodButton
            active={paymentMethod === "pix"}
            description="Confirmação rápida"
            icon={<QrCode className="h-5 w-5" />}
            label="PIX"
            onClick={() => setPaymentMethod("pix")}
          />
          <PaymentMethodButton
            active={paymentMethod === "card"}
            description="Crédito e parcelas"
            icon={<CreditCard className="h-5 w-5" />}
            label="Cartão"
            onClick={() => setPaymentMethod("card")}
          />
        </div>
      </fieldset>

      <div className="mt-4 rounded-2xl border border-white/8 bg-white/[0.025] p-5">
        {paymentMethod === "pix" ? (
          <div className="flex items-start gap-4">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-400/10 text-emerald-400">
              <QrCode className="h-5 w-5" />
            </div>
            <div>
              <p className="text-sm font-bold">PIX via Mercado Pago</p>
              <p className="mt-1 text-xs leading-5 text-white/40">
                O QR Code será gerado pelo Mercado Pago e ficará disponível nesta tela.
              </p>
            </div>
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2">
            <PreparedField label="Dados do cartão" value="Tokenização segura" />
            <PreparedField label="Parcelamento" value="Até 12x · em breve" />
          </div>
        )}
      </div>
    </>
  );
}

function PixPaymentPanel({
  copied,
  formattedPrice,
  onCopy,
  order,
}: {
  copied: boolean;
  formattedPrice: string;
  onCopy: () => void;
  order: PixOrderResponse;
}) {
  return (
    <div>
      <span className="inline-flex items-center gap-2 rounded-full border border-amber-300/15 bg-amber-300/8 px-3 py-1.5 text-[10px] font-black uppercase tracking-[0.18em] text-amber-200">
        <span className="h-2 w-2 animate-pulse rounded-full bg-amber-300" />
        {statusLabel(order.status)}
      </span>
      <h1 className="mt-5 text-3xl font-black tracking-[-0.04em] sm:text-4xl">
        Pague com PIX
      </h1>
      <p className="mt-3 text-sm leading-6 text-white/45">
        Escaneie o QR Code no aplicativo do seu banco ou use o código Copia e Cola.
      </p>

      <div className="mt-7 grid gap-6 rounded-3xl border border-white/10 bg-white/[0.025] p-5 sm:grid-cols-[12rem_minmax(0,1fr)] sm:p-6">
        <div className="mx-auto flex h-48 w-48 items-center justify-center rounded-2xl bg-white p-3 sm:mx-0">
          {order.qrCodeBase64 ? (
            <Image
              src={`data:image/png;base64,${order.qrCodeBase64}`}
              alt="QR Code PIX"
              width={168}
              height={168}
              unoptimized
              className="h-full w-full object-contain"
            />
          ) : (
            <div className="text-center text-xs font-bold text-zinc-500">
              QR Code em processamento
            </div>
          )}
        </div>

        <div className="min-w-0">
          <p className="text-[10px] font-black uppercase tracking-[0.18em] text-white/35">Valor</p>
          <p className="mt-1 text-2xl font-black">{formattedPrice}</p>
          <p className="mt-5 text-[10px] font-black uppercase tracking-[0.18em] text-white/35">PIX Copia e Cola</p>
          <div className="mt-2 max-h-24 overflow-y-auto break-all rounded-xl border border-white/8 bg-black/20 p-3 font-mono text-[11px] leading-5 text-white/45">
            {order.qrCode ?? "Código sendo preparado pelo Mercado Pago."}
          </div>
          <button
            type="button"
            onClick={onCopy}
            disabled={!order.qrCode}
            className="mt-3 flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-emerald-500 px-4 text-xs font-black text-[#04110b] transition-colors hover:bg-emerald-400 disabled:cursor-not-allowed disabled:opacity-40"
          >
            {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
            {copied ? "Código copiado" : "Copiar código PIX"}
          </button>
          {order.ticketUrl ? (
            <a
              href={order.ticketUrl}
              target="_blank"
              rel="noreferrer"
              className="mt-3 flex items-center justify-center gap-2 text-xs font-bold text-white/40 transition-colors hover:text-white/70"
            >
              Abrir instruções do Mercado Pago <ExternalLink className="h-3.5 w-3.5" />
            </a>
          ) : null}
        </div>
      </div>

      <p className="mt-4 text-center text-[10px] font-bold uppercase tracking-[0.15em] text-white/25">
        Atualização automática a cada 15 segundos · ID {order.orderId}
      </p>
    </div>
  );
}

function OrderSummary({
  isSubmitting,
  onSubmit,
  order,
  service,
}: {
  isSubmitting: boolean;
  onSubmit: () => void;
  order: PixOrderResponse | null;
  service: CheckoutService;
}) {
  return (
    <aside className="rounded-[1.75rem] border border-white/10 bg-[#0d0b12] p-6 shadow-2xl shadow-black/40 sm:p-7">
      <p className="text-[10px] font-black uppercase tracking-[0.2em] text-white/35">Resumo do serviço</p>
      <div className="mt-6 border-b border-white/8 pb-6">
        <div className="flex h-11 w-11 items-center justify-center rounded-2xl border border-violet-400/15 bg-violet-400/10 text-violet-300">
          <Sparkles className="h-5 w-5" />
        </div>
        <h2 className="mt-5 text-xl font-black tracking-tight">{service.name}</h2>
        {service.isSandbox ? (
          <p className="mt-2 text-sm font-black text-violet-300">
            Pagamento teste: {service.formattedPrice}
          </p>
        ) : null}
        <p className="mt-2 text-sm leading-6 text-white/40">{service.description}</p>
      </div>
      <div className="space-y-4 py-6 text-sm">
        <div className="flex items-center justify-between gap-4 text-white/45">
          <span>Modalidade</span>
          <span className="text-right font-bold text-white/75">{service.deliveryLabel}</span>
        </div>
        <div className="flex items-center justify-between gap-4 text-white/45">
          <span>Status</span>
          <span className={order ? "font-bold text-amber-300" : "font-bold text-white/75"}>
            {order ? statusLabel(order.status) : "Aguardando confirmação"}
          </span>
        </div>
      </div>
      <div className="flex items-end justify-between border-t border-white/8 pt-6">
        <span className="text-sm font-bold text-white/55">Total</span>
        <span className="text-3xl font-black tracking-[-0.04em]">{service.formattedPrice}</span>
      </div>

      {!order ? (
        <button
          type="button"
          onClick={onSubmit}
          disabled={isSubmitting}
          className="mt-7 flex h-14 w-full items-center justify-center gap-2 rounded-2xl bg-violet-600 px-5 text-sm font-black text-white shadow-lg shadow-violet-950/40 transition-all hover:bg-violet-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-300 disabled:cursor-not-allowed disabled:opacity-55"
        >
          {isSubmitting ? (
            <span className="h-5 w-5 animate-spin rounded-full border-2 border-white/25 border-t-white" />
          ) : (
            <>
              Confirmar pagamento
              <LockKeyhole className="h-4 w-4" />
            </>
          )}
        </button>
      ) : null}

      <div className="mt-5 flex items-center justify-center gap-2 text-[10px] font-bold uppercase tracking-[0.16em] text-white/25">
        <ShieldCheck className="h-4 w-4" />
        Processado pelo Mercado Pago
      </div>
    </aside>
  );
}

function ApprovedPayment({
  service,
  order,
}: {
  service: CheckoutService;
  order: PixOrderResponse;
}) {
  return (
    <main className="relative flex min-h-screen items-center justify-center overflow-hidden bg-[#07060a] px-5 py-12 text-white">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_50%_30%,rgba(16,185,129,0.13),transparent_38%)]" />
      <div className="relative w-full max-w-lg rounded-[2rem] border border-emerald-400/15 bg-[#0d0b12] p-7 text-center shadow-2xl shadow-black/40 sm:p-10">
        <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full border border-emerald-400/25 bg-emerald-400/10 text-emerald-400">
          <CheckCircle2 className="h-10 w-10" />
        </div>
        <p className="mt-6 text-[10px] font-black uppercase tracking-[0.2em] text-emerald-300">Pagamento aprovado</p>
        <h1 className="mt-3 text-3xl font-black tracking-[-0.04em] sm:text-4xl">Tudo certo.</h1>
        <p className="mt-4 text-sm leading-6 text-white/45">
          Recebemos o pagamento de {service.formattedPrice} pelo serviço {service.name}. Seu projeto já pode seguir para a próxima etapa.
        </p>
        <p className="mt-5 break-all text-[10px] font-bold uppercase tracking-[0.12em] text-white/20">Order {order.orderId}</p>
        <Link href="/dashboard" className="mt-8 flex h-13 w-full items-center justify-center rounded-2xl bg-emerald-500 px-5 text-sm font-black text-[#04110b] transition-colors hover:bg-emerald-400">
          Voltar ao painel
        </Link>
      </div>
    </main>
  );
}

function PaymentMethodButton({
  active,
  description,
  icon,
  label,
  onClick,
}: {
  active: boolean;
  description: string;
  icon: React.ReactNode;
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      aria-pressed={active}
      onClick={onClick}
      className={`flex items-center gap-4 rounded-2xl border p-4 text-left transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-300 ${
        active
          ? "border-violet-400/45 bg-violet-400/10 text-white"
          : "border-white/8 bg-white/[0.025] text-white/45 hover:border-white/15 hover:text-white/75"
      }`}
    >
      <span className={`flex h-10 w-10 items-center justify-center rounded-xl ${active ? "bg-violet-400/15 text-violet-300" : "bg-white/5"}`}>
        {icon}
      </span>
      <span>
        <span className="block text-sm font-black">{label}</span>
        <span className="mt-0.5 block text-xs opacity-55">{description}</span>
      </span>
    </button>
  );
}

function PreparedField({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-[10px] font-black uppercase tracking-[0.16em] text-white/30">{label}</p>
      <div className="mt-2 rounded-xl border border-white/8 bg-black/15 px-4 py-3 text-sm font-bold text-white/45">
        {value}
      </div>
    </div>
  );
}

function getOrCreateCheckoutSessionId(
  serviceId: ServiceId,
  sessionScope: string,
): string {
  const storageKey = checkoutStorageKey(serviceId, sessionScope);
  const storedId = sessionStorage.getItem(storageKey);
  if (storedId) return storedId;

  const checkoutSessionId = crypto.randomUUID();
  sessionStorage.setItem(storageKey, checkoutSessionId);
  return checkoutSessionId;
}

function checkoutStorageKey(
  serviceId: ServiceId,
  sessionScope: string,
): string {
  return `susanoo_mp_checkout_${serviceId}_${sessionScope}`;
}

function isPixOrderResponse(value: unknown): value is PixOrderResponse {
  if (!isRecord(value)) return false;

  return (
    typeof value.orderId === "string" &&
    value.serviceId === "site-institucional" &&
    typeof value.amountInCents === "number" &&
    value.currency === "BRL" &&
    isPaymentStatus(value.status) &&
    (typeof value.statusDetail === "string" || value.statusDetail === null) &&
    (typeof value.qrCode === "string" || value.qrCode === null) &&
    (typeof value.qrCodeBase64 === "string" || value.qrCodeBase64 === null) &&
    (typeof value.ticketUrl === "string" || value.ticketUrl === null)
  );
}

function isPaymentStatus(value: unknown): value is PaymentStatus {
  return (
    value === "pending" ||
    value === "approved" ||
    value === "rejected" ||
    value === "cancelled" ||
    value === "refunded"
  );
}

function statusLabel(status: PaymentStatus): string {
  const labels: Record<PaymentStatus, string> = {
    pending: "Aguardando pagamento",
    approved: "Pagamento aprovado",
    rejected: "Pagamento rejeitado",
    cancelled: "Pagamento cancelado",
    refunded: "Pagamento reembolsado",
  };

  return labels[status];
}

function readSafeError(value: unknown): string {
  if (isRecord(value) && typeof value.error === "string") {
    return value.error;
  }

  return "Não foi possível processar o pagamento.";
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}
