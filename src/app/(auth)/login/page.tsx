"use client";

import { Suspense, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { AlertCircle, BriefcaseBusiness, CheckCircle2, Eye, EyeOff, LoaderCircle, Store } from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";
import { supabase } from "@/lib/supabase";

const ADMIN_EMAILS = ["davi@susanoo.com", "vinicius172321@gmail.com", "limasilvallsss@gmail.com", "kauasesi156@gmail.com"];

type LoginRole = "client" | "developer";

function LoginForm() {
  const searchParams = useSearchParams();
  const role: LoginRole = searchParams.get("role") === "developer" ? "developer" : "client";
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [status, setStatus] = useState<"idle" | "loading" | "success">("idle");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [transitioning, setTransitioning] = useState(false);
  const router = useRouter();

  const handleLogin = async (event: React.FormEvent) => {
    event.preventDefault();
    setStatus("loading");
    setErrorMessage(null);

    const { data, error } = await supabase.auth.signInWithPassword({ email, password });

    if (error) {
      setErrorMessage("Acesso negado. Verifique seu e-mail e sua senha.");
      setStatus("idle");
      return;
    }

    setStatus("success");
    const user = data.user;
    const isAdmin = ADMIN_EMAILS.includes(email.toLowerCase());
    const rawSavedRole = String(user?.user_metadata?.role ?? user?.user_metadata?.account_type ?? "").toLowerCase();
    const savedRole: LoginRole | null = rawSavedRole.includes("desenvolvedor") || rawSavedRole === "developer"
      ? "developer"
      : rawSavedRole.includes("comércio") || rawSavedRole.includes("comercio") || rawSavedRole === "client"
        ? "client"
        : null;
    if (!isAdmin && savedRole && savedRole !== role) {
      await supabase.auth.signOut();
      setErrorMessage(
        role === "developer"
          ? "Esta conta é de cliente. Entre pela opção “Quero contratar”."
          : "Esta conta é de desenvolvedor. Entre pela opção “Sou dev”.",
      );
      setStatus("idle");
      return;
    }

    localStorage.setItem("susanoo_profile_type", role === "developer" ? "Desenvolvedor" : "Comércio");
    window.dispatchEvent(new Event("profileTypeChanged"));
    const { data: accountProfile } = user
      ? await supabase.from("profiles").select("onboarding_completed").eq("id", user.id).maybeSingle()
      : { data: null };
    const hasFinishedWelcome = user
      ? accountProfile?.onboarding_completed === true || user.user_metadata?.onboarding_completed === true || localStorage.getItem(`susanoo:${user.id}:welcome-completed`) === "true"
      : false;
    const destination = isAdmin ? "/admin" : hasFinishedWelcome ? "/dashboard" : "/welcome";
    window.setTimeout(() => setTransitioning(true), 420);
    window.setTimeout(() => router.replace(destination), 1050);
  };

  return (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.45, ease: "easeOut" }} className="mx-auto w-full">
      <span className="mb-3 flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.24em] text-violet-400">
        {role === "developer" ? <BriefcaseBusiness className="h-3.5 w-3.5" /> : <Store className="h-3.5 w-3.5" />}
        {role === "developer" ? "Acesso do desenvolvedor" : "Acesso do cliente"}
      </span>
      <h2 className="text-3xl font-black tracking-[-0.045em] text-white sm:text-4xl xl:text-[2.65rem]">
        {role === "developer" ? "Volte a criar." : "Bem-vindo de volta."}
      </h2>
      <p className="mb-6 mt-2 text-sm font-medium leading-relaxed text-white/45">
        {role === "developer" ? "Entre para publicar projetos e acompanhar clientes." : "Entre para descobrir sites e acompanhar suas entregas."}
      </p>

      {errorMessage ? (
        <div role="alert" aria-live="polite" className="mb-4 flex items-start gap-3 rounded-2xl bg-red-500/10 px-4 py-3 text-sm text-red-300 ring-1 ring-red-500/20">
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
          <span>{errorMessage}</span>
        </div>
      ) : null}

      <form onSubmit={handleLogin} className="flex flex-col gap-4">
        <div>
          <label htmlFor="login-email" className="mb-2 block text-xs font-bold text-white/65">E-mail</label>
          <input id="login-email" type="email" autoComplete="email" value={email} onChange={(event) => setEmail(event.target.value)} className="h-12 w-full rounded-2xl bg-white/[0.055] px-4 text-sm font-medium text-white ring-1 ring-inset ring-white/10 outline-none transition-all placeholder:text-white/25 hover:ring-white/20 focus:ring-2 focus:ring-violet-500" placeholder="voce@empresa.com.br" required />
        </div>

        <div>
          <div className="mb-2 flex items-center justify-between gap-4">
            <label htmlFor="login-password" className="text-xs font-bold text-white/65">Senha</label>
            <Link href="/forgot-password" className="text-xs font-bold text-violet-400 hover:text-violet-300 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500">Esqueceu sua senha?</Link>
          </div>
          <div className="relative">
            <input id="login-password" type={showPassword ? "text" : "password"} autoComplete="current-password" value={password} onChange={(event) => setPassword(event.target.value)} className="h-12 w-full rounded-2xl bg-white/[0.055] px-4 pr-14 text-sm font-medium text-white ring-1 ring-inset ring-white/10 outline-none transition-all placeholder:text-white/25 hover:ring-white/20 focus:ring-2 focus:ring-violet-500" placeholder="Digite sua senha" required />
            <button type="button" onClick={() => setShowPassword((current) => !current)} aria-label={showPassword ? "Ocultar senha" : "Mostrar senha"} className="absolute right-2 top-1/2 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-xl text-white/35 hover:bg-white/5 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500">
              {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
        </div>

        <motion.button
          type="submit"
          disabled={status !== "idle"}
          animate={status === "success" ? { scale: [1, 1.025, 1] } : { scale: 1 }}
          className={`mt-1 flex h-12 w-full items-center justify-center gap-2 rounded-2xl px-5 text-sm font-black text-white transition-colors duration-300 active:scale-[0.98] disabled:pointer-events-none focus-visible:outline-none focus-visible:ring-2 ${status === "success" ? "bg-emerald-500 shadow-[0_14px_40px_rgba(16,185,129,0.3)] focus-visible:ring-emerald-400" : "bg-violet-600 shadow-[0_14px_40px_rgba(124,58,237,0.28)] hover:bg-violet-500 focus-visible:ring-violet-400"}`}
        >
          {status === "loading" ? <><LoaderCircle className="h-4 w-4 animate-spin" /> Entrando...</> : status === "success" ? <><CheckCircle2 className="h-5 w-5" /> Entrar</> : "Entrar no painel"}
        </motion.button>
      </form>

      <div className="my-5 flex items-center gap-4" aria-hidden="true"><span className="h-px flex-1 bg-white/10" /><span className="text-[10px] font-bold uppercase tracking-[0.18em] text-white/30">ou continue com</span><span className="h-px flex-1 bg-white/10" /></div>

      <div className="grid grid-cols-1 gap-3 min-[380px]:grid-cols-2">
        <button type="button" onClick={() => { localStorage.setItem("susanoo_profile_type", role === "developer" ? "Desenvolvedor" : "Comércio"); void supabase.auth.signInWithOAuth({ provider: "google", options: { redirectTo: `${window.location.origin}/welcome` } }); }} className="flex h-12 items-center justify-center gap-2 rounded-2xl bg-white/[0.035] text-xs font-bold text-white/75 ring-1 ring-inset ring-white/10 hover:bg-white/[0.07] hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500"><span className="font-black text-[#4285F4]">G</span> Google</button>
        <button type="button" onClick={() => { localStorage.setItem("susanoo_profile_type", role === "developer" ? "Desenvolvedor" : "Comércio"); void supabase.auth.signInWithOAuth({ provider: "github", options: { redirectTo: `${window.location.origin}/welcome` } }); }} className="flex h-12 items-center justify-center gap-2 rounded-2xl bg-white/[0.035] text-xs font-bold text-white/75 ring-1 ring-inset ring-white/10 hover:bg-white/[0.07] hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500"><svg viewBox="0 0 24 24" aria-hidden="true" className="h-4 w-4 fill-current"><path d="M12 0C5.37 0 0 5.37 0 12c0 5.3 3.44 9.8 8.21 11.39.6.11.82-.26.82-.58v-2.04c-3.34.72-4.04-1.61-4.04-1.61-.55-1.39-1.34-1.76-1.34-1.76-1.09-.74.08-.73.08-.73 1.21.08 1.84 1.24 1.84 1.24 1.07 1.84 2.81 1.31 3.5 1 .11-.78.42-1.31.76-1.61-2.67-.3-5.47-1.33-5.47-5.93 0-1.31.47-2.38 1.24-3.22-.14-.3-.54-1.52.1-3.18 0 0 1.01-.32 3.3 1.23A11.5 11.5 0 0 1 12 6.8c1.02.01 2.04.14 3 .4 2.28-1.55 3.29-1.23 3.29-1.23.64 1.66.24 2.88.12 3.18.76.84 1.23 1.91 1.23 3.22 0 4.61-2.81 5.63-5.48 5.93.42.36.81 1.1.81 2.22v3.29c0 .32.21.69.83.57A12 12 0 0 0 12 0Z" /></svg> GitHub</button>
      </div>

      <div className="mt-5 space-y-2 text-center text-sm text-white/40">
        <p>Ainda não tem uma conta? <Link href={`/register?role=${role}`} className="font-bold text-white hover:text-violet-300 hover:underline">Criar conta</Link></p>
        <Link href={`/login?role=${role === "developer" ? "client" : "developer"}`} className="inline-flex font-bold text-violet-400 hover:text-violet-300 hover:underline">
          {role === "developer" ? "Quero contratar" : "Entrar como desenvolvedor"}
        </Link>
      </div>

      <AnimatePresence>
        {transitioning ? (
          <motion.div className="fixed inset-0 z-[200] flex items-center justify-center overflow-hidden bg-[#070707]" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <motion.div className="absolute h-40 w-40 rounded-full bg-emerald-500" initial={{ scale: 0 }} animate={{ scale: 18 }} transition={{ duration: 0.65, ease: [0.76, 0, 0.24, 1] }} />
            <motion.div className="relative z-10 flex h-20 w-20 items-center justify-center rounded-full bg-white text-emerald-600 shadow-2xl" initial={{ scale: 0.6, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ delay: 0.12, type: "spring", stiffness: 260, damping: 18 }}>
              <CheckCircle2 className="h-10 w-10" />
            </motion.div>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </motion.div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="h-[32rem] w-full animate-pulse rounded-3xl bg-white/[0.025]" />}>
      <LoginForm />
    </Suspense>
  );
}
