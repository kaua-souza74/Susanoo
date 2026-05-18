"use client";
import { ReactNode, useState, useEffect } from "react";
import Link from "next/link";
import { Zap, Grid, MessageSquareText, FolderUp, Settings, LogOut, Bot, Sparkles } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { useRouter, usePathname } from "next/navigation";

export default function DashboardLayout({ children }: { children: ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
     setMounted(true);
  }, []);

  const handleLogout = () => {
      supabase.auth.signOut();
      router.replace("/");
  };

  return (
    <div className="flex h-screen bg-[#111213] text-[#f5f5f5] selection:bg-accent selection:text-white font-sans">
      <aside className="w-[280px] bg-[#141516] border-r border-[#2c2d30] flex flex-col justify-between hidden md:flex shrink-0">
        <div>
            {/* Header Área do Cliente */}
            <div className="p-4 border-b border-[#2c2d30] mb-4">
               <div className="flex items-center gap-3 px-3 py-2 hover:bg-[#1a1b1e] rounded-xl cursor-default transition-colors">
                  <div className="w-8 h-8 rounded-lg bg-accent text-accent-foreground flex items-center justify-center font-bold text-sm shadow-inner shadow-black/50">
                    <Zap className="w-5 h-5 fill-current"/>
                  </div>
                  <span className="font-bold text-[15px] tracking-wide text-white">Workspace</span>
               </div>
            </div>

            {/* Menu Sections Focadas no Cliente SaaS */}
            <div className="p-4 flex flex-col gap-2">
               <NavItem icon={<Sparkles className="w-5 h-5"/>} label="Discover" active={mounted ? pathname === '/dashboard' : false} href="/dashboard" />
               <NavItem icon={<Grid className="w-5 h-5"/>} label="Meus Projetos" active={mounted ? pathname?.includes('/projects') || pathname?.includes('/kanban') : false} href="/dashboard/projects" />
               <NavItem icon={<MessageSquareText className="w-5 h-5"/>} label="Chat com a Equipe" active={mounted ? pathname?.includes('/chat') : false} href="/dashboard/chat" />
               <NavItem icon={<Bot className="w-5 h-5"/>} label="Assistente IA" active={mounted ? pathname?.includes('/ai') : false} href="/dashboard/ai" />
               <NavItem icon={<FolderUp className="w-5 h-5"/>} label="Arquivos e Mídias" active={mounted ? pathname?.includes('/files') : false} href="/dashboard/files" />
               <NavItem icon={<Settings className="w-5 h-5"/>} label="Configurações" active={mounted ? pathname?.includes('/settings') : false} href="/dashboard/settings" />
            </div>
        </div>

        <div className="p-4 border-t border-[#2c2d30] pb-6">
             <button onClick={handleLogout} className="cursor-pointer flex items-center gap-3 px-4 py-3 text-sm font-bold text-[#a0a0a0] hover:text-[#ff4040] hover:bg-red-500/10 rounded-xl w-full transition-colors border border-transparent hover:border-red-500/20">
                <LogOut className="w-5 h-5"/> Fazer Logout
             </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col overflow-hidden h-screen bg-[#111213]">
         {children}
      </main>
    </div>
  );
}

// Componente para tornar o NavLink inteligente (Aba Ativa)
function NavItem({ icon, label, active = false, href }: { icon: ReactNode, label: string, active?: boolean, href: string }) {
    return (
        <Link href={href} className={`flex items-center gap-3 px-4 py-3.5 rounded-xl text-[15px] transition-all duration-200 cursor-pointer ${active ? 'bg-[#1e1f24] text-white font-bold border border-[#2c2d30] shadow-sm' : 'text-[#888] font-medium hover:bg-[#1e1f24] hover:text-[#e0e0e0] border border-transparent'}`}>
            {icon}
            {label}
        </Link>
    )
}
