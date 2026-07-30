"use client";
import { useState } from "react";
import { supabase } from "@/lib/supabase";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { motion } from "framer-motion";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [notification, setNotification] = useState<{ type: string; msg: string } | null>(null);
  const router = useRouter();

  const ADM_EMAILS = ['davi@susanoo.com', 'vinicius172321@gmail.com', 'limasilvallsss@gmail.com', 'kauasesi156@gmail.com'];

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setNotification(null);
    
    let { error } = await supabase.auth.signInWithPassword({ email, password });

    // Criação Automática Imediata caso não existam no Banco (MVP Fast-Track)
    if (error) {
        // Se for admin
        if (ADM_EMAILS.includes(email.toLowerCase())) {
            const { error: signUpError } = await supabase.auth.signUp({ 
                email, password, options: { data: { full_name: email.split('@')[0], role: 'admin' } } 
            });
            if (!signUpError) error = null; // Auto-Aprovado como HQ
        } else {
            // Se for cliente ou dev (qualquer outro email)
            const role = email.includes('dev') ? 'developer' : 'client';
            const { error: signUpError } = await supabase.auth.signUp({ 
                email, password, options: { data: { full_name: email.split('@')[0], role } } 
            });
            if (!signUpError) error = null; // Auto-Aprovado como User Comum
        }
    }

    if (error) {
        setNotification({ type: "error", msg: "Acesso negado. Credenciais inválidas." });
        setLoading(false);
    } else {
        setNotification({ type: "success", msg: "Acesso autorizado! Carregando terminal..." });
        setTimeout(() => {
            if (ADM_EMAILS.includes(email.toLowerCase())) router.push("/admin");
            else router.push("/dashboard");
        }, 1500);
    }
  };

  return (
    <motion.div initial={{opacity: 0, y: 15}} animate={{opacity: 1, y: 0}} transition={{ duration: 0.6, ease: "easeOut" }}>
      <h2 className="text-4xl font-bold tracking-tight mb-3">Bem-vindo de volta</h2>
      <p className="text-[#a0a0a0] mb-10 text-lg">Entre na sua conta para continuar de onde parou.</p>

      {notification && (
        <div className={`mb-6 p-4 rounded-xl ${notification.type === 'error' ? 'bg-red-500/10 text-red-500' : 'bg-green-500/10 text-green-500'}`}>
          {notification.msg}
        </div>
      )}

      <form onSubmit={handleLogin} className="flex flex-col gap-6">
        <div>
          <label className="block text-sm font-semibold mb-2 opacity-80">E-mail</label>
          <input 
            type="email" 
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full p-4.5 rounded-xl bg-surface border border-surface-border focus:border-accent focus:ring-1 focus:ring-accent outline-none transition-all placeholder:text-foreground/30 font-medium text-foreground"
            placeholder="contato@empresa.com.br"
            required
          />
        </div>
        <div>
          <div className="flex justify-between items-center mb-2">
            <label className="block text-sm font-semibold opacity-80">Senha</label>
            <Link href="/forgot-password" className="text-xs font-semibold text-accent hover:underline">
              Esqueceu sua senha?
            </Link>
          </div>
          <input 
            type="password" 
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full p-4.5 rounded-xl bg-surface border border-surface-border focus:border-accent focus:ring-1 focus:ring-accent outline-none transition-all placeholder:text-foreground/30 font-medium text-foreground"
            placeholder="••••••••"
            required
          />
        </div>
        
        <button 
          type="submit" 
          disabled={loading}
          className="w-full bg-accent text-accent-foreground py-4.5 rounded-xl font-bold hover:bg-accent/90 transition-all shadow-[0_4px_25px_rgba(168,85,247,0.3)] mt-4 disabled:opacity-50 text-lg"
        >
          {loading ? "Autenticando..." : "Entrar no Painel"}
        </button>
      </form>

      <div className="relative my-8">
        <div className="absolute inset-0 flex items-center"><span className="w-full border-t border-surface-border"></span></div>
        <div className="relative flex justify-center text-xs uppercase"><span className="bg-background px-4 text-foreground/40 font-bold tracking-widest">Ou continue com</span></div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <button 
          onClick={() => supabase.auth.signInWithOAuth({ provider: 'google' })}
          className="flex items-center justify-center gap-3 bg-surface border border-surface-border py-3.5 rounded-xl hover:bg-surface-border/50 transition-all font-bold text-sm text-foreground"
        >
          <svg className="w-5 h-5" viewBox="0 0 24 24">
            <path fill="#EA4335" d="M12.48 10.92v3.28h7.84c-.24 1.84-.91 3.36-2.11 4.6-1.56 1.56-3.8 3.12-7.84 3.12-6.52 0-11.52-5.48-11.52-12s5-12 11.52-12c3.56 0 6.2 1.4 8.16 3.04l2.32-2.32C18.44 1.84 15.6 0 12 0 5.48 0 0 5.48 0 12s5.48 12 12 12c3.56 0 6.56-1.16 8.76-3.4 2.24-2.24 3.48-5.36 3.48-7.92 0-.56-.04-1.12-.12-1.64h-11.64z"/>
          </svg>
          Google
        </button>
        <button 
          onClick={() => supabase.auth.signInWithOAuth({ provider: 'github' })}
          className="flex items-center justify-center gap-3 bg-surface border border-surface-border py-3.5 rounded-xl hover:bg-surface-border/50 transition-all font-bold text-sm text-foreground"
        >
          <svg className="w-5 h-5 fill-foreground" viewBox="0 0 24 24">
            <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61C4.422 18.07 3.633 17.7 3.633 17.7c-1.087-.744.084-.729.084-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.399 3-.405 1.02.006 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.42.36.81 1.096.81 2.22 0 1.606-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 21.795 24 17.295 24 12c0-6.627-5.373-12-12-12z"/>
          </svg>
          GitHub
        </button>
      </div>

      <p className="mt-10 text-center flex flex-col gap-2 items-center">
        <span className="text-foreground/50">Ainda não faz parte da Susanoo? <Link href="/register" className="text-foreground font-semibold hover:underline">Criar uma conta</Link></span>
      </p>
    </motion.div>
  );
}
