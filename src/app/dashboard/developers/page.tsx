"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Search, MapPin, Star, ShieldCheck, Mail, GraduationCap } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { supabase } from "@/lib/supabase";

export default function DevelopersPage() {
    const [search, setSearch] = useState("");
    const [developers, setDevelopers] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const router = useRouter();

    useEffect(() => {
        const fetchDevs = async () => {
            try {
                // Busca desenvolvedores reais cadastrados na tabela profiles do Supabase
                const { data, error } = await supabase
                    .from('profiles')
                    .select('*')
                    .or('role.eq.developer,role.eq.Desenvolvedor,account_type.eq.Desenvolvedor')
                    .order('created_at', { ascending: false });

                if (!error && data) {
                    setDevelopers(data);
                } else {
                    setDevelopers([]);
                }
            } catch (error) {
                console.error("Erro ao buscar desenvolvedores:", error);
                setDevelopers([]);
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
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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
                                        className="px-4 py-2.5 text-xs font-black uppercase tracking-wider bg-foreground text-background rounded-xl hover:opacity-85 transition-all flex items-center gap-1.5 cursor-pointer"
                                    >
                                        <Mail className="w-3.5 h-3.5" /> Contato
                                    </button>
                                    <button 
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            router.push(`/dashboard/developers/${dev.id}`);
                                        }}
                                        className="px-4 py-2.5 text-xs font-bold text-foreground/50 hover:text-foreground rounded-xl border border-surface-border hover:border-foreground/20 transition-all cursor-pointer"
                                    >
                                        Ver Perfil
                                    </button>
                                </div>
                            </motion.div>
                        )) : (
                            <motion.div
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                className="py-16 px-6 bg-surface/50 border border-dashed border-surface-border rounded-3xl flex flex-col items-center text-center gap-3"
                            >
                                <div className="w-14 h-14 bg-surface border border-surface-border rounded-2xl flex items-center justify-center text-foreground/40 shadow-sm">
                                    <Search className="w-6 h-6" />
                                </div>
                                <div className="max-w-md">
                                    <h3 className="text-base font-bold text-foreground mb-1">
                                        {search ? "Nenhum desenvolvedor encontrado" : "Nenhum perfil cadastrado no momento"}
                                    </h3>
                                    <p className="text-xs text-foreground/50 leading-relaxed">
                                        {search 
                                            ? "Tente buscar por outras tecnologias, cidades ou palavras-chave." 
                                            : "Se você é programador ou designer, crie seu perfil na plataforma para receber propostas de comércios de todo o Brasil."}
                                    </p>
                                </div>
                                <div className="flex items-center gap-2.5 mt-2">
                                    {search ? (
                                        <button
                                            onClick={() => setSearch("")}
                                            className="px-4 py-2 bg-foreground text-background rounded-xl text-xs font-bold transition-all cursor-pointer"
                                        >
                                            Limpar Busca
                                        </button>
                                    ) : (
                                        <button
                                            onClick={() => router.push("/sou-desenvolvedor")}
                                            className="px-4 py-2 bg-accent hover:bg-accent/90 text-white rounded-xl text-xs font-bold transition-all shadow-sm cursor-pointer"
                                        >
                                            Criar Perfil de Desenvolvedor
                                        </button>
                                    )}
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>
                    )}
                </div>
            </div>
        </div>
    );
}
