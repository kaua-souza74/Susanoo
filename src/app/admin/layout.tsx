"use client";
import { ReactNode, useState, useEffect } from "react";
import Link from "next/link";
import { LayoutDashboard, Users, MessageSquareText, Settings, LogOut, CheckCircle2, LayoutList, Rocket, Layers } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { useRouter, usePathname } from "next/navigation";

export default function AdminLayout({ children }: { children: ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [unreadChat, setUnreadChat] = useState(false);
  const [unreadTasks, setUnreadTasks] = useState(false);

  useEffect(() => {
     if (pathname?.includes('/admin/chat')) setUnreadChat(false);
     if (pathname?.includes('/admin/tasks')) setUnreadTasks(false);

     const ch = supabase.channel('admin-notifs')
       .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'messages' }, () => {
           if (!pathname?.includes('/admin/chat')) setUnreadChat(true);
       })
       .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'tasks' }, () => {
           if (!pathname?.includes('/admin/tasks')) setUnreadTasks(true);
       }).subscribe();
     return () => { supabase.removeChannel(ch); }
  }, [pathname]);

  const handleLogout = () => {
      supabase.auth.signOut();
      router.replace("/admin/login");
  };

  return (
    <div className="flex h-screen bg-[#050505] text-[#f5f5f5] font-sans">
      {/* Sidebar Restrita e Profissional da Agência */}
      <aside className="w-[84px] hover:w-[280px] group bg-[#0a0a0a] border-r border-[#222] flex flex-col justify-between hidden md:flex shrink-0 transition-all duration-300 absolute z-50 h-full overflow-hidden shadow-2xl shadow-black/80">
        <div className="w-[280px]">
            <div className="p-4 border-b border-[#222] h-[84px] flex items-center">
               <div className="flex items-center gap-4 px-2">
                  <div className="w-12 h-12 rounded-xl bg-white shrink-0 text-black flex items-center justify-center font-black text-lg shadow-[0_0_20px_rgba(255,255,255,0.1)]">
                    HQ
                  </div>
                  <div className="flex flex-col opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                      <span className="font-extrabold text-[16px] tracking-tight leading-none uppercase">Suprema</span>
                      <span className="text-[10px] uppercase font-bold text-emerald-500 mt-1.5 flex items-center gap-1.5 tracking-widest"><span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse"></span> Sistema Online</span>
                  </div>
               </div>
            </div>

            <div className="p-4 flex flex-col gap-2 mt-4">
               <div className="px-3 mb-2 opacity-0 group-hover:opacity-100 transition-opacity"><span className="text-[10px] font-bold text-[#555] uppercase tracking-widest">Plataforma</span></div>
               <NavItem icon={<LayoutDashboard className="w-5 h-5"/>} label="Visão Geral" active={pathname === '/admin'} href="/admin" />
               <NavItem icon={<Users className="w-5 h-5"/>} label="Visão dos Clientes" active={pathname?.includes('/admin/clients')} href="/admin/clients" />
               
               <div className="px-3 mb-2 mt-4 opacity-0 group-hover:opacity-100 transition-opacity"><span className="text-[10px] font-bold text-[#555] uppercase tracking-widest">Operações</span></div>
               <NavItem badge={unreadChat} icon={<MessageSquareText className="w-5 h-5"/>} label="Comunicações (Teams)" active={pathname?.includes('/admin/chat')} href="/admin/chat" />
               <NavItem badge={unreadTasks} icon={<LayoutList className="w-5 h-5"/>} label="Projetos (Trello View)" active={pathname?.includes('/admin/tasks')} href="/admin/tasks" />
               <NavItem icon={<Rocket className="w-5 h-5"/>} label="Deploy & Publicação" active={pathname?.includes('/admin/deploy')} href="/admin/deploy" />
            </div>
        </div>

        <div className="p-5 border-t border-[#222] w-[280px]">
             <button onClick={handleLogout} className="cursor-pointer flex items-center gap-4 px-2 py-3 text-sm font-bold text-[#777] hover:text-[#ff4040] hover:bg-red-500/10 rounded-xl w-full transition-colors">
                <LogOut className="w-5 h-5 shrink-0 ml-1"/> <span className="opacity-0 group-hover:opacity-100 transition-opacity duration-300 whitespace-nowrap">Desconectar Operador</span>
             </button>
        </div>
      </aside>

      <div className="hidden md:block w-[84px] bg-[#050505] shrink-0 border-r border-[#222]"></div>

      <main className="flex-1 flex flex-col overflow-hidden h-screen bg-[#050505]">
         {children}
      </main>
    </div>
  );
}

function NavItem({ icon, label, active = false, href, badge }: { icon: ReactNode, label: string, active?: boolean, href: string, badge?: boolean }) {
    return (
        <Link href={href} className={`flex items-center gap-4 px-3 py-3 rounded-xl text-[14px] transition-all duration-200 cursor-pointer ${active ? 'bg-white text-black font-extrabold shadow-md' : 'text-[#888] font-semibold hover:bg-[#111213] hover:text-white border border-transparent'}`}>
            <div className="relative shrink-0 ml-1">
                {icon}
                {badge && <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-red-500 rounded-full border border-[#111] animate-pulse"></span>}
            </div>
            <span className="opacity-0 group-hover:opacity-100 transition-opacity duration-300 whitespace-nowrap">{label}</span>
        </Link>
    )
}
