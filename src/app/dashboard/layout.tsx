"use client";

import { ReactNode, useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  ArrowLeft,
  Calendar,
  Check,
  Grid,
  LogOut,
  Menu,
  MessageSquareText,
  Plus,
  Settings,
  ShoppingBag,
  Sparkles,
  User,
  X,
  Zap,
} from "lucide-react";
import { supabase } from "@/lib/supabase";
import { getAuthenticatedAccountType } from "@/lib/account";

type UserType = "Comércio" | "Desenvolvedor";

export default function DashboardLayout({ children }: { children: ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [userType, setUserType] = useState<UserType>("Comércio");
  const [storeProfileCompleted, setStoreProfileCompleted] = useState(true);
  const [unreadChatCount, setUnreadChatCount] = useState(0);
  const [globalToast, setGlobalToast] = useState<string | null>(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const checkProfileCompletion = () => {
    const type = localStorage.getItem("susanoo_profile_type");
    if (type === "Desenvolvedor") {
      setStoreProfileCompleted(true);
      return;
    }
    setStoreProfileCompleted(localStorage.getItem("susanoo_store_profile_completed") === "true");
  };

  useEffect(() => {
    const flash = sessionStorage.getItem("susanoo_flash_toast");
    if (!flash) return;

    sessionStorage.removeItem("susanoo_flash_toast");
    const showTimer = window.setTimeout(() => setGlobalToast(flash), 0);
    const hideTimer = window.setTimeout(() => setGlobalToast(null), 3500);
    return () => {
      window.clearTimeout(showTimer);
      window.clearTimeout(hideTimer);
    };
  }, [pathname]);

  useEffect(() => {
    let active = true;
    let messageChannel: ReturnType<typeof supabase.channel> | null = null;

    const checkType = async () => {
      const type = await getAuthenticatedAccountType();
      if (!active) return;
      setUserType(type);
      checkProfileCompletion();
    };

    const listenForMessages = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!active || !session?.user?.id) return;

      const userId = session.user.id;
      messageChannel = supabase
        .channel(`user-chat-counter-${userId}-${crypto.randomUUID()}`)
        .on("postgres_changes", { event: "INSERT", schema: "public", table: "messages" }, (payload) => {
          const message = payload.new as { user_id?: string };
          if (message?.user_id !== userId && !window.location.pathname.includes("/dashboard/chat")) {
            setUnreadChatCount((current) => current + 1);
          }
        })
        .subscribe();
    };

    checkType();
    listenForMessages();
    window.addEventListener("profileTypeChanged", checkType);
    window.addEventListener("profileCompletedChanged", checkProfileCompletion);

    return () => {
      active = false;
      window.removeEventListener("profileTypeChanged", checkType);
      window.removeEventListener("profileCompletedChanged", checkProfileCompletion);
      if (messageChannel) supabase.removeChannel(messageChannel);
    };
  }, []);

  useEffect(() => {
    if (!mobileMenuOpen) return;
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") setMobileMenuOpen(false);
    };
    document.addEventListener("keydown", closeOnEscape);
    return () => document.removeEventListener("keydown", closeOnEscape);
  }, [mobileMenuOpen]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.replace("/");
  };

  return (
    <div className="flex h-svh flex-col bg-background font-sans text-foreground selection:bg-accent selection:text-white md:flex-row">
      <header className="flex h-16 shrink-0 items-center gap-2 bg-surface/90 px-3 shadow-sm backdrop-blur-xl md:hidden">
        <button
          type="button"
          onClick={() => setMobileMenuOpen(true)}
          aria-label="Abrir menu"
          aria-expanded={mobileMenuOpen}
          className="flex h-10 w-10 items-center justify-center rounded-xl text-foreground/65 transition-colors hover:bg-foreground/5 hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
        >
          <Menu className="h-5 w-5" />
        </button>
        {pathname !== "/dashboard" ? (
          <button
            type="button"
            onClick={() => router.back()}
            aria-label="Voltar"
            className="flex h-10 w-10 items-center justify-center rounded-xl text-foreground/55 transition-colors hover:bg-foreground/5 hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>
        ) : null}
        <Link href="/dashboard" className="ml-1 flex min-w-0 items-center gap-2 font-black tracking-tight text-foreground">
          <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-accent text-white"><Zap className="h-4 w-4 fill-current" /></span>
          <span className="truncate">Susanoo</span>
        </Link>
      </header>

      <aside className="relative hidden w-20 shrink-0 md:block" aria-label="Navegação principal">
        <div className="group/sidebar absolute inset-y-0 left-0 z-[80] flex w-20 flex-col overflow-hidden bg-surface/95 py-4 shadow-[12px_0_40px_rgba(15,23,42,0.04)] backdrop-blur-xl transition-[width,box-shadow] duration-200 ease-out hover:w-64 hover:shadow-[18px_0_55px_rgba(15,23,42,0.12)] focus-within:w-64 focus-within:shadow-[18px_0_55px_rgba(15,23,42,0.12)] dark:shadow-[12px_0_40px_rgba(0,0,0,0.16)]">
          <SidebarContent userType={userType} pathname={pathname} unreadChatCount={pathname?.includes("/dashboard/chat") ? 0 : unreadChatCount} storeProfileCompleted={storeProfileCompleted} onLogout={handleLogout} compact />
        </div>
      </aside>

      <main className="flex h-[calc(100svh-4rem)] min-w-0 flex-1 flex-col overflow-hidden bg-background md:h-screen">
        {children}
      </main>

      {mobileMenuOpen ? (
        <div className="fixed inset-0 z-[100] md:hidden" role="dialog" aria-modal="true" aria-label="Menu de navegação">
          <button type="button" className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setMobileMenuOpen(false)} aria-label="Fechar menu" />
          <div className="relative flex h-full w-[min(20rem,88vw)] flex-col bg-surface p-4 shadow-2xl">
            <button
              type="button"
              onClick={() => setMobileMenuOpen(false)}
              aria-label="Fechar menu"
              className="absolute right-4 top-4 flex h-10 w-10 items-center justify-center rounded-xl text-foreground/55 hover:bg-foreground/5 hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
            >
              <X className="h-5 w-5" />
            </button>
            <SidebarContent userType={userType} pathname={pathname} unreadChatCount={pathname?.includes("/dashboard/chat") ? 0 : unreadChatCount} storeProfileCompleted={storeProfileCompleted} onLogout={handleLogout} onNavigate={() => setMobileMenuOpen(false)} />
          </div>
        </div>
      ) : null}

      {globalToast ? (
        <div className="fixed bottom-6 right-6 z-[120] flex max-w-sm items-center gap-3 rounded-2xl bg-surface/95 px-5 py-3.5 shadow-2xl ring-1 ring-emerald-500/30 backdrop-blur-md">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-emerald-500/10 text-emerald-500"><Check className="h-4 w-4" /></div>
          <p className="text-xs font-bold text-foreground md:text-sm">{globalToast}</p>
        </div>
      ) : null}
    </div>
  );
}

function SidebarContent({ userType, pathname, unreadChatCount, storeProfileCompleted, onLogout, onNavigate, compact = false }: { userType: UserType; pathname: string | null; unreadChatCount: number; storeProfileCompleted: boolean; onLogout: () => void; onNavigate?: () => void; compact?: boolean }) {
  const labelClass = compact ? "whitespace-nowrap opacity-0 transition-opacity duration-150 group-hover/sidebar:opacity-100 group-focus-within/sidebar:opacity-100" : "whitespace-nowrap";

  return (
    <>
      <div className="flex min-h-0 flex-1 flex-col">
        <Link href="/dashboard" onClick={onNavigate} aria-label="Ir para o painel Susanoo" className="mx-3 flex h-12 items-center gap-3 rounded-2xl px-2 text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-accent text-white shadow-lg shadow-accent/20"><Zap className="h-5 w-5 fill-current" /></span>
          <span className={`${labelClass} text-sm font-black tracking-wide`}>Susanoo</span>
        </Link>

        <nav className="custom-scrollbar mt-6 flex min-h-0 flex-1 flex-col gap-1 overflow-y-auto px-3">
          {userType === "Desenvolvedor" ? (
            <>
              <NavItem onNavigate={onNavigate} compact={compact} icon={<Sparkles className="h-5 w-5" />} label="Painel Dev" active={pathname === "/dashboard"} href="/dashboard" />
              <NavItem onNavigate={onNavigate} compact={compact} icon={<Grid className="h-5 w-5" />} label="Projetos Criados" active={Boolean(pathname?.includes("/projects"))} href="/dashboard/projects" />
              <NavItem onNavigate={onNavigate} compact={compact} icon={<Plus className="h-5 w-5" />} label="Adicionar Site" active={Boolean(pathname?.includes("/add-site"))} href="/dashboard/add-site" />
              <NavItem onNavigate={onNavigate} compact={compact} badge={unreadChatCount} icon={<MessageSquareText className="h-5 w-5" />} label="Chat com Clientes" active={Boolean(pathname?.includes("/chat"))} href="/dashboard/chat" />
            </>
          ) : (
            <>
              <NavItem onNavigate={onNavigate} compact={compact} icon={<Sparkles className="h-5 w-5" />} label="Marketplace" active={pathname === "/dashboard"} href="/dashboard" />
              <NavItem onNavigate={onNavigate} compact={compact} icon={<User className="h-5 w-5" />} label="Desenvolvedores" active={Boolean(pathname?.includes("/developers"))} href="/dashboard/developers" />
              <NavItem onNavigate={onNavigate} compact={compact} icon={<ShoppingBag className="h-5 w-5" />} label="Minhas Compras" active={Boolean(pathname?.includes("/projects"))} href="/dashboard/projects" />
              <NavItem onNavigate={onNavigate} compact={compact} icon={<Calendar className="h-5 w-5" />} label="Progresso Integrado" active={Boolean(pathname?.includes("/timeline") || pathname?.includes("/kanban"))} href="/dashboard/timeline" />
              <NavItem onNavigate={onNavigate} compact={compact} badge={unreadChatCount} icon={<MessageSquareText className="h-5 w-5" />} label="Chat com a Equipe" active={Boolean(pathname?.includes("/chat"))} href="/dashboard/chat" />
            </>
          )}

          <div className="h-3" aria-hidden="true" />
          <NavItem onNavigate={onNavigate} compact={compact} icon={<User className="h-5 w-5" />} label="Meu Perfil" active={Boolean(pathname?.includes("/profile"))} href="/dashboard/profile" warning={!storeProfileCompleted} />
          <NavItem onNavigate={onNavigate} compact={compact} icon={<Settings className="h-5 w-5" />} label="Configurações" active={Boolean(pathname?.includes("/settings"))} href="/dashboard/settings" />
        </nav>

      </div>

      <button type="button" onClick={onLogout} title={compact ? "Fazer logout" : undefined} className="mx-3 mt-2 flex h-12 items-center gap-3 overflow-hidden rounded-2xl px-3 text-sm font-bold text-foreground/50 transition-colors hover:bg-red-500/10 hover:text-red-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500">
        <LogOut className="h-5 w-5 shrink-0" />
        <span className={labelClass}>Fazer logout</span>
      </button>
    </>
  );
}

function NavItem({ icon, label, active = false, href, warning = false, badge = 0, compact = false, onNavigate }: { icon: ReactNode; label: string; active?: boolean; href: string; warning?: boolean; badge?: number; compact?: boolean; onNavigate?: () => void }) {
  const labelClass = compact ? "whitespace-nowrap opacity-0 transition-opacity duration-150 group-hover/sidebar:opacity-100 group-focus-within/sidebar:opacity-100" : "whitespace-nowrap";

  return (
    <Link href={href} onClick={onNavigate} aria-label={label} title={compact ? label : undefined} className={`group/item flex h-12 items-center justify-between overflow-hidden rounded-2xl px-3 text-sm transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent ${active ? "bg-accent/10 font-bold text-accent shadow-sm" : "font-medium text-foreground/55 hover:bg-foreground/5 hover:text-foreground"}`}>
      <span className="flex min-w-0 items-center gap-3">
        <span className={`flex h-6 w-6 shrink-0 items-center justify-center ${active ? "text-accent" : "text-foreground/45 group-hover/item:text-foreground"}`}>{icon}</span>
        <span className={labelClass}>{label}</span>
      </span>
      {badge > 0 || warning ? (
        <span className={`ml-2 flex h-5 min-w-5 shrink-0 items-center justify-center rounded-full px-1 text-[9px] font-black text-white ${warning ? "bg-amber-500" : "bg-red-500"}`}>{warning ? "!" : badge > 99 ? "99+" : badge}</span>
      ) : null}
    </Link>
  );
}
