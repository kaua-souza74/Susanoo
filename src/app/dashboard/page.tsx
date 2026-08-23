"use client";
import { useEffect, useState } from "react";
import { 
  Search, 
  ExternalLink, 
  Star, 
  ShoppingCart, 
  X, 
  Check, 
  Heart,
  ShoppingBag,
  Zap,
  Shield,
  ThumbsUp,
  ArrowLeft,
  User,
  Briefcase,
  TrendingUp,
  DollarSign,
  MessageCircle,
  FileText,
  Sparkles,
  ArrowRight
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { supabase } from "@/lib/supabase";
import { useCart } from "@/components/CartContext";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { getAuthenticatedAccountType, getAccountStorageKey } from "@/lib/account";

type MainMode = "Susanoo" | "Geral";

export default function DiscoverHome() {
   const router = useRouter();
   const [userType, setUserType] = useState<"Comércio" | "Desenvolvedor">("Comércio");
   const [mainMode, setMainMode] = useState<MainMode>("Susanoo");
   const [search, setSearch] = useState("");
   const [projects, setProjects] = useState<any[]>([]);
   const [loading, setLoading] = useState(true);
   const [activeProduct, setActiveProduct] = useState<any | null>(null);
   const [favorited, setFavorited] = useState(false);
   const [liked, setLiked] = useState(false);
   const [activeTab, setActiveTab] = useState<"detalhes" | "especificacoes" | "comentarios">("detalhes");
   const [likedProjectIds, setLikedProjectIds] = useState<string[]>([]);

   // Checklist & Onboarding states
   const [storeProfileCompleted, setStoreProfileCompleted] = useState(false);
   const [hasProjects, setHasProjects] = useState(false);
   const [hasExploredDevelopers, setHasExploredDevelopers] = useState(false);
   const [hasChat, setHasChat] = useState(false);
   const [hasReview, setHasReview] = useState(false);
   const [onboardingDismissed, setOnboardingDismissed] = useState(false);

   const { addToCart, items, setIsCartOpen } = useCart();

   useEffect(() => {
     const loadAccount = async () => {
       setUserType(await getAuthenticatedAccountType());
       const { data: { session } } = await supabase.auth.getSession();
       const userId = session?.user?.id;

       const [profileKey, projectKey, developersKey, chatKey, reviewKey, onboardingKey, likeKey] = await Promise.all([
         getAccountStorageKey("store-profile-completed"), getAccountStorageKey("first-project"), getAccountStorageKey("explored-developers"), getAccountStorageKey("first-chat"), getAccountStorageKey("first-review"), getAccountStorageKey("onboarding-dismissed"), getAccountStorageKey("liked_projects")
       ]);
       setStoreProfileCompleted(localStorage.getItem(profileKey) === "true" || localStorage.getItem("susanoo_store_profile_completed") === "true");
       setHasProjects(localStorage.getItem(projectKey) === "true");
       setHasExploredDevelopers(localStorage.getItem(developersKey) === "true");
       setHasChat(localStorage.getItem(chatKey) === "true");
       setHasReview(localStorage.getItem(reviewKey) === "true");
       setOnboardingDismissed(localStorage.getItem(onboardingKey) === "true");
       
       if (userId) {
         try {
           const { data: dbLikes } = await supabase.from('likes').select('project_id').eq('user_id', userId);
           if (dbLikes && dbLikes.length > 0) {
             setLikedProjectIds(dbLikes.map((l: any) => l.project_id));
             return;
           }
         } catch (e) {
           console.error("Erro ao carregar curtidas do banco:", e);
         }
       }

       // Curtidas vinculadas por conta — chave única por user.id
       const storedLikes = JSON.parse(localStorage.getItem(likeKey) || '[]');
       setLikedProjectIds(storedLikes.map((p: any) => p.id));
     };
     loadAccount();

     const fetchProjects = async () => {
         const { data } = await supabase
            .from('projects')
            .select('*')
            .eq('show_in_gallery', true)
            .order('created_at', { ascending: false });
         
         setProjects(data || []);
         setLoading(false);
     };
     fetchProjects();

     // Listen to layout completion updates
     const handleProfileComplete = () => {
       getAccountStorageKey("store-profile-completed").then(key => setStoreProfileCompleted(localStorage.getItem(key) === "true" || localStorage.getItem("susanoo_store_profile_completed") === "true"));
     };
     window.addEventListener("profileCompletedChanged", handleProfileComplete);
     return () => window.removeEventListener("profileCompletedChanged", handleProfileComplete);
   }, []);

   const openProduct = (proj: any) => {
     setActiveProduct(proj);
     setFavorited(false);
     setLiked(false);
     setActiveTab("detalhes");
   };

   const handleAddToCart = (proj: any, e?: React.MouseEvent) => {
     e?.stopPropagation();
     addToCart({ id: proj.id, name: proj.name, price: proj.price || 49.90, cover_url: proj.cover_url });
     getAccountStorageKey("first-project").then(key => localStorage.setItem(key, "true"));
     setHasProjects(true);
   };

   const isInCart = (id: string) => items.some(i => i.id === id);

   const dismissOnboarding = async () => {
     localStorage.setItem(await getAccountStorageKey("onboarding-dismissed"), "true");
     setOnboardingDismissed(true);
   };

   const toggleFavorite = async (project: any) => {
     const { data: { session } } = await supabase.auth.getSession();
     const userId = session?.user?.id;

     const likeKey = await getAccountStorageKey("liked_projects");
     const stored = JSON.parse(localStorage.getItem(likeKey) || '[]');
     const exists = stored.find((p: any) => p.id === project.id);
     let newStored;
     if (exists) {
         newStored = stored.filter((p: any) => p.id !== project.id);
         if (userId) {
           await supabase.from('likes').delete().eq('user_id', userId).eq('project_id', project.id);
         }
     } else {
         newStored = [...stored, { id: project.id, name: project.name, cover_url: project.cover_url, deploy_url: project.deploy_url }];
         if (userId) {
           await supabase.from('likes').insert([{ user_id: userId, project_id: project.id }]);
         }
     }
     localStorage.setItem(likeKey, JSON.stringify(newStored));
     setLikedProjectIds(newStored.map((p: any) => p.id));
   };

   const markDevelopersExplored = async () => {
     localStorage.setItem(await getAccountStorageKey("explored-developers"), "true");
     setHasExploredDevelopers(true);
   };

   const markProjectsExplored = async () => {
     localStorage.setItem(await getAccountStorageKey("first-project"), "true");
     setHasProjects(true);
   };

   const filtered = projects.filter(proj => {
      const matchSearch = (proj.name || "").toLowerCase().includes(search.toLowerCase());
      return matchSearch;
   });

   // RENDER DEVELOPER DASHBOARD
   if (userType === "Desenvolvedor") {
     return (
       <div className="flex-1 overflow-y-auto w-full bg-background text-foreground transition-colors duration-300">
         <div className="flex items-center justify-between p-4 px-6 border-b border-surface-border bg-background/80 backdrop-blur-md sticky top-0 z-50">
           <h1 className="font-black text-lg text-foreground">Painel do Desenvolvedor</h1>
           <span className="text-xs font-black uppercase tracking-[0.2em] text-accent bg-accent/10 border border-accent/20 px-3 py-1.5 rounded-full">
             Modo Profissional
           </span>
         </div>

         <div className="w-full max-w-6xl mx-auto py-10 px-6 space-y-8">
           {/* Boas-vindas */}
           <div>
             <h2 className="text-3xl font-black tracking-tight mb-2">Bem-vindo de volta!</h2>
             <p className="text-foreground/50 text-sm font-medium">Acompanhe seu desempenho financeiro, projetos e reputação na plataforma.</p>
           </div>

           {/* Grid Métricas */}
           <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
             <div className="bg-surface border border-surface-border rounded-2xl p-6 shadow-sm">
               <div className="flex justify-between items-center mb-4">
                 <span className="text-xs font-black text-foreground/45 uppercase tracking-wider">Faturamento Total</span>
                 <DollarSign className="w-5 h-5 text-emerald-500" />
               </div>
               <p className="text-2xl font-black text-foreground">R$ 8.450,00</p>
               <span className="text-[10px] text-emerald-500 font-bold mt-1 block">✓ 100% liberado</span>
             </div>

             <div className="bg-surface border border-surface-border rounded-2xl p-6 shadow-sm">
               <div className="flex justify-between items-center mb-4">
                 <span className="text-xs font-black text-foreground/45 uppercase tracking-wider">Projetos Ativos</span>
                 <Briefcase className="w-5 h-5 text-accent" />
               </div>
               <p className="text-2xl font-black text-foreground">3 ativos</p>
               <span className="text-[10px] text-foreground/40 font-medium mt-1 block">Garantia Susanoo ativa</span>
             </div>

             <div className="bg-surface border border-surface-border rounded-2xl p-6 shadow-sm">
               <div className="flex justify-between items-center mb-4">
                 <span className="text-xs font-black text-foreground/45 uppercase tracking-wider">Clientes</span>
                 <User className="w-5 h-5 text-accent" />
               </div>
               <p className="text-2xl font-black text-foreground">5 atendidos</p>
               <span className="text-[10px] text-foreground/40 font-medium mt-1 block">Novos contatos via chat</span>
             </div>

             <div className="bg-surface border border-surface-border rounded-2xl p-6 shadow-sm">
               <div className="flex justify-between items-center mb-4">
                 <span className="text-xs font-black text-foreground/45 uppercase tracking-wider">Avaliação Média</span>
                 <Star className="w-5 h-5 text-amber-500 fill-amber-500" />
               </div>
               <p className="text-2xl font-black text-foreground">5.0 / 5.0</p>
               <span className="text-[10px] text-amber-500 font-bold mt-1 block">★ ★ ★ ★ ★ (12 avaliações)</span>
             </div>
           </div>

           {/* Lista de Projetos Recentes */}
           <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
             <div className="lg:col-span-2 bg-surface border border-surface-border rounded-2xl p-6">
               <h3 className="text-lg font-black mb-4">Projetos e Clientes Ativos</h3>
               <div className="space-y-4">
                 {[
                   { name: "E-Commerce de Calçados", client: "Loja Passos Inc.", status: "Em progresso", progress: 65 },
                   { name: "Landing Page Premium", client: "Doutor Silva Odonto", status: "Aguardando ajuste", progress: 90 },
                   { name: "Portal Institucional", client: "Consultoria X", status: "Concluído", progress: 100 }
                 ].map((p, idx) => (
                   <div key={idx} className="bg-background border border-surface-border rounded-xl p-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
                     <div>
                       <h4 className="font-bold text-sm text-foreground">{p.name}</h4>
                       <p className="text-xs text-foreground/50">Cliente: {p.client}</p>
                     </div>
                     <div className="flex items-center gap-4">
                       <span className={`text-[10px] font-black uppercase px-2.5 py-1 rounded ${p.progress === 100 ? 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20' : 'bg-accent/10 text-accent border border-accent/20'}`}>
                         {p.status}
                       </span>
                       <span className="text-xs font-black">{p.progress}%</span>
                     </div>
                   </div>
                 ))}
               </div>
             </div>

             <div className="bg-surface border border-surface-border rounded-2xl p-6 flex flex-col justify-between">
               <div>
                 <h3 className="text-lg font-black mb-2">Comunicação Direta</h3>
                 <p className="text-xs text-foreground/50 mb-6">Mantenha contato regular com os seus clientes no chat para evitar atrasos e alinhamentos incorretos.</p>
               </div>
               <button 
                 onClick={() => router.push("/dashboard/chat")}
                 className="w-full py-3.5 bg-accent hover:bg-accent/90 text-white font-black rounded-xl text-sm uppercase tracking-wider flex items-center justify-center gap-2 shadow-lg"
               >
                 <MessageCircle className="w-4 h-4" /> Ir para Chat com Clientes
               </button>
             </div>
           </div>
         </div>
       </div>
     );
   }

   // RENDER CLIENT DASHBOARD (MARKETPLACE)
   return (
       <div className="flex-1 overflow-y-auto w-full bg-background text-foreground transition-colors duration-300">
           {/* Header simples */}
           <div className="flex items-center justify-between p-4 px-6 border-b border-surface-border bg-background/80 backdrop-blur-md sticky top-0 z-50">
               <h1 className="font-black text-lg text-foreground">Marketplace</h1>
               <button
                 onClick={() => setIsCartOpen(true)}
                 className="relative flex items-center justify-center bg-accent text-white w-12 h-12 rounded-full hover:scale-105 transition-all cursor-pointer shadow-lg shadow-accent/20"
               >
                 <ShoppingCart className="w-5 h-5" />
                 {items.length > 0 && (
                   <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[10px] font-black w-5 h-5 rounded-full flex items-center justify-center border-2 border-background">{items.length}</span>
                 )}
               </button>
           </div>

           <div className="w-full max-w-[1600px] mx-auto py-10 px-6 space-y-8">
               {/* 1. Onboarding Natural de Primeiro Acesso (Passo 1, 2, 3) */}
               {(!onboardingDismissed && !(storeProfileCompleted && hasExploredDevelopers && hasProjects)) && (
                 <motion.div 
                   initial={{ opacity: 0, y: -10 }}
                   animate={{ opacity: 1, y: 0 }}
                   exit={{ opacity: 0, y: -10 }}
                   className="bg-accent/5 border border-accent/20 rounded-3xl p-6 relative overflow-hidden"
                 >
                   <button 
                     onClick={dismissOnboarding} 
                     className="absolute top-4 right-4 text-foreground/40 hover:text-foreground"
                   >
                     <X className="w-4 h-4" />
                   </button>
                   
                   <div className="max-w-3xl">
                     <span className="text-[10px] font-black uppercase tracking-[0.2em] text-accent mb-2 block">Primeiro Acesso</span>
                     <h2 className="text-2xl font-black text-foreground mb-2">Bem-vindo à Susanoo! Vamos preparar sua conta.</h2>
                     <p className="text-sm text-foreground/60 mb-6 font-medium">Siga estes 3 passos básicos para ter o melhor aproveitamento da nossa plataforma.</p>
                     
                     <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                       <Link href="/dashboard/profile" className={`bg-surface border hover:border-accent/30 p-4 rounded-2xl flex items-start gap-3 transition-colors ${storeProfileCompleted ? 'border-emerald-500/30' : 'border-surface-border'}`}>
                         <span className={`text-lg font-black w-8 h-8 rounded-xl flex items-center justify-center shrink-0 ${storeProfileCompleted ? 'text-white bg-emerald-500' : 'text-accent bg-accent/10'}`}>
                           {storeProfileCompleted ? <Check className="w-5 h-5" /> : "1"}
                         </span>
                         <div>
                           <h4 className="font-bold text-sm text-foreground">{storeProfileCompleted ? "Perfil Completo" : "Complete seu perfil"}</h4>
                           <p className="text-xs text-foreground/50 mt-1">Preencha sua Razão Social, CNPJ e CEP na aba de perfil.</p>
                         </div>
                       </Link>
                       <Link onClick={markDevelopersExplored} href="/dashboard/developers" className={`bg-surface border hover:border-accent/30 p-4 rounded-2xl flex items-start gap-3 transition-colors ${hasExploredDevelopers ? 'border-emerald-500/30' : 'border-surface-border'}`}>
                         <span className={`text-lg font-black w-8 h-8 rounded-xl flex items-center justify-center shrink-0 ${hasExploredDevelopers ? 'text-white bg-emerald-500' : 'text-accent bg-accent/10'}`}>
                           {hasExploredDevelopers ? <Check className="w-5 h-5" /> : "2"}
                         </span>
                         <div>
                           <h4 className="font-bold text-sm text-foreground">{hasExploredDevelopers ? "Profissionais Explorados" : "Encontre um profissional"}</h4>
                           <p className="text-xs text-foreground/50 mt-1">Compare perfis e encontre o profissional ideal para o seu projeto.</p>
                         </div>
                       </Link>
                       <Link onClick={markProjectsExplored} href="#templates-grid" className={`bg-surface border hover:border-accent/30 p-4 rounded-2xl flex items-start gap-3 transition-colors ${hasProjects ? 'border-emerald-500/30' : 'border-surface-border'}`}>
                         <span className={`text-lg font-black w-8 h-8 rounded-xl flex items-center justify-center shrink-0 ${hasProjects ? 'text-white bg-emerald-500' : 'text-accent bg-accent/10'}`}>
                           {hasProjects ? <Check className="w-5 h-5" /> : "3"}
                         </span>
                         <div>
                           <h4 className="font-bold text-sm text-foreground">{hasProjects ? "Projeto Iniciado" : "Comece seu projeto"}</h4>
                           <p className="text-xs text-foreground/50 mt-1">Explore os templates e contrate o desenvolvimento completo.</p>
                         </div>
                       </Link>
                     </div>
                   </div>
                 </motion.div>
               )}

               {/* 2. Checklist Progressiva para incentivar o cliente */}
               <div className="bg-surface border border-surface-border rounded-3xl p-6 shadow-sm">
                 <h3 className="text-base font-black uppercase tracking-wider text-foreground/70 mb-4">Seu Progresso de Configuração</h3>
                 <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                     {[
                     { label: "Perfil Preenchido", checked: storeProfileCompleted, link: "/dashboard/profile" },
                     { label: "Profissionais explorados", checked: hasExploredDevelopers, link: "/dashboard/developers" },
                     { label: "Explorar sites e templates", checked: hasProjects, link: "#templates-grid" }
                   ].map((item, idx) => (
                     <div 
                       key={idx} 
                       onClick={() => router.push(item.link)}
                       className={`border rounded-2xl p-4 flex items-center gap-3 cursor-pointer transition-all ${item.checked ? 'bg-emerald-500/5 border-emerald-500/20 text-emerald-600' : 'bg-background border-surface-border hover:border-foreground/20 text-foreground/60'}`}
                     >
                       <div className={`w-5 h-5 rounded-full border flex items-center justify-center shrink-0 ${item.checked ? 'bg-emerald-500 border-emerald-500 text-white' : 'border-surface-border'}`}>
                         {item.checked && <Check className="w-3.5 h-3.5" />}
                       </div>
                       <span className="text-xs font-bold">{item.label}</span>
                     </div>
                   ))}
                 </div>
               </div>

               {/* 3. Onboarding de Acompanhamento (Só aparece após ter projetos) */}
               {hasProjects && (
                 <div className="bg-gradient-to-r from-accent/10 to-transparent border border-accent/20 rounded-3xl p-6">
                   <h3 className="text-lg font-black mb-2 flex items-center gap-2">
                     <Sparkles className="w-5 h-5 text-accent" /> Projeto Ativo Detectado!
                   </h3>
                   <p className="text-sm text-foreground/60 mb-4 max-w-2xl">Use nossas ferramentas de acompanhamento para ver o andamento do seu site e se comunicar com o seu desenvolvedor.</p>
                   <div className="flex flex-wrap gap-3">
                     <button onClick={() => router.push("/dashboard/projects")} className="px-4 py-2 bg-foreground text-background font-bold text-xs rounded-xl uppercase tracking-wider hover:opacity-90">
                       Acompanhar seu projeto
                     </button>
                     <button onClick={() => router.push("/dashboard/chat")} className="px-4 py-2 bg-surface border border-surface-border font-bold text-xs rounded-xl uppercase tracking-wider text-foreground hover:border-accent/40">
                       Converse no Chat
                     </button>
                     <button onClick={() => router.push("/dashboard/timeline")} className="px-4 py-2 bg-surface border border-surface-border font-bold text-xs rounded-xl uppercase tracking-wider text-foreground hover:border-accent/40">
                       Veja o Cronograma
                     </button>
                   </div>
                 </div>
               )}

               {/* Barra de pesquisa */}
               <div id="templates-grid" className="relative">
                   <Search className="w-5 h-5 absolute left-5 top-1/2 -translate-y-1/2 text-foreground/30" />
                   <input 
                      type="text" 
                      value={search}
                      onChange={(e) => setSearch(e.target.value)}
                      placeholder="Buscar sites e templates..."
                      className="w-full bg-surface border border-surface-border rounded-2xl py-4 pl-14 pr-6 text-[15px] font-medium text-foreground focus:border-accent/50 focus:outline-none transition-all placeholder:text-foreground/30"
                   />
               </div>

               {/* Abas Por Susanoo / Comunidade */}
               <div className="flex gap-2">
                   {["Susanoo", "Geral"].map(mode => (
                     <button
                       key={mode}
                       onClick={() => setMainMode(mode as MainMode)}
                       className={`px-5 py-2 rounded-xl text-sm font-bold transition-all ${mainMode === mode ? 'bg-accent text-white shadow-lg shadow-accent/20' : 'bg-surface border border-surface-border text-foreground/60 hover:text-foreground'}`}
                     >
                       {mode === "Susanoo" ? "Por Susanoo" : "Comunidade"}
                     </button>
                   ))}
               </div>

               {/* Grade de produtos (4 a 5 por linha no desktop) */}
               {loading ? (
                 <div className="flex items-center justify-center py-20">
                   <div className="w-8 h-8 border-2 border-surface-border border-t-accent rounded-full animate-spin" />
                 </div>
               ) : (
               <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
                   <AnimatePresence mode="popLayout">
                   {filtered.length > 0 ? filtered.map((proj, i) => {
                        const isTemplate = proj.category?.toLowerCase().includes("template") || !proj.category;
                        return (
                        <motion.div 
                            key={proj.id}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0 }}
                            transition={{ delay: i * 0.04 }}
                            className="group bg-surface border border-surface-border rounded-2xl overflow-hidden hover:border-accent/30 hover:shadow-xl transition-all duration-300 flex flex-col"
                        >
                            {/* Imagem com botão de hover (apenas Ver Site) */}
                            <div
                              className="aspect-[16/10] w-full bg-background relative overflow-hidden cursor-pointer"
                              onClick={() => openProduct(proj)}
                            >
                                {proj.cover_url ? (
                                    <img src={proj.cover_url} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" alt={proj.name} />
                                ) : (
                                    <div className="absolute inset-0 flex items-center justify-center text-4xl font-black text-foreground/10 uppercase tracking-tighter italic">
                                       {(proj.name || "PRJ").substring(0,3)}
                                    </div>
                                )}
                                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center p-4">
                                   <span className="bg-white text-black px-5 py-2.5 rounded-xl font-bold text-sm shadow-lg transform translate-y-2 group-hover:translate-y-0 transition-all duration-300">
                                     Ver Site
                                   </span>
                                </div>
                            </div>
                            
                            {/* Info do card */}
                            <div className="p-4 flex flex-col flex-1 justify-between">
                               <div>
                                   <div className="flex items-center gap-1.5 mb-2">
                                       <span className={`text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded ${isTemplate ? 'bg-blue-500/10 text-blue-500 border border-blue-500/20' : 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20'}`}>
                                         {isTemplate ? 'Template' : 'Site Pronto'}
                                       </span>
                                   </div>
                                   <h4 className="font-bold text-sm md:text-base text-foreground truncate cursor-pointer" onClick={() => openProduct(proj)}>{proj.name}</h4>
                                   <p className="text-xs text-foreground/50 mt-0.5">{mainMode === "Susanoo" ? "Por Susanoo" : "Dev Independente"}</p>
                               </div>
                               
                               <div className="mt-4">
                                   <div className="flex items-center justify-between mb-3">
                                       <span className="text-accent font-black text-sm">R$ {(proj.price || 49.90).toFixed(2)}</span>
                                       <div className="flex gap-2 z-10">
                                           <button 
                                                onClick={(e) => { e.stopPropagation(); toggleFavorite(proj); }}
                                                className="px-2 py-1 rounded-full text-[10px] font-black flex items-center gap-1 hover:text-red-500 transition-colors"
                                           >
                                               <Heart className={`w-3.5 h-3.5 ${likedProjectIds.includes(proj.id) ? 'fill-red-500 text-red-500' : 'text-foreground/40'}`} />
                                           </button>
                                           <div className="flex items-center gap-1">
                                               <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
                                               <span className="text-xs text-foreground/40 font-bold">5.0</span>
                                           </div>
                                       </div>
                                   </div>
                                   <button
                                     onClick={(e) => handleAddToCart(proj, e)}
                                     className={`w-full py-2.5 rounded-xl font-bold text-xs uppercase tracking-wider transition-all cursor-pointer ${isInCart(proj.id) ? 'bg-emerald-500/10 text-emerald-600 border border-emerald-500/30' : 'bg-accent text-white hover:bg-accent/90'}`}
                                   >
                                     {isInCart(proj.id) ? "✓ No Carrinho" : "Adicionar"}
                                   </button>
                               </div>
                            </div>
                        </motion.div>
                   )}) : (
                        <motion.div initial={{opacity:0}} animate={{opacity:1}} className="col-span-full py-20 text-center">
                            <div className="inline-flex p-5 rounded-full bg-surface border border-surface-border mb-4">
                                <Search className="w-8 h-8 text-foreground/20" />
                            </div>
                            <h3 className="text-base font-bold text-foreground/40">Nenhum resultado encontrado.</h3>
                            <p className="text-sm text-foreground/30 mt-1">Tente um termo diferente na busca.</p>
                        </motion.div>
                   )}
                   </AnimatePresence>
               </div>
               )}
           </div>

           {/* Modal / Página Dedicada do Produto */}
           <AnimatePresence>
               {activeProduct && (
                   <motion.div 
                       initial={{ opacity: 0 }} 
                       animate={{ opacity: 1 }} 
                       exit={{ opacity: 0 }} 
                       className="fixed inset-0 bg-background/95 z-[999] flex items-center justify-center p-0 md:p-6 overflow-hidden"
                       onClick={(e) => e.target === e.currentTarget && setActiveProduct(null)}
                   >
                       <motion.div 
                           initial={{ y: "100%", opacity: 0 }}
                           animate={{ y: 0, opacity: 1 }}
                           exit={{ y: "100%", opacity: 0 }}
                           transition={{ type: "spring", damping: 30, stiffness: 200 }}
                           className="bg-background border-t md:border border-surface-border w-full max-w-[92vw] xl:max-w-7xl h-full md:h-[88vh] rounded-t-3xl md:rounded-3xl shadow-2xl overflow-hidden flex flex-col relative"
                       >
                           {/* Header da Página Dedicada */}
                           <div className="flex items-center justify-between p-4 px-6 border-b border-surface-border bg-surface/50 backdrop-blur-md shrink-0">
                               <button 
                                   onClick={() => setActiveProduct(null)} 
                                   className="flex items-center gap-2 text-foreground/60 hover:text-foreground font-bold text-sm transition-all"
                               >
                                   <ArrowLeft className="w-4 h-4" /> Voltar ao Marketplace
                               </button>
                               <div className="flex items-center gap-2">
                                  <span className={`text-[10px] font-black uppercase tracking-wider px-3 py-1 rounded-full ${activeProduct.category?.toLowerCase().includes("template") || !activeProduct.category ? 'bg-blue-500/10 text-blue-500 border border-blue-500/20' : 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20'}`}>
                                    {activeProduct.category?.toLowerCase().includes("template") || !activeProduct.category ? 'Template' : 'Site Pronto'}
                                  </span>
                               </div>
                           </div>

                           {/* Conteúdo de 2 Colunas */}
                           <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 overflow-hidden h-full">
                               {/* Esquerda: Conteúdo Visual e Abas (Rolável) */}
                               <div className="lg:col-span-8 bg-surface/30 flex flex-col h-full overflow-y-auto custom-scrollbar border-b lg:border-b-0 lg:border-r border-surface-border">
                                   <div className="p-6">
                                       <div className="aspect-[16/9] w-full rounded-2xl overflow-hidden bg-background border border-surface-border relative shadow-inner">
                                           {activeProduct.video_url ? (
                                               <video src={activeProduct.video_url} controls autoPlay muted loop className="w-full h-full object-cover" />
                                           ) : activeProduct.cover_url ? (
                                               <img src={activeProduct.cover_url} className="w-full h-full object-cover" alt={activeProduct.name} />
                                           ) : (
                                               <div className="absolute inset-0 flex items-center justify-center text-7xl font-black text-foreground/5 uppercase italic tracking-tighter">
                                                   {(activeProduct.name || "PRJ").substring(0,3)}
                                               </div>
                                           )}
                                       </div>
                                   </div>

                                   {/* Abas */}
                                   <div className="flex border-b border-surface-border px-6 sticky top-0 bg-background/80 backdrop-blur-md z-10">
                                       {[
                                         { key: "detalhes", label: "Descrição" },
                                         { key: "especificacoes", label: "Especificações" },
                                         { key: "comentarios", label: "Avaliações" },
                                       ].map(tab => (
                                         <button
                                           key={tab.key}
                                           onClick={() => setActiveTab(tab.key as any)}
                                           className={`px-4 py-4 text-sm font-black uppercase tracking-wider transition-all border-b-2 -mb-px ${activeTab === tab.key ? 'border-accent text-accent' : 'border-transparent text-foreground/50 hover:text-foreground'}`}
                                         >
                                           {tab.label}
                                         </button>
                                       ))}
                                   </div>

                                   <div className="p-6 flex-1">
                                       {activeTab === "detalhes" && (
                                           <div className="prose max-w-none">
                                               <p className="text-foreground/75 text-base leading-relaxed whitespace-pre-line">
                                                   {activeProduct.description || "Este template/website premium foi desenvolvido pela equipe de engenharia da Susanoo. Totalmente responsivo, otimizado para SEO do Google e com excelente performance. Perfeito para comércios locais, landing pages profissionais ou portfólios que exigem o máximo de qualidade estética e técnica."}
                                               </p>
                                           </div>
                                       )}
                                       {activeTab === "especificacoes" && (
                                           <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                               {[
                                                   { label: "Performance Lighthouse", val: "98/100 ou superior" },
                                                   { label: "Tecnologia Principal", val: "Next.js 16 & React 19" },
                                                   { label: "Bibliotecas CSS", val: "TailwindCSS v4" },
                                                   { label: "Integração Backend", val: "Supabase & Supabase Auth" },
                                                   { label: "Responsividade", val: "Mobile, Tablet e Desktop" },
                                                   { label: "Suporte Técnico", val: "Dúvidas e deploys por 7 dias" },
                                               ].map((s, i) => (
                                                   <div key={i} className="bg-surface border border-surface-border rounded-2xl p-4 flex flex-col justify-center">
                                                       <p className="text-xs font-black text-foreground/40 uppercase tracking-wider mb-1">{s.label}</p>
                                                       <p className="text-sm font-bold text-foreground">{s.val}</p>
                                                   </div>
                                               ))}
                                           </div>
                                       )}
                                       {activeTab === "comentarios" && (
                                           <div className="flex flex-col gap-4">
                                               {[
                                                 { nome: "Ana Lima", nota: 5, data: "há 2 semanas", texto: "Site extremamente leve e bonito. Meus clientes adoraram a rapidez do carregamento." },
                                                 { nome: "Carlos Mendes", nota: 5, data: "há 1 mês", texto: "Facilitou muito o andamento do meu negócio. O suporte inicial me ajudou a publicar sem complicações." },
                                               ].map((c, i) => (
                                                 <div key={i} className="bg-surface border border-surface-border rounded-2xl p-5">
                                                   <div className="flex items-center justify-between mb-3">
                                                     <div>
                                                       <span className="font-bold text-sm text-foreground block">{c.nome}</span>
                                                       <span className="text-[10px] text-foreground/40">{c.data}</span>
                                                     </div>
                                                     <div className="flex gap-0.5">{[...Array(c.nota)].map((_, s) => <Star key={s} className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />)}</div>
                                                   </div>
                                                   <p className="text-sm text-foreground/75 leading-relaxed">{c.texto}</p>
                                                 </div>
                                               ))}
                                               <div className="flex items-center justify-center gap-4 pt-4 border-t border-surface-border">
                                                 <button onClick={() => setLiked(!liked)} className={`flex items-center gap-2 text-sm font-black uppercase tracking-wider transition-colors ${liked ? 'text-accent' : 'text-foreground/40 hover:text-foreground'}`}>
                                                   <ThumbsUp className={`w-4 h-4 ${liked ? 'fill-accent' : ''}`} /> {liked ? 'Útil (43)' : 'Marcar como útil (42)'}
                                                 </button>
                                               </div>
                                           </div>
                                       )}
                                   </div>
                               </div>

                               {/* Direita: Compra e Ações (Fixo/Rolável) */}
                               <div className="lg:col-span-4 p-8 bg-background flex flex-col justify-between h-full overflow-y-auto custom-scrollbar">
                                   <div className="flex flex-col gap-6">
                                       <div>
                                           <div className="flex items-start justify-between gap-4 mb-2">
                                               <h2 className="text-3xl font-black tracking-tight text-foreground leading-tight">{activeProduct.name}</h2>
                                               <button 
                                                   onClick={() => toggleFavorite(activeProduct)}
                                                   className={`p-2.5 rounded-full border transition-all shrink-0 cursor-pointer ${likedProjectIds.includes(activeProduct.id) ? 'bg-red-500/10 border-red-500/30 text-red-500' : 'bg-surface border-surface-border text-foreground/40 hover:text-red-400'}`}
                                               >
                                                   <Heart className={`w-5 h-5 ${likedProjectIds.includes(activeProduct.id) ? 'fill-red-500' : ''}`} />
                                               </button>
                                           </div>
                                           <div className="flex items-center gap-2">
                                               <div className="flex gap-0.5">{[1,2,3,4,5].map(s => <Star key={s} className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />)}</div>
                                               <span className="text-xs text-foreground/50 font-bold">5.0 (42 avaliações)</span>
                                           </div>
                                       </div>

                                       <div className="bg-surface border border-surface-border rounded-2xl p-5">
                                           <p className="text-[10px] text-foreground/40 font-black uppercase tracking-widest mb-1.5">Preço Único</p>
                                           <p className="text-4xl font-black text-foreground">R$ {(activeProduct.price || 49.90).toFixed(2).replace('.', ',')}</p>
                                           <p className="text-xs text-emerald-500 font-bold mt-1.5 flex items-center gap-1.5">
                                               <Zap className="w-3.5 h-3.5 fill-current" /> Acesso imediato no e-mail
                                           </p>
                                            <div className="flex flex-col gap-3.5 bg-surface/50 border border-surface-border rounded-2xl p-4 text-sm text-foreground/75 mt-4">
                                              <div className="flex items-center gap-3">
                                                <Zap className="w-4 h-4 text-accent shrink-0" />
                                                <span>Código-fonte completo</span>
                                              </div>
                                              <div className="flex items-center gap-3">
                                                <Shield className="w-4 h-4 text-accent shrink-0" />
                                                <span>Compra 100% Garantida por 7 dias</span>
                                              </div>
                                            </div>
                                       </div>

                                       <div className="flex flex-col gap-3 mt-8 lg:mt-0 pt-6 border-t border-surface-border">
                                            <button 
                                                onClick={() => { handleAddToCart(activeProduct); setActiveProduct(null); }}
                                                className="w-full py-4.5 bg-accent text-white font-black rounded-xl hover:bg-accent/90 hover:scale-[1.02] active:scale-[0.98] transition-all shadow-xl shadow-accent/20 flex items-center justify-center gap-2 text-sm uppercase tracking-wider"
                                            >
                                                <ShoppingBag className="w-5 h-5" /> Adquirir Agora
                                            </button>
                                            <button 
                                                onClick={(e) => handleAddToCart(activeProduct, e)}
                                                className={`w-full py-4.5 font-black rounded-xl transition-all cursor-pointer flex items-center justify-center gap-2 border text-sm uppercase tracking-wider ${isInCart(activeProduct.id) ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-600' : 'bg-surface border-surface-border text-foreground hover:border-accent/40 hover:bg-surface-border/50'}`}
                                            >
                                                {isInCart(activeProduct.id) ? <><Check className="w-4 h-4" /> No Carrinho</> : <><ShoppingCart className="w-4 h-4" /> Adicionar ao Carrinho</>}
                                            </button>
                                            <button 
                                                onClick={() => router.push(`/preview/${activeProduct.id}`)}
                                                className="w-full py-4.5 bg-surface border border-surface-border hover:border-foreground/20 text-foreground font-black rounded-xl hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-2 text-sm uppercase tracking-wider cursor-pointer"
                                            >
                                                <ExternalLink className="w-4 h-4" /> Prévia Ao Vivo
                                            </button>
                                            {activeProduct.deploy_url && (
                                              <a href={activeProduct.deploy_url.startsWith('http') ? activeProduct.deploy_url : `https://${activeProduct.deploy_url}`} target="_blank" rel="noreferrer" className="w-full py-3.5 font-bold text-xs uppercase tracking-wider rounded-xl transition-all flex items-center justify-center gap-2 text-foreground/50 hover:text-foreground">
                                                <ExternalLink className="w-4 h-4" /> Ver demonstração do site
                                              </a>
                                            )}
                                       </div>
                                   </div>
                               </div>
                           </div>
                       </motion.div>
                   </motion.div>
               )}
           </AnimatePresence>
       </div>
   );
}
