"use client";
import { ReactNode, useState, useEffect } from "react";
import Link from "next/link";
import { Zap, Grid, MessageSquareText, Calendar, Settings, LogOut, Sparkles, User, Plus, ShoppingCart, Bell, Check, ShoppingBag } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { useRouter, usePathname } from "next/navigation";
import { ThemeToggle } from "@/components/theme-toggle";
import { SusanooAIWidget } from "@/components/SusanooAIWidget";
import { useCart } from "@/components/CartContext";
import { CartSidebar } from "@/components/CartSidebar";
import { getAuthenticatedAccountType } from "@/lib/account";

export default function DashboardLayout({ children }: { children: ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [mounted, setMounted] = useState(false);
  const [userType, setUserType] = useState<"Comércio" | "Desenvolvedor">("Comércio");
  const [storeProfileCompleted, setStoreProfileCompleted] = useState(true);
  const { items, setIsCartOpen } = useCart();
  const [showNotifications, setShowNotifications] = useState(false);
  const [hasExploredDevelopers, setHasExploredDevelopers] = useState(false);
  const [hasProjects, setHasProjects] = useState(false);
  const [dbNotifications, setDbNotifications] = useState<any[]>([]);
  const [unreadChatCount, setUnreadChatCount] = useState<number>(0);

  const checkProfileCompletion = () => {
    const type = localStorage.getItem("susanoo_profile_type");
    if (type === "Desenvolvedor") {
      setStoreProfileCompleted(true);
    } else {
      const completed = localStorage.getItem("susanoo_store_profile_completed") === "true";
      setStoreProfileCompleted(completed);
    }
  };

  const fetchDbNotifications = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .or(`user_id.is.null,user_id.eq.${userId}`)
        .order('created_at', { ascending: false });
      if (!error && data) {
        setDbNotifications(data);
      }
    } catch (e) {
      console.error("Erro ao carregar notificações no layout:", e);
    }
  };

  const markNotificationAsRead = async (id: string) => {
    try {
      const { error } = await supabase
        .from('notifications')
        .update({ read: true })
        .eq('id', id);
      if (!error) {
        setDbNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
      }
    } catch (e) {
      console.error("Erro ao marcar notificação como lida:", e);
    }
  };

  useEffect(() => {
     if (pathname?.includes('/dashboard/chat')) {
       setUnreadChatCount(0);
     }
  }, [pathname]);

  useEffect(() => {
     setMounted(true);
     let active = true;
     let notifChannel: any = null;
     let msgChannel: any = null;
     
     const checkType = async () => {
         const type = await getAuthenticatedAccountType();
         if (!active) return;
         setUserType(type);
         checkProfileCompletion();
     };
     
     checkType();
      
      const loadOnboardingAndNotifications = async () => {
         const { data: { session } } = await supabase.auth.getSession();
         if (!active) return;
         
         const uid = session?.user?.id;
         const uidStorage = uid || 'guest';
         setHasExploredDevelopers(localStorage.getItem(`${uidStorage}_explored-developers`) === 'true');
         setHasProjects(localStorage.getItem(`${uidStorage}_first-project`) === 'true');
         
         if (uid) {
           await fetchDbNotifications(uid);
           if (!active) return;
           
           const channelName = `user-notifs-${uid}`;
           const existingChannel = supabase.channel(channelName);
           if (existingChannel) {
             await supabase.removeChannel(existingChannel);
           }
           
           notifChannel = supabase.channel(channelName)
             .on('postgres_changes', { event: '*', schema: 'public', table: 'notifications' }, () => {
                 if (active) fetchDbNotifications(uid);
             });
             
           notifChannel.subscribe();

           // Escutar mensagens não lidas para o usuário no dashboard
           msgChannel = supabase.channel(`user-chat-counter-${uid}`)
             .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'messages' }, (payload: any) => {
                 const newMsg = payload.new;
                 if (newMsg && newMsg.user_id !== uid) {
                     if (!window.location.pathname.includes('/dashboard/chat')) {
                         setUnreadChatCount(prev => prev + 1);
                     }
                 }
             })
             .subscribe();
         }
      };
      loadOnboardingAndNotifications();
     
     window.addEventListener("profileTypeChanged", checkType);
     window.addEventListener("profileCompletedChanged", checkProfileCompletion);
     return () => {
       active = false;
       window.removeEventListener("profileTypeChanged", checkType);
       window.removeEventListener("profileCompletedChanged", checkProfileCompletion);
       if (notifChannel) supabase.removeChannel(notifChannel);
       if (msgChannel) supabase.removeChannel(msgChannel);
     };
  }, []);

  const handleLogout = () => {
        supabase.auth.signOut();
        router.replace("/");
  };

  return (
    <div className="flex h-screen bg-background text-foreground selection:bg-accent selection:text-white font-sans transition-colors duration-300">
      <aside className="w-[280px] bg-surface border-r border-surface-border flex flex-col justify-between hidden md:flex shrink-0 transition-colors duration-300">
        <div>
            {/* Header Área do Cliente */}
            <div className="p-4 border-b border-surface-border mb-4">
               <div className="flex items-center justify-between px-3 py-2">
                  <div className="flex items-center gap-3 rounded-xl cursor-pointer transition-colors group" onClick={() => router.push('/dashboard')}>
                     <div className="w-8 h-8 rounded-lg bg-accent text-accent-foreground flex items-center justify-center font-bold text-sm shadow-inner shadow-black/50 group-hover:scale-105 transition-transform">
                       <Zap className="w-5 h-5 fill-current"/>
                     </div>
                     <span className="font-bold text-[15px] tracking-wide text-foreground group-hover:text-accent transition-colors">Susanoo</span>
                  </div>
                  <div className="flex items-center gap-1.5 relative">
                    <button onClick={() => setShowNotifications(!showNotifications)} className="relative p-2 hover:bg-surface-border/50 rounded-full transition-colors cursor-pointer text-foreground/60 hover:text-foreground">
                      <Bell className="w-4 h-4" />
                      {dbNotifications.some(n => !n.read) && (
                        <span className="absolute top-0 right-0 bg-red-500 w-2 h-2 rounded-full border-2 border-background"></span>
                      )}
                    </button>
                    <button onClick={() => setIsCartOpen(true)} className="relative p-2 hover:bg-surface-border/50 rounded-full transition-colors cursor-pointer text-foreground/60 hover:text-foreground">
                      <ShoppingCart className="w-4 h-4" />
                      {items.length > 0 && (
                        <span className="absolute -top-0.5 -right-0.5 bg-accent text-white text-[9px] font-black w-4 h-4 rounded-full flex items-center justify-center">{items.length}</span>
                      )}
                    </button>
                    <div className="cursor-pointer flex items-center justify-center">
                        <ThemeToggle />
                    </div>

                    {/* Notifications Dropdown */}
                    {showNotifications && (
                      <div className="absolute top-12 left-0 w-80 bg-surface border border-surface-border rounded-2xl shadow-2xl z-[9999] overflow-hidden font-sans">
                        <div className="p-4 border-b border-surface-border">
                          <h4 className="text-sm font-black text-foreground">Notificações</h4>
                        </div>

                        <div className="p-3 max-h-60 overflow-y-auto custom-scrollbar flex flex-col gap-2">
                          <p className="text-[10px] font-black uppercase tracking-widest text-foreground/40 mb-1">Alertas do Sistema</p>
                          {dbNotifications.length === 0 ? (
                            <div className="p-3 text-center text-xs text-foreground/40">
                              Nenhum alerta ativo por enquanto.
                            </div>
                          ) : (
                            dbNotifications.map((notif) => (
                              <div 
                                key={notif.id}
                                className={`p-3 rounded-xl border flex flex-col justify-between gap-1.5 transition-all ${notif.read ? 'bg-surface border-surface-border opacity-60' : 'bg-accent/5 border-accent/20'}`}
                              >
                                <div className="flex items-start justify-between gap-2">
                                  <div className="overflow-hidden">
                                    <p className={`text-xs font-bold text-foreground flex items-center gap-1.5 ${notif.read ? '' : 'text-accent'}`}>
                                      {notif.title}
                                      {!notif.read && <span className="w-1.5 h-1.5 rounded-full bg-accent animate-pulse shrink-0" />}
                                    </p>
                                    <p className="text-[11px] text-foreground/60 leading-relaxed mt-0.5 break-words">{notif.content}</p>
                                  </div>
                                  {!notif.read && (
                                    <button 
                                      onClick={(e) => { e.stopPropagation(); markNotificationAsRead(notif.id); }}
                                      className="p-1 hover:bg-emerald-500/10 text-emerald-500 rounded-lg transition-colors shrink-0 cursor-pointer"
                                      title="Marcar como lida"
                                    >
                                      <Check className="w-3.5 h-3.5" />
                                    </button>
                                  )}
                                </div>
                                <span className="text-[9px] text-foreground/30 font-medium block">{new Date(notif.created_at).toLocaleString('pt-BR')}</span>
                              </div>
                            ))
                          )}
                        </div>
                      </div>
                    )}
                  </div>
               </div>
            </div>

            {/* Menu Sections Focadas na Role do Usuário */}
            <div className="p-4 flex flex-col gap-2">
               {userType === "Desenvolvedor" ? (
                 <>
                   <NavItem icon={<Sparkles className="w-5 h-5"/>} label="Painel Dev" active={mounted ? pathname === '/dashboard' : false} href="/dashboard" />
                   <NavItem icon={<Grid className="w-5 h-5"/>} label="Projetos Criados" active={mounted ? pathname?.includes('/projects') : false} href="/dashboard/projects" />
                   <NavItem icon={<Plus className="w-5 h-5"/>} label="Adicionar Site" active={mounted ? pathname?.includes('/add-site') : false} href="/dashboard/add-site" />
                   <NavItem badge={unreadChatCount} icon={<MessageSquareText className="w-5 h-5"/>} label="Chat com Clientes" active={mounted ? pathname?.includes('/chat') : false} href="/dashboard/chat" />
                 </>
               ) : (
                 <>
                   <NavItem icon={<Sparkles className="w-5 h-5"/>} label="Marketplace" active={mounted ? pathname === '/dashboard' : false} href="/dashboard" />
                   <NavItem icon={<User className="w-5 h-5"/>} label="Desenvolvedores" active={mounted ? pathname?.includes('/developers') : false} href="/dashboard/developers" />
                   <NavItem icon={<ShoppingBag className="w-5 h-5"/>} label="Minhas Compras" active={mounted ? pathname?.includes('/projects') : false} href="/dashboard/projects" />
                   <NavItem icon={<Calendar className="w-5 h-5"/>} label="Progresso Integrado" active={mounted ? pathname?.includes('/timeline') || pathname?.includes('/kanban') : false} href="/dashboard/timeline" />
                   <NavItem badge={unreadChatCount} icon={<MessageSquareText className="w-5 h-5"/>} label="Chat com a Equipe" active={mounted ? pathname?.includes('/chat') : false} href="/dashboard/chat" />
                 </>
               )}
               
               <div className="my-2 border-t border-surface-border" />
               
               <NavItem icon={<User className="w-5 h-5"/>} label="Meu Perfil" active={mounted ? pathname?.includes('/profile') : false} href="/dashboard/profile" warning={!storeProfileCompleted} />
               <NavItem icon={<Settings className="w-5 h-5"/>} label="Configurações" active={mounted ? pathname?.includes('/settings') : false} href="/dashboard/settings" />
            </div>
        </div>

        <div className="p-4 border-t border-surface-border pb-6">
             <button onClick={handleLogout} className="cursor-pointer flex items-center gap-3 px-4 py-3 text-sm font-bold text-foreground/60 hover:text-[#ff4040] hover:bg-red-500/10 rounded-xl w-full transition-colors border border-transparent hover:border-red-500/20">
                <LogOut className="w-5 h-5"/> Fazer Logout
             </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col overflow-hidden h-screen bg-background transition-colors duration-300">
         {children}
      </main>
      
      {/* Susanoo AI Floating Widget */}
      <SusanooAIWidget />
      <CartSidebar />
    </div>
  );
}

// Componente para tornar o NavLink inteligente (Aba Ativa)
function NavItem({ icon, label, active = false, href, warning = false, badge = 0 }: { icon: ReactNode, label: string, active?: boolean, href: string, warning?: boolean, badge?: number }) {
    return (
        <Link href={href} className={`flex items-center justify-between px-4 py-3.5 rounded-xl text-[15px] transition-all duration-200 cursor-pointer ${active ? 'bg-foreground/5 text-foreground font-bold border border-surface-border shadow-sm' : 'text-foreground/60 font-medium hover:bg-foreground/5 hover:text-foreground border border-transparent'}`}>
            <div className="flex items-center gap-3">
                <div className="flex items-center justify-center text-foreground/60">
                    {icon}
                </div>
                <span>{label}</span>
            </div>
            <div className="flex items-center gap-2">
                {badge > 0 && !warning && (
                    <span className="bg-red-600 text-white text-[10px] font-black min-w-[20px] h-5 px-1.5 rounded-full flex items-center justify-center shadow-md shadow-red-600/40 animate-pulse">
                        {badge > 99 ? '99+' : badge}
                    </span>
                )}
                {warning && (
                    <span className="bg-red-500 text-white text-[10px] font-black w-4.5 h-4.5 rounded-full flex items-center justify-center animate-pulse">!</span>
                )}
            </div>
        </Link>
    )
}
