"use client";
import { useState, useMemo } from "react";
import { supabase } from "@/lib/supabase";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { CheckCircle2, AlertCircle, Eye, EyeOff } from "lucide-react";

export default function RegisterPage() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [notification, setNotification] = useState<{type: "success" | "error", msg: string} | null>(null);
  const router = useRouter();

  // Avaliação em tempo real da senha com cálculos Supabase-Like
  const passwordStrength = useMemo(() => {
    if (!password) return { value: 0, label: '', color: 'bg-transparent' };
    const hasUpperCase = /[A-Z]/.test(password);
    const hasSymbol = /[!@#$%^&*(),.?":{}|<>]/.test(password);
    const validLength = password.length >= 8;
    
    if (validLength && hasUpperCase && hasSymbol) return { value: 100, label: 'Forte', color: 'bg-emerald-500' };
    if (password.length > 5) return { value: 50, label: 'Média', color: 'bg-yellow-500' };
    return { value: 25, label: 'Fraca', color: 'bg-red-500' };
  }, [password]);

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setNotification(null);
    
    const { data, error } = await supabase.auth.signUp({ 
        email, 
        password,
        options: { data: { full_name: name } }
    });

    if (error) {
        setNotification({ type: "error", msg: error.message });
        setLoading(false);
    } else {
        setNotification({ type: "success", msg: "Tudo pronto! Entrando no seu novo painel corporativo..." });
        setTimeout(() => router.push("/dashboard"), 3000);
    }
  };

  return (
    <motion.div initial={{opacity: 0, scale: 0.98}} animate={{opacity: 1, scale: 1}} transition={{ duration: 0.6, ease: "easeOut" }}>
      <h2 className="text-4xl font-bold tracking-tight mb-3">Comece a inovar.</h2>
      <p className="text-[#a0a0a0] mb-8 text-lg">Crie sua conta na Susanoo para estruturar o seu projeto.</p>

      {/* Notificação Animada */}
      <AnimatePresence>
        {notification && (
          <motion.div 
            initial={{ opacity: 0, y: -10, scale: 0.95 }} 
            animate={{ opacity: 1, y: 0, scale: 1 }} 
            exit={{ opacity: 0, y: -10 }}
            className={`p-4 rounded-xl mb-6 flex items-center gap-3 shadow-lg font-medium ${notification.type === 'success' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-red-500/10 text-red-500 border border-red-500/20'}`}
          >
            {notification.type === 'success' ? <CheckCircle2 className="w-5 h-5 shrink-0"/> : <AlertCircle className="w-5 h-5 shrink-0" />}
            <span className="text-sm leading-snug">{notification.msg}</span>
          </motion.div>
        )}
      </AnimatePresence>

      <form onSubmit={handleRegister} className="flex flex-col gap-5">
        <div>
          <label className="block text-sm font-semibold mb-2 opacity-80">Nome da Empresa</label>
          <input 
            type="text" 
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full p-4 rounded-xl bg-[#1a1b1e] border border-[#2c2d30] focus:border-accent focus:ring-1 focus:ring-accent outline-none transition-all placeholder:text-[#555] font-medium"
            placeholder="Susanoo Studio Inc."
            required disabled={notification?.type === 'success'}
          />
        </div>
        <div>
          <label className="block text-sm font-semibold mb-2 opacity-80">E-mail Comercial</label>
          <input 
            type="email" 
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full p-4 rounded-xl bg-[#1a1b1e] border border-[#2c2d30] focus:border-accent focus:ring-1 focus:ring-accent outline-none transition-all placeholder:text-[#555] font-medium"
            placeholder="ceo@susanoo.com.br"
            required disabled={notification?.type === 'success'}
          />
        </div>
        <div>
          <label className="block text-sm font-semibold mb-2 opacity-80">Nova Senha Segura</label>
          <div className="relative">
             <input 
               type={showPassword ? "text" : "password"}
               value={password}
               onChange={(e) => setPassword(e.target.value)}
               className="w-full p-4 rounded-xl bg-[#1a1b1e] border border-[#2c2d30] focus:border-accent focus:ring-1 focus:ring-accent outline-none transition-all placeholder:text-[#555] font-medium pr-12"
               placeholder="••••••••"
               required minLength={6} disabled={notification?.type === 'success'}
             />
             <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-4 top-1/2 -translate-y-1/2 text-[#888] hover:text-white transition-colors">
               {showPassword ? <EyeOff className="w-5 h-5"/> : <Eye className="w-5 h-5"/>}
             </button>
          </div>
          {/* Indicador de Força de Senha Ocultável sem Reflow */}
          <div className={`flex items-center gap-3 mt-3 transition-opacity duration-300 ${password.length > 0 ? 'opacity-100' : 'opacity-0 select-none'}`}>
             <div className="flex-1 h-1.5 bg-[#2c2d30] rounded-full overflow-hidden">
                <div className={`h-full ${passwordStrength.color} transition-all duration-300 ease-out`} style={{width: `${passwordStrength.value}%`}}></div>
             </div>
             <span className={`text-[11px] uppercase font-bold tracking-wider ${passwordStrength.value === 100 ? 'text-emerald-500' : (passwordStrength.value > 33 ? 'text-yellow-500' : 'text-red-500')}`}>
                 {passwordStrength.label || 'Vazio'}
             </span>
          </div>
        </div>
        
        <button 
          type="submit" 
          disabled={loading || notification?.type === 'success' || passwordStrength.value !== 100}
          className={`w-full py-4.5 rounded-xl font-bold transition-all mt-4 text-lg shadow-xl ${notification?.type === 'success' ? 'bg-emerald-500 text-white shadow-emerald-500/20' : 'bg-white text-black hover:bg-gray-200 shadow-white/10'} disabled:opacity-50`}
        >
          {loading ? "Estruturando banco..." : (notification?.type === 'success' ? "Redirecionando..." : "Criar Minha Conta")}
        </button>
      </form>

      <p className="mt-10 text-center text-[#a0a0a0]">
        Já possui acesso? <Link href="/login" className="text-white font-semibold hover:underline">Fazer login</Link>
      </p>
    </motion.div>
  );
}
