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
  Layers,
  ChevronRight
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
    // Busca etapas do cronograma
    const { data: timelineData } = await supabase
      .from('timeline_steps')
      .select('*')
      .eq('project_id', projectId)
      .order('order_index', { ascending: true });

    setSteps(timelineData || []);

    // Busca tarefas do kanban/progresso
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
      <div className="flex-1 flex items-center justify-center bg-background">
        <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1, ease: "linear" }} className="w-10 h-10 border-[3px] border-surface-border border-t-accent rounded-full" />
      </div>
    );
  }

  // 1. Caso o usuário não possua projetos/compras ativas
  if (projects.length === 0) {
    return (
      <div className="flex-1 overflow-y-auto bg-background p-6 md:p-10 w-full flex items-center justify-center min-h-[80vh] text-foreground">
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="max-w-md w-full bg-surface border border-surface-border p-8 rounded-[2.5rem] shadow-xl text-center flex flex-col items-center"
        >
          <div className="w-16 h-16 bg-accent/10 border border-accent/20 text-accent flex items-center justify-center rounded-2xl mb-6">
            <Lock className="w-8 h-8" />
          </div>
          <h2 className="text-2xl font-black text-foreground mb-3 uppercase italic">Progresso & Cronograma Bloqueado</h2>
          <p className="text-sm text-foreground/50 leading-relaxed mb-8 font-medium">
            O acompanhamento detalhado de progresso e marcos é liberado automaticamente após a aquisição de um site ou template na plataforma.
          </p>
          <button 
            onClick={() => router.push("/dashboard")}
            className="w-full py-4 bg-accent hover:bg-accent/90 text-white font-black text-sm uppercase tracking-wider rounded-xl transition-all shadow-lg shadow-accent/20 cursor-pointer flex items-center justify-center gap-2"
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
      <div className="max-w-6xl mx-auto w-full space-y-8 pb-20">
        
        {/* Topo com Identificação e Seletor de Compra */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 pb-6 border-b border-surface-border">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="text-[10px] font-black uppercase tracking-[0.25em] text-accent bg-accent/10 border border-accent/20 px-3 py-1 rounded-full flex items-center gap-1.5">
                <Activity className="w-3.5 h-3.5" /> Central de Progresso Integrado
              </span>
            </div>
            <h1 className="text-3xl md:text-4xl font-black text-foreground tracking-tight flex items-center gap-3">
              {selectedProject?.name}
            </h1>
            <p className="text-sm text-foreground/50 mt-0.5">
              Linha do tempo oficial e quadro de produção sincronizados em tempo real.
            </p>
          </div>

          <div className="flex flex-col gap-1.5 shrink-0 min-w-[260px]">
            <label className="text-[10px] font-black uppercase tracking-wider text-foreground/40">Selecionar Site Comprado</label>
            <select
              value={selectedProject?.id || ""}
              onChange={(e) => handleProjectChange(e.target.value)}
              className="bg-surface border border-surface-border p-3.5 px-4 rounded-2xl text-foreground font-black text-sm shadow-sm outline-none focus:border-accent cursor-pointer transition-colors"
            >
              {projects.map(p => (
                <option key={p.id} value={p.id}>{p.name}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Abas de Navegação Integradas */}
        <div className="flex items-center gap-2 border-b border-surface-border pb-1">
          <button
            onClick={() => setActiveTab("overview")}
            className={`px-5 py-3 rounded-2xl text-xs md:text-sm font-black uppercase tracking-wider transition-all flex items-center gap-2 cursor-pointer ${
              activeTab === "overview"
                ? "bg-accent text-white shadow-lg shadow-accent/20"
                : "bg-surface text-foreground/60 hover:text-foreground border border-surface-border"
            }`}
          >
            <LayoutGrid className="w-4 h-4" /> Visão Geral
          </button>

          <button
            onClick={() => setActiveTab("timeline")}
            className={`px-5 py-3 rounded-2xl text-xs md:text-sm font-black uppercase tracking-wider transition-all flex items-center gap-2 cursor-pointer ${
              activeTab === "timeline"
                ? "bg-accent text-white shadow-lg shadow-accent/20"
                : "bg-surface text-foreground/60 hover:text-foreground border border-surface-border"
            }`}
          >
            <Calendar className="w-4 h-4" /> Cronograma ({steps.length})
          </button>

          <button
            onClick={() => setActiveTab("tasks")}
            className={`px-5 py-3 rounded-2xl text-xs md:text-sm font-black uppercase tracking-wider transition-all flex items-center gap-2 cursor-pointer ${
              activeTab === "tasks"
                ? "bg-accent text-white shadow-lg shadow-accent/20"
                : "bg-surface text-foreground/60 hover:text-foreground border border-surface-border"
            }`}
          >
            <ListTodo className="w-4 h-4" /> Quadro de Tarefas ({tasks.length})
          </button>
        </div>

        {/* CONTEÚDO DA ABA 1: VISÃO GERAL INTEGRADA */}
        {activeTab === "overview" && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
            
            {/* Banner de Status e Métricas Gerais */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              
              {/* Card de Progresso Geral */}
              <div className="bg-surface border border-surface-border rounded-3xl p-6 shadow-sm flex flex-col justify-between">
                <div>
                  <div className="flex justify-between items-center mb-3">
                    <span className="text-[10px] font-black uppercase tracking-widest text-foreground/40">Progresso Geral</span>
                    <span className="text-xs font-black text-accent">{computedPct}%</span>
                  </div>
                  <h3 className="text-2xl font-black text-foreground mb-4">
                    {computedPct === 100 ? "Projeto Entregue!" : "Desenvolvimento Ativo"}
                  </h3>
                  <div className="w-full bg-background border border-surface-border h-3 rounded-full overflow-hidden">
                    <motion.div 
                      initial={{ width: 0 }} 
                      animate={{ width: `${computedPct}%` }} 
                      transition={{ duration: 1 }} 
                      className="bg-accent h-full rounded-full" 
                    />
                  </div>
                </div>

                <div className="mt-6 pt-4 border-t border-surface-border flex items-center justify-between text-xs text-foreground/50">
                  <span>{completedSteps} de {steps.length} etapas concluídas</span>
                  <span className="font-bold text-accent">{steps.length > 0 ? "Com Cronograma" : "Em Estruturação"}</span>
                </div>
              </div>

              {/* Card Próximo Marco */}
              <div className="bg-surface border border-surface-border rounded-3xl p-6 shadow-sm flex flex-col justify-between">
                <div>
                  <span className="text-[10px] font-black uppercase tracking-widest text-accent mb-2 block">
                    {currentStep?.status === 'current' ? '⚡ Marco em Andamento' : '📅 Próxima Entrega'}
                  </span>
                  <h4 className="text-xl font-bold text-foreground mb-2 truncate">
                    {currentStep?.title || "Aguardando definição de etapas"}
                  </h4>
                  <p className="text-xs text-foreground/55 line-clamp-2 leading-relaxed">
                    {currentStep?.description || "Nossa equipe está estruturando o cronograma deste projeto."}
                  </p>
                </div>

                <div className="mt-6 pt-4 border-t border-surface-border flex items-center justify-between">
                  <span className="text-xs font-bold text-foreground/40 flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5 text-accent" /> {currentStep?.date || "Em breve"}
                  </span>
                  <button 
                    onClick={() => setActiveTab("timeline")}
                    className="text-xs font-black uppercase tracking-wider text-accent hover:underline flex items-center gap-1 cursor-pointer"
                  >
                    Ver Timeline <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {/* Card Tarefas de Produção */}
              <div className="bg-surface border border-surface-border rounded-3xl p-6 shadow-sm flex flex-col justify-between">
                <div>
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-[10px] font-black uppercase tracking-widest text-foreground/40">Quadro de Produção</span>
                    <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded bg-accent/10 text-accent">Realtime</span>
                  </div>
                  <h3 className="text-3xl font-black text-foreground mb-1">{tasks.length} Tarefas</h3>
                  <p className="text-xs text-foreground/50">
                    {getTasksByStatus('doing').length} em produção, {getTasksByStatus('todo').length} pendentes e {doneTasksCount} entregues.
                  </p>
                </div>

                <div className="mt-6 pt-4 border-t border-surface-border flex items-center justify-between">
                  <button 
                    onClick={() => setActiveTab("tasks")} 
                    className="w-full py-2.5 bg-background border border-surface-border hover:border-accent/40 rounded-xl text-xs font-bold text-foreground flex items-center justify-center gap-2 cursor-pointer transition-all"
                  >
                    <ListTodo className="w-3.5 h-3.5 text-accent" /> Abrir Quadro Completo
                  </button>
                </div>
              </div>

            </div>

            {/* Ações Rápidas do Projeto */}
            <div className="bg-surface border border-surface-border rounded-3xl p-6 flex flex-col md:flex-row items-center justify-between gap-6 shadow-sm">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 bg-accent/10 border border-accent/20 rounded-2xl flex items-center justify-center text-accent shrink-0">
                  <ShieldCheck className="w-7 h-7" />
                </div>
                <div>
                  <h4 className="text-base font-black text-foreground">Suporte Dedicado e Homologação</h4>
                  <p className="text-xs text-foreground/50">Tire dúvidas sobre o andamento e solicite ajustes diretamente com quem está desenvolvendo seu site.</p>
                </div>
              </div>

              <div className="flex items-center gap-3 w-full md:w-auto">
                <button 
                  onClick={() => router.push('/dashboard/chat')}
                  className="flex-1 md:flex-initial px-6 py-3.5 bg-accent hover:bg-accent/90 text-white font-black text-xs uppercase tracking-wider rounded-xl transition-all flex items-center justify-center gap-2 shadow-lg shadow-accent/20 cursor-pointer"
                >
                  <MessageSquareText className="w-4 h-4" /> Chat com a Equipe
                </button>

                {selectedProject?.deploy_url && (
                  <button 
                    onClick={() => {
                      const url = selectedProject.deploy_url.startsWith('http') ? selectedProject.deploy_url : `https://${selectedProject.deploy_url}`;
                      window.open(url, '_blank');
                    }}
                    className="px-6 py-3.5 bg-foreground text-background font-black text-xs uppercase tracking-wider rounded-xl transition-all flex items-center justify-center gap-2 cursor-pointer hover:opacity-90"
                  >
                    <ExternalLink className="w-4 h-4" /> Acessar Link do Site
                  </button>
                )}
              </div>
            </div>

          </motion.div>
        )}

        {/* CONTEÚDO DA ABA 2: CRONOGRAMA (LINHA DO TEMPO) */}
        {activeTab === "timeline" && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
            {steps.length === 0 ? (
              <div className="bg-surface border border-surface-border rounded-[2.5rem] p-10 md:p-16 text-center max-w-2xl mx-auto shadow-sm flex flex-col items-center">
                <div className="w-16 h-16 bg-accent/10 border border-accent/20 text-accent flex items-center justify-center rounded-2xl mb-6">
                  <FolderKanban className="w-8 h-8" />
                </div>
                
                {selectedProject?.timeline_requested ? (
                  <>
                    <h3 className="text-xl font-black text-foreground mb-3 uppercase italic">Cronograma Solicitado!</h3>
                    <p className="text-sm text-foreground/50 leading-relaxed font-medium mb-2">
                      Nossa equipe de desenvolvimento já foi notificada e está montando o plano de entrega personalizado para o seu site: <strong>{selectedProject.name}</strong>.
                    </p>
                    <span className="text-xs font-black uppercase tracking-wider text-emerald-500 bg-emerald-500/10 px-3.5 py-2 rounded-full border border-emerald-500/20 mt-4 flex items-center gap-1.5">
                      <Check className="w-3.5 h-3.5" /> Aguarde a Elaboração
                    </span>
                  </>
                ) : (
                  <>
                    <h3 className="text-xl font-black text-foreground mb-3 uppercase italic">Nenhum Cronograma Estruturado</h3>
                    <p className="text-sm text-foreground/50 leading-relaxed font-medium mb-8">
                      Você possui este site ativo, mas as etapas detalhadas de entrega ainda não foram estruturadas. Solicite agora mesmo para iniciarmos.
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

                      {/* Card de Informação */}
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
                        
                        <p className="text-sm text-foreground/60 leading-relaxed font-medium mb-4">
                          {step.description}
                        </p>

                        {/* Foto da etapa */}
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
          </motion.div>
        )}

        {/* CONTEÚDO DA ABA 3: QUADRO DE TAREFAS (PROGRESSO) */}
        {activeTab === "tasks" && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              
              {/* Coluna 1: A Fazer / Pendências */}
              <div className="bg-surface border border-surface-border rounded-3xl p-6 shadow-sm flex flex-col min-h-[420px]">
                <div className="flex items-center justify-between pb-4 mb-4 border-b border-surface-border">
                  <h3 className="font-black text-xs uppercase tracking-widest text-foreground/60 flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-foreground/30" /> A Fazer / Pendências
                  </h3>
                  <span className="text-xs font-black bg-background border border-surface-border px-2.5 py-1 rounded-full text-foreground/70">
                    {getTasksByStatus('todo').length}
                  </span>
                </div>

                <div className="flex flex-col gap-3 flex-1">
                  {getTasksByStatus('todo').map(task => (
                    <div key={task.id} className="p-4 bg-background border border-surface-border rounded-2xl hover:border-accent/30 transition-all shadow-sm">
                      <p className="text-sm font-bold text-foreground leading-snug">{task.title}</p>
                      <span className="text-[10px] text-foreground/40 font-mono mt-2 block">ID: {task.id.substring(0, 6)}</span>
                    </div>
                  ))}
                  {getTasksByStatus('todo').length === 0 && (
                    <div className="flex-1 flex flex-col items-center justify-center text-center p-6 border-2 border-dashed border-surface-border/60 rounded-2xl text-foreground/30 text-xs font-bold">
                      Nenhuma pendência na fila
                    </div>
                  )}
                </div>
              </div>

              {/* Coluna 2: Em Produção */}
              <div className="bg-surface border border-accent/20 rounded-3xl p-6 shadow-sm flex flex-col min-h-[420px] relative overflow-hidden">
                <div className="absolute top-0 right-0 w-32 h-32 bg-accent/5 blur-2xl pointer-events-none" />
                
                <div className="flex items-center justify-between pb-4 mb-4 border-b border-surface-border relative z-10">
                  <h3 className="font-black text-xs uppercase tracking-widest text-accent flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-accent animate-ping" /> Em Produção Ativa
                  </h3>
                  <span className="text-xs font-black bg-accent/10 border border-accent/20 text-accent px-2.5 py-1 rounded-full">
                    {getTasksByStatus('doing').length}
                  </span>
                </div>

                <div className="flex flex-col gap-3 flex-1 relative z-10">
                  {getTasksByStatus('doing').map(task => (
                    <div key={task.id} className="p-4 bg-background border-l-4 border-l-accent border-surface-border rounded-2xl shadow-sm">
                      <p className="text-sm font-black text-foreground leading-snug">{task.title}</p>
                      <div className="mt-2 flex items-center justify-between">
                        <span className="text-[9px] font-black uppercase text-accent bg-accent/10 px-2 py-0.5 rounded">Em execução</span>
                        <span className="text-[10px] text-foreground/40 font-mono">ID: {task.id.substring(0, 6)}</span>
                      </div>
                    </div>
                  ))}
                  {getTasksByStatus('doing').length === 0 && (
                    <div className="flex-1 flex flex-col items-center justify-center text-center p-6 border-2 border-dashed border-surface-border/60 rounded-2xl text-foreground/30 text-xs font-bold">
                      Aguardando início de novas tarefas
                    </div>
                  )}
                </div>
              </div>

              {/* Coluna 3: Concluídas / Entregues */}
              <div className="bg-surface border border-surface-border rounded-3xl p-6 shadow-sm flex flex-col min-h-[420px]">
                <div className="flex items-center justify-between pb-4 mb-4 border-b border-surface-border">
                  <h3 className="font-black text-xs uppercase tracking-widest text-emerald-500 flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" /> Concluídas / Entregues
                  </h3>
                  <span className="text-xs font-black bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 px-2.5 py-1 rounded-full">
                    {getTasksByStatus('done').length}
                  </span>
                </div>

                <div className="flex flex-col gap-3 flex-1">
                  {getTasksByStatus('done').map(task => (
                    <div key={task.id} className="p-4 bg-background border border-surface-border rounded-2xl hover:border-emerald-500/30 transition-all opacity-80 hover:opacity-100">
                      <p className="text-sm font-bold text-foreground leading-snug line-through decoration-foreground/30">{task.title}</p>
                      <div className="mt-2 flex items-center justify-between text-[10px] text-emerald-500 font-bold">
                        <span className="flex items-center gap-1"><CheckCircle2 className="w-3 h-3" /> Entregue</span>
                        <span className="text-foreground/30 font-mono">ID: {task.id.substring(0, 6)}</span>
                      </div>
                    </div>
                  ))}
                  {getTasksByStatus('done').length === 0 && (
                    <div className="flex-1 flex flex-col items-center justify-center text-center p-6 border-2 border-dashed border-surface-border/60 rounded-2xl text-foreground/30 text-xs font-bold">
                      Nenhuma tarefa concluída ainda
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
      <div className="flex-1 flex items-center justify-center bg-background">
        <div className="w-8 h-8 border-2 border-surface-border border-t-accent rounded-full animate-spin" />
      </div>
    }>
      <IntegratedTimelineContent />
    </Suspense>
  );
}
