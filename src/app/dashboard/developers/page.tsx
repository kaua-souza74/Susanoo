"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Search, MapPin, Star, ShieldCheck, Mail, ChevronRight, User } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

const MOCK_DEVS = [
    { id: 1, name: "Kaua Souza", bio: "Especialista em React, Next.js e E-commerce.", location: "Campinas, SP", rating: 5.0, verified: true, avatar: "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=150&q=80", skills: ["React", "Next.js", "Tailwind"] },
    { id: 2, name: "Lucas Dev", bio: "Desenvolvedor Backend e especialista em Automações.", location: "São Paulo, SP", rating: 4.8, verified: true, avatar: "https://images.unsplash.com/photo-1527980965255-d3b416303d12?auto=format&fit=crop&w=150&q=80", skills: ["Node.js", "Python", "APIs"] },
    { id: 3, name: "Mariana UI/UX", bio: "Designer focada em conversão para pequenos negócios.", location: "Rio de Janeiro, RJ", rating: 4.9, verified: false, avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=150&q=80", skills: ["Figma", "UI/UX", "Webflow"] },
    { id: 4, name: "Agência Digital X", bio: "Acelerando seu comércio com sites institucionais impecáveis.", location: "Belo Horizonte, MG", rating: 4.7, verified: true, avatar: "https://images.unsplash.com/photo-1560250097-0b93528c311a?auto=format&fit=crop&w=150&q=80", skills: ["Wordpress", "SEO", "Marketing"] },
    { id: 5, name: "Felipe Mobile", bio: "Especialista em aplicativos iOS e Android com Flutter.", location: "Curitiba, PR", rating: 4.9, verified: true, avatar: "https://images.unsplash.com/photo-1599566150163-29194dcaad36?auto=format&fit=crop&w=150&q=80", skills: ["Flutter", "Dart", "Firebase"] },
    { id: 6, name: "Juliana Fullstack", bio: "Soluções completas, do banco de dados ao front-end.", location: "Florianópolis, SC", rating: 5.0, verified: true, avatar: "https://images.unsplash.com/photo-1580489944761-15a19d654956?auto=format&fit=crop&w=150&q=80", skills: ["Vue.js", "Laravel", "MySQL"] }
];

export default function DevelopersPage() {
    const [search, setSearch] = useState("");
    const router = useRouter();

    const filteredDevs = MOCK_DEVS.filter(dev => 
        dev.name.toLowerCase().includes(search.toLowerCase()) || 
        dev.skills.some(s => s.toLowerCase().includes(search.toLowerCase()))
    );

    return (
        <div className="flex-1 overflow-y-auto w-full bg-background text-foreground transition-colors duration-300">
            <div className="flex items-center justify-between p-4 px-8 border-b border-surface-border bg-background/80 backdrop-blur-md sticky top-0 z-50">
                <div className="flex items-center gap-6">
                    <span className="font-bold text-[17px] tracking-tight text-foreground flex items-center gap-2">Profissionais </span>
                </div>
            </div>

            <div className="w-full max-w-6xl mx-auto py-12 px-6 flex flex-col items-center">
                <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} className="w-full flex flex-col items-center text-center">
                    <h1 className="text-4xl md:text-5xl font-black mb-5 tracking-tighter text-foreground">
                        Encontre o <span className="text-accent italic">Especialista</span> Ideal
                    </h1>
                    <p className="text-foreground/40 mb-10 max-w-xl text-[16px] font-bold leading-relaxed">
                        Conecte-se com desenvolvedores e designers de ponta. Escolha quem vai tirar o seu projeto do papel baseando-se em reputação e habilidades reais.
                    </p>
                </motion.div>

                <motion.div initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} className="w-full max-w-2xl relative mb-12">
                    <Search className="w-5 h-5 absolute left-5 top-1/2 -translate-y-1/2 text-foreground/20" />
                    <input 
                       type="text" 
                       value={search}
                       onChange={(e) => setSearch(e.target.value)}
                       placeholder="Buscar por nome, habilidade (Ex: React, Figma)..."
                       className="w-full bg-surface/50 border border-surface-border shadow-2xl rounded-[32px] py-5 pl-14 pr-6 text-[15px] font-bold text-foreground focus:border-accent/50 focus:outline-none transition-all placeholder:text-foreground/20"
                    />
                </motion.div>

                <div className="w-full grid grid-cols-1 md:grid-cols-2 gap-6">
                    <AnimatePresence>
                        {filteredDevs.map((dev, i) => (
                            <motion.div 
                                key={dev.id}
                                initial={{opacity: 0, y: 20}}
                                animate={{opacity: 1, y: 0}}
                                transition={{delay: i * 0.1}}
                                onClick={() => router.push(`/dashboard/developers/${dev.id}`)}
                                className="bg-surface border border-surface-border rounded-3xl p-6 hover:border-accent/40 transition-colors group cursor-pointer flex flex-col sm:flex-row gap-6 shadow-sm hover:shadow-lg hover:shadow-accent/5"
                            >
                                <div className="w-20 h-20 rounded-2xl bg-background border border-surface-border flex items-center justify-center shrink-0 overflow-hidden">
                                    {dev.avatar.startsWith("http") ? (
                                        <img src={dev.avatar} alt={dev.name} className="w-full h-full object-cover" />
                                    ) : (
                                        <span className="text-2xl font-black text-foreground/20 italic">{dev.avatar}</span>
                                    )}
                                </div>
                                <div className="flex-1">
                                    <div className="flex items-start justify-between mb-2">
                                        <div>
                                            <h3 className="text-xl font-bold flex items-center gap-2">
                                                {dev.name}
                                                {dev.verified && <ShieldCheck className="w-4 h-4 text-emerald-500" />}
                                            </h3>
                                            <p className="text-sm font-medium text-foreground/40 flex items-center gap-1 mt-1">
                                                <MapPin className="w-3 h-3"/> {dev.location}
                                            </p>
                                        </div>
                                        <div className="flex items-center gap-1 bg-yellow-500/10 text-yellow-500 px-2 py-1 rounded-lg">
                                            <Star className="w-3 h-3 fill-yellow-500" />
                                            <span className="text-xs font-bold">{dev.rating}</span>
                                        </div>
                                    </div>
                                    <p className="text-sm text-foreground/60 mb-4">{dev.bio}</p>
                                    
                                    <div className="flex flex-wrap gap-2 mb-4">
                                        {dev.skills.map(skill => (
                                            <span key={skill} className="bg-foreground/5 text-foreground/60 px-2.5 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider border border-surface-border">
                                                {skill}
                                            </span>
                                        ))}
                                    </div>

                                    <button 
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            router.push(`/dashboard/chat?devId=${dev.id}&devName=${encodeURIComponent(dev.name)}`);
                                        }}
                                        className="w-full py-3 rounded-xl bg-background border border-surface-border group-hover:bg-accent group-hover:border-accent group-hover:text-white transition-all font-bold text-sm flex items-center justify-center gap-2"
                                    >
                                        <Mail className="w-4 h-4" /> Entrar em Contato
                                    </button>
                                </div>
                            </motion.div>
                        ))}
                    </AnimatePresence>
                </div>
            </div>
        </div>
    );
}
