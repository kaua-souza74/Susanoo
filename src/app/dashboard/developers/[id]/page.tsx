"use client";
import { useEffect, useState, use } from "react";
import { useRouter } from "next/navigation";
import { MapPin, Star, ShieldCheck, Mail, ArrowLeft, Globe, Code2, AtSign, Briefcase, ExternalLink } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { ReviewsSection } from "@/components/ReviewsSection";

const MOCK_DEVS = [
    { 
        id: 1, name: "Kaua Souza", bio: "Especialista em React, Next.js e E-commerce.", location: "Campinas, SP", rating: 5.0, verified: true, 
        avatar: "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=150&q=80", 
        skills: ["React", "Next.js", "Tailwind", "TypeScript", "Node.js"], 
        banner: "https://images.unsplash.com/photo-1555066931-4365d14bab8c?auto=format&fit=crop&w=1500&q=80",
        projects: [
            { id: 1, name: "SaaS Dashboard Premium", category: "React / Next.js", cover_url: "https://images.unsplash.com/photo-1460925895917-afdab827c52f?auto=format&fit=crop&w=600&q=80" },
            { id: 2, name: "E-commerce App", category: "TailwindCSS", cover_url: "https://images.unsplash.com/photo-1498050108023-c5249f4df085?auto=format&fit=crop&w=600&q=80" }
        ]
    },
    { 
        id: 2, name: "Lucas Dev", bio: "Desenvolvedor Backend e especialista em Automações.", location: "São Paulo, SP", rating: 4.8, verified: true, 
        avatar: "https://images.unsplash.com/photo-1527980965255-d3b416303d12?auto=format&fit=crop&w=150&q=80", 
        skills: ["Node.js", "Python", "APIs"], 
        banner: "https://images.unsplash.com/photo-1510915228340-29c85a43dcfe?auto=format&fit=crop&w=1500&q=80",
        projects: [
            { id: 1, name: "API de Integração Contábil", category: "Node.js", cover_url: "https://images.unsplash.com/photo-1551288049-bebda4e38f71?auto=format&fit=crop&w=600&q=80" }
        ]
    },
    { 
        id: 3, name: "Mariana UI/UX", bio: "Designer focada em conversão para pequenos negócios.", location: "Rio de Janeiro, RJ", rating: 4.9, verified: false, 
        avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=150&q=80", 
        skills: ["Figma", "UI/UX", "Webflow"], 
        banner: "https://images.unsplash.com/photo-1561070791-2526d30994b5?auto=format&fit=crop&w=1500&q=80",
        projects: [
            { id: 1, name: "Redesign App de Delivery", category: "UI/UX", cover_url: "https://images.unsplash.com/photo-1561070791-2526d30994b5?auto=format&fit=crop&w=600&q=80" },
            { id: 2, name: "Landing Page Conversiva", category: "Webflow", cover_url: "https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?auto=format&fit=crop&w=600&q=80" }
        ]
    },
    { 
        id: 4, name: "Agência Digital X", bio: "Acelerando seu comércio com sites institucionais impecáveis.", location: "Belo Horizonte, MG", rating: 4.7, verified: true, 
        avatar: "https://images.unsplash.com/photo-1560250097-0b93528c311a?auto=format&fit=crop&w=150&q=80", 
        skills: ["Wordpress", "SEO", "Marketing"], 
        banner: "https://images.unsplash.com/photo-1522071820081-009f0129c71c?auto=format&fit=crop&w=1500&q=80",
        projects: [
            { id: 1, name: "Site Institucional Advogados", category: "Wordpress", cover_url: "https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&w=600&q=80" }
        ]
    },
    { 
        id: 5, name: "Felipe Mobile", bio: "Especialista em aplicativos iOS e Android com Flutter.", location: "Curitiba, PR", rating: 4.9, verified: true, 
        avatar: "https://images.unsplash.com/photo-1599566150163-29194dcaad36?auto=format&fit=crop&w=150&q=80", 
        skills: ["Flutter", "Dart", "Firebase"], 
        banner: "https://images.unsplash.com/photo-1551650975-87deedd944c3?auto=format&fit=crop&w=1500&q=80",
        projects: [
             { id: 1, name: "App Fitness", category: "Flutter", cover_url: "https://images.unsplash.com/photo-1526506114642-9ea400c282ce?auto=format&fit=crop&w=600&q=80" }
        ]
    },
    { 
        id: 6, name: "Juliana Fullstack", bio: "Soluções completas, do banco de dados ao front-end.", location: "Florianópolis, SC", rating: 5.0, verified: true, 
        avatar: "https://images.unsplash.com/photo-1580489944761-15a19d654956?auto=format&fit=crop&w=150&q=80", 
        skills: ["Vue.js", "Laravel", "MySQL"], 
        banner: "https://images.unsplash.com/photo-1498050108023-c5249f4df085?auto=format&fit=crop&w=1500&q=80",
        projects: [
            { id: 1, name: "Sistema de Gestão Escolar", category: "Vue / Laravel", cover_url: "https://images.unsplash.com/photo-1509062522246-3755977927d7?auto=format&fit=crop&w=600&q=80" }
        ]
    }
];

export default function DeveloperProfilePage({ params }: { params: Promise<{ id: string }> }) {
    const router = useRouter();
    const resolvedParams = use(params);
    const dev = MOCK_DEVS.find(d => d.id === parseInt(resolvedParams.id)) || MOCK_DEVS[0];

    return (
        <div className="flex-1 overflow-y-auto w-full bg-background text-foreground transition-colors duration-300 pb-20">
            <div className="sticky top-0 z-50 p-6 bg-background/80 backdrop-blur-md border-b border-surface-border flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <button onClick={() => router.back()} className="w-10 h-10 flex items-center justify-center rounded-xl bg-surface border border-surface-border text-foreground hover:bg-surface-border transition-colors">
                        <ArrowLeft className="w-5 h-5"/>
                    </button>
                    <div className="font-bold tracking-widest uppercase text-xs text-foreground/50">Perfil Profissional</div>
                </div>
            </div>

            <div 
                className="w-full relative h-[350px] bg-surface flex items-end px-8 md:px-16 pb-8 border-b border-surface-border shadow-inner"
                style={{
                    backgroundImage: `url(${dev.banner})`,
                    backgroundSize: 'cover',
                    backgroundPosition: 'center',
                }}
            >
                <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent pointer-events-none" />
                
                <div className="relative z-10 flex flex-col sm:flex-row items-center gap-6 w-full max-w-5xl mx-auto translate-y-20">
                    <motion.div initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ type: "spring", damping: 20 }}>
                        <div className="w-32 h-32 md:w-40 md:h-40 rounded-full bg-background border-4 border-background overflow-hidden relative shadow-2xl flex items-center justify-center">
                            {dev.avatar.startsWith("http") ? (
                                <img src={dev.avatar} alt={dev.name} className="w-full h-full object-cover" />
                            ) : (
                                <span className="text-5xl font-black text-foreground/20 italic uppercase tracking-tighter">{dev.avatar}</span>
                            )}
                        </div>
                    </motion.div>
                    
                    <div className="flex-1 text-center sm:text-left mt-4 sm:mt-0">
                        <motion.div initial={{ x: -20, opacity: 0 }} animate={{ x: 0, opacity: 1 }} transition={{ delay: 0.1 }} className="flex flex-col sm:flex-row sm:items-center gap-3 mb-2">
                            <h1 className="text-4xl md:text-5xl font-black tracking-tight text-white drop-shadow-md">{dev.name}</h1>
                            {dev.verified && (
                                <span className="bg-accent/80 backdrop-blur-sm text-white border border-accent/20 px-3 py-1 rounded-full text-[10px] font-black uppercase inline-flex items-center gap-1 mx-auto sm:mx-0 w-fit shadow-lg">
                                    <ShieldCheck className="w-3 h-3"/> Especialista Verificado
                                </span>
                            )}
                        </motion.div>
                        <motion.p initial={{ x: -20, opacity: 0 }} animate={{ x: 0, opacity: 1 }} transition={{ delay: 0.2 }} className="text-white/80 font-bold text-sm sm:text-base flex items-center justify-center sm:justify-start gap-4 drop-shadow">
                            <span className="flex items-center gap-1"><MapPin className="w-4 h-4"/> {dev.location}</span>
                            <span className="flex items-center gap-1"><Star className="w-4 h-4 text-emerald-400 fill-emerald-400"/> {dev.rating} Top Rated</span>
                        </motion.p>
                    </div>

                    <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ delay: 0.3 }} className="flex items-center gap-4 mt-6 sm:mt-0">
                         <button 
                            onClick={() => router.push(`/dashboard/chat?devId=${dev.id}&devName=${encodeURIComponent(dev.name)}`)}
                            className="bg-white text-black hover:bg-white/90 font-black text-xs uppercase tracking-widest px-8 py-4 rounded-2xl transition-all shadow-xl hover:scale-105 active:scale-95 flex items-center gap-2"
                        >
                            <Mail className="w-4 h-4" /> Entrar em Contato
                        </button>
                    </motion.div>
                </div>
            </div>

            <div className="w-full max-w-5xl mx-auto pt-32 px-6 grid grid-cols-1 md:grid-cols-3 gap-8">
                <div className="md:col-span-2 space-y-6">
                    <motion.div initial={{opacity: 0, y: 20}} animate={{opacity: 1, y: 0}} transition={{ delay: 0.4 }} className="bg-surface border border-surface-border rounded-[2rem] p-8 shadow-sm">
                        <h3 className="text-xl font-bold mb-4 flex items-center gap-2"><Briefcase className="w-5 h-5 text-accent"/> Sobre o Profissional</h3>
                        <p className="text-foreground/70 leading-relaxed font-medium text-sm md:text-base mb-8">
                            {dev.bio}
                        </p>

                        <h4 className="text-[11px] font-black text-foreground/40 uppercase tracking-widest mb-4">Tecnologias de Domínio</h4>
                        <div className="flex flex-wrap gap-2">
                            {dev.skills.map((skill, i) => (
                                <motion.span 
                                    initial={{ opacity: 0, scale: 0.8 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    transition={{ delay: 0.5 + (i * 0.1) }}
                                    key={skill} 
                                    className="bg-background border border-surface-border text-foreground px-4 py-2 rounded-xl text-xs font-bold shadow-sm flex items-center gap-2"
                                >
                                    <div className="w-1.5 h-1.5 rounded-full bg-accent" /> {skill}
                                </motion.span>
                            ))}
                        </div>
                    </motion.div>

                    {/* Projetos Showcase */}
                    <motion.div initial={{opacity: 0, y: 20}} animate={{opacity: 1, y: 0}} transition={{ delay: 0.6 }} className="mt-8">
                        <h3 className="text-xl font-bold mb-6">Projetos Destacados</h3>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                            {(dev.projects || []).map((proj) => (
                                <div key={proj.id} className="group relative rounded-3xl overflow-hidden bg-surface border border-surface-border shadow-lg cursor-pointer">
                                    <div className="aspect-video w-full overflow-hidden">
                                        <img src={proj.cover_url} alt={proj.name} className="w-full h-full object-cover grayscale-[0.3] group-hover:grayscale-0 group-hover:scale-105 transition-all duration-700" />
                                    </div>
                                    <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent opacity-80 group-hover:opacity-60 transition-opacity" />
                                    <div className="absolute bottom-4 left-4 right-4 z-20">
                                        <p className="text-[10px] font-black uppercase text-accent tracking-widest">{proj.category}</p>
                                        <h4 className="text-white font-bold text-lg">{proj.name}</h4>
                                    </div>
                                    <div className="absolute top-4 right-4 z-20 opacity-0 group-hover:opacity-100 transition-opacity scale-90 group-hover:scale-100">
                                        <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center text-black shadow-xl hover:scale-110 transition-transform">
                                            <ExternalLink className="w-4 h-4" />
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </motion.div>

                    <div className="mt-12 pt-8 border-t border-surface-border">
                        <ReviewsSection developerId={dev.id.toString()} />
                    </div>
                </div>

                <div className="space-y-6">
                    <motion.div initial={{opacity: 0, x: 20}} animate={{opacity: 1, x: 0}} transition={{delay: 0.4}} className="bg-surface border border-surface-border rounded-[2rem] p-8 shadow-sm flex flex-col items-center text-center">
                        <div className="w-20 h-20 rounded-full bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center mb-6 relative">
                            <Star className="w-10 h-10 text-emerald-500 fill-emerald-500" />
                            <div className="absolute -inset-2 border border-emerald-500/30 rounded-full animate-ping opacity-20" />
                        </div>
                        <h4 className="text-2xl font-black text-foreground uppercase tracking-tighter">Top Rated</h4>
                        <p className="text-sm font-bold text-foreground/40 mt-3 leading-relaxed">
                           Avaliado com <span className="text-emerald-500">{dev.rating} estrelas</span> na rede Susanoo por clientes altamente satisfeitos.
                        </p>
                    </motion.div>

                    <motion.div initial={{opacity: 0, x: 20}} animate={{opacity: 1, x: 0}} transition={{delay: 0.5}} className="bg-surface border border-surface-border rounded-[2rem] p-8 shadow-sm">
                        <h3 className="text-lg font-bold mb-6">Links Oficiais</h3>
                        <div className="space-y-4">
                            <div className="flex items-center gap-4 bg-background border border-surface-border p-4 rounded-2xl cursor-pointer hover:border-accent/40 transition-colors group">
                                <div className="p-3 rounded-xl bg-surface group-hover:bg-accent/10 transition-colors shrink-0">
                                    <Globe className="w-5 h-5 text-foreground/40 group-hover:text-accent transition-colors" />
                                </div>
                                <div className="min-w-0 flex-1">
                                    <p className="text-[10px] font-black text-foreground/40 uppercase tracking-widest">Site Pessoal</p>
                                    <p className="text-sm font-bold truncate group-hover:text-accent transition-colors">portfolio.{dev.name.toLowerCase().split(' ')[0]}.br</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-4 bg-background border border-surface-border p-4 rounded-2xl cursor-pointer hover:border-accent/40 transition-colors group">
                                <div className="p-3 rounded-xl bg-surface group-hover:bg-accent/10 transition-colors shrink-0">
                                    <Code2 className="w-5 h-5 text-foreground/40 group-hover:text-accent transition-colors" />
                                </div>
                                <div className="min-w-0 flex-1">
                                    <p className="text-[10px] font-black text-foreground/40 uppercase tracking-widest">Github</p>
                                    <p className="text-sm font-bold truncate group-hover:text-accent transition-colors">github.com/{dev.name.toLowerCase().replace(/\s+/g, "")}</p>
                                </div>
                            </div>
                        </div>
                    </motion.div>
                </div>
            </div>
        </div>
    );
}
