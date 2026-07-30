import { ReactNode } from "react";
import Link from "next/link";
import { Logo } from "@/components/logo";
import { ThemeToggle } from "@/components/theme-toggle";

export default function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen flex text-foreground bg-background transition-colors duration-300">
      {/* Left Panel - Image/Brand */}
      <div className="hidden lg:flex flex-col flex-1 bg-[#050505] relative overflow-hidden border-r border-surface-border p-16 transition-colors duration-300">
        {/* Decorative Background Circles */}
        <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
          <div className="absolute top-[-20%] right-[-10%] w-[800px] h-[800px] rounded-full bg-blue-600/20 shadow-[inset_0_0_100px_rgba(0,0,0,0.5)] blur-sm" />
          <div className="absolute bottom-[-15%] left-[-10%] w-[600px] h-[600px] rounded-full bg-blue-700/20 shadow-[inset_0_0_80px_rgba(0,0,0,0.6)] blur-sm" />
          <div className="absolute top-[40%] right-[10%] w-[300px] h-[300px] rounded-full bg-blue-500/15 shadow-[inset_0_0_120px_rgba(0,0,0,0.8)] blur-sm" />
          <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 mix-blend-overlay"></div>
        </div>

        <Link href="/" className="relative z-10 flex items-center cursor-pointer absolute top-12 left-12">
          <Logo />
        </Link>

        <div className="relative z-10 flex flex-col items-center justify-center h-full text-center px-8">
          <h1 className="text-4xl lg:text-[4rem] font-black tracking-tighter uppercase italic leading-none mb-6 text-white max-w-2xl">
             Transforme ideias em projetos reais.
          </h1>
          <p className="text-xl text-white/70 max-w-xl leading-relaxed mx-auto font-bold italic">
             Acesse sua conta para acompanhar projetos, conversar com sua equipe, gerenciar entregas ou encontrar novas oportunidades na plataforma Susanoo.
          </p>
        </div>
      </div>

      {/* Right Panel - Form Area */}
      <div className="flex-[0.8] flex flex-col justify-center items-center py-12 px-4 sm:px-8 bg-background relative z-20 shadow-2xl transition-colors duration-300">
        <div className="absolute top-6 right-6">
          <ThemeToggle />
        </div>
        <div className="w-full max-w-[420px]">
          {children}
        </div>
      </div>
    </div>
  );
}
