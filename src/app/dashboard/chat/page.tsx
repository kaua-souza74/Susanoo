"use client";
import { useEffect, useState, useRef } from "react";
import { supabase } from "@/lib/supabase";
import { useRouter } from "next/navigation";
import { 
    Send, 
    Hash, 
    Info, 
    MoreHorizontal, 
    Video, 
    Phone, 
    UserRound, 
    Search, 
    CornerUpLeft, 
    Trash2, 
    Pencil, 
    X,
    Paperclip,
    Image as ImageIcon,
    FileText,
    Download
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

type Message = { 
    id: string; 
    content: string; 
    created_at: string; 
    user_id: string; 
    file_url?: string;
    file_type?: string;
    profiles?: { name: string; role: string; } 
};

const parseReply = (content: string) => {
    if (content && content.startsWith("[REPLY:")) {
        const match = content.match(/^\[REPLY:([^|]+)\|([\s\S]*?)\]([\s\S]*)$/);
        if (match) {
            return {
                isReply: true,
                replyToName: match[1],
                replyToContent: match[2],
                actualContent: match[3]
            };
        }
    }
    return { isReply: false, actualContent: content || "" };
};

export default function ChatPage() {
    const [messages, setMessages] = useState<Message[]>([]);
    const [content, setContent] = useState("");
    const [user, setUser] = useState<any>(null);
    const [project, setProject] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [typingUsers, setTypingUsers] = useState<string[]>([]);
    const [replyingTo, setReplyingTo] = useState<Message | null>(null);
    const [editingMessage, setEditingMessage] = useState<Message | null>(null);
    
    // File Staging (WhatsApp Style)
    const [stagedFiles, setStagedFiles] = useState<File[]>([]);
    const [previews, setPreviews] = useState<string[]>([]);
    
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const chatChannelRef = useRef<any>(null);
    const typingTimeoutRef = useRef<any>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const router = useRouter();

    const getMyName = () => user?.user_metadata?.full_name || user?.email?.split('@')[0] || 'Agente';

    const handleTyping = () => {
        if (!chatChannelRef.current) return;
        chatChannelRef.current.send({
            type: 'broadcast',
            event: 'typing',
            payload: { name: getMyName(), isTyping: true }
        });

        if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
        typingTimeoutRef.current = setTimeout(() => {
            if (chatChannelRef.current) {
                chatChannelRef.current.send({
                    type: 'broadcast',
                    event: 'typing',
                    payload: { name: getMyName(), isTyping: false }
                });
            }
        }, 2000);
    };

    useEffect(() => {
      let isMounted = true;
      const init = async () => {
          const { data: { session } } = await supabase.auth.getSession();
          if (!session) return router.push("/login");
          if (!isMounted) return;
          setUser(session.user);
          
          const { data: projs } = await supabase.from('projects').select('*').eq('client_id', session.user.id);
          if (projs && projs.length > 0 && isMounted) {
              setProject(projs[0]);
              await loadMessages(projs[0].id);
              subscribeChat(projs[0].id);
          }
          if (isMounted) setTimeout(() => setLoading(false), 800); 
      };
      init();
      return () => { 
        isMounted = false;
        supabase.removeAllChannels(); 
      };
    }, [router]);

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages]);

    // Otimização: O Realtime no subscribeChat já cuida de novos dados. 
    // Removendo setInterval para evitar conflitos de cache e race conditions.
    const loadMessages = async (pid: string) => {
        const { data } = await supabase.from('messages').select('*, profiles:user_id(name, role)').eq('project_id', pid).order('created_at', { ascending: true });
        if (data) setMessages(data as unknown as Message[]);
    };

    const subscribeChat = (pid: string) => {
        const chatChannel = supabase.channel(`project_chat_${pid}`)
            .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'messages', filter: `project_id=eq.${pid}` }, (payload) => {
                const newMessage = payload.new as Message;
                setMessages(prev => {
                    if (prev.find(m => m.id === newMessage.id)) return prev;
                    return [...prev, newMessage];
                });
                loadMessages(pid);
            })
            .on('broadcast', { event: 'typing' }, (payload) => {
                const { name, isTyping } = payload.payload;
                if (name === getMyName()) return;
                
                setTypingUsers(prev => {
                    if (isTyping) {
                        if (prev.includes(name)) return prev;
                        return [...prev, name];
                    } else {
                        return prev.filter(n => n !== name);
                    }
                });
            })
            .subscribe();

        chatChannelRef.current = chatChannel;
    };

    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = Array.from(e.target.files || []);
        if (files.length === 0) return;

        setStagedFiles(prev => [...prev, ...files]);
        
        const newPreviews = files.map(file => {
            if (file.type.startsWith('image/')) return URL.createObjectURL(file);
            return 'file'; // Placeholder for non-image files
        });
        setPreviews(prev => [...prev, ...newPreviews]);
    };

    const removeStagedFile = (index: number) => {
        setStagedFiles(prev => prev.filter((_, i) => i !== index));
        setPreviews(prev => {
            const newPreviews = [...prev];
            if (newPreviews[index] !== 'file') URL.revokeObjectURL(newPreviews[index]);
            return newPreviews.filter((_, i) => i !== index);
        });
    };

    const handleSend = async (e: React.FormEvent) => {
        e.preventDefault();
        if ((!content.trim() && stagedFiles.length === 0) || !project) return;
        
        const msgContent = content;
        const currentStaged = [...stagedFiles];
        
        setContent("");
        setStagedFiles([]);
        setPreviews([]);

        if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
        if (chatChannelRef.current) {
            chatChannelRef.current.send({
                type: 'broadcast',
                event: 'typing',
                payload: { name: getMyName(), isTyping: false }
            });
        }

        // Upload files first if any
        let uploadedUrls: {url: string, type: string}[] = [];
        for (const file of currentStaged) {
            const fileName = `${Date.now()}_${file.name}`;
            const { data, error } = await supabase.storage.from('chat_attachments').upload(`${project.id}/${fileName}`, file);
            if (!error && data) {
                const { data: { publicUrl } } = supabase.storage.from('chat_attachments').getPublicUrl(data.path);
                uploadedUrls.push({ url: publicUrl, type: file.type });
            }
        }

        if (editingMessage) {
            const parsed = parseReply(editingMessage.content);
            const newContent = parsed.isReply
                ? `[REPLY:${parsed.replyToName}|${parsed.replyToContent}]${msgContent}`
                : msgContent;

            await supabase.from('messages').update({ content: newContent }).eq('id', editingMessage.id);
            setEditingMessage(null);
            return;
        }

        let finalContent = msgContent;
        if (replyingTo) {
            const parsedParent = parseReply(replyingTo.content);
            const parentAuthor = replyingTo.profiles?.name || (replyingTo.user_id === user?.id ? 'Você' : 'Suporte');
            let snippet = parsedParent.actualContent;
            if (snippet.length > 60) snippet = snippet.substring(0, 60) + "...";
            finalContent = `[REPLY:${parentAuthor}|${snippet}]${msgContent}`;
            setReplyingTo(null);
        }

        // Send multiple messages if there are multiple files? 
        // For now, let's send one message per file + text message if text exists
        if (uploadedUrls.length > 0) {
            for (const item of uploadedUrls) {
                await supabase.from('messages').insert([{
                    project_id: project.id,
                    user_id: user.id,
                    content: finalContent || (item.type.startsWith('image/') ? '📷 Imagem' : '📎 Arquivo'),
                    file_url: item.url,
                    file_type: item.type
                }]);
                finalContent = ""; // Send text only with the first file or as its own message later
            }
        } else {
            await supabase.from('messages').insert([
                { project_id: project.id, user_id: user.id, content: finalContent }
            ]);
        }
        
        loadMessages(project.id);
    };

    if (loading) return (
        <div className="flex-1 flex flex-col items-center justify-center bg-background">
            <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1, ease: "linear" }} className="w-12 h-12 border-[3px] border-surface-border border-t-accent rounded-full mb-4" />
            <p className="text-sm font-black text-foreground/30 tracking-widest uppercase">Initializing Secure Channel...</p>
        </div>
    );

    return (
        <div className="flex-1 flex flex-col h-full bg-background relative overflow-hidden">
             {/* Topbar Modern Glass */}
             <div className="p-6 px-10 border-b border-surface-border flex items-center justify-between bg-background/60 backdrop-blur-2xl sticky top-0 z-[60]">
                <div className="flex items-center gap-6">
                    <div className="w-14 h-14 rounded-[20px] bg-surface flex items-center justify-center text-foreground shadow-2xl border border-surface-border relative group">
                        <div className="absolute inset-0 bg-gradient-to-br from-accent to-blue-600 opacity-0 group-hover:opacity-20 transition-opacity rounded-[20px]" />
                        <span className="font-black text-2xl tracking-tighter bg-gradient-to-br from-accent to-blue-500 bg-clip-text text-transparent">{project?.name?.substring(0,2).toUpperCase() || 'HQ'}</span>
                    </div>
                    <div className="flex flex-col justify-center gap-1">
                        <h1 className="font-black text-xl text-foreground tracking-tight flex items-center gap-3 leading-none">
                            {project?.name || "Workspace"} 
                            <span className="bg-emerald-500/10 border border-emerald-500/20 text-[9px] uppercase font-black tracking-[0.2em] px-2.5 py-1 rounded-full text-emerald-500">Live</span>
                        </h1>
                        <p className="text-[11px] font-black text-foreground/30 uppercase tracking-[0.1em] flex items-center gap-2">
                           <span className="w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.5)]"></span> Conexão Segura Ativa
                        </p>
                    </div>
                </div>
                
                <div className="hidden md:flex flex-row items-center gap-4 text-foreground/50">
                    <div className="flex -space-x-3 mr-4">
                        {['D', 'V', 'L', 'K'].map((initial, i) => (
                            <div key={i} className="w-9 h-9 rounded-full border-2 border-background bg-surface flex items-center justify-center text-[10px] font-black text-foreground/40 shadow-lg" title={`Agente ${initial}`}>
                                {initial}
                            </div>
                        ))}
                    </div>
                    <button className="p-3 hover:bg-surface rounded-2xl transition-all border border-transparent hover:border-surface-border"><Video className="w-5 h-5"/></button>
                    <button className="p-3 hover:bg-surface rounded-2xl transition-all border border-transparent hover:border-surface-border"><Phone className="w-5 h-5"/></button>
                    <div className="w-px h-6 bg-surface-border mx-2" />
                    <button className="p-3 hover:bg-surface rounded-2xl transition-all border border-transparent hover:border-surface-border"><Info className="w-5 h-5"/></button>
                </div>
             </div>

             {/* Message Feed */}
             <div className="flex-1 overflow-y-auto p-10 pt-20 custom-scrollbar relative z-10 flex flex-col gap-12">
                {messages.length === 0 && (
                    <div className="h-full flex flex-col items-center justify-center opacity-20 py-20">
                        <UserRound className="w-20 h-20 mb-6" />
                        <p className="font-black uppercase tracking-[0.4em] text-sm">Início da Transmissão Segura</p>
                    </div>
                )}
                
                {messages.map((msg, idx) => {
                    const isMe = msg.user_id === user?.id;
                    const parsed = parseReply(msg.content);
                    const prevMsg = idx > 0 ? messages[idx-1] : null;
                    const showAuthor = !prevMsg || prevMsg.user_id !== msg.user_id;

                    return (
                        <motion.div 
                            initial={{ opacity: 0, x: isMe ? 20 : -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            key={msg.id} 
                            className={`flex flex-col ${isMe ? 'items-end text-right' : 'items-start text-left'}`}
                        >
                            {showAuthor && (
                                <div className="flex items-center gap-3 mb-4">
                                    {!isMe && <div className="w-8 h-8 rounded-xl bg-accent/20 flex items-center justify-center text-[10px] font-black text-accent">{msg.profiles?.name?.substring(0,1) || 'S'}</div>}
                                    <span className="text-[10px] font-black uppercase tracking-[0.2em] text-foreground/40">
                                        {isMe ? 'VOCÊ (CLIENTE)' : `${msg.profiles?.name || 'SUSANOO HQ'} • ${msg.profiles?.role || 'Agente'}`}
                                    </span>
                                    {isMe && <div className="w-8 h-8 rounded-xl bg-blue-500/20 flex items-center justify-center text-[10px] font-black text-blue-500">C</div>}
                                </div>
                            )}

                            <div className={`group relative max-w-[85%] sm:max-w-2xl`}>
                                {/* Context Menu Actions */}
                                <div className={`absolute top-0 ${isMe ? '-left-12' : '-right-12'} opacity-0 group-hover:opacity-100 transition-opacity flex flex-col gap-1`}>
                                    <button onClick={() => setReplyingTo(msg)} className="p-2 hover:bg-surface rounded-lg text-foreground/40 hover:text-accent"><CornerUpLeft className="w-4 h-4"/></button>
                                    {isMe && (
                                        <>
                                            <button onClick={() => { setEditingMessage(msg); setContent(parsed.actualContent); }} className="p-2 hover:bg-surface rounded-lg text-foreground/40 hover:text-blue-500"><Pencil className="w-3.5 h-3.5"/></button>
                                            <button onClick={async () => await supabase.from('messages').delete().eq('id', msg.id)} className="p-2 hover:bg-surface rounded-lg text-foreground/40 hover:text-red-500"><Trash2 className="w-4 h-4"/></button>
                                        </>
                                    )}
                                </div>

                                <div className={`p-6 rounded-[32px] shadow-sm relative overflow-hidden transition-all ${
                                    isMe 
                                    ? 'bg-accent text-white rounded-tr-sm' 
                                    : 'bg-surface border border-surface-border text-foreground rounded-tl-sm'
                                }`}>
                                    {parsed.isReply && (
                                        <div className={`mb-4 p-4 rounded-2xl text-[13px] border-l-4 ${isMe ? 'bg-white/10 border-white/40' : 'bg-foreground/5 border-accent/40'} opacity-80 backdrop-blur-sm`}>
                                            <p className="font-black uppercase tracking-widest text-[9px] mb-2">{parsed.replyToName}</p>
                                            <p className="italic line-clamp-2">{parsed.replyToContent}</p>
                                        </div>
                                    )}

                                    {msg.file_url && (
                                        <div className="mb-4">
                                            {msg.file_type?.startsWith('image/') ? (
                                                <img src={msg.file_url} alt="Attachment" className="rounded-2xl max-w-full h-auto cursor-pointer hover:opacity-90 transition-opacity" onClick={() => window.open(msg.file_url, '_blank')} />
                                            ) : (
                                                <div className="bg-black/30 p-4 rounded-2xl flex items-center justify-between gap-4">
                                                    <div className="flex items-center gap-3">
                                                        <div className="p-2 bg-white/10 rounded-lg"><FileText className="w-5 h-5"/></div>
                                                        <span className="text-xs font-bold truncate max-w-[150px]">Arquivo Anexo</span>
                                                    </div>
                                                    <a href={msg.file_url} download target="_blank" className="p-2 hover:bg-white/20 rounded-full transition-colors"><Download className="w-4 h-4"/></a>
                                                </div>
                                            )}
                                        </div>
                                    )}

                                    <p className="text-[15px] font-medium leading-relaxed whitespace-pre-wrap">{parsed.actualContent}</p>
                                    
                                    <div className={`mt-3 flex items-center gap-2 text-[9px] font-black uppercase tracking-widest opacity-40 ${isMe ? 'justify-end' : 'justify-start'}`}>
                                        {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                        {isMe && <div className="w-1 h-1 rounded-full bg-white/40" />}
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    );
                })}
                <div ref={messagesEndRef} className="pb-10" />

                {/* Typing Indicator */}
                <AnimatePresence>
                {typingUsers.length > 0 && (
                    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="flex items-center gap-3">
                        <div className="flex gap-1.5 p-3 px-4 bg-surface/50 border border-surface-border rounded-full shadow-lg">
                            <span className="w-1.5 h-1.5 rounded-full bg-accent animate-bounce" style={{ animationDelay: '0s' }}></span>
                            <span className="w-1.5 h-1.5 rounded-full bg-accent animate-bounce" style={{ animationDelay: '0.2s' }}></span>
                            <span className="w-1.5 h-1.5 rounded-full bg-accent animate-bounce" style={{ animationDelay: '0.4s' }}></span>
                        </div>
                        <span className="text-[10px] font-black text-foreground/40 uppercase tracking-widest">{typingUsers[0]} está digitando...</span>
                    </motion.div>
                )}
                </AnimatePresence>
             </div>

             {/* Input Area (WhatsApp Style with Preview) */}
             <div className="p-6 md:p-10 relative z-[70]">
                <div className="max-w-7xl mx-auto flex flex-col gap-4">
                    
                    {/* Staged Files Preview (WhatsApp Style) */}
                    <AnimatePresence>
                    {stagedFiles.length > 0 && (
                        <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="bg-surface/50 backdrop-blur-2xl border border-surface-border rounded-[2rem] p-4 flex flex-wrap gap-4 mb-2 overflow-hidden items-center">
                            <div className="w-full flex justify-between items-center px-2 mb-2">
                                <span className="text-[10px] font-black uppercase tracking-widest text-foreground/40">Anexos para enviar ({stagedFiles.length})</span>
                                <button onClick={() => { setStagedFiles([]); setPreviews([]); }} className="text-[9px] font-black text-red-500 hover:scale-105 transition-transform uppercase tracking-widest">Limpar Tudo</button>
                            </div>
                            {previews.map((preview, i) => (
                                <div key={i} className="relative group">
                                    <div className="w-24 h-24 rounded-2xl border border-surface-border bg-black/40 overflow-hidden flex items-center justify-center relative">
                                        {preview === 'file' ? (
                                            <div className="flex flex-col items-center gap-1 opacity-40">
                                                <FileText className="w-8 h-8" />
                                                <span className="text-[8px] font-black uppercase tracking-tighter truncate max-w-[80px]">{stagedFiles[i].name}</span>
                                            </div>
                                        ) : (
                                            <img src={preview} alt="Staged" className="w-full h-full object-cover" />
                                        )}
                                    </div>
                                    <button 
                                        type="button"
                                        onClick={() => removeStagedFile(i)}
                                        className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center shadow-lg hover:scale-110 transition-transform z-10"
                                    >
                                        <X className="w-3 h-3" />
                                    </button>
                                </div>
                            ))}
                            <button 
                                type="button"
                                onClick={() => fileInputRef.current?.click()}
                                className="w-24 h-24 rounded-2xl border-2 border-dashed border-surface-border flex items-center justify-center text-foreground/20 hover:text-accent hover:border-accent/40 transition-all"
                            >
                                <Paperclip className="w-8 h-8" />
                            </button>
                        </motion.div>
                    )}
                    </AnimatePresence>

                    {/* Staging reply/edit indicator */}
                    <AnimatePresence>
                    {(replyingTo || editingMessage) && (
                        <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="flex items-center justify-between bg-surface/50 backdrop-blur-2xl border border-surface-border rounded-t-[2.5rem] p-6 pb-2 -mb-6 relative z-0 border-b-0">
                            <div className="flex items-start gap-4">
                                <div className={`p-2 rounded-xl ${editingMessage ? 'bg-blue-500/10 text-blue-500' : 'bg-accent/10 text-accent'}`}>
                                    {editingMessage ? <Pencil className="w-4 h-4"/> : <CornerUpLeft className="w-4 h-4"/>}
                                </div>
                                <div className="flex flex-col gap-1">
                                    <span className="text-[10px] font-black uppercase tracking-widest text-foreground/40">{editingMessage ? 'Editando sua mensagem' : `Respondendo a ${replyingTo?.profiles?.name || 'Agente'}`}</span>
                                    <p className="text-sm font-medium text-foreground/70 truncate italic max-w-[300px]">"{parseReply(replyingTo?.content || editingMessage?.content || "").actualContent}"</p>
                                </div>
                            </div>
                            <button type="button" onClick={() => { setReplyingTo(null); setEditingMessage(null); if(editingMessage) setContent(""); }} className="p-2 hover:bg-foreground/5 rounded-full transition-colors"><X className="w-5 h-5"/></button>
                        </motion.div>
                    )}
                    </AnimatePresence>

                    {/* Main Input Floating Card */}
                    <motion.form 
                        onSubmit={handleSend}
                        className="bg-surface/80 backdrop-blur-3xl border border-surface-border p-3 rounded-[2.5rem] shadow-[0_32px_64px_-16px_rgba(0,0,0,0.5)] focus-within:border-accent/40 transition-all flex items-center gap-3 pr-4 group relative z-10"
                    >
                        <button 
                            type="button" 
                            onClick={() => fileInputRef.current?.click()}
                            className="w-12 h-12 rounded-full flex items-center justify-center text-foreground/30 hover:text-accent hover:bg-accent/5 transition-all ml-2"
                        >
                            <Paperclip className="w-6 h-6" />
                        </button>
                        <input 
                            type="file" 
                            multiple 
                            className="hidden" 
                            ref={fileInputRef} 
                            onChange={handleFileSelect}
                        />

                        <div className="flex-1 relative flex items-center">
                            <input 
                                type="text" 
                                value={content}
                                onChange={e => { setContent(e.target.value); handleTyping(); }}
                                placeholder={editingMessage ? "Edite sua mensagem..." : "Fale com a Equipe Susanoo..."}
                                className="w-full bg-transparent p-5 px-6 outline-none text-foreground font-medium text-[16px] placeholder:text-foreground/20"
                                disabled={!project}
                            />
                            <div className="absolute inset-0 bg-accent/5 rounded-full blur-[20px] opacity-0 group-focus-within:opacity-100 transition-opacity pointer-events-none" />
                        </div>
                        
                        <div className="hidden sm:flex items-center gap-2 pr-2">
                             <div className="w-px h-6 bg-surface-border mx-2" />
                             <button 
                                type="button" 
                                onClick={() => fileInputRef.current?.click()}
                                className="p-3 text-foreground/30 hover:text-foreground/60 transition-colors"
                             >
                                <ImageIcon className="w-5 h-5"/>
                             </button>
                        </div>

                        <button 
                            type="submit"
                            disabled={(!content.trim() && stagedFiles.length === 0) || !project}
                            className="w-14 h-14 rounded-full bg-accent text-white flex items-center justify-center shadow-xl shadow-accent/20 hover:scale-105 active:scale-95 transition-all disabled:opacity-30 disabled:grayscale disabled:hover:scale-100"
                        >
                            <Send className="w-6 h-6" />
                        </button>
                    </motion.form>
                </div>
             </div>
        </div>
    );
}
