"use client";
import { useEffect, useState, use, useRef } from "react";
import { supabase } from "@/lib/supabase";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { motion } from "framer-motion";

type Task = { id: string; title: string; status: 'todo' | 'doing' | 'review' | 'done'; };

export default function EnhancedKanbanPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  const projectId = resolvedParams.id;
  const [project, setProject] = useState<any>(null);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const channelRef = useRef<any>(null);

  const fetchTasks = async (pid: string) => {
    const { data: tasksData } = await supabase.from('tasks').select('*').eq('project_id', pid).order('created_at', { ascending: false });
    if (tasksData) setTasks(tasksData as Task[]);
  };

  useEffect(() => {
    if (!projectId) return;

    const init = async () => {
      // Mock data for demo
      if (projectId === 'mock-123') {
          setProject({ id: 'mock-123', name: 'Módulo de E-Commerce (Demostração)' });
          setTasks([
              { id: '1', title: 'Aprovação do Design Base', status: 'done' },
              { id: '2', title: 'Integração do Banco (Supabase)', status: 'doing' },
              { id: '3', title: 'Configurar Regras de RLs', status: 'todo' },
          ]);
          setLoading(false);
          return;
      }

      setLoading(true);
      const { data: proj } = await supabase.from('projects').select('*').eq('id', projectId).single();
      if (proj) setProject(proj);
      await fetchTasks(projectId);
      setLoading(false);

      // Limpa canais anteriores antes de criar novo
      if (channelRef.current) {
          supabase.removeChannel(channelRef.current);
      }

      const channel = supabase.channel(`kanban-${projectId}`);
      channel
        .on('postgres_changes', { event: '*', schema: 'public', table: 'tasks', filter: `project_id=eq.${projectId}` }, () => {
            fetchTasks(projectId);
        })
        .subscribe();
      
      channelRef.current = channel;
    };

    init();

    return () => { 
        if (channelRef.current) supabase.removeChannel(channelRef.current); 
    };
  }, [projectId]);

  const getTasksByStatus = (status: Task['status']) => tasks.filter(t => t.status === status);

  if (loading) return (
       <div className="h-full flex-1 flex flex-col items-center justify-center bg-[#0a0a0b]">
           <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1, ease: "linear" }} className="w-12 h-12 border-[3px] border-white/5 border-t-accent rounded-full mb-4" />
           <p className="text-[10px] font-black text-accent uppercase tracking-widest animate-pulse">Sincronizando Board...</p>
       </div>
  );

  return (
    <div className="flex-1 flex flex-col p-6 sm:p-10 overflow-y-auto bg-[#0a0a0b] custom-scrollbar">
      
      <motion.div initial={{opacity:0, y:-10}} animate={{opacity:1, y:0}} className="bg-[#111213] border border-[#222] rounded-[32px] p-8 md:p-10 mb-10 shadow-2xl relative overflow-hidden">
         <div className="absolute top-0 right-0 w-64 h-64 bg-accent/5 blur-[100px] pointer-events-none" />
         
         <div className="flex items-center gap-6 mb-6">
             <Link href="/dashboard" className="p-4 bg-[#1a1b1e] border border-[#2c2d30] rounded-2xl hover:bg-[#222] transition-all text-white group">
                <ArrowLeft className="w-6 h-6 group-hover:-translate-x-1 transition-transform"/>
             </Link>
             <div>
                <span className="text-[10px] font-black text-accent uppercase tracking-[0.3em] mb-1 block">Timeline da Operação</span>
                <h1 className="text-3xl md:text-5xl font-black text-white tracking-tighter uppercase italic">{project?.name}</h1>
             </div>
         </div>
         
         <div className="flex flex-wrap gap-10 mt-8 pt-8 border-t border-white/5">
            <div>
               <h4 className="text-[10px] font-black text-[#555] mb-3 uppercase tracking-widest">Estado Atual</h4>
               <div className="flex items-center gap-3">
                  <div className="w-3 h-3 rounded-full bg-accent animate-pulse shadow-[0_0_15px_rgba(168,85,247,0.8)]" />
                  <span className="text-xl font-bold text-white tracking-tight">Desenvolvimento Ativo</span>
               </div>
            </div>
            <div>
               <h4 className="text-[10px] font-black text-[#555] mb-3 uppercase tracking-widest">Progresso Total</h4>
               <div className="flex items-center gap-4">
                  <div className="w-40 h-2 bg-white/5 rounded-full overflow-hidden">
                      <div className="h-full bg-accent" style={{ width: `${tasks.length > 0 ? (getTasksByStatus('done').length / tasks.length) * 100 : 0}%` }} />
                  </div>
                  <span className="text-sm font-black text-white">{tasks.length > 0 ? Math.round((getTasksByStatus('done').length / tasks.length) * 100) : 0}%</span>
               </div>
            </div>
         </div>
      </motion.div>

      <motion.div initial={{opacity:0, y:20}} animate={{opacity:1, y:0}} transition={{delay:0.1}} className="flex-1 grid grid-cols-1 lg:grid-cols-2 gap-8 max-w-7xl">
        
        {/* Coluna A Fazer */}
        <div className="bg-[#111213] border border-[#222] rounded-[40px] p-8 shadow-2xl flex flex-col h-full min-h-[500px]">
          <div className="flex items-center justify-between mb-8 border-b border-white/5 pb-6">
            <h3 className="font-black text-[12px] uppercase tracking-[0.3em] flex items-center gap-3 text-[#555]">
              <div className="w-2 h-2 rounded-full bg-[#333]" /> Pendências
            </h3>
            <span className="bg-[#1a1b1e] border border-[#2c2d30] px-4 py-1.5 rounded-full text-[10px] font-black text-white">{getTasksByStatus('todo').length}</span>
          </div>
          
          <div className="flex flex-col gap-5">
             {getTasksByStatus('todo').map(task => (
                <motion.div layout key={task.id} className="bg-[#1a1b1e] border border-[#2c2d30] p-6 rounded-3xl hover:border-accent/40 transition-all shadow-lg group">
                   <p className="font-bold text-[16px] text-[#ccc] leading-snug group-hover:text-white transition-colors">{task.title}</p>
                   <div className="mt-4 flex items-center gap-2 opacity-30 group-hover:opacity-100 transition-opacity">
                       <div className="w-1.5 h-1.5 rounded-full bg-[#555]" />
                       <span className="text-[9px] font-black uppercase tracking-widest">Cód: {task.id.substring(0,6)}</span>
                   </div>
                </motion.div>
             ))}
             {getTasksByStatus('todo').length === 0 && <div className="h-32 border-2 border-dashed border-[#222] rounded-3xl flex flex-col items-center justify-center text-[#444] font-black gap-2"><span className="text-[10px] uppercase tracking-widest">Nada pendente</span></div>}
          </div>
        </div>

        {/* Coluna Fazendo */}
        <div className="bg-[#111213]/50 border border-[#222] rounded-[40px] p-8 shadow-2xl flex flex-col h-full min-h-[500px] relative overflow-hidden">
          <div className="absolute inset-0 bg-accent/2 opacity-[0.03] pointer-events-none" />
          <div className="flex items-center justify-between mb-8 border-b border-white/5 pb-6 relative z-10">
            <h3 className="font-black text-[12px] uppercase tracking-[0.3em] flex items-center gap-3 text-accent">
              <div className="w-2 h-2 rounded-full bg-accent animate-ping" /> Produção
            </h3>
            <span className="bg-accent/10 border border-accent/20 text-accent px-4 py-1.5 rounded-full text-[10px] font-black">{getTasksByStatus('doing').length}</span>
          </div>
          
          <div className="flex flex-col gap-5 relative z-10">
             {getTasksByStatus('doing').map(task => (
                <motion.div layout key={task.id} className="bg-[#1a1b1e] border-l-4 border-accent p-6 rounded-3xl shadow-xl transition-all group">
                   <p className="font-bold text-[16px] text-white leading-snug">{task.title}</p>
                   <div className="mt-4 flex items-center gap-3">
                       <span className="text-[9px] font-black uppercase tracking-widest text-accent bg-accent/5 px-2 py-1 rounded">Prioritário</span>
                       <span className="text-[9px] font-black uppercase tracking-widest text-[#555]">Realtime Sync</span>
                   </div>
                </motion.div>
             ))}
             {getTasksByStatus('doing').length === 0 && <div className="h-32 border-2 border-dashed border-[#222] rounded-3xl flex flex-col items-center justify-center text-[#444] font-black gap-2"><span className="text-[10px] uppercase tracking-widest">Aguardando Início</span></div>}
          </div>
        </div>

      </motion.div>
    </div>
  );
}
