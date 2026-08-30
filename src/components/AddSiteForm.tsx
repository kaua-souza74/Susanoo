"use client";
import { useState, useRef } from "react";
import { supabase } from "@/lib/supabase";
import { Upload, X, Save, Plus, ShieldCheck, CheckSquare, Square, DollarSign, List, Monitor } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export function AddSiteForm({ isAdmin = false, onSuccess }: { isAdmin?: boolean; onSuccess?: () => void }) {
    const [loading, setLoading] = useState(false);
    const [toastMessage, setToastMessage] = useState<string | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const [formData, setFormData] = useState({
        name: "",
        description: "",
        price: "",
        installments: false,
        category: "Landing Page",
        product_type: "ready_made",
        deploy_url: "",
    });

    const [photos, setPhotos] = useState<File[]>([]);
    const [photoUrls, setPhotoUrls] = useState<string[]>([]);
    
    const [specs, setSpecs] = useState<{ key: string, value: string }[]>([{ key: "Design", value: "Premium" }]);

    const showToast = (msg: string) => {
        setToastMessage(msg);
        setTimeout(() => setToastMessage(null), 3000);
    };

    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (!e.target.files) return;
        const newFiles = Array.from(e.target.files);
        
        // Filter out non-images
        const validFiles = newFiles.filter(file => file.type.startsWith("image/"));
        if (validFiles.length !== newFiles.length) {
            showToast("Apenas imagens são permitidas.");
        }

        if (photos.length + validFiles.length > 10) {
            showToast("Você só pode enviar até 10 imagens.");
            return;
        }

        const updatedPhotos = [...photos, ...validFiles];
        setPhotos(updatedPhotos);

        // Create object URLs for preview
        const newUrls = validFiles.map(file => URL.createObjectURL(file));
        setPhotoUrls([...photoUrls, ...newUrls]);
    };

    const removePhoto = (index: number) => {
        const newPhotos = [...photos];
        const newUrls = [...photoUrls];
        
        URL.revokeObjectURL(newUrls[index]);
        newPhotos.splice(index, 1);
        newUrls.splice(index, 1);
        
        setPhotos(newPhotos);
        setPhotoUrls(newUrls);
    };

    const handleAddSpec = () => setSpecs([...specs, { key: "", value: "" }]);
    
    const updateSpec = (index: number, field: 'key'|'value', val: string) => {
        const newSpecs = [...specs];
        newSpecs[index][field] = val;
        setSpecs(newSpecs);
    };

    const removeSpec = (index: number) => {
        setSpecs(specs.filter((_, i) => i !== index));
    };

    const handleSubmit = async () => {
        if (!formData.name) return showToast("Nome do site é obrigatório.");
        
        setLoading(true);
        try {
            const uploadedUrls: string[] = [];

            // Upload 10 images concurrently (or sequentially to be safe)
            for (const file of photos) {
                const fileExt = file.name.split('.').pop();
                const fileName = `site_${Date.now()}_${Math.random()}.${fileExt}`;
                const filePath = `projects/${fileName}`;

                const { error: uploadError } = await supabase.storage.from('project_files').upload(filePath, file);
                if (uploadError) throw uploadError;

                const { data: { publicUrl } } = supabase.storage.from('project_files').getPublicUrl(filePath);
                uploadedUrls.push(publicUrl);
            }

            // Specs to object
            const specsObj = specs.reduce((acc, curr) => {
                if (curr.key) acc[curr.key] = curr.value;
                return acc;
            }, {} as Record<string, string>);

            // Get user session
            const { data: { session } } = await supabase.auth.getSession();
            
            const newProject: any = {
                name: formData.name,
                description: formData.description,
                price: parseFloat(formData.price) || 0,
                installments: formData.installments,
                specifications: specsObj,
                photos: uploadedUrls,
                category: formData.category,
                product_type: formData.product_type,
                deploy_url: formData.deploy_url,
                status: isAdmin ? 'published' : 'pending_review',
                show_in_gallery: true,
            };
            if (session?.user?.id) newProject.client_id = session.user.id;

            const { error } = await supabase.from('projects').insert([newProject]);
            if (error) throw error;

            showToast("Site cadastrado com sucesso!");
            if (onSuccess) onSuccess();
            
            // Clear form
            setFormData({ name: "", description: "", price: "", installments: false, category: "Landing Page", product_type: "ready_made", deploy_url: "" });
            setPhotos([]);
            setPhotoUrls([]);
            setSpecs([{ key: "", value: "" }]);
        } catch (error: any) {
            console.error("Full error:", error);
            showToast(error?.message || error?.details || "Erro ao cadastrar o site.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="w-full max-w-5xl mx-auto flex flex-col pb-20 relative">
            <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="mb-10">
                <h1 className="text-3xl md:text-4xl font-extrabold text-foreground tracking-tight mb-2">
                    {isAdmin ? "Lançar Novo Site (Admin)" : "Adicionar Meu Site"}
                </h1>
                <p className="text-foreground/50 text-sm font-medium">
                    {isAdmin ? "Adicione um site pronto da Susanoo ao portfólio master." : "Submeta seu projeto para avaliação da nossa equipe. Aceitamos apenas imagens originais (até 10 fotos, suporte a 4K)."}
                </p>
            </motion.div>

            <div className="bg-surface border border-surface-border rounded-3xl p-8 shadow-sm space-y-8">
                {/* Imagens */}
                <div>
                    <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
                        <Monitor className="w-5 h-5 text-accent" />
                        Imagens de Vitrine ({photos.length}/10)
                    </h3>
                    <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
                        {photoUrls.map((url, i) => (
                            <div key={i} className="aspect-video relative rounded-xl overflow-hidden border border-surface-border group">
                                <img src={url} alt={`Preview ${i}`} className="w-full h-full object-cover" />
                                <button onClick={() => removePhoto(i)} className="absolute top-2 right-2 bg-black/60 p-1.5 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity">
                                    <X className="w-4 h-4 text-white" />
                                </button>
                            </div>
                        ))}
                        {photos.length < 10 && (
                            <button 
                                onClick={() => fileInputRef.current?.click()}
                                className="aspect-video border-2 border-dashed border-surface-border rounded-xl flex flex-col items-center justify-center text-foreground/40 hover:text-accent hover:border-accent/50 transition-colors"
                            >
                                <Upload className="w-6 h-6 mb-2" />
                                <span className="text-xs font-bold uppercase tracking-widest">Upload</span>
                            </button>
                        )}
                    </div>
                    <input type="file" multiple accept="image/*" ref={fileInputRef} hidden onChange={handleFileSelect} />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    {/* Basic Info */}
                    <div className="space-y-5">
                        <div>
                            <label className="text-xs font-bold text-foreground/40 uppercase tracking-widest mb-2 block">Nome do Site</label>
                            <input value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} className="w-full bg-background border border-surface-border rounded-xl px-4 py-3 text-sm font-medium focus:border-accent outline-none transition-colors" placeholder="Ex: SaaS E-commerce" />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="text-xs font-bold text-foreground/40 uppercase tracking-widest mb-2 block">Categoria</label>
                                <select value={formData.category} onChange={e => setFormData({...formData, category: e.target.value})} className="w-full bg-background border border-surface-border rounded-xl px-4 py-3 text-sm font-medium focus:border-accent outline-none transition-colors">
                                    <option>Landing Page</option>
                                    <option>E-commerce</option>
                                    <option>Dashboard / SaaS</option>
                                    <option>Blog</option>
                                    <option>Aplicativo Web</option>
                                </select>
                            </div>
                            <div>
                                <label className="text-xs font-bold text-foreground/40 uppercase tracking-widest mb-2 block">Tipo de Produto</label>
                                <select value={formData.product_type} onChange={e => setFormData({...formData, product_type: e.target.value})} className="w-full bg-background border border-surface-border rounded-xl px-4 py-3 text-sm font-medium focus:border-accent outline-none transition-colors">
                                    <option value="ready_made">Site Pronto</option>
                                    <option value="template">Template</option>
                                </select>
                            </div>
                        </div>
                        <div>
                            <label className="text-xs font-bold text-foreground/40 uppercase tracking-widest mb-2 block">Descrição Completa</label>
                            <textarea value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} className="w-full bg-background border border-surface-border rounded-xl px-4 py-3 text-sm font-medium focus:border-accent outline-none transition-colors min-h-[120px] resize-none" placeholder="Detalhes do funcionamento..." />
                        </div>
                    </div>

                    {/* Pricing & Specs */}
                    <div className="space-y-5">
                        <div className="flex gap-4">
                            <div className="flex-1">
                                <label className="text-xs font-bold text-foreground/40 uppercase tracking-widest mb-2 flex items-center gap-1"><DollarSign className="w-3.5 h-3.5"/> Preço (R$)</label>
                                <input type="number" value={formData.price} onChange={e => setFormData({...formData, price: e.target.value})} className="w-full bg-background border border-surface-border rounded-xl px-4 py-3 text-sm font-medium focus:border-accent outline-none transition-colors" placeholder="Ex: 1500" />
                            </div>
                            <div className="flex-1 flex flex-col justify-end pb-3">
                                <button onClick={() => setFormData({...formData, installments: !formData.installments})} className="flex items-center gap-2 text-sm font-bold text-foreground cursor-pointer transition-colors hover:text-accent">
                                    {formData.installments ? <CheckSquare className="w-5 h-5 text-accent"/> : <Square className="w-5 h-5 text-surface-border"/>}
                                    Aceita Parcelamento?
                                </button>
                            </div>
                        </div>

                        <div>
                            <label className="text-xs font-bold text-foreground/40 uppercase tracking-widest mb-2 block">Link de Demonstração (Demo/Preview URL)</label>
                            <input value={formData.deploy_url} onChange={e => setFormData({...formData, deploy_url: e.target.value})} className="w-full bg-background border border-surface-border rounded-xl px-4 py-3 text-sm font-medium focus:border-accent outline-none transition-colors" placeholder="https://exemplo.com" />
                        </div>

                        <div>
                            <label className="text-xs font-bold text-foreground/40 uppercase tracking-widest mb-2 flex items-center gap-1"><List className="w-3.5 h-3.5"/> Especificações</label>
                            <div className="space-y-2 mb-3">
                                {specs.map((spec, index) => (
                                    <div key={index} className="flex gap-2">
                                        <input value={spec.key} onChange={e => updateSpec(index, 'key', e.target.value)} placeholder="Atributo (ex: Design)" className="flex-1 bg-background border border-surface-border rounded-lg px-3 py-2 text-sm outline-none focus:border-accent" />
                                        <input value={spec.value} onChange={e => updateSpec(index, 'value', e.target.value)} placeholder="Valor (ex: Moderno)" className="flex-1 bg-background border border-surface-border rounded-lg px-3 py-2 text-sm outline-none focus:border-accent" />
                                        <button onClick={() => removeSpec(index)} className="p-2 text-red-500 hover:bg-red-500/10 rounded-lg transition-colors"><X className="w-4 h-4"/></button>
                                    </div>
                                ))}
                            </div>
                            <button onClick={handleAddSpec} className="text-xs font-bold uppercase tracking-widest text-accent flex items-center gap-1 hover:opacity-80 transition-opacity">
                                <Plus className="w-3 h-3" /> Adicionar Especificação
                            </button>
                        </div>
                    </div>
                </div>

                <div className="pt-6 border-t border-surface-border flex justify-end">
                    <button onClick={handleSubmit} disabled={loading} className="bg-accent text-white px-8 py-3 rounded-xl font-bold flex items-center gap-2 hover:bg-accent/80 transition-all disabled:opacity-50 hover:scale-[1.02] active:scale-[0.98] shadow-xl">
                        {loading ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"/> : <Save className="w-5 h-5"/>}
                        {loading ? "Salvando..." : "Publicar Site"}
                    </button>
                </div>
            </div>

            <AnimatePresence>
                {toastMessage && (
                    <motion.div initial={{ opacity: 0, y: 50, scale: 0.9 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, scale: 0.9, y: 20 }} className="fixed bottom-6 right-6 z-[9999] bg-surface border border-surface-border shadow-2xl px-6 py-4 rounded-2xl flex items-center gap-3 max-w-sm">
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
