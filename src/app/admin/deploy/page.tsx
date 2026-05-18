"use client";
import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { Globe, Rocket, ExternalLink, ShieldCheck, Activity, Terminal, RefreshCw, Layers, CheckCircle2, AlertCircle } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export default function AdminDeploy() {
    const [projects, setProjects] = useState<any[]>([]);
    const [deployingId, setDeployingId] = useState<string | null>(null);

    useEffect(() => {
        const load = async () => {
            const { data } = await supabase.from('projects').select('*').order('name');
            setProjects(data || []);
        };
        load();

        const sub = supabase.channel('deploy_changes')
            .on('postgres_changes', { event: '*', schema: 'public', table: 'projects' }, () => {
                load();
            })
            .subscribe();
        
        return () => { supabase.removeChannel(sub) };
    }, []);

    const handleDeploy = async (id: string) => {
        setDeployingId(id);
        
        // Simulação de Deploy em Tempo Real
        await supabase.from('projects').update({ 
            deploy_status: 'building'
        }).eq('id', id);

        setTimeout(async () => {
            await supabase.from('projects').update({ 
                deploy_status: 'ready',
                last_deploy: new Date().toISOString()
            }).eq('id', id);
            setDeployingId(null);
        }, 5000);
    };

    return (
        <div className="flex-1 overflow-y-auto p-8 md:p-12 2xl:p-16 bg-[#050505] flex flex-col h-full overflow-x-hidden">
            
            {/* Header Estratégico */}
            <div className="mb-12">
                <div className="flex items-center gap-3 mb-4">
                    <div className="bg-accent/10 p-2 rounded-lg border border-accent/20">
                        <Rocket className="w-6 h-6 text-accent" />
                    </div>
                    <span className="text-[10px] font-black uppercase tracking-[0.3em] text-accent">Susanoo Engine v2.0</span>
                </div>
                <h1 className="text-5xl font-black text-white tracking-tighter mb-4">Deploy HQ</h1>
                <p className="text-[#888] font-medium text-lg max-w-2xl">Gerencie a infraestrutura, domínios e ciclos de publicação de todos os sites da agência em tempo real.</p>
            </div>

            {/* Grid de Projetos & Status */}
            <div className="grid grid-cols-1 xl:grid-cols-2 2xl:grid-cols-3 gap-8 mb-12">
                {projects.map((proj) => (
                    <motion.div 
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        key={proj.id}
                        className="bg-[#0a0a0a] border border-[#1a1a1a] rounded-[32px] p-8 flex flex-col relative overflow-hidden group hover:border-accent/30 transition-all shadow-2xl"
                    >
                        {/* Background subtle glow */}
                        <div className="absolute top-0 right-0 w-32 h-32 bg-accent/5 blur-[80px] -mr-16 -mt-16 pointer-events-none group-hover:bg-accent/10 transition-colors" />

                        <div className="flex justify-between items-start mb-8">
                            <div>
                                <h3 className="text-2xl font-black text-white tracking-tight mb-2 uppercase">{proj.name}</h3>
                                <div className="flex items-center gap-2">
                                    <Globe className="w-3.5 h-3.5 text-[#555]" />
                                    <span className="text-[#555] text-xs font-bold font-mono tracking-wider">{proj.deploy_url || "aguardando-dominio.com"}</span>
                                </div>
                            </div>
                            <div className={`px-4 py-2 rounded-full border text-[10px] font-black uppercase tracking-widest flex items-center gap-2 ${
                                proj.deploy_status === 'ready' ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-500' :
                                proj.deploy_status === 'building' ? 'bg-blue-500/10 border-blue-500/20 text-blue-500 animate-pulse' :
                                'bg-[#1a1a1a] border-[#333] text-[#666]'
                            }`}>
                                <div className={`w-1.5 h-1.5 rounded-full ${
                                    proj.deploy_status === 'ready' ? 'bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.5)]' :
                                    proj.deploy_status === 'building' ? 'bg-blue-500 shadow-[0_0_10px_rgba(59,130,246,0.5)]' :
                                    'bg-[#444]'
                                }`} />
                                {proj.deploy_status === 'ready' ? 'Produção: Ativo' : 
                                 proj.deploy_status === 'building' ? 'Publicando...' : 'Aguardando Operação'}
                            </div>
                        </div>

                        {/* Estatísticas de Deploy */}
                        <div className="grid grid-cols-2 gap-4 mb-8">
                            <div className="bg-[#111] border border-[#222] p-4 rounded-2xl">
                                <span className="text-[10px] font-black text-[#555] uppercase block mb-1">Ambiente</span>
                                <span className="text-white font-bold text-sm flex items-center gap-2">
                                    <ShieldCheck className="w-3.5 h-3.5 text-accent" /> {proj.environment || "Production"}
                                </span>
                            </div>
                            <div className="bg-[#111] border border-[#222] p-4 rounded-2xl">
                                <span className="text-[10px] font-black text-[#555] uppercase block mb-1">Último Update</span>
                                <span className="text-white font-bold text-sm">
                                    {proj.last_deploy ? new Date(proj.last_deploy).toLocaleDateString('pt-BR') : "--/--/--"}
                                </span>
                            </div>
                        </div>

                        {/* Ações */}
                        <div className="flex gap-4 mt-auto">
                            <button 
                                onClick={() => handleDeploy(proj.id)}
                                disabled={proj.deploy_status === 'building' || deployingId === proj.id}
                                className="flex-1 bg-white text-black font-black uppercase text-[11px] tracking-[0.1em] py-4 rounded-xl hover:bg-neutral-200 transition-all shadow-[0_0_30px_rgba(255,255,255,0.05)] flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {proj.deploy_status === 'building' ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Rocket className="w-4 h-4" />}
                                Push to Production
                            </button>
                            <a 
                                href={proj.deploy_url ? (proj.deploy_url.startsWith('http') ? proj.deploy_url : `https://${proj.deploy_url}`) : '#'} 
                                target="_blank"
                                className="w-14 h-14 bg-[#111] border border-[#222] rounded-xl flex items-center justify-center text-[#888] hover:text-white hover:border-accent transition-all group/link"
                            >
                                <ExternalLink className="w-5 h-5 group-hover/link:scale-110 transition-transform" />
                            </a>
                        </div>
                    </motion.div>
                ))}

                {/* Card de Adicionar Projeto Rapido */}
                <button className="bg-[#050505] border-2 border-dashed border-[#222] rounded-[32px] p-8 flex flex-col items-center justify-center group hover:border-accent/40 transition-all min-h-[300px]">
                    <div className="w-16 h-16 bg-[#111] rounded-full flex items-center justify-center border border-[#222] mb-4 group-hover:scale-110 transition-transform">
                        <Layers className="w-6 h-6 text-[#555] group-hover:text-accent" />
                    </div>
                    <span className="font-black text-white uppercase tracking-widest text-sm">Escalável: Novo Domínio</span>
                    <span className="text-[#555] text-xs font-medium mt-2">Vincular novo ambiente à Susanoo HQ</span>
                </button>
            </div>

            {/* Terminal de Logs Global */}
            <div className="mt-auto">
                <div className="flex items-center justify-between mb-4 px-2">
                    <h2 className="text-xl font-extrabold text-white tracking-tight flex items-center gap-2">
                        <Terminal className="w-5 h-5 text-accent" /> Network & Logs
                    </h2>
                    <div className="flex items-center gap-4">
                        <div className="flex items-center gap-2">
                            <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                            <span className="text-[10px] font-bold text-[#666] uppercase">Vercel API: Connected</span>
                        </div>
                    </div>
                </div>
                <div className="bg-[#0a0a0a] border border-[#1a1a1a] rounded-[24px] p-6 font-mono text-[12px] text-[#555] leading-relaxed shadow-2xl">
                    <div className="flex gap-2 mb-2">
                        <span className="text-accent underline underline-offset-4 font-bold">[SUS_LOG_OK]</span>
                        <span>{new Date().toISOString()} - Módulo de Deploy Inicializado com sucesso.</span>
                    </div>
                    <div className="flex gap-2 mb-2 opacity-80">
                        <span className="text-blue-500 font-bold">[NETWORK]</span>
                        <span>Iniciando monitoramento de SSL de {projects.length} domínios ativos.</span>
                    </div>
                    <div className="flex gap-2 mb-2 opacity-60">
                        <span className="text-[#333] font-bold">[IDLE]</span>
                        <span>Aguardando comando do Sócio...</span>
                    </div>
                </div>
            </div>

        </div>
    );
}
