"use client";
import { useState } from "react";
import { Search, ChevronDown, Play, ExternalLink } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export default function DiscoverHome() {
   const [filter, setFilter] = useState("All");
   const [search, setSearch] = useState("");

   const mockTemplates = [
      { id: 't1', name: 'Studio FlowSite', category: 'Website', code: 'SFS', type: 'Dark Minimalist' },
      { id: 't2', name: 'Diamond E-Commerce', category: 'E-commerce', code: 'DEC', type: 'High Conversion' },
      { id: 't3', name: 'NexGen Dashboard', category: 'App', code: 'NEX', type: 'SaaS Platform' },
      { id: 't4', name: 'Sphere Analytics', category: '3D Render', code: 'SPH', type: 'WebGL Experience' },
   ];

   const categories = ["All", "Website", "E-commerce", "App", "3D Render"];

   const filtered = mockTemplates.filter(t => 
      (filter === "All" || t.category === filter) &&
      t.name.toLowerCase().includes(search.toLowerCase())
   );

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
                 <span className="font-bold text-[17px] tracking-tight text-foreground flex items-center gap-2">Discover </span>
                 <div className="hidden md:flex items-center gap-2 cursor-pointer text-foreground/50 hover:text-foreground transition-colors">
                    <span className="font-medium text-sm">Galeria de Design</span>
                    <ChevronDown className="w-4 h-4"/>
                 </div>
               </div>
           </div>

           <div className="w-full max-w-6xl mx-auto py-16 px-6 flex flex-col items-center overflow-x-hidden">
               <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, ease: "easeOut" }} className="w-full flex flex-col items-center">
                   <h1 className="text-4xl md:text-5xl font-black mb-5 flex justify-center items-center gap-4 tracking-tighter text-foreground">
                       Galeria Susanoo <span className="bg-surface text-foreground border border-surface-border text-[10px] font-bold px-2.5 py-1 rounded shadow-lg uppercase tracking-widest hidden sm:block">INSPIRE-SE</span>
                   </h1>
                   <p className="text-foreground/60 mb-12 text-center max-w-xl mx-auto text-[15px] font-medium leading-relaxed">
                       Acompanhe as últimas inovações, tendências gráficas e projetos de alto padrão desenvolvidos na nossa agência.
                   </p>
               </motion.div>

               <motion.div initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.4, delay: 0.1 }} className="w-full max-w-2xl relative mb-12">
                   <Search className="w-5 h-5 absolute left-5 top-1/2 -translate-y-1/2 text-foreground/40" />
                   <input 
                      type="text" 
                      value={search}
                      onChange={(e) => setSearch(e.target.value)}
                      placeholder="Pesquisar referências ou modelos (Ex: E-commerce)..."
                      className="w-full bg-surface border border-surface-border shadow-xl rounded-2xl py-4.5 pl-14 pr-6 text-[15px] font-medium text-foreground focus:border-accent/50 focus:ring-1 focus:ring-accent/50 focus:outline-none transition-all placeholder:text-foreground/30"
                   />
               </motion.div>

               <motion.div initial={{opacity: 0}} animate={{opacity:1}} transition={{delay:0.2}} className="flex flex-wrap gap-3 justify-center mb-16">
                   {categories.map((cat) => (
                       <button 
                           key={cat} 
                           onClick={() => setFilter(cat)}
                           className={`px-6 py-2.5 rounded-full text-sm font-bold transition-all ${filter === cat ? 'bg-foreground text-background shadow-lg shadow-foreground/10' : 'bg-surface text-foreground/60 hover:text-foreground hover:bg-foreground/5 border border-surface-border'}`}
                       >
                           {cat}
                       </button>
                   ))}
               </motion.div>

               {/* Showcase Templates - Filtered and Fully Clickable */}
               <motion.div variants={containerVariants} initial="hidden" animate="show" className="w-full grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 xl:grid-cols-2 gap-8">
                   <AnimatePresence>
                   {filtered.length > 0 ? filtered.map(template => (
                        <motion.div variants={itemVariants} initial="hidden" animate="show" exit="exit" layout key={template.id} className="group flex flex-col">
                            <div className="aspect-[16/9] w-full rounded-[24px] bg-surface mb-5 overflow-hidden relative shadow-2xl transition-all duration-500 group-hover:-translate-y-2 border border-surface-border group-hover:border-surface-border/80">
                                <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 mix-blend-overlay"></div>
                                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity z-20 flex gap-4">
                                   <button className="w-12 h-12 bg-white rounded-full flex items-center justify-center text-black hover:scale-110 transition-transform shadow-xl"><Play className="w-5 h-5 ml-1" /></button>
                                   <button className="w-12 h-12 bg-background border border-surface-border rounded-full flex items-center justify-center text-foreground hover:scale-110 transition-transform shadow-xl"><ExternalLink className="w-5 h-5" /></button>
                                </div>
                                <div className="absolute inset-0 bg-black/40 group-hover:bg-black/60 transition-colors z-10"></div>
                                <h3 className="absolute inset-0 flex items-center justify-center text-5xl font-black text-foreground/10 group-hover:text-foreground/20 transition-colors tracking-tighter">
                                   {template.code}
                                </h3>
                            </div>
                            <div className="px-2">
                                <div className="flex items-center justify-between font-bold text-[18px] mb-2 text-foreground">
                                    <h4>{template.name}</h4>
                                    <span className="bg-surface border border-surface-border px-3 py-1 rounded text-foreground/60 text-xs font-semibold uppercase tracking-widest">{template.category}</span>
                                </div>
                                <p className="text-sm font-medium text-foreground/50">{template.type} · Experiência Digital</p>
                            </div>
                        </motion.div>
                   )) : (
                       <motion.div initial={{opacity:0}} animate={{opacity:1}} className="col-span-full py-16 text-center text-foreground/40 font-medium text-lg">
                           Nenhuma interface encontrada para essa categoria.
                       </motion.div>
                   )}
                   </AnimatePresence>
               </motion.div>
           </div>
       </div>
   );
}
