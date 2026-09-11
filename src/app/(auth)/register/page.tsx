"use client";

import { Suspense, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import {
  AlertCircle,
  BriefcaseBusiness,
  Check,
  CheckCircle2,
  Eye,
  EyeOff,
  LoaderCircle,
  Store,
} from "lucide-react";
import { supabase } from "@/lib/supabase";

type AccountRole = "client" | "developer";
type RegisterStatus = "idle" | "loading" | "success";

function RegisterForm() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [role, setRole] = useState<AccountRole>(() => searchParams.get("role") === "developer" ? "developer" : "client");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [status, setStatus] = useState<RegisterStatus>("idle");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const passwordChecks = useMemo(() => [
    { label: "8 caracteres", valid: password.length >= 8 },
    { label: "1 maiúscula", valid: /[A-Z]/.test(password) },
    { label: "1 símbolo", valid: /[!@#$%^&*(),.?":{}|<>]/.test(password) },
  ], [password]);
  const passwordIsValid = passwordChecks.every((check) => check.valid);

  const chooseRole = (nextRole: AccountRole) => {
    setRole(nextRole);
    router.replace(`/register?role=${nextRole}`, { scroll: false });
  };

  const handleRegister = async (event: React.FormEvent) => {
    event.preventDefault();
    setStatus("loading");
    setErrorMessage(null);

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: name.trim(),
          role,
          onboarding_completed: false,
        },
      },
    });

    if (error) {
      setErrorMessage(error.message);
      setStatus("idle");
      return;
    }

    const userId = data.user?.id ?? "anonymous";
    const accountType = role === "developer" ? "Desenvolvedor" : "Comércio";
    localStorage.setItem("susanoo_profile_type", accountType);
    localStorage.setItem(`susanoo:${userId}:welcome-completed`, "false");
    localStorage.setItem(
      `susanoo:${userId}:${role === "developer" ? "dev-profile" : "client-profile"}`,
      JSON.stringify({ name: name.trim(), email, completed: false }),
    );
    window.dispatchEvent(new Event("profileTypeChanged"));

    setStatus("success");
    window.setTimeout(() => router.replace(data.session ? "/welcome" : "/login"), 900);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45, ease: "easeOut" }}
      className="mx-auto w-full"
    >
      <span className="mb-3 block text-[10px] font-black uppercase tracking-[0.24em] text-violet-400">Nova conta Susanoo</span>
      <h2 className="text-3xl font-black tracking-[-0.045em] text-white sm:text-4xl">Comece do seu jeito.</h2>
      <p className="mb-5 mt-2 text-sm font-medium leading-relaxed text-white/45">
        Crie apenas o acesso agora. Os dados do perfil serão pedidos quando realmente forem necessários.
      </p>

      <div className="mb-5 grid grid-cols-2 gap-2 rounded-2xl bg-white/[0.04] p-1.5 ring-1 ring-inset ring-white/10" aria-label="Tipo de conta">
        <button
          type="button"
          onClick={() => chooseRole("client")}
          aria-pressed={role === "client"}
          className={`flex min-h-12 items-center justify-center gap-2 rounded-xl px-3 text-xs font-black transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-400 ${role === "client" ? "bg-violet-600 text-white shadow-lg shadow-violet-950/40" : "text-white/45 hover:bg-white/5 hover:text-white"}`}
        >
          <Store className="h-4 w-4" /> Quero contratar
        </button>
        <button
          type="button"
          onClick={() => chooseRole("developer")}
          aria-pressed={role === "developer"}
          className={`flex min-h-12 items-center justify-center gap-2 rounded-xl px-3 text-xs font-black transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-400 ${role === "developer" ? "bg-violet-600 text-white shadow-lg shadow-violet-950/40" : "text-white/45 hover:bg-white/5 hover:text-white"}`}
        >
          <BriefcaseBusiness className="h-4 w-4" /> Sou dev
        </button>
      </div>

      <AnimatePresence>
        {errorMessage ? (
          <motion.div
            role="alert"
            aria-live="polite"
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            className="mb-4 flex items-start gap-3 rounded-2xl bg-red-500/10 px-4 py-3 text-sm text-red-300 ring-1 ring-red-500/20"
          >
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
            <span>{errorMessage}</span>
          </motion.div>
        ) : null}
      </AnimatePresence>

      <form onSubmit={handleRegister} className="flex flex-col gap-3.5">
        <div>
          <label htmlFor="register-name" className="mb-1.5 block text-xs font-bold text-white/65">
            {role === "developer" ? "Seu nome" : "Seu nome ou empresa"}
          </label>
          <input
            id="register-name"
            type="text"
            autoComplete="name"
            value={name}
            onChange={(event) => setName(event.target.value)}
            disabled={status === "success"}
            className="h-12 w-full rounded-2xl bg-white/[0.055] px-4 text-sm font-medium text-white ring-1 ring-inset ring-white/10 outline-none transition-all placeholder:text-white/25 hover:ring-white/20 focus:ring-2 focus:ring-violet-500 disabled:opacity-60"
            placeholder={role === "developer" ? "Como você quer ser chamado?" : "Quem está criando este projeto?"}
            required
          />
        </div>

        <div>
          <label htmlFor="register-email" className="mb-1.5 block text-xs font-bold text-white/65">E-mail</label>
          <input
            id="register-email"
            type="email"
            autoComplete="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            disabled={status === "success"}
            className="h-12 w-full rounded-2xl bg-white/[0.055] px-4 text-sm font-medium text-white ring-1 ring-inset ring-white/10 outline-none transition-all placeholder:text-white/25 hover:ring-white/20 focus:ring-2 focus:ring-violet-500 disabled:opacity-60"
            placeholder="voce@empresa.com.br"
            required
          />
        </div>

        <div>
          <label htmlFor="register-password" className="mb-1.5 block text-xs font-bold text-white/65">Senha</label>
          <div className="relative">
            <input
              id="register-password"
              type={showPassword ? "text" : "password"}
              autoComplete="new-password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              disabled={status === "success"}
              className="h-12 w-full rounded-2xl bg-white/[0.055] px-4 pr-14 text-sm font-medium text-white ring-1 ring-inset ring-white/10 outline-none transition-all placeholder:text-white/25 hover:ring-white/20 focus:ring-2 focus:ring-violet-500 disabled:opacity-60"
              placeholder="Crie uma senha segura"
              minLength={8}
              required
            />
            <button
              type="button"
              onClick={() => setShowPassword((current) => !current)}
              aria-label={showPassword ? "Ocultar senha" : "Mostrar senha"}
              className="absolute right-2 top-1/2 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-xl text-white/35 hover:bg-white/5 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500"
            >
              {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
          <div className="mt-2.5 flex flex-wrap gap-1.5">
            {passwordChecks.map((check) => (
              <span key={check.label} className={`inline-flex items-center gap-1 rounded-full px-2 py-1 text-[10px] font-bold ring-1 ring-inset ${check.valid ? "bg-emerald-500/10 text-emerald-300 ring-emerald-500/20" : "bg-white/[0.035] text-white/30 ring-white/10"}`}>
                <Check className="h-3 w-3" /> {check.label}
              </span>
            ))}
          </div>
        </div>

        <motion.button
          type="submit"
          disabled={status !== "idle" || !passwordIsValid}
          animate={status === "success" ? { scale: [1, 1.025, 1] } : { scale: 1 }}
          className={`mt-1 flex h-12 w-full items-center justify-center gap-2 rounded-2xl px-5 text-sm font-black text-white transition-colors active:scale-[0.98] disabled:pointer-events-none disabled:opacity-45 focus-visible:outline-none focus-visible:ring-2 ${status === "success" ? "bg-emerald-500 shadow-[0_14px_40px_rgba(16,185,129,0.3)] focus-visible:ring-emerald-400" : "bg-violet-600 shadow-[0_14px_40px_rgba(124,58,237,0.28)] hover:bg-violet-500 focus-visible:ring-violet-400"}`}
        >
          {status === "loading" ? <><LoaderCircle className="h-4 w-4 animate-spin" /> Criando conta...</> : status === "success" ? <><CheckCircle2 className="h-5 w-5" /> Conta criada</> : `Criar conta de ${role === "developer" ? "desenvolvedor" : "cliente"}`}
        </motion.button>
      </form>

      <p className="mt-5 text-center text-sm text-white/40">
        Já possui acesso? <Link href="/login" className="font-bold text-white hover:text-violet-300 hover:underline">Fazer login</Link>
      </p>
    </motion.div>
  );
}

export default function RegisterPage() {
  return (
    <Suspense fallback={<div className="flex items-center justify-center p-12"><LoaderCircle className="h-7 w-7 animate-spin text-violet-400" /></div>}>
      <RegisterForm />
    </Suspense>
  );
}
