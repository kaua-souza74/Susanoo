import { ReactNode } from "react";
import Link from "next/link";
import { Logo } from "@/components/logo";
import { ThemeToggle } from "@/components/theme-toggle";

export default function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen flex text-foreground bg-background transition-colors duration-300">
      {/* Left Panel - Image/Brand */}
      <div className="hidden lg:flex flex-col flex-1 bg-surface relative overflow-hidden border-r border-surface-border p-16 transition-colors duration-300">
        <div className="absolute top-0 left-0 w-full h-full">
          {/* Subtle Glow */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-accent/10 blur-[150px] rounded-full pointer-events-none" />
           {/* Decorative grid pattern */}
          <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-10 mix-blend-overlay"></div>
        </div>

        <Link href="/" className="relative z-10 flex items-center cursor-pointer">
          <Logo />
        </Link>

        <div className="relative z-10 mt-auto pb-12">
          <h1 className="text-6xl font-extrabold tracking-tight mb-8 leading-tight text-foreground">
             Transforme <br/> pequenas ideias <br/> em <span className="text-accent">grandes impérios.</span>
          </h1>
          <p className="text-xl text-foreground/60 max-w-lg leading-relaxed">
             Acompanhe o desenvolvimento do seu site em tempo real, colabore com nossa equipe e escale a sua presença digital para uma experiência premium.
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
