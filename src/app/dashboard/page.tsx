"use client";
import { useEffect, useState } from "react";
import { Search, ChevronDown, Play, ExternalLink, Globe } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { supabase } from "@/lib/supabase";

export default function DiscoverHome() {
   const [filter, setFilter] = useState("All");
   const [search, setSearch] = useState("");
   const [projects, setProjects] = useState<any[]>([]);
   const [loading, setLoading] = useState(true);

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

   const categories = ["All", "Website", "E-commerce", "App", "3D Render"];

   const filtered = projects.filter(proj => 
      (filter === "All" || (proj.category || 'Website') === filter) &&
      proj.name.toLowerCase().includes(search.toLowerCase())
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
               <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, ease: "easeOut" }} className="w-full flex flex-col items-center text-center">
                   <h1 className="text-4xl md:text-5xl font-black mb-5 flex justify-center items-center gap-4 tracking-tighter text-foreground">
                       Galeria Susanoo <span className="bg-accent/10 text-accent border border-accent/20 text-[10px] font-bold px-2.5 py-1 rounded shadow-lg uppercase tracking-[0.3em] hidden sm:block italic">Exclusive Works</span>
                   </h1>
                   <p className="text-foreground/40 mb-12 max-w-xl text-[16px] font-bold leading-relaxed italic">
                       Explore as últimas inovações e projetos de alto impacto publicados pela nossa rede de operações.
                   </p>
               </motion.div>

               <motion.div initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.4, delay: 0.1 }} className="w-full max-w-2xl relative mb-12">
                   <Search className="w-5 h-5 absolute left-5 top-1/2 -translate-y-1/2 text-foreground/20" />
                   <input 
                      type="text" 
                      value={search}
                      onChange={(e) => setSearch(e.target.value)}
                      placeholder="Pesquisar referências (Kim Nostalgia, E-commerce)..."
                      className="w-full bg-surface/50 border border-surface-border shadow-2xl rounded-[32px] py-6 pl-14 pr-6 text-[15px] font-bold text-foreground focus:border-accent/50 focus:outline-none transition-all placeholder:text-foreground/20"
                   />
               </motion.div>

               <motion.div initial={{opacity: 0}} animate={{opacity:1}} transition={{delay:0.2}} className="flex flex-wrap gap-4 justify-center mb-16">
                   {categories.map((cat) => (
                       <button 
                           key={cat} 
                           onClick={() => setFilter(cat)}
                           className={`px-8 py-3 rounded-2xl text-xs font-black uppercase tracking-widest transition-all ${filter === cat ? 'bg-accent text-white shadow-xl shadow-accent/20 scale-105' : 'bg-surface text-foreground/40 hover:text-foreground hover:bg-surface/80 border border-surface-border'}`}
                       >
                           {cat}
                       </button>
                   ))}
               </motion.div>

               {/* Showcase Templates - Real Data from Projects */}
               <motion.div variants={containerVariants} initial="hidden" animate="show" className="w-full grid grid-cols-1 md:grid-cols-2 gap-12">
                   <AnimatePresence mode="popLayout">
                   {filtered.length > 0 ? filtered.map(proj => (
                        <motion.div variants={itemVariants} layout key={proj.id} className="group flex flex-col">
                            <div className="aspect-[16/9] w-full rounded-[40px] bg-[#050505] mb-6 overflow-hidden relative shadow-3xl transition-all duration-700 group-hover:-translate-y-4 border border-surface-border group-hover:border-accent/30 cursor-pointer">
                                
                                {proj.cover_url ? (
                                    <img src={proj.cover_url} className="absolute inset-0 w-full h-full object-cover grayscale group-hover:grayscale-0 transition-all duration-1000" alt={proj.name}/>
                                ) : (
                                    <div className="absolute inset-0 flex items-center justify-center text-7xl font-black text-foreground/5 opacity-20 uppercase tracking-tighter italic">
                                       {proj.name.substring(0,3)}
                                    </div>
                                )}
                                
                                <div className="absolute inset-0 bg-gradient-to-t from-black via-black/20 to-transparent opacity-80 group-hover:opacity-60 transition-opacity z-10" />
                                
                                <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-500 z-20 gap-4 scale-90 group-hover:scale-100">
                                   <button 
                                      onClick={() => {
                                        if (proj.deploy_url) window.open(proj.deploy_url.startsWith('http') ? proj.deploy_url : `https://${proj.deploy_url}`, '_blank')
                                      }}
                                      className="w-16 h-16 bg-white rounded-full flex items-center justify-center text-black hover:scale-110 active:scale-90 transition-transform shadow-2xl"
                                   >
                                      <ExternalLink className="w-6 h-6" />
                                   </button>
                                </div>
                            </div>
                            <div className="px-6">
                                <div className="flex items-center justify-between mb-2">
                                    <h4 className="text-2xl font-black text-white italic tracking-tighter uppercase">{proj.name}</h4>
                                    <span className="bg-accent/5 border border-accent/10 px-3 py-1 rounded-full text-accent text-[10px] font-black uppercase tracking-widest italic">{proj.category || 'Website'}</span>
                                </div>
                                <p className="text-sm font-bold text-foreground/40 italic">Inovação Digital · Susanoo Production</p>
                            </div>
                        </motion.div>
                   )) : (
                        <motion.div initial={{opacity:0}} animate={{opacity:1}} className="col-span-full py-32 text-center">
                            <div className="inline-flex p-6 rounded-full bg-surface mb-6">
                                <Search className="w-10 h-10 text-foreground/10" />
                            </div>
                            <h3 className="text-xl font-bold text-foreground/30 italic">Nenhum projeto encontrado nesta categoria.</h3>
                        </motion.div>
                   )}
                   </AnimatePresence>
               </motion.div>
           </div>
       </div>
   );
}
