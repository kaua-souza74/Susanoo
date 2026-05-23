"use client";
import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Calendar, CheckCircle2, Circle, Clock, ArrowRight } from "lucide-react";
import { supabase } from "@/lib/supabase";

export default function TimelinePage() {
  const [steps, setSteps] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchTimeline = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      const { data: projs } = await supabase.from('projects').select('id').eq('client_id', session.user.id);
      if (projs && projs.length > 0) {
        const { data: timelineData } = await supabase
          .from('timeline_steps')
          .select('*')
          .eq('project_id', projs[0].id)
          .order('order_index', { ascending: true });
        
        if (timelineData && timelineData.length > 0) {
          setSteps(timelineData);
        } else {
          setSteps([
            { title: "Briefing e Estrutura", date: "10 Mai", status: "completed", description: "Definição de objetivos e mapa do site." },
            { title: "Design de Interface (UI)", date: "15 Mai", status: "completed", description: "Criação do visual premium e prototipagem." },
            { title: "Desenvolvimento Front-end", date: "20 Mai", status: "current", description: "Transformação do design em código funcional." },
            { title: "Integração de Sistemas", date: "25 Mai", status: "upcoming", description: "Conexão com banco de dados e APIs." },
            { title: "Lançamento e SEO", date: "01 Jun", status: "upcoming", description: "Publicação e otimização para motores de busca." }
          ]);
        }
      }
      setLoading(false);
    };

    fetchTimeline();
  }, []);

  if (loading) return (
    <div className="flex-1 flex items-center justify-center bg-background">
        <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1, ease: "linear" }} className="w-10 h-10 border-[3px] border-surface-border border-t-accent rounded-full" />
    </div>
  );

  return (
    <div className="flex-1 overflow-y-auto bg-background p-6 md:p-8 w-full">
      <div className="max-w-4xl mx-auto w-full">
        
        <div className="flex items-center gap-4 mb-10">
          <div className="w-12 h-12 flex items-center justify-center bg-accent/10 border border-accent/20 rounded-xl">
            <Calendar className="w-6 h-6 text-accent" />
          </div>
          <div>
            <h1 className="text-2xl font-black text-foreground tracking-tight">Cronograma de Entrega</h1>
            <p className="text-sm text-foreground/50 mt-0.5">Visão geral e status do projeto.</p>
          </div>
        </div>

        <div className="relative">
          {/* Linha vertical */}
          <div className="absolute left-[27px] top-4 bottom-4 w-px bg-surface-border hidden md:block" />

          <div className="flex flex-col gap-6">
            {steps.map((step, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className="flex items-start gap-5 relative group"
              >
                {/* Ícone Indicador */}
                <div className={`z-10 w-14 h-14 rounded-2xl flex items-center justify-center shrink-0 border relative bg-background ${
                  step.status === 'completed' ? 'border-emerald-500/30 text-emerald-500' :
                  step.status === 'current' ? 'border-accent/30 text-accent' :
                  'border-surface-border text-foreground/30'
                }`}>
                  <div className={`absolute inset-0 rounded-2xl ${
                     step.status === 'completed' ? 'bg-emerald-500/10' :
                     step.status === 'current' ? 'bg-accent/10' :
                     'bg-surface'
                  }`} />
                  
                  <div className="relative z-10 flex items-center justify-center">
                    {step.status === 'completed' ? <CheckCircle2 className="w-6 h-6" /> :
                     step.status === 'current' ? <div className="relative flex"><Clock className="w-6 h-6"/><span className="absolute -top-1 -right-1 flex h-2.5 w-2.5"><span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-accent opacity-75"></span><span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-accent"></span></span></div> :
                     <Circle className="w-5 h-5 stroke-[1.5]" />}
                  </div>
                </div>

                {/* Card de Informação */}
                <div className={`flex-1 bg-surface py-5 px-6 rounded-2xl border transition-all duration-300 ${
                  step.status === 'current' ? 'border-accent shadow-lg shadow-accent/5' : 'border-surface-border hover:border-foreground/10 group-hover:bg-surface/80'
                }`}>
                  <div className="flex justify-between items-start md:items-center flex-col md:flex-row gap-2 mb-2">
                    <h3 className={`font-bold text-lg ${step.status === 'upcoming' ? 'text-foreground/50' : 'text-foreground'}`}>
                      {step.title}
                    </h3>
                    <div className={`text-xs font-bold px-3 py-1.5 rounded-lg flex items-center gap-1.5 whitespace-nowrap ${
                      step.status === 'completed' ? 'bg-emerald-500/10 text-emerald-500' :
                      step.status === 'current' ? 'bg-accent/10 text-accent' :
                      'bg-background border border-surface-border text-foreground/40'
                    }`}>
                      <Calendar className="w-3.5 h-3.5" />
                      {step.date}
                    </div>
                  </div>
                  <p className="text-sm text-foreground/60 leading-relaxed font-medium">
                    {step.description}
                  </p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>

      </div>
    </div>
  );
}
