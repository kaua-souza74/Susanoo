"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import {
  ArrowLeft,
  ArrowRight,
  BriefcaseBusiness,
  CheckCircle2,
  LoaderCircle,
  MessageSquareText,
  ShoppingBag,
  Sparkles,
  Store,
  UserRoundCheck,
  Zap,
} from "lucide-react";
import { supabase } from "@/lib/supabase";

type WelcomeRole = "client" | "developer";

const CLIENT_STEPS = [
  {
    eyebrow: "Seu ponto de partida",
    title: "Descubra sites prontos para o seu negócio.",
    description: "Pesquise por segmento, estilo ou tecnologia e compare opções com preços sempre atualizados pelo Marketplace.",
    icon: Store,
  },
  {
    eyebrow: "Duas formas de avançar",
    title: "Compre um site ou converse com um desenvolvedor.",
    description: "Escolha uma solução pronta ou envie uma solicitação personalizada para o profissional que combina com a sua ideia.",
    icon: ShoppingBag,
  },
  {
    eyebrow: "Perfil no momento certo",
    title: "Complete seus dados somente ao contratar.",
    description: "Você pode explorar livremente. Quando comprar ou solicitar um projeto, pediremos os dados necessários para o atendimento.",
    icon: UserRoundCheck,
  },
  {
    eyebrow: "Tudo acompanhado",
    title: "Converse e acompanhe cada etapa.",
    description: "Use o chat e a linha do tempo para acompanhar briefing, desenvolvimento, ajustes e entrega em um só lugar.",
    icon: MessageSquareText,
  },
];

const DEVELOPER_STEPS = [
  {
    eyebrow: "Seu novo workspace",
    title: "Transforme projetos em oportunidades.",
    description: "A Susanoo organiza sua vitrine, solicitações e entregas sem tirar o foco do que você faz melhor.",
    icon: BriefcaseBusiness,
  },
  {
    eyebrow: "Vitrine profissional",
    title: "Publique projetos com preço e prévia.",
    description: "Cadastre seus sites, defina o valor no banco e apresente cada trabalho com imagens e demonstração ao vivo.",
    icon: ShoppingBag,
  },
  {
    eyebrow: "Perfil no momento certo",
    title: "Prepare seu perfil antes de publicar.",
    description: "Complete especialidades, experiência e contatos quando estiver pronto para receber solicitações de clientes.",
    icon: UserRoundCheck,
  },
  {
    eyebrow: "Operação centralizada",
    title: "Converse, entregue e acompanhe resultados.",
    description: "Gerencie mensagens, projetos e faturamento diretamente no seu painel de desenvolvedor.",
    icon: MessageSquareText,
  },
];

export default function WelcomePage() {
  const router = useRouter();
  const [role, setRole] = useState<WelcomeRole>("client");
  const [step, setStep] = useState(0);
  const [loading, setLoading] = useState(true);
  const [finishing, setFinishing] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const steps = useMemo(() => role === "developer" ? DEVELOPER_STEPS : CLIENT_STEPS, [role]);
  const currentStep = steps[step];
  const CurrentIcon = currentStep.icon;

  useEffect(() => {
    let active = true;

    const prepareWelcome = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!active) return;
      if (!user) {
        router.replace("/login");
        return;
      }

      const storageKey = `susanoo:${user.id}:welcome-completed`;
      if (user.user_metadata?.onboarding_completed === true || localStorage.getItem(storageKey) === "true") {
        router.replace("/dashboard");
        return;
      }

      setRole(user.user_metadata?.role === "developer" ? "developer" : "client");
      setLoading(false);
    };

    prepareWelcome();
    return () => { active = false; };
  }, [router]);

  const finishWelcome = async () => {
    setFinishing(true);
    setErrorMessage(null);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      router.replace("/login");
      return;
    }

    const { error } = await supabase.auth.updateUser({ data: { onboarding_completed: true } });
    if (error) {
      setErrorMessage("Não foi possível salvar essa etapa. Tente novamente.");
      setFinishing(false);
      return;
    }

    localStorage.setItem(`susanoo:${user.id}:welcome-completed`, "true");
    router.replace("/dashboard");
  };

  if (loading) {
    return (
      <main className="dark flex h-svh items-center justify-center overflow-hidden bg-[#050505] text-white">
        <LoaderCircle className="h-7 w-7 animate-spin text-violet-400" aria-label="Carregando apresentação" />
      </main>
    );
  }

  return (
    <main className="dark relative flex h-svh items-center justify-center overflow-hidden bg-[#050505] p-4 text-white sm:p-6">
      <div className="pointer-events-none absolute inset-0" aria-hidden="true">
        <div className="absolute -left-48 -top-40 h-[34rem] w-[34rem] rounded-full bg-violet-600/20 blur-[130px]" />
        <div className="absolute -bottom-48 right-[-10rem] h-[38rem] w-[38rem] rounded-full bg-fuchsia-600/15 blur-[145px]" />
        <div className="absolute inset-0 opacity-25 [background-image:radial-gradient(circle_at_center,rgba(168,85,247,0.3)_1px,transparent_1px)] [background-size:22px_22px] [mask-image:linear-gradient(to_bottom_right,black,transparent_72%)]" />
      </div>

      <section className="relative flex max-h-[calc(100svh-2rem)] w-full max-w-4xl flex-col overflow-hidden rounded-[2rem] bg-white/[0.055] shadow-2xl ring-1 ring-inset ring-white/10 backdrop-blur-2xl sm:max-h-[calc(100svh-3rem)] sm:rounded-[2.5rem]">
        <header className="flex shrink-0 items-center justify-between gap-4 px-5 py-4 sm:px-7">
          <div className="flex items-center gap-2.5">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-violet-600 text-white shadow-lg shadow-violet-900/40"><Zap className="h-4 w-4 fill-current" /></span>
            <div>
              <p className="text-sm font-black tracking-tight">Susanoo</p>
              <p className="text-[9px] font-black uppercase tracking-[0.18em] text-white/35">Primeiro acesso</p>
            </div>
          </div>
          <button type="button" onClick={finishWelcome} disabled={finishing} className="rounded-xl px-3 py-2 text-xs font-bold text-white/40 transition-colors hover:bg-white/5 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-400 disabled:opacity-50">
            Pular
          </button>
        </header>

        <div className="custom-scrollbar min-h-0 flex-1 overflow-y-auto px-5 pb-5 sm:px-7 sm:pb-7">
          <div className="relative min-h-[24rem] overflow-hidden rounded-[1.6rem] bg-[#09090b] p-6 ring-1 ring-inset ring-white/8 sm:min-h-[27rem] sm:p-10">
            <div className="pointer-events-none absolute right-[-5rem] top-[-5rem] h-64 w-64 rounded-full bg-violet-600/20 blur-3xl" aria-hidden="true" />
            <AnimatePresence mode="wait" initial={false}>
              <motion.div
                key={`${role}-${step}`}
                initial={{ opacity: 0, x: 28 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -28 }}
                transition={{ duration: 0.28, ease: "easeOut" }}
                className="relative flex min-h-[21rem] flex-col justify-between sm:min-h-[22rem]"
              >
                <div>
                  <div className="mb-7 flex h-14 w-14 items-center justify-center rounded-2xl bg-violet-500/12 text-violet-300 ring-1 ring-violet-400/20 sm:h-16 sm:w-16">
                    <CurrentIcon className="h-7 w-7 sm:h-8 sm:w-8" />
                  </div>
                  <p className="text-[10px] font-black uppercase tracking-[0.24em] text-violet-400">{currentStep.eyebrow}</p>
                  <h1 className="mt-3 max-w-2xl text-3xl font-black leading-[0.98] tracking-[-0.05em] sm:text-5xl">{currentStep.title}</h1>
                  <p className="mt-5 max-w-xl text-sm font-medium leading-relaxed text-white/48 sm:text-base">{currentStep.description}</p>
                </div>

                <div className="mt-7 flex items-center gap-2 text-xs font-bold text-white/35">
                  <Sparkles className="h-4 w-4 text-violet-400" />
                  Etapa {step + 1} de {steps.length}
                </div>
              </motion.div>
            </AnimatePresence>
          </div>

          {errorMessage ? <p role="alert" className="mt-3 text-center text-xs font-bold text-red-300">{errorMessage}</p> : null}

          <footer className="mt-4 flex items-center justify-between gap-3">
            <button
              type="button"
              onClick={() => setStep((current) => Math.max(0, current - 1))}
              disabled={step === 0 || finishing}
              aria-label="Etapa anterior"
              className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-white/5 text-white ring-1 ring-inset ring-white/10 transition-colors hover:bg-white/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-400 disabled:pointer-events-none disabled:opacity-25"
            >
              <ArrowLeft className="h-4 w-4" />
            </button>

            <div className="flex items-center gap-2" role="tablist" aria-label="Etapas da apresentação">
              {steps.map((item, index) => (
                <button
                  key={item.title}
                  type="button"
                  role="tab"
                  aria-selected={index === step}
                  aria-label={`Ir para etapa ${index + 1}`}
                  onClick={() => setStep(index)}
                  className={`h-2.5 rounded-full transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-400 ${index === step ? "w-8 bg-violet-500" : "w-2.5 bg-white/18 hover:bg-white/35"}`}
                />
              ))}
            </div>

            {step < steps.length - 1 ? (
              <button
                type="button"
                onClick={() => setStep((current) => Math.min(steps.length - 1, current + 1))}
                aria-label="Próxima etapa"
                className="flex h-11 items-center justify-center gap-2 rounded-2xl bg-violet-600 px-4 text-xs font-black text-white shadow-lg shadow-violet-950/40 transition-colors hover:bg-violet-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-400"
              >
                Próximo <ArrowRight className="h-4 w-4" />
              </button>
            ) : (
              <button
                type="button"
                onClick={finishWelcome}
                disabled={finishing}
                className="flex h-11 items-center justify-center gap-2 rounded-2xl bg-emerald-500 px-4 text-xs font-black text-white shadow-lg shadow-emerald-950/35 transition-colors hover:bg-emerald-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400 disabled:opacity-60"
              >
                {finishing ? <LoaderCircle className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4" />} Entrar
              </button>
            )}
          </footer>
        </div>
      </section>
    </main>
  );
}
