"use client";
import { useEffect, useState, useRef } from "react";
import { supabase } from "@/lib/supabase";
import { Send, Search, Users, Phone, Video, MoreHorizontal, Hash, Plus, PlusCircle, Settings, Pin, X, Paperclip } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

type Message = { id: string; content: string; created_at: string; user_id: string; sender_name?: string; profiles?: { name: string; role?: string } };

export default function AdminTeamsChat() {
   const [user, setUser] = useState<any>(null);
   const [channels, setChannels] = useState<any[]>([]);

   const getMyName = () => {
       if (user?.email) {
           const emailLower = user.email.toLowerCase();
           if (emailLower.startsWith('kaua@')) return 'Kauã';
           if (emailLower.startsWith('vinicius@')) return 'Vinícius';
           if (emailLower.startsWith('davi@')) return 'Davi';
           if (emailLower.startsWith('lucas@')) return 'Lucas';

           if (user.user_metadata?.name) return user.user_metadata.name;
           const part = user.email.split('@')[0];
           return part.charAt(0).toUpperCase() + part.slice(1);
       }
       return 'Membro Susanoo';
   };
   const [activeChannel, setActiveChannel] = useState<any>(null);
   const [messages, setMessages] = useState<Message[]>([]);
   
   const [content, setContent] = useState("");
   const [searchTerm, setSearchTerm] = useState("");
   const messagesEndRef = useRef<HTMLDivElement>(null);

   // Modal de Criação State
   const [isModalOpen, setIsModalOpen] = useState(false);
   const [isManageOpen, setIsManageOpen] = useState(false);
   const [newChatName, setNewChatName] = useState("");
   const [newChatType, setNewChatType] = useState("group");

   const handleDeleteChannel = async (id: string, isProject: boolean) => {
       if (isProject) {
           alert("Softwares Oficiais não podem ser apagados pelo Chat.");
           return;
       }
       if (confirm("Deletar este grupo permanentemente da agência?")) {
           await supabase.from('chats').delete().eq('id', id);
           setChannels(prev => prev.filter(c => c.id !== id));
           if (activeChannel?.id === id) setActiveChannel(null);
       }
   };

   useEffect(() => {
       fetchData();
       return () => { supabase.removeAllChannels(); }
   }, []);

   useEffect(() => { messagesEndRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages]);

   const fetchData = async () => {
       const { data: { session } } = await supabase.auth.getSession();
       if (session) setUser(session.user);
       
       // Pega Canais Oficiais (Projetos)
       const { data: projs } = await supabase.from('projects').select('*');
       // Pega Grupos Personalizados (Chats Livres)
       const { data: custChats, error: chatsError } = await supabase.from('chats').select('*');
       if (chatsError) alert("Falha Mapeamento de Chats: " + chatsError.message);
       
       const mappedProjects = (projs || []).map(p => ({ ...p, isProject: true }));
       const mappedChats = (custChats || []).map(c => ({ ...c, isProject: false }));
       
       const all = [...mappedProjects, ...mappedChats];
       setChannels(all);
       
       if (all.length > 0 && !activeChannel) handleSelectChannel(all[0]);
   };

   const handleSelectChannel = async (channel: any) => {
       setActiveChannel(channel);
       
       const filterField = channel.isProject ? 'project_id' : 'chat_id';
       
       const { data, error } = await supabase.from('messages')
           .select('*')
           .eq(filterField, channel.id)
           .order('created_at', { ascending: true });

       setMessages(data as any || []);
       
       supabase.removeAllChannels();
       supabase.channel('hq-chat').on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'messages', filter: `${filterField}=eq.${channel.id}` }, () => {
           supabase.from('messages').select('*, profiles:user_id(name)').eq(filterField, channel.id).order('created_at', { ascending: true }).then(({data}) => setMessages(data as any || []));
       }).subscribe();
   };

   const handleSend = async (e: React.FormEvent) => {
       e.preventDefault();
       if (!content.trim()) return;
       if (!activeChannel) { alert("Canal não selecionado."); return; }
       
       let senderId = user?.id;
       if (!senderId) {
           // Fallback supremo: Caso Supabase negue a sessão ativa por causa de e-mail pendente
           senderId = '00000000-0000-0000-0000-000000000000';
       }

       const temp = content;
       setContent("");
       
       const payload = activeChannel.isProject 
           ? { project_id: activeChannel.id, user_id: senderId, content: temp, sender_name: getMyName() }
           : { chat_id: activeChannel.id, user_id: senderId, content: temp, sender_name: getMyName() };
           
       const { data, error } = await supabase.from('messages').insert([payload]).select().single();
       if (error) {
           alert("SQL Block -> Tabela message negou o envio: " + error.message);
           return;
       }
       if (data) {
           const dataOtimista = { ...data, sender_name: getMyName() };
           setMessages(prev => [...prev, dataOtimista as any]);
       }
   };

   const handleTogglePin = async () => {
       if (!activeChannel) return;
       const nextVal = !activeChannel.is_pinned;
       const table = activeChannel.isProject ? 'projects' : 'chats';
       await supabase.from(table).update({ is_pinned: nextVal }).eq('id', activeChannel.id);
       
       setActiveChannel({ ...activeChannel, is_pinned: nextVal });
       setChannels(prev => prev.map(c => c.id === activeChannel.id ? { ...c, is_pinned: nextVal } : c));
   };

   const handleCreateGroup = async (e: React.FormEvent) => {
       e.preventDefault();
       if(!newChatName) return;
       const { data, error } = await supabase.from('chats').insert([{ name: newChatName, type: newChatType, is_pinned: false }]).select().single();
       
       if (error) {
           alert("Supense RLS: Erro ao criar canal -> " + error.message);
       }
       
       if (data) {
           const novoGrupo = { ...data, isProject: false };
           setChannels(prev => [...prev, novoGrupo]);
           handleSelectChannel(novoGrupo); // Abre o chat na hora pra você
       }
       
       setIsModalOpen(false);
       setNewChatName("");
   };

   const handleFileUpload = async (e: any) => {
       const file = e.target.files[0];
       if (!file || !activeChannel) return;
       
       let senderId = user?.id;
       if (!senderId) {
           senderId = '00000000-0000-0000-0000-000000000000';
       }
       
       const fileExt = file.name.split('.').pop();
       const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
       
       // Real Upload para a nuvem da SUSANOO
       const { data, error } = await supabase.storage.from('teams_media').upload(fileName, file);
       
       if (error) {
           alert("Alerta: Você não rodou o Comando 4 de Storage no SQL do Supabase! Rode os comandos do `tabelas_teams.sql` primeiro.");
           return;
       }

       // Resgate da URL Pública Pós Download
       const { data: publicData } = supabase.storage.from('teams_media').getPublicUrl(fileName);
       const urlFinal = publicData.publicUrl;
       
       const tGroup = file.type.startsWith("image/") ? "IMAGE" : file.type.startsWith("video/") ? "VIDEO" : "DOCUMENT";
       const contentString = `[${tGroup}](${urlFinal})|${file.name}`;
       
       const payload = activeChannel.isProject 
           ? { project_id: activeChannel.id, user_id: senderId, content: contentString, sender_name: getMyName() }
           : { chat_id: activeChannel.id, user_id: senderId, content: contentString, sender_name: getMyName() };
           
       const { data: dbData, error: dbError } = await supabase.from('messages').insert([payload]).select().single();
       
       if (dbError) {
           alert("Erro ao atrelar mídia à mensagem: " + dbError.message);
           return;
       }
       if (dbData) {
           const mediaOtimista = { ...dbData, sender_name: getMyName() };
           setMessages(prev => [...prev, mediaOtimista as any]);
       }
   };

   // Renderização especial para Arquivos e Markdown
   const renderMessageContent = (content: string) => {
       
       // Bloco de Código
       if (content.includes("```")) {
           const parts = content.split("```");
           return parts.map((part, i) => {
               if (i % 2 !== 0) {
                   return <pre key={i} className="bg-[#050505] text-[#00ffcc] p-4 rounded-xl my-3 font-mono text-[13px] border border-[#333] shadow-inner overflow-x-auto"><code>{part}</code></pre>;
               }
               return <span key={i}>{part}</span>;
           });
       }
       
       // Imagens Visuais
       if (content.startsWith("[IMAGE](")) {
           const regex = /\[IMAGE\]\((.*?)\)\|(.+)/;
           const match = content.match(regex);
           if(match) return <img src={match[1]} alt={match[2]} className="max-w-[280px] rounded-xl border border-[#333] mt-2 shadow-xl cursor-pointer hover:opacity-80 transition-opacity" onClick={() => window.open(match[1], '_blank')}/>;
       }
       
       // Videos Player Injetado
       if (content.startsWith("[VIDEO](")) {
           const regex = /\[VIDEO\]\((.*?)\)\|(.+)/;
           const match = content.match(regex);
           if(match) return <video src={match[1]} controls className="max-w-[320px] rounded-xl border border-[#333] mt-2 shadow-xl" />;
       }

       // Botão de Download Arquivos/PDFs
       if (content.startsWith("[DOCUMENT](")) {
           const regex = /\[DOCUMENT\]\((.*?)\)\|(.+)/;
           const match = content.match(regex);
           if(match) return <a href={match[1]} target="_blank" rel="noreferrer" className="flex items-center gap-2 bg-[#050505] p-3 rounded-xl border border-[#333] hover:border-accent text-[#888] hover:text-white mt-2 w-max transition-colors font-bold text-[12px]"><Paperclip className="w-4 h-4 text-accent"/> <span className="underline truncate max-w-[200px]">Acessar {match[2]}</span></a>;
       }

       return <span>{content}</span>;
   };

   const filteredChannels = channels.filter(c => c?.name?.toLowerCase().includes(searchTerm?.toLowerCase() || ""));
   const pinned = filteredChannels.filter(c => c.is_pinned);
   const unpinned = filteredChannels.filter(c => !c.is_pinned);

   return (
       <div className="flex-1 flex overflow-hidden bg-[#050505] h-full font-sans relative">
           
           {/* Barra Lateral dos Canais (Teams list) */}
           <div className="w-[320px] bg-[#0a0a0a] border-r border-[#222] flex flex-col h-full shrink-0">
               <div className="p-6 border-b border-[#222] shrink-0">
                   <div className="flex justify-between items-center mb-5">
                       <h2 className="text-2xl font-black text-white tracking-tighter flex items-center gap-3">
                           <Users className="w-6 h-6 text-accent"/> Equipes
                       </h2>
                       <button onClick={() => setIsModalOpen(true)} className="w-9 h-9 rounded-xl bg-white text-black hover:bg-neutral-200 flex items-center justify-center transition-all shadow-lg" title="Nova Interação (Chat/Grupo)">
                           <Plus className="w-5 h-5"/>
                       </button>
                   </div>
                   
                   <div className="relative mb-5">
                       <Search className="w-4 h-4 absolute left-4 top-1/2 -translate-y-1/2 text-[#555]"/>
                       <input 
                          type="text" 
                          value={searchTerm}
                          onChange={(e) => setSearchTerm(e.target.value)}
                          placeholder="Buscar canal ou grupo..." 
                          className="w-full bg-[#111] border border-[#222] text-sm text-white placeholder:text-[#555] p-3 pl-10 rounded-xl focus:border-accent/50 outline-none transition-colors shadow-inner"
                       />
                   </div>

                   <div className="flex gap-2">
                       <button onClick={() => setIsModalOpen(true)} className="flex-1 bg-[#141516] border border-[#2c2d30] hover:bg-[#1e1f24] hover:text-white transition-all text-[#888] rounded-xl py-2.5 flex items-center justify-center gap-2 text-[10px] font-bold uppercase tracking-widest">
                           <PlusCircle className="w-3.5 h-3.5"/> Criar
                       </button>
                       <button onClick={() => setIsManageOpen(true)} className="flex-1 bg-[#141516] border border-[#2c2d30] hover:bg-[#1e1f24] hover:text-white transition-all text-[#888] rounded-xl py-2.5 flex items-center justify-center gap-2 text-[10px] font-bold uppercase tracking-widest">
                           <Settings className="w-3.5 h-3.5"/> OPÇÕES
                       </button>
                   </div>
               </div>

               <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-1 custom-scrollbar">
                   {/* Pinned Section */}
                   {pinned.length > 0 && (
                       <>
                           <div className="text-[10px] font-bold uppercase tracking-widest text-[#a0a0a0] px-3 mt-2 mb-2 flex items-center gap-2">
                               <Pin className="w-3 h-3 text-accent"/> FIXADOS
                           </div>
                           {pinned.map(proj => (
                               <button 
                                  key={proj.id} 
                                  onClick={() => handleSelectChannel(proj)}
                                  className={`w-full flex items-center gap-3 p-3 rounded-xl transition-all cursor-pointer mb-1 ${activeChannel?.id === proj.id ? 'bg-[#1a1b1e] border border-[#333] shadow-md' : 'hover:bg-[#111] border border-transparent'}`}
                               >
                                  <div className={`w-10 h-10 rounded-lg flex items-center justify-center font-bold text-white shadow-inner shrink-0 ${activeChannel?.id === proj.id ? 'bg-gradient-to-br from-accent to-[#581c87]' : 'bg-[#222]'}`}>
                                      {proj.name.substring(0,2).toUpperCase()}
                                  </div>
                                  <div className="flex flex-col items-start overflow-hidden w-full">
                                      <span className={`font-bold truncate w-full text-left text-sm ${activeChannel?.id === proj.id ? 'text-white' : 'text-[#a0a0a0]'}`}>{proj.name}</span>
                                      <span className="text-[11px] font-medium text-[#666] flex items-center gap-1"><Hash className="w-3 h-3"/> {proj.isProject ? 'Software' : proj.type}</span>
                                  </div>
                               </button>
                           ))}
                           <div className="h-px bg-[#222] my-4 mx-3"></div>
                       </>
                   )}

                   <div className="text-[10px] font-bold uppercase tracking-widest text-[#555] px-3 mb-2 flex justify-between items-center">
                       <span>Conversas Recentes</span>
                       <span>{unpinned.length}</span>
                   </div>
                   
                   {unpinned.map(proj => (
                       <button 
                          key={proj.id} 
                          onClick={() => handleSelectChannel(proj)}
                          className={`w-full flex items-center gap-3 p-3 rounded-xl transition-all cursor-pointer ${activeChannel?.id === proj.id ? 'bg-[#1a1b1e] border border-[#333] shadow-md' : 'hover:bg-[#111] border border-transparent'}`}
                       >
                          <div className={`w-10 h-10 rounded-lg flex items-center justify-center font-bold text-white shadow-inner shrink-0 ${activeChannel?.id === proj.id ? 'bg-gradient-to-br from-accent to-[#581c87]' : 'bg-[#222]'}`}>
                              {proj.name.substring(0,2).toUpperCase()}
                          </div>
                          <div className="flex flex-col items-start overflow-hidden w-full">
                              <span className={`font-bold truncate w-full text-left text-sm ${activeChannel?.id === proj.id ? 'text-white' : 'text-[#a0a0a0]'}`}>{proj.name}</span>
                              <span className="text-[11px] font-medium text-[#666] flex items-center gap-1"><Hash className="w-3 h-3"/> {proj.isProject ? 'Software Oficial' : proj.type}</span>
                          </div>
                       </button>
                   ))}
               </div>
           </div>

           {/* Área Central do Chat */}
           <div className="flex-1 flex flex-col h-full bg-[#050505]">
               {activeChannel ? (
                   <>
                       <div className="p-5 px-8 border-b border-[#222] bg-[#0a0a0b]/80 backdrop-blur-md sticky top-0 z-10 shrink-0 flex justify-between items-center">
                           <div className="flex items-center gap-4">
                               <h1 className="font-bold text-lg text-white tracking-tight flex items-center gap-2">
                                   # {activeChannel.name}
                                   <span className="text-[10px] uppercase font-bold text-accent bg-accent/10 border border-accent/20 px-2 py-0.5 rounded ml-2">Monitoramento</span>
                               </h1>
                           </div>
                           <div className="flex gap-2">
                               <button onClick={handleTogglePin} title="Fixar Canal" className={`p-2.5 rounded-full hover:bg-[#111] transition-colors ${activeChannel.is_pinned ? 'text-accent' : 'text-[#777] hover:text-white'}`}>
                                   <Pin className="w-5 h-5"/>
                               </button>
                               <button className="p-2.5 rounded-full hover:bg-[#111] text-[#777] hover:text-white transition-colors"><Video className="w-5 h-5"/></button>
                               <button className="p-2.5 rounded-full hover:bg-[#111] text-[#777] hover:text-white transition-colors"><Phone className="w-5 h-5"/></button>
                               <div className="w-px h-6 bg-[#222] mx-2 self-center"></div>
                               <button className="p-2.5 rounded-full hover:bg-[#111] text-[#777] hover:text-white transition-colors"><MoreHorizontal className="w-5 h-5"/></button>
                           </div>
                       </div>

                       {/* Log de Mensagens */}
                       <div className="flex-1 overflow-y-auto p-8 flex flex-col gap-6 w-full max-w-5xl mx-auto custom-scrollbar">
                           <div className="flex flex-col items-center justify-center my-8 opacity-50">
                               <div className="w-16 h-16 rounded-full bg-[#111] flex items-center justify-center mb-4"><Hash className="w-8 h-8 text-[#555]"/></div>
                               <h2 className="text-xl font-bold text-[#888]">Canal {activeChannel.name}</h2>
                               <p className="text-[#555] text-sm font-medium mt-1">
                                   Este é o início do canal da Susanoo {activeChannel.isProject ? 'conectado ao projeto do cliente' : 'para comunicação interna'}.
                               </p>
                           </div>

                           <AnimatePresence initial={false}>
                           {messages.map((msg, idx) => {
                               const messageAuthor = msg.sender_name || 'Agência Susanoo';
                               const isMe = messageAuthor === getMyName() || msg.user_id === user?.id;
                               const initial = messageAuthor.charAt(0).toUpperCase();
                               const isAgency = true; // Por enquanto visual admin puro
                               
                               const prev = idx > 0 ? messages[idx-1] : null;
                               const group = prev && (prev.user_id === msg.user_id && prev.sender_name === msg.sender_name);

                               return (
                                   <motion.div initial={{opacity:0, y:15}} animate={{opacity:1, y:0}} key={msg.id} className={`flex w-full ${isMe ? 'justify-end' : 'justify-start'} ${group ? '-mt-4' : 'mt-2'}`}>
                                       <div className={`flex gap-4 max-w-[85%] ${isMe ? 'flex-row-reverse' : 'flex-row'}`}>
                                           {!group && (
                                               <div className={`w-10 h-10 mt-1 rounded-xl flex items-center justify-center font-bold text-white shadow-lg shrink-0 ${isAgency ? 'bg-gradient-to-br from-accent to-[#581c87]' : 'bg-[#222] border border-[#333]'}`}>
                                                   {initial}
                                               </div>
                                           )}
                                           {group && <div className="w-10 h-10 shrink-0"></div>}

                                           <div className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}>
                                               {!group && (
                                                   <div className={`flex items-baseline gap-2 mb-1.5 ${isMe ? 'flex-row-reverse' : 'flex-row'}`}>
                                                       <span className="text-[13px] font-bold text-white">{messageAuthor}</span>
                                                       <span className="text-[11px] font-medium text-[#666]">{new Date(msg.created_at).toLocaleTimeString('pt-BR', {hour:'2-digit', minute:'2-digit'})}</span>
                                                   </div>
                                               )}
                                               <div className={`p-4 px-5 rounded-[20px] min-w-[80px] border shadow-md flex-col ${isMe ? 'bg-[#1e1f24] text-white border-[#222] rounded-tr-[5px]' : (isAgency ? 'bg-accent text-white border-accent/50 rounded-tl-[5px]' : 'bg-[#111213] text-white border-[#222] rounded-tl-[5px]')}`}>
                                                   <p className="text-[15px] leading-relaxed font-medium break-words">
                                                       {renderMessageContent(msg.content)}
                                                   </p>
                                               </div>
                                           </div>
                                       </div>
                                   </motion.div>
                               );
                           })}
                           </AnimatePresence>
                           <div ref={messagesEndRef} className="h-4"/>
                       </div>

                       {/* Teams Input Box Complexo */}
                       <div className="p-6 bg-[#0a0a0b] border-t border-[#222] shrink-0">
                           <form onSubmit={handleSend} className="max-w-5xl mx-auto flex flex-col bg-[#111213] rounded-2xl border border-[#2c2d30] shadow-xl focus-within:border-accent/50 transition-colors p-2">
                               <textarea 
                                   rows={2}
                                   value={content}
                                   onChange={e => setContent(e.target.value)}
                                   onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(e); } }}
                                   placeholder={`Responder em #${activeChannel.name}... (Use \`\`\` para código)`} 
                                   className="w-full bg-transparent text-white placeholder:text-[#555] p-4 text-[15px] outline-none font-medium resize-none custom-scrollbar"
                               />
                               <div className="flex justify-between items-center px-2 pb-2 mt-1">
                                   <div className="flex gap-2">
                                       <label className="p-2 text-[#888] rounded-xl hover:text-accent hover:bg-[#111] transition-all cursor-pointer">
                                           <Paperclip className="w-5 h-5"/>
                                           <input type="file" multiple hidden onChange={handleFileUpload} />
                                       </label>
                                       <button type="button" className="p-2 text-[#888] rounded-xl hover:text-white transition-colors" title="Formatação"><div className="font-bold text-lg leading-none">A</div></button>
                                   </div>
                                   <button type="submit" disabled={!content.trim()} className="px-6 py-2 bg-white hover:bg-neutral-200 text-black font-bold text-[13px] tracking-wide rounded-xl disabled:opacity-50 transition-all flex items-center gap-2 shadow-[0_0_15px_rgba(255,255,255,0.1)] cursor-pointer">
                                       <Send className="w-4 h-4"/> Enviar Staff
                                   </button>
                               </div>
                           </form>
                       </div>
                   </>
               ) : (
                   <div className="flex-1 flex flex-col items-center justify-center opacity-50">
                       <Users className="w-16 h-16 text-[#555] mb-4"/>
                       <h2 className="text-xl font-bold text-[#888]">Nenhum Canal Selecionado</h2>
                       <p className="text-sm font-medium text-[#555] mt-2">Escolha a equipe do cliente na barra lateral para abrir o Chat.</p>
                   </div>
               )}
           </div>

           {/* Modais do Teams - Opções e Gerenciamento */}
           {isManageOpen && (
               <div className="absolute inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                   <motion.div initial={{opacity:0, scale:0.95}} animate={{opacity:1, scale:1}} className="w-full max-w-lg bg-[#111213] border border-[#222] p-8 rounded-[32px] shadow-2xl relative max-h-[80vh] flex flex-col">
                       <button type="button" onClick={() => setIsManageOpen(false)} className="absolute top-6 right-6 text-[#555] hover:text-white"><X className="w-5 h-5"/></button>
                       <h3 className="text-2xl font-black text-white tracking-tighter mb-2">Painel de Controle HQ</h3>
                       <p className="text-[#888] text-[15px] mb-8 font-medium">Use este módulo para encerrar ou deletar grupos e DMs manuais.</p>
                       
                       <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar flex flex-col gap-3">
                           {channels.filter(c => !c.isProject).map(chat => (
                               <div key={chat.id} className="flex justify-between items-center bg-[#1a1b1e] p-4 rounded-xl border border-[#2c2d30]">
                                   <div>
                                       <p className="font-bold text-white text-sm">{chat.name}</p>
                                       <span className="text-[10px] text-[#555] font-bold uppercase tracking-widest">{chat.type === 'direct' ? 'Cliente Externo' : 'Servidor ADM'}</span>
                                   </div>
                                   <button onClick={() => handleDeleteChannel(chat.id, false)} className="text-red-500 hover:text-white font-bold text-[10px] uppercase tracking-widest bg-red-500/10 hover:bg-red-500 px-4 py-2 rounded-lg transition-colors border border-red-500/20">Deletar Forçado</button>
                               </div>
                           ))}
                           {channels.filter(c => !c.isProject).length === 0 && (
                               <div className="text-[#555] text-sm text-center py-6 font-medium bg-[#1a1b1e] border border-[#2c2d30] rounded-xl border-dashed">Seus sócios ainda não registraram nenhum canal secundário.</div>
                           )}
                       </div>
                   </motion.div>
               </div>
           )}

           {/* Modais do Teams - Pop Up para Criação de Canal  */}
           {isModalOpen && (
               <div className="absolute inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                   <motion.form 
                       initial={{opacity:0, scale:0.95}} animate={{opacity:1, scale:1}}
                       onSubmit={handleCreateGroup} 
                       className="w-full max-w-md bg-[#111213] border border-[#222] p-8 rounded-[32px] shadow-2xl relative"
                   >
                       <button type="button" onClick={() => setIsModalOpen(false)} className="absolute top-6 right-6 text-[#555] hover:text-white"><X className="w-5 h-5"/></button>
                       <h3 className="text-2xl font-black text-white tracking-tighter mb-6">Novo Grupo HQ</h3>
                       
                       <label className="block text-sm font-bold text-[#888] mb-2 uppercase tracking-widest">Nome do Ambiente</label>
                       <input 
                          type="text" autoFocus required
                          value={newChatName} onChange={e => setNewChatName(e.target.value)}
                          placeholder="Ex: Venda Oculta" 
                          className="w-full bg-[#0a0a0a] border border-[#333] p-4 text-white rounded-xl mb-6 outline-none focus:border-accent"
                       />
                       
                       <label className="block text-sm font-bold text-[#888] mb-2 uppercase tracking-widest">Categoria</label>
                       <select 
                          value={newChatType} onChange={e => setNewChatType(e.target.value)}
                          className="w-full bg-[#0a0a0a] border border-[#333] p-4 text-white rounded-xl mb-8 outline-none focus:border-accent appearance-none cursor-pointer"
                       >
                           <option value="group">Grupo Interno Staff</option>
                           <option value="direct">DM com Cliente</option>
                       </select>

                       <div className="flex gap-4">
                           <button type="button" onClick={() => setIsModalOpen(false)} className="px-6 py-4 rounded-xl font-bold text-[#888] hover:bg-[#1a1b1e] hover:text-white flex-1 transition-all">Cancelar</button>
                           <button type="submit" className="px-6 py-4 rounded-xl font-bold bg-white text-black hover:bg-neutral-200 shadow-xl flex-1 transition-all">Configurar Sala</button>
                       </div>
                   </motion.form>
               </div>
           )}

       </div>
   );
}
