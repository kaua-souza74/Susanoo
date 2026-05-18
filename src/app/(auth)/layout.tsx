import { ReactNode } from "react";
import { Zap } from "lucide-react";
import Link from "next/link";

export default function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen flex text-[#f5f5f5] bg-[#111213]">
      {/* Left Panel - Image/Brand */}
      <div className="hidden lg:flex flex-col flex-1 bg-[#141516] relative overflow-hidden border-r border-[#222] p-16">
        <div className="absolute top-0 left-0 w-full h-full">
          {/* Subtle Glow */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-accent/10 blur-[150px] rounded-full pointer-events-none" />
           {/* Decorative grid pattern */}
          <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-10 mix-blend-overlay"></div>
        </div>

        <Link href="/" className="relative z-10 flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-accent flex items-center justify-center shadow-lg shadow-accent/40">
            <Zap className="w-7 h-7 text-accent-foreground fill-current" />
          </div>
          <span className="text-3xl font-extrabold tracking-tight">Susanoo</span>
        </Link>

        <div className="relative z-10 mt-auto pb-12">
          <h1 className="text-6xl font-extrabold tracking-tight mb-8 leading-tight">
             Transforme <br/> pequenas ideias <br/> em <span className="text-accent">grandes impérios.</span>
          </h1>
          <p className="text-xl text-[#a0a0a0] max-w-lg leading-relaxed">
             Acompanhe o desenvolvimento do seu site em tempo real, colabore com nossa equipe e escale a sua presença digital para uma experiência premium.
          </p>
        </div>
      </div>

      {/* Right Panel - Form Area */}
      <div className="flex-[0.8] flex flex-col justify-center items-center py-12 px-4 sm:px-8 bg-[#111213] relative z-20 shadow-2xl">
        <div className="w-full max-w-[420px]">
          {children}
        </div>
      </div>
    </div>
  );
}
