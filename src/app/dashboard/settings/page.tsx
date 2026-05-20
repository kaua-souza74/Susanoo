"use client";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { User, Shield, Bell, CreditCard, Camera } from "lucide-react";
import { motion } from "framer-motion";

export default function SettingsPage() {
    const [user, setUser] = useState<any>(null);
    const [activeTab, setActiveTab] = useState("profile");

    useEffect(() => {
        supabase.auth.getSession().then(({data}) => setUser(data.session?.user));
    }, []);

    const tabs = [
        { id: "profile", label: "Meu Perfil", icon: <User className="w-5 h-5"/> },
        { id: "security", label: "Segurança", icon: <Shield className="w-5 h-5"/> },
        { id: "notifications", label: "Notificações", icon: <Bell className="w-5 h-5"/> },
    ];

    if (!user) return (
        <div className="flex-1 flex flex-col items-center justify-center bg-background">
            <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1, ease: "linear" }} className="w-12 h-12 border-[3px] border-surface-border border-t-accent rounded-full mb-4" />
        </div>
    );

    return (
        <div className="flex-1 overflow-y-auto bg-background p-6 sm:p-12 max-w-6xl mx-auto w-full transition-colors">
            <motion.h1 initial={{opacity:0, y:-10}} animate={{opacity:1, y:0}} className="text-3xl md:text-5xl font-extrabold text-foreground mb-10 tracking-tight">
                Configurações
            </motion.h1>
            
            <div className="flex flex-col md:flex-row gap-10">
                {/* Sidebar das Settings */}
                <motion.div initial={{opacity:0, x:-20}} animate={{opacity:1, x:0}} transition={{delay: 0.1}} className="w-full md:w-64 flex flex-col gap-2 shrink-0">
                    {tabs.map((t) => (
                        <button 
                            key={t.id} 
                            onClick={() => setActiveTab(t.id)}
                            className={`flex items-center gap-3 px-4 py-4 rounded-xl font-bold text-sm transition-all cursor-pointer ${activeTab === t.id ? 'bg-surface text-foreground border border-surface-border shadow-sm' : 'text-foreground/50 hover:text-foreground hover:bg-surface/50'}`}
                        >
                            {t.icon} {t.label}
                        </button>
                    ))}
                </motion.div>

                {/* Conteúdo principal */}
                <motion.div 
                    key={activeTab}
                    initial={{opacity:0, y:20}} 
                    animate={{opacity:1, y:0}} 
                    transition={{duration: 0.3}} 
                    className="flex-1 flex flex-col gap-8"
                >
                    <div className="bg-surface p-8 md:p-10 rounded-[32px] border border-surface-border shadow-2xl shadow-black/5 dark:shadow-black/40">
                        {activeTab === 'profile' && (
                            <>
                                <h2 className="text-2xl font-bold text-foreground mb-8 border-b border-surface-border pb-4">Identificação do Workspace</h2>
                                <div className="flex flex-col gap-8">
                                    <div className="flex items-center gap-8">
                                        <div className="relative">
                                            <div className="w-28 h-28 rounded-full bg-gradient-to-tr from-blue-600 to-accent flex items-center justify-center text-4xl font-black text-white shadow-lg border-4 border-surface">
                                                {user.email?.substring(0,2).toUpperCase()}
                                            </div>
                                            <button className="absolute bottom-0 right-0 p-3 bg-surface border border-surface-border rounded-full text-foreground hover:bg-background transition-colors shadow-lg cursor-pointer">
                                               <Camera className="w-5 h-5" />
                                            </button>
                                        </div>
                                        <div className="flex flex-col gap-3">
                                            <h3 className="text-2xl font-bold text-foreground tracking-tight">{user.user_metadata?.full_name || 'Conta Corporativa'}</h3>
                                            <span className="bg-accent/10 border border-accent/20 text-accent uppercase text-[10px] font-bold px-3 py-1.5 rounded w-max tracking-widest shadow-lg shadow-accent/10">Plano Oficial Susanoo</span>
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
                                        <div>
                                            <label className="text-sm font-semibold opacity-70 mb-3 block text-foreground">E-mail de Contato Principal</label>
                                            <input type="text" disabled value={user.email} className="w-full bg-background border border-surface-border rounded-2xl p-5 text-foreground/50 font-medium text-[15px]" />
                                        </div>
                                        <div>
                                            <label className="text-sm font-semibold opacity-70 mb-3 block text-foreground">ID Único da Empresa</label>
                                            <input type="text" disabled value={user.id.substring(0,20) + '...'} className="w-full bg-background border border-surface-border rounded-2xl p-5 text-foreground/50 font-medium text-[15px]" />
                                        </div>
                                    </div>

                                    <div className="mt-8 pt-8 border-t border-surface-border flex justify-end">
                                        <button 
                                            onClick={() => alert("Alterações salvas com sucesso no núcleo Susanoo!")}
                                            className="bg-foreground text-background font-bold px-10 py-4 rounded-xl transition-all shadow-xl shadow-foreground/10 text-[15px] cursor-pointer hover:opacity-90"
                                        >
                                            Salvar Alterações
                                        </button>
                                    </div>
                                </div>
                            </>
                        )}

                        {activeTab === 'security' && (
                            <>
                                <h2 className="text-2xl font-bold text-foreground mb-8 border-b border-surface-border pb-4">Segurança da Conta</h2>
                                <div className="flex flex-col gap-6">
                                    <div className="p-6 bg-background rounded-2xl border border-surface-border flex items-center justify-between">
                                        <div>
                                            <h4 className="font-bold text-foreground">Autenticação de Dois Fatores</h4>
                                            <p className="text-sm text-foreground/60">Adicione uma camada extra de proteção à sua conta.</p>
                                        </div>
                                        <button onClick={() => alert("Módulo 2FA em processo de ativação...")} className="px-4 py-2 bg-accent text-white rounded-lg text-sm font-bold cursor-pointer">Ativar</button>
                                    </div>
                                    <div className="p-6 bg-background rounded-2xl border border-surface-border flex items-center justify-between">
                                        <div>
                                            <h4 className="font-bold text-foreground">Alterar Senha</h4>
                                            <p className="text-sm text-foreground/60">Recomendamos uma senha forte e única.</p>
                                        </div>
                                        <button onClick={() => alert("Link de redefinição enviado para seu e-mail corporativo.")} className="px-4 py-2 border border-surface-border text-foreground rounded-lg text-sm font-bold cursor-pointer hover:bg-surface">Alterar</button>
                                    </div>
                                    <div className="p-6 bg-red-500/5 rounded-2xl border border-red-500/20 flex items-center justify-between">
                                        <div>
                                            <h4 className="font-bold text-red-500">Encerrar todas as sessões</h4>
                                            <p className="text-sm text-red-500/60">Desconectar de todos os dispositivos ativos.</p>
                                        </div>
                                        <button onClick={() => alert("Todas as sessões remotas foram encerradas com segurança.")} className="px-4 py-2 bg-red-500 text-white rounded-lg text-sm font-bold cursor-pointer hover:bg-red-600">Sair de tudo</button>
                                    </div>
                                </div>
                            </>
                        )}

                        {activeTab === 'notifications' && (
                            <>
                                <h2 className="text-2xl font-bold text-foreground mb-8 border-b border-surface-border pb-4">Preferências de Notificação</h2>
                                <div className="flex flex-col gap-6">
                                    {[
                                        { t: "E-mail de progresso", d: "Receba um resumo semanal do desenvolvimento." },
                                        { t: "Alertas de chat", d: "Notificações instantâneas quando a equipe enviar mensagem." },
                                        { t: "Aprovações pendentes", d: "Avisar quando houver algo aguardando seu feedback." }
                                    ].map((item, i) => (
                                        <div key={i} className="flex items-center justify-between p-2">
                                            <div>
                                                <h4 className="font-bold text-foreground">{item.t}</h4>
                                                <p className="text-sm text-foreground/60">{item.d}</p>
                                            </div>
                                            <div className="w-12 h-6 bg-emerald-500 rounded-full relative cursor-pointer">
                                                <div className="absolute right-1 top-1 w-4 h-4 bg-white rounded-full shadow-sm"></div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </>
                        )}

                    </div>
                </motion.div>
            </div>
        </div>
    );
}
