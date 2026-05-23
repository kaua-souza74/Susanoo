"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { MapPin, Star, ShieldCheck, Mail, ArrowLeft, Globe, Code2, AtSign } from "lucide-react";
import { motion } from "framer-motion";

const MOCK_DEVS = [
    { id: 1, name: "Kaua Souza", bio: "Especialista em React, Next.js e E-commerce.", location: "Campinas, SP", rating: 5.0, verified: true, avatar: "KA", skills: ["React", "Next.js", "Tailwind", "TypeScript", "Node.js"] },
    { id: 2, name: "Lucas Dev", bio: "Desenvolvedor Backend e especialista em Automações.", location: "São Paulo, SP", rating: 4.8, verified: true, avatar: "LU", skills: ["Node.js", "Python", "APIs"] },
    { id: 3, name: "Mariana UI/UX", bio: "Designer focada em conversão para pequenos negócios.", location: "Rio de Janeiro, RJ", rating: 4.9, verified: false, avatar: "MA", skills: ["Figma", "UI/UX", "Webflow"] },
    { id: 4, name: "Agência Digital X", bio: "Acelerando seu comércio com sites institucionais impecáveis.", location: "Belo Horizonte, MG", rating: 4.7, verified: true, avatar: "AD", skills: ["Wordpress", "SEO", "Marketing"] }
];

export default function DeveloperProfilePage({ params }: { params: { id: string } }) {
    const router = useRouter();
    const dev = MOCK_DEVS.find(d => d.id === parseInt(params.id)) || MOCK_DEVS[0];

    return (
        <div className="flex-1 overflow-y-auto w-full bg-background text-foreground transition-colors duration-300 pb-20">
            <div className="sticky top-0 z-50 p-6 bg-background/80 backdrop-blur-md border-b border-surface-border flex items-center gap-4">
                <button onClick={() => router.back()} className="w-10 h-10 flex items-center justify-center rounded-xl bg-surface border border-surface-border text-foreground hover:bg-surface-border transition-colors">
                    <ArrowLeft className="w-5 h-5"/>
                </button>
                <div className="font-bold">Perfil Profissional</div>
            </div>

            <div className="w-full relative h-[250px] bg-surface flex items-end px-8 md:px-16 pb-8 border-b border-surface-border">
                <div className="absolute inset-0 bg-gradient-to-r from-accent/10 to-transparent pointer-events-none" />
                
                <div className="relative z-10 flex flex-col sm:flex-row items-center gap-6 w-full max-w-5xl mx-auto translate-y-16">
                    <div className="relative">
                        <div className="w-32 h-32 md:w-40 md:h-40 rounded-full bg-background border-4 border-background overflow-hidden relative shadow-2xl flex items-center justify-center">
                            <span className="text-4xl font-black text-foreground/20 italic uppercase tracking-tighter">{dev.avatar}</span>
                        </div>
                    </div>
                    
                    <div className="flex-1 text-center sm:text-left">
                        <div className="flex flex-col sm:flex-row sm:items-center gap-3 mb-2">
                            <h1 className="text-3xl md:text-5xl font-black tracking-tight text-foreground">{dev.name}</h1>
                            {dev.verified && (
                                <span className="bg-accent/10 text-accent border border-accent/20 px-3 py-1 rounded-full text-[10px] font-black uppercase inline-flex items-center gap-1 mx-auto sm:mx-0 w-fit">
                                    <ShieldCheck className="w-3 h-3"/> Conta Verificada
                                </span>
                            )}
                        </div>
                        <p className="text-foreground/40 font-medium text-sm sm:text-base flex items-center justify-center sm:justify-start gap-4">
                            <span className="flex items-center gap-1"><MapPin className="w-4 h-4"/> {dev.location}</span>
                            <span className="flex items-center gap-1"><Star className="w-4 h-4 text-emerald-400 fill-emerald-400/20"/> {dev.rating}</span>
                        </p>
                    </div>

                    <div className="flex items-center gap-4 mt-4 sm:mt-0">
                         <button 
                            onClick={() => router.push(`/dashboard/chat?devId=${dev.id}&devName=${encodeURIComponent(dev.name)}`)}
                            className="bg-accent hover:bg-accent/80 text-white font-bold px-8 py-3 rounded-xl transition-colors shadow-lg flex items-center gap-2"
                        >
                            <Mail className="w-4 h-4" /> Enviar Mensagem
                        </button>
                    </div>
                </div>
            </div>

            <div className="w-full max-w-5xl mx-auto pt-24 px-6 grid grid-cols-1 md:grid-cols-3 gap-8">
                <div className="md:col-span-2 space-y-6">
                    <motion.div initial={{opacity: 0, y: 10}} animate={{opacity: 1, y: 0}} className="bg-surface border border-surface-border rounded-3xl p-8 shadow-sm">
                        <h3 className="text-xl font-bold mb-4">Sobre o Profissional</h3>
                        <p className="text-foreground/60 leading-relaxed font-medium text-sm mb-8">
                            {dev.bio}
                        </p>

                        <h4 className="text-[11px] font-black text-foreground/40 uppercase tracking-widest mb-4">Tecnologias e Linguagens</h4>
                        <div className="flex flex-wrap gap-2">
                            {dev.skills.map(skill => (
                                <span key={skill} className="bg-background border border-surface-border text-foreground px-4 py-2 rounded-xl text-xs font-bold shadow-sm">
                                    {skill}
                                </span>
                            ))}
                        </div>
                    </motion.div>

                    <motion.div initial={{opacity: 0, y: 10}} animate={{opacity: 1, y: 0}} transition={{delay: 0.1}} className="bg-surface border border-surface-border rounded-3xl p-8 shadow-sm">
                        <h3 className="text-xl font-bold mb-6">Links e Redes</h3>
                        <div className="grid sm:grid-cols-2 gap-4">
                            <div className="flex items-center gap-3 bg-background border border-surface-border p-4 rounded-2xl cursor-pointer hover:border-accent/40 transition-colors">
                                <Globe className="w-5 h-5 text-foreground/40" />
                                <div>
                                    <p className="text-xs font-bold text-foreground/40 uppercase tracking-widest">Site Pessoal</p>
                                    <p className="text-sm font-bold truncate">portfolio.dev.br</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-3 bg-background border border-surface-border p-4 rounded-2xl cursor-pointer hover:border-accent/40 transition-colors">
                                <Code2 className="w-5 h-5 text-foreground/40" />
                                <div>
                                    <p className="text-xs font-bold text-foreground/40 uppercase tracking-widest">Github</p>
                                    <p className="text-sm font-bold truncate">github.com/{dev.avatar}</p>
                                </div>
                            </div>
                        </div>
                    </motion.div>
                </div>

                <div className="space-y-6">
                    <motion.div initial={{opacity: 0, y: 10}} animate={{opacity: 1, y: 0}} transition={{delay: 0.2}} className="bg-surface border border-surface-border rounded-3xl p-6 shadow-sm flex flex-col items-center text-center">
                        <div className="w-16 h-16 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center mb-4">
                            <Star className="w-8 h-8 text-emerald-500 fill-emerald-500" />
                        </div>
                        <h4 className="text-xl font-black text-foreground">Top Rated</h4>
                        <p className="text-sm font-medium text-foreground/40 mt-2">
                           Avaliado com {dev.rating} estrelas na rede Susanoo por clientes satisfeitos.
                        </p>
                    </motion.div>
                </div>
            </div>
        </div>
    );
}
