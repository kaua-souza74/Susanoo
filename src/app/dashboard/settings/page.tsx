"use client";
import { useEffect, useState, useRef } from "react";
import { supabase } from "@/lib/supabase";
import { User, Shield, Bell, CheckCircle2, ChevronRight, ExternalLink } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useRouter } from "next/navigation";

export default function SettingsPage() {
    const [user, setUser] = useState<any>(null);
    const [activeTab, setActiveTab] = useState("profile");
    const [saved, setSaved] = useState(false);
    const router = useRouter();

    useEffect(() => {
        const load = async () => {
            const { data: { session } } = await supabase.auth.getSession();
            if (!session) return;
            setUser(session.user);
        };
        load();
    }, []);

    const handleSave = async () => {
        setSaved(true);
        setTimeout(() => setSaved(false), 2500);
    };

    const tabs = [
        { id: "profile", label: "Dados da Empresa", icon: <User className="w-5 h-5"/> },
        { id: "security", label: "Segurança", icon: <Shield className="w-5 h-5"/> },
        { id: "notifications", label: "Notificações", icon: <Bell className="w-5 h-5"/> },
    ];

    if (!user) return (
        <div className="flex-1 flex items-center justify-center bg-background">
            <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1, ease: "linear" }} className="w-10 h-10 border-[3px] border-surface-border border-t-accent rounded-full" />
        </div>
    );

    return (
        <div className="flex-1 overflow-y-auto bg-background p-6 sm:p-12 w-full transition-colors">
            <div className="max-w-5xl mx-auto w-full">
                <motion.h1 initial={{opacity:0, y:-10}} animate={{opacity:1, y:0}} className="text-3xl md:text-4xl font-extrabold text-foreground mb-10 tracking-tight">
                    Configurações do Sistema
                </motion.h1>
                
                <div className="flex flex-col md:flex-row gap-8">
                    {/* Sidebar */}
                    <motion.div initial={{opacity:0, x:-20}} animate={{opacity:1, x:0}} transition={{delay: 0.1}} className="w-full md:w-64 flex flex-col gap-2 shrink-0">
                        {tabs.map((t) => (
                            <button 
                                key={t.id} 
                                onClick={() => setActiveTab(t.id)}
                                className={`flex items-center gap-3 px-4 py-4 rounded-xl font-bold text-sm transition-all cursor-pointer ${activeTab === t.id ? 'bg-surface text-foreground border border-surface-border shadow-sm' : 'text-foreground/50 hover:text-foreground hover:bg-surface/50 border border-transparent'}`}
                            >
                                {t.icon} {t.label}
                            </button>
                        ))}
                    </motion.div>

                    {/* Conteúdo */}
                    <motion.div 
                        key={activeTab}
                        initial={{opacity:0, y:20}} 
                        animate={{opacity:1, y:0}} 
                        transition={{duration: 0.3}} 
                        className="flex-1 flex flex-col gap-8"
                    >
                        <div className="bg-surface p-8 rounded-3xl border border-surface-border shadow-lg">
                            {activeTab === 'profile' && (
                                <>
                                    <div className="flex justify-between items-end mb-8 border-b border-surface-border pb-4">
                                        <div>
                                            <h2 className="text-2xl font-bold text-foreground">Identificação</h2>
                                            <p className="text-foreground/40 text-sm mt-1">Informações estáticas do seu workspace.</p>
                                        </div>
                                        <button onClick={() => router.push('/dashboard/profile')} className="flex items-center gap-2 text-accent text-sm font-bold hover:underline mb-1">
                                            Ir para Meu Perfil Público <ExternalLink className="w-4 h-4" />
                                        </button>
                                    </div>

                                    <div className="flex flex-col gap-6">
                                        <div className="p-5 bg-background border border-surface-border rounded-2xl flex items-center gap-4">
                                            <div className="w-14 h-14 bg-gradient-to-tr from-accent/50 to-accent text-white rounded-full flex items-center justify-center text-xl font-black">
                                                {user.email?.substring(0,2).toUpperCase()}
                                            </div>
                                            <div>
                                                <h3 className="font-bold text-lg text-foreground">Acesso Susanoo ID</h3>
                                                <div className="text-sm font-medium text-foreground/50 mt-0.5">Plano Vigente <span className="text-accent ml-1">Beta Partner</span></div>
                                            </div>
                                        </div>

                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                            <div>
                                                <label className="text-xs font-bold uppercase tracking-widest opacity-40 mb-2 block text-foreground">E-mail Principal</label>
                                                <input type="text" disabled value={user.email} className="w-full bg-background border border-surface-border rounded-xl p-4 text-foreground/60 font-medium text-[14px]" />
                                            </div>
                                            <div>
                                                <label className="text-xs font-bold uppercase tracking-widest opacity-40 mb-2 block text-foreground">ID do Usuário</label>
                                                <input type="text" disabled value={user.id.substring(0,20) + '...'} className="w-full bg-background border border-surface-border rounded-xl p-4 text-foreground/60 font-medium text-[14px]" />
                                            </div>
                                        </div>
                                    </div>
                                </>
                            )}

                            {activeTab === 'security' && (
                                <>
                                    <h2 className="text-2xl font-bold text-foreground mb-8 border-b border-surface-border pb-4">Segurança da Conta</h2>
                                    <div className="flex flex-col gap-4">
                                        <div className="p-5 bg-background rounded-2xl border border-surface-border flex items-center justify-between">
                                            <div>
                                                <h4 className="font-bold text-foreground">Verificação em Duas Etapas</h4>
                                                <p className="text-sm text-foreground/50 mt-1">Maior segurança no login.</p>
                                            </div>
                                            <button onClick={() => alert("Módulo 2FA em processo de ativação...")} className="px-4 py-2 hover:bg-surface border border-surface-border text-foreground rounded-lg text-sm font-bold cursor-pointer">Configurar</button>
                                        </div>
                                        <div className="p-5 bg-background rounded-2xl border border-surface-border flex items-center justify-between">
                                            <div>
                                                <h4 className="font-bold text-foreground">Alterar Senha</h4>
                                                <p className="text-sm text-foreground/50 mt-1">Ultima alteração: há 30 dias.</p>
                                            </div>
                                            <button className="px-4 py-2 border border-surface-border text-foreground rounded-lg text-sm font-bold cursor-pointer hover:bg-surface">Alterar</button>
                                        </div>
                                        <div className="p-5 bg-red-500/5 rounded-2xl border border-red-500/20 flex items-center justify-between mt-2">
                                            <div>
                                                <h4 className="font-bold text-red-500">Desconectar Dispositivos</h4>
                                                <p className="text-sm text-red-500/60 mt-1">Sair de todas as outras instâncias.</p>
                                            </div>
                                            <button className="px-5 py-2 overflow-hidden bg-red-500 text-white rounded-lg text-sm font-bold cursor-pointer hover:bg-red-600">Sair de Tudo</button>
                                        </div>
                                    </div>
                                </>
                            )}

                            {activeTab === 'notifications' && (
                                <>
                                    <h2 className="text-2xl font-bold text-foreground mb-8 border-b border-surface-border pb-4">Preferências</h2>
                                    <div className="flex flex-col gap-5">
                                        {[
                                            { t: "E-mail de Feedback", d: "Resumos de progresso e métricas da loja." },
                                            { t: "Alertas de Chat", d: "Sons e avisos de novas mensagens da UI." },
                                            { t: "Notificações de Deploy", d: "Avisar sempre que houver update (Susanoo)." }
                                        ].map((item, i) => (
                                            <div key={i} className="flex items-center justify-between p-3 bg-background rounded-2xl border border-surface-border">
                                                <div>
                                                    <h4 className="font-bold text-foreground text-sm">{item.t}</h4>
                                                    <p className="text-[13px] text-foreground/50 mt-0.5">{item.d}</p>
                                                </div>
                                                <div className="w-10 h-6 bg-accent rounded-full relative cursor-pointer shadow-inner">
                                                    <div className="absolute right-1 top-1 w-4 h-4 bg-white rounded-full shadow-md"></div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </>
                            )}

                            <div className="mt-8 pt-6 border-t border-surface-border flex justify-end items-center gap-4">
                                <AnimatePresence>
                                    {saved && (
                                        <motion.div initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0 }} className="flex items-center gap-2 text-emerald-500 font-bold text-sm">
                                            <CheckCircle2 className="w-4 h-4" /> Atualizado.
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                                <button onClick={handleSave} className="bg-foreground text-background font-bold px-8 py-3 rounded-xl transition-all shadow-xl shadow-foreground/10 text-sm cursor-pointer hover:opacity-90">
                                    Salvar Alterações
                                </button>
                            </div>
                        </div>
                    </motion.div>
                </div>
            </div>
        </div>
    );
}

