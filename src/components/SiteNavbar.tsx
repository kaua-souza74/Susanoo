"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { Logo } from "@/components/logo";
import { useRouter, usePathname } from "next/navigation";
import { Menu, X } from "lucide-react";

export function SiteNavbar() {
  const router = useRouter();
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    if (!mobileMenuOpen) return;
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") setMobileMenuOpen(false);
    };
    document.addEventListener("keydown", closeOnEscape);
    return () => document.removeEventListener("keydown", closeOnEscape);
  }, [mobileMenuOpen]);

  if (pathname !== "/" && pathname !== "/tutorial" && pathname !== "/faq") {
    return null;
  }

  return (
    <nav className="fixed top-0 z-[100] w-full p-3 md:p-6" aria-label="Navegação principal">
      <div className="max-w-7xl mx-auto flex items-center justify-between bg-surface/40 backdrop-blur-2xl border border-surface-border p-2.5 px-4 md:p-3 md:px-6 rounded-2xl md:rounded-3xl shadow-2xl hover:border-accent/20 transition-all duration-500">
        <Link href="/" className="flex items-center cursor-pointer">
          <Logo size="sm" />
        </Link>
        <div className="hidden md:flex items-center gap-8">
          <Link href="/" className="text-[13px] font-bold opacity-60 hover:opacity-100 transition-opacity uppercase tracking-widest">Página Inicial</Link>
          <Link href="/tutorial" className="text-[13px] font-bold opacity-60 hover:opacity-100 transition-opacity uppercase tracking-widest">Como Funciona</Link>
          <Link href="/faq" className="text-[13px] font-bold opacity-60 hover:opacity-100 transition-opacity uppercase tracking-widest">FAQ</Link>
        </div>
        <div className="flex items-center gap-2 md:gap-3">
          <button
            onClick={() => router.push('/login')}
            className="hidden h-10 items-center rounded-2xl bg-foreground px-5 text-[11px] font-black text-background shadow-xl shadow-foreground/10 transition-all hover:scale-[1.03] active:scale-95 md:inline-flex"
          >
            ENTRAR
          </button>
          <button
            type="button"
            onClick={() => setMobileMenuOpen((current) => !current)}
            aria-label={mobileMenuOpen ? "Fechar menu" : "Abrir menu"}
            aria-expanded={mobileMenuOpen}
            aria-controls="site-mobile-menu"
            className="flex h-10 w-10 items-center justify-center rounded-xl bg-foreground/5 text-foreground transition-colors hover:bg-foreground/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent md:hidden"
          >
            {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>

      {mobileMenuOpen ? (
        <div id="site-mobile-menu" className="mx-auto mt-2 flex max-w-7xl flex-col gap-1 rounded-2xl border border-surface-border bg-surface/95 p-2 shadow-2xl backdrop-blur-2xl md:hidden">
          {[
            ["Página Inicial", "/"],
            ["Como Funciona", "/tutorial"],
            ["Perguntas frequentes", "/faq"],
          ].map(([label, href]) => (
            <Link key={href} href={href} onClick={() => setMobileMenuOpen(false)} aria-current={pathname === href ? "page" : undefined} className={`rounded-xl px-4 py-3 text-sm font-black transition-colors ${pathname === href ? "bg-accent/10 text-accent" : "text-foreground/60 hover:bg-foreground/5 hover:text-foreground"}`}>
              {label}
            </Link>
          ))}
          <Link href="/login" onClick={() => setMobileMenuOpen(false)} className="mt-1 rounded-xl bg-foreground px-3 py-3 text-center text-xs font-black text-background">Entrar</Link>
        </div>
      ) : null}
    </nav>
  );
}
