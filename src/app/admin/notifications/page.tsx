"use client";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { Bell, Trash2, CheckCircle, AlertTriangle, Info, Check, Plus, AlertCircle } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export default function AdminNotifications() {
    const [notifications, setNotifications] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [toastMessage, setToastMessage] = useState<string | null>(null);

    // Form states
    const [title, setTitle] = useState("");
    const [content, setContent] = useState("");
    const [type, setType] = useState("info");
    const [sending, setSending] = useState(false);

    const showToast = (msg: string) => {
        setToastMessage(msg);
        setTimeout(() => setToastMessage(null), 3000);
    };

    const fetchNotifications = async () => {
        setLoading(true);
        try {
            const { data, error } = await supabase
                .from("notifications")
                .select("*")
                .order("created_at", { ascending: false });

            if (!error && data) {
                setNotifications(data);
            }
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchNotifications();

        const channel = supabase.channel("admin_notifications_changes")
            .on("postgres_changes", { event: "*", schema: "public", table: "notifications" }, () => {
                fetchNotifications();
            })
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, []);

    const markAsRead = async (id: string) => {
        try {
            const { error } = await supabase
                .from("notifications")
                .update({ read: true })
                .eq("id", id);

            if (error) throw error;
            showToast("Notificação marcada como lida!");
            setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
        } catch (e) {
            showToast("Erro ao atualizar notificação.");
        }
    };

    const deleteNotification = async (id: string) => {
        try {
            const { error } = await supabase
                .from("notifications")
                .delete()
                .eq("id", id);

            if (error) throw error;
            showToast("Notificação deletada!");
            setNotifications(prev => prev.filter(n => n.id !== id));
        } catch (e) {
            showToast("Erro ao deletar notificação.");
        }
    };

    const handleCreateNotification = async () => {
        if (!title || !content) return showToast("Título e conteúdo são obrigatórios.");
        
        setSending(true);
        try {
            const { error } = await supabase
                .from("notifications")
                .insert([{ title, content, type, read: false }]);

            if (error) throw error;
            showToast("Notificação enviada com sucesso!");
            setTitle("");
            setContent("");
            setType("info");
        } catch (e) {
            showToast("Erro ao enviar notificação.");
        } finally {
            setSending(false);
        }
    };

    const getIcon = (t: string) => {
        switch (t) {
            case "success": return <CheckCircle className="w-5 h-5 text-emerald-500" />;
            case "warning": return <AlertTriangle className="w-5 h-5 text-amber-500" />;
            case "error": return <AlertCircle className="w-5 h-5 text-red-500" />;
            default: return <Info className="w-5 h-5 text-blue-500" />;
        }
    };

    return (
        <div className="flex-1 overflow-y-auto p-10 bg-background text-foreground transition-colors duration-300 pb-20">
            <div className="w-full max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-8">
                {/* Esquerda: Lista de Notificações */}
                <div className="lg:col-span-8 space-y-6">
                    <div className="flex items-center justify-between mb-2">
                        <div>
                            <h1 className="text-3xl font-black tracking-tight mb-1 flex items-center gap-3">
                                <Bell className="w-8 h-8 text-accent" />
                                Central de Notificações
                            </h1>
                            <p className="text-sm text-foreground/50">Histórico de eventos operacionais e alertas da agência.</p>
                        </div>
                        <button onClick={fetchNotifications} className="px-4 py-2 border border-surface-border hover:border-foreground/20 text-xs font-bold uppercase tracking-wider rounded-xl transition-colors">
                            Atualizar
                        </button>
                    </div>

                    {loading ? (
                        <div className="flex items-center justify-center py-20">
                            <div className="w-8 h-8 border-2 border-surface-border border-t-accent rounded-full animate-spin" />
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {notifications.length === 0 ? (
                                <div className="bg-surface border border-surface-border p-16 rounded-3xl text-center flex flex-col items-center justify-center">
                                    <Bell className="w-12 h-12 text-foreground/20 mb-4" />
                                    <h3 className="font-bold text-lg text-foreground mb-1">Nenhuma notificação ativa</h3>
                                    <p className="text-sm text-foreground/40">Tudo sob controle no Susanoo por enquanto.</p>
                                </div>
                            ) : (
                                <AnimatePresence>
                                    {notifications.map((notif) => (
                                        <motion.div 
                                            key={notif.id}
                                            initial={{ opacity: 0, y: 10 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            exit={{ opacity: 0, y: -10 }}
                                            className={`bg-surface border p-5 rounded-2xl flex items-start justify-between gap-4 shadow-sm transition-all ${notif.read ? 'border-surface-border opacity-70' : 'border-accent/30 bg-accent/5'}`}
                                        >
                                            <div className="flex items-start gap-4">
                                                <div className="mt-1 shrink-0">{getIcon(notif.type)}</div>
                                                <div>
                                                    <h3 className="font-bold text-sm text-foreground flex items-center gap-2">
                                                        {notif.title}
                                                        {!notif.read && (
                                                            <span className="w-2 h-2 rounded-full bg-accent animate-pulse" />
                                                        )}
                                                    </h3>
                                                    <p className="text-xs text-foreground/60 mt-1 leading-relaxed">{notif.content}</p>
                                                    <span className="text-[10px] text-foreground/30 font-medium block mt-2">
                                                        {new Date(notif.created_at).toLocaleString('pt-BR')}
                                                    </span>
                                                </div>
                                            </div>

                                            <div className="flex items-center gap-2 shrink-0">
                                                {!notif.read && (
                                                    <button 
                                                        onClick={() => markAsRead(notif.id)}
                                                        className="p-2 hover:bg-emerald-500/10 text-emerald-500 rounded-xl transition-colors"
                                                        title="Marcar como lida"
                                                    >
                                                        <Check className="w-4 h-4" />
                                                    </button>
                                                )}
                                                <button 
                                                    onClick={() => deleteNotification(notif.id)}
                                                    className="p-2 hover:bg-red-500/10 text-red-500 rounded-xl transition-colors"
                                                    title="Deletar notificação"
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                </button>
                                            </div>
                                        </motion.div>
                                    ))}
                                </AnimatePresence>
                            )}
                        </div>
                    )}
                </div>

                {/* Direita: Formulário de Nova Notificação */}
                <div className="lg:col-span-4 space-y-6">
                    <div className="bg-surface border border-surface-border rounded-3xl p-6 shadow-sm space-y-5">
                        <h2 className="text-xl font-bold flex items-center gap-2">
                            <Plus className="w-5 h-5 text-accent" />
                            Enviar Alerta
                        </h2>
                        <p className="text-xs text-foreground/50">Dispare um novo alerta de sistema ou notificação operacional para os administradores.</p>

                        <div className="space-y-4">
                            <div>
                                <label className="text-[10px] font-black text-foreground/45 uppercase tracking-wider mb-2 block">Título</label>
                                <input 
                                    type="text" 
                                    value={title} 
                                    onChange={e => setTitle(e.target.value)}
                                    placeholder="Ex: Deploy concluído com sucesso" 
                                    className="w-full bg-background border border-surface-border rounded-xl px-4 py-2.5 text-sm font-medium focus:border-accent outline-none text-foreground"
                                />
                            </div>

                            <div>
                                <label className="text-[10px] font-black text-foreground/45 uppercase tracking-wider mb-2 block">Tipo de Alerta</label>
                                <select 
                                    value={type} 
                                    onChange={e => setType(e.target.value)}
                                    className="w-full bg-background border border-surface-border rounded-xl px-4 py-2.5 text-sm font-medium focus:border-accent outline-none text-foreground"
                                >
                                    <option value="info">Informação (Azul)</option>
                                    <option value="success">Sucesso (Verde)</option>
                                    <option value="warning">Aviso (Laranja)</option>
                                    <option value="error">Erro (Vermelho)</option>
                                </select>
                            </div>

                            <div>
                                <label className="text-[10px] font-black text-foreground/45 uppercase tracking-wider mb-2 block">Mensagem</label>
                                <textarea 
                                    value={content} 
                                    onChange={e => setContent(e.target.value)}
                                    placeholder="Escreva detalhes da mensagem aqui..." 
                                    className="w-full bg-background border border-surface-border rounded-xl px-4 py-3 text-sm font-medium focus:border-accent outline-none min-h-[100px] resize-none text-foreground"
                                />
                            </div>

                            <button 
                                onClick={handleCreateNotification}
                                disabled={sending}
                                className="w-full py-3.5 bg-accent text-white font-black rounded-xl text-xs uppercase tracking-wider hover:opacity-90 transition-opacity flex items-center justify-center gap-2 cursor-pointer"
                            >
                                {sending ? "Enviando..." : "Enviar Notificação"}
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {/* Custom Toast Notification */}
            <AnimatePresence>
                {toastMessage && (
                    <motion.div 
                        initial={{ opacity: 0, y: 50, scale: 0.9 }} 
                        animate={{ opacity: 1, y: 0, scale: 1 }} 
                        exit={{ opacity: 0, scale: 0.9, y: 20 }}
                        className="fixed bottom-6 right-6 z-[9999] bg-surface border border-surface-border shadow-2xl px-6 py-4 rounded-2xl flex items-center gap-3 max-w-sm border-accent/20"
                    >
                        <div className="w-8 h-8 bg-accent/15 text-accent rounded-full flex items-center justify-center shrink-0">
                            <CheckCircle className="w-4 h-4" />
                        </div>
                        <p className="text-sm font-bold text-foreground">{toastMessage}</p>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
