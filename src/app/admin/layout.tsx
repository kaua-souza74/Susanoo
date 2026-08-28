"use client";
import { ReactNode, useState, useEffect } from "react";
import Link from "next/link";
import { LayoutDashboard, Users, MessageSquareText, Settings, LogOut, LayoutList, Rocket, Plus, Clock, Bell } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { useRouter, usePathname } from "next/navigation";
import { ThemeToggle } from "@/components/theme-toggle";

export default function AdminLayout({ children }: { children: ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [unreadChat, setUnreadChat] = useState(0);
  const [unreadTasks, setUnreadTasks] = useState(0);

  useEffect(() => {
     if (pathname?.includes('/admin/chat')) setUnreadChat(0);
     if (pathname?.includes('/admin/tasks')) setUnreadTasks(0);

     const ch = supabase.channel('admin-notifs')
       .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'messages' }, () => {
           if (!pathname?.includes('/admin/chat')) setUnreadChat(prev => prev + 1);
       })
       .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'tasks' }, () => {
           if (!pathname?.includes('/admin/tasks')) setUnreadTasks(prev => prev + 1);
       }).subscribe();
     return () => { supabase.removeChannel(ch); }
  }, [pathname]);

  const handleLogout = () => {
      supabase.auth.signOut();
      router.replace("/login");
  };

  if (pathname === '/admin/login') {
    return <>{children}</>;
  }

  return (
    <div className="flex h-screen bg-background text-foreground font-sans transition-colors duration-300">
      {/* Sidebar Restrita e Profissional da Agência */}
      <aside className="w-[84px] hover:w-[280px] group bg-surface border-r border-surface-border flex flex-col justify-between hidden md:flex shrink-0 transition-all duration-300 absolute z-50 h-full overflow-hidden shadow-2xl shadow-black/10 transition-colors duration-300">
        <div className="w-[280px]">
            <div className="p-4 border-b border-surface-border h-[84px] flex items-center transition-colors duration-300">
               <div className="flex items-center gap-4 px-2">
                  <div className="w-12 h-12 rounded-xl bg-foreground text-background shrink-0 flex items-center justify-center font-black text-lg shadow-md transition-colors duration-300">
                    HQ
                  </div>
                  <div className="flex flex-col opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                      <span className="font-extrabold text-[16px] tracking-tight leading-none uppercase text-foreground">Suprema</span>
                      <span className="text-[10px] uppercase font-bold text-emerald-500 mt-1.5 flex items-center gap-1.5 tracking-widest"><span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse"></span> Sistema Online</span>
                  </div>
               </div>
            </div>

            <div className="p-4 flex flex-col gap-2 mt-4">
               <div className="px-3 mb-2 opacity-0 group-hover:opacity-100 transition-opacity"><span className="text-[10px] font-bold text-foreground/40 uppercase tracking-widest">Plataforma</span></div>
               <NavItem icon={<LayoutDashboard className="w-5 h-5"/>} label="Visão Geral" active={pathname === '/admin'} href="/admin" />
               <NavItem icon={<Users className="w-5 h-5"/>} label="Visão dos Clientes" active={pathname?.includes('/admin/clients')} href="/admin/clients" />
               
               <div className="px-3 mb-2 mt-4 opacity-0 group-hover:opacity-100 transition-opacity"><span className="text-[10px] font-bold text-foreground/40 uppercase tracking-widest">Operações</span></div>
               <NavItem badge={unreadChat} icon={<MessageSquareText className="w-5 h-5"/>} label="Comunicações (Teams)" active={pathname?.includes('/admin/chat')} href="/admin/chat" />
               <NavItem badge={unreadTasks} icon={<LayoutList className="w-5 h-5"/>} label="Progresso & Tarefas" active={pathname?.includes('/admin/tasks')} href="/admin/tasks" />
               <NavItem icon={<Rocket className="w-5 h-5"/>} label="Deploy & Publicação" active={pathname?.includes('/admin/deploy')} href="/admin/deploy" />
               <NavItem icon={<Plus className="w-5 h-5"/>} label="Adicionar Site" active={pathname?.includes('/admin/add-site')} href="/admin/add-site" />
               <NavItem icon={<Clock className="w-5 h-5"/>} label="Cronograma Master" active={pathname?.includes('/admin/timeline')} href="/admin/timeline" />
               <NavItem icon={<Bell className="w-5 h-5"/>} label="Notificações" active={pathname?.includes('/admin/notifications')} href="/admin/notifications" />
            </div>
        </div>

        <div className="p-5 border-t border-surface-border w-[280px] transition-colors duration-300">
             <button onClick={handleLogout} className="cursor-pointer flex items-center gap-4 px-2 py-3 text-sm font-bold text-foreground/50 hover:text-[#ff4040] hover:bg-red-500/10 rounded-xl w-full transition-colors">
                <LogOut className="w-5 h-5 shrink-0 ml-1"/> <span className="opacity-0 group-hover:opacity-100 transition-opacity duration-300 whitespace-nowrap">Desconectar Operador</span>
             </button>
        </div>
      </aside>

      <div className="hidden md:block w-[84px] bg-background shrink-0 border-r border-surface-border transition-colors duration-300"></div>

      <main className="flex-1 flex flex-col overflow-hidden h-screen bg-background transition-colors duration-300">
         <header className="h-[84px] border-b border-surface-border flex items-center justify-between px-8 shrink-0 transition-colors duration-300">
           <div className="text-sm font-bold text-foreground/40 uppercase tracking-widest">Painel Administrativo</div>
           <div className="flex items-center gap-4">
             <ThemeToggle />
           </div>
         </header>
         {children}
      </main>
    </div>
  );
}

function NavItem({ icon, label, active = false, href, badge }: { icon: ReactNode, label: string, active?: boolean, href: string, badge?: number }) {
    return (
        <Link href={href} className={`flex items-center gap-4 px-3 py-3 rounded-xl text-[14px] transition-all duration-200 cursor-pointer ${active ? 'bg-foreground text-background font-extrabold shadow-md' : 'text-foreground/60 font-semibold hover:bg-foreground/5 hover:text-foreground border border-transparent'}`}>
            <div className="relative shrink-0 ml-1">
                {icon}
                {badge !== undefined && badge > 0 && (
                    <span className="absolute -top-2 -right-2 bg-red-600 text-white text-[10px] font-black w-5 h-5 flex items-center justify-center rounded-full border-2 border-surface shadow-lg flex-shrink-0">
                        {badge > 9 ? '9+' : badge}
                    </span>
                )}
            </div>
            <span className="opacity-0 group-hover:opacity-100 transition-opacity duration-300 whitespace-nowrap">{label}</span>
        </Link>
    )
}
