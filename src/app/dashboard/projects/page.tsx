"use client";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { useRouter } from "next/navigation";
import { FolderKanban, ArrowRight, ExternalLink, ShieldCheck, Zap } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export default function ClientProjectsPage() {
    const [projects, setProjects] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const router = useRouter();

    useEffect(() => {
      const fetchData = async () => {
          const { data: { session } } = await supabase.auth.getSession();
          if (!session) {
             router.push("/login"); return;
          }
          
          const { data: projs } = await supabase.from('projects').select('*').eq('client_id', session.user.id);
          let activeProjects = projs || [];
          
          setProjects(activeProjects);
          setLoading(false);
      };

      fetchData();

      // Realtime para progresso manual
      const sub = supabase.channel('client_projects_sync')
          .on('postgres_changes', { event: '*', schema: 'public', table: 'projects' }, () => {
              fetchData();
          })
          .subscribe();
      
      return () => { supabase.removeChannel(sub) };
    }, [router]);

    if (loading) return (
        <div className="h-screen w-full bg-black flex items-center justify-center">
            <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1 }} className="w-12 h-12 border-2 border-white/5 border-t-accent rounded-full" />
        </div>
    );

    return (
        <div className="flex-1 overflow-y-auto w-full bg-[#050505] custom-scrollbar pb-20">
            
            <div className="w-full max-w-6xl mx-auto py-20 px-8 flex flex-col">
                <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} className="mb-20">
                    <div className="flex items-center gap-3 mb-6">
                        <Zap className="w-5 h-5 text-accent fill-accent" />
                        <span className="text-[11px] font-black uppercase tracking-[0.4em] text-accent">Active Operations</span>
                    </div>
                    <h1 className="text-6xl md:text-8xl font-black text-white tracking-tighter uppercase italic leading-none mb-6">Meus Projetos</h1>
                    <p className="text-[#444] max-w-xl text-[18px] font-bold italic border-l-2 border-accent pl-6 py-2">
                        Acompanhe em tempo real a evolução da sua infraestrutura e progresso de desenvolvimento.
                    </p>
                </motion.div>

                <div className="grid grid-cols-1 gap-12">
                    {projects.length === 0 ? (
                        <motion.div initial={{opacity:0}} animate={{opacity:1}} className="bg-[#0c0c0d] border border-white/5 rounded-[60px] p-20 text-center flex flex-col items-center">
                            <div className="w-20 h-20 bg-accent/10 rounded-full flex items-center justify-center mb-8 border border-accent/20">
                                <Zap className="w-10 h-10 text-accent animate-pulse" />
                            </div>
                            <h3 className="text-3xl font-black text-white uppercase italic mb-4">Nenhuma Operação Ativa</h3>
                            <p className="text-[#444] font-bold max-w-sm">Você ainda não possui projetos iniciados na rede Susanoo. Fale com um consultor para inicializar sua HQ.</p>
                        </motion.div>
                    ) : projects.map((proj, i) => {
                        const pct = proj.manual_progress || 0;
                        
                        return (
                        <motion.div
                            initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }}
                            key={proj.id} 
                            className="bg-[#0c0c0d] border border-white/5 rounded-[60px] p-10 md:p-16 shadow-2xl flex flex-col lg:flex-row gap-16 items-center relative overflow-hidden group"
                        >
                            <div className="absolute top-0 left-0 w-64 h-64 bg-accent/5 blur-[100px] -ml-32 -mt-32 pointer-events-none" />
                            
                            {/* Visual Mock do Site */}
                            <div className="w-full lg:w-[400px] aspect-video bg-[#050505] rounded-[40px] border border-white/5 flex flex-col shadow-inner overflow-hidden shrink-0 relative">
                               <div className="h-8 bg-white/5 w-full flex items-center px-6 gap-2">
                                   <div className="w-2 h-2 rounded-full bg-[#222]" />
                                   <div className="w-2 h-2 rounded-full bg-[#222]" />
                                   <div className="w-2 h-2 rounded-full bg-[#222]" />
                               </div>
                               <div className="flex-1 flex flex-col items-center justify-center p-10">
                                   <h3 className="text-6xl font-black text-[#111] uppercase tracking-tighter italic">{proj.name.substring(0,3)}</h3>
                                   <div className="w-20 h-1 bg-[#111] mt-4 rounded-full" />
                               </div>
                               <div className="absolute inset-0 bg-accent/5 opacity-0 group-hover:opacity-100 transition-opacity" />
                            </div>

                            <div className="flex-1 flex flex-col w-full relative z-10">
                                <div className="flex items-center gap-4 mb-6">
                                    <div className="flex items-center gap-2 bg-accent/10 border border-accent/20 px-4 py-1.5 rounded-full">
                                        <div className="w-2 h-2 rounded-full bg-accent animate-pulse shadow-[0_0_10px_#a855f7]" />
                                        <span className="text-[10px] font-black text-accent uppercase tracking-widest">Produção Ativa</span>
                                    </div>
                                    <span className="text-[10px] font-black text-[#333] uppercase tracking-widest">ID: {proj.id.substring(0,8)}</span>
                                </div>

                                <h2 className="text-4xl md:text-6xl font-black text-white mb-4 tracking-tighter uppercase italic">{proj.name}</h2>
                                <p className="text-[#444] font-bold text-[16px] mb-12 flex items-center gap-3">
                                   <ShieldCheck className="w-5 h-5 text-emerald-500"/> Projeto assegurado pela rede Susanoo HQ.
                                </p>

                                {/* Mega Barra de Progresso */}
                                <div className="mb-14 w-full">
                                    <div className="flex justify-between items-end mb-4">
                                        <div className="flex flex-col">
                                            <span className="text-[11px] font-black text-[#333] uppercase tracking-[0.4em] mb-1">Avanço Operacional</span>
                                            <span className="text-[10px] font-bold text-accent italic">Sincronizado com ADM</span>
                                        </div>
                                        <span className="text-6xl font-black text-white italic tracking-tighter">{pct}<span className="text-2xl text-accent ml-2">%</span></span>
                                    </div>
                                    <div className="w-full bg-[#18191b] border border-white/5 h-5 rounded-full overflow-hidden shadow-2xl p-1">
                                        <motion.div 
                                            initial={{ width: 0 }}
                                            animate={{ width: `${pct}%` }}
                                            transition={{ duration: 1.5, ease: "circOut" }}
                                            className="bg-accent h-full rounded-full shadow-[0_0_20px_rgba(168,85,247,0.5)]" 
                                        />
                                    </div>
                                </div>

                                <div className="flex flex-col sm:flex-row items-center gap-6">
                                    <button onClick={() => router.push(`/dashboard/kanban/${proj.id}`)} className="w-full sm:w-auto bg-white text-black hover:scale-105 font-black px-12 py-5 rounded-[24px] transition-all shadow-2xl flex items-center justify-center gap-3 text-xs tracking-widest uppercase">
                                        Explorar Kanban <ArrowRight className="w-5 h-5" />
                                    </button>
                                    <button 
                                        onClick={() => {
                                            if (proj.deploy_url) {
                                                const url = proj.deploy_url.startsWith('http') ? proj.deploy_url : `https://${proj.deploy_url}`;
                                                window.open(url, '_blank');
                                            } else {
                                                alert("Aguardando homologação do Sócio.");
                                            }
                                        }}
                                        className="w-full sm:w-auto bg-transparent border border-white/5 hover:bg-white/5 text-white font-black px-12 py-5 rounded-[24px] transition-all flex items-center justify-center gap-3 text-xs tracking-widest uppercase"
                                    >
                                        Ver Publicação <ExternalLink className="w-5 h-5 text-[#333]" />
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
