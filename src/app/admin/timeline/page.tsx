"use client";
import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { Calendar, Plus, Trash2, CheckCircle2, Clock, Circle, Save, ChevronDown, Rocket } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export default function AdminTimeline() {
    const [projects, setProjects] = useState<any[]>([]);
    const [selectedProjectId, setSelectedProjectId] = useState<string>("");
    const [steps, setSteps] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const loadProjects = async () => {
            const { data } = await supabase.from('projects').select('*');
            if (data && data.length > 0) {
                setProjects(data);
                setSelectedProjectId(data[0].id);
            }
            setLoading(false);
        };
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
            date: "Data",
            status: "upcoming",
            order_index: steps.length + 1
        };
        const { data, error } = await supabase.from('timeline_steps').insert([newStep]).select();
        if (data) setSteps([...steps, data[0]]);
    };

    const handleUpdateStep = async (id: string, updates: any) => {
        await supabase.from('timeline_steps').update(updates).eq('id', id);
        setSteps(steps.map(s => s.id === id ? { ...s, ...updates } : s));
    };

    const handleDeleteStep = async (id: string) => {
        await supabase.from('timeline_steps').delete().eq('id', id);
        setSteps(steps.filter(s => s.id !== id));
    };

    if (loading) return <div>Carregando...</div>;

    return (
        <div className="flex-1 overflow-y-auto p-10 bg-background">
            <div className="max-w-5xl mx-auto">
                <div className="flex items-center justify-between mb-12">
                    <div>
                        <h1 className="text-4xl font-black text-foreground tracking-tighter flex items-center gap-4">
                            Cronograma Master <Rocket className="w-10 h-10 text-accent" />
                        </h1>
                        <p className="text-foreground/40 font-medium">Controle os marcos e o progresso de cada cliente.</p>
                    </div>

                    <select 
                        value={selectedProjectId}
                        onChange={(e) => setSelectedProjectId(e.target.value)}
                        className="bg-surface border border-surface-border p-3 px-6 rounded-2xl text-foreground font-bold shadow-lg outline-none focus:border-accent transition-colors"
                    >
                        {projects.map(p => (
                            <option key={p.id} value={p.id}>{p.name}</option>
                        ))}
                    </select>
                </div>

                <div className="flex flex-col gap-6">
                    <AnimatePresence>
                        {steps.map((step, index) => (
                            <motion.div 
                                key={step.id}
                                initial={{ opacity: 0, x: -20 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: 20 }}
                                className="bg-surface border border-surface-border p-6 rounded-[2rem] shadow-xl flex items-center gap-6 group"
                            >
                                <div className={`w-12 h-12 rounded-full flex items-center justify-center shrink-0 ${
                                    step.status === 'completed' ? 'bg-emerald-500 text-white' :
                                    step.status === 'current' ? 'bg-accent text-white animate-pulse' :
                                    'bg-background border border-surface-border text-foreground/30'
                                }`}>
                                    {step.status === 'completed' ? <CheckCircle2 className="w-6 h-6" /> :
                                     step.status === 'current' ? <Clock className="w-6 h-6" /> :
                                     <Circle className="w-6 h-6" />}
                                </div>

                                <div className="flex-1 grid grid-cols-1 md:grid-cols-3 gap-6">
                                    <div className="flex flex-col gap-1">
                                        <label className="text-[10px] font-black uppercase tracking-widest text-foreground/30">Título da Etapa</label>
                                        <input 
                                            value={step.title}
                                            onChange={(e) => handleUpdateStep(step.id, { title: e.target.value })}
                                            className="bg-transparent text-foreground font-bold text-lg outline-none focus:text-accent transition-colors"
                                        />
                                    </div>
                                    <div className="flex flex-col gap-1">
                                        <label className="text-[10px] font-black uppercase tracking-widest text-foreground/30">Data Prevista</label>
                                        <input 
                                            value={step.date}
                                            onChange={(e) => handleUpdateStep(step.id, { date: e.target.value })}
                                            className="bg-transparent text-foreground font-medium outline-none focus:text-accent transition-colors"
                                        />
                                    </div>
                                    <div className="flex flex-col gap-1">
                                        <label className="text-[10px] font-black uppercase tracking-widest text-foreground/30">Status</label>
                                        <select 
                                            value={step.status}
                                            onChange={(e) => handleUpdateStep(step.id, { status: e.target.value })}
                                            className="bg-background border border-surface-border p-1 px-3 rounded-lg text-sm text-foreground appearance-none outline-none cursor-pointer"
                                        >
                                            <option value="upcoming">Aguardando</option>
                                            <option value="current">Em andamento</option>
                                            <option value="completed">Concluída</option>
                                        </select>
                                    </div>
                                    <div className="md:col-span-3">
                                        <label className="text-[10px] font-black uppercase tracking-widest text-foreground/30">Descrição Completa</label>
                                        <textarea 
                                            value={step.description}
                                            onChange={(e) => handleUpdateStep(step.id, { description: e.target.value })}
                                            className="w-full bg-transparent text-foreground/60 font-medium text-sm outline-none resize-none focus:text-foreground transition-colors mt-1"
                                            rows={2}
                                        />
                                    </div>
                                </div>

                                <div className="flex flex-col gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <button 
                                        onClick={() => handleDeleteStep(step.id)}
                                        className="p-3 bg-red-500/10 text-red-500 hover:bg-red-500 hover:text-white rounded-2xl transition-all"
                                    >
                                        <Trash2 className="w-5 h-5" />
                                    </button>
                                </div>
                            </motion.div>
                        ))}
                    </AnimatePresence>

                    <button 
                        onClick={handleAddStep}
                        className="mt-4 p-6 border-2 border-dashed border-surface-border rounded-[2rem] text-foreground/40 hover:text-accent hover:border-accent/40 transition-all flex items-center justify-center gap-4 font-black uppercase tracking-widest"
                    >
                        <Plus className="w-6 h-6" /> Adicionar Nova Etapa
                    </button>
                </div>
            </div>
        </div>
    );
}
