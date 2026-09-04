"use client";

import { useEffect, useState, useRef, useMemo } from "react";
import { supabase } from "@/lib/supabase";
import { 
  User, 
  Shield, 
  Bell, 
  CheckCircle2, 
  Briefcase, 
  Code2, 
  ExternalLink, 
  Camera, 
  Upload, 
  Lock, 
  Eye, 
  EyeOff, 
  KeyRound, 
  Sparkles, 
  Save, 
  AlertCircle, 
  Globe, 
  Phone, 
  MapPin, 
  Sliders, 
  LogOut, 
  ShieldCheck, 
  Store, 
  Check, 
  Building2, 
  Mail,
  Trash2
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useRouter } from "next/navigation";
import { getAuthenticatedAccountType } from "@/lib/account";

export default function SettingsPage() {
    const [user, setUser] = useState<any>(null);
    const [profile, setProfile] = useState<any>(null);
    const [activeTab, setActiveTab] = useState<"profile" | "security" | "notifications" | "privacy">("profile");
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [accountType, setAccountType] = useState<"Comércio" | "Desenvolvedor">("Comércio");
    const [toast, setToast] = useState<{ type: "success" | "error" | "info"; msg: string } | null>(null);
    const router = useRouter();
    const fileInputRef = useRef<HTMLInputElement>(null);

    // Form Profile State
    const [formData, setFormData] = useState({
        name: "",
        email: "",
        phone: "",
        location: "",
        bio: "",
        avatar_url: "",
        website: "",
        github: "",
        linkedin: "",
        store_name: "",
        segment: "",
        cnpj: "",
        city: "",
        state: "",
        skills: ""
    });

    // Password State
    const [currentPassword, setCurrentPassword] = useState("");
    const [newPassword, setNewPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [showPasswords, setShowPasswords] = useState(false);
    const [passwordLoading, setPasswordLoading] = useState(false);

    // Notification Preferences State
    const [chatAlerts, setChatAlerts] = useState(true);
    const [deployNotifs, setDeployNotifs] = useState(true);
    const [emailReports, setEmailReports] = useState(true);
    const [proposalAlerts, setProposalAlerts] = useState(true);

    // Privacy State
    const [likesPrivate, setLikesPrivate] = useState(false);
    const [publicProfile, setPublicProfile] = useState(true);

    const showToast = (msg: string, type: "success" | "error" | "info" = "success") => {
        setToast({ type, msg });
        setTimeout(() => setToast(null), 3800);
    };

    // Load user session and full profile from Supabase
    useEffect(() => {
        const loadUserData = async () => {
            setLoading(true);
            try {
                const { data: { session } } = await supabase.auth.getSession();
                if (!session?.user) {
                    router.push("/login");
                    return;
                }

                setUser(session.user);
                const accType = await getAuthenticatedAccountType();
                setAccountType(accType);

                // Fetch database profile
                const { data: profileData, error: profileErr } = await supabase
                    .from('profiles')
                    .select('*')
                    .eq('id', session.user.id)
                    .single();

                if (profileData) {
                    setProfile(profileData);
                    setFormData({
                        name: profileData.name || session.user.user_metadata?.full_name || "",
                        email: profileData.email || session.user.email || "",
                        phone: profileData.phone || "",
                        location: profileData.location || "",
                        bio: profileData.bio || "",
                        avatar_url: profileData.avatar_url || "",
                        website: profileData.website || "",
                        github: profileData.github || "",
                        linkedin: profileData.linkedin || "",
                        store_name: profileData.store_name || "",
                        segment: profileData.segment || "",
                        cnpj: profileData.cnpj || "",
                        city: profileData.city || "",
                        state: profileData.state || "",
                        skills: Array.isArray(profileData.skills) ? profileData.skills.join(", ") : ""
                    });
                    setLikesPrivate(!!profileData.likes_private);
                } else {
                    // Fallback to session user metadata
                    setFormData(prev => ({
                        ...prev,
                        name: session.user.user_metadata?.full_name || session.user.email?.split("@")[0] || "",
                        email: session.user.email || ""
                    }));
                }

                // Load stored notification preferences
                setChatAlerts(localStorage.getItem("susanoo_chat_alerts") !== "false");
                setDeployNotifs(localStorage.getItem("susanoo_deploy_notifications") !== "false");
                setEmailReports(localStorage.getItem("susanoo_feedback_emails") !== "false");
                setProposalAlerts(localStorage.getItem("susanoo_proposal_alerts") !== "false");
            } catch (err) {
                console.error("Erro ao carregar dados do usuário:", err);
                showToast("Erro ao carregar configurações.", "error");
            } finally {
                setLoading(false);
            }
        };

        loadUserData();
    }, [router]);

    // Password strength calculation
    const passwordStrength = useMemo(() => {
        if (!newPassword) return { value: 0, label: "", color: "bg-transparent" };
        const hasUpperCase = /[A-Z]/.test(newPassword);
        const hasSymbol = /[!@#$%^&*(),.?":{}|<>]/.test(newPassword);
        const hasNumber = /[0-9]/.test(newPassword);
        const validLength = newPassword.length >= 8;

        let score = 0;
        if (validLength) score += 40;
        if (hasUpperCase) score += 20;
        if (hasNumber) score += 20;
        if (hasSymbol) score += 20;

        if (score >= 80) return { value: 100, label: "Forte", color: "bg-emerald-500" };
        if (score >= 40) return { value: 60, label: "Média", color: "bg-amber-500" };
        return { value: 25, label: "Fraca", color: "bg-red-500" };
    }, [newPassword]);

    // Handle avatar image upload to Supabase Storage
    const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (!e.target.files || e.target.files.length === 0 || !user) return;
        const file = e.target.files[0];

        if (!file.type.startsWith("image/")) {
            showToast("Selecione um arquivo de imagem válido.", "error");
            return;
        }

        if (file.size > 5 * 1024 * 1024) {
            showToast("A imagem deve ter no máximo 5MB.", "error");
            return;
        }

        setSaving(true);
        try {
            const fileExt = file.name.split('.').pop();
            const filePath = `profiles/avatar_${user.id}_${Date.now()}.${fileExt}`;

            const { error: uploadError } = await supabase.storage
                .from('project_files')
                .upload(filePath, file, { upsert: true });

            if (uploadError) throw uploadError;

            const { data: { publicUrl } } = supabase.storage
                .from('project_files')
                .getPublicUrl(filePath);

            setFormData(prev => ({ ...prev, avatar_url: publicUrl }));

            // Update profile with new avatar
            await supabase
                .from('profiles')
                .update({ avatar_url: publicUrl, updated_at: new Date().toISOString() })
                .eq('id', user.id);

            showToast("Foto de perfil atualizada!", "success");
        } catch (err: any) {
            console.error("Erro ao subir avatar:", err);
            showToast(err?.message || "Erro ao atualizar foto de perfil.", "error");
        } finally {
            setSaving(false);
        }
    };

    // Save profile changes
    const handleSaveProfile = async (e?: React.FormEvent) => {
        if (e) e.preventDefault();
        if (!user) return;

        setSaving(true);
        try {
            const skillsArray = formData.skills
                ? formData.skills.split(",").map(s => s.trim()).filter(Boolean)
                : [];

            const updatePayload: any = {
                name: formData.name,
                phone: formData.phone,
                location: formData.location,
                bio: formData.bio,
                website: formData.website,
                github: formData.github,
                linkedin: formData.linkedin,
                store_name: formData.store_name,
                segment: formData.segment,
                cnpj: formData.cnpj,
                city: formData.city,
                state: formData.state,
                skills: skillsArray,
                likes_private: likesPrivate
            };

            const { error: updateError } = await supabase
                .from('profiles')
                .update(updatePayload)
                .eq('id', user.id);

            if (updateError) throw updateError;

            // Also update auth user metadata if name changed
            if (formData.name !== user.user_metadata?.full_name) {
                await supabase.auth.updateUser({
                    data: { full_name: formData.name }
                });
            }

            showToast("Dados do perfil salvos com sucesso!", "success");
        } catch (err: any) {
            console.error("Erro ao salvar perfil:", err);
            showToast(err?.message || "Erro ao salvar alterações.", "error");
        } finally {
            setSaving(false);
        }
    };

    // Save preferences
    const handleSavePreferences = () => {
        localStorage.setItem("susanoo_chat_alerts", chatAlerts ? "true" : "false");
        localStorage.setItem("susanoo_deploy_notifications", deployNotifs ? "true" : "false");
        localStorage.setItem("susanoo_feedback_emails", emailReports ? "true" : "false");
        localStorage.setItem("susanoo_proposal_alerts", proposalAlerts ? "true" : "false");

        // Save likes_private to database
        if (user) {
            supabase
                .from('profiles')
                .update({ likes_private: likesPrivate })
                .eq('id', user.id)
                .then(() => {});
        }

        showToast("Preferências salvas com sucesso!", "success");
    };

    // Handle Password Update
    const handleUpdatePassword = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newPassword) {
            showToast("Digite a nova senha.", "error");
            return;
        }
        if (newPassword.length < 8) {
            showToast("A senha deve ter no mínimo 8 caracteres.", "error");
            return;
        }
        if (newPassword !== confirmPassword) {
            showToast("As senhas digitadas não coincidem.", "error");
            return;
        }

        setPasswordLoading(true);
        try {
            const { error } = await supabase.auth.updateUser({ password: newPassword });
            if (error) throw error;

            showToast("Senha alterada com sucesso!", "success");
            setNewPassword("");
            setConfirmPassword("");
            setCurrentPassword("");
        } catch (err: any) {
            console.error("Erro ao alterar senha:", err);
            showToast(err?.message || "Erro ao atualizar senha.", "error");
        } finally {
            setPasswordLoading(false);
        }
    };

    // Handle Logout
    const handleLogout = async () => {
        try {
            await supabase.auth.signOut();
            router.push("/login");
        } catch (err) {
            console.error("Erro ao deslogar:", err);
        }
    };

    if (loading) {
        return (
            <div className="flex-1 w-full bg-background flex flex-col items-center justify-center min-h-[70vh] gap-3">
                <div className="w-10 h-10 border-3 border-accent border-t-transparent rounded-full animate-spin" />
                <p className="text-xs font-bold uppercase tracking-widest text-foreground/40">Carregando configurações...</p>
            </div>
        );
    }

    return (
        <div className="flex-1 overflow-y-auto w-full bg-background text-foreground transition-colors duration-300 pb-24 custom-scrollbar">
            <div className="max-w-6xl mx-auto px-4 sm:px-8 pt-8 md:pt-12 space-y-8">
                
                {/* Header Superior Moderno com Glassmorphism */}
                <motion.div 
                    initial={{ opacity: 0, y: -10 }} 
                    animate={{ opacity: 1, y: 0 }}
                    className="relative overflow-hidden rounded-3xl border border-surface-border bg-gradient-to-br from-surface via-surface/80 to-background p-6 md:p-8 shadow-sm"
                >
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10">
                        <div className="flex items-center gap-5">
                            {/* Avatar com ação de foto rápida */}
                            <div className="relative group">
                                <div className="w-20 h-20 md:w-22 md:h-22 rounded-2xl bg-surface border-2 border-surface-border overflow-hidden flex items-center justify-center shadow-md">
                                    {formData.avatar_url ? (
                                        <img src={formData.avatar_url} alt={formData.name} className="w-full h-full object-cover" />
                                    ) : (
                                        <span className="text-2xl font-black text-foreground/30 italic uppercase">
                                            {(formData.name || user?.email || "SU").substring(0, 2).toUpperCase()}
                                        </span>
                                    )}
                                </div>
                                <button
                                    type="button"
                                    onClick={() => fileInputRef.current?.click()}
                                    className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity rounded-2xl flex flex-col items-center justify-center text-white text-[10px] font-bold gap-1 cursor-pointer backdrop-blur-[2px]"
                                    title="Alterar Foto de Perfil"
                                >
                                    <Camera className="w-5 h-5" />
                                    <span>Alterar</span>
                                </button>
                                <input
                                    type="file"
                                    ref={fileInputRef}
                                    hidden
                                    accept="image/*"
                                    onChange={handleAvatarUpload}
                                />
                            </div>

                            <div>
                                <div className="flex items-center gap-2 flex-wrap mb-1">
                                    <span className="text-xs font-black uppercase tracking-wider px-3 py-1 rounded-full bg-accent/10 border border-accent/20 text-accent flex items-center gap-1.5">
                                        {accountType === "Desenvolvedor" ? <Code2 className="w-3.5 h-3.5" /> : <Store className="w-3.5 h-3.5" />}
                                        {accountType}
                                    </span>
                                    <span className="text-[11px] font-bold text-emerald-500 bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-0.5 rounded-full flex items-center gap-1">
                                        <ShieldCheck className="w-3 h-3" /> Conta Ativa
                                    </span>
                                </div>
                                <h1 className="text-2xl md:text-3xl font-black tracking-tight text-foreground">
                                    {formData.name || "Minha Conta"}
                                </h1>
                                <p className="text-sm text-foreground/50 font-medium">
                                    {user?.email}
                                </p>
                            </div>
                        </div>

                        {/* Ações de Topo */}
                        <div className="flex items-center gap-3 self-start md:self-center">
                            <button
                                onClick={() => router.push("/dashboard/profile")}
                                className="px-4 py-2.5 rounded-xl border border-surface-border bg-surface hover:bg-surface-border/40 text-xs font-bold text-foreground flex items-center gap-2 transition-all cursor-pointer shadow-sm hover:scale-[1.02]"
                            >
                                <ExternalLink className="w-4 h-4 text-foreground/50" />
                                Ver Perfil Público
                            </button>
                            <button
                                onClick={handleLogout}
                                className="px-4 py-2.5 rounded-xl border border-red-500/20 bg-red-500/10 hover:bg-red-500/20 text-xs font-bold text-red-500 flex items-center gap-2 transition-all cursor-pointer"
                                title="Sair da Conta"
                            >
                                <LogOut className="w-4 h-4" />
                                Sair
                            </button>
                        </div>
                    </div>
                </motion.div>

                {/* Navegação por Abas Intuitiva */}
                <div className="flex items-center gap-2 overflow-x-auto pb-2 border-b border-surface-border custom-scrollbar">
                    <button
                        onClick={() => setActiveTab("profile")}
                        className={`flex items-center gap-2 px-5 py-3 rounded-2xl font-bold text-xs uppercase tracking-wider transition-all whitespace-nowrap cursor-pointer ${
                            activeTab === "profile"
                                ? "bg-accent text-white shadow-md shadow-accent/20"
                                : "text-foreground/50 hover:text-foreground hover:bg-surface"
                        }`}
                    >
                        <User className="w-4 h-4" />
                        Perfil & Dados
                    </button>
                    <button
                        onClick={() => setActiveTab("security")}
                        className={`flex items-center gap-2 px-5 py-3 rounded-2xl font-bold text-xs uppercase tracking-wider transition-all whitespace-nowrap cursor-pointer ${
                            activeTab === "security"
                                ? "bg-accent text-white shadow-md shadow-accent/20"
                                : "text-foreground/50 hover:text-foreground hover:bg-surface"
                        }`}
                    >
                        <Shield className="w-4 h-4" />
                        Segurança & Senha
                    </button>
                    <button
                        onClick={() => setActiveTab("notifications")}
                        className={`flex items-center gap-2 px-5 py-3 rounded-2xl font-bold text-xs uppercase tracking-wider transition-all whitespace-nowrap cursor-pointer ${
                            activeTab === "notifications"
                                ? "bg-accent text-white shadow-md shadow-accent/20"
                                : "text-foreground/50 hover:text-foreground hover:bg-surface"
                        }`}
                    >
                        <Bell className="w-4 h-4" />
                        Notificações
                    </button>
                    <button
                        onClick={() => setActiveTab("privacy")}
                        className={`flex items-center gap-2 px-5 py-3 rounded-2xl font-bold text-xs uppercase tracking-wider transition-all whitespace-nowrap cursor-pointer ${
                            activeTab === "privacy"
                                ? "bg-accent text-white shadow-md shadow-accent/20"
                                : "text-foreground/50 hover:text-foreground hover:bg-surface"
                        }`}
                    >
                        <Sliders className="w-4 h-4" />
                        Privacidade
                    </button>
                </div>

                {/* Conteúdo das Abas */}
                <div className="space-y-6">

                    {/* ABA 1: PERFIL & DADOS */}
                    {activeTab === "profile" && (
                        <motion.div 
                            initial={{ opacity: 0, y: 8 }} 
                            animate={{ opacity: 1, y: 0 }}
                            className="bg-surface border border-surface-border rounded-3xl p-6 md:p-10 shadow-sm space-y-8"
                        >
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-surface-border">
                                <div>
                                    <h2 className="text-xl font-black text-foreground">Informações Cadastrais</h2>
                                    <p className="text-xs font-medium text-foreground/50 mt-1">
                                        Mantenha seus dados comerciais ou profissionais atualizados para clientes e parceiros.
                                    </p>
                                </div>
                                <button
                                    onClick={handleSaveProfile}
                                    disabled={saving}
                                    className="px-6 py-3 bg-accent text-white font-bold text-xs uppercase tracking-wider rounded-xl shadow-md hover:bg-accent/90 transition-all flex items-center gap-2 cursor-pointer disabled:opacity-50 self-start sm:self-center"
                                >
                                    {saving ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <Save className="w-4 h-4" />}
                                    {saving ? "Salvando..." : "Salvar Dados"}
                                </button>
                            </div>

                            <form onSubmit={handleSaveProfile} className="space-y-6">
                                {/* Informações Básicas */}
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div>
                                        <label className="text-xs font-bold uppercase tracking-wider text-foreground/50 mb-2 block">
                                            Nome Completo / Representante
                                        </label>
                                        <input
                                            type="text"
                                            value={formData.name}
                                            onChange={e => setFormData({ ...formData, name: e.target.value })}
                                            placeholder="Ex: Carlos Silva"
                                            className="w-full bg-background border border-surface-border rounded-xl px-4 py-3.5 text-sm font-medium text-foreground focus:border-accent outline-none transition-all"
                                        />
                                    </div>

                                    <div>
                                        <label className="text-xs font-bold uppercase tracking-wider text-foreground/50 mb-2 block">
                                            E-mail de Acesso
                                        </label>
                                        <div className="relative">
                                            <input
                                                type="email"
                                                disabled
                                                value={formData.email}
                                                className="w-full bg-background/50 border border-surface-border rounded-xl px-4 py-3.5 text-sm font-medium text-foreground/60 outline-none cursor-not-allowed"
                                            />
                                            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] font-bold uppercase tracking-wider bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 px-2 py-0.5 rounded-lg">
                                                Verificado
                                            </span>
                                        </div>
                                    </div>

                                    <div>
                                        <label className="text-xs font-bold uppercase tracking-wider text-foreground/50 mb-2 block flex items-center gap-1.5">
                                            <Phone className="w-3.5 h-3.5 text-accent" /> Telefone / WhatsApp
                                        </label>
                                        <input
                                            type="text"
                                            value={formData.phone}
                                            onChange={e => setFormData({ ...formData, phone: e.target.value })}
                                            placeholder="(11) 98765-4321"
                                            className="w-full bg-background border border-surface-border rounded-xl px-4 py-3.5 text-sm font-medium text-foreground focus:border-accent outline-none transition-all"
                                        />
                                    </div>

                                    <div>
                                        <label className="text-xs font-bold uppercase tracking-wider text-foreground/50 mb-2 block flex items-center gap-1.5">
                                            <MapPin className="w-3.5 h-3.5 text-accent" /> Localização / Cidade
                                        </label>
                                        <input
                                            type="text"
                                            value={formData.location}
                                            onChange={e => setFormData({ ...formData, location: e.target.value })}
                                            placeholder="Ex: São Paulo, SP"
                                            className="w-full bg-background border border-surface-border rounded-xl px-4 py-3.5 text-sm font-medium text-foreground focus:border-accent outline-none transition-all"
                                        />
                                    </div>
                                </div>

                                {/* Campos Condicionais: Comércio vs Desenvolvedor */}
                                {accountType === "Desenvolvedor" ? (
                                    <div className="pt-6 border-t border-surface-border space-y-6">
                                        <h3 className="text-sm font-black uppercase tracking-wider text-accent flex items-center gap-2">
                                            <Code2 className="w-4 h-4" /> Informações Profissionais de Desenvolvedor
                                        </h3>
                                        
                                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                            <div>
                                                <label className="text-xs font-bold uppercase tracking-wider text-foreground/50 mb-2 block">
                                                    GitHub
                                                </label>
                                                <input
                                                    type="text"
                                                    value={formData.github}
                                                    onChange={e => setFormData({ ...formData, github: e.target.value })}
                                                    placeholder="https://github.com/usuario"
                                                    className="w-full bg-background border border-surface-border rounded-xl px-4 py-3.5 text-sm font-medium text-foreground focus:border-accent outline-none"
                                                />
                                            </div>
                                            <div>
                                                <label className="text-xs font-bold uppercase tracking-wider text-foreground/50 mb-2 block">
                                                    LinkedIn
                                                </label>
                                                <input
                                                    type="text"
                                                    value={formData.linkedin}
                                                    onChange={e => setFormData({ ...formData, linkedin: e.target.value })}
                                                    placeholder="https://linkedin.com/in/usuario"
                                                    className="w-full bg-background border border-surface-border rounded-xl px-4 py-3.5 text-sm font-medium text-foreground focus:border-accent outline-none"
                                                />
                                            </div>
                                            <div>
                                                <label className="text-xs font-bold uppercase tracking-wider text-foreground/50 mb-2 block">
                                                    Portfólio / Website
                                                </label>
                                                <input
                                                    type="text"
                                                    value={formData.website}
                                                    onChange={e => setFormData({ ...formData, website: e.target.value })}
                                                    placeholder="https://meusite.com"
                                                    className="w-full bg-background border border-surface-border rounded-xl px-4 py-3.5 text-sm font-medium text-foreground focus:border-accent outline-none"
                                                />
                                            </div>
                                        </div>

                                        <div>
                                            <label className="text-xs font-bold uppercase tracking-wider text-foreground/50 mb-2 block">
                                                Especialidades & Habilidades (separadas por vírgula)
                                            </label>
                                            <input
                                                type="text"
                                                value={formData.skills}
                                                onChange={e => setFormData({ ...formData, skills: e.target.value })}
                                                placeholder="React, Next.js, Node.js, TailwindCSS, PostgreSQL"
                                                className="w-full bg-background border border-surface-border rounded-xl px-4 py-3.5 text-sm font-medium text-foreground focus:border-accent outline-none"
                                            />
                                        </div>
                                    </div>
                                ) : (
                                    <div className="pt-6 border-t border-surface-border space-y-6">
                                        <h3 className="text-sm font-black uppercase tracking-wider text-accent flex items-center gap-2">
                                            <Store className="w-4 h-4" /> Informações do Comércio
                                        </h3>

                                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                            <div>
                                                <label className="text-xs font-bold uppercase tracking-wider text-foreground/50 mb-2 block">
                                                    Nome Fantasia da Loja
                                                </label>
                                                <input
                                                    type="text"
                                                    value={formData.store_name}
                                                    onChange={e => setFormData({ ...formData, store_name: e.target.value })}
                                                    placeholder="Ex: Boutique Elegance"
                                                    className="w-full bg-background border border-surface-border rounded-xl px-4 py-3.5 text-sm font-medium text-foreground focus:border-accent outline-none"
                                                />
                                            </div>
                                            <div>
                                                <label className="text-xs font-bold uppercase tracking-wider text-foreground/50 mb-2 block">
                                                    Nicho / Segmento
                                                </label>
                                                <input
                                                    type="text"
                                                    value={formData.segment}
                                                    onChange={e => setFormData({ ...formData, segment: e.target.value })}
                                                    placeholder="Ex: Moda Feminina, Padaria..."
                                                    className="w-full bg-background border border-surface-border rounded-xl px-4 py-3.5 text-sm font-medium text-foreground focus:border-accent outline-none"
                                                />
                                            </div>
                                            <div>
                                                <label className="text-xs font-bold uppercase tracking-wider text-foreground/50 mb-2 block">
                                                    CNPJ (Opcional)
                                                </label>
                                                <input
                                                    type="text"
                                                    value={formData.cnpj}
                                                    onChange={e => setFormData({ ...formData, cnpj: e.target.value })}
                                                    placeholder="00.000.000/0001-00"
                                                    className="w-full bg-background border border-surface-border rounded-xl px-4 py-3.5 text-sm font-medium text-foreground focus:border-accent outline-none"
                                                />
                                            </div>
                                        </div>
                                    </div>
                                )}

                                <div>
                                    <label className="text-xs font-bold uppercase tracking-wider text-foreground/50 mb-2 block">
                                        Bio / Apresentação Resumida
                                    </label>
                                    <textarea
                                        rows={4}
                                        value={formData.bio}
                                        onChange={e => setFormData({ ...formData, bio: e.target.value })}
                                        placeholder="Conte um pouco sobre sua trajetória, projetos ou história do seu negócio..."
                                        className="w-full bg-background border border-surface-border rounded-xl px-4 py-3.5 text-sm font-medium text-foreground focus:border-accent outline-none resize-none"
                                    />
                                </div>

                                <div className="pt-4 flex justify-end">
                                    <button
                                        type="submit"
                                        disabled={saving}
                                        className="px-8 py-3.5 bg-accent text-white font-black text-xs uppercase tracking-wider rounded-xl shadow-lg hover:bg-accent/90 transition-all flex items-center gap-2 cursor-pointer disabled:opacity-50"
                                    >
                                        {saving ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <Save className="w-4 h-4" />}
                                        {saving ? "Salvando..." : "Salvar Alterações"}
                                    </button>
                                </div>
                            </form>
                        </motion.div>
                    )}

                    {/* ABA 2: SEGURANÇA & SENHA */}
                    {activeTab === "security" && (
                        <motion.div 
                            initial={{ opacity: 0, y: 8 }} 
                            animate={{ opacity: 1, y: 0 }}
                            className="bg-surface border border-surface-border rounded-3xl p-6 md:p-10 shadow-sm space-y-8"
                        >
                            <div>
                                <h2 className="text-xl font-black text-foreground">Segurança & Acesso</h2>
                                <p className="text-xs font-medium text-foreground/50 mt-1">
                                    Controle as credenciais de acesso da sua conta e proteja seus dados.
                                </p>
                            </div>

                            <form onSubmit={handleUpdatePassword} className="space-y-6 max-w-2xl">
                                <div className="p-5 rounded-2xl bg-background border border-surface-border flex items-start gap-4">
                                    <div className="w-10 h-10 rounded-xl bg-accent/10 border border-accent/20 flex items-center justify-center text-accent shrink-0">
                                        <KeyRound className="w-5 h-5" />
                                    </div>
                                    <div>
                                        <h3 className="text-sm font-bold text-foreground">Definir Nova Senha</h3>
                                        <p className="text-xs text-foreground/50 mt-0.5">
                                            Recomendamos usar pelo menos 8 caracteres contendo letras maiúsculas, números e caracteres especiais.
                                        </p>
                                    </div>
                                </div>

                                <div className="space-y-4">
                                    <div>
                                        <label className="text-xs font-bold uppercase tracking-wider text-foreground/50 mb-2 block">
                                            Nova Senha
                                        </label>
                                        <div className="relative">
                                            <input
                                                type={showPasswords ? "text" : "password"}
                                                value={newPassword}
                                                onChange={e => setNewPassword(e.target.value)}
                                                placeholder="••••••••"
                                                className="w-full bg-background border border-surface-border rounded-xl px-4 py-3.5 text-sm font-medium text-foreground focus:border-accent outline-none pr-12"
                                            />
                                            <button
                                                type="button"
                                                onClick={() => setShowPasswords(!showPasswords)}
                                                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-foreground/40 hover:text-foreground transition-colors"
                                            >
                                                {showPasswords ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                            </button>
                                        </div>

                                        {/* Indicador Visual de Força da Senha */}
                                        {newPassword.length > 0 && (
                                            <div className="mt-2.5 space-y-2">
                                                <div className="flex items-center gap-3">
                                                    <div className="flex-1 h-1.5 bg-background border border-surface-border rounded-full overflow-hidden">
                                                        <div
                                                            className={`h-full ${passwordStrength.color} transition-all duration-300`}
                                                            style={{ width: `${passwordStrength.value}%` }}
                                                        />
                                                    </div>
                                                    <span className="text-[10px] font-black uppercase tracking-wider text-foreground/60">
                                                        {passwordStrength.label}
                                                    </span>
                                                </div>
                                            </div>
                                        )}
                                    </div>

                                    <div>
                                        <label className="text-xs font-bold uppercase tracking-wider text-foreground/50 mb-2 block">
                                            Confirmar Nova Senha
                                        </label>
                                        <input
                                            type={showPasswords ? "text" : "password"}
                                            value={confirmPassword}
                                            onChange={e => setConfirmPassword(e.target.value)}
                                            placeholder="Confirme a nova senha"
                                            className="w-full bg-background border border-surface-border rounded-xl px-4 py-3.5 text-sm font-medium text-foreground focus:border-accent outline-none"
                                        />
                                    </div>
                                </div>

                                <div className="pt-2 flex justify-end">
                                    <button
                                        type="submit"
                                        disabled={passwordLoading || !newPassword || passwordStrength.value < 40}
                                        className="px-8 py-3.5 bg-accent text-white font-black text-xs uppercase tracking-wider rounded-xl shadow-lg hover:bg-accent/90 transition-all flex items-center gap-2 cursor-pointer disabled:opacity-50"
                                    >
                                        {passwordLoading ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <Lock className="w-4 h-4" />}
                                        {passwordLoading ? "Atualizando..." : "Alterar Senha"}
                                    </button>
                                </div>
                            </form>

                            {/* Sessões e Logout Geral */}
                            <div className="pt-8 border-t border-surface-border">
                                <h3 className="text-sm font-black uppercase tracking-wider text-red-500 mb-4 flex items-center gap-2">
                                    <AlertCircle className="w-4 h-4" /> Zona de Desconexão
                                </h3>
                                <div className="p-5 rounded-2xl bg-red-500/5 border border-red-500/20 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                                    <div>
                                        <h4 className="text-sm font-bold text-foreground">Encerrar sessão em todos os dispositivos</h4>
                                        <p className="text-xs text-foreground/50 mt-0.5">
                                            Desconecta seu usuário de navegadores e outros aparelhos ativos no momento.
                                        </p>
                                    </div>
                                    <button
                                        onClick={handleLogout}
                                        className="px-5 py-2.5 rounded-xl bg-red-500 text-white text-xs font-black uppercase tracking-wider hover:bg-red-600 transition-colors shadow-sm cursor-pointer self-start sm:self-center"
                                    >
                                        Sair de Tudo
                                    </button>
                                </div>
                            </div>
                        </motion.div>
                    )}

                    {/* ABA 3: NOTIFICAÇÕES */}
                    {activeTab === "notifications" && (
                        <motion.div 
                            initial={{ opacity: 0, y: 8 }} 
                            animate={{ opacity: 1, y: 0 }}
                            className="bg-surface border border-surface-border rounded-3xl p-6 md:p-10 shadow-sm space-y-8"
                        >
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-surface-border">
                                <div>
                                    <h2 className="text-xl font-black text-foreground">Preferências de Notificações</h2>
                                    <p className="text-xs font-medium text-foreground/50 mt-1">
                                        Escolha como e quando deseja receber novidades, mensagens e avisos importantes.
                                    </p>
                                </div>
                                <button
                                    onClick={handleSavePreferences}
                                    className="px-6 py-3 bg-accent text-white font-bold text-xs uppercase tracking-wider rounded-xl shadow-md hover:bg-accent/90 transition-all flex items-center gap-2 cursor-pointer self-start sm:self-center"
                                >
                                    <Save className="w-4 h-4" /> Salvar Preferências
                                </button>
                            </div>

                            <div className="space-y-4">
                                {[
                                    {
                                        title: "Alertas do Chat em Tempo Real",
                                        desc: "Sons e notificações visuais na interface quando novos clientes ou desenvolvedores enviarem mensagens.",
                                        state: chatAlerts,
                                        toggle: () => setChatAlerts(!chatAlerts)
                                    },
                                    {
                                        title: "Atualizações de Deploy e Publicação",
                                        desc: "Avisar sempre que um projeto for publicado, alterado ou entrar em revisão pela equipe Susanoo.",
                                        state: deployNotifs,
                                        toggle: () => setDeployNotifs(!deployNotifs)
                                    },
                                    {
                                        title: "Notificações de Propostas Comerciais",
                                        desc: "Receber avisos imediatos sobre manifestações de interesse e propostas de orçamento no marketplace.",
                                        state: proposalAlerts,
                                        toggle: () => setProposalAlerts(!proposalAlerts)
                                    },
                                    {
                                        title: "Resumo Semanal por E-mail",
                                        desc: "Estatísticas de visualizações, visitas na vitrine e progresso dos seus sites e serviços.",
                                        state: emailReports,
                                        toggle: () => setEmailReports(!emailReports)
                                    },
                                ].map((item, index) => (
                                    <div
                                        key={index}
                                        className="p-5 bg-background border border-surface-border rounded-2xl flex items-center justify-between gap-4 transition-all hover:border-foreground/20"
                                    >
                                        <div>
                                            <h4 className="text-sm font-bold text-foreground">{item.title}</h4>
                                            <p className="text-xs text-foreground/50 mt-0.5 max-w-xl leading-relaxed">{item.desc}</p>
                                        </div>
                                        <button
                                            type="button"
                                            onClick={item.toggle}
                                            className={`w-12 h-7 rounded-full transition-colors relative flex items-center px-1 cursor-pointer shrink-0 ${
                                                item.state ? "bg-accent" : "bg-surface-border"
                                            }`}
                                        >
                                            <motion.div
                                                layout
                                                transition={{ type: "spring", stiffness: 500, damping: 30 }}
                                                className={`w-5 h-5 rounded-full bg-white shadow-md ${
                                                    item.state ? "ml-auto" : "ml-0"
                                                }`}
                                            />
                                        </button>
                                    </div>
                                ))}
                            </div>
                        </motion.div>
                    )}

                    {/* ABA 4: PRIVACIDADE */}
                    {activeTab === "privacy" && (
                        <motion.div 
                            initial={{ opacity: 0, y: 8 }} 
                            animate={{ opacity: 1, y: 0 }}
                            className="bg-surface border border-surface-border rounded-3xl p-6 md:p-10 shadow-sm space-y-8"
                        >
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-surface-border">
                                <div>
                                    <h2 className="text-xl font-black text-foreground">Privacidade & Visibilidade</h2>
                                    <p className="text-xs font-medium text-foreground/50 mt-1">
                                        Gerencie a visibilidade do seu perfil e interações no marketplace da Susanoo.
                                    </p>
                                </div>
                                <button
                                    onClick={handleSavePreferences}
                                    className="px-6 py-3 bg-accent text-white font-bold text-xs uppercase tracking-wider rounded-xl shadow-md hover:bg-accent/90 transition-all flex items-center gap-2 cursor-pointer self-start sm:self-center"
                                >
                                    <Save className="w-4 h-4" /> Salvar Preferências
                                </button>
                            </div>

                            <div className="space-y-4">
                                <div className="p-5 bg-background border border-surface-border rounded-2xl flex items-center justify-between gap-4">
                                    <div>
                                        <h4 className="text-sm font-bold text-foreground">Curtidas Privadas</h4>
                                        <p className="text-xs text-foreground/50 mt-0.5 max-w-xl">
                                            Oculte da visualização de outros usuários os sites e templates que você favoritou no marketplace.
                                        </p>
                                    </div>
                                    <button
                                        type="button"
                                        onClick={() => setLikesPrivate(!likesPrivate)}
                                        className={`w-12 h-7 rounded-full transition-colors relative flex items-center px-1 cursor-pointer shrink-0 ${
                                            likesPrivate ? "bg-accent" : "bg-surface-border"
                                        }`}
                                    >
                                        <motion.div
                                            layout
                                            transition={{ type: "spring", stiffness: 500, damping: 30 }}
                                            className={`w-5 h-5 rounded-full bg-white shadow-md ${
                                                likesPrivate ? "ml-auto" : "ml-0"
                                            }`}
                                        />
                                    </button>
                                </div>

                                <div className="p-5 bg-background border border-surface-border rounded-2xl flex items-center justify-between gap-4">
                                    <div>
                                        <h4 className="text-sm font-bold text-foreground">Perfil Ativo no Diretório</h4>
                                        <p className="text-xs text-foreground/50 mt-0.5 max-w-xl">
                                            Permitir que seu comércio ou portfólio profissional apareça nas listagens públicas da plataforma.
                                        </p>
                                    </div>
                                    <button
                                        type="button"
                                        onClick={() => setPublicProfile(!publicProfile)}
                                        className={`w-12 h-7 rounded-full transition-colors relative flex items-center px-1 cursor-pointer shrink-0 ${
                                            publicProfile ? "bg-accent" : "bg-surface-border"
                                        }`}
                                    >
                                        <motion.div
                                            layout
                                            transition={{ type: "spring", stiffness: 500, damping: 30 }}
                                            className={`w-5 h-5 rounded-full bg-white shadow-md ${
                                                publicProfile ? "ml-auto" : "ml-0"
                                            }`}
                                        />
                                    </button>
                                </div>
                            </div>
                        </motion.div>
                    )}

                </div>
            </div>

            {/* Toast Flutuante Elegante */}
            <AnimatePresence>
                {toast && (
                    <motion.div 
                        initial={{ opacity: 0, y: 40, scale: 0.95 }} 
                        animate={{ opacity: 1, y: 0, scale: 1 }} 
                        exit={{ opacity: 0, y: 20, scale: 0.95 }}
                        className={`fixed bottom-6 right-6 z-[9999] px-6 py-4 rounded-2xl border shadow-2xl flex items-center gap-3 max-w-md ${
                            toast.type === 'success' 
                                ? 'bg-surface border-emerald-500/30 text-foreground' 
                                : toast.type === 'error'
                                    ? 'bg-surface border-red-500/30 text-foreground'
                                    : 'bg-surface border-surface-border text-foreground'
                        }`}
                    >
                        <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 ${
                            toast.type === 'success' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-red-500/20 text-red-400'
                        }`}>
                            {toast.type === 'success' ? <CheckCircle2 className="w-5 h-5" /> : <AlertCircle className="w-5 h-5" />}
                        </div>
                        <p className="text-xs font-bold leading-snug">{toast.msg}</p>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
