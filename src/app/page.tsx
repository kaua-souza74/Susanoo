"use client";
import { 
  ArrowRight, 
  Layers, 
  MessageSquare, 
  Target, 
  Workflow, 
  Zap, 
  Shield, 
  Rocket,
  Globe,
  Monitor,
  ExternalLink
} from "lucide-react";
import { motion, useScroll, useTransform } from "framer-motion";
import { ThemeToggle } from "@/components/theme-toggle";
import { Logo } from "@/components/logo";
import { useRouter } from "next/navigation";
import { useRef } from "react";
import Link from "next/link";
import { ShaderAnimation } from "@/components/ui/shader-animation";

export default function Home() {
  const router = useRouter();
  const targetRef = useRef(null);
  const { scrollYProgress } = useScroll({
    target: targetRef,
    offset: ["start start", "end start"]
  });

  const opacity = useTransform(scrollYProgress, [0, 0.5], [1, 0]);
  const scale = useTransform(scrollYProgress, [0, 0.5], [1, 0.9]);
  const y = useTransform(scrollYProgress, [0, 0.5], [0, 100]);

  return (
    <div className="min-h-screen bg-background text-foreground transition-colors selection:bg-accent selection:text-white overflow-x-hidden">
      {/* Navbar */}
      <nav className="fixed top-0 w-full z-[100] p-3 md:p-6">
        <div className="max-w-7xl mx-auto flex items-center justify-between bg-surface/40 backdrop-blur-2xl border border-surface-border p-2.5 px-4 md:p-3 md:px-6 rounded-2xl md:rounded-3xl shadow-2xl hover:border-accent/20 transition-all duration-500">
          <Link href="/" className="flex items-center cursor-pointer">
            <Logo size="md" />
          </Link>
          <div className="hidden md:flex items-center gap-8">
            <a href="#features" className="text-[13px] font-bold opacity-60 hover:opacity-100 transition-opacity uppercase tracking-widest">Recursos</a>
            <a href="/tutorial" className="text-[13px] font-bold opacity-60 hover:opacity-100 transition-opacity uppercase tracking-widest">Como Funciona</a>
          </div>
          <div className="flex items-center gap-3 md:gap-4">
            <ThemeToggle />
            <button 
              onClick={() => router.push('/login')}
              className="bg-foreground text-background font-black text-[10px] md:text-[12px] px-4 py-2 md:px-6 md:py-2.5 rounded-xl md:rounded-2xl hover:scale-105 active:scale-95 transition-all shadow-xl shadow-foreground/10"
            >
              ENTRAR
            </button>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section ref={targetRef} className="relative pt-24 pb-16 md:pt-32 md:pb-24 px-4 md:px-6 min-h-screen flex flex-col items-center justify-center overflow-hidden">
        <div className="absolute inset-0 z-0 opacity-40">
           <ShaderAnimation />
        </div>

        <motion.div style={{ opacity, scale, y }} className="relative z-10 w-full max-w-7xl mx-auto text-center">
          <motion.div 
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="inline-flex items-center gap-2 bg-accent/10 border border-accent/20 px-3 py-1.5 md:px-4 md:py-2 rounded-full mb-6 md:mb-10"
          >
            <span className="w-1.5 h-1.5 md:w-2 md:h-2 rounded-full bg-accent animate-pulse"></span>
            <span className="text-[9px] md:text-[10px] font-black uppercase tracking-[0.3em] text-accent">Beyond Digital Engineering</span>
          </motion.div>

          <motion.h1 
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="text-4xl sm:text-6xl md:text-8xl lg:text-[10rem] font-black tracking-tighter leading-none mb-6 md:mb-8 uppercase italic"
          >
            SUSANOO<span className="text-accent underline decoration-white/10 decoration-8 underline-offset-[10px] md:underline-offset-[20px]">.</span>
          </motion.h1>

          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.4 }}
            className="max-w-2xl mx-auto text-sm md:text-xl font-bold text-foreground/40 leading-relaxed mb-8 md:mb-10 px-2 md:px-4 italic"
          >
            A nova era da produção digital. Design agressivo, performance nuclear e transparência absoluta.
          </motion.p>

          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.6 }}
            className="flex flex-col sm:flex-row items-center justify-center gap-4 md:gap-8 relative z-50 px-4"
          >
            <button 
              onClick={() => router.push('/register')}
              className="w-full sm:w-auto group bg-accent text-white font-black text-base md:text-xl px-8 py-5 md:px-14 md:py-8 rounded-2xl md:rounded-[3rem] hover:scale-105 md:hover:scale-110 md:hover:-rotate-2 active:scale-95 transition-all shadow-[0_20px_40px_-15px_rgba(168,85,247,0.5)] flex items-center justify-center gap-3 md:gap-4 relative z-[60]"
            >
              Começar Projeto <ArrowRight className="w-5 h-5 md:w-7 md:h-7 group-hover:translate-x-2 transition-transform" />
            </button>
            <button 
              onClick={() => router.push('/tutorial')}
              className="w-full sm:w-auto group bg-surface/80 border-2 border-surface-border text-foreground font-black text-base md:text-xl px-8 py-5 md:px-14 md:py-8 rounded-2xl md:rounded-[3rem] hover:bg-white hover:text-black hover:scale-105 md:hover:scale-110 md:hover:rotate-2 transition-all flex items-center justify-center gap-3 md:gap-4 backdrop-blur-3xl shadow-2xl relative z-[60]"
            >
              <MessageSquare className="w-5 h-5 md:w-6 md:h-6 text-accent" />
              Falar com Equipe
            </button>
          </motion.div>
        </motion.div>

        <motion.div style={{ y: useTransform(scrollYProgress, [0, 1], [0, -400]) }} className="absolute top-[20%] -left-32 w-[600px] h-[600px] bg-accent/10 rounded-full blur-[140px] pointer-events-none" />
      </section>

      {/* Features Section */}
      <section id="features" className="py-20 md:py-40 px-4 md:px-6 bg-background relative z-10 border-t border-surface-border">
        <div className="max-w-7xl mx-auto">
          <div className="mb-16 md:mb-24 px-2 md:px-4 text-center md:text-left">
            <h2 className="text-3xl md:text-5xl lg:text-7xl font-black tracking-tighter mb-6 md:mb-8 bg-gradient-to-br from-foreground to-foreground/40 bg-clip-text text-transparent italic leading-tight uppercase">
              Operação de <br /> Próxima Geração.
            </h2>
            <p className="text-base md:text-xl text-foreground/40 font-bold max-w-2xl leading-relaxed italic border-l-4 border-accent pl-4 md:pl-8">
              Eliminamos a barreira entre a ideia e a publicação. Controle total, transparência absoluta e performance fora da curva.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 md:grid-rows-2 gap-4 md:gap-8 h-auto md:h-[900px] px-2 md:px-4">
             <div className="md:col-span-2 md:row-span-2 bg-surface/30 backdrop-blur-3xl border border-surface-border rounded-3xl md:rounded-[3.5rem] p-6 md:p-16 flex flex-col justify-between group overflow-hidden relative shadow-3xl">
                <div className="absolute top-0 right-0 w-full h-full bg-gradient-to-br from-accent/10 to-transparent opacity-0 group-hover:opacity-100 transition-all duration-700" />
                <div className="relative z-10">
                  <div className="w-12 h-12 md:w-20 md:h-20 bg-accent/10 rounded-xl md:rounded-[2.5rem] flex items-center justify-center mb-6 md:mb-10 border border-accent/20 group-hover:scale-110 transition-transform">
                     <MessageSquare className="w-6 h-6 md:w-10 md:h-10 text-accent" />
                  </div>
                  <h3 className="text-2xl md:text-4xl lg:text-5xl font-black tracking-tighter mb-4 md:mb-6 leading-tight uppercase">Comunicação <br /> Nuclear.</h3>
                  <p className="text-sm md:text-lg lg:text-xl text-foreground/55 font-bold leading-relaxed italic">
                    Chat unificado com sua equipe dedicada. Cada detalhe reportado em tempo real.
                  </p>
                </div>
             </div>

             <div className="md:col-span-2 bg-surface/30 backdrop-blur-3xl border border-surface-border rounded-3xl md:rounded-[3.5rem] p-6 md:p-12 flex flex-col sm:flex-row items-center sm:items-start md:items-center gap-6 md:gap-10 group relative overflow-hidden transition-all hover:bg-surface/50 shadow-2xl">
                <div className="shrink-0 w-16 h-16 md:w-24 md:h-24 bg-emerald-500/10 rounded-2xl md:rounded-[2.5rem] flex items-center justify-center border border-emerald-500/20 group-hover:rotate-12 transition-transform duration-500">
                   <Zap className="w-8 h-8 md:w-12 md:h-12 text-emerald-500" />
                </div>
                <div className="text-center sm:text-left">
                   <h3 className="text-xl md:text-3xl font-black mb-2 md:mb-3 italic uppercase">Performance 100/100</h3>
                   <p className="text-sm md:text-lg text-foreground/40 font-bold">Google Lighthouse com foco em velocidade pura e SEO agressivo.</p>
                </div>
             </div>

             <div className="bg-surface/30 backdrop-blur-3xl border border-surface-border rounded-3xl md:rounded-[3.5rem] p-6 md:p-12 group overflow-hidden flex flex-col justify-between hover:border-accent/40 transition-colors shadow-xl">
                <Rocket className="w-10 h-10 md:w-14 md:h-14 text-blue-500 mb-6 md:mb-10 group-hover:-translate-y-3 group-hover:translate-x-3 transition-transform" />
                <div>
                   <h3 className="text-lg md:text-2xl font-black mb-2 uppercase italic tracking-tighter">1-Click Deploy</h3>
                   <p className="text-[10px] md:text-xs font-black text-foreground/30 uppercase tracking-widest">Global Edge Instance</p>
                </div>
             </div>

             <div className="bg-foreground text-background rounded-3xl md:rounded-[3.5rem] p-6 md:p-12 flex flex-col justify-between group overflow-hidden relative shadow-[0_30px_60px_-10px_rgba(0,0,0,0.5)]">
                <div className="absolute inset-0 bg-accent/20 rotate-12 translate-x-1/2 translate-y-1/2 rounded-full blur-[80px]" />
                <div className="text-4xl md:text-6xl font-black text-accent mb-4 md:mb-auto relative z-10 group-hover:scale-110 transition-transform origin-left">24/7</div>
                <div className="relative z-10 font-bold text-lg md:text-2xl uppercase tracking-tighter leading-none italic">
                   Monitoramento <br /> de Operação.
                </div>
             </div>
          </div>
        </div>
      </section>

      {/* Partners / Trust Strip */}
      <section className="py-24 px-6 border-y border-surface-border bg-black">
         <div className="max-w-7xl mx-auto flex flex-wrap justify-between items-center gap-16 grayscale opacity-20 hover:grayscale-0 hover:opacity-100 transition-all duration-700">
            <div className="text-3xl font-black tracking-tighter cursor-default italic">SUSANOO TECH</div>
            <div className="text-3xl font-black tracking-tighter cursor-default">BEYOND DESIGN</div>
            <div className="text-3xl font-black tracking-tighter cursor-default underline decoration-accent underline-offset-8">ENGINE HQ</div>
            <div className="text-3xl font-black tracking-tighter cursor-default italic uppercase">PXL CORE</div>
         </div>
      </section>

      {/* Footer */}
      <footer className="py-24 px-6 border-t border-surface-border bg-background">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col md:flex-row justify-between items-start gap-12 mb-20">
             <div className="flex flex-col gap-6">
                <Logo size="lg" />
                <p className="text-foreground/40 font-bold max-w-sm italic">Exclusividade técnica e visual para marcas que não aceitam o comum.</p>
             </div>
          </div>
          <div className="pt-12 border-t border-surface-border flex flex-col sm:row justify-between items-center gap-6 text-center">
            <div className="text-foreground/20 text-[10px] font-black uppercase tracking-[0.6em]">
              © {new Date().getFullYear()} Susanoo Operações Digitais.
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
