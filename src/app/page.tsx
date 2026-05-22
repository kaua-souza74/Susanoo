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
      <nav className="fixed top-0 w-full z-[100] p-4 md:p-6">
        <div className="max-w-7xl mx-auto flex items-center justify-between bg-surface/40 backdrop-blur-2xl border border-surface-border p-3 px-6 rounded-3xl shadow-2xl hover:border-accent/20 transition-all duration-500">
          <Link href="/" className="flex items-center cursor-pointer">
            <Logo size="md" />
          </Link>
          <div className="hidden md:flex items-center gap-8">
            <a href="#features" className="text-[13px] font-bold opacity-60 hover:opacity-100 transition-opacity uppercase tracking-widest">Recursos</a>
            <a href="/tutorial" className="text-[13px] font-bold opacity-60 hover:opacity-100 transition-opacity uppercase tracking-widest">Como Funciona</a>
          </div>
          <div className="flex items-center gap-4">
            <ThemeToggle />
            <button 
              onClick={() => router.push('/login')}
              className="bg-foreground text-background font-black text-[12px] px-6 py-2.5 rounded-2xl hover:scale-105 active:scale-95 transition-all shadow-xl shadow-foreground/10"
            >
              ENTRAR
            </button>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section ref={targetRef} className="relative pt-32 pb-24 px-6 min-h-screen flex flex-col items-center justify-center overflow-hidden">
        <div className="absolute inset-0 z-0 opacity-40">
           <ShaderAnimation />
        </div>

        <motion.div style={{ opacity, scale, y }} className="relative z-10 w-full max-w-7xl mx-auto text-center">
          <motion.div 
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="inline-flex items-center gap-2 bg-accent/10 border border-accent/20 px-4 py-2 rounded-full mb-10"
          >
            <span className="w-2 h-2 rounded-full bg-accent animate-pulse"></span>
            <span className="text-[10px] font-black uppercase tracking-[0.3em] text-accent">Beyond Digital Engineering</span>
          </motion.div>

          <motion.h1 
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="text-5xl md:text-8xl lg:text-[10rem] font-black tracking-tighter leading-none mb-8 uppercase italic"
          >
            SUSANOO<span className="text-accent underline decoration-white/10 decoration-8 underline-offset-[20px]">.</span>
          </motion.h1>

          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.4 }}
            className="max-w-2xl mx-auto text-lg md:text-xl font-bold text-foreground/40 leading-relaxed mb-10 px-4 italic"
          >
            A nova era da produção digital. Design agressivo, performance nuclear e transparência absoluta.
          </motion.p>

          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.6 }}
            className="flex flex-col sm:flex-row items-center justify-center gap-8 relative z-50 px-6"
          >
            <button 
              onClick={() => router.push('/register')}
              className="w-full sm:w-auto group bg-accent text-white font-black text-xl px-14 py-8 rounded-[3rem] hover:scale-110 hover:-rotate-2 active:scale-95 transition-all shadow-[0_30px_60px_-15px_rgba(168,85,247,0.5)] flex items-center justify-center gap-4 relative z-[60]"
            >
              Começar Projeto <ArrowRight className="w-7 h-7 group-hover:translate-x-2 transition-transform" />
            </button>
            <button 
              onClick={() => router.push('/tutorial')}
              className="w-full sm:w-auto group bg-surface/80 border-2 border-surface-border text-foreground font-black text-xl px-14 py-8 rounded-[3rem] hover:bg-white hover:text-black hover:scale-110 hover:rotate-2 transition-all flex items-center justify-center gap-4 backdrop-blur-3xl shadow-2xl relative z-[60]"
            >
              <MessageSquare className="w-6 h-6 text-accent" />
              Falar com Equipe
            </button>
          </motion.div>
        </motion.div>

        <motion.div style={{ y: useTransform(scrollYProgress, [0, 1], [0, -400]) }} className="absolute top-[20%] -left-32 w-[600px] h-[600px] bg-accent/10 rounded-full blur-[140px] pointer-events-none" />
      </section>

      {/* Features Section */}
      <section id="features" className="py-40 px-6 bg-background relative z-10 border-t border-surface-border">
        <div className="max-w-7xl mx-auto">
          <div className="mb-24 px-4 text-center md:text-left">
            <h2 className="text-5xl md:text-7xl font-black tracking-tighter mb-8 bg-gradient-to-br from-foreground to-foreground/40 bg-clip-text text-transparent italic leading-tight uppercase">
              Operação de <br /> Próxima Geração.
            </h2>
            <p className="text-xl text-foreground/40 font-bold max-w-2xl leading-relaxed italic border-l-4 border-accent pl-8">
              Eliminamos a barreira entre a ideia e a publicação. Controle total, transparência absoluta e performance fora da curva.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 md:grid-rows-2 gap-8 h-auto md:h-[900px] px-4">
             <div className="md:col-span-2 md:row-span-2 bg-surface/30 backdrop-blur-3xl border border-surface-border rounded-[3.5rem] p-16 flex flex-col justify-between group overflow-hidden relative shadow-3xl">
                <div className="absolute top-0 right-0 w-full h-full bg-gradient-to-br from-accent/10 to-transparent opacity-0 group-hover:opacity-100 transition-all duration-700" />
                <div className="relative z-10">
                  <div className="w-20 h-20 bg-accent/10 rounded-[2.5rem] flex items-center justify-center mb-10 border border-accent/20 group-hover:scale-110 transition-transform">
                     <MessageSquare className="w-10 h-10 text-accent" />
                  </div>
                  <h3 className="text-4xl md:text-5xl font-black tracking-tighter mb-6 leading-tight uppercase">Comunicação <br /> Nuclear.</h3>
                  <p className="text-lg md:text-xl text-foreground/50 font-bold leading-relaxed italic">
                    Chat unificado com sua equipe dedicada. Cada detalhe reportado em tempo real.
                  </p>
                </div>
             </div>

             <div className="md:col-span-2 bg-surface/30 backdrop-blur-3xl border border-surface-border rounded-[3.5rem] p-12 flex items-center gap-10 group relative overflow-hidden transition-all hover:bg-surface/50 shadow-2xl">
                <div className="shrink-0 w-24 h-24 bg-emerald-500/10 rounded-[2.5rem] flex items-center justify-center border border-emerald-500/20 group-hover:rotate-12 transition-transform duration-500">
                   <Zap className="w-12 h-12 text-emerald-500" />
                </div>
                <div>
                   <h3 className="text-3xl font-black mb-3 italic uppercase">Performance 100/100</h3>
                   <p className="text-lg text-foreground/40 font-bold">Google Lighthouse com foco em velocidade pura e SEO agressivo.</p>
                </div>
             </div>

             <div className="bg-surface/30 backdrop-blur-3xl border border-surface-border rounded-[3.5rem] p-12 group overflow-hidden flex flex-col justify-between hover:border-accent/40 transition-colors shadow-xl">
                <Rocket className="w-14 h-14 text-blue-500 mb-10 group-hover:-translate-y-3 group-hover:translate-x-3 transition-transform" />
                <div>
                   <h3 className="text-2xl font-black mb-2 uppercase italic tracking-tighter">1-Click Deploy</h3>
                   <p className="text-xs font-black text-foreground/30 uppercase tracking-widest">Global Edge Instance</p>
                </div>
             </div>

             <div className="bg-foreground text-background rounded-[3.5rem] p-12 flex flex-col justify-between group overflow-hidden relative shadow-[0_30px_60px_-10px_rgba(0,0,0,0.5)]">
                <div className="absolute inset-0 bg-accent/20 rotate-12 translate-x-1/2 translate-y-1/2 rounded-full blur-[80px]" />
                <div className="text-6xl font-black text-accent mb-auto relative z-10 group-hover:scale-110 transition-transform origin-left">24/7</div>
                <div className="relative z-10 font-bold text-2xl uppercase tracking-tighter leading-none italic">
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
