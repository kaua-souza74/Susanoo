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
  Calendar, 
  MessageSquareText, 
  Clock, 
  CheckCircle2,
  Sparkles,
  Search,
  Package,
  ArrowUpRight
} from "lucide-react";
import { motion } from "framer-motion";

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
        <div className="flex-1 h-full w-full bg-background flex items-center justify-center min-h-[70vh]">
            <div className="w-8 h-8 border-2 border-surface-border border-t-accent rounded-full animate-spin" />
        </div>
    );

    const filtered = projects.filter(p => (p.name || "").toLowerCase().includes(search.toLowerCase()));
    const completedCount = projects.filter(p => (p.manual_progress || 0) === 100).length;
    const inProgressCount = projects.length - completedCount;

    return (
        <div className="flex-1 overflow-y-auto w-full bg-background custom-scrollbar pb-24 p-6 md:p-10 text-foreground transition-colors duration-300">
            <div className="w-full max-w-6xl mx-auto flex flex-col space-y-8">
                
                {/* Header da Página */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-surface-border">
                    <div className="space-y-1">
                        <div className="flex items-center gap-2">
                            <span className="text-[11px] font-semibold text-accent uppercase tracking-wider flex items-center gap-1.5">
                                <ShoppingBag className="w-3.5 h-3.5" /> Painel de Compras
                            </span>
                        </div>
                        <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-foreground">
                            Minhas Compras
                        </h1>
                        <p className="text-xs md:text-sm text-foreground/50">
                            Gerencie seus sites adquiridos, acompanhe o cronograma e converse com a equipe.
                        </p>
                    </div>

                    {projects.length > 0 && (
                        <button 
                            onClick={() => router.push('/dashboard')}
                            className="self-start sm:self-center px-4 py-2.5 bg-accent hover:bg-accent/90 text-white rounded-xl font-semibold text-xs transition-all shadow-md shadow-accent/20 flex items-center gap-2 cursor-pointer"
                        >
                            <Sparkles className="w-3.5 h-3.5" /> Explorar Marketplace
                        </button>
                    )}
                </div>

                {/* Métricas Rápidas */}
                {projects.length > 0 && (
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                        <div className="bg-surface border border-surface-border p-4 rounded-2xl flex items-center justify-between shadow-xs">
                            <div>
                                <span className="text-[11px] font-semibold text-foreground/50 uppercase tracking-wider block mb-1">Total de Sites</span>
                                <span className="text-2xl font-bold text-foreground">{projects.length}</span>
                            </div>
                            <div className="w-10 h-10 rounded-xl bg-accent/10 text-accent flex items-center justify-center">
                                <Package className="w-5 h-5" />
                            </div>
                        </div>

                        <div className="bg-surface border border-surface-border p-4 rounded-2xl flex items-center justify-between shadow-xs">
                            <div>
                                <span className="text-[11px] font-semibold text-foreground/50 uppercase tracking-wider block mb-1">Em Desenvolvimento</span>
                                <span className="text-2xl font-bold text-accent">{inProgressCount}</span>
                            </div>
                            <div className="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-500 flex items-center justify-center">
                                <Clock className="w-5 h-5" />
                            </div>
                        </div>

                        <div className="bg-surface border border-surface-border p-4 rounded-2xl flex items-center justify-between shadow-xs">
                            <div>
                                <span className="text-[11px] font-semibold text-foreground/50 uppercase tracking-wider block mb-1">Concluídos / Online</span>
                                <span className="text-2xl font-bold text-emerald-500">{completedCount}</span>
                            </div>
                            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-500 flex items-center justify-center">
                                <CheckCircle2 className="w-5 h-5" />
                            </div>
                        </div>
                    </div>
                )}

                {/* Barra de Pesquisa */}
                {projects.length > 0 && (
                    <div className="relative max-w-sm">
                        <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-foreground/35" />
                        <input 
                            type="text" 
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            placeholder="Buscar compras..."
                            className="w-full bg-surface border border-surface-border rounded-xl py-2 pl-10 pr-4 text-xs font-medium text-foreground focus:border-accent outline-none transition-all placeholder:text-foreground/30 shadow-xs"
                        />
                    </div>
                )}

                {/* Grid de Compras */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {projects.length === 0 ? (
                        <div className="col-span-full bg-surface border border-surface-border rounded-3xl p-12 text-center flex flex-col items-center shadow-xs">
                            <div className="w-14 h-14 bg-accent/10 border border-accent/20 rounded-2xl flex items-center justify-center mb-4">
                                <ShoppingBag className="w-7 h-7 text-accent" />
                            </div>
                            <h3 className="text-lg font-bold text-foreground mb-1">Nenhum site comprado ainda</h3>
                            <p className="text-foreground/50 text-xs md:text-sm max-w-sm mb-6 font-medium leading-relaxed">
                                Você ainda não possui nenhum site ativo. Acesse o marketplace para conhecer as opções com garantia de entrega e suporte.
                            </p>
                            <button 
                                onClick={() => router.push('/dashboard')} 
                                className="px-6 py-3 bg-accent hover:bg-accent/90 text-white rounded-xl font-semibold text-xs uppercase tracking-wider transition-all shadow-md shadow-accent/20 flex items-center gap-2 cursor-pointer"
                            >
                                <Sparkles className="w-4 h-4" /> Ver Catálogo de Sites
                            </button>
                        </div>
                    ) : filtered.length === 0 ? (
                        <div className="col-span-full py-12 text-center text-foreground/40 text-xs font-semibold">
                            Nenhum site encontrado para a busca &ldquo;{search}&rdquo;.
                        </div>
                    ) : filtered.map((proj, i) => {
                        const pct = proj.manual_progress || 0;
                        const isDone = pct === 100;
                        
                        return (
                        <motion.div
                            initial={{ opacity: 0, y: 10 }} 
                            animate={{ opacity: 1, y: 0 }} 
                            transition={{ delay: i * 0.04 }}
                            key={proj.id} 
                            className="bg-surface border border-surface-border rounded-2xl p-5 shadow-xs hover:border-accent/40 transition-all flex flex-col justify-between group"
                        >
                            <div>
                                {/* Capa / Preview Minimalista */}
                                <div className="w-full aspect-[16/10] bg-background border border-surface-border rounded-xl mb-4 relative overflow-hidden">
                                   {proj.cover_url ? (
                                       <img src={proj.cover_url} alt={proj.name} className="w-full h-full object-cover group-hover:scale-102 transition-transform duration-300" />
                                   ) : (
                                       <div className="h-full w-full flex items-center justify-center">
                                           <span className="text-3xl font-black text-foreground/10 uppercase tracking-tight">
                                               {proj.name.substring(0,3)}
                                           </span>
                                       </div>
                                   )}
                                   
                                   {/* Status badge Overlay */}
                                   <div className="absolute top-2.5 left-2.5 flex items-center gap-1.5 bg-background/90 backdrop-blur-md px-2.5 py-1 rounded-lg border border-surface-border text-[10px] font-semibold text-foreground shadow-xs">
                                       <span className={`w-1.5 h-1.5 rounded-full ${isDone ? 'bg-emerald-500' : 'bg-accent animate-pulse'}`} />
                                       {isDone ? 'Concluído' : 'Em Produção'}
                                   </div>

                                   <div className="absolute top-2.5 right-2.5 bg-black/60 backdrop-blur-md text-white px-2 py-0.5 rounded-md text-[9px] font-semibold">
                                       {pct}%
                                   </div>
                                </div>

                                {/* Informações do Produto */}
                                <div className="flex flex-col w-full mb-4">
                                    <h2 className="text-base font-bold text-foreground truncate" title={proj.name}>
                                        {proj.name}
                                    </h2>
                                    
                                    <div className="flex items-center justify-between text-[11px] text-foreground/45 mt-1 mb-3">
                                       <span className="flex items-center gap-1 font-mono">
                                         #{proj.id.substring(0, 8)}
                                       </span>
                                       <span>{new Date(proj.created_at || Date.now()).toLocaleDateString('pt-BR')}</span>
                                    </div>

                                    {/* Barra de Progresso Fina e Clean */}
                                    <div className="space-y-1.5">
                                        <div className="flex justify-between items-center text-[11px]">
                                            <span className="text-foreground/50 font-medium">Andamento</span>
                                            <span className="font-semibold text-accent">{pct}%</span>
                                        </div>
                                        <div className="w-full bg-background border border-surface-border h-1.5 rounded-full overflow-hidden">
                                            <div 
                                                className="bg-accent h-full rounded-full transition-all duration-500" 
                                                style={{ width: `${pct}%` }}
                                            />
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Ações */}
                            <div className="flex flex-col gap-2 pt-3 border-t border-surface-border/60">
                                <button 
                                    onClick={() => router.push(`/dashboard/timeline?project=${proj.id}`)} 
                                    className="w-full bg-accent hover:bg-accent/90 text-white font-semibold py-2.5 rounded-xl transition-all cursor-pointer text-xs flex items-center justify-center gap-2 shadow-xs"
                                >
                                    <Calendar className="w-3.5 h-3.5" /> Acompanhar no Cronograma
                                </button>
                                
                                <div className="flex items-center gap-2">
                                    <button 
                                        onClick={() => router.push('/dashboard/chat')} 
                                        className="flex-1 bg-surface border border-surface-border hover:border-foreground/20 text-foreground/80 font-medium py-2 rounded-xl transition-colors cursor-pointer text-xs flex items-center justify-center gap-1.5"
                                    >
                                        <MessageSquareText className="w-3.5 h-3.5 text-accent" /> Mensagens
                                    </button>

                                    {proj.deploy_url && (
                                        <button 
                                            onClick={() => {
                                                const url = proj.deploy_url.startsWith('http') ? proj.deploy_url : `https://${proj.deploy_url}`;
                                                window.open(url, '_blank');
                                            }}
                                            title="Abrir site no ar"
                                            className="px-3 py-2 bg-surface border border-surface-border hover:border-accent/40 rounded-xl text-foreground font-semibold transition-colors cursor-pointer text-xs flex items-center gap-1"
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
