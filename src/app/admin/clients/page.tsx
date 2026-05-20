"use client";
import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { 
    Users, 
    Search, 
    Calendar, 
    MoreHorizontal, 
    UserPlus, 
    Shield, 
    BadgeCheck,
    Trash2,
    Mail,
    RefreshCw,
    X
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export default function AdminClients() {
    const [clients, setClients] = useState<any[]>([]);
    const [searchTerm, setSearchTerm] = useState("");
    const [loading, setLoading] = useState(true);
    const [deletingId, setDeletingId] = useState<string | null>(null);

    const loadClients = async () => {
        setLoading(true);
        const { data, error } = await supabase
            .from('profiles')
            .select('*')
            .order('created_at', { ascending: false });
        
        if (data) setClients(data);
        setLoading(false);
    };

    useEffect(() => {
        loadClients();
    }, []);

    const handleDelete = async (id: string) => {
        if (!confirm("Tem certeza que deseja excluir este perfil? Isso não apagará a conta de login, apenas o registro no banco de dados publico.")) return;
        
        const { error } = await supabase.from('profiles').delete().eq('id', id);
        if (error) {
            alert("Erro ao excluir: " + error.message);
        } else {
            setClients(prev => prev.filter(c => c.id !== id));
        }
        setDeletingId(null);
    };

    const filteredClients = clients.filter(c => 
        c.name?.toLowerCase().includes(searchTerm.toLowerCase()) || 
        c.email?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="flex-1 overflow-y-auto p-8 md:p-12 2xl:p-16 bg-background flex flex-col h-full overflow-x-hidden transition-colors duration-300">
            
            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 mb-12">
                <div>
                    <div className="flex items-center gap-3 mb-4">
                        <Users className="w-6 h-6 text-accent" />
                        <span className="text-[10px] font-black uppercase tracking-[0.3em] text-accent">Gestão de Contas</span>
                    </div>
                    <h1 className="text-5xl font-black text-foreground tracking-tighter mb-4">Portfólio de Clientes</h1>
                    <p className="text-foreground/60 font-medium text-lg max-w-xl">Supervisione todos os parceiros que possuem acesso ao ecossistema Susanoo.</p>
                </div>
                <div className="flex gap-4 w-full md:w-auto">
                    <button 
                        onClick={loadClients}
                        className="p-4 bg-surface border border-surface-border rounded-xl text-foreground hover:bg-foreground/5 transition-all"
                        title="Atualizar Lista"
                    >
                        <RefreshCw className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} />
                    </button>
                    <div className="relative flex-1 md:w-80">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-foreground/30" />
                        <input 
                            type="text" 
                            placeholder="Buscar por nome ou e-mail..." 
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full bg-surface border border-surface-border rounded-xl py-4 pl-12 pr-4 text-sm text-foreground outline-none focus:border-accent transition-all"
                        />
                    </div>
                </div>
            </div>

            {/* Grid de Clientes (Mais moderno que tabela fixa) */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <AnimatePresence>
                    {filteredClients.map((client) => (
                        <motion.div 
                            layout
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                            key={client.id}
                            className="bg-surface border border-surface-border p-8 rounded-[40px] hover:border-accent/30 transition-all group relative overflow-hidden"
                        >
                            <div className="absolute top-0 right-0 p-6 opacity-0 group-hover:opacity-100 transition-opacity">
                                <button 
                                    onClick={() => handleDelete(client.id)}
                                    className="p-3 bg-red-500/10 text-red-500 hover:bg-red-500 hover:text-white rounded-2xl transition-all"
                                >
                                    <Trash2 className="w-5 h-5" />
                                </button>
                            </div>

                            <div className="flex flex-col gap-6">
                                <div className="flex items-center gap-5">
                                    <div className="w-16 h-16 rounded-3xl bg-accent/5 border border-accent/10 flex items-center justify-center text-accent font-black text-2xl">
                                        {client.name?.charAt(0).toUpperCase() || "?"}
                                    </div>
                                    <div>
                                        <h3 className="text-xl font-black tracking-tight text-foreground">{client.name || "Sem Nome"}</h3>
                                        <div className={`mt-1 inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full border text-[8px] font-black uppercase tracking-widest ${
                                            client.role === 'admin' ? 'bg-accent/10 border-accent/20 text-accent' : 'bg-emerald-500/5 border-emerald-500/10 text-emerald-500'
                                        }`}>
                                            {client.role === 'admin' ? "Sócio Staff" : "Cliente Oficial"}
                                        </div>
                                    </div>
                                </div>

                                <div className="space-y-4">
                                    <div className="flex items-center gap-3 text-foreground/40 font-bold text-xs uppercase tracking-widest break-all">
                                        <Mail className="w-4 h-4 shrink-0" /> {client.email || "E-mail oculto"}
                                    </div>
                                    <div className="flex items-center gap-3 text-foreground/40 font-bold text-xs uppercase tracking-widest">
                                        <Calendar className="w-4 h-4 shrink-0" /> 
                                        Ingresso em {client.created_at ? new Date(client.created_at).toLocaleDateString('pt-BR') : "--"}
                                    </div>
                                </div>

                                <div className="pt-6 border-t border-surface-border mt-2 flex justify-between items-center">
                                    <span className="text-[10px] font-black text-foreground/20 uppercase tracking-[0.2em]">UID: {client.id.substring(0,12)}...</span>
                                    <button className="text-[11px] font-black text-accent uppercase tracking-widest hover:underline">Ver Projeto</button>
                                </div>
                            </div>
                        </motion.div>
                    ))}
                </AnimatePresence>
            </div>

            {filteredClients.length === 0 && !loading && (
                <div className="flex-1 flex flex-col items-center justify-center py-40 opacity-20">
                    <UserPlus className="w-20 h-20 mb-6" />
                    <p className="font-black uppercase tracking-[0.4em] text-sm">Nenhum cliente mapeado</p>
                </div>
            )}

            {loading && (
                <div className="flex-1 flex items-center justify-center py-40">
                    <div className="w-10 h-10 border-4 border-accent border-t-transparent rounded-full animate-spin" />
                </div>
            )}

            {/* Stats */}
            <div className="mt-12 pt-8 border-t border-surface-border flex justify-between items-center px-4">
                <span className="text-[10px] font-black text-foreground/30 uppercase tracking-[0.3em]">Susanoo Cloud Records</span>
                <span className="text-[10px] font-black text-accent bg-accent/5 px-4 py-2 rounded-full border border-accent/10">Total de {clients.length} Contas Ativas</span>
            </div>
        </div>
    );
}
