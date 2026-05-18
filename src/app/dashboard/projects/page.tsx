"use client";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { useRouter } from "next/navigation";
import { FolderKanban, ArrowRight, ExternalLink, ShieldCheck } from "lucide-react";
import { motion } from "framer-motion";

export default function ClientProjectsPage() {
   const [projects, setProjects] = useState<any[]>([]);
   const [progress, setProgress] = useState<Record<string, {total: number, done: number}>>({});
   const router = useRouter();

   useEffect(() => {
     const fetchData = async () => {
         const { data: { session } } = await supabase.auth.getSession();
         if (!session) {
            router.push("/login"); return;
         }
         
         const { data: projs } = await supabase.from('projects').select('*').eq('client_id', session.user.id);
         let activeProjects = projs || [];
         
         // Mock Inteligente e Elegante
         if (activeProjects.length === 0) {
            activeProjects = [{ id: 'mock-123', name: 'Software Management V2', status: 'em_desenvolvimento', isMock: true, domain: 'susanoo.com/app' }];
            setProgress({ 'mock-123': { total: 24, done: 16 } });
         } else {
             const { data: allTasks } = await supabase.from('tasks').select('project_id, status').in('project_id', activeProjects.map(p => p.id));
             const counts: Record<string, {total: number, done: number}> = {};
             allTasks?.forEach(t => {
                 if (!counts[t.project_id]) counts[t.project_id] = {total:0, done:0};
                 counts[t.project_id].total++;
                 if (t.status === 'done' || t.status === 'review') counts[t.project_id].done++;
             });
             setProgress(counts);
         }

         setProjects(activeProjects);
     };
     fetchData();
   }, [router]);

   return (
       <div className="flex-1 overflow-y-auto w-full bg-[#0a0a0a]">
           <div className="flex items-center justify-between p-4 px-8 border-b border-[#2c2d30] bg-[#111213]/90 backdrop-blur-md sticky top-0 z-50">
               <div className="flex items-center gap-4 text-white">
                 <FolderKanban className="w-5 h-5 text-accent"/>
                 <span className="font-bold text-[17px] tracking-tight">Painel de Operações</span>
               </div>
           </div>

           <div className="w-full max-w-5xl mx-auto py-16 px-6 flex flex-col">
               <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }} className="mb-14">
                   <h1 className="text-4xl md:text-5xl font-black mb-3 text-white tracking-tighter">Meus Projetos</h1>
                   <p className="text-[#a0a0a0] max-w-2xl text-[16px] font-medium leading-relaxed">
                       Interface dedicada para empresas focadas. Um retrato profissional, espaçoso e objetivo do andamento do seu software.
                   </p>
               </motion.div>

               <div className="w-full flex flex-col gap-10">
                   {projects.map((proj, i) => {
                       const pInfo = progress[proj.id];
                       const pct = pInfo && pInfo.total > 0 ? Math.round((pInfo.done / pInfo.total) * 100) : 0;
                       
                       return (
                       <motion.div
                           initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }}
                           key={proj.id} 
                           className="bg-[#111213] border border-[#222] rounded-[32px] p-8 md:p-12 shadow-2xl hover:border-[#333] transition-all flex flex-col md:flex-row gap-10 items-center overflow-hidden relative"
                       >
                           {/* Destaque Visual Reduzido/Sem Gradiente Espaçoso */}
                           <div className="w-full md:w-1/3 aspect-[4/3] bg-[#0a0a0b] rounded-2xl border border-[#222] flex items-center justify-center relative shadow-inner overflow-hidden shrink-0">
                              <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-30 mix-blend-overlay"></div>
                              <h3 className="text-5xl font-black text-[#222] tracking-tighter">{proj.name.substring(0,3).toUpperCase()}</h3>
                              <div className="absolute top-4 left-4 flex gap-2">
                                  <div className="w-3 h-3 rounded-full bg-red-500/20 border border-red-500/50"></div>
                                  <div className="w-3 h-3 rounded-full bg-yellow-500/20 border border-yellow-500/50"></div>
                                  <div className="w-3 h-3 rounded-full bg-emerald-500/20 border border-emerald-500/50"></div>
                              </div>
                           </div>

                           <div className="flex-1 flex flex-col w-full z-10">
                               
                               <div className="flex items-center gap-3 mb-4">
                                   <span className="bg-[#1e1f24] text-[#a0a0a0] font-bold text-[10px] px-3 py-1 rounded border border-[#2c2d30] uppercase tracking-widest shadow-sm">
                                       Status Operacional
                                   </span>
                                   <div className="flex items-center gap-1.5 text-xs font-bold text-accent">
                                       <span className="w-2 h-2 rounded-full bg-accent animate-pulse"></span> Em Linha de Produção
                                   </div>
                               </div>

                               <h2 className="text-3xl md:text-4xl font-extrabold text-white mb-2 tracking-tight">{proj.name}</h2>
                               <p className="text-[#888] font-medium text-[15px] mb-8 max-w-md flex items-center gap-2">
                                  <ShieldCheck className="w-4 h-4 text-emerald-500"/> Solução assegurada sob contrato Susanoo.
                               </p>

                               {/* Mega Barra de Progresso */}
                               <div className="mb-10 w-full max-w-md">
                                   <div className="flex justify-between items-end mb-3">
                                       <span className="text-[13px] font-bold text-[#888] uppercase tracking-wider">Avanço do Sistema</span>
                                       <span className="text-3xl font-black text-white">{pct}%</span>
                                   </div>
                                   <div className="w-full bg-[#18191b] border border-[#2c2d30] h-4 rounded-full overflow-hidden shadow-inner">
                                       <div className="bg-white h-4 rounded-full transition-all duration-1000 ease-out shadow-[0_0_10px_rgba(255,255,255,0.5)]" style={{ width: `${pct}%` }}></div>
                                   </div>
                               </div>

                               {/* Botões Funcionais */}
                               <div className="flex flex-col sm:flex-row items-center gap-4">
                                   <button onClick={() => router.push(`/dashboard/kanban/${proj.id}`)} className="w-full sm:w-auto bg-white text-black hover:bg-neutral-200 font-bold px-8 py-3.5 rounded-xl transition-all shadow-xl shadow-white/10 flex items-center justify-center gap-2 text-[15px]">
                                       Acessar Kanban <ArrowRight className="w-4 h-4" />
                                   </button>
                                   <button 
                                       onClick={() => {
                                           if (proj.deploy_url) {
                                               const url = proj.deploy_url.startsWith('http') ? proj.deploy_url : `https://${proj.deploy_url}`;
                                               window.open(url, '_blank');
                                           } else {
                                               alert("A publicação ainda não foi homologada pelo Sócio.");
                                           }
                                       }}
                                       className="w-full sm:w-auto bg-[#1a1b1e] border border-[#2c2d30] hover:bg-[#222] text-[#e0e0e0] font-bold px-8 py-3.5 rounded-xl transition-all flex items-center justify-center gap-2 text-[15px]"
                                   >
                                       Ver Publicação <ExternalLink className="w-4 h-4 text-[#888]" />
                                   </button>
                               </div>

                           </div>
                       </motion.div>
                   )})}
               </div>
           </div>
       </div>
   );
}
