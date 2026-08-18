"use client";
import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { 
    Users, 
    Search, 
    Calendar, 
    UserPlus, 
    Trash2,
    Mail,
    RefreshCw,
    X,
    FolderKanban,
    Copy,
    Check,
    ChevronRight,
    Clock,
    AlertTriangle,
    ExternalLink,
    BarChart3
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useRouter } from "next/navigation";

export default function AdminClients() {
    const router = useRouter();
    const [clients, setClients] = useState<any[]>([]);
    const [searchTerm, setSearchTerm] = useState("");
    const [loading, setLoading] = useState(true);
    const [selectedClient, setSelectedClient] = useState<any | null>(null);
    const [clientProjects, setClientProjects] = useState<any[]>([]);
    const [projectsLoading, setProjectsLoading] = useState(false);
    const [copiedId, setCopiedId] = useState<string | null>(null);

    const loadClients = async () => {
        setLoading(true);
        const { data } = await supabase
            .from('profiles')
            .select('*')
            .order('created_at', { ascending: false });
        
        if (data) setClients(data);
        setLoading(false);
    };

    const loadClientProjects = async (clientId: string) => {
        setProjectsLoading(true);
        const { data } = await supabase
            .from('projects')
            .select('*')
            .eq('client_id', clientId)
            .order('created_at', { ascending: false });
        setClientProjects(data || []);
        setProjectsLoading(false);
    };

    useEffect(() => {
        loadClients();
    }, []);

    const handleOpenClient = (client: any) => {
        setSelectedClient(client);
        loadClientProjects(client.id);
    };

    const handleDelete = async (id: string) => {
        if (!confirm("Tem certeza que deseja excluir este perfil? Isso não apagará a conta de login.")) return;
        const { error } = await supabase.from('profiles').delete().eq('id', id);
        if (error) {
            alert("Erro ao excluir: " + error.message);
        } else {
            setClients(prev => prev.filter(c => c.id !== id));
            if (selectedClient?.id === id) setSelectedClient(null);
        }
    };

    const copyToClipboard = (text: string, id: string) => {
        navigator.clipboard.writeText(text);
        setCopiedId(id);
        setTimeout(() => setCopiedId(null), 2000);
    };

    const filteredClients = clients.filter(c => 
        c.name?.toLowerCase().includes(searchTerm.toLowerCase()) || 
        c.email?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const pendingTimelines = clientProjects.filter(p => p.timeline_requested && !p.timeline_steps_count);

    return (
        <div className="flex-1 overflow-hidden flex h-full bg-background transition-colors duration-300">
            
            {/* Lista principal de clientes */}
            <div className={`flex flex-col h-full transition-all duration-300 ${selectedClient ? 'w-full lg:w-[460px] lg:border-r lg:border-surface-border' : 'w-full'} overflow-hidden`}>
                
                {/* Header */}
                <div className="p-6 md:p-8 border-b border-surface-border shrink-0">
                    <div className="flex items-center gap-3 mb-1">
                        <Users className="w-5 h-5 text-accent" />
                        <span className="text-[10px] font-black uppercase tracking-[0.3em] text-accent">Gestão de Contas</span>
                    </div>
                    <h1 className="text-3xl font-black text-foreground tracking-tighter mb-4">Clientes</h1>

                    <div className="flex gap-3">
                        <button 
                            id="refresh-clients-btn"
                            onClick={loadClients}
                            className="p-3 bg-surface border border-surface-border rounded-xl text-foreground hover:bg-foreground/5 transition-all cursor-pointer"
                            title="Atualizar Lista"
                        >
                            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                        </button>
                        <div className="relative flex-1">
                            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-foreground/30" />
                            <input 
                                id="client-search"
                                type="text" 
                                placeholder="Buscar cliente..." 
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="w-full bg-surface border border-surface-border rounded-xl py-3 pl-10 pr-4 text-sm text-foreground outline-none focus:border-accent transition-all"
                            />
                        </div>
                    </div>
                </div>

                {/* Lista de clientes */}
                <div className="flex-1 overflow-y-auto custom-scrollbar p-4 space-y-2">
                    <AnimatePresence>
                        {filteredClients.map((client) => (
                            <motion.div 
                                layout
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, scale: 0.95 }}
                                key={client.id}
                                onClick={() => handleOpenClient(client)}
                                className={`p-4 rounded-2xl border cursor-pointer transition-all flex items-center gap-4 group ${
                                    selectedClient?.id === client.id 
                                        ? 'bg-accent/5 border-accent/30 shadow-md' 
                                        : 'bg-surface border-surface-border hover:border-foreground/15 hover:bg-foreground/3'
                                }`}
                            >
                                <div className={`w-11 h-11 rounded-2xl flex items-center justify-center text-lg font-black shrink-0 ${
                                    selectedClient?.id === client.id ? 'bg-accent text-white' : 'bg-accent/10 text-accent'
                                }`}>
                                    {client.name?.charAt(0).toUpperCase() || "?"}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <h3 className="font-bold text-sm text-foreground truncate">{client.name || "Sem Nome"}</h3>
                                    <p className="text-xs text-foreground/50 truncate">{client.email || "E-mail oculto"}</p>
                                </div>
                                <div className="flex items-center gap-2 shrink-0">
                                    <span className={`text-[8px] font-black uppercase tracking-widest px-2 py-1 rounded-full border ${
                                        client.role === 'admin' 
                                            ? 'bg-accent/10 border-accent/20 text-accent' 
                                            : 'bg-emerald-500/5 border-emerald-500/10 text-emerald-500'
                                    }`}>
                                        {client.role === 'admin' ? "Admin" : "Cliente"}
                                    </span>
                                    <ChevronRight className={`w-4 h-4 transition-all ${selectedClient?.id === client.id ? 'text-accent rotate-90' : 'text-foreground/30 group-hover:text-foreground/60'}`} />
                                </div>
                            </motion.div>
                        ))}
                    </AnimatePresence>

                    {filteredClients.length === 0 && !loading && (
                        <div className="flex flex-col items-center justify-center py-20 text-center opacity-30">
                            <UserPlus className="w-12 h-12 mb-4" />
                            <p className="font-black uppercase tracking-[0.3em] text-sm">Nenhum cliente</p>
                        </div>
                    )}

                    {loading && (
                        <div className="flex items-center justify-center py-20">
                            <div className="w-8 h-8 border-4 border-accent border-t-transparent rounded-full animate-spin" />
                        </div>
                    )}
                </div>

                {/* Footer stats */}
                <div className="p-4 border-t border-surface-border shrink-0">
                    <div className="flex justify-between items-center">
                        <span className="text-[10px] font-black text-foreground/30 uppercase tracking-[0.2em]">Total de Contas</span>
                        <span className="text-[10px] font-black text-accent bg-accent/5 px-3 py-1.5 rounded-full border border-accent/10">{clients.length} registros</span>
                    </div>
                </div>
            </div>

            {/* Painel lateral — Detalhes do cliente */}
            <AnimatePresence>
                {selectedClient && (
                    <motion.div
                        initial={{ opacity: 0, x: 40 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: 40 }}
                        className="hidden lg:flex flex-1 flex-col h-full bg-background overflow-y-auto custom-scrollbar"
                    >
                        {/* Header do painel */}
                        <div className="p-8 border-b border-surface-border flex items-start justify-between shrink-0">
                            <div className="flex items-center gap-5">
                                <div className="w-16 h-16 rounded-3xl bg-accent/10 border border-accent/15 flex items-center justify-center text-accent font-black text-3xl">
                                    {selectedClient.name?.charAt(0).toUpperCase() || "?"}
                                </div>
                                <div>
                                    <h2 className="text-2xl font-black text-foreground tracking-tight">{selectedClient.name || "Sem Nome"}</h2>
                                    <div className={`mt-1.5 inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-[9px] font-black uppercase tracking-widest ${
                                        selectedClient.role === 'admin' ? 'bg-accent/10 border-accent/20 text-accent' : 'bg-emerald-500/5 border-emerald-500/10 text-emerald-500'
                                    }`}>
                                        {selectedClient.role === 'admin' ? "Sócio Staff" : "Cliente Oficial"}
                                    </div>
                                </div>
                            </div>
                            <button
                                id="close-client-panel-btn"
                                onClick={() => setSelectedClient(null)}
                                className="p-2 rounded-xl hover:bg-foreground/5 text-foreground/40 hover:text-foreground transition-colors cursor-pointer"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        <div className="p-8 flex flex-col gap-8">
                            
                            {/* Informações da conta */}
                            <div className="bg-surface border border-surface-border rounded-2xl p-5 space-y-4">
                                <h3 className="text-[10px] font-black uppercase tracking-[0.25em] text-foreground/40">Informações da Conta</h3>
                                
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <Mail className="w-4 h-4 text-foreground/40" />
                                        <span className="text-sm font-medium text-foreground">{selectedClient.email || "—"}</span>
                                    </div>
                                </div>

                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <Calendar className="w-4 h-4 text-foreground/40" />
                                        <span className="text-sm font-medium text-foreground">
                                            {selectedClient.created_at 
                                                ? `Cadastro em ${new Date(selectedClient.created_at).toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' })}` 
                                                : "—"}
                                        </span>
                                    </div>
                                </div>

                                <div className="pt-3 border-t border-surface-border">
                                    <p className="text-[10px] font-black text-foreground/30 uppercase tracking-[0.2em] mb-1.5">UID Completo</p>
                                    <div className="flex items-center justify-between bg-background rounded-xl p-3 border border-surface-border">
                                        <code className="text-xs font-mono text-foreground/60 truncate">{selectedClient.id}</code>
                                        <button
                                            id={`copy-uid-${selectedClient.id}`}
                                            onClick={() => copyToClipboard(selectedClient.id, selectedClient.id)}
                                            className="ml-3 p-1.5 hover:bg-foreground/10 rounded-lg transition-colors cursor-pointer text-foreground/40 hover:text-foreground shrink-0"
                                        >
                                            {copiedId === selectedClient.id ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                                        </button>
                                    </div>
                                </div>
                            </div>

                            {/* Projetos do cliente */}
                            <div>
                                <div className="flex items-center justify-between mb-4">
                                    <h3 className="text-[10px] font-black uppercase tracking-[0.25em] text-foreground/40 flex items-center gap-2">
                                        <FolderKanban className="w-4 h-4" /> Projetos Ativos
                                    </h3>
                                    <span className="text-[10px] font-black text-foreground/30">{clientProjects.length} projeto(s)</span>
                                </div>

                                {projectsLoading ? (
                                    <div className="flex items-center justify-center py-10">
                                        <div className="w-6 h-6 border-2 border-accent border-t-transparent rounded-full animate-spin" />
                                    </div>
                                ) : clientProjects.length === 0 ? (
                                    <div className="bg-surface border border-surface-border rounded-2xl p-8 text-center">
                                        <FolderKanban className="w-8 h-8 mx-auto mb-3 text-foreground/20" />
                                        <p className="text-sm font-bold text-foreground/40">Nenhum projeto ativo</p>
                                        <p className="text-xs text-foreground/30 mt-1">Este cliente ainda não possui projetos cadastrados.</p>
                                    </div>
                                ) : (
                                    <div className="space-y-3">
                                        {clientProjects.map((proj) => (
                                            <div key={proj.id} className="bg-surface border border-surface-border rounded-2xl p-4 space-y-3">
                                                <div className="flex items-start justify-between gap-3">
                                                    <div className="flex-1 min-w-0">
                                                        <div className="flex items-center gap-2 mb-1">
                                                            <h4 className="font-bold text-sm text-foreground truncate">{proj.name}</h4>
                                                            {proj.timeline_requested && (
                                                                <span className="shrink-0 flex items-center gap-1 text-[9px] font-black uppercase tracking-widest text-amber-500 bg-amber-500/10 border border-amber-500/20 px-2 py-0.5 rounded-full">
                                                                    <AlertTriangle className="w-2.5 h-2.5" /> Cronograma
                                                                </span>
                                                            )}
                                                        </div>
                                                        <div className="flex items-center gap-3 text-[10px] text-foreground/40 font-medium">
                                                            <span className="font-mono">ID: {proj.id.substring(0, 12)}...</span>
                                                            <button
                                                                onClick={() => copyToClipboard(proj.id, proj.id)}
                                                                className="hover:text-foreground transition-colors cursor-pointer"
                                                            >
                                                                {copiedId === proj.id ? <Check className="w-3 h-3 text-emerald-500" /> : <Copy className="w-3 h-3" />}
                                                            </button>
                                                        </div>
                                                    </div>
                                                    <div className="shrink-0 text-right">
                                                        <p className="text-lg font-black text-foreground">{proj.manual_progress || 0}%</p>
                                                        <p className="text-[9px] text-foreground/40 font-bold uppercase">Progresso</p>
                                                    </div>
                                                </div>

                                                {/* Barra de progresso */}
                                                <div className="w-full h-1.5 bg-background rounded-full overflow-hidden">
                                                    <div 
                                                        className="h-full bg-accent rounded-full transition-all duration-500"
                                                        style={{ width: `${proj.manual_progress || 0}%` }}
                                                    />
                                                </div>

                                                <div className="flex gap-2 pt-1">
                                                    <button
                                                        id={`go-timeline-${proj.id}`}
                                                        onClick={() => router.push(`/admin/timeline?project=${proj.id}`)}
                                                        className="flex-1 py-2 bg-accent/10 text-accent border border-accent/20 rounded-xl text-[11px] font-black uppercase tracking-widest hover:bg-accent hover:text-white transition-all cursor-pointer flex items-center justify-center gap-1.5"
                                                    >
                                                        <Clock className="w-3 h-3" /> Cronograma
                                                    </button>
                                                    {proj.deploy_url && proj.deploy_url !== 'susanoo-waiting.host' && (
                                                        <a
                                                            href={proj.deploy_url.startsWith('http') ? proj.deploy_url : `https://${proj.deploy_url}`}
                                                            target="_blank"
                                                            rel="noreferrer"
                                                            className="px-3 py-2 bg-surface border border-surface-border rounded-xl text-foreground/50 hover:text-foreground hover:border-foreground/20 transition-all cursor-pointer flex items-center gap-1.5 text-[11px] font-black"
                                                        >
                                                            <ExternalLink className="w-3 h-3" />
                                                        </a>
                                                    )}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>

                            {/* Ações perigosas */}
                            <div className="pt-4 border-t border-surface-border">
                                <button
                                    id={`delete-client-${selectedClient.id}`}
                                    onClick={() => handleDelete(selectedClient.id)}
                                    className="flex items-center gap-2 text-sm font-bold text-red-500/60 hover:text-red-500 hover:bg-red-500/10 px-4 py-2.5 rounded-xl transition-all cursor-pointer w-full justify-center"
                                >
                                    <Trash2 className="w-4 h-4" /> Excluir Perfil
                                </button>
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Estado vazio no painel direito (quando nenhum cliente selecionado) */}
            {!selectedClient && !loading && (
                <div className="hidden lg:flex flex-1 items-center justify-center text-center p-10 opacity-0">
                </div>
            )}
        </div>
    );
}
