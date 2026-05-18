"use client";
import { useState } from "react";
import { supabase } from "@/lib/supabase";
import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowLeft } from "lucide-react";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [notification, setNotification] = useState<{ type: "success" | "error"; msg: string } | null>(null);

  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setNotification(null);

    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    });

    if (error) {
      setNotification({ type: "error", msg: "Erro ao enviar e-mail: " + error.message });
    } else {
      setNotification({
        type: "success",
        msg: "E-mail de recuperação enviado com sucesso! Verifique sua caixa de entrada.",
      });
    }
    setLoading(false);
  };

  return (
    <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, ease: "easeOut" }}>
      <Link href="/login" className="flex items-center gap-2 text-sm text-[#a0a0a0] hover:text-white mb-8 transition-colors">
        <ArrowLeft className="w-4 h-4" /> Voltar para o login
      </Link>

      <h2 className="text-4xl font-bold tracking-tight mb-3">Recuperar senha</h2>
      <p className="text-[#a0a0a0] mb-10 text-lg">Insira seu e-mail para receber um link de redefinição.</p>

      {notification && (
        <div className={`mb-6 p-4 rounded-xl text-sm ${notification.type === 'error' ? 'bg-red-500/10 text-red-500' : 'bg-green-500/10 text-green-500'}`}>
          {notification.msg}
        </div>
      )}

      <form onSubmit={handleReset} className="flex flex-col gap-6">
        <div>
          <label className="block text-sm font-semibold mb-2 opacity-80">E-mail Cadastrado</label>
          <input 
            type="email" 
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full p-4.5 rounded-xl bg-[#1a1b1e] border border-[#2c2d30] focus:border-accent focus:ring-1 focus:ring-accent outline-none transition-all placeholder:text-[#555] font-medium"
            placeholder="contato@empresa.com.br"
            required
          />
        </div>
        
        <button 
          type="submit" 
          disabled={loading}
          className="w-full bg-accent text-accent-foreground py-4.5 rounded-xl font-bold hover:bg-accent/90 transition-all shadow-[0_4px_25px_rgba(168,85,247,0.3)] mt-4 disabled:opacity-50 text-lg"
        >
          {loading ? "Enviando..." : "Enviar Link de Recuperação"}
        </button>
      </form>
    </motion.div>
  );
}
