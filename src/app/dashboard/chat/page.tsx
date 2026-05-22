"use client";
import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { Send, Paperclip, Video, Phone, X, FileText, Download, UserRound, Loader2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

type Message = {
    id: string;
    content: string;
    created_at: string;
    user_id: string;
    sender_name?: string;
    file_url?: string;
    file_type?: string;
};

// Extrai imagens embutidas no formato markdown [IMAGE](url)|filename
function parseMessageContent(content: string): { text: string; inlineImages: { url: string; name: string }[] } {
    const inlineImages: { url: string; name: string }[] = [];
    // Regex para capturar [IMAGE](url)|filename ou padrão markdown ![alt](url)
    const replaced = content.replace(/\[IMAGE\]\((https?:\/\/[^\)]+)\)\|([^\n]+)/g, (_, url, name) => {
        inlineImages.push({ url, name });
        return '';
    }).replace(/!\[([^\]]*)\]\((https?:\/\/[^\)]+)\)/g, (_, alt, url) => {
        inlineImages.push({ url, name: alt || 'Imagem' });
        return '';
    }).trim();

    return { text: replaced, inlineImages };
}

export default function ChatPage() {
    const router = useRouter();
    const [user, setUser] = useState<any>(null);
    const [profile, setProfile] = useState<any>(null);
    const [activeChannel, setActiveChannel] = useState<any>(null);
    const [messages, setMessages] = useState<Message[]>([]);
    const [content, setContent] = useState("");
    const [loading, setLoading] = useState(true);
    const [typingUsers, setTypingUsers] = useState<string[]>([]);
    const [showOnboarding, setShowOnboarding] = useState(false);
    const [newName, setNewName] = useState("");
    const [stagedFiles, setStagedFiles] = useState<File[]>([]);
    const [previews, setPreviews] = useState<string[]>([]);

    const messagesEndRef = useRef<HTMLDivElement>(null);
    const chatChannelRef = useRef<any>(null);
    const typingTimeoutRef = useRef<any>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const getMyName = () => {
        if (profile?.name) return profile.name;
        if (user?.email) return user.email.split('@')[0];
        return 'Cliente';
    };

    // Init
    useEffect(() => {
        let mounted = true;
        const init = async () => {
            const { data: { session } } = await supabase.auth.getSession();
            if (!session) { router.push("/login"); return; }
            if (!mounted) return;
            setUser(session.user);

            const { data: prof } = await supabase.from('profiles').select('*').eq('id', session.user.id).single();
            if (prof) {
                setProfile(prof);
                if (!prof.name) setShowOnboarding(true);
            } else {
                setShowOnboarding(true);
            }

            const { data: projs } = await supabase.from('projects').select('*').eq('client_id', session.user.id);
            let ch: any = null;
            if (projs && projs.length > 0) {
                ch = { ...projs[0], isProject: true };
            } else {
                const { data: np } = await supabase.from('projects').insert([{
                    name: 'Central de Suporte',
                    client_id: session.user.id,
                    status: 'active'
                }]).select().single();
                if (np) ch = { ...np, isProject: true };
            }
            if (ch && mounted) {
                setActiveChannel(ch);
                await loadMessages(ch.id, ch.isProject);
            }
            if (mounted) setLoading(false);
        };
        init();
        return () => { mounted = false; };
    }, [router]);

    // Realtime
    useEffect(() => {
        if (!activeChannel) return;
        const cid = activeChannel.id;
        const field = activeChannel.isProject ? 'project_id' : 'chat_id';
        const ch = supabase.channel(`chat-${cid}`, { config: { broadcast: { ack: true } } })
            .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'messages' }, (payload: any) => {
                if (payload.new[field] === cid) {
                    setMessages(prev => prev.find(m => m.id === payload.new.id) ? prev : [...prev, payload.new]);
                }
            })
            .on('broadcast', { event: 'sync' }, ({ payload }) => {
                const msg = payload?.newMessage;
                if (msg && msg[field] === cid) {
                    setMessages(prev => prev.find(m => m.id === msg.id) ? prev : [...prev, msg]);
                }
            })
            .on('broadcast', { event: 'typing' }, (raw: any) => {
                const { name, isTyping } = raw.payload ?? {};
                if (!name || name === getMyName()) return;
                setTypingUsers(prev => isTyping ? [...new Set([...prev, name])] : prev.filter(n => n !== name));
            })
            .subscribe();
        chatChannelRef.current = ch;
        return () => { supabase.removeChannel(ch); };
    }, [activeChannel?.id]);

    useEffect(() => { messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages]);

    const loadMessages = async (id: string, isProject: boolean) => {
        const field = isProject ? 'project_id' : 'chat_id';
        const { data } = await supabase.from('messages').select('*').eq(field, id).order('created_at', { ascending: true });
        if (data) setMessages(data as Message[]);
    };

    const handleUpdateName = async () => {
        if (!newName.trim() || !user) return;
        const { error } = await supabase.from('profiles').upsert({ id: user.id, name: newName, updated_at: new Date().toISOString() });
        if (!error) { setProfile((p: any) => ({ ...p, name: newName })); setShowOnboarding(false); }
    };

    const handleTyping = () => {
        chatChannelRef.current?.send({ type: 'broadcast', event: 'typing', payload: { name: getMyName(), isTyping: true } });
        clearTimeout(typingTimeoutRef.current);
        typingTimeoutRef.current = setTimeout(() => {
            chatChannelRef.current?.send({ type: 'broadcast', event: 'typing', payload: { name: getMyName(), isTyping: false } });
        }, 2000);
    };

    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = Array.from(e.target.files || []);
        setStagedFiles(prev => [...prev, ...files]);
        setPreviews(prev => [...prev, ...files.map(f => f.type.startsWith('image/') ? URL.createObjectURL(f) : 'file')]);
        e.target.value = '';
    };

    const removeStagedFile = (i: number) => {
        setStagedFiles(prev => prev.filter((_, idx) => idx !== i));
        setPreviews(prev => { if (prev[i] !== 'file') URL.revokeObjectURL(prev[i]); return prev.filter((_, idx) => idx !== i); });
    };

    const handleSend = async (e: React.FormEvent) => {
        e.preventDefault();
        if ((!content.trim() && stagedFiles.length === 0) || !activeChannel || loading) return;

        const msgContent = content;
        const filesToSend = [...stagedFiles];
        setContent(""); setStagedFiles([]); setPreviews([]);

        const base = activeChannel.isProject ? { project_id: activeChannel.id } : { chat_id: activeChannel.id };

        // Upload arquivos
        for (const file of filesToSend) {
            const fname = `${Date.now()}_${file.name}`;
            const { data: up } = await supabase.storage.from('chat_attachments').upload(fname, file);
            if (up) {
                const { data: { publicUrl } } = supabase.storage.from('chat_attachments').getPublicUrl(up.path);
                const { data: nm } = await supabase.from('messages').insert([{
                    ...base,
                    user_id: user.id,
                    content: '',
                    file_url: publicUrl,
                    file_type: file.type,
                    sender_name: getMyName()
                }]).select().single();
                if (nm) {
                    chatChannelRef.current?.send({ type: 'broadcast', event: 'sync', payload: { newMessage: nm } });
                    setMessages(prev => prev.find(m => m.id === nm.id) ? prev : [...prev, nm]);
                }
            }
        }

        if (msgContent.trim()) {
            const { data: nm } = await supabase.from('messages').insert([{
                ...base, user_id: user.id, content: msgContent, sender_name: getMyName()
            }]).select().single();
            if (nm) {
                chatChannelRef.current?.send({ type: 'broadcast', event: 'sync', payload: { newMessage: nm } });
                setMessages(prev => prev.find(m => m.id === nm.id) ? prev : [...prev, nm]);
            }
        }
    };

    return (
        <div className="flex-1 flex flex-col h-full bg-background relative overflow-hidden text-white">

            {/* Onboarding overlay */}
            <AnimatePresence>
                {showOnboarding && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                        className="absolute inset-0 z-[200] bg-black/80 backdrop-blur-xl flex items-center justify-center p-6">
                        <div className="bg-surface p-10 rounded-[3rem] border border-surface-border max-w-md w-full shadow-2xl">
                            <div className="w-16 h-16 bg-accent/10 rounded-2xl flex items-center justify-center mb-6">
                                <UserRound className="w-8 h-8 text-accent" />
                            </div>
                            <h2 className="text-3xl font-black mb-2 tracking-tighter">Como podemos te chamar?</h2>
                            <p className="text-sm text-foreground/40 mb-8">Seu nome ficará visível no chat com nossa equipe.</p>
                            <input type="text" value={newName} onChange={e => setNewName(e.target.value)}
                                onKeyDown={e => e.key === 'Enter' && handleUpdateName()}
                                placeholder="Seu nome ou apelido..." autoFocus
                                className="w-full bg-background border border-surface-border p-5 rounded-2xl outline-none mb-6 focus:border-accent transition-colors" />
                            <button onClick={handleUpdateName} className="w-full bg-white text-black font-black py-5 rounded-2xl hover:scale-[1.02] active:scale-[0.98] transition-all">
                                VAMOS LÁ
                            </button>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Navbar */}
            <div className="px-8 py-5 border-b border-surface-border flex justify-between items-center bg-background/60 backdrop-blur-md z-50">
                <div className="flex items-center gap-4">
                    {/* Avatar do perfil do usuário na navbar */}
                    {profile?.avatar_url ? (
                        <img src={profile.avatar_url} alt="Avatar" className="w-10 h-10 rounded-xl object-cover border border-surface-border" />
                    ) : (
                        <div className="w-10 h-10 rounded-xl bg-accent/10 border border-accent/20 flex items-center justify-center">
                            <span className="text-accent font-black text-xs">HQ</span>
                        </div>
                    )}
                    <div>
                        <h1 className="font-bold text-white flex items-center gap-2">
                            Canal Susanoo
                            <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                        </h1>
                        <p className="text-[10px] font-black text-foreground/30 uppercase tracking-widest">
                            {getMyName()}
                        </p>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    <button className="p-2.5 hover:bg-surface rounded-xl transition-all"><Video className="w-5 h-5 text-foreground/40" /></button>
                    <button className="p-2.5 hover:bg-surface rounded-xl transition-all"><Phone className="w-5 h-5 text-foreground/40" /></button>
                </div>
            </div>

            {/* Feed de mensagens */}
            <div className="flex-1 overflow-y-auto px-6 py-8 flex flex-col gap-6 custom-scrollbar">
                {loading && (
                    <div className="flex-1 flex items-center justify-center opacity-30">
                        <Loader2 className="w-8 h-8 animate-spin" />
                    </div>
                )}

                {!loading && messages.length === 0 && (
                    <div className="flex-1 flex flex-col items-center justify-center opacity-20 py-20 gap-4">
                        <UserRound className="w-16 h-16" />
                        <p className="font-black uppercase tracking-[0.3em] text-xs">Início da conversa</p>
                    </div>
                )}

                {messages.map((msg) => {
                    const isStaff = msg.sender_name?.startsWith('[STAFF]');
                    const isMe = !isStaff;
                    const displayName = isStaff ? msg.sender_name!.replace('[STAFF] ', '') : (msg.sender_name || 'Cliente');
                    const { text, inlineImages } = parseMessageContent(msg.content || '');

                    // Verificar se é uma URL de imagem direta no content (legado)
                    const isDirectImageUrl = !msg.file_url && msg.content?.match(/^https?:\/\/.+\.(png|jpg|jpeg|gif|webp)/i);

                    return (
                        <motion.div key={msg.id}
                            initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
                            className={`flex w-full gap-3 ${isMe ? 'flex-row-reverse' : 'flex-row'}`}>

                            {/* Avatar */}
                            {isStaff ? (
                                <div className="w-9 h-9 rounded-full shrink-0 flex items-center justify-center text-[10px] font-black uppercase border bg-accent border-accent/40 text-white shadow-[0_0_12px_rgba(var(--accent-rgb),0.4)]">
                                    HQ
                                </div>
                            ) : (
                                profile?.avatar_url ? (
                                    <img
                                        src={profile.avatar_url}
                                        alt={displayName}
                                        className="w-9 h-9 rounded-full shrink-0 object-cover border border-surface-border"
                                    />
                                ) : (
                                    <div className="w-9 h-9 rounded-full shrink-0 flex items-center justify-center text-[10px] font-black uppercase border bg-surface border-surface-border text-foreground/50">
                                        {displayName.charAt(0)}
                                    </div>
                                )
                            )}

                            <div className={`flex flex-col gap-1.5 max-w-[75%] ${isMe ? 'items-end' : 'items-start'}`}>
                                <span className={`text-[10px] font-black uppercase tracking-widest ${isStaff ? 'text-accent' : 'text-foreground/40'}`}>
                                    {isMe ? `Você` : `${displayName} · STAFF`}
                                </span>

                                <div className={`px-5 py-4 shadow-xl relative
                                    ${isMe
                                        ? 'bg-white text-black rounded-[1.5rem] rounded-tr-sm'
                                        : 'bg-surface border border-surface-border text-white rounded-[1.5rem] rounded-tl-sm'
                                    }`}>

                                    {/* Arquivo/Imagem via file_url */}
                                    {msg.file_url && (
                                        <div className="mb-3">
                                            {msg.file_type?.startsWith('image/') || msg.file_url?.match(/\.(png|jpg|jpeg|gif|webp)/i) ? (
                                                <img
                                                    src={msg.file_url}
                                                    alt="Imagem"
                                                    onClick={() => window.open(msg.file_url, '_blank')}
                                                    className="rounded-2xl max-w-full max-h-72 object-cover cursor-pointer hover:scale-[1.02] transition-transform border border-black/5"
                                                />
                                            ) : (
                                                <div className={`flex items-center gap-3 p-3 rounded-xl ${isMe ? 'bg-black/5' : 'bg-white/5'}`}>
                                                    <FileText className="w-5 h-5" />
                                                    <span className="text-xs font-bold flex-1 truncate">
                                                        {msg.file_url.split('/').pop()?.substring(14) || 'Documento'}
                                                    </span>
                                                    <a href={msg.file_url} target="_blank" className="p-1.5 rounded-lg hover:bg-black/10 transition-all">
                                                        <Download className="w-4 h-4" />
                                                    </a>
                                                </div>
                                            )}
                                        </div>
                                    )}

                                    {/* Imagens inline parseadas do content (legado markdown) */}
                                    {inlineImages.map((img, i) => (
                                        <div key={i} className="mb-3">
                                            <img
                                                src={img.url}
                                                alt={img.name}
                                                onClick={() => window.open(img.url, '_blank')}
                                                className="rounded-2xl max-w-full max-h-72 object-cover cursor-pointer hover:scale-[1.02] transition-transform border border-black/5"
                                            />
                                            {img.name && img.name !== 'Imagem' && (
                                                <p className="text-[10px] opacity-40 mt-1">{img.name}</p>
                                            )}
                                        </div>
                                    ))}

                                    {/* URL de imagem direta no content (legado) */}
                                    {isDirectImageUrl && (
                                        <div className="mb-3">
                                            <img
                                                src={msg.content}
                                                alt="Imagem"
                                                onClick={() => window.open(msg.content, '_blank')}
                                                className="rounded-2xl max-w-full max-h-72 object-cover cursor-pointer hover:scale-[1.02] transition-transform"
                                            />
                                        </div>
                                    )}

                                    {/* Texto da mensagem */}
                                    {text && !isDirectImageUrl && (
                                        <p className="text-[15px] font-medium leading-relaxed whitespace-pre-wrap">{text}</p>
                                    )}

                                    <p className={`text-[9px] font-black mt-2 opacity-30 ${isMe ? 'text-right' : 'text-left'}`}>
                                        {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                    </p>
                                </div>
                            </div>
                        </motion.div>
                    );
                })}

                {/* Typing indicator */}
                <AnimatePresence>
                    {typingUsers.length > 0 && (
                        <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                            className="flex items-center gap-3">
                            <div className="w-9 h-9 rounded-full bg-accent/20 border border-accent/30 flex items-center justify-center text-[10px] font-black text-accent">HQ</div>
                            <div className="flex gap-1.5 px-4 py-3 bg-surface border border-surface-border rounded-2xl rounded-tl-sm">
                                {[0, 0.15, 0.3].map((delay, i) => (
                                    <span key={i} className="w-1.5 h-1.5 rounded-full bg-accent animate-bounce" style={{ animationDelay: `${delay}s` }} />
                                ))}
                            </div>
                            <span className="text-[9px] text-foreground/30 font-black uppercase tracking-widest">
                                {typingUsers[0]} digitando...
                            </span>
                        </motion.div>
                    )}
                </AnimatePresence>

                <div ref={messagesEndRef} />
            </div>

            {/* Área de input */}
            <div className="px-6 pb-6 bg-background">
                <div className="max-w-5xl mx-auto flex flex-col gap-3">

                    {/* Preview de arquivos staged */}
                    <AnimatePresence>
                        {previews.length > 0 && (
                            <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}
                                className="flex gap-3 flex-wrap p-4 bg-surface border border-surface-border rounded-2xl">
                                {previews.map((p, i) => (
                                    <div key={i} className="relative w-20 h-20 group">
                                        {p === 'file'
                                            ? <div className="w-full h-full bg-background border border-surface-border rounded-xl flex items-center justify-center">
                                                <FileText className="w-7 h-7 text-foreground/20" />
                                              </div>
                                            : <img src={p} className="w-full h-full object-cover rounded-xl border border-surface-border" />
                                        }
                                        <button onClick={() => removeStagedFile(i)}
                                            className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                            <X className="w-3 h-3" />
                                        </button>
                                    </div>
                                ))}
                            </motion.div>
                        )}
                    </AnimatePresence>

                    <form onSubmit={handleSend}
                        className="bg-surface border border-surface-border rounded-[2rem] p-2 flex items-center gap-2 focus-within:border-accent/40 transition-colors">
                        <button type="button" onClick={() => fileInputRef.current?.click()}
                            className="w-11 h-11 rounded-full flex items-center justify-center text-foreground/30 hover:text-accent transition-colors">
                            <Paperclip className="w-5 h-5" />
                        </button>
                        <input type="file" multiple hidden ref={fileInputRef} onChange={handleFileSelect} />

                        <input type="text" value={content}
                            onChange={e => { setContent(e.target.value); handleTyping(); }}
                            placeholder="Fale com a equipe Susanoo..."
                            className="flex-1 bg-transparent py-3 px-2 outline-none text-white font-medium placeholder:text-foreground/20" />

                        <button type="submit" disabled={loading || (!content.trim() && stagedFiles.length === 0)}
                            className="w-12 h-12 rounded-full bg-accent flex items-center justify-center shadow-lg shadow-accent/20 hover:scale-110 active:scale-95 transition-all disabled:opacity-30">
                            <Send className="w-5 h-5 text-white" />
                        </button>
                    </form>
                </div>
            </div>
        </div>
    );
}
