"use client";
import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { Calendar, Plus, Trash2, CheckCircle2, Clock, Circle, ChevronUp, ChevronDown, Rocket, AlertCircle, ImageIcon, Bell, Save, Users } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useSearchParams } from "next/navigation";

export default function AdminTimeline() {
    const searchParams = useSearchParams();
    const [projects, setProjects] = useState<any[]>([]);
    const [selectedProjectId, setSelectedProjectId] = useState<string>("");
    const [steps, setSteps] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState<string | null>(null);

    const loadProjects = async () => {
        const { data } = await supabase.from('projects').select('*, profiles(name, email)').order('created_at', { ascending: false });
        if (data && data.length > 0) {
            setProjects(data);
            // Verifica se tem um projeto pré-selecionado via query param
            const paramProject = searchParams.get('project');
            if (paramProject && data.find(p => p.id === paramProject)) {
                setSelectedProjectId(paramProject);
            } else if (!selectedProjectId) {
                setSelectedProjectId(data[0].id);
            }
        }
        setLoading(false);
    };

    useEffect(() => {
        loadProjects();
    }, []);

    useEffect(() => {
        if (selectedProjectId) {
            loadSteps(selectedProjectId);
        }
    }, [selectedProjectId]);

    const loadSteps = async (pid: string) => {
        const { data } = await supabase
            .from('timeline_steps')
            .select('*')
            .eq('project_id', pid)
            .order('order_index', { ascending: true });
        setSteps(data || []);
    };

    const handleAddStep = async () => {
        const newStep = {
            project_id: selectedProjectId,
            title: "Nova Etapa",
            description: "Descrição da etapa...",
            date: "A definir",
            status: "upcoming",
            photo_url: "",
            order_index: steps.length + 1
        };
        const { data, error } = await supabase.from('timeline_steps').insert([newStep]).select();
        if (data) setSteps([...steps, data[0]]);
    };

    const handleUpdateStep = async (id: string, updates: any) => {
        setSaving(id);
        await supabase.from('timeline_steps').update(updates).eq('id', id);
        setSteps(steps.map(s => s.id === id ? { ...s, ...updates } : s));
        setTimeout(() => setSaving(null), 800);
    };

    const handleDeleteStep = async (id: string) => {
        if (!confirm("Deletar esta etapa?")) return;
        await supabase.from('timeline_steps').delete().eq('id', id);
        setSteps(steps.filter(s => s.id !== id));
    };

    const handleMoveStep = async (index: number, direction: 'up' | 'down') => {
        const newSteps = [...steps];
        const targetIndex = direction === 'up' ? index - 1 : index + 1;
        if (targetIndex < 0 || targetIndex >= newSteps.length) return;

        // Troca os steps
        [newSteps[index], newSteps[targetIndex]] = [newSteps[targetIndex], newSteps[index]];
        
        // Atualiza order_index
        newSteps.forEach((s, i) => { s.order_index = i + 1; });
        setSteps(newSteps);

        // Salva no banco
        await Promise.all(newSteps.map(s =>
            supabase.from('timeline_steps').update({ order_index: s.order_index }).eq('id', s.id)
        ));
    };

    if (loading) return (
        <div className="flex-1 flex items-center justify-center bg-background">
            <div className="w-8 h-8 border-2 border-surface-border border-t-accent rounded-full animate-spin" />
        </div>
    );

    const currentProject = projects.find(p => p.id === selectedProjectId);
    const pendingRequests = projects.filter(p => p.timeline_requested);
    const completedSteps = steps.filter(s => s.status === 'completed').length;
    const progressPct = steps.length > 0 ? Math.round((completedSteps / steps.length) * 100) : 0;

    return (
        <div className="flex-1 overflow-y-auto p-6 md:p-10 bg-background custom-scrollbar">
            <div className="max-w-5xl mx-auto">
                
                {/* Header */}
                <div className="flex flex-col md:flex-row md:items-start justify-between gap-6 mb-8">
                    <div>
                        <div className="flex items-center gap-3 mb-1">
                            <Calendar className="w-5 h-5 text-accent" />
                            <span className="text-[10px] font-black uppercase tracking-[0.3em] text-accent">Gestão de Prazos</span>
                        </div>
                        <h1 className="text-3xl md:text-4xl font-black text-foreground tracking-tighter">
                            Cronograma Master
                        </h1>
                        {pendingRequests.length > 0 && (
                            <div className="mt-2 flex items-center gap-2">
                                <Bell className="w-4 h-4 text-amber-500" />
                                <span className="text-sm font-bold text-amber-500">{pendingRequests.length} cliente(s) aguardando cronograma</span>
                            </div>
                        )}
                    </div>

                    <div className="flex flex-col gap-1.5 shrink-0 min-w-[240px]">
                        <label className="text-[10px] font-black uppercase tracking-wider text-foreground/40">Projeto Selecionado</label>
                        <select 
                            id="timeline-project-select"
                            value={selectedProjectId}
                            onChange={(e) => setSelectedProjectId(e.target.value)}
                            className="bg-surface border border-surface-border p-3 px-4 rounded-2xl text-foreground font-bold text-sm shadow-sm outline-none focus:border-accent transition-colors cursor-pointer"
                        >
                            {projects.map(p => (
                                <option key={p.id} value={p.id}>
                                    {p.name} {p.timeline_requested ? "⚠️" : ""}
                                </option>
                            ))}
                        </select>
                    </div>
                </div>

                {/* Info do projeto atual */}
                {currentProject && (
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
                        <div className="bg-surface border border-surface-border rounded-2xl p-4">
                            <p className="text-[10px] font-black uppercase tracking-widest text-foreground/30 mb-1">Cliente</p>
                            <p className="text-sm font-bold text-foreground truncate">{currentProject.profiles?.name || "—"}</p>
                        </div>
                        <div className="bg-surface border border-surface-border rounded-2xl p-4">
                            <p className="text-[10px] font-black uppercase tracking-widest text-foreground/30 mb-1">Etapas</p>
                            <p className="text-sm font-bold text-foreground">{steps.length} total</p>
                        </div>
                        <div className="bg-surface border border-surface-border rounded-2xl p-4">
                            <p className="text-[10px] font-black uppercase tracking-widest text-foreground/30 mb-1">Concluídas</p>
                            <p className="text-sm font-bold text-emerald-500">{completedSteps} etapa(s)</p>
                        </div>
                        <div className="bg-surface border border-surface-border rounded-2xl p-4 relative overflow-hidden">
                            <p className="text-[10px] font-black uppercase tracking-widest text-foreground/30 mb-1">Progresso</p>
                            <p className="text-sm font-bold text-accent">{progressPct}%</p>
                            <div className="absolute bottom-0 left-0 h-1 bg-accent/20 w-full">
                                <div className="h-full bg-accent transition-all" style={{ width: `${progressPct}%` }} />
                            </div>
                        </div>
                    </div>
                )}

                {/* Banner de aviso */}
                {currentProject?.timeline_requested && steps.length === 0 && (
                    <motion.div 
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="bg-amber-500/10 border border-amber-500/25 rounded-2xl p-5 mb-8 flex items-start gap-3 text-amber-500"
                    >
                        <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
                        <div>
                            <h4 className="font-black text-sm uppercase tracking-wider">Cronograma Solicitado pelo Cliente</h4>
                            <p className="text-xs font-bold opacity-80 mt-1">
                                O cliente solicitou a elaboração do cronograma para este projeto. Adicione as etapas abaixo.
                            </p>
                        </div>
                    </motion.div>
                )}

                {/* Lista de etapas */}
                <div className="flex flex-col gap-4">
                    <AnimatePresence>
                        {steps.map((step, index) => (
                            <motion.div 
                                key={step.id}
                                initial={{ opacity: 0, x: -20 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: 20 }}
                                className="bg-surface border border-surface-border rounded-[2rem] overflow-hidden shadow-sm group"
                            >
                                {/* Barra de status colorida no topo */}
                                <div className={`h-1 w-full ${
                                    step.status === 'completed' ? 'bg-emerald-500' :
                                    step.status === 'current' ? 'bg-accent' :
                                    'bg-surface-border'
                                }`} />

                                <div className="p-6 flex items-start gap-5">
                                    {/* Ícone de status */}
                                    <div className={`mt-1 w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${
                                        step.status === 'completed' ? 'bg-emerald-500 text-white' :
                                        step.status === 'current' ? 'bg-accent text-white' :
                                        'bg-background border border-surface-border text-foreground/30'
                                    }`}>
                                        {step.status === 'completed' ? <CheckCircle2 className="w-5 h-5" /> :
                                         step.status === 'current' ? <Clock className="w-5 h-5" /> :
                                         <Circle className="w-5 h-5" />}
                                    </div>

                                    {/* Campos editáveis */}
                                    <div className="flex-1 grid grid-cols-1 md:grid-cols-3 gap-4">
                                        <div className="flex flex-col gap-1">
                                            <label className="text-[10px] font-black uppercase tracking-widest text-foreground/30">Título da Etapa</label>
                                            <input 
                                                value={step.title}
                                                onChange={(e) => setSteps(steps.map(s => s.id === step.id ? { ...s, title: e.target.value } : s))}
                                                onBlur={(e) => handleUpdateStep(step.id, { title: e.target.value })}
                                                className="bg-transparent text-foreground font-bold text-base outline-none focus:text-accent transition-colors border-b border-transparent focus:border-surface-border pb-1"
                                            />
                                        </div>
                                        <div className="flex flex-col gap-1">
                                            <label className="text-[10px] font-black uppercase tracking-widest text-foreground/30">Data Prevista</label>
                                            <input 
                                                value={step.date}
                                                onChange={(e) => setSteps(steps.map(s => s.id === step.id ? { ...s, date: e.target.value } : s))}
                                                onBlur={(e) => handleUpdateStep(step.id, { date: e.target.value })}
                                                className="bg-transparent text-foreground font-medium text-sm outline-none focus:text-accent transition-colors border-b border-transparent focus:border-surface-border pb-1"
                                            />
                                        </div>
                                        <div className="flex flex-col gap-1">
                                            <label className="text-[10px] font-black uppercase tracking-widest text-foreground/30">Status</label>
                                            <select 
                                                id={`step-status-${step.id}`}
                                                value={step.status}
                                                onChange={(e) => handleUpdateStep(step.id, { status: e.target.value })}
                                                className="bg-background border border-surface-border px-3 py-1.5 rounded-xl text-sm text-foreground appearance-none outline-none cursor-pointer focus:border-accent transition-colors"
                                            >
                                                <option value="upcoming">⏳ Aguardando</option>
                                                <option value="current">🔵 Em andamento</option>
                                                <option value="completed">✅ Concluída</option>
                                            </select>
                                        </div>
                                        <div className="md:col-span-3 flex flex-col gap-1">
                                            <label className="text-[10px] font-black uppercase tracking-widest text-foreground/30">Descrição Completa</label>
                                            <textarea 
                                                value={step.description}
                                                onChange={(e) => setSteps(steps.map(s => s.id === step.id ? { ...s, description: e.target.value } : s))}
                                                onBlur={(e) => handleUpdateStep(step.id, { description: e.target.value })}
                                                className="w-full bg-transparent text-foreground/60 font-medium text-sm outline-none resize-none focus:text-foreground transition-colors mt-1 border-b border-transparent focus:border-surface-border pb-1"
                                                rows={2}
                                            />
                                        </div>
                                        
                                        {/* Campo para Foto/URL de Progresso */}
                                        <div className="md:col-span-3 flex flex-col gap-2 border-t border-surface-border/50 pt-4">
                                            <label className="text-[10px] font-black uppercase tracking-widest text-foreground/35 flex items-center gap-1.5">
                                                <ImageIcon className="w-3.5 h-3.5" /> URL da Imagem de Progresso (Opcional)
                                            </label>
                                            <div className="flex items-center gap-3">
                                                <input 
                                                    value={step.photo_url || ""}
                                                    onChange={(e) => setSteps(steps.map(s => s.id === step.id ? { ...s, photo_url: e.target.value } : s))}
                                                    onBlur={(e) => handleUpdateStep(step.id, { photo_url: e.target.value })}
                                                    placeholder="https://exemplo.com/imagem.png"
                                                    className="flex-1 bg-background border border-surface-border p-3 rounded-xl text-xs text-foreground font-medium outline-none focus:border-accent transition-colors"
                                                />
                                                {step.photo_url && (
                                                    <div className="w-20 aspect-video rounded-lg overflow-hidden border border-surface-border bg-background shrink-0">
                                                        <img src={step.photo_url} alt="Preview" className="w-full h-full object-cover" />
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </div>

                                    {/* Controles de ação */}
                                    <div className="flex flex-col gap-2 shrink-0 md:opacity-0 group-hover:opacity-100 transition-opacity">
                                        <button 
                                            id={`move-up-${step.id}`}
                                            onClick={() => handleMoveStep(index, 'up')}
                                            disabled={index === 0}
                                            className="p-2 bg-surface-border/30 hover:bg-surface-border text-foreground/50 hover:text-foreground rounded-xl transition-all disabled:opacity-20 disabled:cursor-not-allowed cursor-pointer"
                                        >
                                            <ChevronUp className="w-4 h-4" />
                                        </button>
                                        <button 
                                            id={`move-down-${step.id}`}
                                            onClick={() => handleMoveStep(index, 'down')}
                                            disabled={index === steps.length - 1}
                                            className="p-2 bg-surface-border/30 hover:bg-surface-border text-foreground/50 hover:text-foreground rounded-xl transition-all disabled:opacity-20 disabled:cursor-not-allowed cursor-pointer"
                                        >
                                            <ChevronDown className="w-4 h-4" />
                                        </button>
                                        <div className="w-px h-3 bg-surface-border/50 mx-auto" />
                                        <button 
                                            id={`delete-step-${step.id}`}
                                            onClick={() => handleDeleteStep(step.id)}
                                            className="p-2 bg-red-500/10 text-red-500 hover:bg-red-500 hover:text-white rounded-xl transition-all cursor-pointer"
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                    </div>
                                </div>

                                {/* Indicador de salvamento */}
                                {saving === step.id && (
                                    <div className="px-6 pb-3 flex items-center gap-2 text-[10px] font-black text-emerald-500 uppercase tracking-wider">
                                        <Save className="w-3 h-3 animate-pulse" /> Salvando...
                                    </div>
                                )}
                            </motion.div>
                        ))}
                    </AnimatePresence>

                    <button 
                        id="add-timeline-step-btn"
                        onClick={handleAddStep}
                        className="mt-2 p-6 border-2 border-dashed border-surface-border rounded-[2rem] text-foreground/40 hover:text-accent hover:border-accent/40 transition-all flex items-center justify-center gap-3 font-black uppercase tracking-widest cursor-pointer bg-surface/20 hover:bg-accent/3"
                    >
                        <Plus className="w-5 h-5" /> Adicionar Nova Etapa
                    </button>
                </div>

                {steps.length === 0 && !currentProject?.timeline_requested && (
                    <div className="flex flex-col items-center justify-center py-20 text-center opacity-30">
                        <Calendar className="w-16 h-16 mb-4" />
                        <p className="font-black uppercase tracking-[0.3em] text-sm">Nenhuma etapa cadastrada</p>
                    </div>
                )}
            </div>
        </div>
    );
}
