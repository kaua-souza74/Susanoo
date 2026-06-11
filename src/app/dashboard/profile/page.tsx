"use client";
import { useState, useEffect, useRef } from "react";
import { Camera, Save, MapPin, Globe, Code2, AtSign, Star, ShieldCheck, Mail, Phone, Plus, X, Heart, ExternalLink } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { supabase } from "@/lib/supabase";

export default function ProfilePage() {
    const [loading, setLoading] = useState(false);
    const [profileType, setProfileType] = useState<"Comércio" | "Desenvolvedor">("Comércio");
    const [activeTab, setActiveTab] = useState<"Informações" | "Curtidos">("Informações");
    const [toastMessage, setToastMessage] = useState<string | null>(null);

    useEffect(() => {
        const checkType = () => {
            const savedType = localStorage.getItem("susanoo_profile_type");
            if (savedType === "Desenvolvedor" || savedType === "Comércio") {
                setProfileType(savedType);
            }
        };
        checkType();
        window.addEventListener("profileTypeChanged", checkType);
        return () => window.removeEventListener("profileTypeChanged", checkType);
    }, []);
    
    const showToast = (msg: string) => {
        setToastMessage(msg);
        setTimeout(() => setToastMessage(null), 3000);
    };
    
    const [formData, setFormData] = useState({
        name: "Nome da Empresa / Dev",
        bio: "Uma breve descrição do seu negócio ou as tecnologias que domina.",
        location: "São Paulo, SP",
        website: "https://seusite.com.br",
        github: "",
        twitter: "",
        phone: "(11) 99999-9999",
        email: "contato@empresa.com",
        avatar_url: "",
        banner_url: "",
    });

    const [skills, setSkills] = useState<string[]>(["React", "Next.js", "TailwindCSS"]);
    const [newSkill, setNewSkill] = useState("");
    const [likedProjects, setLikedProjects] = useState<any[]>([]);

    const avatarInputRef = useRef<HTMLInputElement>(null);
    const bannerInputRef = useRef<HTMLInputElement>(null);

    // Mock initial fetch
    useEffect(() => {
        // Fetch Liked projects (Mock for now)
        setLikedProjects([
            { id: 1, name: "SaaS Dashboard Next.js", cover_url: "", deploy_url: "https://example.com" },
            { id: 2, name: "Landing Page Premium", cover_url: "", deploy_url: "https://example.com" },
        ]);
    }, []);

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

    const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>, type: 'avatar' | 'banner') => {
        const file = e.target.files?.[0];
        if (!file) return;

        try {
            setLoading(true);
            const fileExt = file.name.split('.').pop();
            const fileName = `${Math.random()}.${fileExt}`;
            const filePath = `${type}s/${fileName}`;

            // Uploading to Supabase 'project_files' bucket (Assuming profiles bucket might not exist yet)
            const { error: uploadError, data } = await supabase.storage
                .from('project_files')
                .upload(filePath, file);

            if (uploadError) throw uploadError;

            const { data: { publicUrl } } = supabase.storage
                .from('project_files')
                .getPublicUrl(filePath);

            setFormData(prev => ({
                ...prev,
                [type === 'avatar' ? 'avatar_url' : 'banner_url']: publicUrl
            }));
            
            showToast(`${type === 'avatar' ? 'Foto de perfil' : 'Banner'} atualizado com sucesso!`);
        } catch (error) {
            console.error(error);
            showToast("Erro ao fazer upload da imagem.");
        } finally {
            setLoading(false);
        }
    };

    const handleSaveProfile = async () => {
        setLoading(true);
        try {
            // Update profile logic here (Mock for now, normally an update to 'profiles' table)
            // const { data: { user } } = await supabase.auth.getUser();
            // if (user) {
            //     await supabase.from('profiles').update({ name: formData.name, avatar_url: formData.avatar_url, banner_url: formData.banner_url }).eq('id', user.id);
            // }
            await new Promise(r => setTimeout(r, 1000));
            showToast("Perfil salvo com sucesso!");
        } catch (error) {
            showToast("Erro ao salvar o perfil.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="flex-1 overflow-y-auto w-full bg-background text-foreground transition-colors duration-300 pb-20">
            {/* Banner Section */}
            <div 
                className="w-full relative h-[350px] bg-surface flex items-end px-8 md:px-16 pb-12 border-b border-surface-border group cursor-pointer"
                style={{ 
                    backgroundImage: formData.banner_url ? `url(${formData.banner_url})` : 'none',
                    backgroundSize: 'cover',
                    backgroundPosition: 'center'
                }}
            >
                {/* Header Cover Bg */}
                <div className="absolute inset-0 bg-gradient-to-r from-accent/10 to-transparent pointer-events-none group-hover:from-accent/20 transition-all duration-500" />
                <div className="absolute inset-0 bg-black/40 pointer-events-none" />

                <input type="file" ref={bannerInputRef} hidden accept="image/*" onChange={(e) => handleImageUpload(e, 'banner')} />
                <button 
                    onClick={() => bannerInputRef.current?.click()}
                    className="absolute top-6 right-6 bg-black/50 backdrop-blur-md rounded-xl px-4 py-2 opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-2 text-white text-xs font-bold shadow-lg z-20 hover:scale-105 active:scale-95"
                >
                    <Camera className="w-4 h-4"/> Alterar Banner
                </button>
                
                <div className="relative z-10 flex flex-col sm:flex-row items-center gap-6 w-full max-w-5xl mx-auto translate-y-16">
                    <div className="relative group cursor-pointer" onClick={() => avatarInputRef.current?.click()}>
                        <input type="file" ref={avatarInputRef} hidden accept="image/*" onChange={(e) => handleImageUpload(e, 'avatar')} />
                        <div className="w-32 h-32 md:w-40 md:h-40 rounded-full bg-background border-4 border-background overflow-hidden relative shadow-2xl flex items-center justify-center">
                            {formData.avatar_url ? (
                                <img src={formData.avatar_url} alt="Avatar" className="w-full h-full object-cover" />
                            ) : (
                                <span className="text-4xl font-black text-foreground/20 uppercase tracking-tighter">PERFIL</span>
                            )}
                            <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center backdrop-blur-sm z-20">
                                <Camera className="w-8 h-8 text-white mb-2" />
                            </div>
                        </div>
                    </div>
                    
                    <div className="flex-1 text-center sm:text-left mt-4 sm:mt-0">
                        <div className="flex flex-col sm:flex-row sm:items-center gap-3 mb-2">
                            <h1 className="text-3xl md:text-5xl font-black tracking-tight text-white drop-shadow-lg">{formData.name}</h1>
                            <span className="bg-accent/80 backdrop-blur-md text-white border border-accent/20 px-3 py-1 rounded-full text-[10px] font-black uppercase inline-flex items-center gap-1 mx-auto sm:mx-0 w-fit">
                                <ShieldCheck className="w-3 h-3"/> Conta Verificada
                            </span>
                        </div>
                        <p className="text-white/80 drop-shadow-md font-medium text-sm sm:text-base flex items-center justify-center sm:justify-start gap-4">
                            <span className="flex items-center gap-1"><MapPin className="w-4 h-4"/> {formData.location}</span>
                            <span className="flex items-center gap-1"><Star className="w-4 h-4 text-emerald-400 fill-emerald-400"/> 5.0 (12 Avaliações)</span>
                        </p>
                    </div>

                    <div className="flex items-center gap-4 mt-6 sm:mt-0">
                        <button onClick={handleSaveProfile} disabled={loading} className="bg-accent hover:bg-accent/80 text-white font-bold px-8 py-3 rounded-xl transition-all shadow-lg flex items-center gap-2 cursor-pointer hover:scale-[1.02] active:scale-[0.97] disabled:opacity-50">
                            {loading ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <Save className="w-4 h-4" />}
                            {loading ? "Salvando..." : "Salvar Perfil"}
                        </button>
                    </div>
                </div>
            </div>

            {/* Content Section */}
            <div className="w-full max-w-5xl mx-auto pt-24 px-6 flex flex-col gap-8">
                {/* Tabs */}
                <div className="flex items-center gap-4 border-b border-surface-border pb-4">
                    <button 
                        onClick={() => setActiveTab("Informações")}
                        className={`text-sm font-black uppercase tracking-widest px-4 py-2 transition-colors relative ${activeTab === "Informações" ? "text-foreground" : "text-foreground/40 hover:text-foreground/80"}`}
                    >
                        Informações
                        {activeTab === "Informações" && (
                            <motion.div layoutId="profile-tab" className="absolute bottom-[-17px] left-0 right-0 h-0.5 bg-accent" />
                        )}
                    </button>
                    <button 
                        onClick={() => setActiveTab("Curtidos")}
                        className={`text-sm font-black uppercase tracking-widest px-4 py-2 transition-colors relative ${activeTab === "Curtidos" ? "text-foreground" : "text-foreground/40 hover:text-foreground/80"}`}
                    >
                        Curtidos
                        {activeTab === "Curtidos" && (
                            <motion.div layoutId="profile-tab" className="absolute bottom-[-17px] left-0 right-0 h-0.5 bg-accent" />
                        )}
                    </button>
                </div>

                <AnimatePresence mode="wait">
                    {activeTab === "Informações" ? (
                        <motion.div key="informacoes" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="grid grid-cols-1 md:grid-cols-3 gap-8">
                            {/* Left Column (Main forms) */}
                            <div className="md:col-span-2 space-y-6">
                                <div className="bg-surface border border-surface-border rounded-3xl p-8 shadow-sm">
                                    <h3 className="text-xl font-bold mb-6 flex items-center justify-between">
                                        Informações Básicas
                                        
                                        {/* Type Toggle Information */}
                                        <span className="text-[11px] font-medium text-foreground/40 bg-background px-3 py-1.5 rounded-lg border border-surface-border">
                                            Você pode mudar o estilo de conta nas <a href="/dashboard/settings" className="text-accent hover:underline font-bold">configurações</a>.
                                        </span>
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
                                </div>

                                <div className="bg-surface border border-surface-border rounded-3xl p-8 shadow-sm">
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
                                </div>
                            </div>

                            {/* Right Column (Side details) */}
                            <div className="space-y-6">
                                <div className="bg-surface border border-surface-border rounded-3xl p-6 shadow-sm flex flex-col items-center text-center">
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
                                </div>
                            </div>
                        </motion.div>
                    ) : (
                        <motion.div key="curtidos" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="w-full">
                            {likedProjects.length > 0 ? (
                                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
                                    {likedProjects.map((proj) => (
                                        <div key={proj.id} className="group flex flex-col cursor-pointer">
                                            <div className="aspect-[4/3] w-full rounded-[24px] bg-[#050505] mb-4 overflow-hidden relative shadow-3xl transition-all duration-500 group-hover:-translate-y-2 border border-surface-border group-hover:border-accent/30">
                                                {proj.cover_url ? (
                                                    <img src={proj.cover_url} className="absolute inset-0 w-full h-full object-cover grayscale-[0.5] group-hover:grayscale-0 transition-all duration-700" alt={proj.name}/>
                                                ) : (
                                                    <div className="absolute inset-0 flex items-center justify-center text-5xl font-black text-foreground/5 opacity-20 uppercase tracking-tighter italic">
                                                        {(proj.name || "PRJ").substring(0,3)}
                                                    </div>
                                                )}
                                                <div className="absolute inset-0 bg-gradient-to-t from-black via-black/20 to-transparent opacity-80 group-hover:opacity-60 transition-opacity z-10" />
                                                <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-300 z-20 gap-4 scale-90 group-hover:scale-100">
                                                    <button onClick={(e) => {
                                                        e.stopPropagation();
                                                        window.open(proj.deploy_url, '_blank');
                                                    }} className="w-12 h-12 bg-white rounded-full flex items-center justify-center text-black hover:scale-110 active:scale-90 transition-transform shadow-2xl">
                                                        <ExternalLink className="w-5 h-5" />
                                                    </button>
                                                </div>
                                                <div className="absolute top-3 right-3 bg-black/50 backdrop-blur-md px-3 py-1.5 rounded-full flex items-center gap-1.5 z-20 shadow-lg">
                                                    <Heart className="w-3.5 h-3.5 fill-red-500 text-red-500" />
                                                </div>
                                            </div>
                                            <div className="px-2">
                                                <div className="flex items-center justify-between mb-1">
                                                    <h4 className="text-lg font-bold text-foreground tracking-tight truncate">{proj.name}</h4>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="py-20 flex flex-col items-center justify-center text-center">
                                    <div className="w-20 h-20 bg-surface rounded-full flex items-center justify-center mb-6">
                                        <Heart className="w-8 h-8 text-foreground/20" />
                                    </div>
                                    <h3 className="text-2xl font-black italic tracking-tighter text-foreground mb-2">Nenhum projeto favoritado</h3>
                                    <p className="text-foreground/40 font-medium">Explore o Marketplace e salve os sites que você mais gostar.</p>
                                </div>
                            )}
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>

            {/* Custom Toast Notification */}
            <AnimatePresence>
                {toastMessage && (
                    <motion.div 
                        initial={{ opacity: 0, y: 50, scale: 0.9 }} 
                        animate={{ opacity: 1, y: 0, scale: 1 }} 
                        exit={{ opacity: 0, scale: 0.9, y: 20 }}
                        className="fixed bottom-6 right-6 z-[9999] bg-surface border border-surface-border shadow-2xl px-6 py-4 rounded-2xl flex items-center gap-3 max-w-sm"
                    >
                        <div className="w-8 h-8 bg-accent/20 text-accent rounded-full flex items-center justify-center shrink-0">
                            <ShieldCheck className="w-4 h-4" />
                        </div>
                        <p className="text-sm font-bold text-foreground">{toastMessage}</p>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
