"use client";
import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Calendar, CheckCircle2, Circle, Clock } from "lucide-react";
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
    <div className="flex-1 flex flex-col items-center justify-center bg-background">
        <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1, ease: "linear" }} className="w-12 h-12 border-[3px] border-surface-border border-t-accent rounded-full mb-4" />
    </div>
  );

  return (
    <div className="flex-1 overflow-y-auto bg-background p-6 md:p-12 transition-colors">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-4xl mx-auto"
      >
        <div className="flex items-center gap-4 mb-12">
          <div className="p-3 bg-accent/10 rounded-2xl text-accent">
            <Calendar className="w-8 h-8" />
          </div>
          <div>
            <h1 className="text-3xl md:text-4xl font-black text-foreground tracking-tight">Cronograma do Projeto</h1>
            <p className="text-foreground/50 font-medium font-sans">Acompanhe cada etapa da evolução digital da sua marca.</p>
          </div>
        </div>

        <div className="relative">
          <div className="absolute left-6 top-0 bottom-0 w-px bg-surface-border hidden md:block" />

          <div className="flex flex-col gap-12">
            {steps.map((step, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.1 }}
                className="flex items-start gap-6 relative"
              >
                <div className={`z-10 w-12 h-12 rounded-full flex items-center justify-center shrink-0 shadow-lg ${
                  step.status === 'completed' ? 'bg-emerald-500 text-white shadow-emerald-500/20' :
                  step.status === 'current' ? 'bg-accent text-white shadow-accent/20 animate-pulse' :
                  'bg-surface border border-surface-border text-foreground/30'
                }`}>
                  {step.status === 'completed' ? <CheckCircle2 className="w-6 h-6" /> :
                   step.status === 'current' ? <Clock className="w-6 h-6" /> :
                   <Circle className="w-6 h-6" />}
                </div>

                <div className={`flex-1 bg-surface p-6 rounded-3xl border border-surface-border shadow-2xl shadow-black/5 dark:shadow-black/20 ${
                  step.status === 'current' ? 'ring-2 ring-accent/20 border-accent/20' : ''
                }`}>
                  <div className="flex justify-between items-start mb-2">
                    <h3 className={`text-xl font-bold ${step.status === 'upcoming' ? 'text-foreground/40' : 'text-foreground'}`}>
                      {step.title}
                    </h3>
                    <span className={`text-sm font-bold px-3 py-1 rounded-full ${
                      step.status === 'completed' ? 'bg-emerald-500/10 text-emerald-500' :
                      step.status === 'current' ? 'bg-accent/10 text-accent' :
                      'bg-surface-border/50 text-foreground/40'
                    }`}>
                      {step.date}
                    </span>
                  </div>
                  <p className="text-foreground/60 leading-relaxed font-medium">
                    {step.description}
                  </p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </motion.div>
    </div>
  );
}
