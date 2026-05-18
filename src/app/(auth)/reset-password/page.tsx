"use client";
import { useState } from "react";
import { supabase } from "@/lib/supabase";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";

export default function ResetPasswordPage() {
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [notification, setNotification] = useState<{ type: "success" | "error"; msg: string } | null>(null);
  const router = useRouter();

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== confirmPassword) {
      setNotification({ type: "error", msg: "As senhas não coincidem." });
      return;
    }
    setLoading(true);
    setNotification(null);

    const { error } = await supabase.auth.updateUser({ password });

    if (error) {
      setNotification({ type: "error", msg: "Erro ao redefinir senha: " + error.message });
    } else {
      setNotification({
        type: "success",
        msg: "Senha redefinida com sucesso! Você será redirecionado para o login em instantes...",
      });
      setTimeout(() => {
        router.push("/login");
      }, 2500);
    }
    setLoading(false);
  };

  return (
    <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, ease: "easeOut" }}>
      <h2 className="text-4xl font-bold tracking-tight mb-3">Definir nova senha</h2>
      <p className="text-[#a0a0a0] mb-10 text-lg">Crie uma nova senha de acesso para a sua conta.</p>

      {notification && (
        <div className={`mb-6 p-4 rounded-xl text-sm ${notification.type === 'error' ? 'bg-red-500/10 text-red-500' : 'bg-green-500/10 text-green-500'}`}>
          {notification.msg}
        </div>
      )}

      <form onSubmit={handleUpdatePassword} className="flex flex-col gap-6">
        <div>
          <label className="block text-sm font-semibold mb-2 opacity-80">Nova Senha</label>
          <input 
            type="password" 
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full p-4.5 rounded-xl bg-[#1a1b1e] border border-[#2c2d30] focus:border-accent focus:ring-1 focus:ring-accent outline-none transition-all placeholder:text-[#555] font-medium"
            placeholder="••••••••"
            required
            minLength={6}
          />
        </div>

        <div>
          <label className="block text-sm font-semibold mb-2 opacity-80">Confirmar Nova Senha</label>
          <input 
            type="password" 
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            className="w-full p-4.5 rounded-xl bg-[#1a1b1e] border border-[#2c2d30] focus:border-accent focus:ring-1 focus:ring-accent outline-none transition-all placeholder:text-[#555] font-medium"
            placeholder="••••••••"
            required
            minLength={6}
          />
        </div>
        
        <button 
          type="submit" 
          disabled={loading}
          className="w-full bg-accent text-accent-foreground py-4.5 rounded-xl font-bold hover:bg-accent/90 transition-all shadow-[0_4px_25px_rgba(168,85,247,0.3)] mt-4 disabled:opacity-50 text-lg"
        >
          {loading ? "Redefinindo..." : "Salvar Nova Senha"}
        </button>
      </form>
    </motion.div>
  );
}
