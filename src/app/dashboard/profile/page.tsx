"use client";
import { useState, useEffect, useRef } from "react";
import { Camera, Save, MapPin, Globe, Code2, AtSign, Star, ShieldCheck, Mail, Phone, Plus, X, Heart, ExternalLink, Building, Lock } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { supabase } from "@/lib/supabase";
import { getAccountStorageKey, getAuthenticatedAccountType } from "@/lib/account";

export default function ProfilePage() {
    const [loading, setLoading] = useState(false);
    const [cepLoading, setCepLoading] = useState(false);
    const [profileType, setProfileType] = useState<"Comércio" | "Desenvolvedor">("Comércio");
    const [activeTab, setActiveTab] = useState<"Informações" | "Curtidos">("Informações");
    const [toastMessage, setToastMessage] = useState<string | null>(null);
    
    const [formData, setFormData] = useState({
        name: "",
        bio: "",
        location: "",
        website: "",
        github: "",
        twitter: "",
        phone: "",
        email: "",
        avatar_url: "",
        banner_url: "",
        // Client specific fields
        cnpj: "",
        storeName: "",
        segment: "",
        cep: "",
        address: "",
        neighborhood: "",
        city: "",
        state: "",
        // Developer specific fields
        linkedin: "",
        portfolio: "",
        experience: "",
    });

    const [skills, setSkills] = useState<string[]>([]);
    const [newSkill, setNewSkill] = useState("");
    const [likedProjects, setLikedProjects] = useState<any[]>([]);

    const avatarInputRef = useRef<HTMLInputElement>(null);
    const bannerInputRef = useRef<HTMLInputElement>(null);

    const showToast = (msg: string) => {
        setToastMessage(msg);
        setTimeout(() => setToastMessage(null), 3000);
    };

    // Load initial profile data
    useEffect(() => {
        const loadProfile = async () => {
        const type = await getAuthenticatedAccountType();
        setProfileType(type);

        if (type === "Desenvolvedor") {
            const devData = localStorage.getItem(await getAccountStorageKey("dev-profile"));
            if (devData) {
                try {
                    const parsed = JSON.parse(devData);
                    setFormData(prev => ({
                        ...prev,
                        name: parsed.name || "",
                        email: parsed.email || "",
                        github: parsed.github || "",
                        linkedin: parsed.linkedin || "",
                        portfolio: parsed.portfolio || "",
                        experience: parsed.experience || "",
                        location: parsed.location || "São Paulo, SP",
                        bio: parsed.bio || "Desenvolvedor de soluções na Susanoo."
                    }));
                    if (parsed.specialties) setSkills(parsed.specialties);
                } catch (e) {}
            }
        } else {
            const clientData = localStorage.getItem(await getAccountStorageKey("client-profile"));
            if (clientData) {
                try {
                    const parsed = JSON.parse(clientData);
                    setFormData(prev => ({
                        ...prev,
                        name: parsed.name || "",
                        email: parsed.email || "",
                        storeName: parsed.storeName || "",
                        segment: parsed.segment || "",
                        cnpj: parsed.cnpj || "",
                        cep: parsed.cep || "",
                        address: parsed.address || "",
                        neighborhood: parsed.neighborhood || "",
                        city: parsed.city || "",
                        state: parsed.state || "",
                        location: parsed.location || (parsed.city && parsed.state ? `${parsed.city}, ${parsed.state}` : "São Paulo, SP"),
                        bio: parsed.bio || "Comerciante inovando com a Susanoo."
                    }));
                } catch (e) {}
            }
        }

        // Fetch liked projects
        setLikedProjects([
            { id: 1, name: "SaaS Dashboard Next.js", cover_url: "", deploy_url: "https://example.com" },
            { id: 2, name: "Landing Page Premium", cover_url: "", deploy_url: "https://example.com" },
        ]);
        };
        loadProfile();
    }, []);

    // ViaCEP fetch API when CEP is entered
    useEffect(() => {
        const cleanCep = formData.cep.replace(/\D/g, "");
        if (cleanCep.length === 8) {
            const fetchAddress = async () => {
                setCepLoading(true);
                try {
                    const res = await fetch(`https://viacep.com.br/ws/${cleanCep}/json/`);
                    const data = await res.json();
                    if (!data.erro) {
                        setFormData(prev => ({
                            ...prev,
                            address: data.logradouro || "",
                            neighborhood: data.bairro || "",
                            city: data.localidade || "",
                            state: data.uf || "",
                            location: `${data.localidade}, ${data.uf}`
                        }));
                        showToast("Endereço preenchido com sucesso!");
                    } else {
                        showToast("CEP não encontrado.");
                    }
                } catch (error) {
                    showToast("Erro ao buscar CEP.");
                } finally {
                    setCepLoading(false);
                }
            };
            fetchAddress();
        }
    }, [formData.cep]);

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
        setLoading(true);
        try {
            const fileExt = file.name.split('.').pop();
            const fileName = `${Math.random()}.${fileExt}`;
            const filePath = `${type}s/${fileName}`;

            const { error: uploadError } = await supabase.storage
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
            showToast("Erro ao fazer upload da imagem.");
        } finally {
            setLoading(false);
        }
    };

    const handleSaveProfile = async () => {
        setLoading(true);
        try {
            await new Promise(r => setTimeout(r, 800));

            if (profileType === "Desenvolvedor") {
                localStorage.setItem(await getAccountStorageKey("dev-profile"), JSON.stringify({
                    name: formData.name,
                    email: formData.email,
                    github: formData.github,
                    linkedin: formData.linkedin,
                    portfolio: formData.portfolio,
                    experience: formData.experience,
                    specialties: skills,
                    location: formData.location,
                    bio: formData.bio
                }));
            } else {
                // Check completeness
                const isComplete = !!(formData.name && formData.storeName && formData.cep && formData.address && formData.city);
                
                localStorage.setItem(await getAccountStorageKey("client-profile"), JSON.stringify({
                    name: formData.name,
                    email: formData.email,
                    storeName: formData.storeName,
                    segment: formData.segment,
                    cnpj: formData.cnpj,
                    cep: formData.cep,
                    address: formData.address,
                    neighborhood: formData.neighborhood,
                    city: formData.city,
                    state: formData.state,
                    location: formData.location,
                    bio: formData.bio,
                    completed: isComplete
                }));

                localStorage.setItem("susanoo_store_profile_completed", isComplete ? "true" : "false");
                localStorage.setItem(await getAccountStorageKey("store-profile-completed"), isComplete ? "true" : "false");
                window.dispatchEvent(new Event("profileCompletedChanged"));
            }

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
                className="w-full relative h-[280px] bg-surface flex items-end px-8 md:px-16 pb-8 border-b border-surface-border group cursor-pointer"
                style={{ 
                    backgroundImage: formData.banner_url ? `url(${formData.banner_url})` : 'none',
                    backgroundSize: 'cover',
                    backgroundPosition: 'center'
                }}
            >
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
                        <div className="w-28 h-28 md:w-36 md:h-36 rounded-full bg-background border-4 border-background overflow-hidden relative shadow-2xl flex items-center justify-center">
                            {formData.avatar_url ? (
                                <img src={formData.avatar_url} alt="Avatar" className="w-full h-full object-cover" />
                            ) : (
                                <span className="text-3xl font-black text-foreground/20 uppercase tracking-tighter">PERFIL</span>
                            )}
                            <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center backdrop-blur-sm z-20">
                                <Camera className="w-6 h-6 text-white mb-1" />
                            </div>
                        </div>
                    </div>
                    
                    <div className="flex-1 text-center sm:text-left mt-4 sm:mt-0">
                        <div className="flex flex-col sm:flex-row sm:items-center gap-3 mb-1">
                            <h1 className="text-2xl md:text-4xl font-black tracking-tight text-white drop-shadow-lg">{formData.name || "Sem Nome"}</h1>
                            <span className="bg-accent/80 backdrop-blur-md text-white border border-accent/20 px-3 py-1 rounded-full text-[9px] font-black uppercase inline-flex items-center gap-1 mx-auto sm:mx-0 w-fit">
                                <ShieldCheck className="w-3 h-3"/> Conta Ativa
                            </span>
                        </div>
                        <p className="text-white/80 drop-shadow-md font-medium text-xs sm:text-sm flex items-center justify-center sm:justify-start gap-4">
                            <span className="flex items-center gap-1"><MapPin className="w-3.5 h-3.5"/> {formData.location || "Localização não preenchida"}</span>
                            <span className="flex items-center gap-1"><Star className="w-3.5 h-3.5 text-emerald-400 fill-emerald-400"/> 5.0 (12 avaliações)</span>
                        </p>
                    </div>

                    <div className="flex items-center gap-4 mt-6 sm:mt-0">
                        <button onClick={handleSaveProfile} disabled={loading} className="bg-accent hover:bg-accent/80 text-white font-bold px-6 py-2.5 rounded-xl transition-all shadow-lg flex items-center gap-2 cursor-pointer hover:scale-[1.02] active:scale-[0.97] disabled:opacity-50 text-sm">
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
                                        <span className="text-[10px] font-medium text-foreground/40 bg-background px-3 py-1.5 rounded-lg border border-surface-border">
                                            {profileType === "Desenvolvedor" ? "Conta Profissional" : "Conta Comércio"}
                                        </span>
                                    </h3>
                                    
                                    <div className="space-y-5">
                                        <div>
                                            <label className="text-[10px] font-black text-foreground/40 uppercase tracking-widest mb-2 block">
                                                {profileType === "Desenvolvedor" ? "Nome Completo" : "Razão Social / Nome da Empresa"}
                                            </label>
                                            <input value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} className="w-full bg-background border border-surface-border rounded-xl px-4 py-3 text-sm font-medium focus:border-accent focus:outline-none transition-colors text-foreground" />
                                        </div>

                                        {profileType === "Comércio" && (
                                            <div className="grid grid-cols-2 gap-4">
                                                <div>
                                                    <label className="text-[10px] font-black text-foreground/40 uppercase tracking-widest mb-2 block">CNPJ (Opcional)</label>
                                                    <input value={formData.cnpj} onChange={e => setFormData({...formData, cnpj: e.target.value})} placeholder="00.000.000/0000-00" className="w-full bg-background border border-surface-border rounded-xl px-4 py-3 text-sm font-medium focus:border-accent focus:outline-none transition-colors text-foreground" />
                                                </div>
                                                <div>
                                                    <label className="text-[10px] font-black text-foreground/40 uppercase tracking-widest mb-2 block">Nome da Loja</label>
                                                    <input value={formData.storeName} onChange={e => setFormData({...formData, storeName: e.target.value})} placeholder="Minha Loja Virtual" className="w-full bg-background border border-surface-border rounded-xl px-4 py-3 text-sm font-medium focus:border-accent focus:outline-none transition-colors text-foreground" />
                                                </div>
                                            </div>
                                        )}

                                        {profileType === "Comércio" && (
                                            <div>
                                                <label className="text-[10px] font-black text-foreground/40 uppercase tracking-widest mb-2 block">Segmento da Loja</label>
                                                <input value={formData.segment} onChange={e => setFormData({...formData, segment: e.target.value})} placeholder="Ex: Moda, Alimentação, Serviços..." className="w-full bg-background border border-surface-border rounded-xl px-4 py-3 text-sm font-medium focus:border-accent focus:outline-none transition-colors text-foreground" />
                                            </div>
                                        )}

                                        <div>
                                            <label className="text-[10px] font-black text-foreground/40 uppercase tracking-widest mb-2 block">Biografia / Descrição</label>
                                            <textarea value={formData.bio} onChange={e => setFormData({...formData, bio: e.target.value})} className="w-full bg-background border border-surface-border rounded-xl px-4 py-3 text-sm font-medium focus:border-accent focus:outline-none transition-colors min-h-[100px] resize-none text-foreground" />
                                        </div>

                                        {/* CEP e Endereço Integration via ViaCEP (Only for Commerce) */}
                                        {profileType === "Comércio" && (
                                            <div className="border-t border-surface-border pt-5 space-y-4">
                                                <h4 className="font-bold text-sm flex items-center gap-2"><Building className="w-4 h-4 text-accent" /> Endereço Comercial</h4>
                                                
                                                <div className="grid grid-cols-3 gap-4">
                                                    <div className="relative col-span-1">
                                                        <label className="text-[10px] font-black text-foreground/40 uppercase tracking-widest mb-2 block">CEP</label>
                                                        <input value={formData.cep} onChange={e => setFormData({...formData, cep: e.target.value})} placeholder="00000-000" className="w-full bg-background border border-surface-border rounded-xl px-4 py-3 text-sm font-medium focus:border-accent focus:outline-none transition-colors text-foreground" />
                                                        {cepLoading && (
                                                            <div className="absolute right-3 top-[44px] w-4 h-4 border-2 border-surface-border border-t-accent rounded-full animate-spin" />
                                                        )}
                                                    </div>
                                                    <div className="col-span-2">
                                                        <label className="text-[10px] font-black text-foreground/40 uppercase tracking-widest mb-2 block">Endereço (Logradouro)</label>
                                                        <input value={formData.address} onChange={e => setFormData({...formData, address: e.target.value})} placeholder="Av. Paulista, 1000" className="w-full bg-background border border-surface-border rounded-xl px-4 py-3 text-sm font-medium focus:border-accent focus:outline-none transition-colors text-foreground" />
                                                    </div>
                                                </div>

                                                <div className="grid grid-cols-3 gap-4">
                                                    <div>
                                                        <label className="text-[10px] font-black text-foreground/40 uppercase tracking-widest mb-2 block">Bairro</label>
                                                        <input value={formData.neighborhood} onChange={e => setFormData({...formData, neighborhood: e.target.value})} placeholder="Bela Vista" className="w-full bg-background border border-surface-border rounded-xl px-4 py-3 text-sm font-medium focus:border-accent focus:outline-none transition-colors text-foreground" />
                                                    </div>
                                                    <div>
                                                        <label className="text-[10px] font-black text-foreground/40 uppercase tracking-widest mb-2 block">Cidade</label>
                                                        <input value={formData.city} onChange={e => setFormData({...formData, city: e.target.value})} placeholder="São Paulo" className="w-full bg-background border border-surface-border rounded-xl px-4 py-3 text-sm font-medium focus:border-accent focus:outline-none transition-colors text-foreground" />
                                                    </div>
                                                    <div>
                                                        <label className="text-[10px] font-black text-foreground/40 uppercase tracking-widest mb-2 block">Estado (UF)</label>
                                                        <input value={formData.state} onChange={e => setFormData({...formData, state: e.target.value})} placeholder="SP" className="w-full bg-background border border-surface-border rounded-xl px-4 py-3 text-sm font-medium focus:border-accent focus:outline-none transition-colors text-foreground" />
                                                    </div>
                                                </div>
                                            </div>
                                        )}

                                        {/* Skills Builder (Only for Developers) */}
                                        {profileType === "Desenvolvedor" && (
                                            <div className="border-t border-surface-border pt-5 space-y-4">
                                                <label className="text-[10px] font-black text-foreground/40 uppercase tracking-widest block flex items-center gap-2">
                                                    <Code2 className="w-4 h-4"/> Especialidades & Tecnologias
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
                                                        className="w-full bg-background border border-surface-border rounded-xl px-4 py-3 text-sm font-medium focus:border-accent focus:outline-none transition-colors text-foreground" 
                                                    />
                                                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold text-foreground/20 px-2 py-1 bg-surface rounded-md">↵ Enter</span>
                                                </div>
                                            </div>
                                        )}

                                        <div className="grid grid-cols-2 gap-4">
                                            <div>
                                                <label className="text-[10px] font-black text-foreground/40 uppercase tracking-widest mb-2 block">Email Público</label>
                                                <div className="relative">
                                                    <Mail className="w-4 h-4 absolute left-4 top-1/2 -translate-y-1/2 text-foreground/20" />
                                                    <input value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} className="w-full bg-background border border-surface-border rounded-xl pl-11 pr-4 py-3 text-sm font-medium focus:border-accent focus:outline-none transition-colors text-foreground" />
                                                </div>
                                            </div>
                                            <div>
                                                <label className="text-[10px] font-black text-foreground/40 uppercase tracking-widest mb-2 block">Telefone / WhatsApp</label>
                                                <div className="relative">
                                                    <Phone className="w-4 h-4 absolute left-4 top-1/2 -translate-y-1/2 text-foreground/20" />
                                                    <input value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} className="w-full bg-background border border-surface-border rounded-xl pl-11 pr-4 py-3 text-sm font-medium focus:border-accent focus:outline-none transition-colors text-foreground" />
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <div className="bg-surface border border-surface-border rounded-3xl p-8 shadow-sm">
                                    <h3 className="text-xl font-bold mb-6">Links e Redes</h3>
                                    <div className="space-y-4">
                                        <div className="relative">
                                            <Globe className="w-4 h-4 absolute left-4 top-1/2 -translate-y-1/2 text-foreground/20" />
                                            <input value={formData.website} onChange={e => setFormData({...formData, website: e.target.value})} placeholder="Seu site oficial" className="w-full bg-background border border-surface-border rounded-xl pl-11 pr-4 py-3 text-sm font-medium focus:border-accent focus:outline-none transition-colors text-foreground" />
                                        </div>
                                        {profileType === "Desenvolvedor" && (
                                            <>
                                                <div className="relative">
                                                    <Code2 className="w-4 h-4 absolute left-4 top-1/2 -translate-y-1/2 text-foreground/20" />
                                                    <input value={formData.github} onChange={e => setFormData({...formData, github: e.target.value})} placeholder="Seu GitHub (Ex: https://github.com/usuario)" className="w-full bg-background border border-surface-border rounded-xl pl-11 pr-4 py-3 text-sm font-medium focus:border-accent focus:outline-none transition-colors text-foreground" />
                                                </div>
                                                <div className="relative">
                                                    <Lock className="w-4 h-4 absolute left-4 top-1/2 -translate-y-1/2 text-foreground/20" />
                                                    <input value={formData.linkedin} onChange={e => setFormData({...formData, linkedin: e.target.value})} placeholder="Seu LinkedIn (Ex: https://linkedin.com/in/usuario)" className="w-full bg-background border border-surface-border rounded-xl pl-11 pr-4 py-3 text-sm font-medium focus:border-accent focus:outline-none transition-colors text-foreground" />
                                                </div>
                                            </>
                                        )}
                                        <div className="relative">
                                            <AtSign className="w-4 h-4 absolute left-4 top-1/2 -translate-y-1/2 text-foreground/20" />
                                            <input value={formData.twitter} onChange={e => setFormData({...formData, twitter: e.target.value})} placeholder="Seu X / Twitter" className="w-full bg-background border border-surface-border rounded-xl pl-11 pr-4 py-3 text-sm font-medium focus:border-accent focus:outline-none transition-colors text-foreground" />
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Right Column (Side details) */}
                            <div className="space-y-6">
                                <div className="bg-surface border border-surface-border rounded-3xl p-6 shadow-sm flex flex-col items-center text-center">
                                    <div className="w-14 h-14 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center mb-4">
                                        <Star className="w-7 h-7 text-emerald-500 fill-emerald-500" />
                                    </div>
                                    <h4 className="text-lg font-black text-foreground">Selo de Qualidade</h4>
                                    <p className="text-xs font-medium text-foreground/45 mt-2 mb-4 leading-relaxed">
                                        Entregue projetos com excelência e conquiste notas máximas para se destacar na comunidade.
                                    </p>
                                    <div className="w-full bg-background rounded-full h-1.5 mb-2 border border-surface-border">
                                        <div className="w-[70%] bg-emerald-500 h-full rounded-full" />
                                    </div>
                                    <span className="text-[10px] font-black text-foreground/40 uppercase tracking-wid5">7 / 10 Projetos</span>
                                </div>
                            </div>
                        </motion.div>
                    ) : (
                        <motion.div key="curtidos" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="w-full">
                            {likedProjects.length > 0 ? (
                                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                                    {likedProjects.map((proj) => (
                                        <div key={proj.id} className="group flex flex-col cursor-pointer">
                                            <div className="aspect-[4/3] w-full rounded-[24px] bg-[#050505] mb-4 overflow-hidden relative shadow-3xl transition-all duration-500 group-hover:-translate-y-1 border border-surface-border group-hover:border-accent/30">
                                                {proj.cover_url ? (
                                                    <img src={proj.cover_url} className="absolute inset-0 w-full h-full object-cover grayscale-[0.5] group-hover:grayscale-0 transition-all duration-700" alt={proj.name}/>
                                                ) : (
                                                    <div className="absolute inset-0 flex items-center justify-center text-4xl font-black text-foreground/5 opacity-20 uppercase tracking-tighter italic">
                                                        {(proj.name || "PRJ").substring(0,3)}
                                                    </div>
                                                )}
                                                <div className="absolute inset-0 bg-gradient-to-t from-black via-black/20 to-transparent opacity-80 group-hover:opacity-60 transition-opacity z-10" />
                                                <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-300 z-20 gap-4 scale-90 group-hover:scale-100">
                                                    <button onClick={(e) => {
                                                        e.stopPropagation();
                                                        window.open(proj.deploy_url, '_blank');
                                                    }} className="w-10 h-10 bg-white rounded-full flex items-center justify-center text-black hover:scale-110 active:scale-90 transition-transform shadow-2xl">
                                                        <ExternalLink className="w-4 h-4" />
                                                    </button>
                                                </div>
                                                <div className="absolute top-3 right-3 bg-black/50 backdrop-blur-md px-2 py-1 rounded-full flex items-center gap-1.5 z-20 shadow-lg">
                                                    <Heart className="w-3.5 h-3.5 fill-red-500 text-red-500" />
                                                </div>
                                            </div>
                                            <div className="px-2">
                                                <h4 className="text-sm font-bold text-foreground tracking-tight truncate">{proj.name}</h4>
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
                        className="fixed bottom-6 right-6 z-[9999] bg-surface border border-surface-border shadow-2xl px-6 py-4 rounded-2xl flex items-center gap-3 max-w-sm border-accent/20"
                    >
                        <div className="w-8 h-8 bg-accent/15 text-accent rounded-full flex items-center justify-center shrink-0">
                            <ShieldCheck className="w-4 h-4" />
                        </div>
                        <p className="text-sm font-bold text-foreground">{toastMessage}</p>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
