"use client";
import { useState } from "react";
import { supabase } from "@/lib/supabase";
import { useRouter } from "next/navigation";
import { ShieldAlert, KeyRound } from "lucide-react";
import { motion } from "framer-motion";

export default function AdminLogin() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const ADM_EMAILS = ['davi@susanoo.com', 'vinicius@susanoo.com', 'lucas@susanoo.com', 'kaua@susanoo.com'];

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    let { error } = await supabase.auth.signInWithPassword({ email, password });
    
    // Provisão Automática MVP para evitar dor de cabeça manual na criação da startup
    if (error && ADM_EMAILS.includes(email.toLowerCase())) {
        const { error: signErr } = await supabase.auth.signUp({ 
           email, password, options: { data: { full_name: email.split('@')[0], role: 'admin' } } 
        });
        if (!signErr) error = null;
    }

    if (error && !ADM_EMAILS.includes(email.toLowerCase())) {
       alert("Acesso exclusivo para Operadores Susanoo. Credencial inválida.");
    } else if (error) {
       alert("Erro interno na rede: " + error.message);
    } else {
       router.push("/admin");
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen flex text-white bg-[#050505] relative overflow-hidden items-center justify-center p-6 font-sans">
      
      {/* Immersive Background */}
      <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-red-600/10 blur-[150px] rounded-full" />
          <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 mix-blend-overlay"></div>
      </div>

      <motion.div initial={{opacity:0, scale:0.95}} animate={{opacity:1, scale:1}} className="max-w-[420px] w-full bg-[#111213] border border-[#222] p-10 rounded-[32px] shadow-2xl relative z-10">
          <div className="flex justify-center mb-8">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-red-600 to-black border border-red-500/30 flex items-center justify-center shadow-[0_0_30px_rgba(220,38,38,0.3)]">
                  <ShieldAlert className="w-8 h-8 text-white" />
              </div>
          </div>
          
          <div className="text-center mb-10">
              <h1 className="text-3xl font-black text-white tracking-tighter uppercase">Protocolo HQ</h1>
              <p className="text-red-500/80 font-bold text-[11px] tracking-widest mt-1 uppercase">Acesso Restrito · Operadores</p>
          </div>

          <form onSubmit={handleLogin} className="flex flex-col gap-6">
              <div>
                  <label className="text-[12px] uppercase tracking-widest font-bold text-[#888] mb-2 block">Credencial Operacional</label>
                  <input 
                      type="email" 
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full bg-[#0a0a0a] border border-[#333] focus:border-red-500 focus:ring-1 focus:ring-red-500/50 rounded-xl p-4 text-white font-mono placeholder:text-[#444] transition-all outline-none"
                      placeholder="operador@susanoo.com"
                      required
                  />
              </div>

              <div>
                  <label className="text-[12px] uppercase tracking-widest font-bold text-[#888] mb-2 block">Chave de Segurança</label>
                  <div className="relative">
                      <KeyRound className="absolute left-4 top-1/2 -translate-y-1/2 text-[#555] w-4 h-4"/>
                      <input 
                          type="password" 
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          className="w-full bg-[#0a0a0a] border border-[#333] focus:border-red-500 focus:ring-1 focus:ring-red-500/50 rounded-xl p-4 pl-12 text-white font-mono placeholder:text-[#444] transition-all outline-none"
                          placeholder="••••••••••"
                          required
                      />
                  </div>
              </div>

              <button 
                  type="submit" 
                  disabled={loading}
                  className="w-full bg-white text-black hover:bg-neutral-300 font-black uppercase tracking-widest text-sm py-5 rounded-xl transition-all shadow-[0_0_20px_rgba(255,255,255,0.1)] mt-4 disabled:opacity-50"
              >
                  {loading ? "Validando Assinatura..." : "Iniciar Sessão HQ"}
              </button>
          </form>
      </motion.div>
    </div>
  );
}
