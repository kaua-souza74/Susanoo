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
    Download
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
    profiles?: { name: string; role?: string } 
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

export default function AdminTeamsChat() {
   const [user, setUser] = useState<any>(null);
   const [channels, setChannels] = useState<any[]>([]);
   const [activeChannel, setActiveChannel] = useState<any>(null);
   const [messages, setMessages] = useState<Message[]>([]);
   const [content, setContent] = useState("");
   const [searchTerm, setSearchTerm] = useState("");
   const [typingUsers, setTypingUsers] = useState<string[]>([]);
   const [replyingTo, setReplyingTo] = useState<Message | null>(null);
   const [editingMessage, setEditingMessage] = useState<Message | null>(null);
   
   // Attachment Staging
   const [stagedFiles, setStagedFiles] = useState<File[]>([]);
   const [previews, setPreviews] = useState<string[]>([]);
   
   const messagesEndRef = useRef<HTMLDivElement>(null);
   const chatChannelRef = useRef<any>(null);
   const typingTimeoutRef = useRef<any>(null);
   const fileInputRef = useRef<HTMLInputElement>(null);

   const getMyName = () => {
       if (user?.email) {
           const emailLower = user.email.toLowerCase();
           if (emailLower.startsWith('kaua') || emailLower === 'kauasesi156@gmail.com') return 'Kauã';
           if (emailLower.startsWith('vinicius') || emailLower === 'vinicius172321@gmail.com') return 'Vinícius';
           if (emailLower.startsWith('davi') || emailLower === 'davi@susanoo.com') return 'Davi';
           if (emailLower.startsWith('lucas') || emailLower === 'limasilvallsss@gmail.com') return 'Lucas';
           return user.user_metadata?.name || user.email.split('@')[0];
       }
       return 'Membro Susanoo';
   };

   // Modals
   const [isModalOpen, setIsModalOpen] = useState(false);
   const [isManageOpen, setIsManageOpen] = useState(false);
   const [newChatName, setNewChatName] = useState("");
   const [newChatType, setNewChatType] = useState("group");

   useEffect(() => {
       fetchData();
       return () => { supabase.removeAllChannels(); }
   }, []);

   useEffect(() => { messagesEndRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages]);

   const fetchData = async () => {
       const { data: { session } } = await supabase.auth.getSession();
       if (session) setUser(session.user);
       
       const { data: projs } = await supabase.from('projects').select('*');
       const { data: custChats } = await supabase.from('chats').select('*');
       
       const all = [
           ...(projs || []).map(p => ({ ...p, isProject: true })),
           ...(custChats || []).map(c => ({ ...c, isProject: false }))
       ];
       setChannels(all);
       if (all.length > 0 && !activeChannel) handleSelectChannel(all[0]);
   };

   const handleSelectChannel = async (channel: any) => {
       setActiveChannel(channel);
       setReplyingTo(null);
       setEditingMessage(null);
       setStagedFiles([]);
       setPreviews([]);
       setTypingUsers([]);
       
       const filterField = channel.isProject ? 'project_id' : 'chat_id';
       const { data } = await supabase.from('messages').select('*').eq(filterField, channel.id).order('created_at', { ascending: true });
       setMessages(data as any || []);
       
       supabase.removeAllChannels();
       const chatChannel = supabase.channel(`chat-${channel.id}`);
       chatChannel
           .on('postgres_changes', { event: '*', schema: 'public', table: 'messages', filter: `${filterField}=eq.${channel.id}` }, () => {
               supabase.from('messages').select('*').eq(filterField, channel.id).order('created_at', { ascending: true }).then(({data}) => setMessages(data as any || []));
           })
           .on('broadcast', { event: 'typing' }, ({ payload }) => {
               const { name, isTyping } = payload;
               if (name === getMyName()) return;
               setTypingUsers(prev => isTyping ? [...new Set([...prev, name])] : prev.filter(n => n !== name));
           })
           .subscribe();
       chatChannelRef.current = chatChannel;
   };

   const handleTyping = () => {
       if (!chatChannelRef.current) return;
       chatChannelRef.current.send({ type: 'broadcast', event: 'typing', payload: { name: getMyName(), isTyping: true }});
       if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
       typingTimeoutRef.current = setTimeout(() => {
           if (chatChannelRef.current) chatChannelRef.current.send({ type: 'broadcast', event: 'typing', payload: { name: getMyName(), isTyping: false }});
       }, 2000);
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

       let uploaded = [];
       for (const file of currentStaged) {
           const name = `${Date.now()}_${file.name}`;
           const { data } = await supabase.storage.from('teams_media').upload(name, file);
           if (data) {
               const { data: { publicUrl } } = supabase.storage.from('teams_media').getPublicUrl(data.path);
               uploaded.push({ url: publicUrl, type: file.type });
           }
       }

       if (editingMessage) {
           const parsed = parseReply(editingMessage.content);
           const newContent = parsed.isReply ? `[REPLY:${parsed.replyToName}|${parsed.replyToContent}]${temp}` : temp;
           await supabase.from('messages').update({ content: newContent }).eq('id', editingMessage.id);
           setEditingMessage(null);
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

       const basePayload = activeChannel.isProject ? { project_id: activeChannel.id } : { chat_id: activeChannel.id };
       
       if (uploaded.length > 0) {
           for (const item of uploaded) {
               await supabase.from('messages').insert([{
                   ...basePayload,
                   user_id: user.id || '00000000-0000-0000-0000-000000000000',
                   content: finalContent || (item.type.startsWith('image/') ? '📷 Imagem' : '📎 Arquivo'),
                   file_url: item.url,
                   file_type: item.type,
                   sender_name: getMyName()
               }]);
               finalContent = "";
           }
       } else {
           await supabase.from('messages').insert([{
               ...basePayload,
               user_id: user.id || '00000000-0000-0000-0000-000000000000',
               content: finalContent,
               sender_name: getMyName()
           }]);
       }
   };

   return (
       <div className="flex-1 flex overflow-hidden bg-[#050505] h-full font-sans relative">
           
           {/* Sidebar */}
           <div className="w-[300px] bg-[#0a0a0a] border-r border-[#222] flex flex-col h-full shrink-0">
               <div className="p-6 border-b border-[#222]">
                   <h2 className="text-xl font-black text-white tracking-tighter flex items-center gap-3">
                       <Users className="w-5 h-5 text-accent"/> Equipes HQ
                   </h2>
                   <div className="relative mt-5">
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
                       <button 
                           key={c.id} onClick={() => handleSelectChannel(c)}
                           className={`w-full flex items-center gap-3 p-3 rounded-xl transition-all ${activeChannel?.id === c.id ? 'bg-accent/10 border border-accent/20' : 'hover:bg-[#111]'}`}
                       >
                           <div className={`w-9 h-9 rounded-lg flex items-center justify-center font-black text-sm ${activeChannel?.id === c.id ? 'bg-accent text-white' : 'bg-[#222]'}`}>
                               {c.name.substring(0,2).toUpperCase()}
                           </div>
                           <div className="flex flex-col items-start overflow-hidden">
                               <span className="text-sm font-bold text-white truncate w-full">{c.name}</span>
                               <span className="text-[10px] text-[#555] font-black uppercase">{c.isProject ? 'Software' : 'Grupo'}</span>
                           </div>
                       </button>
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
                               <button className="p-2 text-[#555] hover:text-white transition-colors"><Video className="w-5 h-5"/></button>
                               <button className="p-2 text-[#555] hover:text-white transition-colors"><Phone className="w-5 h-5"/></button>
                           </div>
                       </div>

                       <div className="flex-1 overflow-y-auto p-8 flex flex-col gap-8 custom-scrollbar">
                           {messages.map((msg, idx) => {
                               const isMe = msg.sender_name === getMyName();
                               const parsed = parseReply(msg.content);
                               return (
                                   <div key={msg.id} className={`flex w-full ${isMe ? 'justify-end' : 'justify-start'}`}>
                                       <div className={`max-w-[80%] flex flex-col ${isMe ? 'items-end' : 'items-start'}`}>
                                           {!isMe && <span className="text-[10px] font-black text-[#555] uppercase mb-2 tracking-widest">{msg.sender_name}</span>}
                                           <div className={`p-4 rounded-2xl border ${isMe ? 'bg-accent/10 border-accent/20 text-white' : 'bg-[#111] border-[#222] text-[#ccc]'}`}>
                                               {parsed.isReply && (
                                                   <div className="mb-3 p-2 bg-black/20 rounded-lg border-l-2 border-accent text-[11px] opacity-60">
                                                       <span className="font-black text-accent">{parsed.replyToName}</span>
                                                       <p className="italic truncate">{parsed.replyToContent}</p>
                                                   </div>
                                               )}
                                               {msg.file_url && (
                                                   <div className="mb-3">
                                                       {msg.file_type?.startsWith('image/') ? (
                                                            <img src={msg.file_url} className="rounded-xl max-w-full hover:scale-[1.02] transition-transform cursor-pointer" onClick={() => window.open(msg.file_url, '_blank')} />
                                                       ) : (
                                                           <div className="flex items-center gap-3 bg-black/30 p-3 rounded-xl border border-white/5">
                                                               <FileText className="w-5 h-5 text-accent"/>
                                                               <span className="text-xs font-bold truncate max-w-[150px]">Arquivo</span>
                                                               <a href={msg.file_url} target="_blank" className="ml-auto p-1.5 hover:bg-white/5 rounded-lg"><Download className="w-4 h-4"/></a>
                                                           </div>
                                                       )}
                                                   </div>
                                               )}
                                               <p className="text-sm font-medium leading-relaxed">{parsed.actualContent}</p>
                                               <div className="mt-2 text-[8px] font-bold opacity-30 text-right">{new Date(msg.created_at).toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'})}</div>
                                           </div>
                                           <div className="flex gap-2 mt-1 opacity-0 hover:opacity-100 transition-opacity">
                                               <button onClick={() => setReplyingTo(msg)} className="text-[9px] font-black text-accent uppercase tracking-widest">Responder</button>
                                               {isMe && <button onClick={async () => await supabase.from('messages').delete().eq('id', msg.id)} className="text-[9px] font-black text-red-500 uppercase tracking-widest">Apagar</button>}
                                           </div>
                                       </div>
                                   </div>
                               );
                           })}
                           <div ref={messagesEndRef} className="h-4"/>
                       </div>

                       {/* Input Area (With Staging) */}
                       <div className="p-6 bg-[#0a0a0a] border-t border-[#222]">
                           <div className="max-w-5xl mx-auto flex flex-col gap-3">
                               
                               {/* Previews */}
                               <AnimatePresence>
                               {stagedFiles.length > 0 && (
                                   <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="flex gap-3 overflow-x-auto pb-2 p-3 bg-[#111] rounded-2xl border border-[#222]">
                                       {previews.map((p, i) => (
                                           <div key={i} className="relative w-20 h-20 shrink-0 border border-[#333] rounded-xl overflow-hidden bg-black/50">
                                               {p === 'file' ? <div className="w-full h-full flex flex-col items-center justify-center gap-1"><FileText className="w-6 h-6 opacity-30"/><span className="text-[6px] truncate px-2">{stagedFiles[i].name}</span></div> : <img src={p} className="w-full h-full object-cover" />}
                                               <button onClick={() => removeStagedFile(i)} className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-0.5"><X className="w-3 h-3"/></button>
                                           </div>
                                       ))}
                                   </motion.div>
                               )}
                               </AnimatePresence>

                               {/* Form */}
                               <form onSubmit={handleSend} className="bg-[#111] border border-[#2c2d30] rounded-2xl p-2 flex flex-col focus-within:border-accent transition-colors">
                                   <textarea 
                                       rows={2} value={content} onChange={e => { setContent(e.target.value); handleTyping(); }}
                                       placeholder={editingMessage ? "Editando..." : "Escreva sua mensagem operacional..."}
                                       className="bg-transparent text-white p-4 outline-none resize-none text-sm font-medium"
                                       onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(e); } }}
                                   />
                                   <div className="flex justify-between items-center p-2 border-t border-[#222]/50 mt-2">
                                       <div className="flex items-center gap-2">
                                           <button type="button" onClick={() => fileInputRef.current?.click()} className="p-2 rounded-lg hover:bg-white/5 text-[#555] hover:text-accent"><Paperclip className="w-5 h-5"/></button>
                                           <input type="file" multiple hidden ref={fileInputRef} onChange={handleFileSelect} />
                                           <button type="button" onClick={() => fileInputRef.current?.click()} className="p-2 rounded-lg hover:bg-white/5 text-[#555] hover:text-white"><ImageIcon className="w-5 h-5"/></button>
                                       </div>
                                       <button type="submit" disabled={!content.trim() && stagedFiles.length === 0} className="bg-white text-black font-black text-[13px] px-6 py-2 rounded-xl hover:scale-105 active:scale-95 transition-all shadow-xl">
                                           ENVIAR STAFF
                                       </button>
                                   </div>
                               </form>
                           </div>
                       </div>
                   </>
               ) : (
                   <div className="flex-1 flex flex-col items-center justify-center opacity-20">
                       <Hash className="w-16 h-16 mb-4"/>
                       <p className="font-black uppercase tracking-widest text-xs">Selecione uma Unidade de Operação</p>
                   </div>
               )}
           </div>
       </div>
   );
}
