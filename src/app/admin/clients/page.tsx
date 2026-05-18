"use client";
import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { Users, Search, Calendar, MoreHorizontal, UserPlus, Shield, BadgeCheck } from "lucide-react";
import { motion } from "framer-motion";

export default function AdminClients() {
    const [clients, setClients] = useState<any[]>([]);
    const [searchTerm, setSearchTerm] = useState("");

    useEffect(() => {
        const load = async () => {
            const { data } = await supabase.from('profiles').select('*').order('created_at', { ascending: false });
            setClients(data || []);
        };
        load();
    }, []);

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

            {/* Tabela de Clientes */}
            <div className="bg-surface border border-surface-border rounded-[32px] overflow-hidden shadow-2xl transition-colors duration-300">
                <table className="w-full text-left border-collapse">
                    <thead>
                        <tr className="border-b border-surface-border bg-background transition-colors duration-300">
                            <th className="p-6 text-[10px] font-black text-foreground/40 uppercase tracking-[0.2em]">Cliente</th>
                            <th className="p-6 text-[10px] font-black text-foreground/40 uppercase tracking-[0.2em]">Email Principal</th>
                            <th className="p-6 text-[10px] font-black text-foreground/40 uppercase tracking-[0.2em]">Data de Ingresso</th>
                            <th className="p-6 text-[10px] font-black text-foreground/40 uppercase tracking-[0.2em]">Nível</th>
                            <th className="p-6 text-[10px] font-black text-foreground/40 uppercase tracking-[0.2em] text-right">Ações</th>
                        </tr>
                    </thead>
                    <tbody>
                        {filteredClients.map((client) => (
                            <tr key={client.id} className="border-b border-surface-border hover:bg-foreground/5 transition-colors group">
                                <td className="p-6">
                                    <div className="flex items-center gap-4">
                                        <div className="w-10 h-10 rounded-xl bg-background border border-surface-border flex items-center justify-center text-foreground font-bold text-sm transition-colors duration-300">
                                            {client.name?.charAt(0).toUpperCase() || "U"}
                                        </div>
                                        <div>
                                            <span className="block text-foreground font-bold text-sm tracking-tight">{client.name || "Usuário Global"}</span>
                                            <span className="text-[10px] text-foreground/40 font-bold uppercase tracking-wider">ID: {client.id.substring(0,8)}</span>
                                        </div>
                                    </div>
                                </td>
                                <td className="p-6 text-sm text-foreground/60 font-medium">{client.email || "não-vinculado@site.com"}</td>
                                <td className="p-6">
                                    <div className="flex items-center gap-2 text-sm text-foreground/60 font-medium">
                                        <Calendar className="w-4 h-4 text-foreground/30" />
                                        {client.created_at ? new Date(client.created_at).toLocaleDateString('pt-BR') : "--/--/--"}
                                    </div>
                                </td>
                                <td className="p-6">
                                    <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-full border text-[9px] font-black uppercase tracking-widest ${
                                        client.role === 'admin' ? 'bg-accent/10 border-accent/20 text-accent' : 'bg-emerald-500/10 border-emerald-500/20 text-emerald-500'
                                    }`}>
                                        {client.role === 'admin' ? <Shield className="w-3 h-3" /> : <BadgeCheck className="w-3 h-3" />}
                                        {client.role === 'admin' ? "Sócio" : "Parceiro"}
                                    </div>
                                </td>
                                <td className="p-6 text-right">
                                    <button className="p-2 text-foreground/30 hover:text-foreground transition-colors">
                                        <MoreHorizontal className="w-5 h-5" />
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>

                {filteredClients.length === 0 && (
                    <div className="p-20 flex flex-col items-center justify-center text-center">
                        <div className="w-16 h-16 bg-background rounded-full flex items-center justify-center mb-4 border border-surface-border transition-colors duration-300">
                            <UserPlus className="w-6 h-6 text-foreground/30" />
                        </div>
                        <h4 className="text-foreground font-bold mb-1">Nenhum parceiro encontrado</h4>
                        <p className="text-foreground/40 text-sm font-medium">Tente ajustar os termos da sua busca.</p>
                    </div>
                )}
            </div>

            {/* Footer de Suporte */}
            <div className="mt-12 flex flex-col sm:flex-row items-center justify-between border-t border-surface-border pt-8 gap-4 px-4 transition-colors duration-300">
                <span className="text-[11px] font-bold text-foreground/30 uppercase tracking-widest">Base de Dados Supabase Realtime</span>
                <div className="flex gap-8">
                    <div className="flex items-center gap-2">
                        <span className="text-[11px] font-bold text-foreground/60">Total: {clients.length}</span>
                    </div>
                </div>
            </div>

        </div>
    );
}
