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
      {/* Navbar Minimalista Compacta */}
      <nav className="fixed top-0 w-full z-50 p-4 md:p-6">
        <div className="max-w-7xl mx-auto flex items-center justify-between bg-surface/40 backdrop-blur-2xl border border-surface-border p-3 px-6 rounded-3xl shadow-2xl">
          <Link href="/">
            <Logo size="md" />
          </Link>
          <div className="flex items-center gap-6">
            <Link href="/" className="text-[13px] font-bold opacity-60 hover:opacity-100 transition-opacity">Voltar para Home</Link>
            <ThemeToggle />
          </div>
        </div>
      </nav>

      <main className="pt-44 pb-24 px-6 max-w-7xl mx-auto">
        <motion.div
           initial={{ opacity: 0, y: 20 }}
           animate={{ opacity: 1, y: 0 }}
           className="text-center mb-24"
        >
          <h1 className="text-5xl md:text-7xl font-black mb-6 tracking-tight">O Fluxo da <span className="text-accent underline decoration-8 decoration-accent/20 underline-offset-8">Vantagem</span>.</h1>
          <p className="text-xl font-medium text-foreground/50 max-w-3xl mx-auto">Descubra como a Susanoo transforma sua visão em um ecossistema digital de alta performance em tempo real.</p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
          <StepCard 
            number="01"
            icon={<Monitor className="w-10 h-10 text-accent" />}
            title="Discovery & AI"
            description="Você entra no Discover, escolhe a base do seu projeto ou usa nossa IA para gerar o briefing perfeito. Definimos a alma do seu site."
          />
          <StepCard 
            number="02"
            icon={<MessageSquare className="w-10 h-10 text-emerald-500" />}
            title="Chat em Tempo Real"
            description="Comunique-se instantaneamente com nossa equipe de elite. Envie anexos, receba updates e ajuste cada detalhe conforme ele acontece."
          />
          <StepCard 
            number="03"
            icon={<Layout className="w-10 h-10 text-blue-500" />}
            title="Gestão Kanban"
            description="Acompanhe o cardápio, as fotos e o código sendo produzidos. Mova tarefas, de feedbacks e veja o avanço visual em cada coluna."
          />
          <StepCard 
            number="04"
            icon={<Zap className="w-10 h-10 text-yellow-500" />}
            title="Cronograma Ativo"
            description="Veja onde seu projeto está na linha do tempo. De briefing ao deployment, cada etapa é visível e transparente."
          />
          <StepCard 
            number="05"
            icon={<Shield className="w-10 h-10 text-purple-500" />}
            title="Segurança SaaS"
            description="Seus dados e sua marca estão protegidos sob autenticação de dois fatores e criptografia de ponta no banco Supabase."
          />
          <StepCard 
            number="06"
            icon={<Rocket className="w-10 h-10 text-orange-500" />}
            title="Deploy de Elite"
            description="Ao final, seu site é publicado na infraestrutura global da Vercel. Performance máxima, SEO agressivo e prontidão total."
          />
        </div>

        <motion.div 
          initial={{ opacity: 0, scale: 0.9 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          className="mt-32 p-12 md:p-24 bg-foreground text-background rounded-[4rem] text-center relative overflow-hidden"
        >
          <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 mix-blend-overlay"></div>
          <h2 className="text-4xl md:text-6xl font-black mb-10 relative z-10 leading-tight">Pronto para dominar <br /> seu mercado digital?</h2>
          <button 
            onClick={() => router.push('/register')}
            className="group bg-accent text-white font-black text-xl px-12 py-6 rounded-[2.5rem] hover:scale-105 active:scale-95 transition-all shadow-3xl shadow-accent/40 relative z-10 flex items-center gap-4 mx-auto"
          >
            Começar Meu Projeto <ArrowRight className="w-6 h-6 group-hover:translate-x-2 transition-transform" />
          </button>
        </motion.div>
      </main>
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
