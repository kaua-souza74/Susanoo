"use client";
import { ReactNode, useState, useEffect } from "react";
import Link from "next/link";
import { Zap, Grid, MessageSquareText, Calendar, Settings, LogOut, Sparkles, User, Plus, ShoppingCart, Bell, Check } from "lucide-react";
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

  const checkProfileCompletion = () => {
    const type = localStorage.getItem("susanoo_profile_type");
    if (type === "Desenvolvedor") {
      setStoreProfileCompleted(true);
    } else {
      const completed = localStorage.getItem("susanoo_store_profile_completed") === "true";
      setStoreProfileCompleted(completed);
    }
  };

  useEffect(() => {
     setMounted(true);
     
     const checkType = async () => {
         const type = await getAuthenticatedAccountType();
         setUserType(type);
         checkProfileCompletion();
     };
     
     checkType();
      
      // Load onboarding state for notifications
      const loadOnboarding = async () => {
         const { data: { session } } = await supabase.auth.getSession();
         const uid = session?.user?.id || 'guest';
         setHasExploredDevelopers(localStorage.getItem(`${uid}_explored-developers`) === 'true');
         setHasProjects(localStorage.getItem(`${uid}_first-project`) === 'true');
      };
      loadOnboarding();
     
     window.addEventListener("profileTypeChanged", checkType);
     window.addEventListener("profileCompletedChanged", checkProfileCompletion);
     return () => {
       window.removeEventListener("profileTypeChanged", checkType);
       window.removeEventListener("profileCompletedChanged", checkProfileCompletion);
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
                      <span className="absolute top-0 right-0 bg-red-500 w-2 h-2 rounded-full border-2 border-background"></span>
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
                      <div className="absolute top-12 left-0 w-80 bg-surface border border-surface-border rounded-2xl shadow-2xl z-[9999] overflow-hidden">
                        <div className="p-4 border-b border-surface-border">
                          <h4 className="text-sm font-black text-foreground">Notificações</h4>
                        </div>
                        <div className="p-3 border-b border-surface-border/50">
                          <p className="text-[10px] font-black uppercase tracking-widest text-foreground/40 mb-2">Progresso</p>
                          <div className="flex flex-col gap-2">
                            {[
                              { label: "Perfil Preenchido", checked: storeProfileCompleted, link: "/dashboard/profile" },
                              { label: "Profissionais explorados", checked: hasExploredDevelopers, link: "/dashboard/developers" },
                              { label: "Explorar sites e templates", checked: hasProjects, link: "#templates-grid" },
                            ].map((item, idx) => (
                              <div 
                                key={idx} 
                                onClick={() => { router.push(item.link); setShowNotifications(false); }}
                                className={`flex items-center gap-2.5 px-3 py-2 rounded-xl cursor-pointer transition-all ${ item.checked ? 'bg-emerald-500/8 text-emerald-600' : 'hover:bg-surface-border/20 text-foreground/60'}`}
                              >
                                <div className={`w-4 h-4 rounded-full border flex items-center justify-center shrink-0 ${ item.checked ? 'bg-emerald-500 border-emerald-500 text-white' : 'border-surface-border'}`}>
                                  {item.checked && <Check className="w-2.5 h-2.5" />}
                                </div>
                                <span className="text-xs font-bold">{item.label}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                        <div className="p-3">
                          <p className="text-[10px] font-black uppercase tracking-widest text-foreground/40 mb-2">Mensagens</p>
                          <div className="p-3 hover:bg-surface-border/10 cursor-pointer rounded-xl transition-colors">
                            <p className="text-xs font-bold text-foreground mb-1">Bem-vindo à Susanoo! 🎉</p>
                            <p className="text-[11px] text-foreground/60 leading-relaxed">Explore o marketplace e encontre o projeto ideal.</p>
                          </div>
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
                   <NavItem icon={<MessageSquareText className="w-5 h-5"/>} label="Chat com Clientes" active={mounted ? pathname?.includes('/chat') : false} href="/dashboard/chat" />
                 </>
               ) : (
                 <>
                   <NavItem icon={<Sparkles className="w-5 h-5"/>} label="Marketplace" active={mounted ? pathname === '/dashboard' : false} href="/dashboard" />
                   <NavItem icon={<User className="w-5 h-5"/>} label="Desenvolvedores" active={mounted ? pathname?.includes('/developers') : false} href="/dashboard/developers" />
                   <NavItem icon={<Grid className="w-5 h-5"/>} label="Meus Projetos" active={mounted ? pathname?.includes('/projects') || pathname?.includes('/kanban') : false} href="/dashboard/projects" />
                   <NavItem icon={<MessageSquareText className="w-5 h-5"/>} label="Chat com a Equipe" active={mounted ? pathname?.includes('/chat') : false} href="/dashboard/chat" />
                   <NavItem icon={<Calendar className="w-5 h-5"/>} label="Cronograma" active={mounted ? pathname?.includes('/timeline') : false} href="/dashboard/timeline" />
                 </>
               )}
               
               <div className="my-2 border-t border-surface-border" /> {/* Separator */}
               
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
function NavItem({ icon, label, active = false, href, warning = false }: { icon: ReactNode, label: string, active?: boolean, href: string, warning?: boolean }) {
    return (
        <Link href={href} className={`flex items-center justify-between px-4 py-3.5 rounded-xl text-[15px] transition-all duration-200 cursor-pointer ${active ? 'bg-foreground/5 text-foreground font-bold border border-surface-border shadow-sm' : 'text-foreground/60 font-medium hover:bg-foreground/5 hover:text-foreground border border-transparent'}`}>
            <div className="flex items-center gap-3">
                {icon}
                {label}
            </div>
            {warning && (
                <span className="bg-red-500 text-white text-[10px] font-black w-4.5 h-4.5 rounded-full flex items-center justify-center animate-pulse">!</span>
            )}
        </Link>
    )
}
