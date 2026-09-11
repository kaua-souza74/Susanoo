"use client";
import { useEffect, useState, useRef, useMemo, Suspense } from "react";
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
  ArrowLeft,
  User,
  MessageCircle,
  Calendar,
  CheckCircle2,
  Code2,
  Plus,
  ChevronDown
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { supabase } from "@/lib/supabase";
import { useCart } from "@/components/CartContext";
import { DevComposedChart } from "@/components/DevComposedChart";
import { ALL_COMMERCE_TYPES, matchProjectCommerceType } from "@/lib/commerceCategories";
import { ClientInterestSurveyModal } from "@/components/ClientInterestSurveyModal";
import { useRouter, useSearchParams } from "next/navigation";
import { getAuthenticatedAccountType, getAccountStorageKey, hasCompletedClientProfile } from "@/lib/account";
import { ReviewsSection } from "@/components/ReviewsSection";
import { DashboardHeaderActions } from "@/components/DashboardHeaderActions";

const normalizeSearchValue = (value: unknown) =>
  String(value ?? "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/\s+/g, " ")
    .trim();

const getProjectPrice = (value: unknown) => {
  const price = Number(value);
  return Number.isFinite(price) ? price : 0;
};

function DiscoverHomeContent() {
   const router = useRouter();
   const searchParams = useSearchParams();
   const [userType, setUserType] = useState<"Comércio" | "Desenvolvedor">("Comércio");
   const [selectedType, setSelectedType] = useState<string>("all");
   const [selectedOrigin, setSelectedOrigin] = useState<string>("all");
   const [isTypeMenuOpen, setIsTypeMenuOpen] = useState(false);
   const [typeSearch, setTypeSearch] = useState("");
   const typeMenuRef = useRef<HTMLDivElement>(null);
   const [search, setSearch] = useState("");
   const [projects, setProjects] = useState<any[]>([]);
   const [devProjects, setDevProjects] = useState<any[]>([]);
   const [devRevenue, setDevRevenue] = useState(0);
   const [devRating, setDevRating] = useState(5.0);
   const [devReviewCount, setDevReviewCount] = useState(0);
   const [clientInterests, setClientInterests] = useState<any[]>([]);
   const [productViewsCount, setProductViewsCount] = useState(0);
   const [loading, setLoading] = useState(true);
   const [toastMsg, setToastMsg] = useState<string | null>(null);
   const [activeProduct, setActiveProduct] = useState<any | null>(null);
   const [activeTab, setActiveTab] = useState<"detalhes" | "especificacoes" | "comentarios">("detalhes");
   const [likedProjectIds, setLikedProjectIds] = useState<string[]>([]);
   const [purchasedProjects, setPurchasedProjects] = useState<any[]>([]);

   const { addToCart, items } = useCart();

   const isPurchased = (proj: any) => {
     if (!proj) return false;
     return purchasedProjects.some(p => 
       (p.id === proj.id) || 
       (p.name && proj.name && p.name.trim().toLowerCase() === proj.name.trim().toLowerCase())
     );
   };

   useEffect(() => {
     const loadAccount = async () => {
       try {
         setUserType(await getAuthenticatedAccountType());
         const { data: { session } } = await supabase.auth.getSession();
         const userId = session?.user?.id;

         let userPurchasesList: any[] = [];
         if (userId) {
           try {
             const { data: userPurchases } = await supabase
               .from('projects')
               .select('id, name')
               .eq('client_id', userId);
              userPurchasesList = userPurchases || [];
              setPurchasedProjects(userPurchasesList);
           } catch (e) {
             console.error("Erro ao carregar compras do usuário:", e);
           }
         }

          const likeKey = await getAccountStorageKey("liked_projects");
         
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
        } catch (error) {
          console.error("Erro ao carregar a conta:", error);
        }
     };
     loadAccount();

     const fetchProjects = async () => {
          try {
            const { data: { session } } = await supabase.auth.getSession();
            const currentUserId = session?.user?.id;

            const { data: allProjects, error } = await supabase
               .from('projects')
               .select('*')
               .order('created_at', { ascending: false });
            
            if (!error && allProjects) {
              const galleryProjects = allProjects.filter((p: any) => p.show_in_gallery !== false);
              setProjects(galleryProjects);

              // Para o desenvolvedor: se houver projetos atribuídos a ele, filtra por developer_id
              const myDevProjects = currentUserId 
                ? allProjects.filter((p: any) => p.developer_id === currentUserId)
                : [];
              const finalDevProjects = myDevProjects.length > 0 ? myDevProjects : allProjects;
              setDevProjects(finalDevProjects);

              const totalRev = finalDevProjects.reduce((sum: number, p: any) => sum + (Number(p.price) || 0), 0);
              setDevRevenue(totalRev);
            } else {
              setProjects([]);
              setDevProjects([]);
            }

            // Busca de reviews reais
            const { data: revData } = await supabase.from('reviews').select('rating');
            if (revData && revData.length > 0) {
              const avg = revData.reduce((acc: number, r: any) => acc + (Number(r.rating) || 5), 0) / revData.length;
              setDevRating(Number(avg.toFixed(1)));
              setDevReviewCount(revData.length);
            }

           // Busca de interesses e preferências de clientes reais
           const { data: interestsData } = await supabase
             .from('client_interests')
             .select('*')
             .order('created_at', { ascending: false });
           if (interestsData) {
             setClientInterests(interestsData);
           }
         } catch (err) {
           console.error("Erro ao buscar dados do Supabase:", err);
         } finally {
           setLoading(false);
         }
     };
     fetchProjects();

     // Escuta em tempo real para novos sites adicionados/publicados no banco
     const channel = supabase.channel(`marketplace-projects-realtime-${crypto.randomUUID()}`)
       .on('postgres_changes', { event: '*', schema: 'public', table: 'projects' }, () => {
         fetchProjects();
       })
       .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
   }, []);

   const openProduct = (proj: any) => {
     setActiveProduct(proj);
     setProductViewsCount(prev => prev + 1);
     setActiveTab("detalhes");
   };

   const handleAddToCart = async (proj: any, e?: React.MouseEvent) => {
     e?.stopPropagation();
     if (userType === "Comércio" && !(await hasCompletedClientProfile())) {
       sessionStorage.setItem("susanoo_flash_toast", "Complete os dados essenciais do perfil para continuar com a compra.");
       setActiveProduct(null);
       router.push("/dashboard/profile?intent=purchase");
       return;
     }
     addToCart({ id: proj.id, name: proj.name, price: getProjectPrice(proj.price), cover_url: proj.cover_url });
   };

   const isInCart = (id: string) => items.some(i => i.id === id);

   const toggleFavorite = async (project: any) => {
      const { data: { session } } = await supabase.auth.getSession();
      const userId = session?.user?.id;

      if (!userId) {
        setToastMsg("Você precisa estar logado para curtir!");
        setTimeout(() => setToastMsg(null), 3000);
        return;
      }

      const likeKey = await getAccountStorageKey("liked_projects");
      const stored = JSON.parse(localStorage.getItem(likeKey) || '[]');
      const exists = stored.find((p: any) => p.id === project.id);
      let newStored;
      
      try {
        if (exists) {
            newStored = stored.filter((p: any) => p.id !== project.id);
            await supabase.from('likes').delete().eq('user_id', userId).eq('project_id', project.id);
            setToastMsg(`"${project.name}" removido dos favoritos.`);
        } else {
            newStored = [...stored, { id: project.id, name: project.name, cover_url: project.cover_url, deploy_url: project.deploy_url }];
            await supabase.from('likes').insert([{ user_id: userId, project_id: project.id }]);
            setToastMsg(`"${project.name}" adicionado aos favoritos!`);
        }
        localStorage.setItem(likeKey, JSON.stringify(newStored));
        setLikedProjectIds(newStored.map((p: any) => p.id));
      } catch (err) {
        console.error("Erro ao favoritar:", err);
        setToastMsg("Erro ao atualizar favorito.");
      }
      
      setTimeout(() => setToastMsg(null), 3000);
    };

    useEffect(() => {
      if (!loading && projects.length > 0) {
        const prodId = searchParams.get('productId');
        if (prodId) {
          const found = projects.find(p => p.id === prodId);
          if (found) {
            openProduct(found);
          }
        }
      }
    }, [loading, projects, searchParams]);

    // Fechar menu de tipos ao clicar fora
    useEffect(() => {
      const handleClickOutside = (event: MouseEvent) => {
        if (typeMenuRef.current && !typeMenuRef.current.contains(event.target as Node)) {
          setIsTypeMenuOpen(false);
        }
      };
      document.addEventListener("mousedown", handleClickOutside);
      return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    const calculateAvgDeliveryDays = (projs: any[]) => {
      const delivered = projs.filter(p => p.status === 'published' && p.created_at && p.updated_at);
      if (delivered.length === 0) return null;
      let totalDays = 0;
      delivered.forEach(p => {
        const start = new Date(p.created_at).getTime();
        const end = new Date(p.updated_at).getTime();
        const days = Math.max(1, Math.round((end - start) / (1000 * 60 * 60 * 24)));
        totalDays += days;
      });
      const avg = totalDays / delivered.length;
      return `${avg.toFixed(1)} dias`;
    };

    const devChartData = useMemo(() => {
      if (!devProjects || devProjects.length === 0) return undefined;
      const today = new Date();
      const points: any[] = [];
      for (let i = 14; i >= 0; i--) {
        const d = new Date(today);
        d.setDate(d.getDate() - i);
        const dStr = d.toISOString().split("T")[0];
        const dayStr = d.getDate().toString().padStart(2, "0");
        const monthStr = d.toLocaleDateString("pt-BR", { month: "short" }).replace(".", "");
        
        const dayProjs = devProjects.filter(p => p.created_at && p.created_at.startsWith(dStr));
        const dayRev = dayProjs.reduce((sum, p) => sum + (Number(p.price) || 0), 0);
        
        points.push({
          date: dStr,
          label: `${dayStr} ${monthStr}`,
          units: dayProjs.length,
          revenue: dayRev,
          runRate: dayRev * 1.15,
        });
      }
      return points;
    }, [devProjects]);

    const getTypeCount = (typeKey: string) => {
      if (typeKey === "all") return projects.length;
      return projects.filter(p => matchProjectCommerceType(p, typeKey)).length;
    };

    const getOriginCount = (originKey: string) => {
      if (originKey === "all") return projects.length;
      return projects.filter(p => {
        const isSusanoo = p.is_official === true || p.created_by_susanoo === true || !p.developer_id;
        if (originKey === "susanoo") return isSusanoo;
        if (originKey === "comunidade") return !isSusanoo;
        return true;
      }).length;
    };

    const getProjectTags = (proj: any) => {
      if (Array.isArray(proj.technologies) && proj.technologies.length > 0) {
        return proj.technologies.slice(0, 3).map((t: string) => t.toLowerCase());
      }
      const tags: string[] = [];
      const cat = (proj.category || "").toLowerCase();
      const name = (proj.name || "").toLowerCase();
      const full = `${name} ${cat}`;
      
      if (full.includes("barb")) tags.push("barbearia", "agendamento");
      else if (full.includes("confeit") || full.includes("doce")) tags.push("confeitaria", "cardápio");
      else if (full.includes("hamburg") || full.includes("burger")) tags.push("hamburgueria", "delivery");
      else if (full.includes("pizza")) tags.push("pizzaria", "pedidos");
      else if (full.includes("restauran")) tags.push("restaurante", "reservas");
      else if (full.includes("estétic") || full.includes("beleza")) tags.push("estética", "horários");
      else if (full.includes("loja") || full.includes("comércio")) tags.push("e-commerce", "produtos");
      else tags.push("comércio local", "site pronto");
      
      tags.push("mobile");
      return tags.slice(0, 3);
    };

    const normalizedSearch = normalizeSearchValue(search);
    const filtered = projects.filter(proj => {
       const searchableValues = [
         proj.name,
         proj.category,
         proj.description,
         proj.author_name,
         proj.developer_name,
         ...(Array.isArray(proj.technologies) ? proj.technologies : []),
         ...(Array.isArray(proj.tags) ? proj.tags : proj.tags ? [proj.tags] : []),
         ...getProjectTags(proj),
       ];
       const matchSearch = !normalizedSearch || searchableValues.some((value) => normalizeSearchValue(value).includes(normalizedSearch));
       
       const isSusanoo = proj.is_official === true || proj.created_by_susanoo === true || !proj.developer_id;
       let matchOrigin = true;
       if (selectedOrigin === "susanoo") matchOrigin = isSusanoo;
       if (selectedOrigin === "comunidade") matchOrigin = !isSusanoo;

       const matchType = matchProjectCommerceType(proj, selectedType);

       return matchSearch && matchOrigin && matchType;
    });
   // RENDER DEVELOPER DASHBOARD - CLEAN & MINIMALIST
   if (userType === "Desenvolvedor") {
     return (
       <div className="custom-scrollbar flex-1 overflow-y-auto bg-background text-foreground">
         <div className="sticky top-0 z-50 flex items-center justify-between gap-3 bg-background/78 px-4 py-3 shadow-[0_10px_30px_rgba(15,23,42,0.035)] backdrop-blur-xl sm:px-6 sm:py-4 md:px-10 dark:shadow-black/10">
           <div>
             <span className="text-[10px] font-black uppercase tracking-[0.2em] text-accent">Workspace</span>
             <h1 className="text-lg font-black tracking-tight text-foreground">Painel do Desenvolvedor</h1>
           </div>
           <div className="flex items-center gap-2">
             <button 
               onClick={() => router.push("/dashboard/chat")}
               className="hidden h-11 items-center gap-2 rounded-2xl bg-foreground px-4 text-xs font-black text-background transition-all hover:-translate-y-0.5 sm:flex"
             >
               <MessageCircle className="w-3.5 h-3.5" /> Mensagens
             </button>
           </div>
         </div>

         <div className="mx-auto w-full max-w-[1440px] space-y-6 px-4 py-6 pb-24 sm:px-6 sm:py-8 md:px-10">
           {/* Boas-vindas simples */}
           <div>
             <h2 className="text-3xl font-black uppercase italic tracking-[-0.045em] text-foreground">Visão Geral</h2>
             <p className="text-foreground/50 text-sm mt-0.5">
               Acompanhe suas entregas, faturamento e solicitações de clientes.
             </p>
           </div>

           {/* Cards de Métricas Minimalistas 100% Conectados ao Banco */}
           <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
             <div className="rounded-3xl bg-surface p-6 shadow-[0_18px_50px_rgba(15,23,42,0.06)] ring-1 ring-foreground/7 dark:shadow-black/20">
               <span className="text-xs font-semibold text-foreground/50 block mb-1">Faturamento Acumulado</span>
               <p className="text-2xl font-black text-foreground">
                 {devRevenue > 0 
                   ? `R$ ${devRevenue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}` 
                   : "R$ 0,00"}
               </p>
               <span className={`text-[11px] font-semibold mt-1 block ${devRevenue > 0 ? 'text-emerald-600' : 'text-foreground/40'}`}>
                 {devRevenue > 0 ? "Disponível na conta" : "Nenhum faturamento registrado"}
               </span>
             </div>

             <div className="rounded-3xl bg-surface p-6 shadow-[0_18px_50px_rgba(15,23,42,0.06)] ring-1 ring-foreground/7 dark:shadow-black/20">
               <span className="text-xs font-semibold text-foreground/50 block mb-1">Projetos em Andamento</span>
               <p className="text-2xl font-black text-foreground">
                 {devProjects.length} {devProjects.length === 1 ? 'projeto' : 'projetos'}
               </p>
               <span className="text-[11px] text-foreground/40 font-medium mt-1 block">
                 {devProjects.length > 0 ? "Sincronizado com o catálogo" : "Nenhum projeto ativo"}
               </span>
             </div>

             <div className="rounded-3xl bg-surface p-6 shadow-[0_18px_50px_rgba(15,23,42,0.06)] ring-1 ring-foreground/7 dark:shadow-black/20">
                <span className="text-xs font-semibold text-foreground/50 block mb-1">Tempo Médio de Entrega</span>
                <p className="text-2xl font-black text-foreground">
                  {calculateAvgDeliveryDays(devProjects) || "—"}
                </p>
                <span className="text-[11px] text-foreground/40 font-medium mt-1 block">
                  {calculateAvgDeliveryDays(devProjects) ? "Calculado a partir do histórico" : "Calculado após a 1ª entrega"}
                </span>
              </div>

              <div className="rounded-3xl bg-surface p-6 shadow-[0_18px_50px_rgba(15,23,42,0.06)] ring-1 ring-foreground/7 dark:shadow-black/20">
                <span className="text-xs font-semibold text-foreground/50 block mb-1">Avaliação dos Clientes</span>
                <p className="text-2xl font-black text-foreground">
                  {devReviewCount > 0 ? `${devRating.toFixed(1)} ★` : "—"}
                </p>
                <span className="text-[11px] font-semibold mt-1 block text-foreground/40">
                  {devReviewCount > 0 ? `${devReviewCount} avaliações reais` : "Nenhuma avaliação recebida"}
                </span>
              </div>
            </div>

            {/* Gráfico Minimalista Composed Conectado ao Banco */}
            <DevComposedChart customData={devChartData} />

           {/* Seção de Tecnologias & Segmentos Conectados ao Banco */}
           <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
             
             {/* Segmentos Mais Procurados (Agro, Barbearia, Confeitaria, etc.) */}
             <div className="rounded-3xl bg-surface p-6 shadow-[0_18px_50px_rgba(15,23,42,0.055)] ring-1 ring-foreground/7 dark:shadow-black/20">
               <div className="mb-5 pb-3 border-b border-surface-border">
                 <div className="flex items-center justify-between">
                   <h3 className="text-sm font-bold text-foreground">Segmentos Mais Procurados</h3>
                   <span className="text-[10px] font-bold text-accent bg-accent/10 px-2 py-0.5 rounded">
                     {clientInterests.length > 0 ? `${clientInterests.length} respostas registradas` : "0 pesquisas"}
                   </span>
                 </div>
                 <p className="text-xs text-foreground/50 mt-0.5">Nichos com maior volume de buscas pelos clientes no marketplace</p>
               </div>

               {clientInterests.length === 0 ? (
                 <div className="py-10 px-4 text-center flex flex-col items-center justify-center gap-2 bg-background/50 rounded-xl border border-dashed border-surface-border">
                   <p className="text-xs font-bold text-foreground">Aguardando pesquisas de clientes</p>
                   <p className="text-[11px] text-foreground/50 max-w-xs leading-relaxed">
                     Assim que clientes responderem ao questionário da vitrine, a demanda por nichos (Agro, Barbearia, Confeitaria, etc.) será calculada aqui em tempo real.
                   </p>
                 </div>
               ) : (
                 <div className="space-y-3.5">
                   {(() => {
                     const counts: Record<string, number> = {};
                     clientInterests.forEach(ci => {
                       if (ci.segment) counts[ci.segment] = (counts[ci.segment] || 0) + 1;
                     });
                     const total = clientInterests.length;
                     return Object.entries(counts).map(([seg, count], idx) => {
                       const pct = Math.round((count / total) * 100);
                       return (
                         <div key={idx} className="space-y-1">
                           <div className="flex justify-between items-center text-xs">
                             <span className="font-semibold text-foreground">{seg}</span>
                             <div className="flex items-center gap-2">
                               <span className="text-[10px] text-foreground/40">{count} {count === 1 ? 'busca' : 'buscas'}</span>
                               <span className="font-bold text-foreground">{pct}%</span>
                             </div>
                           </div>
                           <div className="w-full h-2 bg-background rounded-full overflow-hidden border border-surface-border">
                             <div className="h-full bg-accent rounded-full" style={{ width: `${pct}%` }} />
                           </div>
                         </div>
                       );
                     });
                   })()}
                 </div>
               )}
             </div>

             {/* Tecnologias & Recursos Mais Desejados */}
             <div className="rounded-3xl bg-surface p-6 shadow-[0_18px_50px_rgba(15,23,42,0.055)] ring-1 ring-foreground/7 dark:shadow-black/20">
               <div className="mb-5 pb-3 border-b border-surface-border">
                 <h3 className="text-sm font-bold text-foreground">Tecnologias Mais Solicitadas</h3>
                 <p className="text-xs text-foreground/50">Recursos e integrações mais votados pelos clientes</p>
               </div>

               {clientInterests.length === 0 ? (
                 <div className="py-10 px-4 text-center flex flex-col items-center justify-center gap-2 bg-background/50 rounded-xl border border-dashed border-surface-border">
                   <p className="text-xs font-bold text-foreground">Aguardando votos em tecnologias</p>
                   <p className="text-[11px] text-foreground/50 max-w-xs leading-relaxed">
                     Recursos mais pedidos (Pix, WhatsApp, Agendamento) serão consolidados com base nos formulários preenchidos.
                   </p>
                 </div>
               ) : (
                 <div className="space-y-3.5">
                   {(() => {
                     const techCounts: Record<string, number> = {};
                     clientInterests.forEach(ci => {
                       if (Array.isArray(ci.technologies)) {
                         ci.technologies.forEach((t: string) => {
                           techCounts[t] = (techCounts[t] || 0) + 1;
                         });
                       }
                     });
                     const entries = Object.entries(techCounts);
                     if (entries.length === 0) {
                       return <p className="text-xs text-foreground/40 text-center py-6">Nenhum recurso específico selecionado ainda.</p>;
                     }
                     const max = Math.max(...Object.values(techCounts), 1);
                     return entries.map(([tech, count], idx) => {
                       const pct = Math.round((count / max) * 100);
                       return (
                         <div key={idx} className="space-y-1">
                           <div className="flex justify-between items-center text-xs">
                             <span className="font-semibold text-foreground">{tech}</span>
                             <span className="text-[10px] text-foreground/40">{count} {count === 1 ? 'voto' : 'votos'}</span>
                           </div>
                           <div className="w-full h-2 bg-background rounded-full overflow-hidden border border-surface-border">
                             <div className="h-full bg-accent rounded-full" style={{ width: `${pct}%` }} />
                           </div>
                         </div>
                       );
                     });
                   })()}
                 </div>
               )}
             </div>

           </div>

           {/* Projetos Recentes do Desenvolvedor */}
           <div className="rounded-3xl bg-surface p-6 shadow-[0_18px_50px_rgba(15,23,42,0.055)] ring-1 ring-foreground/7 dark:shadow-black/20">
             <div className="mb-5 pb-3 border-b border-surface-border flex items-center justify-between">
               <div>
                 <h3 className="text-sm font-bold text-foreground">Projetos em Andamento</h3>
                 <p className="text-xs text-foreground/50">Progresso atual dos clientes e sites cadastrados</p>
               </div>
               <button
                 onClick={() => router.push("/admin/add-site")}
                 className="text-xs font-bold text-accent hover:underline flex items-center gap-1 cursor-pointer"
               >
                 <Plus className="w-3.5 h-3.5" /> Adicionar Site
               </button>
             </div>

             {devProjects.length === 0 ? (
               <div className="py-8 px-4 border border-dashed border-surface-border rounded-xl text-center flex flex-col items-center justify-center gap-3 bg-background/50">
                 <div className="w-10 h-10 rounded-xl bg-accent/10 text-accent flex items-center justify-center">
                   <Code2 className="w-5 h-5" />
                 </div>
                 <div className="max-w-xs">
                   <h4 className="text-xs font-bold text-foreground">Nenhum site cadastrado ainda</h4>
                   <p className="text-[11px] text-foreground/50 mt-1 leading-relaxed">
                     Publique templates ou sites prontos para atrair clientes e impulsionar seus ganhos.
                   </p>
                 </div>
                 <button
                   onClick={() => router.push("/admin/add-site")}
                   className="mt-1 px-4 py-2 bg-accent hover:bg-accent/90 text-white rounded-xl text-xs font-bold transition-all shadow-sm flex items-center gap-1.5 cursor-pointer"
                 >
                   <Plus className="w-3.5 h-3.5" /> Cadastrar Primeiro Projeto
                 </button>
               </div>
             ) : (
               <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                 {devProjects.slice(0, 4).map((p, idx) => (
                   <div key={idx} className="bg-background border border-surface-border rounded-xl p-3.5 flex items-center justify-between gap-4">
                     <div className="space-y-0.5">
                       <h4 className="font-bold text-xs text-foreground">{p.name}</h4>
                       <p className="text-[11px] text-foreground/50">
                         {p.category || "Site"} • <span className="font-semibold text-foreground">R$ {getProjectPrice(p.price).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                       </p>
                     </div>
                     <div className="flex items-center gap-3">
                       <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded ${p.status === 'published' ? 'bg-emerald-500/10 text-emerald-500' : 'bg-accent/10 text-accent'}`}>
                         {p.status === 'published' ? 'Publicado' : 'Em revisão'}
                       </span>
                       <button 
                         onClick={() => router.push("/dashboard/chat")}
                         className="p-1.5 hover:bg-surface-border rounded-lg text-foreground/50 hover:text-foreground transition-colors cursor-pointer"
                         title="Abrir chat"
                       >
                         <MessageCircle className="w-4 h-4" />
                       </button>
                     </div>
                   </div>
                 ))}
               </div>
             )}
           </div>

         </div>
       </div>
     );
   }

   // RENDER CLIENT DASHBOARD (MARKETPLACE)
   return (
       <div className="flex-1 overflow-x-hidden overflow-y-auto bg-background text-foreground">
           <div className="sticky top-0 z-50 grid grid-cols-[minmax(0,1fr)_auto] items-center gap-x-3 gap-y-3 bg-background/78 px-4 py-3 shadow-[0_10px_30px_rgba(15,23,42,0.035)] backdrop-blur-xl sm:px-6 sm:py-4 md:grid-cols-[auto_minmax(18rem,1fr)_auto] dark:shadow-black/10">
               <div className="min-w-0">
                 <span className="block text-[10px] font-black uppercase leading-none tracking-[0.2em] text-accent">Descobrir</span>
                 <h1 className="mt-1 text-xl font-black leading-none tracking-tight text-foreground">Marketplace</h1>
               </div>

               <div className="col-span-2 row-start-2 w-full md:col-span-1 md:row-auto md:mx-auto md:max-w-2xl">
                 <label htmlFor="marketplace-search" className="sr-only">Buscar sites no Marketplace</label>
                 <div className="relative">
                   <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-foreground/35" />
                   <input
                     id="marketplace-search"
                     type="search"
                     value={search}
                     onChange={(event) => setSearch(event.target.value)}
                     placeholder="Buscar sites, categorias ou tecnologias"
                     className="h-11 w-full rounded-2xl bg-surface/85 pl-11 pr-11 text-sm font-medium text-foreground shadow-sm ring-1 ring-inset ring-foreground/8 outline-none transition-all placeholder:text-foreground/30 hover:ring-foreground/15 focus:ring-2 focus:ring-accent"
                   />
                   {search ? (
                     <button type="button" onClick={() => setSearch("")} aria-label="Limpar pesquisa" className="absolute right-1.5 top-1/2 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-xl text-foreground/35 hover:bg-foreground/5 hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent">
                       <X className="h-4 w-4" />
                     </button>
                   ) : null}
                 </div>
               </div>

               <DashboardHeaderActions showCart />
           </div>

           <div className="mx-auto w-full max-w-[1600px] space-y-7 px-4 py-6 pb-24 sm:px-6 sm:py-8">
                {/* Barra de pesquisa e Filtros Horizontais com Pills e Contadores (Estilo Referência) */}
                <div id="templates-grid" className="space-y-4 pt-2">
                    {/* Barra de Filtros - Tipos (Menu Customizado) e Origem Perfeitamente Visíveis */}
                    <div className="custom-scrollbar -mx-6 flex items-center gap-4 overflow-x-auto px-6 py-2 text-xs md:mx-0 md:flex-wrap md:overflow-visible md:px-0">
                        {/* Grupo TIPOS com Menu Dropdown Customizado */}
                        <div className="flex items-center gap-2.5 shrink-0" ref={typeMenuRef}>
                            <span className="text-[10px] font-bold text-neutral-500 uppercase tracking-widest pl-1">TIPOS</span>
                            
                            <div className="relative">
                                <button
                                    type="button"
                                    onClick={() => setIsTypeMenuOpen(!isTypeMenuOpen)}
                                    className={`px-4 py-2 rounded-full text-xs font-semibold transition-all flex items-center gap-2 cursor-pointer border shadow-sm ${
                                        selectedType !== "all"
                                            ? "bg-white text-black border-white shadow-neutral-900/40"
                                            : "bg-[#141417] text-neutral-200 hover:text-white hover:bg-[#1a1a20] border-neutral-800 hover:border-neutral-700"
                                    }`}
                                >
                                    <span>{ALL_COMMERCE_TYPES.find(t => t.key === selectedType)?.label || "Todos os Tipos"}</span>
                                    <span className={`text-[11px] px-1.5 py-0.5 rounded-full ${
                                        selectedType !== "all" ? "bg-black/10 text-black font-bold" : "bg-neutral-800/80 text-neutral-400 font-normal"
                                    }`}>
                                        {getTypeCount(selectedType)}
                                    </span>
                                    <ChevronDown className={`w-3.5 h-3.5 transition-transform duration-200 ${
                                        selectedType !== "all" ? "text-black" : "text-neutral-400"
                                    } ${isTypeMenuOpen ? 'rotate-180' : ''}`} />
                                </button>

                                {/* Popover Dropdown Customizado Flutuante */}
                                <AnimatePresence>
                                    {isTypeMenuOpen && (
                                        <motion.div
                                            initial={{ opacity: 0, y: 8, scale: 0.96 }}
                                            animate={{ opacity: 1, y: 0, scale: 1 }}
                                            exit={{ opacity: 0, y: 4, scale: 0.96 }}
                                            transition={{ duration: 0.15 }}
                                            className="absolute left-0 top-full mt-2 w-64 bg-[#121215] border border-neutral-800/90 rounded-2xl shadow-2xl p-2 z-[999] backdrop-blur-2xl"
                                        >
                                            {/* Campo de Pesquisa Rápida */}
                                            <div className="relative mb-2 px-1">
                                                <Search className="w-3.5 h-3.5 absolute left-3.5 top-1/2 -translate-y-1/2 text-neutral-500" />
                                                <input
                                                    type="text"
                                                    value={typeSearch}
                                                    onChange={(e) => setTypeSearch(e.target.value)}
                                                    placeholder="Pesquisar tipo..."
                                                    className="w-full bg-[#18181d] border border-neutral-800 rounded-xl py-1.5 pl-9 pr-3 text-xs text-neutral-200 placeholder:text-neutral-500 focus:outline-none focus:border-neutral-700"
                                                    autoFocus
                                                />
                                            </div>

                                            {/* Lista de Tipos de Comércio */}
                                            <div className="max-h-64 overflow-y-auto space-y-0.5 custom-scrollbar pr-0.5">
                                                {ALL_COMMERCE_TYPES.filter(t => 
                                                    t.label.toLowerCase().includes(typeSearch.toLowerCase())
                                                ).length > 0 ? (
                                                    ALL_COMMERCE_TYPES.filter(t => 
                                                        t.label.toLowerCase().includes(typeSearch.toLowerCase())
                                                    ).map((t) => {
                                                        const count = getTypeCount(t.key);
                                                        const isSelected = selectedType === t.key;
                                                        return (
                                                            <button
                                                                key={t.key}
                                                                type="button"
                                                                onClick={() => {
                                                                    setSelectedType(t.key);
                                                                    setIsTypeMenuOpen(false);
                                                                    setTypeSearch("");
                                                                }}
                                                                className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs transition-colors cursor-pointer text-left ${
                                                                    isSelected
                                                                        ? "bg-white text-black font-bold"
                                                                        : "text-neutral-300 hover:bg-[#1a1a20] hover:text-white font-medium"
                                                                }`}
                                                            >
                                                                <span className="truncate">{t.label}</span>
                                                                <div className="flex items-center gap-1.5 shrink-0">
                                                                    <span className={`text-[11px] font-mono ${isSelected ? "text-neutral-600" : "text-neutral-500"}`}>
                                                                        ({count})
                                                                    </span>
                                                                    {isSelected && <Check className="w-3.5 h-3.5 text-black" />}
                                                                </div>
                                                            </button>
                                                        );
                                                    })
                                                ) : (
                                                    <p className="text-center text-xs text-neutral-500 py-4">Nenhum tipo encontrado</p>
                                                )}
                                            </div>
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                            </div>
                        </div>

                        {/* Grupo ORIGEM */}
                        <div className="flex items-center gap-2 shrink-0">
                            <span className="text-[10px] font-bold text-neutral-500 uppercase tracking-widest">ORIGEM</span>
                            {[
                              { key: "all", label: "Todas", count: getOriginCount("all") },
                              { key: "susanoo", label: "Por Susanoo", count: getOriginCount("susanoo") },
                              { key: "comunidade", label: "Comunidade", count: getOriginCount("comunidade") },
                            ].map((tab) => {
                              const isActive = selectedOrigin === tab.key;
                              return (
                                <button
                                  key={tab.key}
                                  onClick={() => setSelectedOrigin(tab.key)}
                                  className={`px-3.5 py-1.5 rounded-full text-xs transition-all flex items-center gap-1.5 shrink-0 cursor-pointer ${
                                    isActive 
                                      ? "bg-white text-black font-bold shadow-xs" 
                                      : "bg-[#141417] text-neutral-300 hover:text-white hover:bg-[#1a1a1f] border border-neutral-800/80 font-medium"
                                  }`}
                                >
                                  <span>{tab.label}</span>
                                  <span className={`text-[11px] ${isActive ? "text-neutral-600 font-semibold" : "text-neutral-500 font-normal"}`}>
                                    {tab.count}
                                  </span>
                                </button>
                              );
                            })}
                        </div>
                        <span className="ml-auto rounded-full bg-foreground/5 px-3 py-1.5 text-[11px] font-bold text-foreground/45" aria-live="polite">
                          {filtered.length} {filtered.length === 1 ? "resultado" : "resultados"}
                        </span>
                    </div>
                </div>

                {/* Grade de produtos fiel à imagem de referência */}
                {loading ? (
                  <div className="flex items-center justify-center py-20">
                    <div className="w-8 h-8 border-2 border-surface-border border-t-accent rounded-full animate-spin" />
                  </div>
                ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-7 md:gap-8">
                    <AnimatePresence mode="popLayout">
                    {filtered.length > 0 ? filtered.map((proj, i) => {
                         const bought = isPurchased(proj);
                         const tags = getProjectTags(proj);
                         
                         return (
                         <motion.div 
                             key={proj.id}
                             initial={{ opacity: 0, y: 12 }}
                             animate={{ opacity: 1, y: 0 }}
                             exit={{ opacity: 0 }}
                             transition={{ delay: i * 0.03 }}
                             className="flex flex-col group cursor-pointer"
                             onClick={() => openProduct(proj)}
                         >
                             {/* Moldura da Tela / Viewport com Bezel Arredondado */}
                             <div className="w-full aspect-[16/10] bg-[#09090b] rounded-2xl md:rounded-[1.25rem] border border-neutral-800/90 overflow-hidden relative shadow-xs group-hover:border-neutral-700 transition-all duration-300">
                                 {proj.cover_url ? (
                                     <img 
                                        src={proj.cover_url} 
                                        alt={proj.name} 
                                        className="w-full h-full object-cover group-hover:scale-[1.02] transition-transform duration-500" 
                                     />
                                 ) : (
                                     <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-neutral-900 to-black text-neutral-600 font-bold text-2xl tracking-tighter">
                                        {(proj.name || "PRJ").substring(0,3)}
                                     </div>
                                 )}

                                 {/* Ring interno simulando bezel de display */}
                                 <div className="absolute inset-0 ring-1 ring-inset ring-white/5 rounded-2xl md:rounded-[1.25rem] pointer-events-none" />

                                 {/* Badge discreto se comprado */}
                                 {bought && (
                                   <div className="absolute top-3 left-3 bg-emerald-500/90 backdrop-blur-md text-white px-2.5 py-0.5 rounded-full text-[10px] font-semibold flex items-center gap-1 shadow-xs">
                                     <Check className="w-3 h-3" /> Já Adquirido
                                   </div>
                                 )}

                                 {/* Botão de curtir discreto */}
                                 <button
                                   onClick={(e) => { e.stopPropagation(); toggleFavorite(proj); }}
                                   className={`absolute top-3 right-3 p-2 rounded-full backdrop-blur-md border transition-all opacity-100 ${
                                     likedProjectIds.includes(proj.id) 
                                       ? 'bg-red-500/20 border-red-500/40 text-red-500 opacity-100' 
                                       : 'bg-black/50 border-white/10 text-white/70 hover:text-red-400 md:opacity-0 md:group-hover:opacity-100'
                                   }`}
                                   title="Favoritar"
                                 >
                                   <Heart className={`w-3.5 h-3.5 ${likedProjectIds.includes(proj.id) ? 'fill-red-500' : ''}`} />
                                 </button>
                             </div>

                             {/* Linha de Título com Ícone ↗ e Preço */}
                             <div className="mt-3.5 flex items-center justify-between gap-2 px-0.5">
                                 <div className="flex items-center gap-1.5 min-w-0">
                                     <span className="text-neutral-400 group-hover:text-foreground group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-all duration-200 text-sm font-semibold">
                                       ↗
                                     </span>
                                     <h3 className="font-semibold text-sm text-foreground truncate group-hover:text-accent transition-colors">
                                       {proj.name}
                                     </h3>
                                 </div>

                                 <span className="text-xs font-semibold text-neutral-400 shrink-0">
                                   R$ {getProjectPrice(proj.price).toFixed(2).replace('.', ',')}
                                 </span>
                             </div>

                             {/* Linha de Tags / Chips arredondados inferiores */}
                             <div className="mt-2 flex flex-wrap items-center gap-1.5 px-0.5">
                                 {tags.map((tag: string, tIdx: number) => (
                                   <span 
                                     key={tIdx} 
                                     className="bg-[#141417] text-neutral-400 border border-neutral-800/80 text-[11px] px-2.5 py-0.5 rounded-full font-medium"
                                   >
                                     {tag}
                                   </span>
                                 ))}
                             </div>
                         </motion.div>
                    )}) : (
                         <motion.div initial={{opacity:0}} animate={{opacity:1}} className="col-span-full py-16 px-6 bg-surface/50 border border-dashed border-surface-border rounded-3xl text-center flex flex-col items-center justify-center gap-3">
                             <div className="w-14 h-14 rounded-2xl bg-surface border border-surface-border flex items-center justify-center text-foreground/40 shadow-sm">
                                 <ShoppingBag className="w-6 h-6" />
                             </div>
                             <div className="max-w-md">
                                 <h3 className="text-base font-bold text-foreground">
                                   {search ? "Nenhum site encontrado para esta busca" : "A vitrine ainda não possui sites cadastrados"}
                                 </h3>
                                 <p className="text-xs text-foreground/50 mt-1 leading-relaxed">
                                   {search 
                                     ? "Tente buscar por termos mais amplos ou explore as categorias disponíveis." 
                                     : "Novos templates e sites prontos estão sendo adicionados pela nossa comunidade. Fale com nossos desenvolvedores para solicitar um projeto personalizado."}
                                 </p>
                             </div>
                             <div className="flex flex-wrap items-center justify-center gap-2.5 mt-2">
                               {search ? (
                                 <button
                                   onClick={() => setSearch("")}
                                   className="px-4 py-2 bg-foreground text-background rounded-xl text-xs font-bold transition-all cursor-pointer"
                                 >
                                   Limpar Pesquisa
                                 </button>
                               ) : (
                                 <>
                                   <button
                                     onClick={() => router.push("/dashboard/developers")}
                                     className="px-4 py-2 bg-accent hover:bg-accent/90 text-white rounded-xl text-xs font-bold transition-all shadow-sm flex items-center gap-1.5 cursor-pointer"
                                   >
                                     <User className="w-3.5 h-3.5" /> Ver Desenvolvedores
                                   </button>
                                   <button
                                     onClick={() => router.push("/admin/add-site")}
                                     className="px-4 py-2 bg-surface border border-surface-border hover:bg-background rounded-xl text-xs font-bold text-foreground transition-all flex items-center gap-1.5 cursor-pointer"
                                   >
                                     <Plus className="w-3.5 h-3.5" /> Adicionar Site
                                   </button>
                                 </>
                               )}
                             </div>
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
                                            <ReviewsSection projectId={activeProduct.id} />
                                       )}
                                   </div>
                               </div>

                               {/* Direita: Compra e Ações (Fixo/Rolável) */}
                               <div className="custom-scrollbar flex h-full flex-col justify-between overflow-y-auto bg-background p-5 sm:p-8 lg:col-span-4">
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
                                           <p className="text-4xl font-black text-foreground">R$ {getProjectPrice(activeProduct.price).toFixed(2).replace('.', ',')}</p>
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

                                       {isPurchased(activeProduct) && (
                                         <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-2xl p-4 flex items-start gap-3 text-emerald-600 dark:text-emerald-400">
                                           <CheckCircle2 className="w-5 h-5 shrink-0 text-emerald-500 mt-0.5" />
                                           <div>
                                             <p className="font-black text-sm text-foreground">Você já possui este site!</p>
                                             <p className="text-xs text-foreground/60 font-medium mt-0.5">Acesse Minhas Compras para acompanhar o desenvolvimento e cronograma.</p>
                                           </div>
                                         </div>
                                       )}

                                       <div className="flex flex-col gap-3 mt-8 lg:mt-0 pt-6 border-t border-surface-border">
                                            {isPurchased(activeProduct) ? (
                                              <>
                                                <button 
                                                    onClick={() => { setActiveProduct(null); router.push('/dashboard/projects'); }}
                                                    className="w-full py-4.5 bg-emerald-600 hover:bg-emerald-500 text-white font-black rounded-xl hover:scale-[1.02] active:scale-[0.98] transition-all shadow-xl shadow-emerald-600/20 flex items-center justify-center gap-2 text-sm uppercase tracking-wider cursor-pointer"
                                                >
                                                    <ShoppingBag className="w-5 h-5" /> Ver em Minhas Compras
                                                </button>
                                                <button 
                                                    onClick={() => { setActiveProduct(null); router.push('/dashboard/timeline'); }}
                                                    className="w-full py-4.5 bg-surface border border-surface-border hover:border-accent/40 text-foreground font-black rounded-xl hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-2 text-sm uppercase tracking-wider cursor-pointer"
                                                >
                                                    <Calendar className="w-5 h-5 text-accent" /> Acompanhar Progresso
                                                </button>
                                              </>
                                            ) : (
                                              <>
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
                                              </>
                                            )}
                                            <button 
                                                onClick={() => window.open(`/preview/${activeProduct.id}`, "_blank", "noopener,noreferrer")}
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

            {/* Popup Inteligente de Preferências & Segmentos do Cliente */}
            <ClientInterestSurveyModal 
              viewCount={productViewsCount} 
              hasPurchased={purchasedProjects.length > 0} 
            />

            {/* Toast de Curtida */}
            <AnimatePresence>
                {toastMsg && (
                    <motion.div 
                        initial={{ opacity: 0, y: 50, scale: 0.95 }} 
                        animate={{ opacity: 1, y: 0, scale: 1 }} 
                        exit={{ opacity: 0, scale: 0.95, y: 20 }}
                        className="fixed bottom-6 right-6 z-[9999] bg-surface border border-surface-border shadow-2xl px-6 py-4 rounded-2xl flex items-center gap-3 max-w-sm border-accent/20"
                    >
                        <div className="w-8 h-8 bg-red-500/10 text-red-500 rounded-full flex items-center justify-center shrink-0 animate-pulse">
                            <Heart className="w-4 h-4 fill-red-500 text-red-500" />
                        </div>
                        <p className="text-sm font-bold text-foreground">{toastMsg}</p>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}

export default function DiscoverHome() {
    return (
        <Suspense fallback={
            <div className="flex-1 flex items-center justify-center py-20">
                <div className="w-8 h-8 border-2 border-surface-border border-t-accent rounded-full animate-spin" />
            </div>
        }>
            <DiscoverHomeContent />
        </Suspense>
    );
}
