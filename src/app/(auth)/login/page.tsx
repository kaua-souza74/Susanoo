"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabase";
import { useRouter } from "next/navigation";
import { Zap } from "lucide-react";
import { motion } from "framer-motion";
import Link from "next/link";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleAuth = async (e: React.FormEvent, type: 'login' | 'signup') => {
    e.preventDefault();
    setLoading(true);
    
    if (type === 'login') {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) alert("Erro: " + error.message);
      else router.push("/dashboard");
    } else {
      const { error } = await supabase.auth.signUp({ email, password });
      if (error) alert("Erro ao criar conta: " + error.message);
      else {
        alert("Conta criada com sucesso! Você pode acessar o painel.");
        router.push("/dashboard");
      }
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden">
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-accent/20 blur-[100px] rounded-full pointer-events-none" />

      <Link href="/" className="absolute top-6 left-6 text-foreground/60 hover:text-foreground transition-colors">
        &larr; Voltar para a Home
      </Link>

      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="glass z-10 p-8 rounded-2xl w-full max-w-md shadow-2xl shadow-black/50"
      >
        <div className="flex flex-col items-center justify-center mb-8">
          <div className="w-12 h-12 rounded-xl bg-accent flex items-center justify-center mb-4 shadow-[0_0_15px_rgba(168,85,247,0.5)]">
            <Zap className="w-6 h-6 text-accent-foreground" />
          </div>
          <h1 className="text-3xl font-bold tracking-tight">Susanoo</h1>
          <p className="text-foreground/60 text-sm mt-2">Área segura do cliente</p>
        </div>

        <form className="flex flex-col gap-4">
          <div>
            <label className="block text-sm font-medium mb-1.5 opacity-80">E-mail</label>
            <input 
              type="email" 
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full p-3.5 rounded-xl bg-surface border border-surface-border focus:border-accent focus:ring-1 focus:ring-accent outline-none transition-all"
              placeholder="contato@pizzaria.com.br"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1.5 opacity-80">Senha</label>
            <input 
              type="password" 
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full p-3.5 rounded-xl bg-surface border border-surface-border focus:border-accent focus:ring-1 focus:ring-accent outline-none transition-all"
              placeholder="••••••••"
              required
            />
          </div>
          
          <div className="flex gap-3 mt-4">
            <button 
              onClick={(e) => handleAuth(e, 'login')}
              disabled={loading}
              className="flex-1 bg-accent text-accent-foreground p-3.5 rounded-xl font-bold hover:bg-accent/90 transition-all shadow-[0_0_20px_rgba(168,85,247,0.2)] disabled:opacity-50"
            >
              Entrar
            </button>
            <button 
              onClick={(e) => handleAuth(e, 'signup')}
              disabled={loading}
              className="flex-1 bg-surface border border-surface-border p-3.5 rounded-xl font-bold hover:bg-surface-border transition-all disabled:opacity-50"
            >
              Criar Conta
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
}
