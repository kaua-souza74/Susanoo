"use client";
import { useState, useEffect, useRef } from "react";
import { Camera, Save, MapPin, Globe, Code2, AtSign, Star, ShieldCheck, Mail, Phone, Plus, X, Heart, ExternalLink, Building, Lock, Pencil, Trash2, ShoppingBag, AlertTriangle } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { supabase } from "@/lib/supabase";
import { getAccountStorageKey, getAuthenticatedAccountType } from "@/lib/account";
import { useRouter } from "next/navigation";

const EditableField = ({ label, value, onChange, placeholder, isTextarea = false, className = "" }: any) => {
    const [isEditing, setIsEditing] = useState(false);
    return (
        <div className={`relative flex flex-col gap-1.5 ${className}`}>
            <label className="text-[11px] font-bold text-foreground/50 uppercase tracking-wider">
                {label}
            </label>
            {isEditing ? (
                <div className="flex items-center gap-2">
                    {isTextarea ? (
                        <textarea
                            autoFocus
                            value={value}
                            onChange={(e) => onChange(e.target.value)}
                            onBlur={() => setIsEditing(false)}
                            className="w-full bg-background border border-accent/60 rounded-xl px-4 py-3 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-accent/20 transition-all min-h-[100px] resize-none text-foreground shadow-inner"
                        />
                    ) : (
                        <input
                            autoFocus
                            value={value}
                            onChange={(e) => onChange(e.target.value)}
                            onBlur={() => setIsEditing(false)}
                            placeholder={placeholder}
                            className="w-full bg-background border border-accent/60 rounded-xl px-4 py-3 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-accent/20 transition-all text-foreground shadow-inner"
                        />
                    )}
                </div>
            ) : (
                <div 
                    onClick={() => setIsEditing(true)}
                    className="w-full bg-surface border border-surface-border/60 hover:border-accent/40 rounded-xl px-4 py-3.5 text-sm font-medium transition-all text-foreground flex justify-between items-center cursor-pointer hover:bg-accent/5 hover:shadow-sm"
                >
                    <span className={!value ? "text-foreground/30 italic" : "whitespace-pre-line font-medium"}>{value || placeholder || "Não informado"}</span>
                    <button onClick={(e) => { e.stopPropagation(); setIsEditing(true); }} className="text-foreground/40 hover:text-accent p-1.5 cursor-pointer ml-2 shrink-0 transition-colors">
                        <Pencil className="w-3.5 h-3.5" />
                    </button>
                </div>
            )}
        </div>
    );
};

// Converte e otimiza imagens localmente em canvas para formato leve e persistente
const processImageFile = (file: File, maxWidth: number, maxHeight: number, quality = 0.85): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (readerEvent) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement("canvas");
        let width = img.width;
        let height = img.height;

        if (width > maxWidth || height > maxHeight) {
          const ratio = Math.min(maxWidth / width, maxHeight / height);
          width = Math.round(width * ratio);
          height = Math.round(height * ratio);
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext("2d");
        if (!ctx) {
          resolve(readerEvent.target?.result as string);
          return;
        }

        ctx.drawImage(img, 0, 0, width, height);
        const dataUrl = canvas.toDataURL("image/jpeg", quality);
        resolve(dataUrl);
      };
      img.onerror = () => reject(new Error("Erro ao carregar imagem para processamento."));
      img.src = readerEvent.target?.result as string;
    };
    reader.onerror = () => reject(new Error("Erro ao ler arquivo."));
    reader.readAsDataURL(file);
  });
};

export default function ProfilePage() {
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [initialLoading, setInitialLoading] = useState(true);
    const userManuallyTypedCep = useRef(false);
    const [cepLoading, setCepLoading] = useState(false);
    const [profileType, setProfileType] = useState<"Comércio" | "Desenvolvedor">("Comércio");
    const [activeTab, setActiveTab] = useState<"Informações" | "Curtidos" | "Minhas Compras">("Informações");
    const [toastMessage, setToastMessage] = useState<string | null>(null);
    const [showUnsavedModal, setShowUnsavedModal] = useState(false);
    const [pendingUrl, setPendingUrl] = useState<string | null>(null);
    const [isSavingAndNavigating, setIsSavingAndNavigating] = useState(false);
    const [originalData, setOriginalData] = useState<string | null>(null);
    const [likesPrivate, setLikesPrivate] = useState(false);
    const [myProjects, setMyProjects] = useState<any[]>([]);
    
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

    // Load initial profile data from Supabase Auth Metadata, Database Profiles, and LocalStorage
    const loadProfile = async () => {
        setLoading(true);
        const type = await getAuthenticatedAccountType();
        setProfileType(type);

        try {
            const { data: { session } } = await supabase.auth.getSession();
            const user = session?.user;
            const meta = user?.user_metadata || {};

            // 1. Busca dados da tabela profiles no banco
            let dbProfile: any = null;
            if (user?.id) {
                const { data } = await supabase
                    .from('profiles')
                    .select('*')
                    .eq('id', user.id)
                    .single();
                dbProfile = data;
            }

            // 2. Busca cache local
            const storageKey = type === "Desenvolvedor" ? "dev-profile" : "client-profile";
            const localDataStr = localStorage.getItem(await getAccountStorageKey(storageKey));
            const localData = localDataStr ? JSON.parse(localDataStr) : {};

            // 3. Mesclagem inteligente com prioridade persistente
            const mergedName = dbProfile?.name || meta.name || meta.full_name || localData.name || user?.email?.split('@')[0] || "";
            const mergedEmail = dbProfile?.email || user?.email || meta.email || localData.email || "";
            const mergedAvatar = dbProfile?.avatar_url || meta.avatar_url || localData.avatar_url || "";
            const mergedBanner = meta.banner_url || localData.banner_url || "";
            const mergedBio = dbProfile?.bio || meta.bio || localData.bio || (type === "Desenvolvedor" ? "Desenvolvedor de soluções na Susanoo." : "Comerciante inovando com a Susanoo.");
            const mergedLocation = dbProfile?.location || meta.location || localData.location || (meta.city && meta.state ? `${meta.city}, ${meta.state}` : (localData.city && localData.state ? `${localData.city}, ${localData.state}` : "São Paulo, SP"));
            const mergedSkills = dbProfile?.skills || meta.skills || localData.specialties || localData.skills || [];

            const initialFormData = {
                name: mergedName,
                email: mergedEmail,
                avatar_url: mergedAvatar,
                banner_url: mergedBanner,
                bio: mergedBio,
                location: mergedLocation,
                website: meta.website || localData.website || "",
                github: meta.github || localData.github || "",
                twitter: meta.twitter || localData.twitter || "",
                phone: meta.phone || localData.phone || "",
                cnpj: meta.cnpj || localData.cnpj || "",
                storeName: meta.storeName || localData.storeName || "",
                segment: meta.segment || localData.segment || "",
                cep: meta.cep || localData.cep || "",
                address: meta.address || localData.address || "",
                neighborhood: meta.neighborhood || localData.neighborhood || "",
                city: meta.city || localData.city || "",
                state: meta.state || localData.state || "",
                linkedin: meta.linkedin || localData.linkedin || "",
                portfolio: meta.portfolio || localData.portfolio || "",
                experience: meta.experience || localData.experience || ""
            };

            setFormData(initialFormData);

            const initialSkills = (mergedSkills && mergedSkills.length > 0) ? mergedSkills : [];
            setSkills(initialSkills);
            setOriginalData(JSON.stringify({ formData: initialFormData, skills: initialSkills }));

            if (dbProfile) {
                setLikesPrivate(dbProfile.likes_private || false);
            }

            // Buscar projetos e curtidas
            if (user?.id) {
                const { data: projs } = await supabase.from('projects').select('*').eq('client_id', user.id);
                setMyProjects(projs || []);

                const { data: dbLikes } = await supabase
                    .from('likes')
                    .select('project_id, projects(id, name, cover_url, deploy_url)')
                    .eq('user_id', user.id);
                if (dbLikes) {
                    const mappedLikes = dbLikes
                        .filter((l: any) => l.projects)
                        .map((l: any) => ({
                            id: l.projects.id,
                            name: l.projects.name,
                            price: 49.90,
                            cover_url: l.projects.cover_url || "",
                            deploy_url: l.projects.deploy_url
                        }));
                    setLikedProjects(mappedLikes);
                }
            }
        } catch (err) {
            console.error("Erro ao carregar perfil:", err);
        } finally {
            setLoading(false);
            setInitialLoading(false);
        }
    };

    useEffect(() => {
        loadProfile();
    }, []);

    const isDirty = originalData !== null && JSON.stringify({ formData, skills }) !== originalData;

    // Intercepta navegação interna por links para exibir o modal de confirmação elegante da Susanoo
    useEffect(() => {
        const handleLinkClick = (e: MouseEvent) => {
            if (!isDirty) return;
            const target = (e.target as HTMLElement).closest("a");
            if (target && target.href) {
                try {
                    const url = new URL(target.href, window.location.href);
                    if (url.origin === window.location.origin && url.pathname !== window.location.pathname) {
                        e.preventDefault();
                        e.stopPropagation();
                        setPendingUrl(target.href);
                        setShowUnsavedModal(true);
                    }
                } catch (err) {
                    // Ignora URLs inválidas
                }
            }
        };
        document.addEventListener("click", handleLinkClick, true);
        return () => document.removeEventListener("click", handleLinkClick, true);
    }, [isDirty]);

    // ViaCEP fetch API - Somente executa se o usuário tiver digitado o CEP manualmente na tela
    useEffect(() => {
        if (!userManuallyTypedCep.current) return;
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
                    userManuallyTypedCep.current = false;
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
            const maxWidth = type === 'avatar' ? 400 : 1200;
            const maxHeight = type === 'avatar' ? 400 : 450;
            const processedDataUrl = await processImageFile(file, maxWidth, maxHeight, 0.85);

            let finalUrl = processedDataUrl;

            // Tenta upload no Storage se disponível
            try {
                const fileExt = file.name.split('.').pop() || 'jpg';
                const fileName = `${type}_${Date.now()}_${Math.random().toString(36).substring(7)}.${fileExt}`;
                const filePath = `profiles/${fileName}`;

                const { error: uploadError } = await supabase.storage
                    .from('project_files')
                    .upload(filePath, file);

                if (!uploadError) {
                    const { data: { publicUrl } } = supabase.storage
                        .from('project_files')
                        .getPublicUrl(filePath);
                    if (publicUrl) {
                        finalUrl = publicUrl;
                    }
                }
            } catch (storageErr) {
                // Fallback automático para o dataUrl otimizado
            }

            const fieldKey = type === 'avatar' ? 'avatar_url' : 'banner_url';
            setFormData(prev => ({
                ...prev,
                [fieldKey]: finalUrl
            }));

            // Auto-salva permanentemente na conta e na tabela profiles
            const { data: { session } } = await supabase.auth.getSession();
            if (session?.user?.id) {
                await supabase.auth.updateUser({
                    data: { [fieldKey]: finalUrl }
                });
                if (type === 'avatar') {
                    await supabase.from('profiles').update({ avatar_url: finalUrl }).eq('id', session.user.id);
                }
            }

            showToast(`${type === 'avatar' ? 'Foto de perfil' : 'Banner'} atualizado com sucesso!`);
        } catch (error) {
            console.error("Erro no processamento da imagem:", error);
            showToast("Erro ao processar imagem.");
        } finally {
            setLoading(false);
        }
    };

    const handleRemoveBanner = async (e: React.MouseEvent) => {
        e.stopPropagation();
        setFormData(prev => ({ ...prev, banner_url: "" }));
        const { data: { session } } = await supabase.auth.getSession();
        if (session?.user?.id) {
            await supabase.auth.updateUser({
                data: { banner_url: "" }
            });
        }
        showToast("Banner restaurado para o padrão.");
    };

    const handleSaveProfile = async () => {
        setLoading(true);
        try {
            const { data: { session } } = await supabase.auth.getSession();
            const userId = session?.user?.id;

            const isClient = profileType !== "Desenvolvedor";
            const isComplete = isClient 
                ? !!(formData.name && formData.storeName && formData.cep && formData.address && formData.city)
                : !!(formData.name && formData.bio);

            const profilePayload = {
                name: formData.name,
                email: formData.email,
                avatar_url: formData.avatar_url,
                banner_url: formData.banner_url,
                bio: formData.bio,
                location: formData.location,
                phone: formData.phone,
                website: formData.website,
                github: formData.github,
                twitter: formData.twitter,
                cnpj: formData.cnpj,
                storeName: formData.storeName,
                segment: formData.segment,
                cep: formData.cep,
                address: formData.address,
                neighborhood: formData.neighborhood,
                city: formData.city,
                state: formData.state,
                linkedin: formData.linkedin,
                portfolio: formData.portfolio,
                experience: formData.experience,
                skills,
                completed: isComplete,
                likes_private: likesPrivate
            };

            // 1. Salva nos metadados permanentes da conta no Supabase Auth
            if (userId) {
                await supabase.auth.updateUser({
                    data: profilePayload
                });

                // 2. Salva na tabela public.profiles da Susanoo
                await supabase
                    .from('profiles')
                    .update({
                        name: formData.name || null,
                        bio: formData.bio || null,
                        location: formData.location || null,
                        avatar_url: formData.avatar_url || null,
                        skills: skills || [],
                        likes_private: likesPrivate
                    })
                    .eq('id', userId);
            }

            // 3. Salva no localStorage como cache local
            if (profileType === "Desenvolvedor") {
                localStorage.setItem(await getAccountStorageKey("dev-profile"), JSON.stringify(profilePayload));
            } else {
                localStorage.setItem(await getAccountStorageKey("client-profile"), JSON.stringify(profilePayload));
                localStorage.setItem("susanoo_store_profile_completed", isComplete ? "true" : "false");
                localStorage.setItem(await getAccountStorageKey("store-profile-completed"), isComplete ? "true" : "false");
                window.dispatchEvent(new Event("profileCompletedChanged"));
            }

            showToast("Mudanças salvas com sucesso!");
            setOriginalData(JSON.stringify({ formData, skills }));
        } catch (error: any) {
            console.error("Erro ao salvar perfil:", error);
            showToast("Erro ao salvar o perfil.");
        } finally {
            setLoading(false);
        }
    };

    const navigateToPending = (targetUrl: string) => {
        try {
            const url = new URL(targetUrl, window.location.href);
            if (url.origin === window.location.origin) {
                router.push(url.pathname + url.search);
                return;
            }
        } catch (e) {}
        window.location.href = targetUrl;
    };

    const handleSaveAndNavigate = async () => {
        setIsSavingAndNavigating(true);
        await handleSaveProfile();
        sessionStorage.setItem("susanoo_flash_toast", "Mudanças salvas com sucesso!");
        setIsSavingAndNavigating(false);
        setShowUnsavedModal(false);
        if (pendingUrl) {
            navigateToPending(pendingUrl);
        }
    };

    const handleDiscardAndNavigate = () => {
        if (originalData) {
            try {
                const parsed = JSON.parse(originalData);
                if (parsed.formData) setFormData(parsed.formData);
                if (parsed.skills) setSkills(parsed.skills);
            } catch (e) {}
        }
        setShowUnsavedModal(false);
        if (pendingUrl) {
            navigateToPending(pendingUrl);
        }
    };

    if (initialLoading) {
        return (
            <div className="flex-1 flex items-center justify-center bg-background min-h-[70vh]">
                <div className="w-8 h-8 border-2 border-surface-border border-t-accent rounded-full animate-spin" />
            </div>
        );
    }

    return (
        <div className="flex-1 overflow-y-auto w-full bg-background text-foreground transition-colors duration-300 pb-20">
            {/* Banner Section */}
            <div 
                className="w-full relative h-[280px] flex items-end px-8 md:px-16 pb-8 border-b border-surface-border group cursor-pointer"
                style={{ 
                    backgroundImage: formData.banner_url ? `url(${formData.banner_url})` : 'linear-gradient(to right, #6366f1, #a855f7, #ec4899)',
                    backgroundSize: 'cover',
                    backgroundPosition: 'center'
                }}
            >
                <div className="absolute inset-0 bg-gradient-to-r from-accent/10 to-transparent pointer-events-none group-hover:from-accent/20 transition-all duration-500" />
                <div className="absolute inset-0 bg-black/40 pointer-events-none" />

                <input type="file" ref={bannerInputRef} hidden accept="image/*" onChange={(e) => handleImageUpload(e, 'banner')} />
                
                <div className="absolute top-6 right-6 flex items-center gap-2 z-20">
                    {formData.banner_url && (
                        <button 
                            onClick={handleRemoveBanner}
                            className="bg-black/50 backdrop-blur-md rounded-xl px-3.5 py-2 opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1.5 text-white/80 hover:text-red-400 text-xs font-bold shadow-lg hover:scale-105 active:scale-95"
                            title="Remover banner personalizado"
                        >
                            <Trash2 className="w-3.5 h-3.5"/> Remover
                        </button>
                    )}
                    <button 
                        onClick={() => bannerInputRef.current?.click()}
                        className="bg-black/50 backdrop-blur-md rounded-xl px-4 py-2 opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-2 text-white text-xs font-bold shadow-lg hover:scale-105 active:scale-95"
                    >
                        <Camera className="w-4 h-4"/> Alterar Banner
                    </button>
                </div>
                
                <div className="relative z-10 flex flex-col sm:flex-row items-center gap-6 w-full max-w-5xl mx-auto translate-y-16 bg-surface/35 backdrop-blur-xl border border-surface-border/50 p-6 rounded-3xl shadow-2xl">
                    <div className="relative group cursor-pointer" onClick={() => avatarInputRef.current?.click()}>
                        <input type="file" ref={avatarInputRef} hidden accept="image/*" onChange={(e) => handleImageUpload(e, 'avatar')} />
                        <div className="w-24 h-24 md:w-28 md:h-28 rounded-full bg-background border-4 border-background overflow-hidden relative shadow-2xl flex items-center justify-center">
                            {formData.avatar_url ? (
                                <img src={formData.avatar_url} alt="Avatar" className="w-full h-full object-cover" />
                            ) : (
                                <span className="text-xl font-black text-foreground/20 uppercase tracking-tighter">PERFIL</span>
                            )}
                            <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center backdrop-blur-sm z-20">
                                <Camera className="w-5 h-5 text-white mb-1" />
                            </div>
                        </div>
                    </div>
                    
                    <div className="flex-1 text-center sm:text-left">
                        <div className="flex flex-col sm:flex-row sm:items-center gap-3 mb-1">
                            <h1 className="text-2xl md:text-3xl font-black tracking-tight text-white drop-shadow-lg">{formData.name || "Sem Nome"}</h1>
                            <span className="bg-accent/80 backdrop-blur-md text-white border border-accent/20 px-3 py-1 rounded-full text-[9px] font-black uppercase inline-flex items-center gap-1 mx-auto sm:mx-0 w-fit">
                                <ShieldCheck className="w-3 h-3"/> Conta Ativa
                            </span>
                        </div>
                        <p className="text-white/80 drop-shadow-md font-medium text-xs sm:text-sm flex items-center justify-center sm:justify-start gap-4 mt-2">
                            <span className="flex items-center gap-1"><MapPin className="w-3.5 h-3.5"/> {formData.location || "Localização não preenchida"}</span>
                            <span className="flex items-center gap-1"><Star className="w-3.5 h-3.5 text-emerald-400 fill-emerald-400"/> 5.0 (12 avaliações)</span>
                        </p>
                    </div>

                    <div className="flex items-center gap-4 mt-6 sm:mt-0">
                        <button onClick={handleSaveProfile} disabled={loading} className="bg-accent hover:bg-accent/90 text-white font-bold px-6 py-2.5 rounded-xl transition-all shadow-lg flex items-center gap-2 cursor-pointer hover:scale-[1.02] active:scale-[0.97] disabled:opacity-50 text-sm">
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
                        className={`text-sm font-black uppercase tracking-widest px-4 py-2 transition-colors relative cursor-pointer ${activeTab === "Informações" ? "text-foreground" : "text-foreground/40 hover:text-foreground/80"}`}
                    >
                        Informações
                        {activeTab === "Informações" && (
                            <motion.div layoutId="profile-tab" className="absolute bottom-[-17px] left-0 right-0 h-0.5 bg-accent" />
                        )}
                    </button>
                    <button 
                        onClick={() => setActiveTab("Curtidos")}
                        className={`text-sm font-black uppercase tracking-widest px-4 py-2 transition-colors relative cursor-pointer ${activeTab === "Curtidos" ? "text-foreground" : "text-foreground/40 hover:text-foreground/80"}`}
                    >
                        Curtidos
                        {activeTab === "Curtidos" && (
                            <motion.div layoutId="profile-tab" className="absolute bottom-[-17px] left-0 right-0 h-0.5 bg-accent" />
                        )}
                    </button>
                    <button 
                        onClick={() => setActiveTab("Minhas Compras")}
                        className={`text-sm font-black uppercase tracking-widest px-4 py-2 transition-colors relative cursor-pointer ${activeTab === "Minhas Compras" ? "text-foreground" : "text-foreground/40 hover:text-foreground/80"}`}
                    >
                        Minhas Compras
                        {activeTab === "Minhas Compras" && (
                            <motion.div layoutId="profile-tab" className="absolute bottom-[-17px] left-0 right-0 h-0.5 bg-accent" />
                        )}
                    </button>
                </div>

                <AnimatePresence mode="wait">
                    {activeTab === "Informações" && (
                        <motion.div key="informacoes" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="grid grid-cols-1 md:grid-cols-3 gap-8">
                            {/* Left Column (Main forms) */}
                            <div className="md:col-span-2 space-y-8">
                                <div className="bg-surface border border-surface-border rounded-3xl p-8 shadow-xl shadow-black/5 hover:border-accent/15 transition-all duration-300">
                                    <div className="flex items-center justify-between mb-8 pb-4 border-b border-surface-border">
                                        <h3 className="text-xl font-bold text-foreground tracking-tight flex items-center gap-3">
                                            <span className="w-1.5 h-6 bg-accent rounded-full"></span>
                                            Informações Básicas
                                        </h3>
                                        <span className="text-[10px] font-black tracking-wider text-accent bg-accent/10 border border-accent/20 px-3.5 py-1.5 rounded-xl uppercase">
                                            {profileType === "Desenvolvedor" ? "Conta Profissional" : "Conta Comércio"}
                                        </span>
                                    </div>
                                    
                                    <div className="space-y-6">
                                        <EditableField 
                                            label={profileType === "Desenvolvedor" ? "Nome Completo" : "Razão Social / Nome da Empresa"}
                                            value={formData.name}
                                            onChange={(val: string) => setFormData({...formData, name: val})}
                                        />

                                        {profileType === "Comércio" && (
                                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                                                <EditableField 
                                                    label="CNPJ (Opcional)"
                                                    value={formData.cnpj}
                                                    placeholder="00.000.000/0000-00"
                                                    onChange={(val: string) => setFormData({...formData, cnpj: val})}
                                                />
                                                <EditableField 
                                                    label="Nome da Loja"
                                                    value={formData.storeName}
                                                    placeholder="Minha Loja Virtual"
                                                    onChange={(val: string) => setFormData({...formData, storeName: val})}
                                                />
                                            </div>
                                        )}

                                        {profileType === "Comércio" && (
                                            <EditableField 
                                                label="Segmento da Loja"
                                                value={formData.segment}
                                                placeholder="Ex: Moda, Alimentação, Serviços..."
                                                onChange={(val: string) => setFormData({...formData, segment: val})}
                                            />
                                        )}

                                        <EditableField 
                                            label="Biografia / Descrição"
                                            value={formData.bio}
                                            isTextarea={true}
                                            onChange={(val: string) => setFormData({...formData, bio: val})}
                                        />

                                        {/* CEP e Endereço Integration via ViaCEP (Only for Commerce) */}
                                        {profileType === "Comércio" && (
                                            <div className="border-t border-surface-border pt-6 mt-6 space-y-4">
                                                <h4 className="font-bold text-base flex items-center gap-2.5 text-foreground">
                                                    <Building className="w-5 h-5 text-accent" /> Endereço Comercial
                                                </h4>
                                                <p className="text-xs text-foreground/40 -mt-2">O preenchimento do CEP autocompleta automaticamente seu endereço.</p>
                                                
                                                <div className="grid grid-cols-1 md:grid-cols-3 gap-5 bg-background/40 border border-surface-border/60 p-5 rounded-2xl">
                                                    <div className="relative col-span-1">
                                                        <EditableField 
                                                            label="CEP"
                                                            value={formData.cep}
                                                            placeholder="00000-000"
                                                            onChange={(val: string) => {
                                                                userManuallyTypedCep.current = true;
                                                                setFormData({...formData, cep: val});
                                                            }}
                                                        />
                                                        {cepLoading && (
                                                            <div className="absolute right-3 top-[38px] w-4 h-4 border-2 border-surface-border border-t-accent rounded-full animate-spin" />
                                                        )}
                                                    </div>
                                                    <div className="col-span-2">
                                                        <EditableField 
                                                            label="Endereço (Logradouro)"
                                                            value={formData.address}
                                                            placeholder="Av. Paulista, 1000"
                                                            onChange={(val: string) => setFormData({...formData, address: val})}
                                                        />
                                                    </div>
                                                    
                                                    <EditableField 
                                                        label="Bairro"
                                                        value={formData.neighborhood}
                                                        placeholder="Bela Vista"
                                                        onChange={(val: string) => setFormData({...formData, neighborhood: val})}
                                                    />
                                                    <EditableField 
                                                        label="Cidade"
                                                        value={formData.city}
                                                        placeholder="São Paulo"
                                                        onChange={(val: string) => setFormData({...formData, city: val})}
                                                    />
                                                    <EditableField 
                                                        label="Estado (UF)"
                                                        value={formData.state}
                                                        placeholder="SP"
                                                        onChange={(val: string) => setFormData({...formData, state: val})}
                                                    />
                                                </div>
                                            </div>
                                        )}

                                        {/* Skills Builder (Only for Developers) */}
                                        {profileType === "Desenvolvedor" && (
                                            <div className="border-t border-surface-border pt-6 mt-6 space-y-4">
                                                <label className="text-[11px] font-bold text-foreground/50 uppercase tracking-wider block flex items-center gap-2">
                                                    <Code2 className="w-5 h-5 text-accent"/> Especialidades & Tecnologias
                                                </label>
                                                
                                                <div className="flex flex-wrap gap-2 mb-3">
                                                    {skills.map(sk => (
                                                        <span key={sk} className="flex items-center gap-1.5 bg-background border border-surface-border text-foreground px-3 py-1.5 rounded-lg text-xs font-bold shadow-sm hover:border-red-500/30 transition-colors">
                                                            {sk}
                                                            <button onClick={() => removeSkill(sk)} className="text-red-400 hover:scale-110 transition-transform cursor-pointer"><X className="w-3 h-3" /></button>
                                                        </span>
                                                    ))}
                                                </div>

                                                <div className="relative">
                                                    <input 
                                                        value={newSkill} 
                                                        onChange={e => setNewSkill(e.target.value)} 
                                                        onKeyDown={handleAddSkill}
                                                        placeholder="Digite a tecnologia e aperte Enter..." 
                                                        className="w-full bg-background border border-surface-border rounded-xl px-4 py-3.5 text-sm font-medium focus:border-accent/60 focus:outline-none focus:ring-2 focus:ring-accent/15 transition-all text-foreground" 
                                                    />
                                                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold text-foreground/20 px-2.5 py-1 bg-surface border border-surface-border rounded-lg">↵ Enter</span>
                                                </div>
                                            </div>
                                        )}

                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 border-t border-surface-border pt-6">
                                            <EditableField 
                                                label="Email Público"
                                                value={formData.email}
                                                onChange={(val: string) => setFormData({...formData, email: val})}
                                            />
                                            <EditableField 
                                                label="Telefone / WhatsApp"
                                                value={formData.phone}
                                                onChange={(val: string) => setFormData({...formData, phone: val})}
                                            />
                                        </div>
                                    </div>
                                </div>

                                <div className="bg-surface border border-surface-border rounded-3xl p-8 shadow-xl shadow-black/5 hover:border-accent/15 transition-all duration-300">
                                    <h3 className="text-xl font-bold mb-6 text-foreground flex items-center gap-3">
                                        <span className="w-1.5 h-6 bg-accent rounded-full"></span>
                                        Links e Redes
                                    </h3>
                                    <div className="space-y-5">
                                        <EditableField 
                                            label="Site Oficial"
                                            value={formData.website}
                                            placeholder="Seu site oficial"
                                            onChange={(val: string) => setFormData({...formData, website: val})}
                                        />
                                        {profileType === "Desenvolvedor" && (
                                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                                                <EditableField 
                                                    label="GitHub"
                                                    value={formData.github}
                                                    placeholder="Seu GitHub (Ex: https://github.com/usuario)"
                                                    onChange={(val: string) => setFormData({...formData, github: val})}
                                                />
                                                <EditableField 
                                                    label="LinkedIn"
                                                    value={formData.linkedin}
                                                    placeholder="Seu LinkedIn (Ex: https://linkedin.com/in/usuario)"
                                                    onChange={(val: string) => setFormData({...formData, linkedin: val})}
                                                />
                                            </div>
                                        )}
                                        <EditableField 
                                            label="Twitter / X"
                                            value={formData.twitter}
                                            placeholder="Seu X / Twitter"
                                            onChange={(val: string) => setFormData({...formData, twitter: val})}
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* Right Column (Side details) */}
                            <div className="space-y-6">
                                <div className="bg-surface border border-surface-border rounded-3xl p-6 shadow-xl shadow-black/5 hover:border-accent/15 transition-all duration-300 flex flex-col items-center text-center">
                                    <div className="w-14 h-14 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center mb-4 text-emerald-500 shadow-inner">
                                        <Star className="w-7 h-7 fill-current" />
                                    </div>
                                    <h4 className="text-lg font-black text-foreground">Selo de Qualidade</h4>
                                    <p className="text-xs font-medium text-foreground/45 mt-2 mb-4 leading-relaxed max-w-[200px]">
                                        Entregue projetos com excelência e conquiste notas máximas para se destacar na comunidade.
                                    </p>
                                    <div className="w-full bg-background rounded-full h-2 mb-2 border border-surface-border overflow-hidden p-0.5">
                                        <div className="w-[70%] bg-gradient-to-r from-emerald-500 to-teal-400 h-full rounded-full" />
                                    </div>
                                    <span className="text-[10px] font-black text-foreground/40 uppercase tracking-wider">7 / 10 Projetos</span>
                                </div>
                            </div>
                        </motion.div>
                    )}
                    {activeTab === "Curtidos" && (
                        <motion.div key="curtidos" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="w-full">
                            <div className="mb-6 flex items-center justify-between bg-surface border border-surface-border p-4 rounded-2xl">
                                <div className="flex items-center gap-2 text-sm font-bold text-foreground">
                                    <Lock className="w-4 h-4 text-accent" />
                                    <span>Tornar curtidas privadas para outros usuários</span>
                                </div>
                                <input 
                                    type="checkbox" 
                                    checked={likesPrivate} 
                                    onChange={async (e) => {
                                        setLikesPrivate(e.target.checked);
                                        const { data: { session } } = await supabase.auth.getSession();
                                        if (session?.user?.id) {
                                            await supabase
                                                .from('profiles')
                                                .update({ likes_private: e.target.checked })
                                                .eq('id', session.user.id);
                                        }
                                        showToast(e.target.checked ? "Curtidas agora são privadas." : "Curtidas agora são públicas.");
                                    }}
                                    className="w-4 h-4 accent-purple-600 rounded cursor-pointer"
                                />
                            </div>

                            {likedProjects.length > 0 ? (
                                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                                    {likedProjects.map((proj) => (
                                        <div key={proj.id} className="bg-surface border border-surface-border rounded-3xl p-5 shadow-sm relative overflow-hidden group">
                                            <div className="w-full aspect-video bg-background border border-surface-border rounded-xl mb-4 flex items-center justify-center relative overflow-hidden">
                                                {proj.cover_url ? (
                                                    <img src={proj.cover_url} alt="" className="w-full h-full object-cover" />
                                                ) : (
                                                    <h3 className="text-3xl font-black text-foreground/5 uppercase tracking-tighter">{proj.name.substring(0,3)}</h3>
                                                )}
                                            </div>
                                            <h4 className="font-bold text-sm text-foreground truncate">{proj.name}</h4>
                                            <span className="text-accent text-xs font-black mt-1 block">R$ {proj.price.toFixed(2)}</span>
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
                    {activeTab === "Minhas Compras" && (
                        <motion.div key="minhas-compras" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="w-full space-y-6">
                            <div className="bg-surface/50 border border-surface-border p-5 rounded-2xl flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <ShoppingBag className="w-4 h-4 text-accent" />
                                    <span className="text-xs font-bold text-foreground/70">Sites e templates adquiridos por você.</span>
                                </div>
                                <button onClick={() => router.push('/dashboard/projects')} className="text-xs font-bold text-accent hover:underline flex items-center gap-1 cursor-pointer">
                                    Abrir Painel Completo <ExternalLink className="w-3.5 h-3.5" />
                                </button>
                            </div>

                            {myProjects.length > 0 ? (
                                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                                    {myProjects.map((proj) => (
                                        <div key={proj.id} onClick={() => router.push(`/dashboard/timeline?project=${proj.id}`)} className="bg-surface border border-surface-border rounded-3xl p-5 shadow-sm relative overflow-hidden group cursor-pointer hover:border-accent/40 transition-all">
                                            <div className="w-full aspect-video bg-background border border-surface-border rounded-xl mb-4 flex items-center justify-center relative overflow-hidden">
                                                {proj.cover_url ? (
                                                    <img src={proj.cover_url} alt="" className="w-full h-full object-cover" />
                                                ) : (
                                                    <h3 className="text-3xl font-black text-foreground/5 uppercase tracking-tighter">{proj.name.substring(0,3)}</h3>
                                                )}
                                                <div className="absolute top-2 left-2 flex items-center gap-1 bg-background/80 backdrop-blur-md px-2 py-1 rounded-md border border-surface-border text-[10px] font-bold text-foreground">
                                                    {proj.manual_progress || 0}%
                                                </div>
                                            </div>
                                            <h4 className="font-bold text-sm text-foreground truncate">{proj.name}</h4>
                                            <p className="text-[10px] text-foreground/40 mt-1">ID: {proj.id.substring(0,8)}</p>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="py-20 flex flex-col items-center justify-center text-center">
                                    <div className="w-20 h-20 bg-surface rounded-full flex items-center justify-center mb-6">
                                        <Building className="w-8 h-8 text-foreground/20" />
                                    </div>
                                    <h3 className="text-2xl font-black italic tracking-tighter text-foreground mb-2">Nenhum site comprado</h3>
                                    <p className="text-foreground/40 font-medium">Acompanhe seus sites adquiridos ou fale com um consultor.</p>
                                </div>
                            )}
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>

            {/* Banner Flutuante de Alterações Não Salvas */}
            <AnimatePresence>
                {isDirty && !showUnsavedModal && (
                    <motion.div
                        initial={{ opacity: 0, y: 30 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 30 }}
                        className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[9990] bg-surface/95 backdrop-blur-md border border-amber-500/30 shadow-2xl rounded-2xl p-3 px-5 flex items-center gap-4 text-foreground max-w-xl w-[90%]"
                    >
                        <div className="w-9 h-9 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-500 flex items-center justify-center shrink-0">
                            <AlertTriangle className="w-5 h-5 animate-pulse" />
                        </div>
                        <div className="flex-1 min-w-0">
                            <p className="text-xs font-bold text-foreground">Alterações não salvas no perfil</p>
                            <p className="text-[11px] text-foreground/50 truncate">Salve suas modificações para não perder nenhum dado ao sair.</p>
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                            <button
                                onClick={handleDiscardAndNavigate}
                                className="px-3 py-1.5 rounded-xl text-xs font-semibold text-foreground/60 hover:text-foreground hover:bg-surface-border transition-colors cursor-pointer"
                            >
                                Descartar
                            </button>
                            <button
                                onClick={handleSaveProfile}
                                disabled={loading}
                                className="px-4 py-1.5 rounded-xl bg-accent hover:bg-accent/90 text-white font-bold text-xs shadow-md shadow-accent/20 transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                            >
                                <Save className="w-3.5 h-3.5" /> Salvar
                            </button>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Modal de Confirmação ao Tentar Sair da Página com Alterações */}
            <AnimatePresence>
                {showUnsavedModal && (
                    <motion.div 
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 bg-black/70 backdrop-blur-sm z-[99999] flex items-center justify-center p-4 font-sans"
                    >
                        <motion.div
                            initial={{ scale: 0.95, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.95, opacity: 0 }}
                            className="bg-surface border border-surface-border rounded-3xl p-6 md:p-8 max-w-md w-full shadow-2xl relative"
                        >
                            <button 
                                onClick={() => setShowUnsavedModal(false)}
                                className="absolute top-4 right-4 text-foreground/40 hover:text-foreground p-1 rounded-full transition-colors cursor-pointer"
                            >
                                <X className="w-5 h-5" />
                            </button>

                            <div className="w-14 h-14 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-500 flex items-center justify-center mb-5">
                                <AlertTriangle className="w-7 h-7" />
                            </div>

                            <h3 className="text-xl font-black text-foreground mb-2">Salvar alterações não salvas?</h3>
                            <p className="text-xs md:text-sm text-foreground/60 leading-relaxed mb-6 font-medium">
                                Você fez alterações no seu perfil que ainda não foram salvas. Se sair agora sem salvar, essas mudanças serão perdidas.
                            </p>

                            <div className="flex flex-col gap-2.5">
                                <button
                                    onClick={handleSaveAndNavigate}
                                    disabled={isSavingAndNavigating || loading}
                                    className="w-full py-3.5 px-4 bg-accent hover:bg-accent/90 text-white font-bold text-xs uppercase tracking-wider rounded-xl transition-all shadow-lg shadow-accent/20 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60"
                                >
                                    {isSavingAndNavigating ? (
                                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                    ) : (
                                        <Save className="w-4 h-4" />
                                    )}
                                    Salvar Alterações e Sair
                                </button>

                                <button
                                    onClick={handleDiscardAndNavigate}
                                    className="w-full py-3 px-4 bg-surface border border-surface-border hover:bg-red-500/10 hover:text-red-500 hover:border-red-500/20 text-foreground/70 font-bold text-xs uppercase tracking-wider rounded-xl transition-all flex items-center justify-center cursor-pointer"
                                >
                                    Descartar e Sair
                                </button>

                                <button
                                    onClick={() => setShowUnsavedModal(false)}
                                    className="w-full py-2.5 px-4 text-foreground/50 hover:text-foreground font-semibold text-xs transition-colors text-center cursor-pointer"
                                >
                                    Continuar Editando
                                </button>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Toast */}
            <AnimatePresence>
                {toastMessage && (
                    <motion.div 
                        initial={{ opacity: 0, y: 50, scale: 0.95 }} 
                        animate={{ opacity: 1, y: 0, scale: 1 }} 
                        exit={{ opacity: 0, scale: 0.95, y: 20 }}
                        className="fixed bottom-6 right-6 z-[9999] bg-surface border border-surface-border shadow-2xl px-6 py-4 rounded-2xl flex items-center gap-3 max-w-sm border-accent/20"
                    >
                        <div className="w-8 h-8 bg-accent/10 text-accent rounded-full flex items-center justify-center shrink-0">
                            <ShieldCheck className="w-4 h-4" />
                        </div>
                        <p className="text-sm font-bold text-foreground">{toastMessage}</p>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
