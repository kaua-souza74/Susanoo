"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Search, MapPin, Star, ShieldCheck, Mail, GraduationCap } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { supabase } from "@/lib/supabase";

const MOCK_DEVS = [
    {
      id: 1,
      name: "Kaua Souza",
      role: "Desenvolvedor Fullstack",
      bio: "Especialista em React, Next.js e E-commerce com foco em performance e conversão.",
      location: "Campinas, SP",
      rating: 5.0,
      reviews: 18,
      verified: true,
      education: "Tecnólogo em Análise e Des. de Sistemas — UNICAMP",
      avatar: "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=150&q=80",
      skills: ["React", "Next.js", "TailwindCSS", "Supabase"]
    },
    {
      id: 2,
      name: "Lucas Dev",
      role: "Desenvolvedor Backend",
      bio: "Especialista em automações, integrações de API e arquitetura de microsserviços.",
      location: "São Paulo, SP",
      rating: 4.8,
      reviews: 11,
      verified: true,
      education: "Bacharel em Ciência da Computação — USP",
      avatar: "https://images.unsplash.com/photo-1527980965255-d3b416303d12?auto=format&fit=crop&w=150&q=80",
      skills: ["Node.js", "Python", "APIs REST", "Docker"]
    },
    {
      id: 3,
      name: "Mariana UI/UX",
      role: "Designer & Desenvolvedor Frontend",
      bio: "Design focado em conversão e experiências digitais para pequenos e médios negócios.",
      location: "Rio de Janeiro, RJ",
      rating: 4.9,
      reviews: 23,
      verified: false,
      education: "Bacharel em Design Digital — ESPM RJ",
      avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=150&q=80",
      skills: ["Figma", "UI/UX", "Webflow", "Framer"]
    },
    {
      id: 4,
      name: "Agência Digital X",
      role: "Agência",
      bio: "Acelerando o crescimento digital de comércios com sites institucionais e SEO avançado.",
      location: "Belo Horizonte, MG",
      rating: 4.7,
      reviews: 34,
      verified: true,
      education: "Equipe com formação em Marketing Digital e Engenharia de Software",
      avatar: "https://images.unsplash.com/photo-1560250097-0b93528c311a?auto=format&fit=crop&w=150&q=80",
      skills: ["WordPress", "SEO", "Marketing", "Google Ads"]
    },
    {
      id: 5,
      name: "Felipe Mobile",
      role: "Desenvolvedor Mobile",
      bio: "Especialista em aplicativos iOS e Android com Flutter. Entrega em média em 30 dias.",
      location: "Curitiba, PR",
      rating: 4.9,
      reviews: 9,
      verified: true,
      education: "Bacharel em Sistemas de Informação — PUCPR",
      avatar: "https://images.unsplash.com/photo-1599566150163-29194dcaad36?auto=format&fit=crop&w=150&q=80",
      skills: ["Flutter", "Dart", "Firebase", "iOS"]
    },
    {
      id: 6,
      name: "Juliana Fullstack",
      role: "Desenvolvedor Fullstack",
      bio: "Soluções completas, do banco de dados ao front-end. Prefiro trabalhar com startups em fase inicial.",
      location: "Florianópolis, SC",
      rating: 5.0,
      reviews: 15,
      verified: true,
      education: "Mestra em Computação Aplicada — UFSC",
      avatar: "https://images.unsplash.com/photo-1580489944761-15a19d654956?auto=format&fit=crop&w=150&q=80",
      skills: ["Vue.js", "Laravel", "MySQL", "AWS"]
    }
];

export default function DevelopersPage() {
    const [search, setSearch] = useState("");
    const [developers, setDevelopers] = useState<any[]>(MOCK_DEVS);
    const [loading, setLoading] = useState(true);
    const router = useRouter();

    useEffect(() => {
        const fetchDevs = async () => {
            try {
                // Tenta buscar desenvolvedores reais no banco de dados
                const { data, error } = await supabase
                    .from('profiles')
                    .select('*')
                    .eq('role', 'developer');

                if (!error && data && data.length > 0) {
                    setDevelopers(data);
                } else {
                    // Fallback para mock data
                    setDevelopers(MOCK_DEVS);
                }
            } catch (error) {
                setDevelopers(MOCK_DEVS);
            } finally {
                setLoading(false);
            }
        };

        fetchDevs();
    }, []);

    const filteredDevs = developers.filter(dev => 
        (dev.name || "").toLowerCase().includes(search.toLowerCase()) || 
        (dev.skills || []).some((s: string) => s.toLowerCase().includes(search.toLowerCase())) ||
        (dev.role || "Desenvolvedor").toLowerCase().includes(search.toLowerCase())
    );

    return (
        <div className="flex-1 overflow-y-auto w-full bg-background text-foreground transition-colors duration-300">
            {/* Header */}
            <div className="flex items-center justify-between p-4 px-8 border-b border-surface-border bg-background/80 backdrop-blur-md sticky top-0 z-50">
                <span className="font-black text-[17px] tracking-tight text-foreground">Profissionais</span>
            </div>

            <div className="w-full max-w-5xl mx-auto py-12 px-6">
                {/* Título e Subtítulo */}
                <motion.div
                    initial={{ opacity: 0, y: 15 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mb-12"
                >
                    <h1 className="text-3xl md:text-4xl font-black tracking-tight text-foreground mb-3">
                        Encontre o profissional ideal para o seu projeto.
                    </h1>
                    <p className="text-foreground/50 text-[15px] font-medium leading-relaxed max-w-2xl">
                        Escolha entre desenvolvedores e designers qualificados, compare perfis, avaliações e especialidades, e encontre quem melhor atende às necessidades do seu negócio.
                    </p>
                </motion.div>

                {/* Busca */}
                <motion.div
                    initial={{ opacity: 0, scale: 0.98 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="relative mb-10"
                >
                    <Search className="w-5 h-5 absolute left-5 top-1/2 -translate-y-1/2 text-foreground/25" />
                    <input 
                       type="text" 
                       value={search}
                       onChange={(e) => setSearch(e.target.value)}
                       placeholder="Buscar por nome, especialidade (Ex: React, Figma)..."
                       className="w-full bg-surface border border-surface-border rounded-2xl py-4 pl-14 pr-6 text-[15px] font-medium text-foreground focus:border-accent/50 focus:outline-none transition-all placeholder:text-foreground/25"
                    />
                </motion.div>

                {/* Grade de Profissionais */}
                <div className="flex flex-col gap-4">
                    {loading ? (
                        <div className="flex items-center justify-center py-20">
                            <div className="w-8 h-8 border-2 border-surface-border border-t-accent rounded-full animate-spin" />
                        </div>
                    ) : (
                        <AnimatePresence>
                            {filteredDevs.length > 0 ? filteredDevs.map((dev, i) => (
                                <motion.div 
                                    key={dev.id}
                                    initial={{ opacity: 0, y: 15 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0 }}
                                    transition={{ delay: i * 0.06 }}
                                    onClick={() => router.push(`/dashboard/developers/${dev.id}`)}
                                    className="bg-surface border border-surface-border rounded-2xl p-6 hover:border-foreground/20 transition-colors group cursor-pointer flex flex-col sm:flex-row gap-5 shadow-sm"
                                >
                                {/* Avatar */}
                                <div className="w-16 h-16 sm:w-14 sm:h-14 rounded-xl bg-background border border-surface-border flex items-center justify-center shrink-0 overflow-hidden">
                                    {dev.avatar_url || dev.avatar ? (
                                        <img src={dev.avatar_url || dev.avatar} alt={dev.name} className="w-full h-full object-cover" />
                                    ) : (
                                        <span className="text-xl font-black text-foreground/20 italic">{dev.name.substring(0, 2).toUpperCase()}</span>
                                    )}
                                </div>

                                {/* Corpo */}
                                <div className="flex-1 min-w-0">
                                    <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-2 mb-2">
                                        <div>
                                            <h3 className="text-base font-black flex items-center gap-2 text-foreground">
                                                {dev.name}
                                                {dev.verified && <ShieldCheck className="w-4 h-4 text-emerald-500 shrink-0" />}
                                            </h3>
                                            <p className="text-xs font-bold text-foreground/40 mt-0.5">{dev.role || "Desenvolvedor"}</p>
                                        </div>

                                        <div className="flex items-center gap-1.5 bg-amber-500/5 border border-amber-500/10 px-2.5 py-1.5 rounded-xl shrink-0">
                                            <Star className="w-3.5 h-3.5 fill-amber-500 text-amber-500" />
                                            <span className="text-xs font-black text-foreground">{dev.rating || "5.0"}</span>
                                            <span className="text-[10px] text-foreground/40 font-medium">({dev.reviews || 0})</span>
                                        </div>
                                    </div>

                                    <p className="text-sm text-foreground/60 mb-3 leading-relaxed">{dev.bio || "Desenvolvedor na plataforma Susanoo."}</p>

                                    {/* Formação Acadêmica — sutil, não em destaque */}
                                    <p className="text-[11px] text-foreground/35 font-medium flex items-center gap-1.5 mb-3">
                                        <GraduationCap className="w-3.5 h-3.5 shrink-0" />
                                        {dev.education || "Formação não informada"}
                                    </p>

                                    <div className="flex flex-wrap items-center justify-between gap-3">
                                        <div className="flex flex-wrap gap-1.5">
                                            {(dev.skills || []).map((skill: string) => (
                                                <span key={skill} className="bg-foreground/5 text-foreground/55 px-2 py-1 rounded text-[10px] font-bold uppercase tracking-wider border border-surface-border">
                                                    {skill}
                                                </span>
                                            ))}
                                        </div>
                                        <div className="flex items-center gap-2 text-[11px] text-foreground/40 font-medium shrink-0">
                                            <MapPin className="w-3.5 h-3.5" /> {dev.location || "Remoto"}
                                        </div>
                                    </div>
                                </div>

                                {/* CTA */}
                                <div className="flex sm:flex-col items-center sm:items-end justify-end gap-2 sm:justify-between shrink-0">
                                    <button 
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            router.push(`/dashboard/chat?devId=${dev.id}&devName=${encodeURIComponent(dev.name)}`);
                                        }}
                                        className="px-4 py-2.5 text-xs font-black uppercase tracking-wider bg-foreground text-background rounded-xl hover:opacity-85 transition-all flex items-center gap-1.5"
                                    >
                                        <Mail className="w-3.5 h-3.5" /> Contato
                                    </button>
                                    <button 
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            router.push(`/dashboard/developers/${dev.id}`);
                                        }}
                                        className="px-4 py-2.5 text-xs font-bold text-foreground/50 hover:text-foreground rounded-xl border border-surface-border hover:border-foreground/20 transition-all"
                                    >
                                        Ver Perfil
                                    </button>
                                </div>
                            </motion.div>
                        )) : (
                            <motion.div
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                className="py-24 flex flex-col items-center text-center"
                            >
                                <div className="w-16 h-16 bg-surface border border-surface-border rounded-2xl flex items-center justify-center mb-5">
                                    <Search className="w-6 h-6 text-foreground/20" />
                                </div>
                                <h3 className="text-base font-bold text-foreground/40 mb-1">Nenhum profissional encontrado.</h3>
                                <p className="text-sm text-foreground/30">Tente buscar por outra especialidade ou nome.</p>
                            </motion.div>
                        )}
                    </AnimatePresence>
                    )}
                </div>
            </div>
        </div>
    );
}
