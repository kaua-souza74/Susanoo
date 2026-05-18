"use client";
import { useEffect, useState, useRef } from "react";
import { supabase } from "@/lib/supabase";
import { useRouter } from "next/navigation";
import { Send, Hash, Info, MoreHorizontal, Video, Phone, UserRound, Search, CornerUpLeft, Trash2, Pencil, X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

type Message = { id: string; content: string; created_at: string; user_id: string; profiles?: { name: string; role: string; } };

// Helper to parse replied message syntax
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
    return { isReply: false, replyToName: "", replyToContent: "", actualContent: content };
};

export default function ChatPage() {
   const [user, setUser] = useState<any>(null);
   const [project, setProject] = useState<any>(null);
   const [messages, setMessages] = useState<Message[]>([]);
   const [content, setContent] = useState("");
   const [loading, setLoading] = useState(true);
   const router = useRouter();
   const messagesEndRef = useRef<HTMLDivElement>(null);

   // Reply, Edit and Delete local state
   const [replyingTo, setReplyingTo] = useState<Message | null>(null);
   const [editingMessage, setEditingMessage] = useState<Message | null>(null);
   const [deletedMessageIds, setDeletedMessageIds] = useState<string[]>([]);
   const [deleteMenuMsgId, setDeleteMenuMsgId] = useState<string | null>(null);

   useEffect(() => {
       const stored = localStorage.getItem("susanoo_deleted_messages");
       if (stored) {
           try {
               setDeletedMessageIds(JSON.parse(stored));
           } catch (e) {
               console.error(e);
           }
       }
   }, []);

   const handleHideMessageLocal = (msgId: string) => {
       const updated = [...deletedMessageIds, msgId];
       setDeletedMessageIds(updated);
       localStorage.setItem("susanoo_deleted_messages", JSON.stringify(updated));
   };

   const handleDeleteMessageEveryone = async (msgId: string) => {
       const { error } = await supabase.from('messages').delete().eq('id', msgId);
       if (error) {
           alert("Erro ao excluir mensagem: " + error.message);
       }
   };

   useEffect(() => {
     const init = async () => {
         const { data: { session } } = await supabase.auth.getSession();
         if (!session) return router.push("/login");
         setUser(session.user);
         
         const { data: projs } = await supabase.from('projects').select('*').eq('client_id', session.user.id);
         if (projs && projs.length > 0) {
             setProject(projs[0]);
             await loadMessages(projs[0].id);
             subscribeChat(projs[0].id);
         }
         setTimeout(() => setLoading(false), 800); // Simulando handshake seguro e animado
     };
     init();
     return () => { supabase.removeAllChannels(); };
   }, [router]);

   useEffect(() => {
       messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
   }, [messages]);

   const loadMessages = async (pid: string) => {
       const { data } = await supabase.from('messages').select('*, profiles:user_id(name, role)').eq('project_id', pid).order('created_at', { ascending: true });
       if (data) setMessages(data as unknown as Message[]);
   };

   const subscribeChat = (pid: string) => {
       supabase.channel('chat-changes').on('postgres_changes', { event: '*', schema: 'public', table: 'messages', filter: `project_id=eq.${pid}` }, () => {
           loadMessages(pid);
       }).subscribe();
   };

   const handleSend = async (e: React.FormEvent) => {
       e.preventDefault();
       if (!content.trim() || !project) return;
       const msgContent = content;
       setContent("");

       if (editingMessage) {
           const parsed = parseReply(editingMessage.content);
           const newContent = parsed.isReply
               ? `[REPLY:${parsed.replyToName}|${parsed.replyToContent}]${msgContent}`
               : msgContent;

           const { error } = await supabase
               .from('messages')
               .update({ content: newContent })
               .eq('id', editingMessage.id);

           if (error) {
               alert("Erro ao editar mensagem: " + error.message);
           }
           setEditingMessage(null);
           return;
       }

       let finalContent = msgContent;
       if (replyingTo) {
           const parsedParent = parseReply(replyingTo.content);
           const parentAuthor = replyingTo.profiles?.name || (replyingTo.user_id === user?.id ? 'Você' : 'Suporte');
           let snippet = parsedParent.actualContent;
           if (snippet.startsWith("[IMAGE](")) snippet = "📷 Imagem";
           else if (snippet.startsWith("[VIDEO](")) snippet = "🎥 Vídeo";
           else if (snippet.startsWith("[DOCUMENT](")) snippet = "📎 Arquivo";
           
           if (snippet.length > 60) snippet = snippet.substring(0, 60) + "...";
           
           finalContent = `[REPLY:${parentAuthor}|${snippet}]${msgContent}`;
           setReplyingTo(null);
       }

       await supabase.from('messages').insert([
           { project_id: project.id, user_id: user.id, content: finalContent }
       ]);
   };

   if (loading) return (
       <div className="flex-1 flex flex-col items-center justify-center bg-[#111213]">
           <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1, ease: "linear" }} className="w-12 h-12 border-[3px] border-[#2c2d30] border-t-accent rounded-full mb-4" />
           <p className="text-sm font-semibold text-[#a0a0a0] tracking-wider uppercase">Conectando Canal Seguro...</p>
       </div>
   );

   return (
       <div className="flex-1 flex flex-col h-full bg-[#111213]">
           {/* Topbar Inspirada no Teams / Slack */}
           <div className="p-4 px-8 border-b border-[#2c2d30] flex items-center justify-between bg-[#141516]/95 backdrop-blur-lg sticky top-0 z-50">
               <div className="flex items-center gap-4">
                   <div className="w-12 h-12 rounded-2xl bg-[#1e1f24] flex items-center justify-center text-white shadow-xl shadow-black/20 border border-[#2c2d30]">
                       <span className="font-black text-xl tracking-tighter bg-gradient-to-br from-accent to-blue-500 bg-clip-text text-transparent">{project?.name?.substring(0,2).toUpperCase() || 'HQ'}</span>
                   </div>
                   <div className="flex flex-col justify-center gap-0.5">
                       <h1 className="font-bold text-[17px] text-white flex items-center gap-2 leading-none">
                           General - {project?.name || "Aguardando Projeto"} 
                           <span className="bg-accent/10 border border-accent/20 text-[9px] uppercase font-bold tracking-widest px-2 py-0.5 rounded text-accent hidden sm:inline">Official</span>
                       </h1>
                       <p className="text-[12px] font-semibold text-[#888] flex items-center gap-1.5">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span> Equipe Sincronizada
                       </p>
                   </div>
               </div>
               
               <div className="hidden md:flex flex-row items-center gap-2 text-[#a0a0a0]">
                   <button className="p-2.5 rounded-full hover:bg-[#1e1f24] hover:text-white transition-colors"><Search className="w-5 h-5"/></button>
                   <div className="w-px h-6 bg-[#2c2d30] mx-2"></div>
                   <button className="p-2.5 rounded-full hover:bg-[#1e1f24] hover:text-white transition-colors"><Video className="w-5 h-5"/></button>
                   <button className="p-2.5 rounded-full hover:bg-[#1e1f24] hover:text-white transition-colors"><Phone className="w-5 h-5"/></button>
                   <div className="w-px h-6 bg-[#2c2d30] mx-2"></div>
                   <button className="p-2.5 rounded-full hover:bg-[#1e1f24] hover:text-white transition-colors"><MoreHorizontal className="w-5 h-5"/></button>
               </div>
           </div>

           {/* Flow de Mensagens (Teams Layout Avançado) */}
           <div className="flex-1 overflow-y-auto p-6 md:p-10 flex flex-col gap-6 scroll-smooth bg-[#111213]">
               <div className="flex justify-center mb-8 mt-4">
                   <div className="bg-[#1e1f24] text-[#a0a0a0] text-[11px] font-bold px-4 py-2 rounded-full border border-[#2c2d30] tracking-widest uppercase shadow-sm">
                       Canal iniciado em {new Date().toLocaleDateString('pt-BR')}
                   </div>
               </div>
               
               <AnimatePresence initial={false}>
               {messages
                   .filter(msg => !deletedMessageIds.includes(msg.id))
                   .map((msg, index) => {
                   const isMe = msg.user_id === user?.id;
                   const name = msg.profiles?.name || (isMe ? 'Você (Cliente)' : 'Suporte Criativo');
                   const initials = name.substring(0, 2).toUpperCase();
                   
                   // Logica simples de agrupamento visual de conversa (Bubbles juntas)
                   const prevMsg = index > 0 ? messages[index - 1] : null;
                   const isSameUser = prevMsg && prevMsg.user_id === msg.user_id;

                   const parsed = parseReply(msg.content);

                   return (
                       <motion.div 
                           initial={{ opacity: 0, y: 15 }}
                           animate={{ opacity: 1, y: 0 }}
                           key={msg.id} 
                           className={`flex w-full ${isMe ? 'justify-end' : 'justify-start'} ${isSameUser ? '-mt-4' : 'mt-2'}`}
                       >
                           <div className={`flex gap-3.5 max-w-[90%] md:max-w-[75%] relative group ${isMe ? 'flex-row-reverse' : 'flex-row'}`}>
                               {/* Avatar Teams Style */}
                               {!isSameUser && (
                                   <div className={`w-10 h-10 mt-1 shrink-0 rounded-2xl flex items-center justify-center font-bold text-sm text-white shadow-xl ${isMe ? 'bg-blue-600 shadow-blue-600/30' : 'bg-[#1e1f24] border border-[#2c2d30]'}`}>
                                       {initials}
                                   </div>
                               )}
                               {isSameUser && <div className="w-10 h-10 shrink-0"></div>}

                               <div className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}>
                                   {!isSameUser && (
                                      <div className={`flex items-baseline gap-2 mb-1.5 ${isMe ? 'flex-row-reverse' : 'flex-row'}`}>
                                         <span className="text-[13px] font-bold text-white">{name}</span>
                                         <span className="text-[11px] text-[#666] font-medium">{new Date(msg.created_at).toLocaleTimeString('pt-BR', { hour: '2-digit', minute:'2-digit' })}</span>
                                      </div>
                                   )}
                                   <div className={`p-4 px-5 rounded-[22px] min-w-[80px] border shadow-md flex flex-col relative ${isMe ? 'bg-[#1e1f24] text-white border-[#2c2d30] rounded-tr-[5px]' : 'bg-accent text-white border-accent/80 rounded-tl-[5px] shadow-accent/20'}`}>
                                       
                                       {/* Hover Actions Menu */}
                                       <div className={`opacity-0 group-hover:opacity-100 transition-all duration-200 flex gap-1 items-center bg-[#0a0a0b] border border-[#222] p-1 rounded-xl absolute -top-3.5 z-20 shadow-xl ${isMe ? 'left-4' : 'right-4'}`}>
                                           <button 
                                               type="button"
                                               onClick={() => setReplyingTo(msg)}
                                               className="p-1.5 text-gray-400 hover:text-accent hover:bg-[#111] rounded-lg transition-colors"
                                               title="Responder"
                                           >
                                               <CornerUpLeft className="w-3.5 h-3.5" />
                                           </button>
                                           {isMe && (
                                               <button 
                                                   type="button"
                                                   onClick={() => {
                                                       setEditingMessage(msg);
                                                       const parsedMsg = parseReply(msg.content);
                                                       setContent(parsedMsg.actualContent);
                                                   }}
                                                   className="p-1.5 text-gray-400 hover:text-blue-400 hover:bg-[#111] rounded-lg transition-colors"
                                                   title="Editar"
                                               >
                                                   <Pencil className="w-3.5 h-3.5" />
                                               </button>
                                           )}
                                           <button 
                                               type="button"
                                               onClick={() => setDeleteMenuMsgId(deleteMenuMsgId === msg.id ? null : msg.id)}
                                               className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-[#111] rounded-lg transition-colors"
                                               title="Excluir"
                                           >
                                               <Trash2 className="w-3.5 h-3.5" />
                                           </button>
                                       </div>

                                       {/* Custom Popover Delete Menu */}
                                       {deleteMenuMsgId === msg.id && (
                                           <div className={`absolute bg-[#111213] border border-[#222] p-2 rounded-xl shadow-2xl z-30 flex flex-col gap-1 text-[10px] font-bold uppercase tracking-wider -top-24 min-w-[150px] ${isMe ? 'right-0' : 'left-0'}`}>
                                               <button 
                                                   type="button"
                                                   onClick={() => { handleDeleteMessageEveryone(msg.id); setDeleteMenuMsgId(null); }}
                                                   className="w-full text-left text-red-500 hover:bg-red-500/10 p-2 rounded-lg transition-colors flex items-center gap-2"
                                               >
                                                   Apagar para todos
                                               </button>
                                               <button 
                                                   type="button"
                                                   onClick={() => { handleHideMessageLocal(msg.id); setDeleteMenuMsgId(null); }}
                                                   className="w-full text-left text-gray-300 hover:bg-white/5 p-2 rounded-lg transition-colors flex items-center gap-2"
                                               >
                                                   Apagar para mim
                                               </button>
                                               <button 
                                                   type="button"
                                                   onClick={() => setDeleteMenuMsgId(null)}
                                                   className="w-full text-left text-gray-500 hover:bg-white/5 p-2 rounded-lg transition-colors flex items-center gap-2 border-t border-[#222] pt-2"
                                               >
                                                   Cancelar
                                               </button>
                                           </div>
                                       )}

                                       {parsed.isReply && (
                                           <div className="bg-black/30 p-2.5 px-3 rounded-xl border-l-4 border-accent mb-2.5 text-left text-xs opacity-90 max-w-full">
                                               <div className="font-bold text-accent mb-0.5">{parsed.replyToName}</div>
                                               <div className="truncate text-white/70 text-[11px] font-medium">{parsed.replyToContent}</div>
                                           </div>
                                       )}

                                       <p className="text-[15px] leading-relaxed font-medium break-words">{parsed.actualContent}</p>
                                   </div>
                               </div>
                           </div>
                       </motion.div>
                   );
               })}
               </AnimatePresence>
               <div ref={messagesEndRef} className="h-2" />
           </div>

           {/* Input Box Advanced (Teams/Slack) */}
           <div className="p-6 bg-[#161719] border-t border-[#2c2d30] shrink-0">
               {replyingTo && (
                   <div className="max-w-6xl mx-auto mb-3 bg-[#111213] border border-[#2c2d30] border-l-4 border-accent p-4 rounded-xl flex justify-between items-center shadow-lg">
                       <div className="overflow-hidden pr-4">
                           <span className="text-[10px] font-black text-accent uppercase tracking-widest block mb-1">Respondendo a {replyingTo.profiles?.name || 'Membro'}</span>
                           <p className="text-white/60 text-sm truncate">{parseReply(replyingTo.content).actualContent}</p>
                       </div>
                       <button 
                           type="button" 
                           onClick={() => setReplyingTo(null)}
                           className="p-1 rounded-full hover:bg-white/5 text-[#888] hover:text-white transition-colors"
                       >
                           <X className="w-4 h-4" />
                       </button>
                   </div>
               )}

               {editingMessage && (
                   <div className="max-w-6xl mx-auto mb-3 bg-[#111213] border border-[#2c2d30] border-l-4 border-blue-500 p-4 rounded-xl flex justify-between items-center shadow-lg">
                       <div className="overflow-hidden pr-4">
                           <span className="text-[10px] font-black text-blue-500 uppercase tracking-widest block mb-1">Modo de Edição</span>
                           <p className="text-white/60 text-sm truncate">{parseReply(editingMessage.content).actualContent}</p>
                       </div>
                       <button 
                           type="button" 
                           onClick={() => { setEditingMessage(null); setContent(""); }}
                           className="p-1 rounded-full hover:bg-white/5 text-[#888] hover:text-white transition-colors"
                       >
                           <X className="w-4 h-4" />
                       </button>
                   </div>
               )}

               <form onSubmit={handleSend} className="max-w-6xl mx-auto flex flex-col bg-[#111213] rounded-2xl border border-[#2c2d30] shadow-xl focus-within:border-accent/50 transition-colors p-2">
                   <input 
                       type="text" 
                       value={content}
                       onChange={e => setContent(e.target.value)}
                       placeholder={editingMessage ? "Editar mensagem..." : `Envie uma mensagem em General - ${project?.name || 'Projeto'}...`} 
                       className="w-full bg-transparent text-white placeholder:text-[#555] p-4 focus:outline-none transition-all font-medium text-[15px]"
                       disabled={!project}
                   />
                   <div className="flex justify-between items-center px-2 pb-2 mt-1">
                       <div className="flex gap-2">
                          <button type="button" className="p-2 text-[#888] hover:bg-[#1e1f24] hover:text-[#e0e0e0] rounded-xl transition-colors"><div className="font-bold text-[16px] leading-none">A</div></button>
                          <button type="button" className="p-2 text-[#888] hover:bg-[#1e1f24] hover:text-[#e0e0e0] rounded-xl transition-colors"><UserRound className="w-5 h-5"/></button>
                       </div>
                       <div className="flex gap-2">
                           {(editingMessage || replyingTo) && (
                               <button 
                                   type="button"
                                   onClick={() => { setEditingMessage(null); setReplyingTo(null); setContent(""); }}
                                   className="px-4 py-2 bg-transparent hover:bg-white/5 text-white/60 hover:text-white font-bold text-[13px] rounded-xl transition-all"
                               >
                                   Cancelar
                               </button>
                           )}
                           <button 
                               type="submit" 
                               disabled={!content.trim() || !project}
                               className="px-5 py-2 bg-accent hover:bg-accent/80 text-white font-bold text-sm rounded-xl transition-all disabled:opacity-50 disabled:hover:bg-accent flex items-center gap-2 shadow-lg shadow-accent/20 cursor-pointer"
                           >
                               <Send className="w-4 h-4" /> {editingMessage ? "Salvar" : "Enviar"}
                           </button>
                       </div>
                   </div>
               </form>
           </div>
       </div>
   );
}
