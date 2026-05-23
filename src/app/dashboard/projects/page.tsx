"use client";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { useRouter } from "next/navigation";
import { ArrowRight, ExternalLink, ShieldCheck, Zap, ShieldAlert, Monitor, ChevronRight } from "lucide-react";
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
          setProjects(projs || []);
          setLoading(false);
      };

      fetchData();

      const sub = supabase.channel('client_projects_sync')
          .on('postgres_changes', { event: '*', schema: 'public', table: 'projects' }, () => {
              fetchData();
          })
          .subscribe();
      
      return () => { supabase.removeChannel(sub) };
    }, [router]);

    if (loading) return (
        <div className="flex-1 h-full w-full bg-background flex items-center justify-center">
            <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1, ease: 'linear' }} className="w-10 h-10 border-[3px] border-surface-border border-t-accent rounded-full" />
        </div>
    );

    return (
        <div className="flex-1 overflow-y-auto w-full bg-background custom-scrollbar pb-20 p-6 md:p-10">
            <div className="w-full max-w-6xl mx-auto flex flex-col">
                <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="mb-12">
                    <h1 className="text-3xl md:text-4xl font-extrabold text-foreground tracking-tight mb-2">Meus Projetos</h1>
                    <p className="text-foreground/50 text-sm font-medium">
                        Gerencie, visualize e acompanhe o andamento das suas aplicações.
                    </p>
                </motion.div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {projects.length === 0 ? (
                        <motion.div initial={{opacity:0}} animate={{opacity:1}} className="col-span-full bg-surface border border-surface-border rounded-3xl p-16 text-center flex flex-col items-center">
                            <div className="w-16 h-16 bg-accent/10 rounded-2xl flex items-center justify-center mb-6">
                                <Monitor className="w-8 h-8 text-accent opacity-50" />
                            </div>
                            <h3 className="text-xl font-bold text-foreground mb-3">Nenhum projeto ativo</h3>
                            <p className="text-foreground/50 text-sm max-w-sm mb-6">Fale conosco ou acesse o Marketplace para adquirir seu primeiro Website ou Template.</p>
                            <button onClick={() => router.push('/dashboard/chat')} className="px-6 py-2.5 bg-accent text-white rounded-xl font-bold text-sm hover:opacity-90 transition-opacity">Falar com Consultor</button>
                        </motion.div>
                    ) : projects.map((proj, i) => {
                        const pct = proj.manual_progress || 0;
                        
                        return (
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: i * 0.05 }}
                            key={proj.id} 
                            className="bg-surface border border-surface-border rounded-3xl p-6 shadow-lg hover:shadow-xl hover:border-foreground/10 transition-all flex flex-col items-start relative overflow-hidden group"
                        >
                            <div className="w-full aspect-video bg-background border border-surface-border rounded-2xl mb-6 relative overflow-hidden">
                               <div className="absolute inset-0 bg-accent/5 opacity-0 group-hover:opacity-100 transition-opacity" />
                               <div className="h-full w-full flex items-center justify-center">
                                   {proj.deploy_url ? (
                                       <Monitor className="w-12 h-12 text-foreground/10" />
                                   ) : (
                                       <h3 className="text-5xl font-black text-foreground/5 uppercase tracking-tighter mix-blend-overlay">{proj.name.substring(0,3)}</h3>
                                   )}
                               </div>
                               {/* Status badge Overlay */}
                               <div className="absolute top-4 left-4 flex items-center gap-1.5 bg-background/80 backdrop-blur-md px-3 py-1.5 rounded-lg border border-surface-border text-xs font-bold text-foreground">
                                   <div className={`w-2 h-2 rounded-full ${pct === 100 ? 'bg-emerald-500' : 'bg-accent animate-pulse'}`} />
                                   {pct === 100 ? 'Publicado' : 'Em Progresso'}
                               </div>
                            </div>

                            <div className="flex flex-col w-full">
                                <h2 className="text-xl font-bold text-foreground mb-2 truncate" title={proj.name}>{proj.name}</h2>
                                <p className="text-xs text-foreground/50 mb-6 flex items-center gap-1.5">
                                   <ShieldCheck className="w-3.5 h-3.5 text-emerald-500"/> ID: {proj.id.substring(0,8)}
                                </p>

                                <div className="mb-6 w-full">
                                    <div className="flex justify-between items-center mb-2">
                                        <span className="text-xs font-bold text-foreground">Desenvolvimento</span>
                                        <span className="text-xs font-black text-accent">{pct}%</span>
                                    </div>
                                    <div className="w-full bg-background border border-surface-border h-2 rounded-full overflow-hidden">
                                        <motion.div 
                                            initial={{ width: 0 }}
                                            animate={{ width: `${pct}%` }}
                                            transition={{ duration: 1 }}
                                            className="bg-accent h-full rounded-full" 
                                        />
                                    </div>
                                </div>

                                <div className="flex items-center gap-3 w-full mt-auto">
                                    <button onClick={() => router.push(`/dashboard/kanban/${proj.id}`)} className="flex-1 bg-background border border-surface-border hover:bg-surface-border/50 text-foreground font-bold py-2.5 rounded-xl transition-all cursor-pointer hover:scale-[1.02] active:scale-[0.98] text-[13px]">
                                        Kanban
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
                                        className="w-10 h-10 flex shrink-0 items-center justify-center bg-foreground text-background font-bold rounded-xl hover:opacity-90 transition-all cursor-pointer hover:scale-[1.05] active:scale-[0.95]"
                                    >
                                        <ExternalLink className="w-4 h-4" />
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
