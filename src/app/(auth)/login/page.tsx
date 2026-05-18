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

  const ADM_EMAILS = ['davi@susanoo.com', 'vinicius@susanoo.com', 'lucas@susanoo.com', 'kaua@susanoo.com'];

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setNotification(null);
    
    let { error } = await supabase.auth.signInWithPassword({ email, password });

    // Criação Automática Imediata caso não existam no Banco (MVP Fast-Track)
    if (error && ADM_EMAILS.includes(email.toLowerCase())) {
        const { error: signUpError } = await supabase.auth.signUp({ 
            email, password, options: { data: { full_name: email.split('@')[0], role: 'admin' } } 
        });
        if (!signUpError) error = null; // Auto-Aprovado como HQ
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
      <p className="text-[#a0a0a0] mb-10 text-lg">Insira suas credenciais para acessar seu espaço.</p>

      {notification && (
        <div className={`mb-6 p-4 rounded-xl ${notification.type === 'error' ? 'bg-red-500/10 text-red-500' : 'bg-green-500/10 text-green-500'}`}>
          {notification.msg}
        </div>
      )}

      <form onSubmit={handleLogin} className="flex flex-col gap-6">
        <div>
          <label className="block text-sm font-semibold mb-2 opacity-80">E-mail Corporativo</label>
          <input 
            type="email" 
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full p-4.5 rounded-xl bg-[#1a1b1e] border border-[#2c2d30] focus:border-accent focus:ring-1 focus:ring-accent outline-none transition-all placeholder:text-[#555] font-medium"
            placeholder="contato@empresa.com.br"
            required
          />
        </div>
        <div>
          <div className="flex justify-between items-center mb-2">
            <label className="block text-sm font-semibold opacity-80">Senha</label>
            <Link href="/forgot-password" className="text-xs font-semibold text-accent hover:underline">
              Esqueceu a senha?
            </Link>
          </div>
          <input 
            type="password" 
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full p-4.5 rounded-xl bg-[#1a1b1e] border border-[#2c2d30] focus:border-accent focus:ring-1 focus:ring-accent outline-none transition-all placeholder:text-[#555] font-medium"
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

      <p className="mt-10 text-center flex flex-col gap-2 items-center">
        <span className="text-[#a0a0a0]">Não possui acesso ao seu projeto? <Link href="/register" className="text-white font-semibold hover:underline">Fale com a agência</Link></span>
      </p>
    </motion.div>
  );
}
