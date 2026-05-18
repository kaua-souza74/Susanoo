"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { useRouter } from "next/navigation";
import { Zap, LogOut, CheckCircle2, Circle, ArrowRightCircle } from "lucide-react";
import { ThemeToggle } from "@/components/theme-toggle";

export default function DashboardPage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    const checkUser = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
         router.push("/login");
      } else {
         setUser(session.user);
      }
    };
    checkUser();
  }, [router]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push("/");
  };

  if (!user) return <div className="min-h-screen flex items-center justify-center text-accent">Analisando credenciais...</div>;

  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground">
      {/* Navbar Dashboard */}
      <nav className="w-full p-4 border-b border-surface-border bg-background/80 backdrop-blur-xl flex justify-between items-center sticky top-0 z-50">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-accent flex items-center justify-center shadow-[0_0_15px_rgba(168,85,247,0.4)]">
            <Zap className="w-5 h-5 text-accent-foreground fill-current" />
          </div>
          <span className="text-xl font-bold tracking-tight">Susanoo</span>
          <div className="hidden md:flex ml-6 pl-6 border-l border-surface-border items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-accent animate-pulse"></span>
            <span className="text-sm font-medium text-foreground/80">Projeto Local</span>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <ThemeToggle />
          <div className="hidden sm:flex flex-col items-end">
            <span className="text-sm font-semibold">{user.email?.split('@')[0]}</span>
            <span className="text-xs text-foreground/50">Cliente</span>
          </div>
          <button onClick={handleLogout} className="p-2 ml-2 bg-surface text-foreground rounded-full border border-surface-border hover:bg-surface-border transition-colors">
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </nav>

      {/* Main Content */}
      <div className="flex-1 p-6 max-w-7xl mx-auto w-full grid grid-cols-1 lg:grid-cols-4 gap-6">
        
        {/* Kanban Area */}
        <div className="lg:col-span-3 flex flex-col gap-4">
          <div className="flex items-center justify-between mb-2 mt-2">
            <h2 className="text-2xl font-bold tracking-tight">Andamento do Projeto</h2>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* TODO Coluna */}
            <div className="glass rounded-2xl p-5 min-h-[500px]">
              <div className="flex items-center justify-between mb-5">
                <h3 className="font-semibold text-sm uppercase tracking-wider text-foreground/70 flex items-center gap-2">
                  <Circle className="w-4 h-4" /> A Fazer
                </h3>
                <span className="bg-surface border border-surface-border px-2 py-0.5 rounded-full text-xs font-bold">2</span>
              </div>
              
              <div className="bg-surface border border-surface-border p-4 rounded-xl mb-3 shadow-sm hover:border-accent/50 transition-colors cursor-pointer group">
                <p className="font-medium text-sm group-hover:text-accent transition-colors">Aprovar Identidade Visual</p>
                <div className="mt-3 flex gap-2">
                  <span className="text-[10px] px-2 py-1 bg-surface-border/50 rounded-md font-medium">Design</span>
                </div>
              </div>
              
              <div className="bg-surface border border-surface-border p-4 rounded-xl mb-3 shadow-sm hover:border-accent/50 transition-colors cursor-pointer group">
                <p className="font-medium text-sm group-hover:text-accent transition-colors">Fornecer textos da página "Sobre"</p>
                <div className="mt-3 flex gap-2">
                  <span className="text-[10px] px-2 py-1 bg-surface-border/50 rounded-md font-medium">Conteúdo</span>
                </div>
              </div>
            </div>
            
            {/* DOING Coluna */}
            <div className="glass rounded-2xl p-5 min-h-[500px] relative overflow-hidden">
               {/* Faint glow over doing column */}
              <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[200px] h-[200px] bg-accent/5 blur-[50px] pointer-events-none" />
              
              <div className="flex items-center justify-between mb-5 relative z-10">
                <h3 className="font-semibold text-sm uppercase tracking-wider text-accent flex items-center gap-2">
                  <ArrowRightCircle className="w-4 h-4" /> Em Andamento
                </h3>
                <span className="bg-accent/20 text-accent px-2 py-0.5 rounded-full text-xs font-bold">1</span>
              </div>

              <div className="bg-surface border border-accent/40 p-4 rounded-xl mb-3 shadow-[0_0_15px_rgba(168,85,247,0.05)] relative z-10">
                <p className="font-medium text-sm">Desenvolvimento da Home Page</p>
                <div className="mt-4 flex -space-x-2">
                    <div className="w-6 h-6 rounded-full bg-accent/20 border border-accent flex items-center justify-center text-[10px] font-bold">E</div>
                </div>
              </div>
            </div>

            {/* DONE Coluna */}
            <div className="glass rounded-2xl p-5 min-h-[500px]">
              <div className="flex items-center justify-between mb-5">
                <h3 className="font-semibold text-sm uppercase tracking-wider text-foreground/50 flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4" /> Concluído
                </h3>
              </div>

              <div className="bg-surface/50 border border-surface-border/50 p-4 rounded-xl mb-3 opacity-60">
                <p className="font-medium text-sm line-through">Reunião de Briefing</p>
              </div>
            </div>
          </div>
        </div>

        {/* Realtime Chat Area */}
        <div className="glass rounded-2xl flex flex-col h-[600px] mt-[50px] shadow-xl border-surface-border">
          <div className="p-4 border-b border-surface-border bg-surface/30 rounded-t-2xl">
            <h2 className="font-bold flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-500"></span> 
              Chat com a Equipe
            </h2>
          </div>
          
          <div className="flex-1 overflow-y-auto flex flex-col gap-4 py-4 px-4">
            <div className="self-start max-w-[85%]">
              <div className="bg-surface border border-surface-border rounded-2xl rounded-tl-sm p-3.5 shadow-sm">
                <p className="text-xs text-accent font-bold mb-1.5 flex items-center gap-1">Agência</p>
                <p className="text-sm">Olá! Bem-vindo ao painel do Susanoo. Já começamos o design.</p>
              </div>
              <span className="text-[10px] text-foreground/40 mt-1 ml-1">10:45 AM</span>
            </div>
            
            <div className="self-end max-w-[85%]">
               <div className="bg-accent text-accent-foreground font-medium rounded-2xl rounded-tr-sm p-3.5 shadow-md shadow-accent/20">
                <p className="text-sm">Perfeito, estou aqui se precisarem aprovar algo.</p>
               </div>
               <span className="text-[10px] text-foreground/40 mt-1 mr-1 text-right block">10:48 AM</span>
            </div>
          </div>

          <div className="p-3 border-t border-surface-border bg-surface/30 rounded-b-2xl">
            <div className="flex gap-2">
              <input 
                type="text" 
                placeholder="Escreva sua mensagem..."
                className="flex-1 p-3 rounded-xl bg-background border border-surface-border focus:border-accent focus:ring-1 focus:ring-accent outline-none text-sm transition-all"
              />
              <button className="bg-foreground text-background font-bold px-5 rounded-xl hover:bg-accent hover:text-accent-foreground transition-colors">
                Enviar
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
