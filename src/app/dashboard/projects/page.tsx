"use client";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { useRouter } from "next/navigation";
import { 
  ArrowRight, 
  ExternalLink, 
  ShieldCheck, 
  Zap, 
  ShoppingBag, 
  Monitor, 
  Calendar, 
  MessageSquareText, 
  Clock, 
  CheckCircle2,
  Sparkles,
  Search,
  Package
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export default function MyPurchasesPage() {
    const [projects, setProjects] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState("");
    const router = useRouter();

    useEffect(() => {
      const fetchData = async () => {
          const { data: { session } } = await supabase.auth.getSession();
          if (!session) {
             router.push("/login"); return;
          }
          
          const { data: projs } = await supabase
            .from('projects')
            .select('*')
            .eq('client_id', session.user.id)
            .order('created_at', { ascending: false });
          
          setProjects(projs || []);
          setLoading(false);
      };

      fetchData();

      const sub = supabase.channel('client_purchases_sync')
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

    const filtered = projects.filter(p => (p.name || "").toLowerCase().includes(search.toLowerCase()));
    const completedCount = projects.filter(p => (p.manual_progress || 0) === 100).length;
    const inProgressCount = projects.length - completedCount;

    return (
        <div className="flex-1 overflow-y-auto w-full bg-background custom-scrollbar pb-24 p-6 md:p-10 text-foreground transition-colors duration-300">
            <div className="w-full max-w-7xl mx-auto flex flex-col space-y-8">
                
                {/* Header da Página */}
                <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="flex flex-col md:flex-row md:items-end justify-between gap-6">
                    <div>
                        <div className="flex items-center gap-2 mb-2">
                            <span className="text-[10px] font-black uppercase tracking-[0.25em] text-accent bg-accent/10 border border-accent/20 px-3 py-1 rounded-full flex items-center gap-1.5">
                                <ShoppingBag className="w-3.5 h-3.5" /> Área do Comprador
                            </span>
                        </div>
                        <h1 className="text-3xl md:text-5xl font-black text-foreground tracking-tight">Minhas Compras</h1>
                        <p className="text-foreground/50 text-sm font-medium mt-1">
                            Acompanhe o desenvolvimento, progresso e publicação dos sites e templates adquiridos.
                        </p>
                    </div>

                    {projects.length > 0 && (
                        <div className="flex items-center gap-3">
                            <div className="bg-surface border border-surface-border px-4 py-2.5 rounded-2xl flex items-center gap-2 shadow-sm">
                                <Package className="w-4 h-4 text-accent" />
                                <span className="text-xs font-bold text-foreground">{projects.length} {projects.length === 1 ? 'Site Comprado' : 'Sites Comprados'}</span>
                            </div>
                            <button 
                                onClick={() => router.push('/dashboard')}
                                className="px-5 py-2.5 bg-accent hover:bg-accent/90 text-white rounded-2xl font-black text-xs uppercase tracking-wider transition-all shadow-lg shadow-accent/20 flex items-center gap-1.5 cursor-pointer"
                            >
                                <Sparkles className="w-3.5 h-3.5" /> Explorar Mais Sites
                            </button>
                        </div>
                    )}
                </motion.div>

                {/* Métricas Rápidas */}
                {projects.length > 0 && (
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                        <div className="bg-surface border border-surface-border p-5 rounded-2xl flex items-center justify-between">
                            <div>
                                <span className="text-[10px] font-black text-foreground/40 uppercase tracking-widest block mb-1">Total Adquirido</span>
                                <span className="text-2xl font-black text-foreground">{projects.length}</span>
                            </div>
                            <div className="w-12 h-12 rounded-xl bg-accent/10 border border-accent/20 flex items-center justify-center text-accent">
                                <ShoppingBag className="w-6 h-6" />
                            </div>
                        </div>

                        <div className="bg-surface border border-surface-border p-5 rounded-2xl flex items-center justify-between">
                            <div>
                                <span className="text-[10px] font-black text-foreground/40 uppercase tracking-widest block mb-1">Em Desenvolvimento</span>
                                <span className="text-2xl font-black text-accent">{inProgressCount}</span>
                            </div>
                            <div className="w-12 h-12 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-500">
                                <Clock className="w-6 h-6" />
                            </div>
                        </div>

                        <div className="bg-surface border border-surface-border p-5 rounded-2xl flex items-center justify-between">
                            <div>
                                <span className="text-[10px] font-black text-foreground/40 uppercase tracking-widest block mb-1">Prontos / Publicados</span>
                                <span className="text-2xl font-black text-emerald-500">{completedCount}</span>
                            </div>
                            <div className="w-12 h-12 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-500">
                                <CheckCircle2 className="w-6 h-6" />
                            </div>
                        </div>
                    </div>
                )}

                {/* Barra de Pesquisa */}
                {projects.length > 0 && (
                    <div className="relative max-w-md">
                        <Search className="w-4 h-4 absolute left-4 top-1/2 -translate-y-1/2 text-foreground/30" />
                        <input 
                            type="text" 
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            placeholder="Buscar nas minhas compras..."
                            className="w-full bg-surface border border-surface-border rounded-xl py-3 pl-11 pr-4 text-xs font-medium text-foreground focus:border-accent outline-none transition-all placeholder:text-foreground/30"
                        />
                    </div>
                )}

                {/* Grid de Compras */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {projects.length === 0 ? (
                        <motion.div initial={{opacity:0}} animate={{opacity:1}} className="col-span-full bg-surface border border-surface-border rounded-3xl p-16 text-center flex flex-col items-center shadow-sm">
                            <div className="w-20 h-20 bg-accent/10 border border-accent/20 rounded-3xl flex items-center justify-center mb-6">
                                <ShoppingBag className="w-10 h-10 text-accent" />
                            </div>
                            <h3 className="text-2xl font-black text-foreground mb-2">Nenhum site comprado ainda</h3>
                            <p className="text-foreground/50 text-sm max-w-md mb-8 font-medium">
                                Você ainda não possui nenhum site ou template ativo na sua conta. Explore nosso Marketplace e garanta seu site pronto com suporte e garantia.
                            </p>
                            <button 
                                onClick={() => router.push('/dashboard')} 
                                className="px-8 py-4 bg-accent hover:bg-accent/90 text-white rounded-2xl font-black text-sm uppercase tracking-wider transition-all shadow-xl shadow-accent/25 flex items-center gap-2 cursor-pointer"
                            >
                                <Sparkles className="w-4 h-4" /> Ir para o Marketplace
                            </button>
                        </motion.div>
                    ) : filtered.length === 0 ? (
                        <div className="col-span-full py-16 text-center text-foreground/40 font-bold">
                            Nenhuma compra encontrada com o termo pesquisado.
                        </div>
                    ) : filtered.map((proj, i) => {
                        const pct = proj.manual_progress || 0;
                        const isDone = pct === 100;
                        
                        return (
                        <motion.div
                            initial={{ opacity: 0, y: 15 }} 
                            animate={{ opacity: 1, y: 0 }} 
                            transition={{ delay: i * 0.05 }}
                            key={proj.id} 
                            className="bg-surface border border-surface-border rounded-3xl p-6 shadow-sm hover:shadow-xl hover:border-accent/30 transition-all flex flex-col justify-between relative overflow-hidden group"
                        >
                            <div>
                                {/* Capa / Preview */}
                                <div className="w-full aspect-video bg-background border border-surface-border rounded-2xl mb-5 relative overflow-hidden">
                                   {proj.cover_url ? (
                                       <img src={proj.cover_url} alt={proj.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                                   ) : (
                                       <div className="h-full w-full flex items-center justify-center">
                                           <h3 className="text-5xl font-black text-foreground/10 uppercase tracking-tighter italic">{proj.name.substring(0,3)}</h3>
                                       </div>
                                   )}
                                   
                                   {/* Status badge Overlay */}
                                   <div className="absolute top-3 left-3 flex items-center gap-1.5 bg-background/90 backdrop-blur-md px-3 py-1.5 rounded-xl border border-surface-border text-[11px] font-black text-foreground shadow-md">
                                       <div className={`w-2 h-2 rounded-full ${isDone ? 'bg-emerald-500' : 'bg-accent animate-pulse'}`} />
                                       {isDone ? 'Site Publicado' : 'Em Desenvolvimento'}
                                   </div>

                                   <div className="absolute top-3 right-3 bg-accent text-white px-2.5 py-1 rounded-lg text-[9px] font-black uppercase tracking-wider shadow-sm">
                                       Licença Ativa
                                   </div>
                                </div>

                                {/* Informações do Produto */}
                                <div className="flex flex-col w-full mb-6">
                                    <div className="flex items-center justify-between gap-2 mb-1.5">
                                        <h2 className="text-xl font-black text-foreground truncate" title={proj.name}>{proj.name}</h2>
                                    </div>
                                    
                                    <div className="flex items-center justify-between text-xs text-foreground/45 mb-4">
                                       <span className="flex items-center gap-1">
                                         <ShieldCheck className="w-3.5 h-3.5 text-emerald-500"/> Pedido #{proj.id.substring(0,8)}
                                       </span>
                                       <span>{new Date(proj.created_at || Date.now()).toLocaleDateString('pt-BR')}</span>
                                    </div>

                                    {/* Barra de Progresso */}
                                    <div className="bg-background border border-surface-border rounded-2xl p-4 mb-2">
                                        <div className="flex justify-between items-center mb-2">
                                            <span className="text-xs font-bold text-foreground/70 flex items-center gap-1.5">
                                                <Zap className="w-3.5 h-3.5 text-accent" /> Progresso do Projeto
                                            </span>
                                            <span className="text-xs font-black text-accent">{pct}%</span>
                                        </div>
                                        <div className="w-full bg-surface border border-surface-border h-2.5 rounded-full overflow-hidden">
                                            <motion.div 
                                                initial={{ width: 0 }}
                                                animate={{ width: `${pct}%` }}
                                                transition={{ duration: 1 }}
                                                className="bg-accent h-full rounded-full" 
                                            />
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Ações */}
                            <div className="flex flex-col gap-2.5 w-full pt-4 border-t border-surface-border">
                                <button 
                                    onClick={() => router.push(`/dashboard/timeline?project=${proj.id}`)} 
                                    className="w-full bg-accent hover:bg-accent/90 text-white font-black py-3 rounded-xl transition-all cursor-pointer hover:scale-[1.02] active:scale-[0.98] text-xs uppercase tracking-wider flex items-center justify-center gap-2 shadow-md shadow-accent/20"
                                >
                                    <Calendar className="w-4 h-4" /> Acompanhar Progresso
                                </button>
                                
                                <div className="flex items-center gap-2">
                                    <button 
                                        onClick={() => router.push('/dashboard/chat')} 
                                        className="flex-1 bg-surface border border-surface-border hover:bg-surface-border/50 text-foreground font-bold py-2.5 rounded-xl transition-all cursor-pointer text-xs flex items-center justify-center gap-1.5"
                                    >
                                        <MessageSquareText className="w-3.5 h-3.5 text-accent" /> Chat com a Equipe
                                    </button>

                                    {proj.deploy_url && (
                                        <button 
                                            onClick={() => {
                                                const url = proj.deploy_url.startsWith('http') ? proj.deploy_url : `https://${proj.deploy_url}`;
                                                window.open(url, '_blank');
                                            }}
                                            title="Abrir site no ar"
                                            className="px-3.5 py-2.5 bg-foreground text-background font-bold rounded-xl hover:opacity-90 transition-all cursor-pointer hover:scale-[1.05] active:scale-[0.95] text-xs flex items-center gap-1"
                                        >
                                            <ExternalLink className="w-3.5 h-3.5" />
                                        </button>
                                    )}
                                </div>
                            </div>
                        </motion.div>
                    )})}
                </div>
            </div>
        </div>
    );
}
