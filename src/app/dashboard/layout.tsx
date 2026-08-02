"use client";
import { ReactNode, useState, useEffect } from "react";
import Link from "next/link";
import { Zap, Grid, MessageSquareText, Calendar, Settings, LogOut, Bot, Sparkles, User, Plus, ShoppingCart } from "lucide-react";
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
                  <div className="flex items-center gap-3 rounded-xl cursor-default transition-colors">
                     <div className="w-8 h-8 rounded-lg bg-accent text-accent-foreground flex items-center justify-center font-bold text-sm shadow-inner shadow-black/50">
                       <Zap className="w-5 h-5 fill-current"/>
                     </div>
                     <span className="font-bold text-[15px] tracking-wide text-foreground">Workspace</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <button onClick={() => setIsCartOpen(true)} className="relative p-2 hover:bg-surface-border/50 rounded-full transition-colors">
                      <ShoppingCart className="w-4 h-4 text-foreground/60" />
                      {items.length > 0 && (
                        <span className="absolute -top-0.5 -right-0.5 bg-accent text-white text-[9px] font-black w-4 h-4 rounded-full flex items-center justify-center">{items.length}</span>
                      )}
                    </button>
                    <ThemeToggle />
                  </div>
               </div>
            </div>

            {/* Menu Sections Focadas na Role do Usuário */}
            <div className="p-4 flex flex-col gap-2">
               {userType === "Desenvolvedor" ? (
                 <>
                   <NavItem icon={<Sparkles className="w-5 h-5"/>} label="Painel Dev" active={mounted ? pathname === '/dashboard' : false} href="/dashboard" />
                   <NavItem icon={<Grid className="w-5 h-5"/>} label="Meus Projetos" active={mounted ? pathname?.includes('/projects') : false} href="/dashboard/projects" />
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
