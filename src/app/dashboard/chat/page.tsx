"use client";
import { useEffect, useState, useRef, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { Send, Paperclip, X, FileText, Download, UserRound, Loader2, Search, Hash, ShieldAlert, Pin, ArrowLeft, Trash2, AlertTriangle } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { playNotificationSound } from "@/lib/utils";

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
    const initChatId = searchParams.get('chatId');

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
    const [unreadCounts, setUnreadCounts] = useState<Record<string, number>>({});
    const [pinnedChannelIds, setPinnedChannelIds] = useState<string[]>([]);
    const [profilesMapState, setProfilesMapState] = useState<Record<string, any>>({});
    const [lastActivityMapState, setLastActivityMapState] = useState<Record<string, number>>({});
    const [editingMessage, setEditingMessage] = useState<any | null>(null);
    const [messageToDelete, setMessageToDelete] = useState<Message | null>(null);
    const [showRemoveConversation, setShowRemoveConversation] = useState(false);
    const [destructiveActionLoading, setDestructiveActionLoading] = useState(false);

    const messagesEndRef = useRef<HTMLDivElement>(null);
    const chatChannelRef = useRef<any>(null);
    const typingTimeoutRef = useRef<any>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const channelsRef = useRef<any[]>([]);
    const activeChannelRef = useRef<any>(null);

    const getMyName = () => {
        if (profile?.name) return profile.name;
        if (user?.email) return user.email.split('@')[0];
        return 'Usuário';
    };

    useEffect(() => {
        channelsRef.current = channels;
    }, [channels]);

    useEffect(() => {
        activeChannelRef.current = activeChannel;
    }, [activeChannel]);

    const togglePinChannel = (channelId: string) => {
        setPinnedChannelIds(prev => {
            const next = prev.includes(channelId)
                ? prev.filter(id => id !== channelId)
                : [channelId, ...prev];
            if (typeof window !== "undefined" && user?.id) {
                localStorage.setItem(`susanoo_pinned_chats_${user.id}`, JSON.stringify(next));
            }
            return next;
        });
    };

    useEffect(() => {
        let mounted = true;
        const init = async () => {
            const { data: { session } } = await supabase.auth.getSession();
            if (!session) { router.push("/login"); return; }
            if (!mounted) return;
            setUser(session.user);

            // Carregar fixados do usuário do localStorage
            if (typeof window !== "undefined") {
                const saved = localStorage.getItem(`susanoo_pinned_chats_${session.user.id}`);
                if (saved) {
                    try { setPinnedChannelIds(JSON.parse(saved)); } catch(e) {}
                }
            }

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

            const boughtSite = searchParams.get('boughtSite');
            if (supportChannel && boughtSite) {
                const { data: existingInstructions } = await supabase.from('messages')
                    .select('id')
                    .eq('chat_id', supportChannel.id)
                    .like('content', `%Confirmamos a compra do site/template ${boughtSite}%`);

                if (!existingInstructions || existingInstructions.length === 0) {
                    await supabase.from('messages').insert([{
                        chat_id: supportChannel.id,
                        user_id: '00000000-0000-0000-0000-000000000000',
                        sender_name: 'Sistema Susanoo',
                        content: `🤖 **Sistema Susanoo**: Olá! Confirmamos a compra do site/template **${boughtSite}**. 

Para iniciarmos o desenvolvimento da sua aplicação, por favor nos envie por aqui mesmo os detalhes de como deseja o seu projeto (cores preferidas, seções desejadas, logotipos e quaisquer outras instruções adicionais). Ficamos no aguardo das suas especificações!`
                    }]);
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

            // Mapear perfis dos outros participantes de DMs e do suporte
            const allParticipantIds = new Set<string>();
            allChats.forEach(c => {
                if (c.user_id) allParticipantIds.add(c.user_id);
                if (c.participants && Array.isArray(c.participants)) {
                    c.participants.forEach((pid: string) => {
                        allParticipantIds.add(pid);
                    });
                }
            });
            
            let profilesMap: Record<string, any> = {};
            if (allParticipantIds.size > 0) {
                const { data: profs } = await supabase
                    .from('profiles')
                    .select('id, name, email, role, avatar_url')
                    .in('id', Array.from(allParticipantIds));
                if (profs) {
                    profs.forEach(p => { profilesMap[p.id] = p; });
                }
            }
            setProfilesMapState(profilesMap);

            // Formatar os canais do cliente com nomes reais e avatares reais
            const loadedChats = allChats.map(c => {
                let name = c.name;
                let isStaff = false;
                let sub = 'Rede Geral';
                let avatar_url = null;
                
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
                        avatar_url = otherProf.avatar_url || null;
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
                    sub,
                    avatar_url,
                    profileId: c.type === 'dm' ? c.participants?.find((pid: string) => pid !== session.user.id) : null
                };
            });

            // Buscar última atividade de cada canal para já vir ordenado por última mensagem/interação
            const channelIds = loadedChats.map(c => c.id);
            let lastActivityMap: Record<string, number> = {};
            if (channelIds.length > 0) {
                const { data: recentMsgs } = await supabase
                    .from('messages')
                    .select('chat_id, project_id, created_at')
                    .or(`chat_id.in.(${channelIds.join(',')}),project_id.in.(${channelIds.join(',')})`)
                    .order('created_at', { ascending: false });

                if (recentMsgs) {
                    recentMsgs.forEach(m => {
                        const cid = m.chat_id || m.project_id;
                        if (cid && (!lastActivityMap[cid] || new Date(m.created_at).getTime() > lastActivityMap[cid])) {
                            lastActivityMap[cid] = new Date(m.created_at).getTime();
                        }
                    });
                }
            }
            setLastActivityMapState(lastActivityMap);

            // Ordenar canais pela última atividade/interação
            loadedChats.sort((a, b) => {
                const timeA = lastActivityMap[a.id] || 0;
                const timeB = lastActivityMap[b.id] || 0;
                return timeB - timeA;
            });

            setChannels(loadedChats);

            let actCh = null;
            if (initChatId) {
                actCh = loadedChats.find(c => c.id === initChatId) || null;
            } else if (boughtSite && supportChannel) {
                actCh = loadedChats.find(c => c.id === supportChannel.id) || supportChannel;
            } else if (addedDevChat) {
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

    // Solicita permissão para notificações do navegador uma única vez se ativado
    useEffect(() => {
        if (typeof window !== "undefined" && localStorage.getItem("susanoo_chat_alerts") !== "false") {
            if (Notification.permission === "default") {
                Notification.requestPermission();
            }
        }
    }, []);

    // Listener global para mensagens em todos os canais (som pop, contador de não lidas, notificação nativa, fixar topo)
    useEffect(() => {
        if (!user) return;

        const globalCh = supabase.channel('global-chat-client-listener')
            .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'messages' }, (payload: any) => {
                const newMsg = payload.new;
                if (!newMsg) return;

                const currentChannels = channelsRef.current;
                const currentActive = activeChannelRef.current;

                // Verificar se a mensagem pertence a algum dos nossos canais
                const targetChannelId = newMsg.project_id || newMsg.chat_id;
                const matchingChannel = currentChannels.find(c => c.id === targetChannelId);
                if (!matchingChannel) return;

                // Fixar conversa: move o canal imediatamente para o topo com a nova interação/notificação
                setPinnedChannelIds(prev => [targetChannelId, ...prev.filter(id => id !== targetChannelId)]);

                // Se a mensagem foi enviada pelo próprio usuário, ignoramos o alerta/contador
                if (newMsg.user_id === user.id) return;

                const isActive = currentActive && currentActive.id === targetChannelId;
                const isAlertEnabled = localStorage.getItem("susanoo_chat_alerts") !== "false";

                if (isActive) {
                    // Adiciona na tela se o chat correspondente estiver aberto
                    setMessages(prev => prev.find(m => m.id === newMsg.id) ? prev : [...prev, newMsg]);
                } else {
                    // Incrementa o contador de não lidas
                    setUnreadCounts(prev => ({
                        ...prev,
                        [targetChannelId]: (prev[targetChannelId] || 0) + 1
                    }));
                }

                // Tocar som pop e disparar notificação nativa caso habilitado
                if (isAlertEnabled) {
                    playNotificationSound();

                    if (typeof window !== "undefined" && Notification.permission === "granted") {
                        new Notification(matchingChannel.name || "Nova mensagem no SUSANOO", {
                            body: newMsg.content || "Enviou um anexo",
                        });
                    }
                }
            })
            .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'messages' }, (payload: any) => {
                const updatedMessage = payload.new as Message | undefined;
                if (!updatedMessage?.id) return;
                setMessages(prev => prev.map(message => message.id === updatedMessage.id ? updatedMessage : message));
            })
            .on('postgres_changes', { event: 'DELETE', schema: 'public', table: 'messages' }, (payload: any) => {
                const deletedId = payload.old?.id as string | undefined;
                if (!deletedId) return;
                setMessages(prev => prev.filter(message => message.id !== deletedId));
            })
            .subscribe();

        return () => { supabase.removeChannel(globalCh); };
    }, [user]);

    useEffect(() => {
        if (!activeChannel) return;
        const cid = activeChannel.id;
        const ch = supabase.channel(`chat-room-${cid}`, { config: { broadcast: { ack: true } } })
            .on('broadcast', { event: 'sync' }, ({ payload }) => {
                const msg = payload?.newMessage;
                const field = activeChannel.isProject ? 'project_id' : 'chat_id';
                if (msg && msg[field] === cid) {
                    setMessages(prev => {
                        if (prev.find(m => m.id === msg.id)) return prev;
                        return [...prev, msg];
                    });
                }
            })
            .on('broadcast', { event: 'message-updated' }, ({ payload }) => {
                const updatedMessage = payload?.message as Message | undefined;
                if (!updatedMessage?.id) return;
                setMessages(prev => prev.map(message => message.id === updatedMessage.id ? updatedMessage : message));
            })
            .on('broadcast', { event: 'message-deleted' }, ({ payload }) => {
                const deletedId = payload?.messageId as string | undefined;
                if (!deletedId) return;
                setMessages(prev => prev.filter(message => message.id !== deletedId));
            })
            .on('broadcast', { event: 'typing' }, (raw: any) => {
                const { name, isTyping } = raw.payload ?? {};
                if (!name || name === getMyName()) return;
                setTypingUsers(prev => isTyping ? [...new Set([...prev, name])] : prev.filter(n => n !== name));
            })
            .subscribe();
        chatChannelRef.current = ch;
        return () => { supabase.removeChannel(ch); };
    }, [activeChannel?.id, user]);

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
        
        setUnreadCounts(prev => ({
            ...prev,
            [channel.id]: 0
        }));

        await loadMessages(channel);
    };

    const openParticipantProfile = (profileId?: string | null) => {
        if (!profileId) return;
        router.push(`/dashboard/developers/${profileId}`);
    };

    const handleDeleteMessage = async () => {
        if (!messageToDelete) return;
        setDestructiveActionLoading(true);
        const deletedId = messageToDelete.id;
        const { error } = await supabase.from('messages').delete().eq('id', deletedId);
        if (!error) {
            setMessages(prev => prev.filter(message => message.id !== deletedId));
            chatChannelRef.current?.send({ type: 'broadcast', event: 'message-deleted', payload: { messageId: deletedId } });
            setMessageToDelete(null);
        }
        setDestructiveActionLoading(false);
    };

    const handleRemoveConversation = async () => {
        if (!activeChannel || !user) return;
        setDestructiveActionLoading(true);

        const participants = Array.isArray(activeChannel.participants) ? activeChannel.participants : [];
        const remainingParticipants = participants.filter((participantId: string) => participantId !== user.id);
        const shouldDeleteOwnedSupport = activeChannel.type === 'support' && activeChannel.user_id === user.id;

        let error = null;
        if (shouldDeleteOwnedSupport) {
            await supabase.from('messages').delete().eq('chat_id', activeChannel.id);
            const result = await supabase.from('chats').delete().eq('id', activeChannel.id);
            error = result.error;
        } else {
            const result = await supabase.from('chats').update({ participants: remainingParticipants }).eq('id', activeChannel.id);
            error = result.error;
        }

        if (!error) {
            setChannels(prev => prev.filter(channel => channel.id !== activeChannel.id));
            setPinnedChannelIds(prev => prev.filter(channelId => channelId !== activeChannel.id));
            setMessages([]);
            setActiveChannel(null);
            setShowRemoveConversation(false);
        }
        setDestructiveActionLoading(false);
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

        if (editingMessage) {
            const { data: updatedMessage, error } = await supabase.from('messages').update({ content: msgContent }).eq('id', editingMessage.id).select().single();
            if (!error && updatedMessage) {
                setMessages(prev => prev.map(m => m.id === editingMessage.id ? updatedMessage : m));
                chatChannelRef.current?.send({ type: 'broadcast', event: 'message-updated', payload: { message: updatedMessage } });
            }
            setEditingMessage(null);
            return;
        }

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

        // Ao enviar mensagem, fixar a conversa no topo
        if (activeChannel?.id) {
            setPinnedChannelIds(prev => [activeChannel.id, ...prev.filter(id => id !== activeChannel.id)]);
        }
    };

    return (
        <div className="flex-1 flex overflow-hidden bg-background h-full relative text-foreground">

            <AnimatePresence>
                {messageToDelete && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 z-[250] flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm" role="dialog" aria-modal="true" aria-labelledby="delete-message-title">
                        <motion.div initial={{ opacity: 0, y: 16, scale: 0.97 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: 12, scale: 0.98 }} className="w-full max-w-sm rounded-3xl bg-surface p-6 shadow-2xl ring-1 ring-red-500/20">
                            <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-2xl bg-red-500/10 text-red-500"><AlertTriangle className="h-6 w-6" /></div>
                            <h2 id="delete-message-title" className="text-xl font-black text-foreground">Excluir esta mensagem?</h2>
                            <p className="mt-2 text-sm leading-relaxed text-foreground/55">Ela será removida desta conversa em tempo real para todos os participantes.</p>
                            <div className="mt-6 flex gap-3">
                                <button type="button" onClick={() => setMessageToDelete(null)} disabled={destructiveActionLoading} className="flex-1 rounded-xl bg-foreground/5 px-4 py-3 text-xs font-black text-foreground/65 hover:bg-foreground/10">Cancelar</button>
                                <button type="button" onClick={handleDeleteMessage} disabled={destructiveActionLoading} className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-red-500 px-4 py-3 text-xs font-black text-white hover:bg-red-600 disabled:opacity-60">
                                    {destructiveActionLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />} Excluir
                                </button>
                            </div>
                        </motion.div>
                    </motion.div>
                )}

                {showRemoveConversation && activeChannel && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 z-[240] flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm" role="dialog" aria-modal="true" aria-labelledby="remove-chat-title">
                        <motion.div initial={{ opacity: 0, y: 16, scale: 0.97 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: 12, scale: 0.98 }} className="w-full max-w-sm rounded-3xl bg-surface p-6 shadow-2xl ring-1 ring-red-500/20">
                            <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-2xl bg-red-500/10 text-red-500"><Trash2 className="h-6 w-6" /></div>
                            <h2 id="remove-chat-title" className="text-xl font-black text-foreground">Remover conversa?</h2>
                            <p className="mt-2 text-sm leading-relaxed text-foreground/55">{activeChannel.type === 'support' ? 'O histórico deste atendimento será excluído.' : 'Você sairá desta conversa e ela deixará de aparecer na sua lista.'}</p>
                            <div className="mt-6 flex gap-3">
                                <button type="button" onClick={() => setShowRemoveConversation(false)} disabled={destructiveActionLoading} className="flex-1 rounded-xl bg-foreground/5 px-4 py-3 text-xs font-black text-foreground/65 hover:bg-foreground/10">Cancelar</button>
                                <button type="button" onClick={handleRemoveConversation} disabled={destructiveActionLoading} className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-red-500 px-4 py-3 text-xs font-black text-white hover:bg-red-600 disabled:opacity-60">
                                    {destructiveActionLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />} Remover
                                </button>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

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
            <aside className={`${activeChannel ? 'hidden md:flex' : 'flex'} h-full w-full shrink-0 flex-col bg-surface/45 md:w-[320px] md:border-r md:border-surface-border lg:w-[344px]`}>
                <div className="px-4 pb-4 pt-5 sm:px-5 sm:pt-6">
                    <div className="mb-5 flex items-end justify-between gap-3">
                        <div>
                            <span className="mb-1 block text-[10px] font-black uppercase tracking-[0.22em] text-accent">Conversas</span>
                            <h2 className="text-2xl font-black tracking-[-0.04em] text-foreground">Chat</h2>
                        </div>
                        <span className="flex h-8 min-w-8 items-center justify-center rounded-full bg-accent/10 px-2 text-xs font-black text-accent ring-1 ring-accent/15">
                            {channels.length}
                        </span>
                    </div>
                    <div className="relative">
                        <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-foreground/30"/>
                        <input 
                            type="search" placeholder="Buscar uma conversa"
                            value={searchTerm} onChange={e => setSearchTerm(e.target.value)}
                            className="h-12 w-full rounded-2xl border border-surface-border bg-background/80 pl-11 pr-4 text-sm font-medium text-foreground outline-none transition-all placeholder:text-foreground/30 focus:border-accent/40 focus:ring-4 focus:ring-accent/5"
                        />
                    </div>
                </div>
                <div className="custom-scrollbar flex-1 space-y-2 overflow-y-auto px-3 pb-5">
                    {[...channels]
                        .sort((a, b) => {
                            const aPinned = pinnedChannelIds.includes(a.id);
                            const bPinned = pinnedChannelIds.includes(b.id);
                            if (aPinned && !bPinned) return -1;
                            if (!aPinned && bPinned) return 1;
                            if (aPinned && bPinned) return pinnedChannelIds.indexOf(a.id) - pinnedChannelIds.indexOf(b.id);
                            const timeA = lastActivityMapState[a.id] || 0;
                            const timeB = lastActivityMapState[b.id] || 0;
                            return timeB - timeA;
                        })
                        .filter(c => c.name?.toLowerCase().includes(searchTerm.toLowerCase())).map(c => {
                            const unreadCount = unreadCounts[c.id] || 0;
                            const isPinned = pinnedChannelIds.includes(c.id);
                            return (
                                <div key={c.id} className="group relative flex items-center">
                                    <button 
                                        onClick={() => handleSelectChannel(c)}
                                        className={`flex w-full cursor-pointer items-center gap-3 rounded-2xl border p-3.5 text-left transition-all duration-200 active:scale-[0.99] ${activeChannel?.id === c.id ? 'border-accent/20 bg-accent/10 shadow-sm shadow-accent/5' : 'border-transparent hover:border-surface-border hover:bg-background/75'}`}
                                    >
                                        <div className={`relative flex h-11 w-11 shrink-0 items-center justify-center overflow-hidden rounded-2xl text-sm font-black uppercase transition-colors ${activeChannel?.id === c.id ? 'bg-accent text-white shadow-lg shadow-accent/20' : 'bg-background text-foreground/50 ring-1 ring-surface-border group-hover:text-accent'}`}>
                                            {c.isStaff ? (
                                                <ShieldAlert className="w-5 h-5"/>
                                            ) : c.avatar_url ? (
                                                <img src={c.avatar_url} alt={c.name} className="w-full h-full object-cover" />
                                            ) : (
                                                c.name?.substring(0,2)
                                            )}
                                        </div>
                                        <div className="flex min-w-0 flex-1 flex-col items-start overflow-hidden pr-9 text-left">
                                            <span className="text-sm font-bold text-foreground truncate w-full flex items-center justify-between gap-1.5">
                                                <span className="truncate">{c.name}</span>
                                                {unreadCount > 0 ? (
                                                    <span className="text-[10px] bg-red-600 text-white min-w-[20px] h-5 px-1.5 rounded-full font-black flex items-center justify-center shrink-0 shadow-md shadow-red-600/40 animate-pulse">
                                                        {unreadCount > 99 ? '99+' : unreadCount}
                                                    </span>
                                                ) : (
                                                    isPinned && (
                                                        <span className="text-[8px] bg-accent/20 text-accent px-1.5 py-0.5 rounded font-black uppercase shrink-0 flex items-center gap-1">
                                                            <Pin className="w-2.5 h-2.5 fill-accent" /> Fixada
                                                        </span>
                                                    )
                                                )}
                                            </span>
                                            <span className="text-[10px] text-foreground/50 font-bold uppercase">{c.sub}</span>
                                        </div>
                                    </button>

                                    {/* Botão de Fixar no Hover */}
                                    <div className={`absolute right-2 ${isPinned ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'} flex items-center gap-1 bg-surface/90 backdrop-blur-md p-1 rounded-lg border border-surface-border shadow-xl transition-all duration-200`}>
                                        <button 
                                            onClick={(e) => { 
                                                e.stopPropagation(); 
                                                togglePinChannel(c.id);
                                            }} 
                                            className={`p-1.5 rounded-md transition-all cursor-pointer ${isPinned ? 'bg-accent/20 text-accent' : 'hover:bg-foreground/5 text-foreground/40 hover:text-foreground'}`}
                                            title={isPinned ? "Desafixar conversa" : "Fixar conversa no topo"}
                                        >
                                            <Pin className={`w-3.5 h-3.5 ${isPinned ? 'fill-accent' : ''}`}/>
                                        </button>
                                    </div>
                                </div>
                            );
                        })}
                </div>
            </aside>

            {/* Main */}
            <div className={`${activeChannel ? 'flex' : 'hidden md:flex'} relative h-full min-w-0 flex-1 flex-col`}>
                {activeChannel ? (
                    <>
                        <div className="z-50 flex items-center justify-between bg-background/80 px-3 py-3 shadow-sm backdrop-blur-md sm:px-8 sm:py-5">
                            <div className="flex min-w-0 items-center gap-2 sm:gap-4">
                                <button type="button" onClick={() => setActiveChannel(null)} aria-label="Voltar para conversas" className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-foreground/55 hover:bg-foreground/5 md:hidden">
                                    <ArrowLeft className="h-5 w-5" />
                                </button>
                                <div className="w-10 h-10 rounded-xl bg-accent/10 border border-accent/20 flex items-center justify-center text-accent overflow-hidden">
                                    {activeChannel.isStaff ? (
                                        <ShieldAlert className="w-5 h-5" />
                                    ) : activeChannel.avatar_url ? (
                                        <img src={activeChannel.avatar_url} alt={activeChannel.name} className="w-full h-full object-cover" />
                                    ) : (
                                        <UserRound className="w-5 h-5" />
                                    )}
                                </div>
                                <button type="button" onClick={() => openParticipantProfile(activeChannel.profileId)} disabled={!activeChannel.profileId} className="min-w-0 text-left disabled:cursor-default">
                                    <h1 className="flex items-center gap-2 font-bold text-foreground transition-colors enabled:hover:text-accent">
                                        <span className="truncate">{activeChannel.name}</span>
                                        <span className="h-2 w-2 shrink-0 rounded-full bg-emerald-500 animate-pulse" />
                                    </h1>
                                    <p className="truncate text-[10px] font-black uppercase tracking-widest text-foreground/30">{activeChannel.sub}</p>
                                </button>
                            </div>
                            <div className="flex items-center gap-2">
                                <button 
                                    onClick={() => togglePinChannel(activeChannel.id)}
                                    className={`p-2 px-3 rounded-xl border text-xs font-bold flex items-center gap-2 transition-all cursor-pointer ${pinnedChannelIds.includes(activeChannel.id) ? 'bg-accent/20 text-accent border-accent/30' : 'bg-surface text-foreground/60 hover:text-foreground border-surface-border'}`}
                                >
                                    <Pin className={`w-4 h-4 ${pinnedChannelIds.includes(activeChannel.id) ? 'fill-accent' : ''}`} />
                                    <span className="hidden sm:inline">{pinnedChannelIds.includes(activeChannel.id) ? 'Fixada' : 'Fixar'}</span>
                                </button>
                                <button type="button" onClick={() => setShowRemoveConversation(true)} aria-label="Remover conversa" title="Sair ou excluir conversa" className="flex h-9 w-9 items-center justify-center rounded-xl bg-red-500/10 text-red-500 ring-1 ring-red-500/20 transition-colors hover:bg-red-500 hover:text-white">
                                    <Trash2 className="h-4 w-4" />
                                </button>
                            </div>
                        </div>

                        <div className="custom-scrollbar flex flex-1 flex-col gap-6 overflow-y-auto px-3 py-5 sm:px-6 sm:py-8">
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
                                const authorAvatar = isMe ? profile?.avatar_url : profilesMapState[msg.user_id]?.avatar_url;
                                const { text, inlineImages } = parseMessageContent(msg.content || '');
                                const isDirectImageUrl = !msg.file_url && msg.content?.match(/^https?:\/\/.+\.(png|jpg|jpeg|gif|webp)/i);

                                return (
                                    <motion.div key={msg.id}
                                        initial={{ opacity: 0, scale:0.95, originY: 1 }} animate={{ opacity: 1, scale:1 }}
                                        className={`flex w-full gap-3 group ${isMe ? 'flex-row-reverse' : 'flex-row'}`}>

                                        {isStaff ? (
                                            <div className="w-10 h-10 rounded-full shrink-0 flex items-center justify-center text-[10px] font-black uppercase bg-accent border-accent/40 text-white shadow-[0_0_12px_rgba(var(--accent-rgb),0.5)]">
                                                HQ
                                            </div>
                                        ) : (
                                            <button type="button" onClick={() => isMe ? router.push('/dashboard/profile') : openParticipantProfile(msg.user_id)} aria-label={`Abrir perfil de ${isMe ? 'você' : displayName}`} className="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-full border border-surface-border bg-surface text-[12px] font-black uppercase text-foreground/50 ring-accent transition hover:ring-2">
                                                {authorAvatar ? (
                                                    <img src={authorAvatar} alt={displayName} className="w-full h-full object-cover" />
                                                ) : (
                                                    displayName.charAt(0)
                                                )}
                                            </button>
                                        )}

                                        <div className={`flex flex-col gap-1.5 max-w-[75%] ${isMe ? 'items-end' : 'items-start'}`}>
                                            <span className={`text-[10px] font-black uppercase tracking-widest ${isStaff ? 'text-accent' : 'text-foreground/40'}`}>
                                                {isMe ? `Você` : `${displayName} ${isStaff ? '· STAFF' : ''}`}
                                            </span>

                                            <div className={`relative px-5 py-4 shadow-sm ${isMe ? 'rounded-l-2xl rounded-br-2xl bg-accent text-white' : 'rounded-r-2xl rounded-bl-2xl bg-surface text-foreground ring-1 ring-foreground/8'}`}>
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
                                            <div className={`mt-1 flex gap-2 opacity-100 transition-opacity md:opacity-0 md:group-hover:opacity-100 ${isMe ? 'flex-row-reverse' : ''}`}>
                                                {isMe && (
                                                    <>
                                                        <button onClick={() => { setEditingMessage(msg); setContent(msg.content || ""); }} className="text-[9px] font-black text-emerald-500 uppercase tracking-widest cursor-pointer hover:underline">Editar</button>
                                                        <button onClick={() => setMessageToDelete(msg)} className="text-[9px] font-black text-red-500 uppercase tracking-widest cursor-pointer hover:underline">Apagar</button>
                                                    </>
                                                )}
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

                        <div className="bg-background px-3 pb-3 sm:px-6 sm:pb-6">
                            <div className="mx-auto flex max-w-4xl flex-col gap-2.5">
                                {editingMessage && (
                                    <div className="mb-1 flex items-center justify-between rounded-xl bg-accent/10 px-4 py-2 text-xs font-bold text-accent ring-1 ring-accent/25">
                                        <span>Editando mensagem...</span>
                                        <button onClick={() => { setEditingMessage(null); setContent(""); }} className="text-[10px] uppercase tracking-wider text-red-500 hover:text-red-600 cursor-pointer">Cancelar</button>
                                    </div>
                                )}
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

                                <form onSubmit={handleSend} className="rounded-[1.5rem] border border-surface-border bg-surface p-2.5 shadow-[0_14px_38px_rgba(0,0,0,0.07)] transition-all focus-within:border-accent/35 focus-within:shadow-[0_16px_44px_rgba(124,58,237,0.09)] sm:rounded-[1.75rem] sm:p-3">
                                    <label htmlFor="chat-message" className="sr-only">Escreva sua mensagem</label>
                                    <textarea
                                        id="chat-message"
                                        rows={1}
                                        value={content}
                                        onChange={e => { setContent(e.target.value); handleTyping(); }}
                                        onKeyDown={event => {
                                            if (event.key === 'Enter' && !event.shiftKey) {
                                                event.preventDefault();
                                                event.currentTarget.form?.requestSubmit();
                                            }
                                        }}
                                        placeholder={`Escreva para ${activeChannel.name || 'esta conversa'}...`}
                                        className="max-h-28 min-h-[42px] w-full resize-none bg-transparent px-1 py-1 text-sm font-medium leading-relaxed text-foreground outline-none placeholder:text-foreground/30"
                                    />
                                    <input type="file" multiple hidden ref={fileInputRef} onChange={handleFileSelect} />
                                    <div className="mt-1.5 flex items-center justify-end gap-2">
                                            <button type="button" onClick={() => fileInputRef.current?.click()} className="flex h-10 w-[6.5rem] items-center justify-center gap-2 rounded-full border border-surface-border bg-background text-xs font-bold text-foreground/60 shadow-sm transition-all hover:border-accent/25 hover:text-accent">
                                                <Paperclip className="h-4 w-4" />
                                                <span>Anexar</span>
                                            </button>
                                            <button type="submit" disabled={loading || (!content.trim() && stagedFiles.length === 0)} className="flex h-10 w-[6.5rem] items-center justify-center gap-2 rounded-full bg-foreground text-xs font-black text-background shadow-md transition-all hover:opacity-90 active:scale-95 disabled:cursor-not-allowed disabled:opacity-30">
                                                <Send className="h-4 w-4" />
                                                Enviar
                                            </button>
                                    </div>
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
