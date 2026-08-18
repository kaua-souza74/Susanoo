"use client";
import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Calendar, CheckCircle2, Circle, Clock, ArrowRight, Lock, Sparkles, FolderKanban, Image as ImageIcon, Check } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { useRouter } from "next/navigation";

export default function TimelinePage() {
  const router = useRouter();
  const [projects, setProjects] = useState<any[]>([]);
  const [selectedProject, setSelectedProject] = useState<any | null>(null);
  const [steps, setSteps] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [requesting, setRequesting] = useState(false);
  const [requestedSuccess, setRequestedSuccess] = useState(false);

  const fetchProjectsAndTimeline = async () => {
    setLoading(true);
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      router.push("/login");
      return;
    }

    // Busca todos os projetos do cliente
    const { data: projs, error: projError } = await supabase
      .from('projects')
      .select('*')
      .eq('client_id', session.user.id);

    if (projs && projs.length > 0) {
      setProjects(projs);
      // Se não houver projeto selecionado previamente, escolhe o primeiro
      const currentProj = selectedProject 
        ? (projs.find(p => p.id === selectedProject.id) || projs[0])
        : projs[0];
      setSelectedProject(currentProj);
      
      // Busca as etapas do projeto atual
      const { data: timelineData } = await supabase
        .from('timeline_steps')
        .select('*')
        .eq('project_id', currentProj.id)
        .order('order_index', { ascending: true });

      setSteps(timelineData || []);
    } else {
      setProjects([]);
      setSelectedProject(null);
      setSteps([]);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchProjectsAndTimeline();
  }, []);

  // Recarrega o cronograma quando o projeto selecionado muda
  const handleProjectChange = async (projId: string) => {
    setLoading(true);
    const proj = projects.find(p => p.id === projId);
    if (!proj) return;
    setSelectedProject(proj);
    setRequestedSuccess(false);

    const { data: timelineData } = await supabase
      .from('timeline_steps')
      .select('*')
      .eq('project_id', proj.id)
      .order('order_index', { ascending: true });

    setSteps(timelineData || []);
    setLoading(false);
  };

  // Solicita o cronograma para o projeto atual
  const handleRequestTimeline = async () => {
    if (!selectedProject) return;
    setRequesting(true);
    
    const { error } = await supabase
      .from('projects')
      .update({ timeline_requested: true })
      .eq('id', selectedProject.id);

    if (!error) {
      setSelectedProject({ ...selectedProject, timeline_requested: true });
      // Atualiza na lista de projetos
      setProjects(projects.map(p => p.id === selectedProject.id ? { ...p, timeline_requested: true } : p));
      setRequestedSuccess(true);
    }
    setRequesting(false);
  };

  if (loading) return (
    <div className="flex-1 flex items-center justify-center bg-background">
        <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1, ease: "linear" }} className="w-10 h-10 border-[3px] border-surface-border border-t-accent rounded-full" />
    </div>
  );

  // 1. Caso não tenha projetos comprados/ativos -> Tela bloqueada/liberada após pagamento
  if (projects.length === 0) {
    return (
      <div className="flex-1 overflow-y-auto bg-background p-6 md:p-10 w-full flex items-center justify-center min-h-[80vh]">
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="max-w-md w-full bg-surface border border-surface-border p-8 rounded-[2.5rem] shadow-xl text-center flex flex-col items-center"
        >
          <div className="w-16 h-16 bg-red-500/10 border border-red-500/20 text-red-500 flex items-center justify-center rounded-2xl mb-6">
            <Lock className="w-8 h-8" />
          </div>
          <h2 className="text-2xl font-black text-foreground mb-3 uppercase italic">Cronograma Bloqueado</h2>
          <p className="text-sm text-foreground/50 leading-relaxed mb-8 font-medium">
            O cronograma de entrega é liberado exclusivamente após a confirmação de pagamento do seu projeto ou template. Adquira um site ou conclua o pagamento pendente para liberar o recurso.
          </p>
          <button 
            onClick={() => router.push("/dashboard")}
            className="w-full py-4 bg-accent hover:bg-accent/90 text-white font-black text-sm uppercase tracking-wider rounded-xl transition-all shadow-lg shadow-accent/20 cursor-pointer"
          >
            Ir para o Marketplace
          </button>
        </motion.div>
      </div>
    );
  }

  // 2. Cliente possui projetos ativos
  return (
    <div className="flex-1 overflow-y-auto bg-background p-6 md:p-10 w-full custom-scrollbar">
      <div className="max-w-5xl mx-auto w-full">
        
        {/* Topo com título e seletor */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-12">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 flex items-center justify-center bg-accent/10 border border-accent/20 rounded-xl">
              <Calendar className="w-6 h-6 text-accent" />
            </div>
            <div>
              <h1 className="text-2xl font-black text-foreground tracking-tight">Cronograma de Entrega</h1>
              <p className="text-sm text-foreground/50 mt-0.5">Veja as etapas de desenvolvimento do seu site.</p>
            </div>
          </div>

          <div className="flex flex-col gap-1.5 shrink-0">
            <label className="text-[10px] font-black uppercase tracking-wider text-foreground/40">Selecione o Projeto</label>
            <select
              value={selectedProject?.id || ""}
              onChange={(e) => handleProjectChange(e.target.value)}
              className="bg-surface border border-surface-border p-3 px-5 rounded-2xl text-foreground font-black text-sm shadow-sm outline-none focus:border-accent cursor-pointer transition-colors"
            >
              {projects.map(p => (
                <option key={p.id} value={p.id}>{p.name}</option>
              ))}
            </select>
          </div>
        </div>

        {/* 3. Projeto selecionado não tem passos cadastrados ainda */}
        {steps.length === 0 ? (
          <div className="bg-surface border border-surface-border rounded-[2.5rem] p-10 md:p-16 text-center max-w-2xl mx-auto shadow-sm flex flex-col items-center">
            <div className="w-16 h-16 bg-accent/10 border border-accent/20 text-accent flex items-center justify-center rounded-2xl mb-6">
              <FolderKanban className="w-8 h-8" />
            </div>
            
            {selectedProject?.timeline_requested ? (
              <>
                <h3 className="text-xl font-black text-foreground mb-3 uppercase italic">Cronograma Solicitado!</h3>
                <p className="text-sm text-foreground/50 leading-relaxed font-medium mb-2">
                  Nossa equipe de desenvolvimento já foi notificada e está montando o plano de entrega personalizado para o seu projeto: <strong>{selectedProject.name}</strong>.
                </p>
                <span className="text-xs font-black uppercase tracking-wider text-emerald-500 bg-emerald-500/10 px-3.5 py-2 rounded-full border border-emerald-500/20 mt-4 flex items-center gap-1.5">
                  <Check className="w-3.5 h-3.5" /> Aguarde a Elaboração
                </span>
              </>
            ) : (
              <>
                <h3 className="text-xl font-black text-foreground mb-3 uppercase italic">Nenhum Cronograma Criado</h3>
                <p className="text-sm text-foreground/50 leading-relaxed font-medium mb-8">
                  Você possui este projeto ativo, mas o cronograma detalhado de etapas ainda não foi estruturado pelo desenvolvedor. Solicite agora mesmo para iniciarmos.
                </p>
                <button
                  onClick={handleRequestTimeline}
                  disabled={requesting}
                  className="px-8 py-4 bg-accent hover:bg-accent/90 text-white font-black text-sm uppercase tracking-wider rounded-xl transition-all shadow-lg shadow-accent/20 flex items-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  {requesting ? "Solicitando..." : "Pedir Cronograma do Meu Projeto"} <ArrowRight className="w-4 h-4" />
                </button>
              </>
            )}
          </div>
        ) : (
          // 4. Exibir cronograma detalhado com fotos
          <div className="relative">
            {/* Linha vertical */}
            <div className="absolute left-[27px] top-4 bottom-4 w-px bg-surface-border hidden md:block" />

            <div className="flex flex-col gap-8">
              {steps.map((step, index) => (
                <motion.div
                  key={step.id}
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.08 }}
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

                  {/* Card de Informação com suporte a imagens/fotos */}
                  <div className={`flex-1 bg-surface py-6 px-6 md:px-8 rounded-[2rem] border transition-all duration-300 ${
                    step.status === 'current' ? 'border-accent shadow-lg shadow-accent/5' : 'border-surface-border hover:border-foreground/10 group-hover:bg-surface/80'
                  }`}>
                    <div className="flex justify-between items-start md:items-center flex-col md:flex-row gap-2 mb-3">
                      <h3 className={`font-black text-lg ${step.status === 'upcoming' ? 'text-foreground/50' : 'text-foreground'}`}>
                        {step.title}
                      </h3>
                      <div className={`text-xs font-black px-3.5 py-1.5 rounded-lg flex items-center gap-1.5 whitespace-nowrap ${
                        step.status === 'completed' ? 'bg-emerald-500/10 text-emerald-500' :
                        step.status === 'current' ? 'bg-accent/10 text-accent' :
                        'bg-background border border-surface-border text-foreground/40'
                      }`}>
                        <Calendar className="w-3.5 h-3.5" />
                        {step.date}
                      </div>
                    </div>
                    
                    <p className="text-sm text-foreground/60 leading-relaxed font-bold mb-4">
                      {step.description}
                    </p>

                    {/* Foto da etapa (se configurada pelo administrador) */}
                    {step.photo_url && (
                      <div className="mt-4 rounded-2xl overflow-hidden border border-surface-border bg-background shadow-inner max-w-xl group/photo relative aspect-video">
                        <img 
                          src={step.photo_url} 
                          alt={`Progresso da etapa: ${step.title}`}
                          className="w-full h-full object-cover transition-transform duration-500 group-hover/photo:scale-102"
                        />
                        <div className="absolute bottom-3 right-3 bg-black/60 backdrop-blur-md text-[10px] text-white font-bold px-2.5 py-1 rounded-lg flex items-center gap-1">
                          <ImageIcon className="w-3 h-3" /> Progresso Visual
                        </div>
                      </div>
                    )}
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
