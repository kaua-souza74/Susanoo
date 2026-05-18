"use client";
import { useEffect, useState, use } from "react";
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

  useEffect(() => {
    if (!projectId) return;

    const loadData = async () => {
      // Condição especial para apresentar a interface lindamente mesmo se banco vazio
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

      const { data: proj } = await supabase.from('projects').select('*').eq('id', projectId).single();
      if (proj) setProject(proj);

      await fetchTasks(projectId);
      subscribeToTasks(projectId);
      setLoading(false);
    };

    loadData();

    return () => { supabase.removeAllChannels(); };
  }, [projectId]);

  const fetchTasks = async (pid: string) => {
    const { data: tasksData } = await supabase.from('tasks').select('*').eq('project_id', pid).order('created_at', { ascending: false });
    if (tasksData) setTasks(tasksData as Task[]);
  };

  const subscribeToTasks = (pid: string) => {
    supabase.channel('schema-db-changes').on('postgres_changes', { event: '*', schema: 'public', table: 'tasks', filter: `project_id=eq.${pid}` }, () => fetchTasks(pid)).subscribe();
  };

  const getTasksByStatus = (status: Task['status']) => tasks.filter(t => t.status === status);

  if (loading) return (
       <div className="flex-1 flex flex-col items-center justify-center bg-[#111213]">
           <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1, ease: "linear" }} className="w-12 h-12 border-[3px] border-[#2c2d30] border-t-accent rounded-full mb-4" />
       </div>
  );

  return (
    <div className="flex-1 flex flex-col p-6 sm:p-10 overflow-y-auto bg-[#0a0a0b]">
      
      {/* Box Superior Inspirado na Print */}
      <motion.div initial={{opacity:0, y:-10}} animate={{opacity:1, y:0}} className="bg-[#111213] border border-[#222] rounded-2xl p-6 md:p-8 mb-8 shadow-xl">
         <div className="flex items-center gap-4 mb-4">
             <Link href="/dashboard" className="p-2 bg-[#1a1b1e] border border-[#2c2d30] rounded-xl hover:bg-[#222] transition-colors text-white">
                <ArrowLeft className="w-5 h-5"/>
             </Link>
             <h1 className="text-2xl md:text-3xl font-black text-white">{project?.name}</h1>
         </div>
         <div className="mt-4">
            <h4 className="text-[12px] font-bold text-[#888] mb-2 uppercase tracking-widest">Status do Projeto</h4>
            <div className="flex items-center gap-2">
               <span className="w-3 h-3 rounded-full bg-accent animate-pulse shadow-[0_0_10px_rgba(168,85,247,0.8)]"></span>
               <span className="text-xl font-bold text-white tracking-tight">Em Desenvolvimento</span>
            </div>
         </div>
      </motion.div>

      {/* Grid Central Inspirado na Print (Kanban Boards com Fundos Dark) */}
      <motion.div initial={{opacity:0, y:20}} animate={{opacity:1, y:0}} transition={{delay:0.1}} className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-6 max-w-5xl">
        
        {/* Coluna A Fazer / Backlog */}
        <div className="bg-[#111213] border border-[#222] rounded-[24px] p-6 shadow-xl flex flex-col h-full min-h-[400px]">
          <div className="flex items-center justify-between mb-6 border-b border-[#222] pb-4">
            <h3 className="font-bold text-[14px] uppercase tracking-widest flex items-center gap-2 text-[#888]">
              A Fazer
            </h3>
            <span className="bg-[#222] px-3 py-1 rounded-full text-xs font-bold text-white">{getTasksByStatus('todo').length}</span>
          </div>
          
          <div className="flex flex-col gap-4">
             {getTasksByStatus('todo').map(task => (
                <div key={task.id} className="bg-[#1a1b1e] border border-[#2c2d30] p-5 rounded-2xl hover:border-accent/40 transition-colors shadow-md group">
                   <p className="font-semibold text-[15px] text-[#e0e0e0] leading-snug">{task.title}</p>
                </div>
             ))}
             {getTasksByStatus('todo').length === 0 && <div className="h-24 border-2 border-dashed border-[#222] rounded-2xl flex items-center justify-center text-[#555] font-bold text-sm">Nenhuma pendência</div>}
          </div>
        </div>

        {/* Coluna Fazendo */}
        <div className="bg-[#111213] border border-[#222] rounded-[24px] p-6 shadow-xl flex flex-col h-full min-h-[400px] relative overflow-hidden">
          <div className="flex items-center justify-between mb-6 border-b border-[#222] pb-4 relative z-10">
            <h3 className="font-bold text-[14px] uppercase tracking-widest flex items-center gap-2 text-accent">
              Fazendo Agora
            </h3>
            <span className="bg-accent/20 text-accent px-3 py-1 rounded-full text-xs font-bold">{getTasksByStatus('doing').length}</span>
          </div>
          
          <div className="flex flex-col gap-4 relative z-10">
             {getTasksByStatus('doing').map(task => (
                <div key={task.id} className="bg-[#241b35] border border-accent/40 p-5 rounded-2xl shadow-[0_0_20px_rgba(168,85,247,0.1)] transition-colors group">
                   <p className="font-semibold text-[15px] text-white leading-snug">{task.title}</p>
                </div>
             ))}
             {getTasksByStatus('doing').length === 0 && <div className="h-24 border-2 border-dashed border-[#222] rounded-2xl flex items-center justify-center text-[#555] font-bold text-sm">Aguardando movimento</div>}
          </div>
        </div>
      </motion.div>
    </div>
  );
}
