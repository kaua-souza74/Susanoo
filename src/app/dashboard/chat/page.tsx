"use client";
import { useEffect, useState, useRef, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { Send, Paperclip, X, FileText, Download, UserRound, Loader2, Users, Search, Hash, ShieldAlert } from "lucide-react";
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

// Extrai imagens embutidas no formato markdown
function parseMessageContent(content: string): { text: string; inlineImages: { url: string; name: string }[] } {
    const inlineImages: { url: string; name: string }[] = [];
    const replaced = content.replace(/\[IMAGE\]\((https?:\/\/[^\)]+)\)\|([^\n]+)/g, (_, url, name) => {
        inlineImages.push({ url, name });
        return '';
    }).replace(/!\[([^\]]*)\]\((https?:\/\/[^\)]+)\)/g, (_, alt, url) => {
        inlineImages.push({ url, name: alt || 'Imagem' });
        return '';
    }).trim();
    return { text: replaced, inlineImages };
}

function ChatPageContent() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const initDevId = searchParams.get('devId');
    const initDevName = searchParams.get('devName');

    const [user, setUser] = useState<any>(null);
    const [profile, setProfile] = useState<any>(null);
    const [channels, setChannels] = useState<any[]>([]);
    const [activeChannel, setActiveChannel] = useState<any>(null);
    const [messages, setMessages] = useState<Message[]>([]);
    const [content, setContent] = useState("");
    const [loading, setLoading] = useState(true);
    const [typingUsers, setTypingUsers] = useState<string[]>([]);
    const [showOnboarding, setShowOnboarding] = useState(false);
    const [newName, setNewName] = useState("");
    const [stagedFiles, setStagedFiles] = useState<File[]>([]);
    const [previews, setPreviews] = useState<string[]>([]);
    const [searchTerm, setSearchTerm] = useState("");

    const messagesEndRef = useRef<HTMLDivElement>(null);
    const chatChannelRef = useRef<any>(null);
    const typingTimeoutRef = useRef<any>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const getMyName = () => {
        if (profile?.name) return profile.name;
        if (user?.email) return user.email.split('@')[0];
        return 'Usuário';
    };

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

            // Buscar todos os chats nos quais este usuário participa ou de suporte atrelados a ele
            const { data: allChatsData } = await supabase.from('chats')
                .select('*')
                .contains('participants', [session.user.id]);
            
            const { data: oldSupportChats } = await supabase.from('chats')
                .select('*')
                .eq('type', 'support')
                .eq('user_id', session.user.id);

            let allChats = [...(allChatsData || [])];
            (oldSupportChats || []).forEach(osc => {
                if (!allChats.find(c => c.id === osc.id)) {
                    allChats.push(osc);
                }
            });

            // Chat de Suporte Oficial (Tabela chats de type 'support')
            let supportChannel = allChats.find(c => c.type === 'support');
            if (!supportChannel) {
                // Se não existir, cria o chat de suporte na tabela chats com participants
                const { data: newSc, error: createErr } = await supabase.from('chats').insert([{
                    name: `Suporte - ${session.user.email?.split('@')[0] || 'Cliente'}`,
                    type: 'support',
                    user_id: session.user.id,
                    participants: [session.user.id]
                }]).select().single();
                if (!createErr && newSc) {
                    supportChannel = newSc;
                    allChats.push(newSc);
                }
            }

            // Se veio pelo botão de contato do dev (DM)
            let addedDevChat = null;
            if (initDevId && initDevName) {
                // Buscar DM existente com ambos os IDs em participants
                const existingDm = allChats.find(c => 
                    c.type === 'dm' && 
                    c.participants && 
                    c.participants.includes(session.user.id) && 
                    c.participants.includes(initDevId)
                );
                
                if (existingDm) {
                    addedDevChat = existingDm;
                } else {
                    const myProfileName = prof?.name || session.user.email?.split('@')[0] || 'Cliente';
                    const { data: newDc } = await supabase.from('chats').insert([{
                        name: `DM - ${myProfileName} & ${initDevName}`,
                        type: 'dm',
                        user_id: session.user.id,
                        participants: [session.user.id, initDevId]
                    }]).select().single();
                    if (newDc) {
                        addedDevChat = newDc;
                        allChats.push(newDc);
                    }
                }
            }

            // Mapear perfis dos outros participantes de DMs
            const allParticipantIds = new Set<string>();
            allChats.forEach(c => {
                if (c.participants && Array.isArray(c.participants)) {
                    c.participants.forEach((pid: string) => {
                        if (pid !== session.user.id) {
                            allParticipantIds.add(pid);
                        }
                    });
                }
            });
            
            let profilesMap: Record<string, any> = {};
            if (allParticipantIds.size > 0) {
                const { data: profs } = await supabase
                    .from('profiles')
                    .select('id, name, email, role')
                    .in('id', Array.from(allParticipantIds));
                if (profs) {
                    profs.forEach(p => { profilesMap[p.id] = p; });
                }
            }

            // Formatar os canais do cliente com nomes reais
            const loadedChats = allChats.map(c => {
                let name = c.name;
                let isStaff = false;
                let sub = 'Rede Geral';
                
                if (c.type === 'support') {
                    name = 'Susanoo HQ';
                    isStaff = true;
                    sub = 'Suporte Oficial';
                } else if (c.type === 'dm') {
                    const otherId = c.participants?.find((pid: string) => pid !== session.user.id);
                    const otherProf = otherId ? profilesMap[otherId] : null;
                    if (otherProf) {
                        name = otherProf.name || otherProf.email?.split('@')[0] || 'Membro';
                        sub = otherProf.role === 'developer' ? 'Desenvolvedor' : (otherProf.role === 'admin' ? 'Administrador' : 'Cliente');
                    } else {
                        name = c.name?.replace('Chat com ', '') || 'Conversa Privada';
                        sub = 'Direct Message';
                    }
                }
                
                return {
                    ...c,
                    isProject: false,
                    name,
                    isStaff,
                    sub
                };
            });

            setChannels(loadedChats);

            let actCh = null;
            if (addedDevChat) {
                actCh = loadedChats.find(c => c.id === addedDevChat.id);
            } else if (supportChannel) {
                actCh = loadedChats.find(c => c.id === supportChannel.id);
            } else {
                actCh = loadedChats[0];
            }

            if (actCh && mounted) {
                setActiveChannel(actCh);
                await loadMessages(actCh);
            }
            if (mounted) setLoading(false);
        };
        init();
        return () => { mounted = false; };
    }, [router, initDevId, initDevName]);

    useEffect(() => {
        if (!activeChannel) return;
        const cid = activeChannel.id;
        const field = activeChannel.isProject ? 'project_id' : 'chat_id';
        const ch = supabase.channel(`chat-client-${cid}`, { config: { broadcast: { ack: true } } })
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

    const loadMessages = async (channel: any) => {
        const field = channel.isProject ? 'project_id' : 'chat_id';
        const { data } = await supabase.from('messages').select('*').eq(field, channel.id).order('created_at', { ascending: true });
        if (data) setMessages(data as Message[]);
    };

    const handleSelectChannel = async (channel: any) => {
        setActiveChannel(channel);
        setMessages([]);
        setStagedFiles([]);
        setPreviews([]);
        setTypingUsers([]);
        await loadMessages(channel);
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
        <div className="flex-1 flex overflow-hidden bg-background h-full relative text-white">

            <AnimatePresence>
                {showOnboarding && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                        className="absolute inset-0 z-[200] bg-black/80 backdrop-blur-xl flex items-center justify-center p-6">
                        <div className="bg-surface p-10 rounded-[3rem] border border-surface-border max-w-md w-full shadow-2xl">
                            <div className="w-16 h-16 bg-accent/10 rounded-2xl flex items-center justify-center mb-6">
                                <UserRound className="w-8 h-8 text-accent" />
                            </div>
                            <h2 className="text-3xl font-black mb-2 tracking-tighter">Como podemos te chamar?</h2>
                            <p className="text-sm text-foreground/40 mb-8">Defina seu nome que ficará visível em nossos canais de conversação.</p>
                            <input type="text" value={newName} onChange={e => setNewName(e.target.value)}
                                onKeyDown={e => e.key === 'Enter' && handleUpdateName()}
                                placeholder="Seu nome ou apelido..." autoFocus
                                className="w-full bg-background border border-surface-border p-5 rounded-2xl outline-none mb-6 focus:border-accent transition-colors" />
                            <button onClick={handleUpdateName} className="w-full bg-foreground text-background font-black py-5 rounded-2xl hover:scale-[1.02] active:scale-[0.98] transition-all">
                                SALVAR NOME
                            </button>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Sidebar */}
            <div className="w-[300px] border-r border-surface-border flex flex-col h-full bg-surface/30 shrink-0">
                <div className="p-6 border-b border-surface-border">
                    <h2 className="text-xl font-black text-foreground tracking-tighter mb-4">Mensagens</h2>
                    <div className="relative">
                        <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-foreground/30"/>
                        <input 
                            type="text" placeholder="Filtrar conversas..." 
                            value={searchTerm} onChange={e => setSearchTerm(e.target.value)}
                            className="w-full bg-background border border-surface-border text-xs p-3 pl-10 rounded-xl outline-none font-medium"
                        />
                    </div>
                </div>
                <div className="flex-1 overflow-y-auto p-4 space-y-2">
                    {channels.filter(c => c.name?.toLowerCase().includes(searchTerm.toLowerCase())).map(c => (
                        <button 
                            key={c.id}
                            onClick={() => handleSelectChannel(c)}
                            className={`w-full flex items-center gap-3 p-3 rounded-xl transition-all duration-200 cursor-pointer hover:scale-[1.02] active:scale-[0.98] ${activeChannel?.id === c.id ? 'bg-accent/10 border border-accent/20 shadow-sm' : 'hover:bg-surface border border-transparent hover:shadow-sm'}`}
                        >
                            <div className={`w-10 h-10 rounded-xl shrink-0 flex items-center justify-center font-black text-sm uppercase transition-colors ${activeChannel?.id === c.id ? 'bg-accent text-white shadow-lg shadow-accent/20' : 'bg-surface-border text-foreground/50 group-hover:bg-accent/20 group-hover:text-accent'}`}>
                                {c.isStaff ? <ShieldAlert className="w-5 h-5"/> : c.name?.substring(0,2)}
                            </div>
                            <div className="flex flex-col items-start overflow-hidden flex-1 text-left">
                                <span className="text-sm font-bold text-foreground truncate w-full">{c.name}</span>
                                <span className="text-[10px] text-foreground/50 font-bold uppercase">{c.sub}</span>
                            </div>
                        </button>
                    ))}
                </div>
            </div>

            {/* Main */}
            <div className="flex-1 flex flex-col h-full relative">
                {activeChannel ? (
                    <>
                        <div className="px-8 py-5 border-b border-surface-border flex justify-between items-center bg-background/60 backdrop-blur-md z-50">
                            <div className="flex items-center gap-4">
                                <div className="w-10 h-10 rounded-xl bg-accent/10 border border-accent/20 flex items-center justify-center text-accent">
                                    {activeChannel.isStaff ? <ShieldAlert className="w-5 h-5" /> : <UserRound className="w-5 h-5" />}
                                </div>
                                <div>
                                    <h1 className="font-bold text-foreground flex items-center gap-2">
                                        {activeChannel.name}
                                        <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                                    </h1>
                                    <p className="text-[10px] font-black text-foreground/30 uppercase tracking-widest">
                                        {activeChannel.sub}
                                    </p>
                                </div>
                            </div>
                        </div>

                        <div className="flex-1 overflow-y-auto px-6 py-8 flex flex-col gap-6 custom-scrollbar">
                            {loading && (
                                <div className="flex-1 flex items-center justify-center opacity-30">
                                    <Loader2 className="w-8 h-8 animate-spin" />
                                </div>
                            )}

                            {!loading && messages.length === 0 && (
                                <div className="flex-1 flex flex-col items-center justify-center opacity-20 py-20 gap-4">
                                    <Hash className="w-16 h-16" />
                                    <p className="font-black uppercase tracking-[0.3em] text-xs">Início da conversa</p>
                                </div>
                            )}

                            {messages.map((msg) => {
                                const isMe = msg.user_id === user?.id;
                                const isStaff = msg.sender_name?.startsWith('[STAFF]');
                                const displayName = isStaff ? msg.sender_name!.replace('[STAFF] ', '') : (msg.sender_name || 'Desconhecido');
                                const { text, inlineImages } = parseMessageContent(msg.content || '');
                                const isDirectImageUrl = !msg.file_url && msg.content?.match(/^https?:\/\/.+\.(png|jpg|jpeg|gif|webp)/i);

                                return (
                                    <motion.div key={msg.id}
                                        initial={{ opacity: 0, scale:0.95, originY: 1 }} animate={{ opacity: 1, scale:1 }}
                                        className={`flex w-full gap-3 ${isMe ? 'flex-row-reverse' : 'flex-row'}`}>

                                        {isStaff ? (
                                            <div className="w-10 h-10 rounded-full shrink-0 flex items-center justify-center text-[10px] font-black uppercase bg-accent border-accent/40 text-white shadow-[0_0_12px_rgba(var(--accent-rgb),0.5)]">
                                                HQ
                                            </div>
                                        ) : (
                                            <div className="w-10 h-10 rounded-full shrink-0 flex items-center justify-center text-[12px] font-black uppercase bg-surface border border-surface-border text-foreground/50">
                                                {displayName.charAt(0)}
                                            </div>
                                        )}

                                        <div className={`flex flex-col gap-1.5 max-w-[75%] ${isMe ? 'items-end' : 'items-start'}`}>
                                            <span className={`text-[10px] font-black uppercase tracking-widest ${isStaff ? 'text-accent' : 'text-foreground/40'}`}>
                                                {isMe ? `Você` : `${displayName} ${isStaff ? '· STAFF' : ''}`}
                                            </span>

                                            <div className={`px-5 py-4 shadow-sm relative ${isMe ? 'bg-foreground text-background rounded-l-2xl rounded-br-2xl' : 'bg-surface border border-surface-border text-foreground rounded-r-2xl rounded-bl-2xl'}`}>
                                                {msg.file_url && (
                                                    <div className="mb-3">
                                                        {msg.file_type?.startsWith('image/') || msg.file_url?.match(/\.(png|jpg|jpeg|gif|webp)/i) ? (
                                                            <img src={msg.file_url} alt="Anexo" onClick={() => window.open(msg.file_url, '_blank')} className="rounded-xl max-w-full max-h-72 object-cover cursor-pointer hover:scale-[1.02] transition-transform border border-black/5" />
                                                        ) : (
                                                            <div className={`flex items-center gap-3 p-3 rounded-xl ${isMe ? 'bg-background/10' : 'bg-background/60'}`}>
                                                                <FileText className="w-5 h-5 opacity-60" />
                                                                <span className="text-xs font-bold flex-1 truncate">{msg.file_url.split('/').pop()?.substring(14) || 'Documento'}</span>
                                                                <a href={msg.file_url} target="_blank" className="p-2 rounded-lg hover:bg-black/10 transition-colors"><Download className="w-4 h-4" /></a>
                                                            </div>
                                                        )}
                                                    </div>
                                                )}

                                                {inlineImages.map((img, i) => (
                                                    <div key={i} className="mb-3"><img src={img.url} alt={img.name} onClick={() => window.open(img.url, '_blank')} className="rounded-xl max-w-full max-h-72 object-cover cursor-pointer hover:scale-[1.02] transition-transform shadow-sm" /></div>
                                                ))}

                                                {isDirectImageUrl && (
                                                    <div className="mb-3"><img src={msg.content} alt="Anexo" onClick={() => window.open(msg.content, '_blank')} className="rounded-xl max-w-full max-h-72 object-cover cursor-pointer hover:scale-[1.02] transition-transform" /></div>
                                                )}

                                                {text && !isDirectImageUrl && (
                                                    <p className="text-[14px] font-medium leading-relaxed whitespace-pre-wrap">{text}</p>
                                                )}

                                                <p className={`text-[9px] font-black mt-2 opacity-30 ${isMe ? 'text-right' : 'text-left'}`}>
                                                    {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                </p>
                                            </div>
                                        </div>
                                    </motion.div>
                                );
                            })}

                            <AnimatePresence>
                                {typingUsers.length > 0 && (
                                    <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-full bg-accent/10 flex items-center justify-center text-[10px] font-black text-accent"><Loader2 className="w-4 h-4 animate-spin"/></div>
                                        <span className="text-[10px] text-foreground/40 font-bold uppercase tracking-widest">{typingUsers[0]} digitando...</span>
                                    </motion.div>
                                )}
                            </AnimatePresence>

                            <div ref={messagesEndRef} />
                        </div>

                        <div className="px-6 pb-6 bg-background">
                            <div className="max-w-4xl mx-auto flex flex-col gap-3">
                                <AnimatePresence>
                                    {previews.length > 0 && (
                                        <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="flex gap-3 flex-wrap p-3 bg-surface border border-surface-border rounded-2xl">
                                            {previews.map((p, i) => (
                                                <div key={i} className="relative w-16 h-16 group">
                                                    {p === 'file' ? <div className="w-full h-full bg-background border border-surface-border rounded-xl flex items-center justify-center"><FileText className="w-6 h-6 text-foreground/30" /></div> : <img src={p} className="w-full h-full object-cover rounded-xl" />}
                                                    <button onClick={() => removeStagedFile(i)} className="absolute -top-2 -right-2 w-5 h-5 bg-red-500 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"><X className="w-3 h-3" /></button>
                                                </div>
                                            ))}
                                        </motion.div>
                                    )}
                                </AnimatePresence>

                                <form onSubmit={handleSend} className="bg-surface border border-surface-border rounded-[1.5rem] p-1.5 flex items-center gap-2 focus-within:border-accent/40 shadow-sm transition-colors">
                                    <button type="button" onClick={() => fileInputRef.current?.click()} className="w-11 h-11 rounded-full flex items-center justify-center text-foreground/40 hover:text-accent transition-colors"><Paperclip className="w-5 h-5" /></button>
                                    <input type="file" multiple hidden ref={fileInputRef} onChange={handleFileSelect} />
                                    <input type="text" value={content} onChange={e => { setContent(e.target.value); handleTyping(); }} placeholder="Escreva sua mensagem..." className="flex-1 bg-transparent py-3 px-2 outline-none text-foreground font-medium text-sm placeholder:text-foreground/30" />
                                    <button type="submit" disabled={loading || (!content.trim() && stagedFiles.length === 0)} className="w-12 h-12 rounded-[1.2rem] bg-accent flex items-center justify-center shadow-md shadow-accent/20 hover:opacity-90 active:scale-95 transition-all disabled:opacity-30"><Send className="w-5 h-5 text-white ml-1" /></button>
                                </form>
                            </div>
                        </div>
                    </>
                ) : (
                    <div className="flex-1 flex flex-col items-center justify-center opacity-20 gap-4">
                        <UserRound className="w-16 h-16" />
                        <p className="font-black uppercase tracking-[0.3em] text-xs">Selecione uma conversa</p>
                    </div>
                )}
            </div>
        </div>
    );
}

export default function ChatPage() {
    return (
        <Suspense fallback={<div className="h-full flex items-center justify-center text-accent"><Loader2 className="w-8 h-8 animate-spin"/></div>}>
            <ChatPageContent />
        </Suspense>
    );
}
