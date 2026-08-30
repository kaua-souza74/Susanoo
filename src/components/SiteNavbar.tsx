"use client";
import Link from "next/link";
import { Logo } from "@/components/logo";
import { ThemeToggle } from "@/components/theme-toggle";
import { useRouter, usePathname } from "next/navigation";

export function SiteNavbar() {
  const router = useRouter();
  const pathname = usePathname();

  if (pathname !== "/" && pathname !== "/tutorial" && pathname !== "/faq") {
    return null;
  }

  return (
    <nav className="fixed top-0 w-full z-[100] p-3 md:p-6">
      <div className="max-w-7xl mx-auto flex items-center justify-between bg-surface/40 backdrop-blur-2xl border border-surface-border p-2.5 px-4 md:p-3 md:px-6 rounded-2xl md:rounded-3xl shadow-2xl hover:border-accent/20 transition-all duration-500">
        <Link href="/" className="flex items-center cursor-pointer">
          <Logo size="md" />
        </Link>
        <div className="hidden md:flex items-center gap-8">
          <Link href="/" className="text-[13px] font-bold opacity-60 hover:opacity-100 transition-opacity uppercase tracking-widest">Página Inicial</Link>
          <Link href="/tutorial" className="text-[13px] font-bold opacity-60 hover:opacity-100 transition-opacity uppercase tracking-widest">Como Funciona</Link>
          <Link href="/faq" className="text-[13px] font-bold opacity-60 hover:opacity-100 transition-opacity uppercase tracking-widest">FAQ</Link>
        </div>
        <div className="flex items-center gap-3 md:gap-4">
          <button
            onClick={() => router.push('/login')}
            className="bg-foreground text-background font-black text-[10px] md:text-[12px] px-4 py-2 md:px-6 md:py-2.5 rounded-xl md:rounded-2xl hover:scale-105 active:scale-95 transition-all shadow-xl shadow-foreground/10"
          >
            ENTRAR
          </button>
        </div>
      </div>
    </nav>
  );
}
