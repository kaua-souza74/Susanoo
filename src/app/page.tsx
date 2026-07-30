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
      {/* Navbar moved to layout.tsx */}

      {/* Hero Section */}
      <section ref={targetRef} className="relative pt-24 pb-16 md:pt-32 md:pb-24 px-4 md:px-6 min-h-screen flex flex-col items-center justify-center overflow-hidden">
        <div className="absolute inset-0 z-0 opacity-40">
           <ShaderAnimation />
        </div>

        <motion.div style={{ opacity, scale, y }} className="relative z-10 w-full max-w-7xl mx-auto text-center">
          

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
            Seu negócio merece um site à altura. Da ideia ao lançamento, cuidamos de todo o processo para você vender mais e transmitir confiança.
          </motion.p>

          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.6 }}
            className="flex flex-col sm:flex-row items-center justify-center gap-4 md:gap-8 relative z-50 px-4"
          >
            <button 
              onClick={() => router.push('/register')}
              className="w-full sm:w-auto group bg-accent text-white font-black text-base md:text-xl px-8 py-5 md:px-14 md:py-8 rounded-2xl md:rounded-[3rem] hover:scale-105 md:hover:scale-110 md:hover:-rotate-2 active:scale-95 transition-all shadow-[0_20px_40px_-15px_rgba(168,85,247,0.5)] flex flex-col items-center justify-center gap-1 md:gap-2 relative z-[60]"
            >
              <span className="flex items-center gap-2">Quero um site <ArrowRight className="w-5 h-5 md:w-7 md:h-7 group-hover:translate-x-2 transition-transform" /></span>
              <span className="text-xs md:text-sm font-medium opacity-80 font-normal normal-case">Para clientes.</span>
            </button>
            <button 
              onClick={() => router.push('/sou-desenvolvedor')}
              className="w-full sm:w-auto group bg-surface/80 border-2 border-surface-border text-foreground font-black text-base md:text-xl px-8 py-5 md:px-14 md:py-8 rounded-2xl md:rounded-[3rem] hover:bg-white hover:text-black hover:scale-105 md:hover:scale-110 md:hover:rotate-2 transition-all flex flex-col items-center justify-center gap-1 md:gap-2 backdrop-blur-3xl shadow-2xl relative z-[60]"
            >
              <span className="flex items-center gap-2"><Monitor className="w-5 h-5 md:w-6 md:h-6 text-accent group-hover:text-black transition-colors" /> Sou desenvolvedor</span>
              <span className="text-xs md:text-sm font-medium opacity-80 font-normal normal-case">Para quem quer vender projetos na plataforma.</span>
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
              Tudo o que você precisa <br /> para colocar seu negócio online
            </h2>
            <p className="text-base md:text-xl text-foreground/40 font-bold max-w-2xl leading-relaxed italic border-l-4 border-accent pl-4 md:pl-8">
              Cuidamos de todas as etapas do projeto para que você tenha um site profissional, rápido e preparado para crescer junto com o seu negócio.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-8 h-auto px-2 md:px-4">
             {/* Card 1: Comunicação */}
             <div className="md:col-span-2 md:row-span-2 bg-surface/30 backdrop-blur-3xl border border-surface-border rounded-3xl md:rounded-[3.5rem] p-6 md:p-16 flex flex-col justify-between overflow-hidden relative shadow-3xl">
                <div className="absolute top-0 right-0 w-full h-full bg-gradient-to-br from-accent/10 to-transparent opacity-0 transition-all duration-700" />
                <div className="relative z-10">
                  <div className="w-12 h-12 md:w-20 md:h-20 bg-accent/10 rounded-xl md:rounded-[2.5rem] flex items-center justify-center mb-6 md:mb-10 border border-accent/20">
                     <MessageSquare className="w-6 h-6 md:w-10 md:h-10 text-accent" />
                  </div>
                  <h3 className="text-2xl md:text-4xl lg:text-5xl font-black tracking-tighter mb-4 md:mb-6 leading-tight uppercase">Comunicação <br /> transparente.</h3>
                  <p className="text-sm md:text-lg lg:text-xl text-foreground/55 font-bold leading-relaxed italic">
                    Acompanhe cada etapa do desenvolvimento e fale diretamente com a equipe responsável pelo seu projeto.
                  </p>
                </div>
             </div>

             {/* Card 2: Performance */}
             <div className="md:col-span-1 bg-surface/30 backdrop-blur-3xl border border-surface-border rounded-3xl md:rounded-[3.5rem] p-6 md:p-12 flex flex-col items-start gap-6 md:gap-10 relative overflow-hidden transition-all hover:bg-surface/50 shadow-2xl">
                <div className="shrink-0 w-16 h-16 md:w-24 md:h-24 bg-accent/10 rounded-2xl md:rounded-[2.5rem] flex items-center justify-center border border-accent/20">
                   <Zap className="w-8 h-8 md:w-12 md:h-12 text-accent" />
                </div>
                <div>
                   <h3 className="text-xl md:text-2xl font-black mb-2 md:mb-3 italic uppercase">Performance otimizada</h3>
                   <p className="text-sm md:text-base text-foreground/40 font-bold">Desenvolvemos sites rápidos, leves e preparados para oferecer uma excelente experiência aos visitantes.</p>
                </div>
             </div>

             {/* Card 3: Publicação */}
             <div className="md:col-span-1 bg-surface/30 backdrop-blur-3xl border border-surface-border rounded-3xl md:rounded-[3.5rem] p-6 md:p-12 overflow-hidden flex flex-col justify-between hover:border-accent/40 transition-colors shadow-xl">
                <div className="shrink-0 w-12 h-12 md:w-16 md:h-16 bg-accent/10 rounded-xl md:rounded-2xl flex items-center justify-center border border-accent/20 mb-6 md:mb-10">
                   <Rocket className="w-6 h-6 md:w-8 md:h-8 text-accent" />
                </div>
                <div>
                   <h3 className="text-lg md:text-2xl font-black mb-2 uppercase italic tracking-tighter">Publicação sem complicação</h3>
                   <p className="text-[10px] md:text-xs font-black text-foreground/30 uppercase">Quando tudo estiver pronto, colocamos seu site no ar sem que você precise se preocupar com configurações técnicas.</p>
                </div>
             </div>

             {/* Card 4: Segurança */}
             <div className="md:col-span-1 bg-surface/30 backdrop-blur-3xl border border-surface-border rounded-3xl md:rounded-[3.5rem] p-6 md:p-12 overflow-hidden flex flex-col justify-between hover:border-accent/40 transition-colors shadow-xl">
                <div className="shrink-0 w-12 h-12 md:w-16 md:h-16 bg-accent/10 rounded-xl md:rounded-2xl flex items-center justify-center border border-accent/20 mb-6 md:mb-10">
                   <Shield className="w-6 h-6 md:w-8 md:h-8 text-accent" />
                </div>
                <div>
                   <h3 className="text-lg md:text-2xl font-black mb-2 uppercase italic tracking-tighter">Segurança e estabilidade</h3>
                   <p className="text-[10px] md:text-xs font-black text-foreground/30 uppercase">Seu site fica disponível com alta confiabilidade e preparado para atender visitantes de qualquer lugar.</p>
                </div>
             </div>

             {/* Card 5: Suporte */}
             <div className="md:col-span-2 bg-foreground text-background rounded-3xl md:rounded-[3.5rem] p-6 md:p-12 flex flex-col justify-between overflow-hidden relative shadow-[0_30px_60px_-10px_rgba(0,0,0,0.5)]">
                <div className="absolute inset-0 bg-accent/20 rotate-12 translate-x-1/2 translate-y-1/2 rounded-full blur-[80px]" />
                <div className="text-4xl md:text-6xl font-black text-accent mb-4 md:mb-auto relative z-10 origin-left">24/7</div>
                <div className="relative z-10 font-bold text-lg md:text-2xl uppercase tracking-tighter leading-none italic mb-4">
                   Suporte <br /> contínuo.
                </div>
                <p className="text-sm md:text-base text-background/80 relative z-10 font-bold">Estamos disponíveis para acompanhar o funcionamento do seu projeto e oferecer suporte sempre que necessário.</p>
             </div>
          </div>
        </div>
      </section>

      {/* Partners / Trust Strip */}
      <section className="py-12 md:py-24 px-6 border-y border-surface-border bg-foreground overflow-hidden">
         <div className="max-w-7xl mx-auto text-center grayscale opacity-40 hover:grayscale-0 hover:opacity-100 transition-all duration-700">
            <div className="text-2xl sm:text-3xl md:text-5xl font-black tracking-tighter cursor-default italic uppercase break-words leading-tight text-background">
              SITES • E-COMMERCE • MARKETPLACE • DESIGN • DESENVOLVIMENTO • IA • SUSANOO
            </div>
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
