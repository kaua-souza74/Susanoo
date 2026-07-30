"use client";
import { useState, useMemo, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { CheckCircle2, AlertCircle, Eye, EyeOff, Globe, Code2 } from "lucide-react";

export default function RegisterPage() {
  const [role, setRole] = useState<"client" | "developer">("client");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [notification, setNotification] = useState<{type: "success" | "error", msg: string} | null>(null);
  
  // Client Specific Fields
  const [storeName, setStoreName] = useState("");
  const [segment, setSegment] = useState("");

  // Developer Specific Fields
  const [github, setGithub] = useState("");
  const [linkedin, setLinkedin] = useState("");
  const [portfolio, setPortfolio] = useState("");
  const [specialties, setSpecialties] = useState("");
  const [experience, setExperience] = useState("");

  const router = useRouter();

  useEffect(() => {
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      const r = params.get("role");
      if (r === "developer") {
        setRole("developer");
      }
    }
  }, []);

  // Password strength checker
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
        options: { data: { full_name: name, role: role === "developer" ? "developer" : "client" } }
    });

    if (error) {
        setNotification({ type: "error", msg: error.message });
        setLoading(false);
    } else {
        // Save profile configuration in LocalStorage
        const selectedRoleName = role === "developer" ? "Desenvolvedor" : "Comércio";
        localStorage.setItem("susanoo_profile_type", selectedRoleName);
        window.dispatchEvent(new Event("profileTypeChanged"));

        if (role === "developer") {
          localStorage.setItem("susanoo_dev_profile", JSON.stringify({
            name,
            email,
            github,
            linkedin,
            portfolio,
            specialties: specialties.split(",").map(s => s.trim()).filter(Boolean),
            experience
          }));
        } else {
          localStorage.setItem("susanoo_client_profile", JSON.stringify({
            name,
            email,
            storeName,
            segment,
            completed: false
          }));
          localStorage.setItem("susanoo_store_profile_completed", "false");
        }

        setNotification({ type: "success", msg: "Tudo pronto! Entrando no seu novo painel..." });
        setTimeout(() => router.push("/dashboard"), 2000);
    }
  };

  return (
    <motion.div initial={{opacity: 0, scale: 0.98}} animate={{opacity: 1, scale: 1}} transition={{ duration: 0.6, ease: "easeOut" }}>
      <h2 className="text-4xl font-bold tracking-tight mb-3">
        {role === "developer" ? "Cadastre-se como Profissional" : "Comece a inovar."}
      </h2>
      <p className="text-foreground/50 mb-8 text-lg">
        {role === "developer" 
          ? "Preencha suas informações para receber propostas e expandir sua reputação."
          : "Crie sua conta na Susanoo para estruturar o seu projeto."}
      </p>

      {/* Notification */}
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
          <label className="block text-sm font-semibold mb-2 opacity-80">
            {role === "developer" ? "Nome Completo" : "Nome da Empresa"}
          </label>
          <input 
            type="text" 
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full p-4.5 rounded-xl bg-surface border border-surface-border focus:border-accent focus:ring-1 focus:ring-accent outline-none transition-all placeholder:text-foreground/30 font-medium text-foreground"
            placeholder={role === "developer" ? "Seu Nome Completo" : "Susanoo Studio Inc."}
            required disabled={notification?.type === 'success'}
          />
        </div>

        <div>
          <label className="block text-sm font-semibold mb-2 opacity-80">
            {role === "developer" ? "E-mail Profissional" : "E-mail Comercial"}
          </label>
          <input 
            type="email" 
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full p-4.5 rounded-xl bg-surface border border-surface-border focus:border-accent focus:ring-1 focus:ring-accent outline-none transition-all placeholder:text-foreground/30 font-medium text-foreground"
            placeholder={role === "developer" ? "dev@exemplo.com" : "ceo@susanoo.com.br"}
            required disabled={notification?.type === 'success'}
          />
        </div>

        {/* Client Specific Fields */}
        {role === "client" && (
          <>
            <div>
              <label className="block text-sm font-semibold mb-2 opacity-80">Nome da Loja</label>
              <input 
                type="text" 
                value={storeName}
                onChange={(e) => setStoreName(e.target.value)}
                className="w-full p-4.5 rounded-xl bg-surface border border-surface-border focus:border-accent focus:ring-1 focus:ring-accent outline-none transition-all placeholder:text-foreground/30 font-medium text-foreground"
                placeholder="Minha Loja Virtual"
                required disabled={notification?.type === 'success'}
              />
            </div>
            <div>
              <label className="block text-sm font-semibold mb-2 opacity-80">Segmento do Negócio</label>
              <input 
                type="text" 
                value={segment}
                onChange={(e) => setSegment(e.target.value)}
                className="w-full p-4.5 rounded-xl bg-surface border border-surface-border focus:border-accent focus:ring-1 focus:ring-accent outline-none transition-all placeholder:text-foreground/30 font-medium text-foreground"
                placeholder="Ex: Moda, Alimentação, Serviços..."
                required disabled={notification?.type === 'success'}
              />
            </div>
          </>
        )}

        {/* Developer Specific Fields */}
        {role === "developer" && (
          <>
            <div>
              <label className="block text-sm font-semibold mb-2 opacity-80">Link do GitHub</label>
              <input 
                type="url" 
                value={github}
                onChange={(e) => setGithub(e.target.value)}
                className="w-full p-4.5 rounded-xl bg-surface border border-surface-border focus:border-accent focus:ring-1 focus:ring-accent outline-none transition-all placeholder:text-foreground/30 font-medium text-foreground"
                placeholder="https://github.com/usuario"
                required disabled={notification?.type === 'success'}
              />
            </div>
            <div>
              <label className="block text-sm font-semibold mb-2 opacity-80">Link do LinkedIn</label>
              <input 
                type="url" 
                value={linkedin}
                onChange={(e) => setLinkedin(e.target.value)}
                className="w-full p-4.5 rounded-xl bg-surface border border-surface-border focus:border-accent focus:ring-1 focus:ring-accent outline-none transition-all placeholder:text-foreground/30 font-medium text-foreground"
                placeholder="https://linkedin.com/in/usuario"
                required disabled={notification?.type === 'success'}
              />
            </div>
            <div>
              <label className="block text-sm font-semibold mb-2 opacity-80">Portfólio / Site (Opcional)</label>
              <input 
                type="url" 
                value={portfolio}
                onChange={(e) => setPortfolio(e.target.value)}
                className="w-full p-4.5 rounded-xl bg-surface border border-surface-border focus:border-accent focus:ring-1 focus:ring-accent outline-none transition-all placeholder:text-foreground/30 font-medium text-foreground"
                placeholder="https://meuportfolio.com"
                disabled={notification?.type === 'success'}
              />
            </div>
            <div>
              <label className="block text-sm font-semibold mb-2 opacity-80">Especialidades (separadas por vírgula)</label>
              <input 
                type="text" 
                value={specialties}
                onChange={(e) => setSpecialties(e.target.value)}
                className="w-full p-4.5 rounded-xl bg-surface border border-surface-border focus:border-accent focus:ring-1 focus:ring-accent outline-none transition-all placeholder:text-foreground/30 font-medium text-foreground"
                placeholder="Ex: React, Next.js, UI/UX, Node.js"
                required disabled={notification?.type === 'success'}
              />
            </div>
            <div>
              <label className="block text-sm font-semibold mb-2 opacity-80">Anos de Experiência</label>
              <input 
                type="number" 
                value={experience}
                onChange={(e) => setExperience(e.target.value)}
                className="w-full p-4.5 rounded-xl bg-surface border border-surface-border focus:border-accent focus:ring-1 focus:ring-accent outline-none transition-all placeholder:text-foreground/30 font-medium text-foreground"
                placeholder="Ex: 3"
                required disabled={notification?.type === 'success'}
              />
            </div>
          </>
        )}

        <div>
          <label className="block text-sm font-semibold mb-2 opacity-80">Nova Senha Segura</label>
          <div className="relative">
             <input 
               type={showPassword ? "text" : "password"}
               value={password}
               onChange={(e) => setPassword(e.target.value)}
               className="w-full p-4.5 rounded-xl bg-surface border border-surface-border focus:border-accent focus:ring-1 focus:ring-accent outline-none transition-all placeholder:text-foreground/30 font-medium text-foreground pr-12"
               placeholder="••••••••"
               required minLength={6} disabled={notification?.type === 'success'}
             />
             <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-4 top-1/2 -translate-y-1/2 text-foreground/40 hover:text-foreground transition-colors">
               {showPassword ? <EyeOff className="w-5 h-5"/> : <Eye className="w-5 h-5"/>}
             </button>
          </div>
          <div className={`flex items-center gap-3 mt-3 transition-opacity duration-300 ${password.length > 0 ? 'opacity-100' : 'opacity-0 select-none'}`}>
             <div className="flex-1 h-1.5 bg-surface border border-surface-border rounded-full overflow-hidden">
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
          className={`w-full py-4.5 rounded-xl font-bold transition-all mt-4 text-lg shadow-xl ${notification?.type === 'success' ? 'bg-emerald-500 text-white shadow-emerald-500/20' : 'bg-accent text-accent-foreground hover:opacity-90 shadow-accent/10'} disabled:opacity-50`}
        >
          {loading ? "Estruturando banco..." : (notification?.type === 'success' ? "Redirecionando..." : "Criar Minha Conta")}
        </button>
      </form>

      <p className="mt-10 text-center text-foreground/50">
        Já possui acesso? <Link href="/login" className="text-foreground font-semibold hover:underline">Fazer login</Link>
      </p>
    </motion.div>
  );
}
