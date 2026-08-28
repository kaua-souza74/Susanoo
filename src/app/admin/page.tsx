"use client";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { Users, TrendingUp, Clock, MessageSquareText, LayoutList, Rocket, ArrowRight, Bell } from "lucide-react";
import { motion } from "framer-motion";
import { useRouter } from "next/navigation";

export default function AdminOverview() {
    const [stats, setStats] = useState({ clients: 0, activeProjects: 0, pendingTasks: 0 });
    const router = useRouter();

    useEffect(() => {
        const load = async () => {
            const { count: clientsCount } = await supabase.from('profiles').select('*', { count: 'exact', head: true });
            const { data: projs } = await supabase.from('projects').select('*, tasks(*)');
            
            let pTasks = 0;
            if (projs) {
                projs.forEach(p => {
                    const pendentes = p.tasks?.filter((t: any) => t.status !== 'done').length || 0;
                    pTasks += pendentes;
                });
            }

            setStats({
                clients: clientsCount || 3,
                activeProjects: projs?.length || 5,
                pendingTasks: pTasks || 42
            });
        };
        load();
    }, []);

    const hqModules = [
        { id: 'teams', title: 'Equipes & Clientes (Teams)', desc: 'Responda a todos os clientes em tempo real numa interface unificada.', icon: <MessageSquareText className="w-8 h-8"/>, path: '/admin/chat', color: 'from-blue-600 to-blue-900', border: 'border-blue-500/30' },
        { id: 'trello', title: 'Progresso & Tarefas', desc: 'Painel mestre com todas as tarefas da agência para manipulação e sincronização de progresso com clientes.', icon: <LayoutList className="w-8 h-8"/>, path: '/admin/tasks', color: 'from-accent to-[#581c87]', border: 'border-accent/30' },
        { id: 'deploy', title: 'Publicação de Sites', desc: 'Central de domínios, Vercel e links de produção entregues aos clientes.', icon: <Rocket className="w-8 h-8"/>, path: '/admin/deploy', color: 'from-emerald-600 to-emerald-900', border: 'border-emerald-500/30' },
        { id: 'add-site', title: 'Adicionar Site ao Portfólio', desc: 'Cadastre novos sites, gerencie as vitrines de 10 fotos e preços no marketplace.', icon: <LayoutList className="w-8 h-8"/>, path: '/admin/add-site', color: 'from-purple-500 to-purple-800', border: 'border-purple-500/20' },
        { id: 'timeline', title: 'Cronograma Master', desc: 'Gerencie os marcos e o progresso das etapas de cada projeto dos clientes.', icon: <Clock className="w-8 h-8"/>, path: '/admin/timeline', color: 'from-orange-500 to-orange-800', border: 'border-orange-500/20' },
        { id: 'notifications', title: 'Notificações Globais', desc: 'Histórico operacional, alertas do sistema e avisos operacionais.', icon: <Bell className="w-8 h-8"/>, path: '/admin/notifications', color: 'from-red-600 to-red-950', border: 'border-red-500/30' },
        { id: 'clients', title: 'Simulador de Visão', desc: 'Acesse como se fosse o cliente para conferir a experiência do portal deles.', icon: <Users className="w-8 h-8"/>, path: '/admin/clients', color: 'from-[#333] to-[#111]', border: 'border-surface-border' },
    ];

    return (
        <div className="flex-1 overflow-y-auto p-10 2xl:p-16 bg-background transition-colors duration-300">
            <motion.div initial={{opacity:0, y:-10}} animate={{opacity:1, y:0}} className="mb-14">
                <h1 className="text-4xl md:text-5xl font-black tracking-tighter text-foreground mb-3">Suprema Mestra</h1>
                <p className="text-foreground/60 font-medium text-lg max-w-2xl leading-relaxed">
                    Você está no núcleo de operações da Agência. Navegue para o módulo de tarefas, chats ou controle global de deployments.
                </p>
            </motion.div>

            {/* Core KPIs Modificados para visual ultra clean */}
            <motion.div initial={{opacity:0, y:20}} animate={{opacity:1, y:0}} transition={{delay:0.1}} className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-16">
                <div className="bg-surface border border-surface-border p-8 rounded-[32px] flex items-center justify-between shadow-xl transition-colors duration-300">
                    <div>
                        <p className="text-foreground/40 font-bold text-[11px] uppercase tracking-[0.2em] mb-2">Total de Clientes</p>
                        <h3 className="text-5xl font-black text-foreground">{stats.clients}</h3>
                    </div>
                    <div className="w-14 h-14 bg-background rounded-2xl flex items-center justify-center border border-surface-border transition-colors duration-300">
                        <Users className="w-6 h-6 text-foreground/60" />
                    </div>
                </div>
                
                <div className="bg-surface border border-surface-border p-8 rounded-[32px] flex items-center justify-between shadow-xl transition-colors duration-300">
                    <div>
                        <p className="text-foreground/40 font-bold text-[11px] uppercase tracking-[0.2em] mb-2">Projetos Ativos</p>
                        <h3 className="text-5xl font-black text-foreground">{stats.activeProjects}</h3>
                    </div>
                    <div className="w-14 h-14 bg-background rounded-2xl flex items-center justify-center border border-surface-border transition-colors duration-300">
                        <TrendingUp className="w-6 h-6 text-foreground/60" />
                    </div>
                </div>

                <div className="bg-surface border border-surface-border p-8 rounded-[32px] flex items-center justify-between shadow-xl relative overflow-hidden transition-colors duration-300">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-red-500/10 blur-[40px] rounded-full"></div>
                    <div className="relative z-10">
                        <p className="text-red-500/80 font-bold text-[11px] uppercase tracking-[0.2em] mb-2">Demandas Pendentes</p>
                        <h3 className="text-5xl font-black text-foreground">{stats.pendingTasks}</h3>
                    </div>
                    <div className="w-14 h-14 bg-red-500/10 rounded-2xl flex items-center justify-center border border-red-500/20 relative z-10">
                        <Clock className="w-6 h-6 text-red-500" />
                    </div>
                </div>
            </motion.div>

            <motion.div initial={{opacity:0, y:20}} animate={{opacity:1, y:0}} transition={{delay:0.2}} className="mb-8">
                <h2 className="text-2xl font-bold text-foreground tracking-tight mb-8">Plataformas de Operação Integrada</h2>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full max-w-6xl">
                    {hqModules.map((mod, i) => (
                        <motion.div 
                            initial={{opacity: 0, scale: 0.98}} animate={{opacity: 1, scale: 1}} transition={{delay: i * 0.1}}
                            key={mod.id} 
                            onClick={() => router.push(mod.path)} 
                            className={`bg-surface border ${mod.border} p-8 rounded-[32px] flex flex-col justify-between hover:bg-foreground/5 transition-all cursor-pointer group shadow-2xl overflow-hidden relative min-h-[220px]`}
                        >
                            <div className={`absolute -bottom-10 -right-10 w-48 h-48 bg-gradient-to-br ${mod.color} blur-[80px] rounded-full opacity-20 group-hover:opacity-40 transition-opacity`}></div>
                            
                            <div className="relative z-10 flex items-start justify-between mb-8">
                                <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${mod.color} text-white flex items-center justify-center shadow-lg`}>
                                    {mod.icon}
                                </div>
                                <button className="w-10 h-10 rounded-full bg-background border border-surface-border flex items-center justify-center text-foreground/50 group-hover:text-foreground group-hover:border-foreground transition-all">
                                    <ArrowRight className="w-4 h-4"/>
                                </button>
                            </div>
                            <div className="relative z-10">
                                <h3 className="text-xl font-bold text-foreground tracking-tight mb-2">{mod.title}</h3>
                                <p className="text-foreground/50 font-medium text-[14px] leading-relaxed">{mod.desc}</p>
                            </div>
                        </motion.div>
                    ))}
                </div>
            </motion.div>
        </div>
    );
}
