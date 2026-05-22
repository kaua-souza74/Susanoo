"use client";
import { useEffect, useState, useRef } from "react";
import { supabase } from "@/lib/supabase";
import { User, Shield, Bell, Camera, Loader2, CheckCircle2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export default function SettingsPage() {
    const [user, setUser] = useState<any>(null);
    const [profile, setProfile] = useState<any>(null);
    const [activeTab, setActiveTab] = useState("profile");
    const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
    const [uploading, setUploading] = useState(false);
    const [saved, setSaved] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        const load = async () => {
            const { data: { session } } = await supabase.auth.getSession();
            if (!session) return;
            setUser(session.user);

            const { data: prof } = await supabase
                .from('profiles')
                .select('*')
                .eq('id', session.user.id)
                .single();

            if (prof) {
                setProfile(prof);
                if (prof.avatar_url) setAvatarUrl(prof.avatar_url);
            }
        };
        load();
    }, []);

    const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file || !user) return;

        setUploading(true);
        try {
            const ext = file.name.split('.').pop();
            const fileName = `avatar_${user.id}.${ext}`;

            const { data, error } = await supabase.storage
                .from('avatars')
                .upload(fileName, file, { upsert: true });

            if (error) throw error;

            const { data: { publicUrl } } = supabase.storage
                .from('avatars')
                .getPublicUrl(data.path);

            // Adiciona timestamp para forçar refresh do cache
            const urlWithTs = `${publicUrl}?t=${Date.now()}`;

            await supabase.from('profiles').upsert({
                id: user.id,
                avatar_url: publicUrl,
                updated_at: new Date().toISOString()
            });

            setAvatarUrl(urlWithTs);
        } catch (err) {
            console.error('Erro ao enviar avatar:', err);
            alert('Erro ao enviar foto. Verifique as permissões do bucket "avatars" no Supabase.');
        } finally {
            setUploading(false);
        }
    };

    const handleSave = async () => {
        if (!user) return;
        await supabase.from('profiles').upsert({
            id: user.id,
            updated_at: new Date().toISOString()
        });
        setSaved(true);
        setTimeout(() => setSaved(false), 2500);
    };

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
                {/* Sidebar */}
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

                {/* Conteúdo */}
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
                                        {/* Avatar com upload */}
                                        <div className="relative group">
                                            {avatarUrl ? (
                                                <img
                                                    src={avatarUrl}
                                                    alt="Foto de perfil"
                                                    className="w-28 h-28 rounded-full object-cover shadow-lg border-4 border-surface"
                                                />
                                            ) : (
                                                <div className="w-28 h-28 rounded-full bg-gradient-to-tr from-blue-600 to-accent flex items-center justify-center text-4xl font-black text-white shadow-lg border-4 border-surface">
                                                    {user.email?.substring(0,2).toUpperCase()}
                                                </div>
                                            )}

                                            {/* Overlay ao hover */}
                                            <div className="absolute inset-0 rounded-full bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                                <Camera className="w-7 h-7 text-white" />
                                            </div>

                                            {/* Botão câmera */}
                                            <button
                                                onClick={() => fileInputRef.current?.click()}
                                                disabled={uploading}
                                                className="absolute bottom-0 right-0 p-2.5 bg-accent border-2 border-surface rounded-full text-white hover:bg-accent/80 transition-all shadow-lg cursor-pointer disabled:opacity-60"
                                            >
                                                {uploading
                                                    ? <Loader2 className="w-4 h-4 animate-spin" />
                                                    : <Camera className="w-4 h-4" />
                                                }
                                            </button>

                                            <input
                                                type="file"
                                                accept="image/*"
                                                hidden
                                                ref={fileInputRef}
                                                onChange={handleAvatarUpload}
                                            />
                                        </div>

                                        <div className="flex flex-col gap-3">
                                            <h3 className="text-2xl font-bold text-foreground tracking-tight">{profile?.name || user.user_metadata?.full_name || 'Conta Corporativa'}</h3>
                                            <span className="bg-accent/10 border border-accent/20 text-accent uppercase text-[10px] font-bold px-3 py-1.5 rounded w-max tracking-widest shadow-lg shadow-accent/10">Plano Oficial Susanoo</span>
                                            {uploading && (
                                                <span className="text-xs text-foreground/40 font-medium animate-pulse">Enviando foto...</span>
                                            )}
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

                                    <div className="mt-8 pt-8 border-t border-surface-border flex justify-end items-center gap-4">
                                        <AnimatePresence>
                                            {saved && (
                                                <motion.div
                                                    initial={{ opacity: 0, x: 10 }}
                                                    animate={{ opacity: 1, x: 0 }}
                                                    exit={{ opacity: 0 }}
                                                    className="flex items-center gap-2 text-emerald-500 font-bold text-sm"
                                                >
                                                    <CheckCircle2 className="w-4 h-4" /> Salvo com sucesso!
                                                </motion.div>
                                            )}
                                        </AnimatePresence>
                                        <button 
                                            onClick={handleSave}
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
