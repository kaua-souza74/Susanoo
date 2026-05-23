"use client";
import { useState, useEffect } from "react";
import { Camera, Save, MapPin, Globe, Code2, AtSign, Star, ShieldCheck, Mail, Phone, Plus, X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { supabase } from "@/lib/supabase";

export default function ProfilePage() {
    const [loading, setLoading] = useState(false);
    const [profileType, setProfileType] = useState<"Comércio" | "Desenvolvedor">("Comércio");
    
    const [formData, setFormData] = useState({
        name: "Nome da Empresa / Dev",
        bio: "Uma breve descrição do seu negócio ou as tecnologias que domina.",
        location: "São Paulo, SP",
        website: "https://seusite.com.br",
        github: "",
        twitter: "",
        phone: "(11) 99999-9999",
        email: "contato@empresa.com",
    });

    const [skills, setSkills] = useState<string[]>(["React", "Next.js", "TailwindCSS"]);
    const [newSkill, setNewSkill] = useState("");

    const handleAddSkill = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter' && newSkill.trim() !== '') {
            e.preventDefault();
            if (!skills.includes(newSkill.trim())) {
                setSkills([...skills, newSkill.trim()]);
            }
            setNewSkill("");
        }
    };

    const removeSkill = (sk: string) => {
        setSkills(skills.filter(s => s !== sk));
    };

    return (
        <div className="flex-1 overflow-y-auto w-full bg-background text-foreground transition-colors duration-300 pb-20">
            <div className="w-full relative h-[350px] bg-surface flex items-end px-8 md:px-16 pb-12 border-b border-surface-border group cursor-pointer">
                {/* Header Cover Bg */}
                <div className="absolute inset-0 bg-gradient-to-r from-accent/10 to-transparent pointer-events-none group-hover:from-accent/20 transition-all duration-500" />
                <div className="absolute top-6 right-6 bg-black/50 backdrop-blur-md rounded-xl px-4 py-2 opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-2 text-white text-xs font-bold shadow-lg">
                    <Camera className="w-4 h-4"/> Alterar Banner
                </div>
                
                <div className="relative z-10 flex flex-col sm:flex-row items-center gap-6 w-full max-w-5xl mx-auto translate-y-16">
                    <div className="relative group cursor-pointer">
                        <div className="w-32 h-32 md:w-40 md:h-40 rounded-full bg-background border-4 border-background overflow-hidden relative shadow-2xl flex items-center justify-center">
                            <span className="text-4xl font-black text-foreground/20 uppercase tracking-tighter">PERFIL</span>
                            <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center backdrop-blur-sm z-20">
                                <Camera className="w-8 h-8 text-white mb-2" />
                            </div>
                        </div>
                    </div>
                    
                    <div className="flex-1 text-center sm:text-left">
                        <div className="flex flex-col sm:flex-row sm:items-center gap-3 mb-2">
                            <h1 className="text-3xl md:text-5xl font-black tracking-tight text-foreground">{formData.name}</h1>
                            <span className="bg-accent/10 text-accent border border-accent/20 px-3 py-1 rounded-full text-[10px] font-black uppercase inline-flex items-center gap-1 mx-auto sm:mx-0 w-fit">
                                <ShieldCheck className="w-3 h-3"/> Conta Verificada
                            </span>
                        </div>
                        <p className="text-foreground/40 font-medium text-sm sm:text-base flex items-center justify-center sm:justify-start gap-4">
                            <span className="flex items-center gap-1"><MapPin className="w-4 h-4"/> {formData.location}</span>
                            <span className="flex items-center gap-1"><Star className="w-4 h-4 text-emerald-400 fill-emerald-400/20"/> 5.0 (12 Avaliações)</span>
                        </p>
                    </div>

                    <div className="flex items-center gap-4 mt-4 sm:mt-0">
                        <button className="bg-accent hover:bg-accent/80 text-white font-bold px-8 py-3 rounded-xl transition-all shadow-lg flex items-center gap-2 cursor-pointer hover:scale-[1.02] active:scale-[0.97]">
                            <Save className="w-4 h-4" /> Salvar Perfil
                        </button>
                    </div>
                </div>
            </div>

            <div className="w-full max-w-5xl mx-auto pt-24 px-6 grid grid-cols-1 md:grid-cols-3 gap-8">
                {/* Left Column (Main forms) */}
                <div className="md:col-span-2 space-y-6">
                    <motion.div initial={{opacity: 0, y: 10}} animate={{opacity: 1, y: 0}} className="bg-surface border border-surface-border rounded-3xl p-8 shadow-sm">
                        <h3 className="text-xl font-bold mb-6 flex items-center justify-between">
                            Informações Básicas
                            
                            {/* Type Toggle */}
                            <div className="flex bg-background border border-surface-border rounded-lg p-1">
                                <button onClick={() => setProfileType("Comércio")} className={`px-4 py-1.5 text-xs font-bold rounded-md transition-all cursor-pointer active:scale-95 ${profileType === "Comércio" ? 'bg-surface shadow-sm text-foreground' : 'text-foreground/40 hover:text-foreground'}`}>Comércio</button>
                                <button onClick={() => setProfileType("Desenvolvedor")} className={`px-4 py-1.5 text-xs font-bold rounded-md transition-all cursor-pointer active:scale-95 ${profileType === "Desenvolvedor" ? 'bg-surface shadow-sm text-foreground' : 'text-foreground/40 hover:text-foreground'}`}>Desenvolvedor</button>
                            </div>
                        </h3>
                        
                        <div className="space-y-5">
                            <div>
                                <label className="text-xs font-bold text-foreground/40 uppercase tracking-widest mb-2 block">Nome de Exibição / Empresa</label>
                                <input value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} className="w-full bg-background border border-surface-border rounded-xl px-4 py-3 text-sm font-medium focus:border-accent focus:outline-none transition-colors" />
                            </div>
                            <div>
                                <label className="text-xs font-bold text-foreground/40 uppercase tracking-widest mb-2 block">Biografia / Sobre</label>
                                <textarea value={formData.bio} onChange={e => setFormData({...formData, bio: e.target.value})} className="w-full bg-background border border-surface-border rounded-xl px-4 py-3 text-sm font-medium focus:border-accent focus:outline-none transition-colors min-h-[120px] resize-none" />
                            </div>

                            {/* Skills Builder (Only for Developers) */}
                            <AnimatePresence>
                                {profileType === "Desenvolvedor" && (
                                    <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
                                        <div className="pt-2 pb-2 border-t border-surface-border/50">
                                            <label className="text-xs font-bold text-foreground/40 uppercase tracking-widest mb-2 block flex items-center gap-2">
                                                <Code2 className="w-4 h-4"/> Tecnologias e Linguagens
                                            </label>
                                            
                                            <div className="flex flex-wrap gap-2 mb-3">
                                                {skills.map(sk => (
                                                    <span key={sk} className="flex items-center gap-1.5 bg-background border border-surface-border text-foreground px-3 py-1.5 rounded-lg text-xs font-bold">
                                                        {sk}
                                                        <button onClick={() => removeSkill(sk)} className="text-red-400 hover:scale-110 transition-transform"><X className="w-3 h-3" /></button>
                                                    </span>
                                                ))}
                                            </div>

                                            <div className="relative">
                                                <input 
                                                    value={newSkill} 
                                                    onChange={e => setNewSkill(e.target.value)} 
                                                    onKeyDown={handleAddSkill}
                                                    placeholder="Digite a tecnologia e aperte Enter..." 
                                                    className="w-full bg-background border border-surface-border rounded-xl px-4 py-3 text-sm font-medium focus:border-accent focus:outline-none transition-colors" 
                                                />
                                                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold text-foreground/20 px-2 py-1 bg-surface rounded-md">↵ Enter</span>
                                            </div>
                                        </div>
                                    </motion.div>
                                )}
                            </AnimatePresence>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="text-xs font-bold text-foreground/40 uppercase tracking-widest mb-2 block">Email Público</label>
                                    <div className="relative">
                                        <Mail className="w-4 h-4 absolute left-4 top-1/2 -translate-y-1/2 text-foreground/20" />
                                        <input value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} className="w-full bg-background border border-surface-border rounded-xl pl-11 pr-4 py-3 text-sm font-medium focus:border-accent focus:outline-none transition-colors" />
                                    </div>
                                </div>
                                <div>
                                    <label className="text-xs font-bold text-foreground/40 uppercase tracking-widest mb-2 block">Telefone / WhatsApp</label>
                                    <div className="relative">
                                        <Phone className="w-4 h-4 absolute left-4 top-1/2 -translate-y-1/2 text-foreground/20" />
                                        <input value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} className="w-full bg-background border border-surface-border rounded-xl pl-11 pr-4 py-3 text-sm font-medium focus:border-accent focus:outline-none transition-colors" />
                                    </div>
                                </div>
                            </div>
                        </div>
                    </motion.div>

                    <motion.div initial={{opacity: 0, y: 10}} animate={{opacity: 1, y: 0}} transition={{delay: 0.1}} className="bg-surface border border-surface-border rounded-3xl p-8 shadow-sm">
                        <h3 className="text-xl font-bold mb-6 flex items-center justify-between">Links e Redes Sociais</h3>
                        <div className="space-y-4">
                            <div className="relative">
                                <Globe className="w-4 h-4 absolute left-4 top-1/2 -translate-y-1/2 text-foreground/20" />
                                <input value={formData.website} onChange={e => setFormData({...formData, website: e.target.value})} placeholder="Seu site oficial" className="w-full bg-background border border-surface-border rounded-xl pl-11 pr-4 py-3 text-sm font-medium focus:border-accent focus:outline-none transition-colors" />
                            </div>
                            {profileType === "Desenvolvedor" && (
                                <div className="relative">
                                    <Code2 className="w-4 h-4 absolute left-4 top-1/2 -translate-y-1/2 text-foreground/20" />
                                    <input value={formData.github} onChange={e => setFormData({...formData, github: e.target.value})} placeholder="Seu GitHub (Ex: https://github.com/seunome)" className="w-full bg-background border border-surface-border rounded-xl pl-11 pr-4 py-3 text-sm font-medium focus:border-accent focus:outline-none transition-colors" />
                                </div>
                            )}
                            <div className="relative">
                                <AtSign className="w-4 h-4 absolute left-4 top-1/2 -translate-y-1/2 text-foreground/20" />
                                <input value={formData.twitter} onChange={e => setFormData({...formData, twitter: e.target.value})} placeholder="Seu X / Twitter" className="w-full bg-background border border-surface-border rounded-xl pl-11 pr-4 py-3 text-sm font-medium focus:border-accent focus:outline-none transition-colors" />
                            </div>
                        </div>
                    </motion.div>
                </div>

                {/* Right Column (Side details) */}
                <div className="space-y-6">
                    <motion.div initial={{opacity: 0, y: 10}} animate={{opacity: 1, y: 0}} transition={{delay: 0.2}} className="bg-surface border border-surface-border rounded-3xl p-6 shadow-sm flex flex-col items-center text-center">
                        <div className="w-16 h-16 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center mb-4">
                            <Star className="w-8 h-8 text-emerald-500 fill-emerald-500" />
                        </div>
                        <h4 className="text-xl font-black text-foreground">Selo de Qualidade</h4>
                        <p className="text-sm font-medium text-foreground/40 mt-2 mb-4">
                            Você precisa de mais 3 projetos entregues com nota máxima para se tornar um <strong>Top Rated</strong> na Susanoo.
                        </p>
                        <div className="w-full bg-background rounded-full h-2 mb-2 border border-surface-border">
                            <div className="w-[70%] bg-emerald-500 h-full rounded-full" />
                        </div>
                        <span className="text-xs font-bold text-foreground/40 uppercase tracking-widest">7 / 10 Projetos</span>
                    </motion.div>
                </div>
            </div>
        </div>
    );
}
