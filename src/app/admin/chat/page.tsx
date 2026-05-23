"use client";
import { useEffect, useState, useRef } from "react";
import { supabase } from "@/lib/supabase";
import { 
    Send, 
    Search, 
    Users, 
    Phone, 
    Video, 
    MoreHorizontal, 
    Hash, 
    Plus, 
    PlusCircle, 
    Settings, 
    Pin, 
    X, 
    Paperclip, 
    CornerUpLeft, 
    Trash2, 
    Pencil,
    Image as ImageIcon,
    FileText,
    Download,
    UserCircle,
    PlusSquare,
    Edit3
} from "lucide-react";
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
    return { isReply: false, replyToName: "", replyToContent: "", actualContent: content || "" };
};

// Extrai imagens embutidas em formato markdown [IMAGE](url)|filename ou ![alt](url)
function parseInlineImages(content: string): { text: string; inlineImages: { url: string; name: string }[] } {
    const inlineImages: { url: string; name: string }[] = [];
    const replaced = content
        .replace(/\[IMAGE\]\((https?:\/\/[^)]+)\)\|([^\n]+)/g, (_, url, name) => {
            inlineImages.push({ url, name });
            return '';
        })
        .replace(/!\[([^\]]*)\]\((https?:\/\/[^)]+)\)/g, (_, alt, url) => {
            inlineImages.push({ url, name: alt || 'Imagem' });
            return '';
        })
        .trim();
    return { text: replaced, inlineImages };
}

export default function AdminTeamsChat() {
   const [user, setUser] = useState<any>(null);
   const [adminProfile, setAdminProfile] = useState<any>(null);
   const [channels, setChannels] = useState<any[]>([]);
   const [activeChannel, setActiveChannel] = useState<any>(null);
   const [messages, setMessages] = useState<Message[]>([]);
   const [content, setContent] = useState("");
   const [searchTerm, setSearchTerm] = useState("");
   const [typingUsers, setTypingUsers] = useState<string[]>([]);
   const [replyingTo, setReplyingTo] = useState<Message | null>(null);
   const [editingMessage, setEditingMessage] = useState<Message | null>(null);
   
   // Group CRUD State
   const [isModalOpen, setIsModalOpen] = useState(false);
   const [groupName, setGroupName] = useState("");
   const [isEditingChat, setIsEditingChat] = useState<any>(null);

   // Attachment Staging
   const [stagedFiles, setStagedFiles] = useState<File[]>([]);
   const [previews, setPreviews] = useState<string[]>([]);
   
   const messagesEndRef = useRef<HTMLDivElement>(null);
   const chatChannelRef = useRef<any>(null);
   const typingTimeoutRef = useRef<any>(null);
   const fileInputRef = useRef<HTMLInputElement>(null);

   // Retorna o nome do staff de forma confiável
   const getMyName = (currentUser = user, currentProfile = adminProfile) => {
       // Prioridade 1: nome salvo na tabela profiles
       if (currentProfile?.name) return currentProfile.name;
       // Prioridade 2: mapeamento por email
       if (currentUser?.email) {
           const emailLower = currentUser.email.toLowerCase();
           if (emailLower === 'kauasesi156@gmail.com' || emailLower.startsWith('kaua')) return 'Kauã';
           if (emailLower === 'vinicius172321@gmail.com' || emailLower.startsWith('vinicius')) return 'Vinícius';
           if (emailLower === 'davi@susanoo.com' || emailLower.startsWith('davi')) return 'Davi';
           if (emailLower === 'limasilvallsss@gmail.com' || emailLower.startsWith('lucas')) return 'Lucas';
           // Prioridade 3: user_metadata ou parte do email
           return currentUser.user_metadata?.full_name || currentUser.user_metadata?.name || currentUser.email.split('@')[0];
       }
       return 'Staff';
   };

   useEffect(() => {
       fetchData();
       return () => { supabase.removeAllChannels(); }
   }, []);


   useEffect(() => { messagesEndRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages]);

   useEffect(() => {
       if (!activeChannel) return;
       
       const id = activeChannel.id;
       const filterField = activeChannel.isProject ? 'project_id' : 'chat_id';
       
       const channel = supabase.channel(`chat-${id}`, { 
           config: { broadcast: { ack: true } } 
       })
       .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'messages' }, (payload: any) => {
           if (payload.new[filterField] === id) {
               setMessages(prev => {
                   if (prev.find(m => m.id === payload.new.id)) return prev;
                   return [...prev, payload.new];
               });
           }
       })
       .on('broadcast', { event: 'sync' }, ({ payload }) => {
           if (payload?.newMessage && payload.newMessage[filterField] === id) {
               setMessages(prev => {
                   if (prev.find(m => m.id === payload.newMessage.id)) return prev;
                   return [...prev, payload.newMessage];
               });
           }
       })
       .on('broadcast', { event: 'typing' }, ({ payload }) => {
           const { name, isTyping } = payload;
           if (name === getMyName()) return;
           setTypingUsers(prev => isTyping ? [...new Set([...prev, name])] : prev.filter(n => n !== name));
       })
       .subscribe();

       chatChannelRef.current = channel;
       return () => { supabase.removeChannel(channel); }
   }, [activeChannel?.id]);

   const fetchData = async () => {
       const { data: { session } } = await supabase.auth.getSession();
       if (session) {
           setUser(session.user);
           // Buscar perfil do admin para ter o nome certo
           const { data: prof } = await supabase
               .from('profiles')
               .select('*')
               .eq('id', session.user.id)
               .single();

           // Verificar se o usuário tem permissão de admin ou staff
           if (prof && prof.role === 'client') {
               window.location.href = '/dashboard/chat';
               return;
           }

           if (prof && prof.name) {
               setAdminProfile(prof);
           } else {
               // Se não tem nome, derivar do email e salvar para uso futuro
               const emailLower = session.user.email?.toLowerCase() || '';
               let derivedName = 'Staff';
               if (emailLower === 'kauasesi156@gmail.com' || emailLower.startsWith('kaua')) derivedName = 'Kauã';
               else if (emailLower === 'vinicius172321@gmail.com' || emailLower.startsWith('vinicius')) derivedName = 'Vinícius';
               else if (emailLower === 'davi@susanoo.com' || emailLower.startsWith('davi')) derivedName = 'Davi';
               else if (emailLower === 'limasilvallsss@gmail.com' || emailLower.startsWith('lucas')) derivedName = 'Lucas';
               else derivedName = session.user.user_metadata?.full_name || session.user.user_metadata?.name || emailLower.split('@')[0];
               
               await supabase.from('profiles').upsert({
                   id: session.user.id,
                   name: derivedName,
                   updated_at: new Date().toISOString()
               });
               setAdminProfile({ ...prof, name: derivedName });
           }
       }
       
       const { data: projs } = await supabase.from('projects').select('*');
       const { data: custChats } = await supabase.from('chats').select('*');
       
       const all = [
           ...(projs || []).map(p => ({ ...p, isProject: true })),
           ...(custChats || []).map(c => ({ ...c, isProject: false }))
       ];
       setChannels(all);
       if (all.length > 0 && !activeChannel) setActiveChannel(all[0]);
   };


   const loadMessages = async (channel: any) => {
        const filterField = channel.isProject ? 'project_id' : 'chat_id';
        const { data } = await supabase.from('messages').select('*').eq(filterField, channel.id).order('created_at', { ascending: true });
        if (data) setMessages(data as any || []);
   };

   const handleSelectChannel = async (channel: any) => {
       setActiveChannel(channel);
       setReplyingTo(null);
       setEditingMessage(null);
       setStagedFiles([]);
       setPreviews([]);
       setTypingUsers([]);
       await loadMessages(channel);
   };

   const handleCreateGroup = async () => {
       if (!groupName.trim()) return;
       
       if (isEditingChat) {
           const { error } = await supabase.from('chats').update({ name: groupName }).eq('id', isEditingChat.id);
           if (!error) {
               setChannels(prev => prev.map(c => c.id === isEditingChat.id ? { ...c, name: groupName } : c));
               setIsEditingChat(null);
           }
       } else {
           const { data, error } = await supabase.from('chats').insert([{ name: groupName, type: 'group' }]).select().single();
           if (data) {
               const newChat = { ...data, isProject: false };
               setChannels(prev => [...prev, newChat]);
               setActiveChannel(newChat);
               loadMessages(newChat);
           }
       }
       setGroupName("");
       setIsModalOpen(false);
   };

   const handleDeleteChat = async (id: string) => {
       if (!confirm("Deseja realmente excluir este grupo?")) return;
       const { error } = await supabase.from('chats').delete().eq('id', id);
       if (!error) {
           setChannels(prev => prev.filter(c => c.id !== id));
           if (activeChannel?.id === id) {
               setActiveChannel(channels[0] || null);
           }
       }
   };

   const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
       const files = Array.from(e.target.files || []);
       setStagedFiles(prev => [...prev, ...files]);
       const newPreviews = files.map(file => file.type.startsWith('image/') ? URL.createObjectURL(file) : 'file');
       setPreviews(prev => [...prev, ...newPreviews]);
   };

   const removeStagedFile = (index: number) => {
       setStagedFiles(prev => prev.filter((_, i) => i !== index));
       setPreviews(prev => {
           if (prev[index] !== 'file') URL.revokeObjectURL(prev[index]);
           return prev.filter((_, i) => i !== index);
       });
   };

   const handleSend = async (e: React.FormEvent) => {
       e.preventDefault();
       if ((!content.trim() && stagedFiles.length === 0) || !activeChannel) return;
       
       const temp = content;
       const currentStaged = [...stagedFiles];
       setContent("");
       setStagedFiles([]);
       setPreviews([]);

       // ✅ Capturar o nome ANTES do upload assíncrono, passando os valores atuais
       // para evitar que o estado mude durante o processo
       const currentUser = user;
       const currentProfile = adminProfile;
       const staffName = `[STAFF] ${getMyName(currentUser, currentProfile)}`;

       // Upload de arquivos
       const uploaded: { url: string; type: string; name: string }[] = [];
       for (const file of currentStaged) {
           const fname = `${Date.now()}_${file.name}`;
           const { data, error } = await supabase.storage.from('teams_media').upload(fname, file);
           if (data) {
               const { data: { publicUrl } } = supabase.storage.from('teams_media').getPublicUrl(data.path);
               uploaded.push({ url: publicUrl, type: file.type, name: file.name });
           } else if (error) {
               console.error('Upload falhou:', error.message);
           }
       }

       if (editingMessage) {
           const parsed = parseReply(editingMessage.content);
           const newContent = parsed.isReply ? `[REPLY:${parsed.replyToName}|${parsed.replyToContent}]${temp}` : temp;
           await supabase.from('messages').update({ content: newContent }).eq('id', editingMessage.id);
           setEditingMessage(null);
           if (chatChannelRef.current) chatChannelRef.current.send({ type: 'broadcast', event: 'sync', payload: {} });
           loadMessages(activeChannel);
           return;
       }

       let finalContent = temp;
       if (replyingTo) {
           const author = replyingTo.sender_name || 'Staff';
           let snippet = parseReply(replyingTo.content).actualContent;
           if (snippet.length > 50) snippet = snippet.substring(0, 50) + "...";
           finalContent = `[REPLY:${author}|${snippet}]${temp}`;
           setReplyingTo(null);
       }

       const basePayload = activeChannel.isProject
           ? { project_id: activeChannel.id }
           : { chat_id: activeChannel.id };
       const userId = user?.id || '00000000-0000-0000-0000-000000000000';

       const broadcastAndAdd = (nm: any) => {
           if (!nm) return;
           chatChannelRef.current?.send({ type: 'broadcast', event: 'sync', payload: { newMessage: nm } });
           setMessages(prev => prev.find(m => m.id === nm.id) ? prev : [...prev, nm]);
       };

       if (uploaded.length > 0) {
           // ✅ Inserir cada arquivo como mensagem separada (sem texto embutido)
           for (const item of uploaded) {
               const { data } = await supabase.from('messages').insert([{
                   ...basePayload,
                   user_id: userId,
                   content: '',           // arquivo não precisa de conteúdo de texto
                   file_url: item.url,
                   file_type: item.type,
                   sender_name: staffName
               }]).select().single();
               broadcastAndAdd(data);
           }

           // ✅ Se também havia texto, inserir como mensagem separada
           if (finalContent.trim()) {
               const { data } = await supabase.from('messages').insert([{
                   ...basePayload,
                   user_id: userId,
                   content: finalContent,
                   sender_name: staffName
               }]).select().single();
               broadcastAndAdd(data);
           }
       } else {
           // Apenas texto
           const { data } = await supabase.from('messages').insert([{
               ...basePayload,
               user_id: userId,
               content: finalContent,
               sender_name: staffName
           }]).select().single();
           if (data) {
               broadcastAndAdd(data);
           } else {
               // Fallback: recarregar mensagens do DB
               loadMessages(activeChannel);
           }
       }
   };

   return (
       <div className="flex-1 flex overflow-hidden bg-[#050505] h-full font-sans relative text-white">
           
           <AnimatePresence>
               {isModalOpen && (
                   <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 z-[100] bg-black/80 backdrop-blur-md flex items-center justify-center p-6">
                        <div className="bg-[#0a0a0a] border border-[#222] p-8 rounded-[2rem] w-full max-w-sm">
                            <h2 className="text-xl font-black mb-6">{isEditingChat ? 'Editar Grupo' : 'Novo Grupo Staff'}</h2>
                            <input 
                                type="text" value={groupName} onChange={e => setGroupName(e.target.value)}
                                placeholder="Nome do grupo..." 
                                className="w-full bg-[#111] border border-[#222] p-4 rounded-xl outline-none mb-6 focus:border-accent"
                            />
                            <div className="flex gap-3">
                                <button onClick={() => setIsModalOpen(false)} className="flex-1 bg-[#111] border border-[#222] py-4 rounded-xl font-bold">Cancelar</button>
                                <button onClick={handleCreateGroup} className="flex-1 bg-white text-black py-4 rounded-xl font-black">{isEditingChat ? 'SALVAR' : 'CRIAR'}</button>
                            </div>
                        </div>
                   </motion.div>
               )}
           </AnimatePresence>

           {/* Sidebar */}
           <div className="w-[300px] bg-[#0a0a0a] border-r border-[#222] flex flex-col h-full shrink-0">
               <div className="p-6 border-b border-[#222]">
                   <div className="flex justify-between items-center mb-5">
                        <h2 className="text-xl font-black text-white tracking-tighter flex items-center gap-3">
                            <Users className="w-5 h-5 text-accent"/> Equipes HQ
                        </h2>
                        <button onClick={() => { setIsEditingChat(null); setGroupName(""); setIsModalOpen(true); }} className="p-1 hover:bg-white/5 rounded-lg text-accent">
                            <PlusSquare className="w-5 h-5"/>
                        </button>
                   </div>
                   <div className="relative">
                       <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[#444]"/>
                       <input 
                           type="text" placeholder="Filtrar..." 
                           value={searchTerm} onChange={e => setSearchTerm(e.target.value)}
                           className="w-full bg-[#111] border border-[#222] text-xs p-2.5 pl-9 rounded-xl outline-none"
                       />
                   </div>
               </div>
               <div className="flex-1 overflow-y-auto p-4 space-y-1">
                   {channels.filter(c => c.name.toLowerCase().includes(searchTerm.toLowerCase())).map(c => (
                       <div key={c.id} className="group relative flex items-center">
                            <button 
                                onClick={() => handleSelectChannel(c)}
                                className={`flex-1 flex items-center gap-3 p-3 rounded-xl cursor-pointer transition-all duration-200 hover:scale-[1.02] active:scale-[0.98] ${activeChannel?.id === c.id ? 'bg-accent/10 border border-accent/20 shadow-sm' : 'hover:bg-[#111] hover:shadow-sm'}`}
                            >
                                <div className={`w-9 h-9 rounded-lg flex items-center justify-center font-black text-sm transition-colors ${activeChannel?.id === c.id ? 'bg-accent text-white shadow-lg shadow-accent/20' : 'bg-[#222] text-[#888] group-hover:bg-accent/20 group-hover:text-accent'}`}>
                                    {c.name.substring(0,2).toUpperCase()}
                                </div>
                                <div className="flex flex-col items-start overflow-hidden">
                                    <span className="text-sm font-bold text-white truncate w-full">{c.name}</span>
                                    <span className="text-[10px] text-[#555] font-black uppercase">{c.isProject ? 'Software' : 'Grupo HQ'}</span>
                                </div>
                            </button>
                            {!c.isProject && (
                                <div className="absolute right-2 opacity-0 group-hover:opacity-100 flex gap-1 transition-all">
                                    <button onClick={() => { setIsEditingChat(c); setGroupName(c.name); setIsModalOpen(true); }} className="p-2 hover:bg-white/10 rounded-lg text-[#555] hover:text-white"><Edit3 className="w-3.5 h-3.5"/></button>
                                    <button onClick={() => handleDeleteChat(c.id)} className="p-2 hover:bg-red-500/10 rounded-lg text-[#555] hover:text-red-500"><Trash2 className="w-3.5 h-3.5"/></button>
                                </div>
                            )}
                       </div>
                   ))}
               </div>
           </div>

           {/* Chat Main */}
           <div className="flex-1 flex flex-col h-full bg-[#050505]">
               {activeChannel ? (
                   <>
                       <div className="p-5 border-b border-[#222] flex justify-between items-center bg-[#0a0a0a]/80 backdrop-blur-xl">
                           <h1 className="font-bold text-white flex items-center gap-2"># {activeChannel.name}</h1>
                           <div className="flex gap-2">
                           </div>
                       </div>

                       <div className="flex-1 overflow-y-auto p-8 flex flex-col gap-8 custom-scrollbar">
                           {messages.map((msg, idx) => {
                               const isStaffFromTag = msg.sender_name?.startsWith('[STAFF]');
                               const parsed = parseReply(msg.content);
                               const displayName = msg.sender_name?.replace('[STAFF] ', '') || 'Cliente';

                               return (
                                   <div key={msg.id} className={`flex w-full gap-4 ${isStaffFromTag ? 'flex-row-reverse' : 'flex-row'}`}>
                                       <div className={`w-10 h-10 rounded-full shrink-0 border flex items-center justify-center text-[10px] font-black uppercase ${isStaffFromTag ? 'bg-accent border-accent/30 text-white shadow-[0_0_15px_rgba(var(--accent-rgb),0.3)]' : 'bg-[#111] border-[#222] text-[#555]'}`}>
                                           {isStaffFromTag ? 'HQ' : (displayName[0] || '?')}
                                       </div>

                                       <div className={`max-w-[70%] flex flex-col ${isStaffFromTag ? 'items-end' : 'items-start'}`}>
                                           <span className={`text-[10px] font-black uppercase mb-2 tracking-widest flex items-center gap-2 ${isStaffFromTag ? 'text-accent' : 'text-[#444]'}`}>
                                               {isStaffFromTag && <div className="w-1.5 h-1.5 rounded-full bg-accent animate-pulse"></div>}
                                               {displayName}
                                           </span>
                                           <div className={`p-4 rounded-2xl border ${isStaffFromTag ? 'bg-accent/10 border-accent/20 text-white' : 'bg-[#111] border-[#222] text-[#ccc]'}`}>
                                               {parsed.isReply && (
                                                   <div className="mb-3 p-2 bg-black/20 rounded-lg border-l-2 border-accent text-[11px] opacity-60">
                                                       <span className="font-black text-accent">{parsed.replyToName}</span>
                                                       <p className="italic truncate">{parsed.replyToContent}</p>
                                                   </div>
                                               )}
                                               {msg.file_url && (
                                                   <div className="mb-3">
                                                       {msg.file_type?.startsWith('image/') || msg.file_url?.match(/\.(png|jpg|jpeg|gif|webp)/i) ? (
                                                            <img src={msg.file_url} className="rounded-xl max-w-full max-h-72 object-cover hover:scale-[1.02] transition-transform cursor-pointer" onClick={() => window.open(msg.file_url, '_blank')} />
                                                       ) : (
                                                           <div className="flex items-center gap-3 bg-black/30 p-3 rounded-xl border border-white/5">
                                                               <FileText className="w-5 h-5 text-accent"/>
                                                               <span className="text-xs font-bold truncate max-w-[150px]">{msg.file_url.split('/').pop()?.substring(14) || 'Arquivo'}</span>
                                                               <a href={msg.file_url} target="_blank" className="ml-auto p-1.5 hover:bg-white/5 rounded-lg"><Download className="w-4 h-4"/></a>
                                                           </div>
                                                       )}
                                                   </div>
                                               )}
                                               {(() => {
                                                   const { text: cleanText, inlineImages } = parseInlineImages(parsed.actualContent);
                                                   const isDirectUrl = !msg.file_url && parsed.actualContent.match(/^https?:\/\/.+\.(png|jpg|jpeg|gif|webp)/i);
                                                   return (
                                                       <>
                                                           {inlineImages.map((img, i) => (
                                                               <div key={i} className="mb-3">
                                                                   <img src={img.url} alt={img.name} onClick={() => window.open(img.url, '_blank')} className="rounded-xl max-w-full max-h-72 object-cover cursor-pointer hover:scale-[1.02] transition-transform" />
                                                                   {img.name && img.name !== 'Imagem' && <p className="text-[10px] opacity-40 mt-1">{img.name}</p>}
                                                               </div>
                                                           ))}
                                                           {isDirectUrl ? (
                                                               <img src={parsed.actualContent} alt="Imagem" onClick={() => window.open(parsed.actualContent, '_blank')} className="rounded-xl max-w-full max-h-72 object-cover cursor-pointer hover:scale-[1.02] transition-transform mb-2" />
                                                           ) : (
                                                               cleanText ? <p className="text-sm font-medium leading-relaxed whitespace-pre-wrap">{cleanText}</p> : null
                                                           )}
                                                       </>
                                                   );
                                               })()}
                                               <div className="mt-2 text-[8px] font-bold opacity-30 text-right">{new Date(msg.created_at).toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'})}</div>
                                           </div>
                                           <div className={`flex gap-2 mt-1 opacity-0 hover:opacity-100 transition-opacity ${isStaffFromTag ? 'flex-row-reverse' : ''}`}>
                                               <button onClick={() => setReplyingTo(msg)} className="text-[9px] font-black text-accent uppercase tracking-widest">Responder</button>
                                               <button onClick={async () => await supabase.from('messages').delete().eq('id', msg.id)} className="text-[9px] font-black text-red-500 uppercase tracking-widest">Apagar</button>
                                           </div>
                                       </div>
                                   </div>
                               );
                           })}
                           <div ref={messagesEndRef} className="h-4"/>
                       </div>

                       <div className="p-6 bg-[#0a0a0a] border-t border-[#222]">
                           <div className="max-w-5xl mx-auto flex flex-col gap-3">
                               {stagedFiles.length > 0 && (
                                   <div className="flex gap-3 overflow-x-auto pb-2 p-3 bg-[#111] rounded-2xl border border-[#222]">
                                       {previews.map((p, i) => (
                                           <div key={i} className="relative w-20 h-20 shrink-0 border border-[#333] rounded-xl overflow-hidden bg-black/50">
                                               {p === 'file' ? <div className="w-full h-full flex flex-col items-center justify-center gap-1"><FileText className="w-6 h-6 opacity-30"/></div> : <img src={p} className="w-full h-full object-cover" />}
                                               <button onClick={() => removeStagedFile(i)} className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-0.5"><X className="w-3 h-3"/></button>
                                           </div>
                                       ))}
                                   </div>
                               )}
                               <form onSubmit={handleSend} className="bg-[#111] border border-[#2c2d30] rounded-2xl p-2 flex flex-col focus-within:border-accent transition-colors">
                                   <textarea 
                                       rows={2} value={content} onChange={e => setContent(e.target.value)}
                                       placeholder="Transmissão Segura..."
                                       className="bg-transparent text-white p-4 outline-none resize-none text-sm font-medium placeholder:text-[#333]"
                                       onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(e); } }}
                                   />
                                   <div className="flex justify-between items-center p-2 border-t border-[#222]/50 mt-2">
                                       <div className="flex items-center gap-2">
                                           <button type="button" onClick={() => fileInputRef.current?.click()} className="p-2 rounded-lg hover:bg-white/5 text-[#555] hover:text-accent"><Paperclip className="w-5 h-5"/></button>
                                           <input type="file" multiple hidden ref={fileInputRef} onChange={handleFileSelect} />
                                           <button type="button" onClick={() => fileInputRef.current?.click()} className="p-2 rounded-lg hover:bg-white/5 text-[#555] hover:text-white"><ImageIcon className="w-5 h-5"/></button>
                                       </div>
                                       <button type="submit" className="bg-white text-black font-black text-[13px] px-6 py-2 rounded-xl hover:scale-105 active:scale-95 transition-all">ENVIAR</button>
                                   </div>
                               </form>
                           </div>
                       </div>
                   </>
               ) : (
                   <div className="flex-1 flex flex-col items-center justify-center opacity-20">
                       <Hash className="w-16 h-16 mb-4"/>
                       <p className="font-black uppercase tracking-widest text-xs">Selecione uma Unidade</p>
                   </div>
               )}
           </div>
       </div>
   );
}
