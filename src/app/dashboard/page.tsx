"use client";
import { useEffect, useState } from "react";
import { 
  Search, 
  ChevronDown, 
  ExternalLink, 
  ShieldCheck, 
  User, 
  Star, 
  ShoppingCart, 
  CreditCard, 
  X, 
  Check, 
  Laptop, 
  Truck, 
  Award, 
  Sparkles, 
  Heart 
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { supabase } from "@/lib/supabase";

type MainMode = "Susanoo" | "Geral";

export default function DiscoverHome() {
   const [mainMode, setMainMode] = useState<MainMode>("Susanoo");
   const [subFilter, setSubFilter] = useState("Templates");
   const [search, setSearch] = useState("");
   const [projects, setProjects] = useState<any[]>([]);
   const [loading, setLoading] = useState(true);

   // Estados do E-commerce estilo Mercado Livre
   const [activeProduct, setActiveProduct] = useState<any | null>(null);
   const [cart, setCart] = useState<string[]>([]);
   const [checkoutStatus, setCheckoutStatus] = useState<"idle" | "loading" | "success">("idle");
   const [selectedMockIndex, setSelectedMockIndex] = useState<number>(0);
   const [favorited, setFavorited] = useState<boolean>(false);

   useEffect(() => {
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
   }, []);

   const susanooCategories = ["Templates", "Sites Prontos"];
   const geralCategories = ["Todos", "Templates de Devs", "Sites de Devs"];

   const currentCategories = mainMode === "Susanoo" ? susanooCategories : geralCategories;

   useEffect(() => {
      if (mainMode === "Susanoo") setSubFilter("Templates");
      else setSubFilter("Todos");
   }, [mainMode]);

   const filtered = projects.filter(proj => {
      const matchSearch = proj.name.toLowerCase().includes(search.toLowerCase());
      
      // Mock logic for filtering based on categories since we don't have exact db fields for this yet
      // In a real scenario, you'd check proj.author_type === 'Susanoo' and proj.product_type === 'Template' etc.
      const cat = proj.category || 'Templates';
      
      let matchCat = true;
      if (subFilter !== "Todos") {
         matchCat = cat.includes(subFilter) || subFilter === cat;
         // fallback mock for the example
         if (!proj.category) matchCat = true; 
      }

      return matchSearch && matchCat;
   });

   const containerVariants = { hidden: { opacity: 0 }, show: { opacity: 1, transition: { staggerChildren: 0.1 } } };
   const itemVariants = { 
       hidden: { opacity: 0, y: 20 }, 
       show: { opacity: 1, y: 0, transition: { type: "spring" as const, stiffness: 80, damping: 15 } }, 
       exit: { opacity: 0, scale: 0.95, transition: { duration: 0.2 } } 
   };

   return (
       <div className="flex-1 overflow-y-auto w-full bg-background text-foreground transition-colors duration-300">
           <div className="flex items-center justify-between p-4 px-8 border-b border-surface-border bg-background/80 backdrop-blur-md sticky top-0 z-50 transition-colors duration-300">
               <div className="flex items-center gap-6">
                 <span className="font-bold text-[17px] tracking-tight text-foreground flex items-center gap-2">Marketplace </span>
                 <div className="hidden md:flex items-center gap-2 cursor-pointer text-foreground/50 hover:text-foreground transition-colors">
                    <span className="font-medium text-sm">Projetos & Templates</span>
                    <ChevronDown className="w-4 h-4"/>
                 </div>
               </div>
           </div>

           <div className="w-full max-w-7xl mx-auto py-12 px-6 flex flex-col items-center overflow-x-hidden">
               <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, ease: "easeOut" }} className="w-full flex flex-col items-center text-center">
                   <h1 className="text-4xl md:text-5xl font-black mb-5 flex justify-center items-center gap-4 tracking-tighter text-foreground">
                       Marketplace <span className="bg-accent/10 flex items-center gap-1 text-accent border border-accent/20 text-[10px] font-bold px-2.5 py-1 rounded shadow-lg uppercase tracking-[0.3em] hidden sm:flex italic"><ShieldCheck className="w-3 h-3"/> Susanoo Verify</span>
                   </h1>
                   <p className="text-foreground/40 mb-10 max-w-xl text-[16px] font-bold leading-relaxed italic">
                       Encontre o site perfeito para o seu comércio ou descubra assets incríveis na nossa galeria.
                   </p>
               </motion.div>

               {/* Top Level Toggle */}
               <motion.div initial={{opacity:0}} animate={{opacity:1}} className="flex p-1 bg-surface border border-surface-border rounded-full mb-8">
                   <button 
                       onClick={() => setMainMode("Susanoo")}
                       className={`px-8 py-3 rounded-full text-xs font-black uppercase tracking-widest transition-all cursor-pointer hover:scale-[1.02] active:scale-[0.98] ${mainMode === "Susanoo" ? 'bg-accent text-white shadow-lg' : 'text-foreground/40 hover:text-foreground hover:bg-surface-border'}`}
                   >
                       Por Susanoo
                   </button>
                   <button 
                       onClick={() => setMainMode("Geral")}
                       className={`px-8 py-3 rounded-full text-xs font-black uppercase tracking-widest transition-all cursor-pointer hover:scale-[1.02] active:scale-[0.98] ${mainMode === "Geral" ? 'bg-white text-black shadow-lg' : 'text-foreground/40 hover:text-foreground hover:bg-surface-border'}`}
                   >
                       Comunidade (Geral)
                   </button>
               </motion.div>

               <motion.div initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.4, delay: 0.1 }} className="w-full max-w-2xl relative mb-8">
                   <Search className="w-5 h-5 absolute left-5 top-1/2 -translate-y-1/2 text-foreground/20" />
                   <input 
                      type="text" 
                      value={search}
                      onChange={(e) => setSearch(e.target.value)}
                      placeholder="Pesquisar sites, restaurantes, lojas..."
                      className="w-full bg-surface/50 border border-surface-border shadow-2xl rounded-[32px] py-5 pl-14 pr-6 text-[15px] font-bold text-foreground focus:border-accent/50 focus:outline-none transition-all placeholder:text-foreground/20"
                   />
               </motion.div>

               {/* Sub Filters */}
               <motion.div initial={{opacity: 0}} animate={{opacity:1}} transition={{delay:0.2}} className="flex flex-wrap gap-3 justify-center mb-16">
                   {currentCategories.map((cat) => (
                       <button 
                           key={cat} 
                           onClick={() => setSubFilter(cat)}
                           className={`px-6 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all cursor-pointer hover:scale-[1.05] active:scale-[0.95] ${subFilter === cat ? (mainMode === 'Susanoo' ? 'bg-accent/20 text-accent border border-accent/40' : 'bg-foreground/10 text-foreground border border-foreground/20') : 'bg-surface text-foreground/40 hover:text-foreground hover:bg-surface/80 border border-surface-border'}`}
                       >
                           {cat}
                       </button>
                   ))}
               </motion.div>

               {/* Showcase Templates - Real Data from Projects */}
               <motion.div variants={containerVariants} initial="hidden" animate="show" className="w-full grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
                   <AnimatePresence mode="popLayout">
                   {filtered.length > 0 ? filtered.map(proj => (
                        <motion.div 
                            variants={itemVariants} 
                            layout 
                            key={proj.id} 
                            onClick={() => {
                                setActiveProduct(proj);
                                setFavorited(false);
                                setSelectedMockIndex(0);
                                setCheckoutStatus("idle");
                            }}
                            className="group flex flex-col cursor-pointer"
                        >
                            <div className="aspect-[4/3] w-full rounded-[24px] bg-[#050505] mb-4 overflow-hidden relative shadow-3xl transition-all duration-500 group-hover:-translate-y-2 border border-surface-border group-hover:border-accent/30 cursor-pointer">
                                
                                {proj.cover_url ? (
                                    <img src={proj.cover_url} className="absolute inset-0 w-full h-full object-cover grayscale-[0.5] group-hover:grayscale-0 transition-all duration-700" alt={proj.name}/>
                                ) : (
                                    <div className="absolute inset-0 flex items-center justify-center text-5xl font-black text-foreground/5 opacity-20 uppercase tracking-tighter italic">
                                       {proj.name.substring(0,3)}
                                    </div>
                                )}
                                
                                <div className="absolute inset-0 bg-gradient-to-t from-black via-black/20 to-transparent opacity-80 group-hover:opacity-60 transition-opacity z-10" />
                                
                                <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-300 z-20 gap-4 scale-90 group-hover:scale-100">
                                   <button 
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        if (proj.deploy_url) window.open(proj.deploy_url.startsWith('http') ? proj.deploy_url : `https://${proj.deploy_url}`, '_blank')
                                      }}
                                      className="w-12 h-12 bg-white rounded-full flex items-center justify-center text-black hover:scale-110 active:scale-90 transition-transform shadow-2xl"
                                   >
                                      <ExternalLink className="w-5 h-5" />
                                   </button>
                                </div>

                                {mainMode === "Susanoo" && (
                                   <div className="absolute top-3 left-3 bg-accent/90 backdrop-blur-md px-3 py-1 rounded-full flex items-center gap-1 z-20 shadow-lg">
                                       <ShieldCheck className="w-3 h-3 text-white" />
                                       <span className="text-[9px] font-black uppercase tracking-widest text-white">Verified</span>
                                   </div>
                                )}
                            </div>
                            <div className="px-2">
                                <div className="flex items-center justify-between mb-1">
                                    <h4 className="text-xl font-bold text-white tracking-tight">{proj.name}</h4>
                                    <span className="text-secondary text-[12px] font-bold">R$ 49/m</span>
                                </div>
                                <p className="text-xs font-medium text-foreground/40 flex items-center gap-1.5 mt-1">
                                    <User className="w-3 h-3"/> 
                                    {mainMode === "Susanoo" ? "Susanoo Production" : "Dev Independente"}
                                </p>
                            </div>
                        </motion.div>
                   )) : (
                        <motion.div initial={{opacity:0}} animate={{opacity:1}} className="col-span-full py-20 text-center">
                            <div className="inline-flex p-5 rounded-full bg-surface mb-4">
                                <Search className="w-8 h-8 text-foreground/10" />
                            </div>
                            <h3 className="text-lg font-bold text-foreground/30 italic">Nenhum projeto encontrado nesta categoria.</h3>
                        </motion.div>
                   )}
                   </AnimatePresence>
               </motion.div>
           </div>

           {/* Modal de Detalhes do Produto - Estilo Mercado Livre / Cyberpunk Premium */}
           <AnimatePresence>
               {activeProduct && (
                   <motion.div 
                       initial={{ opacity: 0 }} 
                       animate={{ opacity: 1 }} 
                       exit={{ opacity: 0 }} 
                       className="fixed inset-0 bg-black/90 backdrop-blur-md z-[999] flex items-center justify-center p-4 md:p-10 overflow-y-auto"
                       onClick={(e) => e.target === e.currentTarget && setActiveProduct(null)}
                   >
                       <motion.div 
                           initial={{ scale: 0.9, y: 30, opacity: 0 }}
                           animate={{ scale: 1, y: 0, opacity: 1 }}
                           exit={{ scale: 0.9, y: 30, opacity: 0 }}
                           transition={{ type: "spring", damping: 25, stiffness: 250 }}
                           className="bg-[#0b0b0c] border border-white/5 w-full max-w-6xl rounded-[40px] shadow-3xl overflow-hidden relative grid grid-cols-1 lg:grid-cols-12 max-h-[90vh] lg:max-h-[85vh] overflow-y-auto custom-scrollbar font-sans"
                       >
                           {/* Botão de Fechar */}
                           <button 
                               onClick={() => setActiveProduct(null)} 
                               className="absolute top-4 right-4 md:top-6 md:right-6 z-[100] p-3 bg-black/80 backdrop-blur-md border border-white/10 rounded-full hover:scale-110 active:scale-95 transition-all text-white/50 hover:text-white shadow-2xl"
                           >
                               <X className="w-6 h-6" />
                           </button>

                           {checkoutStatus === "success" ? (
                               <motion.div 
                                   initial={{ opacity: 0, scale: 0.95 }}
                                   animate={{ opacity: 1, scale: 1 }}
                                   className="col-span-full py-20 px-8 flex flex-col items-center justify-center text-center bg-black/40"
                               >
                                   <div className="w-24 h-24 rounded-full bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center mb-8 relative">
                                       <motion.div 
                                           initial={{ scale: 0 }}
                                           animate={{ scale: 1 }}
                                           transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
                                       >
                                           <Check className="w-12 h-12 text-emerald-500" />
                                       </motion.div>
                                       <div className="absolute inset-0 rounded-full border border-emerald-500/30 animate-ping opacity-70" />
                                   </div>
                                   <h2 className="text-4xl md:text-5xl font-black italic tracking-tighter uppercase mb-4 text-white">Operação Aprovada! ⚡</h2>
                                   <p className="text-white/60 font-bold max-w-lg mb-10 text-sm md:text-base leading-relaxed">
                                       Seu código-fonte e as credenciais de acesso exclusivas foram geradas e enviadas para o seu e-mail cadastrado.
                                   </p>
                                   <button 
                                       onClick={() => {
                                           setCheckoutStatus("idle");
                                           setActiveProduct(null);
                                       }}
                                       className="px-10 py-5 bg-white text-black font-black text-xs uppercase tracking-widest rounded-2xl hover:scale-105 active:scale-95 transition-all shadow-2xl hover:bg-emerald-400 hover:text-black"
                                   >
                                       Finalizar & Acessar Canal
                                   </button>
                               </motion.div>
                           ) : (
                               <>
                                   {/* Coluna Esquerda: Fotos, Especificações e Detalhes */}
                                   <div className="lg:col-span-7 p-6 md:p-10 flex flex-col gap-8 custom-scrollbar">
                                       <div className="relative">
                                           {/* Imagem Principal */}
                                           <div className="aspect-[16/10] w-full rounded-3xl overflow-hidden bg-black/50 border border-white/5 relative group shadow-2xl">
                                               {activeProduct.cover_url ? (
                                                   <img 
                                                       src={selectedMockIndex === 0 ? activeProduct.cover_url : `https://images.unsplash.com/photo-${[
                                                           '1531403009284-440f080d1e12', // mockup 1
                                                           '1507238691740-187a5b1d37b8', // mockup 2
                                                           '1551288049-bebda4e38f71'  // mockup 3
                                                       ][selectedMockIndex - 1]}?auto=format&fit=crop&w=1000&q=80`} 
                                                       className="w-full h-full object-cover transition-all duration-700" 
                                                       alt={activeProduct.name}
                                                   />
                                               ) : (
                                                   <div className="absolute inset-0 flex flex-col items-center justify-center bg-[#070708] text-white/5 uppercase italic font-black text-6xl tracking-tighter select-none">
                                                       {activeProduct.name.substring(0, 3)}
                                                   </div>
                                               )}
                                               <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-60 pointer-events-none" />
                                           </div>

                                           {/* Badge Susanoo Verify */}
                                           <div className="absolute top-4 left-4 bg-accent/90 backdrop-blur-md border border-accent/20 px-4 py-1.5 rounded-full flex items-center gap-1.5 shadow-lg">
                                               <ShieldCheck className="w-3.5 h-3.5 text-white" />
                                               <span className="text-[9px] font-black uppercase tracking-widest text-white">Susanoo Verify</span>
                                           </div>
                                       </div>

                                       {/* Carrossel de Fotos Adicionais estilo ML */}
                                       <div className="flex gap-4">
                                           <button 
                                               onClick={() => setSelectedMockIndex(0)}
                                               className={`w-20 md:w-28 aspect-video rounded-xl overflow-hidden border bg-[#050505] transition-all cursor-pointer hover:opacity-90 ${selectedMockIndex === 0 ? 'border-accent ring-2 ring-accent/20 shadow-lg scale-95' : 'border-white/5 opacity-55'}`}
                                           >
                                               {activeProduct.cover_url ? (
                                                   <img src={activeProduct.cover_url} className="w-full h-full object-cover" />
                                               ) : (
                                                   <div className="w-full h-full flex items-center justify-center font-bold text-[10px] text-white/10 uppercase">{activeProduct.name.substring(0,3)}</div>
                                               )}
                                           </button>
                                           {[1, 2, 3].map((num) => (
                                               <button 
                                                   key={num}
                                                   onClick={() => setSelectedMockIndex(num)}
                                                   className={`w-20 md:w-28 aspect-video rounded-xl overflow-hidden border bg-[#050505] transition-all cursor-pointer hover:opacity-90 ${selectedMockIndex === num ? 'border-accent ring-2 ring-accent/20 shadow-lg scale-95' : 'border-white/5 opacity-55'}`}
                                               >
                                                   <img 
                                                       src={`https://images.unsplash.com/photo-${[
                                                           '1531403009284-440f080d1e12',
                                                           '1507238691740-187a5b1d37b8',
                                                           '1551288049-bebda4e38f71'
                                                       ][num - 1]}?auto=format&fit=crop&w=150&q=50`} 
                                                       className="w-full h-full object-cover" 
                                                   />
                                               </button>
                                           ))}
                                       </div>

                                       {/* Seção de Descrição Completa */}
                                       <div className="flex flex-col gap-4 border-t border-white/5 pt-8">
                                           <h3 className="text-xs font-black uppercase text-white/20 tracking-[0.4em]">Descrição do Produto</h3>
                                           <p className="text-white/70 font-medium text-sm md:text-base leading-relaxed whitespace-pre-wrap italic">
                                               {activeProduct.description || 
                                                "Este é um template/website ultra-premium projetado pela equipe técnica da Susanoo. Inclui código-fonte otimizado em Next.js e TailwindCSS, layout totalmente responsivo para dispositivos móveis, design moderno com micro-animações, SEO amigável para buscadores, e integrações simplificadas para impulsionar a sua operação digital ao máximo."}
                                           </p>
                                       </div>

                                       {/* Especificações Técnicas e Features */}
                                       <div className="flex flex-col gap-4 border-t border-white/5 pt-8">
                                           <h3 className="text-xs font-black uppercase text-white/20 tracking-[0.4em]">Especificações Técnicas</h3>
                                           <div className="grid grid-cols-2 gap-4">
                                               {[
                                                   { label: "Performance", val: "100/100 Lighthouse" },
                                                   { label: "Framework", val: "Next.js 16 (App Router)" },
                                                   { label: "Estilo CSS", val: "TailwindCSS v4 / Vanilla" },
                                                   { label: "Banco de Dados", val: "Supabase Integrado" },
                                                   { label: "Animações", val: "Framer Motion 12" },
                                                   { label: "Suporte", val: "24/7 Equipe dedicada" }
                                               ].map((spec, i) => (
                                                   <div key={i} className="bg-white/5 border border-white/5 rounded-2xl p-4 flex flex-col justify-center">
                                                       <span className="text-[10px] font-black uppercase text-white/30 mb-0.5">{spec.label}</span>
                                                       <span className="text-xs font-bold text-white">{spec.val}</span>
                                                   </div>
                                               ))}
                                           </div>
                                       </div>
                                   </div>

                                   {/* Coluna Direita: Preço, Compra e Checkout */}
                                   <div className="lg:col-span-5 p-6 md:p-10 bg-[#0c0c0e] lg:border-l border-white/5 flex flex-col justify-between custom-scrollbar">
                                       <div className="flex flex-col gap-6">
                                           {/* Header do produto */}
                                           <div className="flex flex-col gap-2">
                                               <div className="flex items-center justify-between">
                                                   <span className="text-[9px] font-black uppercase tracking-widest text-[#555]">Novo · 147 vendidos</span>
                                               </div>
                                               <div className="flex items-start justify-between gap-4">
                                                   <h2 className="text-3xl md:text-4xl font-black italic tracking-tighter uppercase text-white leading-none">
                                                       {activeProduct.name}
                                                   </h2>
                                                   <button 
                                                       onClick={() => setFavorited(!favorited)}
                                                       className={`p-3 rounded-full border transition-all hover:scale-110 active:scale-95 shadow-lg ${favorited ? 'bg-red-500/10 border-red-500/30 text-red-500' : 'bg-white/5 border-white/10 text-white/40 hover:text-white hover:bg-white/10'}`}
                                                   >
                                                       <Heart className={`w-6 h-6 ${favorited ? 'fill-red-500 text-red-500' : ''}`} />
                                                   </button>
                                               </div>
                                               {/* Reviews */}
                                               <div className="flex items-center gap-1.5 mt-2">
                                                   <div className="flex text-amber-400">
                                                       {[1, 2, 3, 4, 5].map((s) => (
                                                           <Star key={s} className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                                                       ))}
                                                   </div>
                                                   <span className="text-[10px] font-black text-white/40 uppercase">5.0 (42 Avaliações)</span>
                                               </div>
                                           </div>

                                           {/* Preço e Forma de pagamento */}
                                           <div className="flex flex-col border-y border-white/5 py-6">
                                               <div className="flex items-baseline gap-1">
                                                   <span className="text-xs font-black text-white/30 uppercase mr-1">R$</span>
                                                   <span className="text-5xl font-black tracking-tighter italic text-white leading-none">49</span>
                                                   <span className="text-lg font-black text-white/50">,90</span>
                                                   <span className="text-[10px] font-black text-accent border border-accent/20 bg-accent/5 px-2 py-0.5 rounded ml-3 uppercase">90% OFF</span>
                                               </div>
                                               <span className="text-[10px] font-black text-emerald-500 uppercase tracking-wider mt-3 flex items-center gap-1">
                                                   <CreditCard className="w-3.5 h-3.5" /> Em até 12x sem juros de R$ 4,15
                                               </span>
                                           </div>

                                           {/* Trust features */}
                                           <div className="flex flex-col gap-4">
                                               <div className="flex gap-4 items-start text-xs">
                                                   <Truck className="w-5 h-5 text-emerald-500 shrink-0 mt-0.5" />
                                                   <div>
                                                       <p className="font-black text-emerald-500 uppercase">Entrega Digital Instantânea</p>
                                                       <p className="text-white/40 font-medium">Acesso imediato ao código-fonte pelo seu e-mail e painel.</p>
                                                   </div>
                                               </div>
                                               <div className="flex gap-4 items-start text-xs">
                                                   <Award className="w-5 h-5 text-emerald-500 shrink-0 mt-0.5" />
                                                   <div>
                                                       <p className="font-black text-emerald-500 uppercase">Garantia Susanoo de 7 dias</p>
                                                       <p className="text-white/40 font-medium">Receba 100% de reembolso se o produto não corresponder ao anúncio.</p>
                                                   </div>
                                               </div>
                                           </div>
                                       </div>

                                       {/* Botões de Ação estilo Mercado Livre */}
                                       <div className="flex flex-col gap-3 mt-8 border-t border-white/5 pt-8">
                                           <button 
                                               onClick={async () => {
                                                   setCheckoutStatus("loading");
                                                   await new Promise(r => setTimeout(r, 1500));
                                                   setCheckoutStatus("success");
                                               }}
                                               disabled={checkoutStatus === "loading"}
                                               className="w-full py-5 bg-[#3483fa] hover:bg-[#2969c9] text-white font-black text-xs uppercase tracking-widest rounded-2xl hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-2 shadow-lg disabled:opacity-50"
                                           >
                                               {checkoutStatus === "loading" ? (
                                                   <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                               ) : (
                                                   <>Comprar Agora</>
                                               )}
                                           </button>

                                           <button 
                                               onClick={() => {
                                                   const inCart = cart.includes(activeProduct.id);
                                                   if (inCart) {
                                                       setCart(prev => prev.filter(id => id !== activeProduct.id));
                                                   } else {
                                                       setCart(prev => [...prev, activeProduct.id]);
                                                   }
                                               }}
                                               className={`w-full py-5 font-black text-xs uppercase tracking-widest rounded-2xl hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-2 border ${
                                                   cart.includes(activeProduct.id) 
                                                       ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400' 
                                                       : 'bg-white/5 border-white/5 hover:bg-white/10 text-white'
                                               }`}
                                           >
                                               {cart.includes(activeProduct.id) ? (
                                                   <>No Carrinho <Check className="w-4 h-4 text-emerald-400" /></>
                                               ) : (
                                                   <>Adicionar ao Carrinho <ShoppingCart className="w-4 h-4" /></>
                                               )}
                                           </button>
                                       </div>
                                   </div>
                               </>
                           )}
                       </motion.div>
                   </motion.div>
               )}
           </AnimatePresence>
       </div>
   );
}
