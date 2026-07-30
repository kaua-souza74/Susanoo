"use client";
import { motion, useScroll, useTransform } from "framer-motion";
import { 
  CheckCircle2, 
  MessageSquare, 
  Zap, 
  Settings, 
  Layout, 
  Rocket,
  Shield,
  ArrowRight,
  Monitor
} from "lucide-react";
import { Logo } from "@/components/logo";
import { ThemeToggle } from "@/components/theme-toggle";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useRef } from "react";

export default function TutorialPage() {
  const router = useRouter();
  
  return (
    <div className="min-h-screen bg-background text-foreground selection:bg-accent selection:text-white transition-colors duration-500">
      {/* Navbar moved to layout.tsx */}

      <main className="pt-44 pb-24 px-6 max-w-7xl mx-auto">
        <motion.div
           initial={{ opacity: 0, y: 20 }}
           animate={{ opacity: 1, y: 0 }}
           className="text-center mb-24"
        >
          <h1 className="text-5xl md:text-7xl font-black mb-6 tracking-tight">Do primeiro contato ao <span className="text-accent underline decoration-8 decoration-accent/20 underline-offset-8">seu site no ar</span>.</h1>
          <p className="text-xl font-medium text-foreground/50 max-w-3xl mx-auto uppercase tracking-widest font-bold">Etapas</p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
          <StepCard 
            number="01"
            icon={<Monitor className="w-10 h-10 text-accent" />}
            title="Conte sua ideia"
            description="Explique seu negócio, seus objetivos e o tipo de site que deseja. Se preferir, nossa IA pode ajudar a organizar o briefing."
          />
          <StepCard 
            number="02"
            icon={<MessageSquare className="w-10 h-10 text-accent" />}
            title="Receba sua proposta"
            description="Nossa equipe analisa seu projeto, define a melhor solução e apresenta orçamento, prazo e escopo de forma transparente."
          />
          <StepCard 
            number="03"
            icon={<Layout className="w-10 h-10 text-accent" />}
            title="Acompanhe o desenvolvimento"
            description="Converse com a equipe, envie feedbacks e acompanhe o progresso do projeto em tempo real por uma área exclusiva."
          />
          <StepCard 
            number="04"
            icon={<Zap className="w-10 h-10 text-accent" />}
            title="Aprovação e ajustes"
            description="Revise cada detalhe antes da publicação. Realizamos os ajustes necessários para que tudo fique exatamente como você imaginou."
          />
          <StepCard 
            number="05"
            icon={<Shield className="w-10 h-10 text-accent" />}
            title="Publicação"
            description="Seu site é colocado no ar com segurança, desempenho e preparado para funcionar em computadores e celulares."
          />
          <StepCard 
            number="06"
            icon={<Rocket className="w-10 h-10 text-accent" />}
            title="Cresça com a Susanoo"
            description="Após a entrega, você continua contando com suporte, atualizações e, futuramente, poderá contratar novos serviços diretamente pela plataforma."
          />
        </div>

        <motion.div 
          initial={{ opacity: 0, scale: 0.9 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          className="mt-32 p-12 md:p-24 bg-foreground text-background rounded-[4rem] text-center relative overflow-hidden"
        >
          <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 mix-blend-overlay"></div>
          <h2 className="text-4xl md:text-6xl font-black mb-10 relative z-10 leading-tight">Vamos construir algo <br /> incrível juntos?</h2>
          <button 
            onClick={() => router.push('/register')}
            className="group bg-accent text-white font-black text-xl px-12 py-6 rounded-[2.5rem] hover:scale-105 active:scale-95 transition-all shadow-3xl shadow-accent/40 relative z-10 flex items-center gap-4 mx-auto"
          >
            Quero um site <ArrowRight className="w-6 h-6 group-hover:translate-x-2 transition-transform" />
          </button>
        </motion.div>
      </main>

      {/* Footer */}
      <footer className="py-24 px-6 border-t border-surface-border bg-background mt-24">
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

function StepCard({ number, icon, title, description }: { number: string, icon: any, title: string, description: string }) {
  return (
    <motion.div 
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      className="group bg-surface p-10 rounded-[3rem] border border-surface-border hover:border-accent/30 transition-all shadow-2xl relative overflow-hidden"
    >
      <span className="absolute top-8 right-8 text-5xl font-black text-foreground/5 opacity-50 group-hover:text-accent/10 transition-colors">{number}</span>
      <div className="mb-8 p-6 bg-background rounded-3xl w-fit shadow-xl group-hover:scale-110 transition-transform">{icon}</div>
      <h3 className="text-2xl font-black mb-4 tracking-tight">{title}</h3>
      <p className="font-medium text-foreground/50 leading-relaxed">{description}</p>
    </motion.div>
  );
}
