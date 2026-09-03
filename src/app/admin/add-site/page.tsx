"use client";
import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { AddSiteForm } from "@/components/AddSiteForm";
import { COMMERCE_CATEGORIES } from "@/lib/commerceCategories";
import { 
  Package, 
  Plus, 
  Search, 
  Filter, 
  ExternalLink, 
  Edit3, 
  Trash2, 
  Eye, 
  EyeOff, 
  Sparkles, 
  Layout, 
  Code2, 
  CheckCircle2, 
  DollarSign, 
  Layers, 
  Image as ImageIcon,
  Monitor,
  X,
  Save,
  AlertTriangle,
  ArrowUpDown,
  ShoppingBag
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export default function AdminAddSitePage() {
    const [activeTab, setActiveTab] = useState<"catalog" | "add">("catalog");
    const [projects, setProjects] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState("");
    const [typeFilter, setTypeFilter] = useState<"all" | "ready_made" | "template">("all");
    const [categoryFilter, setCategoryFilter] = useState<string>("all");
    
    // Modal de Edição
    const [editingProject, setEditingProject] = useState<any | null>(null);
    const [savingEdit, setSavingEdit] = useState(false);
    const [editForm, setEditForm] = useState({
        name: "",
        description: "",
        price: "",
        installments: false,
        category: "Landing Page",
        product_type: "ready_made",
        deploy_url: "",
        status: "published",
        show_in_gallery: true,
    });

    // Modal de Exclusão
    const [deletingProject, setDeletingProject] = useState<any | null>(null);
    const [deletingLoading, setDeletingLoading] = useState(false);

    // Toast
    const [toastMessage, setToastMessage] = useState<string | null>(null);

    const showToast = (msg: string) => {
        setToastMessage(msg);
        setTimeout(() => setToastMessage(null), 3500);
    };

    const fetchProjects = async () => {
        setLoading(true);
        try {
            const { data, error } = await supabase
                .from('projects')
                .select('*')
                .order('created_at', { ascending: false });
            
            if (error) throw error;
            setProjects(data || []);
        } catch (err: any) {
            console.error("Erro ao buscar projetos:", err);
            showToast("Erro ao carregar projetos.");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchProjects();

        const channel = supabase.channel('admin-projects-realtime')
            .on('postgres_changes', { event: '*', schema: 'public', table: 'projects' }, () => {
                fetchProjects();
            })
            .subscribe();

        return () => { supabase.removeChannel(channel); };
    }, []);

    const handleOpenEdit = (project: any) => {
        setEditingProject(project);
        setEditForm({
            name: project.name || "",
            description: project.description || "",
            price: project.price ? String(project.price) : "",
            installments: !!project.installments,
            category: project.category || "Landing Page",
            product_type: project.product_type || "ready_made",
            deploy_url: project.deploy_url || "",
            status: project.status || "published",
            show_in_gallery: project.show_in_gallery !== false,
        });
    };

    const handleSaveEdit = async () => {
        if (!editingProject) return;
        if (!editForm.name) return showToast("Nome do site é obrigatório.");

        setSavingEdit(true);
        try {
            const { error } = await supabase
                .from('projects')
                .update({
                    name: editForm.name,
                    description: editForm.description,
                    price: parseFloat(editForm.price) || 0,
                    installments: editForm.installments,
                    category: editForm.category,
                    product_type: editForm.product_type,
                    deploy_url: editForm.deploy_url,
                    status: editForm.status,
                    show_in_gallery: editForm.show_in_gallery,
                    updated_at: new Date().toISOString()
                })
                .eq('id', editingProject.id);

            if (error) throw error;

            showToast("Projeto atualizado com sucesso!");
            setEditingProject(null);
            fetchProjects();
        } catch (err: any) {
            console.error("Erro ao atualizar:", err);
            showToast("Erro ao salvar alterações.");
        } finally {
            setSavingEdit(false);
        }
    };

    const handleToggleGallery = async (project: any) => {
        const nextState = !project.show_in_gallery;
        try {
            const { error } = await supabase
                .from('projects')
                .update({ show_in_gallery: nextState })
                .eq('id', project.id);

            if (error) throw error;
            showToast(nextState ? "Site visível na vitrine!" : "Site ocultado da vitrine.");
            fetchProjects();
        } catch (err: any) {
            showToast("Erro ao alterar visibilidade.");
        }
    };

    const handleDeleteProject = async () => {
        if (!deletingProject) return;
        setDeletingLoading(true);
        try {
            const { error } = await supabase
                .from('projects')
                .delete()
                .eq('id', deletingProject.id);

            if (error) throw error;
            showToast("Projeto excluído com sucesso.");
            setDeletingProject(null);
            fetchProjects();
        } catch (err: any) {
            console.error("Erro ao excluir:", err);
            showToast("Erro ao excluir projeto.");
        } finally {
            setDeletingLoading(false);
        }
    };

    // Filtros e Métricas
    const readyMadeCount = projects.filter(p => p.product_type === 'ready_made' || !p.product_type).length;
    const templateCount = projects.filter(p => p.product_type === 'template').length;
    const visibleCount = projects.filter(p => p.show_in_gallery !== false).length;

    const filteredProjects = projects.filter(p => {
        const matchesSearch = (p.name || "").toLowerCase().includes(search.toLowerCase()) ||
                              (p.description || "").toLowerCase().includes(search.toLowerCase()) ||
                              (p.category || "").toLowerCase().includes(search.toLowerCase());

        const matchesType = typeFilter === "all" ? true : (
            typeFilter === "ready_made" 
                ? (p.product_type === 'ready_made' || !p.product_type)
                : p.product_type === 'template'
        );

        const matchesCategory = categoryFilter === "all" ? true : p.category === categoryFilter;

        return matchesSearch && matchesType && matchesCategory;
    });

    const categories = Array.from(new Set(projects.map(p => p.category).filter(Boolean)));

    return (
        <div className="flex-1 overflow-y-auto p-6 md:p-10 2xl:p-14 bg-background transition-colors duration-300 custom-scrollbar">
            <div className="max-w-7xl mx-auto space-y-8 pb-20">
                
                {/* Header e Abas */}
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 pb-6 border-b border-surface-border">
                    <div>
                        <div className="flex items-center gap-2 mb-2">
                            <span className="text-[10px] font-black uppercase tracking-[0.25em] text-accent bg-accent/10 border border-accent/20 px-3 py-1 rounded-full flex items-center gap-1.5">
                                <Sparkles className="w-3.5 h-3.5" /> Gestão de Catálogo & Portfólio Master
                            </span>
                        </div>
                        <h1 className="text-3xl md:text-4xl font-black text-foreground tracking-tight">
                            Sites & Templates Cadastrados
                        </h1>
                        <p className="text-foreground/50 text-sm font-medium mt-1">
                            Gerencie os sites prontos e templates já adicionados ao marketplace da Susanoo ou lance novos produtos.
                        </p>
                    </div>

                    {/* Alternador de Abas */}
                    <div className="flex items-center bg-surface border border-surface-border p-1.5 rounded-2xl shadow-sm self-start lg:self-center">
                        <button
                            onClick={() => setActiveTab("catalog")}
                            className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-xs uppercase tracking-wider transition-all cursor-pointer ${
                                activeTab === "catalog"
                                    ? "bg-accent text-white shadow-md shadow-accent/20"
                                    : "text-foreground/60 hover:text-foreground hover:bg-foreground/5"
                            }`}
                        >
                            <Package className="w-4 h-4" />
                            Catálogo ({projects.length})
                        </button>
                        <button
                            onClick={() => setActiveTab("add")}
                            className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-xs uppercase tracking-wider transition-all cursor-pointer ${
                                activeTab === "add"
                                    ? "bg-accent text-white shadow-md shadow-accent/20"
                                    : "text-foreground/60 hover:text-foreground hover:bg-foreground/5"
                            }`}
                        >
                            <Plus className="w-4 h-4" />
                            Cadastrar Novo Site
                        </button>
                    </div>
                </div>

                {/* Conteúdo da Aba Catálogo */}
                {activeTab === "catalog" && (
                    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-8">
                        
                        {/* Métricas Rápidas */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                            <div className="bg-surface border border-surface-border p-5 rounded-2xl shadow-sm flex items-center justify-between">
                                <div>
                                    <p className="text-[11px] font-bold text-foreground/40 uppercase tracking-wider">Total em Catálogo</p>
                                    <h3 className="text-2xl font-black text-foreground mt-1">{projects.length}</h3>
                                </div>
                                <div className="w-12 h-12 rounded-xl bg-accent/10 border border-accent/20 flex items-center justify-center text-accent">
                                    <Package className="w-6 h-6" />
                                </div>
                            </div>

                            <div className="bg-surface border border-surface-border p-5 rounded-2xl shadow-sm flex items-center justify-between">
                                <div>
                                    <p className="text-[11px] font-bold text-foreground/40 uppercase tracking-wider">Sites Prontos</p>
                                    <h3 className="text-2xl font-black text-foreground mt-1">{readyMadeCount}</h3>
                                </div>
                                <div className="w-12 h-12 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-500">
                                    <Monitor className="w-6 h-6" />
                                </div>
                            </div>

                            <div className="bg-surface border border-surface-border p-5 rounded-2xl shadow-sm flex items-center justify-between">
                                <div>
                                    <p className="text-[11px] font-bold text-foreground/40 uppercase tracking-wider">Templates</p>
                                    <h3 className="text-2xl font-black text-foreground mt-1">{templateCount}</h3>
                                </div>
                                <div className="w-12 h-12 rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-500">
                                    <Layout className="w-6 h-6" />
                                </div>
                            </div>

                            <div className="bg-surface border border-surface-border p-5 rounded-2xl shadow-sm flex items-center justify-between">
                                <div>
                                    <p className="text-[11px] font-bold text-foreground/40 uppercase tracking-wider">Na Vitrine (Públicos)</p>
                                    <h3 className="text-2xl font-black text-emerald-500 mt-1">{visibleCount}</h3>
                                </div>
                                <div className="w-12 h-12 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-500">
                                    <Eye className="w-6 h-6" />
                                </div>
                            </div>
                        </div>

                        {/* Barra de Busca e Filtros */}
                        <div className="bg-surface border border-surface-border p-4 rounded-2xl shadow-sm flex flex-col md:flex-row gap-4 justify-between items-stretch md:items-center">
                            
                            {/* Input de Busca */}
                            <div className="relative flex-1 max-w-md">
                                <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-foreground/40" />
                                <input
                                    type="text"
                                    placeholder="Buscar por nome, categoria ou descrição..."
                                    value={search}
                                    onChange={e => setSearch(e.target.value)}
                                    className="w-full bg-background border border-surface-border text-sm p-3 pl-10 rounded-xl outline-none font-medium focus:border-accent transition-colors"
                                />
                                {search && (
                                    <button onClick={() => setSearch("")} className="absolute right-3 top-1/2 -translate-y-1/2 text-foreground/40 hover:text-foreground">
                                        <X className="w-4 h-4" />
                                    </button>
                                )}
                            </div>

                            {/* Filtro por Tipo de Produto */}
                            <div className="flex items-center gap-2 flex-wrap">
                                <span className="text-xs font-bold text-foreground/40 uppercase tracking-wider hidden lg:inline">Tipo:</span>
                                <button
                                    onClick={() => setTypeFilter("all")}
                                    className={`px-3 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                                        typeFilter === "all"
                                            ? "bg-foreground text-background shadow-sm"
                                            : "bg-background border border-surface-border text-foreground/60 hover:text-foreground"
                                    }`}
                                >
                                    Todos ({projects.length})
                                </button>
                                <button
                                    onClick={() => setTypeFilter("ready_made")}
                                    className={`px-3 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                                        typeFilter === "ready_made"
                                            ? "bg-foreground text-background shadow-sm"
                                            : "bg-background border border-surface-border text-foreground/60 hover:text-foreground"
                                    }`}
                                >
                                    Sites Prontos ({readyMadeCount})
                                </button>
                                <button
                                    onClick={() => setTypeFilter("template")}
                                    className={`px-3 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                                        typeFilter === "template"
                                            ? "bg-foreground text-background shadow-sm"
                                            : "bg-background border border-surface-border text-foreground/60 hover:text-foreground"
                                    }`}
                                >
                                    Templates ({templateCount})
                                </button>

                                {/* Filtro por Categoria */}
                                {categories.length > 0 && (
                                    <select
                                        value={categoryFilter}
                                        onChange={e => setCategoryFilter(e.target.value)}
                                        className="bg-background border border-surface-border text-xs font-bold p-2.5 rounded-xl outline-none text-foreground focus:border-accent transition-colors"
                                    >
                                        <option value="all">Todas Categorias</option>
                                        {categories.map(cat => (
                                            <option key={cat} value={cat}>{cat}</option>
                                        ))}
                                    </select>
                                )}
                            </div>
                        </div>

                        {/* Listagem em Grid dos Projetos */}
                        {loading ? (
                            <div className="py-20 flex flex-col items-center justify-center gap-3 opacity-50">
                                <div className="w-8 h-8 border-2 border-accent border-t-transparent rounded-full animate-spin" />
                                <p className="text-xs font-bold uppercase tracking-widest text-foreground/60">Carregando catálogo...</p>
                            </div>
                        ) : filteredProjects.length === 0 ? (
                            <div className="bg-surface border border-surface-border rounded-3xl p-16 flex flex-col items-center justify-center text-center">
                                <div className="w-16 h-16 rounded-2xl bg-accent/10 border border-accent/20 flex items-center justify-center text-accent mb-4">
                                    <Package className="w-8 h-8" />
                                </div>
                                <h3 className="text-xl font-bold text-foreground">Nenhum projeto encontrado</h3>
                                <p className="text-sm text-foreground/50 max-w-md mt-1 mb-6">
                                    {search || typeFilter !== 'all' || categoryFilter !== 'all'
                                        ? "Nenhum resultado corresponde aos filtros selecionados. Tente limpar os termos de busca."
                                        : "Você ainda não possui projetos ou templates cadastrados no catálogo."}
                                </p>
                                <button
                                    onClick={() => {
                                        setSearch("");
                                        setTypeFilter("all");
                                        setCategoryFilter("all");
                                        setActiveTab("add");
                                    }}
                                    className="px-6 py-3 bg-accent text-white font-black text-xs uppercase tracking-wider rounded-xl shadow-lg shadow-accent/20 hover:bg-accent/90 transition-all flex items-center gap-2 cursor-pointer"
                                >
                                    <Plus className="w-4 h-4" /> Cadastrar Primeiro Site
                                </button>
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                {filteredProjects.map((project) => {
                                    const isTemplate = project.product_type === 'template';
                                    const firstPhoto = Array.isArray(project.photos) && project.photos.length > 0
                                        ? project.photos[0]
                                        : project.image_url || project.logo_url || null;

                                    const photoCount = Array.isArray(project.photos) ? project.photos.length : (firstPhoto ? 1 : 0);

                                    return (
                                        <motion.div
                                            key={project.id}
                                            layout
                                            initial={{ opacity: 0, scale: 0.95 }}
                                            animate={{ opacity: 1, scale: 1 }}
                                            className="bg-surface border border-surface-border rounded-3xl overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300 flex flex-col group"
                                        >
                                            {/* Imagem de Capa */}
                                            <div className="aspect-[16/10] bg-background relative overflow-hidden border-b border-surface-border">
                                                {firstPhoto ? (
                                                    <img
                                                        src={firstPhoto}
                                                        alt={project.name}
                                                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                                                    />
                                                ) : (
                                                    <div className="w-full h-full flex flex-col items-center justify-center text-foreground/20 gap-2 bg-gradient-to-br from-surface to-background">
                                                        <Monitor className="w-10 h-10" />
                                                        <span className="text-[10px] font-black uppercase tracking-widest">Sem Foto Cadastrada</span>
                                                    </div>
                                                )}

                                                {/* Badges Flutuantes */}
                                                <div className="absolute top-3 left-3 flex flex-wrap gap-1.5">
                                                    <span className={`text-[9px] font-black uppercase tracking-wider px-2.5 py-1 rounded-lg backdrop-blur-md border shadow-md ${
                                                        isTemplate 
                                                            ? 'bg-purple-600/80 text-white border-purple-400/30' 
                                                            : 'bg-accent/80 text-white border-accent/40'
                                                    }`}>
                                                        {isTemplate ? 'Template' : 'Site Pronto'}
                                                    </span>

                                                    {project.category && (
                                                        <span className="text-[9px] font-black uppercase tracking-wider px-2.5 py-1 rounded-lg bg-black/60 text-white border border-white/10 backdrop-blur-md">
                                                            {project.category}
                                                        </span>
                                                    )}
                                                </div>

                                                {/* Indicador de Fotos e Visibilidade */}
                                                <div className="absolute top-3 right-3 flex items-center gap-1.5">
                                                    {photoCount > 0 && (
                                                        <span className="text-[9px] font-black px-2 py-1 rounded-lg bg-black/60 text-white border border-white/10 backdrop-blur-md flex items-center gap-1">
                                                            <ImageIcon className="w-3 h-3" /> {photoCount}
                                                        </span>
                                                    )}
                                                    <span className={`text-[9px] font-black uppercase tracking-wider px-2 py-1 rounded-lg backdrop-blur-md border ${
                                                        project.show_in_gallery !== false
                                                            ? 'bg-emerald-500/80 text-white border-emerald-400/30'
                                                            : 'bg-zinc-800/80 text-zinc-300 border-zinc-700'
                                                    }`}>
                                                        {project.show_in_gallery !== false ? 'Vitrine' : 'Oculto'}
                                                    </span>
                                                </div>
                                            </div>

                                            {/* Informações do Projeto */}
                                            <div className="p-6 flex-1 flex flex-col justify-between space-y-4">
                                                <div>
                                                    <div className="flex items-start justify-between gap-2 mb-1.5">
                                                        <h3 className="text-lg font-black text-foreground group-hover:text-accent transition-colors truncate">
                                                            {project.name}
                                                        </h3>
                                                    </div>
                                                    <p className="text-xs text-foreground/50 line-clamp-2 leading-relaxed">
                                                        {project.description || "Sem descrição informada para este projeto."}
                                                    </p>
                                                </div>

                                                {/* Preço e Especificações Rápidas */}
                                                <div className="pt-3 border-t border-surface-border flex items-center justify-between">
                                                    <div>
                                                        <span className="text-[10px] font-bold text-foreground/40 uppercase tracking-widest block">Preço</span>
                                                        <div className="flex items-baseline gap-1.5">
                                                            <span className="text-lg font-black text-foreground">
                                                                {project.price ? `R$ ${Number(project.price).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}` : 'Grátis'}
                                                            </span>
                                                            {project.installments && (
                                                                <span className="text-[9px] font-black text-accent bg-accent/10 px-1.5 py-0.5 rounded">
                                                                    12x
                                                                </span>
                                                            )}
                                                        </div>
                                                    </div>

                                                    {/* Link de Demonstração / Preview */}
                                                    {project.deploy_url ? (
                                                        <a
                                                            href={project.deploy_url}
                                                            target="_blank"
                                                            rel="noopener noreferrer"
                                                            className="text-xs font-bold text-accent hover:underline flex items-center gap-1 bg-accent/5 hover:bg-accent/10 border border-accent/20 px-3 py-1.5 rounded-xl transition-colors"
                                                            title="Abrir Demonstração"
                                                        >
                                                            <ExternalLink className="w-3.5 h-3.5" /> Preview
                                                        </a>
                                                    ) : (
                                                        <span className="text-[10px] font-bold text-foreground/30 italic">Sem link de teste</span>
                                                    )}
                                                </div>

                                                {/* Ações do Card */}
                                                <div className="pt-3 border-t border-surface-border flex items-center justify-between gap-2">
                                                    <button
                                                        onClick={() => handleToggleGallery(project)}
                                                        className={`p-2 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer ${
                                                            project.show_in_gallery !== false
                                                                ? 'text-emerald-500 hover:bg-emerald-500/10'
                                                                : 'text-foreground/40 hover:bg-foreground/5'
                                                        }`}
                                                        title={project.show_in_gallery !== false ? "Ocultar da vitrine" : "Mostrar na vitrine"}
                                                    >
                                                        {project.show_in_gallery !== false ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                                                        <span className="text-[11px] font-bold hidden sm:inline">
                                                            {project.show_in_gallery !== false ? 'Público' : 'Oculto'}
                                                        </span>
                                                    </button>

                                                    <div className="flex items-center gap-1.5">
                                                        <button
                                                            onClick={() => handleOpenEdit(project)}
                                                            className="p-2.5 bg-background hover:bg-accent/10 hover:text-accent border border-surface-border hover:border-accent/30 rounded-xl text-foreground/60 transition-all cursor-pointer shadow-sm hover:scale-105"
                                                            title="Editar dados do projeto"
                                                        >
                                                            <Edit3 className="w-4 h-4" />
                                                        </button>
                                                        <button
                                                            onClick={() => setDeletingProject(project)}
                                                            className="p-2.5 bg-background hover:bg-red-500/10 hover:text-red-500 border border-surface-border hover:border-red-500/30 rounded-xl text-foreground/40 transition-all cursor-pointer shadow-sm hover:scale-105"
                                                            title="Excluir projeto do catálogo"
                                                        >
                                                            <Trash2 className="w-4 h-4" />
                                                        </button>
                                                    </div>
                                                </div>

                                            </div>
                                        </motion.div>
                                    );
                                })}
                            </div>
                        )}
                    </motion.div>
                )}

                {/* Conteúdo da Aba Cadastrar Novo */}
                {activeTab === "add" && (
                    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
                        <AddSiteForm 
                            isAdmin={true} 
                            onSuccess={() => {
                                fetchProjects();
                                setActiveTab("catalog");
                            }} 
                        />
                    </motion.div>
                )}

            </div>

            {/* Modal de Edição de Projeto */}
            <AnimatePresence>
                {editingProject && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-[9999] bg-black/70 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto"
                        onClick={() => setEditingProject(null)}
                    >
                        <motion.div
                            initial={{ scale: 0.95, y: 20 }}
                            animate={{ scale: 1, y: 0 }}
                            exit={{ scale: 0.95, y: 20 }}
                            onClick={e => e.stopPropagation()}
                            className="bg-surface border border-surface-border rounded-3xl p-6 md:p-8 max-w-2xl w-full shadow-2xl space-y-6 my-8"
                        >
                            <div className="flex items-center justify-between pb-4 border-b border-surface-border">
                                <div>
                                    <span className="text-[10px] font-black uppercase tracking-widest text-accent">Modo de Edição</span>
                                    <h2 className="text-xl font-black text-foreground">Editar {editingProject.name}</h2>
                                </div>
                                <button
                                    onClick={() => setEditingProject(null)}
                                    className="p-2 hover:bg-foreground/5 rounded-xl text-foreground/40 hover:text-foreground transition-colors"
                                >
                                    <X className="w-5 h-5" />
                                </button>
                            </div>

                            <div className="space-y-4 max-h-[65vh] overflow-y-auto pr-2 custom-scrollbar">
                                <div>
                                    <label className="text-xs font-bold text-foreground/40 uppercase tracking-widest mb-1.5 block">Nome do Site / Template</label>
                                    <input
                                        type="text"
                                        value={editForm.name}
                                        onChange={e => setEditForm({ ...editForm, name: e.target.value })}
                                        className="w-full bg-background border border-surface-border rounded-xl px-4 py-3 text-sm font-medium focus:border-accent outline-none"
                                    />
                                </div>

                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    <div>
                                        <label className="text-xs font-bold text-foreground/40 uppercase tracking-widest mb-1.5 block">Tipo de Produto</label>
                                        <select
                                            value={editForm.product_type}
                                            onChange={e => setEditForm({ ...editForm, product_type: e.target.value })}
                                            className="w-full bg-background border border-surface-border rounded-xl px-4 py-3 text-sm font-medium focus:border-accent outline-none"
                                        >
                                            <option value="ready_made">Site Pronto</option>
                                            <option value="template">Template</option>
                                        </select>
                                    </div>

                                    <div>
                                        <label className="text-xs font-bold text-foreground/40 uppercase tracking-widest mb-1.5 block">Nicho / Categoria</label>
                                        <select
                                            value={editForm.category}
                                            onChange={e => setEditForm({ ...editForm, category: e.target.value })}
                                            className="w-full bg-background border border-surface-border rounded-xl px-4 py-3 text-sm font-medium focus:border-accent outline-none"
                                        >
                                            <optgroup label="Pequenos Comércios">
                                                {COMMERCE_CATEGORIES.map(c => (
                                                    <option key={c.key} value={c.label}>{c.label}</option>
                                                ))}
                                            </optgroup>
                                            <optgroup label="Outros Formatos">
                                                <option value="Landing Page">Landing Page Geral</option>
                                                <option value="E-commerce">E-commerce / Loja Geral</option>
                                                <option value="Dashboard / SaaS">Dashboard / SaaS</option>
                                                <option value="Blog">Blog & Notícias</option>
                                                <option value="Aplicativo Web">Aplicativo Web</option>
                                            </optgroup>
                                        </select>
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    <div>
                                        <label className="text-xs font-bold text-foreground/40 uppercase tracking-widest mb-1.5 block">Preço (R$)</label>
                                        <input
                                            type="number"
                                            value={editForm.price}
                                            onChange={e => setEditForm({ ...editForm, price: e.target.value })}
                                            className="w-full bg-background border border-surface-border rounded-xl px-4 py-3 text-sm font-medium focus:border-accent outline-none"
                                        />
                                    </div>

                                    <div className="flex items-end pb-3">
                                        <label className="flex items-center gap-2 text-sm font-bold text-foreground cursor-pointer">
                                            <input
                                                type="checkbox"
                                                checked={editForm.installments}
                                                onChange={e => setEditForm({ ...editForm, installments: e.target.checked })}
                                                className="w-4 h-4 accent-accent rounded"
                                            />
                                            Aceita Parcelamento 12x
                                        </label>
                                    </div>
                                </div>

                                <div>
                                    <label className="text-xs font-bold text-foreground/40 uppercase tracking-widest mb-1.5 block">Link de Demonstração (Deploy URL)</label>
                                    <input
                                        type="text"
                                        value={editForm.deploy_url}
                                        onChange={e => setEditForm({ ...editForm, deploy_url: e.target.value })}
                                        placeholder="https://exemplo.com"
                                        className="w-full bg-background border border-surface-border rounded-xl px-4 py-3 text-sm font-medium focus:border-accent outline-none"
                                    />
                                </div>

                                <div>
                                    <label className="text-xs font-bold text-foreground/40 uppercase tracking-widest mb-1.5 block">Descrição</label>
                                    <textarea
                                        value={editForm.description}
                                        onChange={e => setEditForm({ ...editForm, description: e.target.value })}
                                        rows={4}
                                        className="w-full bg-background border border-surface-border rounded-xl px-4 py-3 text-sm font-medium focus:border-accent outline-none resize-none"
                                    />
                                </div>

                                <div className="pt-2 border-t border-surface-border flex items-center justify-between">
                                    <label className="flex items-center gap-2 text-sm font-bold text-foreground cursor-pointer">
                                        <input
                                            type="checkbox"
                                            checked={editForm.show_in_gallery}
                                            onChange={e => setEditForm({ ...editForm, show_in_gallery: e.target.checked })}
                                            className="w-4 h-4 accent-accent rounded"
                                        />
                                        Exibir na Vitrine Pública
                                    </label>

                                    <select
                                        value={editForm.status}
                                        onChange={e => setEditForm({ ...editForm, status: e.target.value })}
                                        className="bg-background border border-surface-border text-xs font-bold p-2.5 rounded-xl outline-none"
                                    >
                                        <option value="published">Publicado</option>
                                        <option value="pending_review">Pendente</option>
                                        <option value="draft">Rascunho</option>
                                    </select>
                                </div>
                            </div>

                            <div className="flex gap-3 pt-4 border-t border-surface-border">
                                <button
                                    onClick={() => setEditingProject(null)}
                                    className="flex-1 py-3.5 rounded-xl border border-surface-border font-bold text-sm hover:bg-foreground/5 transition-colors cursor-pointer"
                                >
                                    Cancelar
                                </button>
                                <button
                                    onClick={handleSaveEdit}
                                    disabled={savingEdit}
                                    className="flex-1 bg-accent hover:bg-accent/90 text-white font-bold text-sm py-3.5 rounded-xl shadow-lg shadow-accent/20 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                                >
                                    {savingEdit ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <Save className="w-4 h-4" />}
                                    Salvar Alterações
                                </button>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Modal de Confirmação de Exclusão */}
            <AnimatePresence>
                {deletingProject && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-[9999] bg-black/70 backdrop-blur-md flex items-center justify-center p-4"
                        onClick={() => setDeletingProject(null)}
                    >
                        <motion.div
                            initial={{ scale: 0.95, y: 20 }}
                            animate={{ scale: 1, y: 0 }}
                            exit={{ scale: 0.95, y: 20 }}
                            onClick={e => e.stopPropagation()}
                            className="bg-surface border border-surface-border rounded-3xl p-6 md:p-8 max-w-md w-full shadow-2xl space-y-6 text-center"
                        >
                            <div className="w-16 h-16 rounded-2xl bg-red-500/10 border border-red-500/20 text-red-500 flex items-center justify-center mx-auto">
                                <AlertTriangle className="w-8 h-8" />
                            </div>

                            <div>
                                <h3 className="text-xl font-black text-foreground">Excluir Projeto?</h3>
                                <p className="text-sm text-foreground/50 mt-1">
                                    Tem certeza que deseja remover <strong>"{deletingProject.name}"</strong> do catálogo? Essa ação não pode ser desfeita.
                                </p>
                            </div>

                            <div className="flex gap-3">
                                <button
                                    onClick={() => setDeletingProject(null)}
                                    className="flex-1 py-3.5 rounded-xl border border-surface-border font-bold text-sm hover:bg-foreground/5 transition-colors cursor-pointer"
                                >
                                    Cancelar
                                </button>
                                <button
                                    onClick={handleDeleteProject}
                                    disabled={deletingLoading}
                                    className="flex-1 bg-red-600 hover:bg-red-700 text-white font-bold text-sm py-3.5 rounded-xl shadow-lg shadow-red-600/20 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                                >
                                    {deletingLoading ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <Trash2 className="w-4 h-4" />}
                                    Sim, Excluir
                                </button>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Toast Notifications */}
            <AnimatePresence>
                {toastMessage && (
                    <motion.div
                        initial={{ opacity: 0, y: 50, scale: 0.9 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.9, y: 20 }}
                        className="fixed bottom-6 right-6 z-[99999] bg-surface border border-surface-border shadow-2xl px-6 py-4 rounded-2xl flex items-center gap-3 max-w-sm"
                    >
                        <div className="w-8 h-8 bg-accent/20 text-accent rounded-full flex items-center justify-center shrink-0">
                            <CheckCircle2 className="w-4 h-4" />
                        </div>
                        <p className="text-sm font-bold text-foreground">{toastMessage}</p>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
