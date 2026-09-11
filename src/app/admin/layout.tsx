"use client";
import { ReactNode, useState, useEffect } from "react";
import Link from "next/link";
import { LayoutDashboard, Users, MessageSquareText, LogOut, LayoutList, Rocket, Plus, Clock, Bell, Menu, X, Zap, WandSparkles } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { useRouter, usePathname } from "next/navigation";
import { ThemeToggle } from "@/components/theme-toggle";

export default function AdminLayout({ children }: { children: ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [unreadChat, setUnreadChat] = useState(0);
  const [unreadTasks, setUnreadTasks] = useState(0);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
     if (pathname?.includes('/admin/chat')) setUnreadChat(0);
     if (pathname?.includes('/admin/tasks')) setUnreadTasks(0);

     const ch = supabase.channel(`admin-notifs-${crypto.randomUUID()}`)
       .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'messages' }, () => {
           if (!pathname?.includes('/admin/chat')) setUnreadChat(prev => prev + 1);
       })
       .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'tasks' }, () => {
           if (!pathname?.includes('/admin/tasks')) setUnreadTasks(prev => prev + 1);
       }).subscribe();
     return () => { supabase.removeChannel(ch); }
  }, [pathname]);

  useEffect(() => {
    if (!mobileMenuOpen) return;
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") setMobileMenuOpen(false);
    };
    document.addEventListener("keydown", closeOnEscape);
    return () => document.removeEventListener("keydown", closeOnEscape);
  }, [mobileMenuOpen]);

  const handleLogout = () => {
      supabase.auth.signOut();
      router.replace("/login");
  };

  if (pathname === '/admin/login') {
    return <>{children}</>;
  }

  return (
    <div className="flex h-svh flex-col bg-background font-sans text-foreground transition-colors duration-300 md:flex-row">
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
               <NavItem icon={<WandSparkles className="w-5 h-5"/>} label="Sites Personalizados" active={pathname?.includes('/admin/requests')} href="/admin/requests" />
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

      <main className="flex h-svh min-w-0 flex-1 flex-col overflow-hidden bg-background transition-colors duration-300">
         <header className="flex h-16 shrink-0 items-center justify-between gap-3 px-3 shadow-sm md:hidden">
           <button type="button" onClick={() => setMobileMenuOpen(true)} aria-label="Abrir menu administrativo" aria-expanded={mobileMenuOpen} className="flex h-10 w-10 items-center justify-center rounded-xl text-foreground/60 hover:bg-foreground/5 hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent">
             <Menu className="h-5 w-5" />
           </button>
           <Link href="/admin" className="flex min-w-0 flex-1 items-center gap-2 font-black tracking-tight">
             <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-foreground text-background"><Zap className="h-4 w-4 fill-current" /></span>
             <span className="truncate">Susanoo Admin</span>
           </Link>
           <ThemeToggle className="h-10 w-10" />
         </header>
         <header className="hidden h-[84px] shrink-0 items-center justify-between px-8 transition-colors duration-300 md:flex">
           <div className="text-sm font-bold text-foreground/40 uppercase tracking-widest">Painel Administrativo</div>
           <div className="flex items-center gap-4">
             <ThemeToggle />
           </div>
         </header>
         {children}
      </main>

      {mobileMenuOpen ? (
        <div className="fixed inset-0 z-[120] md:hidden" role="dialog" aria-modal="true" aria-label="Menu administrativo">
          <button type="button" aria-label="Fechar menu" onClick={() => setMobileMenuOpen(false)} className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
          <aside className="relative flex h-full w-[min(20rem,88vw)] flex-col bg-surface p-4 shadow-2xl">
            <div className="flex items-center justify-between gap-3 px-2 pb-5">
              <div className="flex items-center gap-3">
                <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-foreground text-background"><Zap className="h-5 w-5 fill-current" /></span>
                <div><p className="font-black">Susanoo</p><p className="text-[9px] font-bold uppercase tracking-widest text-foreground/35">Administração</p></div>
              </div>
              <button type="button" onClick={() => setMobileMenuOpen(false)} aria-label="Fechar menu" className="flex h-10 w-10 items-center justify-center rounded-xl text-foreground/50 hover:bg-foreground/5 hover:text-foreground"><X className="h-5 w-5" /></button>
            </div>
            <nav onClick={() => setMobileMenuOpen(false)} className="custom-scrollbar flex min-h-0 flex-1 flex-col gap-1 overflow-y-auto">
              <NavItem expanded icon={<LayoutDashboard className="h-5 w-5" />} label="Visão Geral" active={pathname === '/admin'} href="/admin" />
              <NavItem expanded icon={<Users className="h-5 w-5" />} label="Clientes" active={pathname?.includes('/admin/clients')} href="/admin/clients" />
              <NavItem expanded badge={unreadChat} icon={<MessageSquareText className="h-5 w-5" />} label="Comunicações" active={pathname?.includes('/admin/chat')} href="/admin/chat" />
              <NavItem expanded icon={<WandSparkles className="h-5 w-5" />} label="Sites personalizados" active={pathname?.includes('/admin/requests')} href="/admin/requests" />
              <NavItem expanded badge={unreadTasks} icon={<LayoutList className="h-5 w-5" />} label="Tarefas" active={pathname?.includes('/admin/tasks')} href="/admin/tasks" />
              <NavItem expanded icon={<Rocket className="h-5 w-5" />} label="Deploy" active={pathname?.includes('/admin/deploy')} href="/admin/deploy" />
              <NavItem expanded icon={<Plus className="h-5 w-5" />} label="Adicionar Site" active={pathname?.includes('/admin/add-site')} href="/admin/add-site" />
              <NavItem expanded icon={<Clock className="h-5 w-5" />} label="Cronograma" active={pathname?.includes('/admin/timeline')} href="/admin/timeline" />
              <NavItem expanded icon={<Bell className="h-5 w-5" />} label="Notificações" active={pathname?.includes('/admin/notifications')} href="/admin/notifications" />
            </nav>
            <button type="button" onClick={handleLogout} className="mt-3 flex h-12 items-center gap-3 rounded-xl px-3 text-sm font-bold text-foreground/50 hover:bg-red-500/10 hover:text-red-500"><LogOut className="h-5 w-5" /> Desconectar</button>
          </aside>
        </div>
      ) : null}
    </div>
  );
}

function NavItem({ icon, label, active = false, href, badge, expanded = false }: { icon: ReactNode, label: string, active?: boolean, href: string, badge?: number, expanded?: boolean }) {
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
            <span className={`${expanded ? "opacity-100" : "opacity-0 group-hover:opacity-100"} whitespace-nowrap transition-opacity duration-300`}>{label}</span>
        </Link>
    )
}
