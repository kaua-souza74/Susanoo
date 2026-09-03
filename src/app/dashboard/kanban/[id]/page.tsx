"use client";
import { useEffect, useState, use, useRef } from "react";
import { supabase } from "@/lib/supabase";
import { 
  ArrowLeft, 
  Calendar, 
  CheckCircle2, 
  Circle, 
  Clock, 
  LayoutGrid, 
  ListTodo, 
  Activity, 
  Image as ImageIcon, 
  Check, 
  ExternalLink, 
  MessageSquareText, 
  ShieldCheck, 
  Zap, 
  ChevronRight,
  ShoppingBag
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";

type Task = { id: string; title: string; status: 'todo' | 'doing' | 'review' | 'done'; created_at: string; };

export default function EnhancedProjectProgressPage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter();
  const resolvedParams = use(params);
  const projectId = resolvedParams.id;
  
  const [project, setProject] = useState<any>(null);
  const [steps, setSteps] = useState<any[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [activeTab, setActiveTab] = useState<"overview" | "timeline" | "tasks">("overview");
  const [loading, setLoading] = useState(true);

  const fetchData = async () => {
    if (!projectId) return;

    // Busca Projeto Real no Supabase
    const { data: proj } = await supabase.from('projects').select('*').eq('id', projectId).single();
    if (proj) setProject(proj);

    // Busca Etapas
    const { data: timelineData } = await supabase
      .from('timeline_steps')
      .select('*')
      .eq('project_id', projectId)
      .order('order_index', { ascending: true });
    setSteps(timelineData || []);

    // Busca Tarefas
    const { data: tasksData } = await supabase
      .from('tasks')
      .select('*')
      .eq('project_id', projectId)
      .order('created_at', { ascending: false });
    setTasks((tasksData as Task[]) || []);

    setLoading(false);
  };

  useEffect(() => {
    fetchData();

    if (projectId) {
      const channel = supabase.channel(`progress-${projectId}`)
        .on('postgres_changes', { event: '*', schema: 'public', table: 'tasks', filter: `project_id=eq.${projectId}` }, () => {
          fetchData();
        })
        .on('postgres_changes', { event: '*', schema: 'public', table: 'timeline_steps', filter: `project_id=eq.${projectId}` }, () => {
          fetchData();
        })
        .subscribe();

      return () => { supabase.removeChannel(channel); };
    }
  }, [projectId]);

  const getTasksByStatus = (status: Task['status']) => tasks.filter(t => t.status === status);
  const completedSteps = steps.filter(s => s.status === 'completed').length;
  const currentStep = steps.find(s => s.status === 'current') || steps.find(s => s.status === 'upcoming');
  const manualPct = project?.manual_progress || 0;
  const computedPct = steps.length > 0 ? Math.round((completedSteps / steps.length) * 100) : manualPct;

  if (loading) {
    return (
      <div className="h-full flex-1 flex flex-col items-center justify-center bg-background">
        <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1, ease: "linear" }} className="w-10 h-10 border-[3px] border-surface-border border-t-accent rounded-full mb-4" />
        <p className="text-xs font-black text-accent uppercase tracking-widest animate-pulse">Carregando Progresso Integrado...</p>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col p-6 sm:p-10 overflow-y-auto bg-background text-foreground custom-scrollbar transition-colors duration-300">
      <div className="max-w-6xl mx-auto w-full space-y-8 pb-20">
        
        {/* Header com Botão Voltar para Minhas Compras */}
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="bg-surface border border-surface-border rounded-3xl p-6 md:p-8 shadow-sm relative overflow-hidden">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="flex items-center gap-4">
              <button 
                onClick={() => router.push("/dashboard/projects")} 
                className="p-3.5 bg-background border border-surface-border rounded-2xl hover:border-accent/40 text-foreground transition-all cursor-pointer group"
                title="Voltar para Minhas Compras"
              >
                <ArrowLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
              </button>
              <div>
                <span className="text-[10px] font-black text-accent uppercase tracking-[0.25em] mb-1 flex items-center gap-1.5">
                  <Activity className="w-3.5 h-3.5" /> Progresso da Operação
                </span>
                <h1 className="text-2xl md:text-4xl font-black text-foreground tracking-tight">{project?.name || "Projeto"}</h1>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <button 
                onClick={() => router.push('/dashboard/chat')}
                className="px-5 py-2.5 bg-accent hover:bg-accent/90 text-white rounded-xl font-bold text-xs uppercase tracking-wider transition-all flex items-center gap-2 shadow-lg shadow-accent/20 cursor-pointer"
              >
                <MessageSquareText className="w-4 h-4" /> Chat com Equipe
              </button>
              <button 
                onClick={() => router.push('/dashboard/projects')}
                className="px-4 py-2.5 bg-background border border-surface-border text-foreground rounded-xl font-bold text-xs uppercase tracking-wider transition-all flex items-center gap-1.5 cursor-pointer hover:border-foreground/20"
              >
                <ShoppingBag className="w-4 h-4 text-accent" /> Minhas Compras
              </button>
            </div>
          </div>

          <div className="flex flex-wrap gap-8 mt-6 pt-6 border-t border-surface-border">
            <div>
              <span className="text-[10px] font-black text-foreground/40 mb-1 block uppercase tracking-widest">Status da Produção</span>
              <div className="flex items-center gap-2">
                <div className="w-2.5 h-2.5 rounded-full bg-accent animate-pulse" />
                <span className="text-sm font-bold text-foreground">Desenvolvimento Ativo</span>
              </div>
            </div>
            <div>
              <span className="text-[10px] font-black text-foreground/40 mb-1 block uppercase tracking-widest">Progresso Total</span>
              <div className="flex items-center gap-3">
                <div className="w-32 h-2.5 bg-background border border-surface-border rounded-full overflow-hidden">
                  <div className="h-full bg-accent" style={{ width: `${computedPct}%` }} />
                </div>
                <span className="text-sm font-black text-accent">{computedPct}%</span>
              </div>
            </div>
            {project?.deploy_url && (
              <div>
                <span className="text-[10px] font-black text-foreground/40 mb-1 block uppercase tracking-widest">Link de Demonstração</span>
                <a 
                  href={project.deploy_url.startsWith('http') ? project.deploy_url : `https://${project.deploy_url}`} 
                  target="_blank" 
                  rel="noreferrer"
                  className="text-xs font-bold text-accent hover:underline flex items-center gap-1"
                >
                  <ExternalLink className="w-3.5 h-3.5" /> Acessar Online
                </a>
              </div>
            )}
          </div>
        </motion.div>

        {/* Abas */}
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

        {/* CONTEÚDO TAB: VISÃO GERAL */}
        {activeTab === "overview" && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              
              {/* Card Resumo do Cronograma */}
              <div className="bg-surface border border-surface-border rounded-3xl p-6 shadow-sm flex flex-col justify-between">
                <div>
                  <span className="text-[10px] font-black uppercase tracking-widest text-accent mb-2 block">
                    Etapas do Cronograma
                  </span>
                  <h3 className="text-xl font-bold text-foreground mb-2">
                    {currentStep ? currentStep.title : "Cronograma em estruturação"}
                  </h3>
                  <p className="text-xs text-foreground/60 leading-relaxed mb-4">
                    {currentStep ? currentStep.description : "Os marcos de desenvolvimento serão liberados em breve pelo operador."}
                  </p>
                </div>
                <div className="pt-4 border-t border-surface-border flex items-center justify-between">
                  <span className="text-xs text-foreground/40 font-bold">{completedSteps} de {steps.length} etapas concluídas</span>
                  <button onClick={() => setActiveTab("timeline")} className="text-xs font-black text-accent uppercase tracking-wider hover:underline flex items-center gap-1">
                    Ver Cronograma <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {/* Card Resumo das Tarefas */}
              <div className="bg-surface border border-surface-border rounded-3xl p-6 shadow-sm flex flex-col justify-between">
                <div>
                  <span className="text-[10px] font-black uppercase tracking-widest text-foreground/40 mb-2 block">
                    Quadro de Tarefas do Projeto
                  </span>
                  <h3 className="text-xl font-bold text-foreground mb-2">
                    {tasks.length} Tarefas Registradas
                  </h3>
                  <p className="text-xs text-foreground/60 leading-relaxed mb-4">
                    Acompanhe em tempo real as demandas de produção e testes em execução.
                  </p>
                </div>
                <div className="pt-4 border-t border-surface-border flex items-center justify-between">
                  <span className="text-xs text-emerald-500 font-bold">{getTasksByStatus('done').length} concluídas</span>
                  <button onClick={() => setActiveTab("tasks")} className="text-xs font-black text-accent uppercase tracking-wider hover:underline flex items-center gap-1">
                    Ver Quadro <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

            </div>
          </motion.div>
        )}

        {/* CONTEÚDO TAB: CRONOGRAMA */}
        {activeTab === "timeline" && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
            {steps.length === 0 ? (
              <div className="bg-surface border border-surface-border rounded-3xl p-12 text-center text-foreground/40 font-bold">
                Nenhuma etapa cadastrada no cronograma deste site por enquanto.
              </div>
            ) : (
              <div className="relative">
                <div className="absolute left-[27px] top-4 bottom-4 w-px bg-surface-border hidden md:block" />
                <div className="flex flex-col gap-6">
                  {steps.map((step, idx) => (
                    <div key={step.id} className="flex items-start gap-5 relative group">
                      <div className={`z-10 w-14 h-14 rounded-2xl flex items-center justify-center shrink-0 border relative bg-background ${
                        step.status === 'completed' ? 'border-emerald-500/30 text-emerald-500 bg-emerald-500/10' :
                        step.status === 'current' ? 'border-accent/30 text-accent bg-accent/10' :
                        'border-surface-border text-foreground/30 bg-surface'
                      }`}>
                        {step.status === 'completed' ? <CheckCircle2 className="w-6 h-6" /> :
                         step.status === 'current' ? <Clock className="w-6 h-6 animate-spin" /> :
                         <Circle className="w-5 h-5 stroke-[1.5]" />}
                      </div>

                      <div className={`flex-1 bg-surface py-6 px-6 md:px-8 rounded-3xl border transition-all ${
                        step.status === 'current' ? 'border-accent shadow-lg shadow-accent/5' : 'border-surface-border hover:border-foreground/10'
                      }`}>
                        <div className="flex justify-between items-start md:items-center flex-col md:flex-row gap-2 mb-2">
                          <h3 className={`font-black text-lg ${step.status === 'upcoming' ? 'text-foreground/50' : 'text-foreground'}`}>{step.title}</h3>
                          <span className="text-xs font-bold text-foreground/40 bg-background border border-surface-border px-3 py-1 rounded-lg">{step.date}</span>
                        </div>
                        <p className="text-sm text-foreground/60 leading-relaxed font-medium">{step.description}</p>
                        {step.photo_url && (
                          <div className="mt-4 rounded-2xl overflow-hidden border border-surface-border bg-background max-w-lg aspect-video">
                            <img src={step.photo_url} alt="" className="w-full h-full object-cover" />
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </motion.div>
        )}

        {/* CONTEÚDO TAB: QUADRO DE TAREFAS */}
        {activeTab === "tasks" && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Pendências */}
              <div className="bg-surface border border-surface-border rounded-3xl p-6 shadow-sm flex flex-col min-h-[400px]">
                <div className="flex items-center justify-between pb-4 mb-4 border-b border-surface-border">
                  <h3 className="font-black text-xs uppercase tracking-widest text-foreground/60 flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-foreground/30" /> A Fazer
                  </h3>
                  <span className="text-xs font-black bg-background border border-surface-border px-2.5 py-1 rounded-full">{getTasksByStatus('todo').length}</span>
                </div>
                <div className="flex flex-col gap-3 flex-1">
                  {getTasksByStatus('todo').map(task => (
                    <div key={task.id} className="p-4 bg-background border border-surface-border rounded-2xl shadow-sm">
                      <p className="text-sm font-bold text-foreground">{task.title}</p>
                    </div>
                  ))}
                  {getTasksByStatus('todo').length === 0 && <div className="flex-1 flex items-center justify-center text-xs text-foreground/30 font-bold">Sem pendências</div>}
                </div>
              </div>

              {/* Produção */}
              <div className="bg-surface border border-accent/20 rounded-3xl p-6 shadow-sm flex flex-col min-h-[400px]">
                <div className="flex items-center justify-between pb-4 mb-4 border-b border-surface-border">
                  <h3 className="font-black text-xs uppercase tracking-widest text-accent flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-accent animate-ping" /> Em Produção
                  </h3>
                  <span className="text-xs font-black bg-accent/10 border border-accent/20 text-accent px-2.5 py-1 rounded-full">{getTasksByStatus('doing').length}</span>
                </div>
                <div className="flex flex-col gap-3 flex-1">
                  {getTasksByStatus('doing').map(task => (
                    <div key={task.id} className="p-4 bg-background border-l-4 border-l-accent border-surface-border rounded-2xl shadow-sm">
                      <p className="text-sm font-black text-foreground">{task.title}</p>
                    </div>
                  ))}
                  {getTasksByStatus('doing').length === 0 && <div className="flex-1 flex items-center justify-center text-xs text-foreground/30 font-bold">Aguardando início</div>}
                </div>
              </div>

              {/* Concluído */}
              <div className="bg-surface border border-surface-border rounded-3xl p-6 shadow-sm flex flex-col min-h-[400px]">
                <div className="flex items-center justify-between pb-4 mb-4 border-b border-surface-border">
                  <h3 className="font-black text-xs uppercase tracking-widest text-emerald-500 flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" /> Concluído
                  </h3>
                  <span className="text-xs font-black bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 px-2.5 py-1 rounded-full">{getTasksByStatus('done').length}</span>
                </div>
                <div className="flex flex-col gap-3 flex-1">
                  {getTasksByStatus('done').map(task => (
                    <div key={task.id} className="p-4 bg-background border border-surface-border rounded-2xl shadow-sm">
                      <p className="text-sm font-bold text-foreground line-through opacity-80">{task.title}</p>
                    </div>
                  ))}
                  {getTasksByStatus('done').length === 0 && <div className="flex-1 flex items-center justify-center text-xs text-foreground/30 font-bold">Nenhuma concluída</div>}
                </div>
              </div>
            </div>
          </motion.div>
        )}

      </div>
    </div>
  );
}
