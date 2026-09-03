"use client";
import { useEffect, useState, Suspense } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Calendar, 
  CheckCircle2, 
  Circle, 
  Clock, 
  ArrowRight, 
  Lock, 
  Sparkles, 
  FolderKanban, 
  Image as ImageIcon, 
  Check,
  LayoutGrid,
  ListTodo,
  ExternalLink,
  MessageSquareText,
  ShieldCheck,
  Zap,
  Activity,
  ChevronRight,
  ChevronDown,
  Layers,
  CheckCircle,
  AlertCircle
} from "lucide-react";
import { supabase } from "@/lib/supabase";
import { useRouter, useSearchParams } from "next/navigation";

type TabType = "overview" | "timeline" | "tasks";

type Task = {
  id: string;
  title: string;
  status: 'todo' | 'doing' | 'review' | 'done';
  created_at: string;
};

function IntegratedTimelineContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [projects, setProjects] = useState<any[]>([]);
  const [selectedProject, setSelectedProject] = useState<any | null>(null);
  const [steps, setSteps] = useState<any[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [activeTab, setActiveTab] = useState<TabType>("overview");
  const [loading, setLoading] = useState(true);
  const [requesting, setRequesting] = useState(false);
  const [requestedSuccess, setRequestedSuccess] = useState(false);

  const fetchProjectDetails = async (projectId: string) => {
    const { data: timelineData } = await supabase
      .from('timeline_steps')
      .select('*')
      .eq('project_id', projectId)
      .order('order_index', { ascending: true });

    setSteps(timelineData || []);

    const { data: tasksData } = await supabase
      .from('tasks')
      .select('*')
      .eq('project_id', projectId)
      .order('created_at', { ascending: false });

    setTasks((tasksData as Task[]) || []);
  };

  const fetchProjectsAndData = async () => {
    setLoading(true);
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      router.push("/login");
      return;
    }

    const { data: projs } = await supabase
      .from('projects')
      .select('*')
      .eq('client_id', session.user.id)
      .order('created_at', { ascending: false });

    if (projs && projs.length > 0) {
      setProjects(projs);
      
      const paramProjId = searchParams.get('project');
      const targetProj = (paramProjId && projs.find(p => p.id === paramProjId)) || projs[0];
      setSelectedProject(targetProj);
      await fetchProjectDetails(targetProj.id);
    } else {
      setProjects([]);
      setSelectedProject(null);
      setSteps([]);
      setTasks([]);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchProjectsAndData();
  }, [searchParams]);

  useEffect(() => {
    if (!selectedProject?.id) return;

    const timelineChannel = supabase.channel(`timeline-realtime-${selectedProject.id}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'timeline_steps', filter: `project_id=eq.${selectedProject.id}` }, () => {
        fetchProjectDetails(selectedProject.id);
      })
      .subscribe();

    const tasksChannel = supabase.channel(`tasks-realtime-${selectedProject.id}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'tasks', filter: `project_id=eq.${selectedProject.id}` }, () => {
        fetchProjectDetails(selectedProject.id);
      })
      .subscribe();

    return () => {
      supabase.removeChannel(timelineChannel);
      supabase.removeChannel(tasksChannel);
    };
  }, [selectedProject?.id]);

  const handleProjectChange = async (projId: string) => {
    const proj = projects.find(p => p.id === projId);
    if (!proj) return;
    setSelectedProject(proj);
    setRequestedSuccess(false);
    await fetchProjectDetails(proj.id);
  };

  const handleRequestTimeline = async () => {
    if (!selectedProject) return;
    setRequesting(true);
    
    const { error } = await supabase
      .from('projects')
      .update({ timeline_requested: true })
      .eq('id', selectedProject.id);

    if (!error) {
      setSelectedProject({ ...selectedProject, timeline_requested: true });
      setProjects(projects.map(p => p.id === selectedProject.id ? { ...p, timeline_requested: true } : p));
      setRequestedSuccess(true);
    }
    setRequesting(false);
  };

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center bg-background min-h-[70vh]">
        <div className="w-8 h-8 border-2 border-surface-border border-t-accent rounded-full animate-spin" />
      </div>
    );
  }

  // Estado quando o usuário não possui projetos
  if (projects.length === 0) {
    return (
      <div className="flex-1 overflow-y-auto bg-background p-6 md:p-12 w-full flex items-center justify-center min-h-[80vh] text-foreground">
        <motion.div 
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          className="max-w-md w-full bg-surface border border-surface-border p-8 rounded-3xl text-center flex flex-col items-center shadow-sm"
        >
          <div className="w-12 h-12 bg-accent/10 border border-accent/20 text-accent flex items-center justify-center rounded-2xl mb-5">
            <Lock className="w-6 h-6" />
          </div>
          <h2 className="text-xl font-bold text-foreground mb-2">Progresso Integrado Bloqueado</h2>
          <p className="text-xs md:text-sm text-foreground/60 leading-relaxed mb-6 font-medium">
            O acompanhamento detalhado de etapas e tarefas é liberado assim que você adquire um site ou template na Susanoo.
          </p>
          <button 
            onClick={() => router.push("/dashboard")}
            className="w-full py-3.5 bg-accent hover:bg-accent/90 text-white font-bold text-xs uppercase tracking-wider rounded-xl transition-all shadow-md shadow-accent/20 cursor-pointer flex items-center justify-center gap-2"
          >
            <Sparkles className="w-4 h-4" /> Explorar o Marketplace
          </button>
        </motion.div>
      </div>
    );
  }

  const completedSteps = steps.filter(s => s.status === 'completed').length;
  const currentStep = steps.find(s => s.status === 'current') || steps.find(s => s.status === 'upcoming');
  const manualPct = selectedProject?.manual_progress || 0;
  const computedPct = steps.length > 0 ? Math.round((completedSteps / steps.length) * 100) : manualPct;
  
  const getTasksByStatus = (status: Task['status']) => tasks.filter(t => t.status === status);
  const doneTasksCount = getTasksByStatus('done').length;

  return (
    <div className="flex-1 overflow-y-auto bg-background p-6 md:p-10 w-full custom-scrollbar text-foreground transition-colors duration-300">
      <div className="max-w-5xl mx-auto w-full space-y-8 pb-20">
        
        {/* Topo Limpo & Minimalista com Seletor de Projeto */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-surface-border">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="text-[11px] font-semibold text-accent uppercase tracking-wider flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-accent animate-pulse" />
                Painel em Tempo Real
              </span>
            </div>
            <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-foreground flex items-center gap-3">
              {selectedProject?.name}
            </h1>
            <p className="text-xs text-foreground/50">
              Acompanhamento oficial de etapas, cronograma e entregas de desenvolvimento.
            </p>
          </div>

          <div className="flex items-center gap-2 self-start sm:self-center shrink-0">
            {projects.length > 1 ? (
              <div className="relative">
                <select
                  value={selectedProject?.id || ""}
                  onChange={(e) => handleProjectChange(e.target.value)}
                  className="appearance-none bg-surface border border-surface-border pl-4 pr-10 py-2.5 rounded-xl text-xs font-semibold text-foreground hover:border-accent/40 focus:border-accent outline-none cursor-pointer transition-colors shadow-sm"
                >
                  {projects.map(p => (
                    <option key={p.id} value={p.id}>{p.name}</option>
                  ))}
                </select>
                <ChevronDown className="w-3.5 h-3.5 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-foreground/40" />
              </div>
            ) : (
              <div className="bg-surface border border-surface-border px-3.5 py-2 rounded-xl text-xs font-medium text-foreground/70 flex items-center gap-1.5 shadow-sm">
                <Layers className="w-3.5 h-3.5 text-accent" /> Projeto Único
              </div>
            )}

            {selectedProject?.deploy_url && (
              <button
                onClick={() => {
                  const url = selectedProject.deploy_url.startsWith('http') ? selectedProject.deploy_url : `https://${selectedProject.deploy_url}`;
                  window.open(url, '_blank');
                }}
                className="p-2.5 bg-surface border border-surface-border hover:border-accent/40 rounded-xl text-foreground/70 hover:text-foreground transition-colors cursor-pointer"
                title="Acessar site no ar"
              >
                <ExternalLink className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>

        {/* Segmented Control / Barra de Abas Estilizada */}
        <div className="flex items-center justify-between border-b border-surface-border pb-4">
          <div className="flex items-center bg-surface border border-surface-border p-1 rounded-xl gap-1">
            <button
              onClick={() => setActiveTab("overview")}
              className={`px-4 py-2 rounded-lg text-xs font-semibold transition-all flex items-center gap-2 cursor-pointer ${
                activeTab === "overview"
                  ? "bg-accent text-white shadow-sm"
                  : "text-foreground/60 hover:text-foreground hover:bg-surface-border/40"
              }`}
            >
              <LayoutGrid className="w-3.5 h-3.5" /> Visão Geral
            </button>

            <button
              onClick={() => setActiveTab("timeline")}
              className={`px-4 py-2 rounded-lg text-xs font-semibold transition-all flex items-center gap-2 cursor-pointer ${
                activeTab === "timeline"
                  ? "bg-accent text-white shadow-sm"
                  : "text-foreground/60 hover:text-foreground hover:bg-surface-border/40"
              }`}
            >
              <Calendar className="w-3.5 h-3.5" /> Cronograma
              <span className={`text-[10px] px-1.5 py-0.2 rounded-full ${activeTab === 'timeline' ? 'bg-white/20 text-white' : 'bg-surface-border text-foreground/60'}`}>
                {steps.length}
              </span>
            </button>

            <button
              onClick={() => setActiveTab("tasks")}
              className={`px-4 py-2 rounded-lg text-xs font-semibold transition-all flex items-center gap-2 cursor-pointer ${
                activeTab === "tasks"
                  ? "bg-accent text-white shadow-sm"
                  : "text-foreground/60 hover:text-foreground hover:bg-surface-border/40"
              }`}
            >
              <ListTodo className="w-3.5 h-3.5" /> Tarefas
              <span className={`text-[10px] px-1.5 py-0.2 rounded-full ${activeTab === 'tasks' ? 'bg-white/20 text-white' : 'bg-surface-border text-foreground/60'}`}>
                {tasks.length}
              </span>
            </button>
          </div>

          <div className="hidden sm:flex items-center gap-2">
            <button
              onClick={() => router.push('/dashboard/chat')}
              className="text-xs font-semibold text-foreground/60 hover:text-accent flex items-center gap-1.5 px-3 py-1.5 rounded-lg hover:bg-accent/5 transition-colors cursor-pointer"
            >
              <MessageSquareText className="w-3.5 h-3.5" /> Falar com o Dev
            </button>
          </div>
        </div>

        {/* CONTEÚDO 1: VISÃO GERAL */}
        {activeTab === "overview" && (
          <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
            
            {/* 3 Cards de Métricas Principais */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              
              {/* Card 1: Progresso Geral */}
              <div className="bg-surface border border-surface-border rounded-2xl p-5 shadow-sm flex flex-col justify-between">
                <div>
                  <div className="flex justify-between items-center mb-3">
                    <span className="text-[11px] font-semibold text-foreground/50 uppercase tracking-wider">Status Geral</span>
                    <span className="text-sm font-bold text-accent">{computedPct}%</span>
                  </div>
                  <div className="text-lg font-bold text-foreground mb-3">
                    {computedPct === 100 ? "Projeto Finalizado" : "Desenvolvimento Ativo"}
                  </div>
                  <div className="w-full bg-background border border-surface-border h-2 rounded-full overflow-hidden">
                    <motion.div 
                      initial={{ width: 0 }} 
                      animate={{ width: `${computedPct}%` }} 
                      transition={{ duration: 0.8 }} 
                      className="bg-accent h-full rounded-full" 
                    />
                  </div>
                </div>

                <div className="mt-5 pt-3 border-t border-surface-border/60 flex items-center justify-between text-xs text-foreground/50">
                  <span>{completedSteps} de {steps.length} etapas concluídas</span>
                  <span className="font-semibold text-accent">{steps.length > 0 ? "Com Cronograma" : "Aguardando"}</span>
                </div>
              </div>

              {/* Card 2: Próxima Entrega / Marco Atual */}
              <div className="bg-surface border border-surface-border rounded-2xl p-5 shadow-sm flex flex-col justify-between">
                <div>
                  <div className="flex justify-between items-center mb-3">
                    <span className="text-[11px] font-semibold text-foreground/50 uppercase tracking-wider">Próximo Marco</span>
                    <span className="text-[10px] font-semibold text-amber-500 bg-amber-500/10 px-2 py-0.5 rounded-md">
                      {currentStep?.status === 'current' ? 'Em Andamento' : 'Programado'}
                    </span>
                  </div>
                  <div className="text-base font-bold text-foreground mb-1 truncate">
                    {currentStep?.title || "Etapas em definição"}
                  </div>
                  <p className="text-xs text-foreground/55 line-clamp-2 leading-relaxed">
                    {currentStep?.description || "A equipe técnica está alinhando os detalhes e especificações da entrega."}
                  </p>
                </div>

                <div className="mt-5 pt-3 border-t border-surface-border/60 flex items-center justify-between text-xs">
                  <span className="text-foreground/40 flex items-center gap-1 font-medium">
                    <Clock className="w-3.5 h-3.5 text-accent" /> {currentStep?.date || "A definir"}
                  </span>
                  <button 
                    onClick={() => setActiveTab("timeline")}
                    className="font-semibold text-accent hover:underline flex items-center gap-1 cursor-pointer text-xs"
                  >
                    Ver detalhes <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {/* Card 3: Resumo de Tarefas */}
              <div className="bg-surface border border-surface-border rounded-2xl p-5 shadow-sm flex flex-col justify-between">
                <div>
                  <div className="flex justify-between items-center mb-3">
                    <span className="text-[11px] font-semibold text-foreground/50 uppercase tracking-wider">Quadro de Tarefas</span>
                    <span className="text-[10px] font-semibold text-emerald-500 bg-emerald-500/10 px-2 py-0.5 rounded-md">
                      {doneTasksCount} entregues
                    </span>
                  </div>
                  <div className="text-xl font-bold text-foreground mb-1">
                    {tasks.length} {tasks.length === 1 ? 'Tarefa' : 'Tarefas no Total'}
                  </div>
                  <p className="text-xs text-foreground/55">
                    {getTasksByStatus('doing').length} em execução agora, {getTasksByStatus('todo').length} na fila.
                  </p>
                </div>

                <div className="mt-5 pt-3 border-t border-surface-border/60 flex items-center justify-between text-xs">
                  <button 
                    onClick={() => setActiveTab("tasks")}
                    className="w-full py-2 bg-background border border-surface-border hover:border-accent/40 rounded-xl text-xs font-semibold text-foreground flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                  >
                    <ListTodo className="w-3.5 h-3.5 text-accent" /> Abrir Quadro Completo
                  </button>
                </div>
              </div>

            </div>

            {/* Suporte e Comunicação */}
            <div className="bg-surface border border-surface-border rounded-2xl p-5 md:p-6 flex flex-col sm:flex-row items-center justify-between gap-4 shadow-sm">
              <div className="flex items-center gap-3.5">
                <div className="w-10 h-10 rounded-xl bg-accent/10 text-accent flex items-center justify-center shrink-0">
                  <ShieldCheck className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-foreground">Suporte Dedicado de Desenvolvimento</h4>
                  <p className="text-xs text-foreground/50 mt-0.5">Dúvidas sobre o cronograma ou solicitações de alterações podem ser enviadas diretamente pelo chat.</p>
                </div>
              </div>

              <button 
                onClick={() => router.push('/dashboard/chat')}
                className="w-full sm:w-auto px-5 py-2.5 bg-accent hover:bg-accent/90 text-white font-semibold text-xs rounded-xl transition-all shadow-md shadow-accent/20 flex items-center justify-center gap-2 cursor-pointer shrink-0"
              >
                <MessageSquareText className="w-4 h-4" /> Acessar Chat
              </button>
            </div>

          </motion.div>
        )}

        {/* CONTEÚDO 2: CRONOGRAMA / TIMELINE */}
        {activeTab === "timeline" && (
          <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
            {steps.length === 0 ? (
              <div className="bg-surface border border-surface-border rounded-2xl p-8 md:p-12 text-center max-w-lg mx-auto shadow-sm flex flex-col items-center">
                <div className="w-12 h-12 bg-accent/10 border border-accent/20 text-accent flex items-center justify-center rounded-2xl mb-4">
                  <FolderKanban className="w-6 h-6" />
                </div>
                
                {selectedProject?.timeline_requested ? (
                  <>
                    <h3 className="text-lg font-bold text-foreground mb-2">Cronograma em Elaboração</h3>
                    <p className="text-xs md:text-sm text-foreground/50 leading-relaxed font-medium mb-4">
                      O desenvolvedor responsável já foi notificado e está organizando os marcos de entrega para este site.
                    </p>
                    <span className="text-xs font-semibold text-emerald-500 bg-emerald-500/10 px-3 py-1.5 rounded-full border border-emerald-500/20 flex items-center gap-1.5">
                      <Check className="w-3.5 h-3.5" /> Solicitação confirmada
                    </span>
                  </>
                ) : (
                  <>
                    <h3 className="text-lg font-bold text-foreground mb-2">Nenhum Cronograma Estruturado</h3>
                    <p className="text-xs md:text-sm text-foreground/50 leading-relaxed font-medium mb-6">
                      Este projeto ainda não possui etapas detalhadas cadastradas. Você pode solicitar o plano de entrega ao desenvolvedor.
                    </p>
                    <button
                      onClick={handleRequestTimeline}
                      disabled={requesting}
                      className="px-6 py-3 bg-accent hover:bg-accent/90 text-white font-bold text-xs uppercase tracking-wider rounded-xl transition-all shadow-md shadow-accent/20 flex items-center gap-2 cursor-pointer disabled:opacity-50"
                    >
                      {requesting ? "Solicitando..." : "Solicitar Cronograma de Entrega"} <ArrowRight className="w-4 h-4" />
                    </button>
                  </>
                )}
              </div>
            ) : (
              <div className="relative pl-2 md:pl-4">
                {/* Linha vertical discreta */}
                <div className="absolute left-[23px] md:left-[31px] top-6 bottom-6 w-[2px] bg-surface-border" />

                <div className="flex flex-col gap-6">
                  {steps.map((step, index) => {
                    const isCompleted = step.status === 'completed';
                    const isCurrent = step.status === 'current';
                    
                    return (
                      <div key={step.id} className="flex items-start gap-4 md:gap-5 relative group">
                        
                        {/* Marcador da Timeline */}
                        <div className={`z-10 w-9 h-9 rounded-xl flex items-center justify-center shrink-0 border transition-all ${
                          isCompleted ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-500' :
                          isCurrent ? 'bg-accent/10 border-accent/40 text-accent shadow-sm' :
                          'bg-background border-surface-border text-foreground/30'
                        }`}>
                          {isCompleted ? (
                            <CheckCircle2 className="w-4 h-4" />
                          ) : isCurrent ? (
                            <div className="relative flex items-center justify-center">
                              <span className="animate-ping absolute inline-flex h-3 w-3 rounded-full bg-accent opacity-70"></span>
                              <Clock className="w-4 h-4 relative" />
                            </div>
                          ) : (
                            <Circle className="w-3.5 h-3.5" />
                          )}
                        </div>

                        {/* Card da Etapa */}
                        <div className={`flex-1 bg-surface py-5 px-5 md:px-6 rounded-2xl border transition-all duration-200 ${
                          isCurrent ? 'border-accent/40 shadow-sm' : 'border-surface-border hover:border-surface-border/80'
                        }`}>
                          <div className="flex justify-between items-start md:items-center flex-col md:flex-row gap-2 mb-2">
                            <h3 className={`font-bold text-base ${step.status === 'upcoming' ? 'text-foreground/60' : 'text-foreground'}`}>
                              {step.title}
                            </h3>
                            
                            <div className="flex items-center gap-2">
                              {isCompleted && (
                                <span className="text-[11px] font-semibold px-2 py-0.5 rounded-md bg-emerald-500/10 text-emerald-500">
                                  Concluído
                                </span>
                              )}
                              {isCurrent && (
                                <span className="text-[11px] font-semibold px-2 py-0.5 rounded-md bg-accent/10 text-accent">
                                  Em Execução
                                </span>
                              )}
                              <span className="text-xs text-foreground/45 flex items-center gap-1 font-medium">
                                <Calendar className="w-3.5 h-3.5" /> {step.date || "Em breve"}
                              </span>
                            </div>
                          </div>

                          <p className="text-xs md:text-sm text-foreground/60 leading-relaxed font-medium">
                            {step.description}
                          </p>

                          {step.photo_url && (
                            <div className="mt-4 rounded-xl overflow-hidden border border-surface-border bg-background max-w-md aspect-video relative group/photo">
                              <img 
                                src={step.photo_url} 
                                alt={`Prévia de ${step.title}`}
                                className="w-full h-full object-cover group-hover/photo:scale-102 transition-transform duration-300"
                              />
                              <div className="absolute bottom-2 right-2 bg-black/60 backdrop-blur-sm text-[10px] text-white font-medium px-2 py-0.5 rounded flex items-center gap-1">
                                <ImageIcon className="w-3 h-3" /> Prévia do Marco
                              </div>
                            </div>
                          )}
                        </div>

                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </motion.div>
        )}

        {/* CONTEÚDO 3: QUADRO DE TAREFAS */}
        {activeTab === "tasks" && (
          <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              
              {/* Coluna 1: Pendentes */}
              <div className="bg-surface border border-surface-border rounded-2xl p-5 shadow-sm flex flex-col min-h-[380px]">
                <div className="flex items-center justify-between pb-3 mb-3 border-b border-surface-border">
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-foreground/40" />
                    <h3 className="text-xs font-bold text-foreground/70 uppercase tracking-wider">A Fazer</h3>
                  </div>
                  <span className="text-[11px] font-bold bg-background border border-surface-border px-2 py-0.5 rounded-md text-foreground/60">
                    {getTasksByStatus('todo').length}
                  </span>
                </div>

                <div className="flex flex-col gap-2.5 flex-1">
                  {getTasksByStatus('todo').map(task => (
                    <div key={task.id} className="p-3.5 bg-background border border-surface-border rounded-xl hover:border-foreground/20 transition-all shadow-xs">
                      <p className="text-xs font-semibold text-foreground leading-snug">{task.title}</p>
                      <span className="text-[10px] text-foreground/35 font-mono mt-1.5 block">#{task.id.substring(0, 6)}</span>
                    </div>
                  ))}
                  {getTasksByStatus('todo').length === 0 && (
                    <div className="flex-1 flex flex-col items-center justify-center text-center p-4 border border-dashed border-surface-border rounded-xl text-foreground/30 text-xs font-medium">
                      Nenhuma pendência na fila
                    </div>
                  )}
                </div>
              </div>

              {/* Coluna 2: Em Execução */}
              <div className="bg-surface border border-accent/30 rounded-2xl p-5 shadow-sm flex flex-col min-h-[380px]">
                <div className="flex items-center justify-between pb-3 mb-3 border-b border-surface-border">
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-accent animate-pulse" />
                    <h3 className="text-xs font-bold text-accent uppercase tracking-wider">Em Produção</h3>
                  </div>
                  <span className="text-[11px] font-bold bg-accent/10 border border-accent/20 px-2 py-0.5 rounded-md text-accent">
                    {getTasksByStatus('doing').length}
                  </span>
                </div>

                <div className="flex flex-col gap-2.5 flex-1">
                  {getTasksByStatus('doing').map(task => (
                    <div key={task.id} className="p-3.5 bg-background border-l-2 border-l-accent border-surface-border rounded-xl shadow-xs">
                      <p className="text-xs font-bold text-foreground leading-snug">{task.title}</p>
                      <div className="mt-2 flex items-center justify-between">
                        <span className="text-[9px] font-bold uppercase text-accent bg-accent/10 px-1.5 py-0.5 rounded">Em andamento</span>
                        <span className="text-[10px] text-foreground/35 font-mono">#{task.id.substring(0, 6)}</span>
                      </div>
                    </div>
                  ))}
                  {getTasksByStatus('doing').length === 0 && (
                    <div className="flex-1 flex flex-col items-center justify-center text-center p-4 border border-dashed border-surface-border rounded-xl text-foreground/30 text-xs font-medium">
                      Nenhuma tarefa em execução no momento
                    </div>
                  )}
                </div>
              </div>

              {/* Coluna 3: Concluídas */}
              <div className="bg-surface border border-surface-border rounded-2xl p-5 shadow-sm flex flex-col min-h-[380px]">
                <div className="flex items-center justify-between pb-3 mb-3 border-b border-surface-border">
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-emerald-500" />
                    <h3 className="text-xs font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider">Entregues</h3>
                  </div>
                  <span className="text-[11px] font-bold bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded-md text-emerald-600 dark:text-emerald-400">
                    {getTasksByStatus('done').length}
                  </span>
                </div>

                <div className="flex flex-col gap-2.5 flex-1">
                  {getTasksByStatus('done').map(task => (
                    <div key={task.id} className="p-3.5 bg-background border border-surface-border rounded-xl opacity-80 hover:opacity-100 transition-opacity">
                      <p className="text-xs font-semibold text-foreground leading-snug line-through decoration-foreground/30">{task.title}</p>
                      <div className="mt-2 flex items-center justify-between text-[10px] text-emerald-500 font-medium">
                        <span className="flex items-center gap-1"><CheckCircle2 className="w-3 h-3" /> Finalizada</span>
                        <span className="text-foreground/30 font-mono">#{task.id.substring(0, 6)}</span>
                      </div>
                    </div>
                  ))}
                  {getTasksByStatus('done').length === 0 && (
                    <div className="flex-1 flex flex-col items-center justify-center text-center p-4 border border-dashed border-surface-border rounded-xl text-foreground/30 text-xs font-medium">
                      Nenhuma tarefa finalizada ainda
                    </div>
                  )}
                </div>
              </div>

            </div>
          </motion.div>
        )}

      </div>
    </div>
  );
}

export default function IntegratedTimelinePage() {
  return (
    <Suspense fallback={
      <div className="flex-1 flex items-center justify-center bg-background min-h-[70vh]">
        <div className="w-8 h-8 border-2 border-surface-border border-t-accent rounded-full animate-spin" />
      </div>
    }>
      <IntegratedTimelineContent />
    </Suspense>
  );
}
