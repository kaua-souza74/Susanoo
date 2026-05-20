"use client";
import { useState, useEffect, useRef } from "react";
import { supabase } from "@/lib/supabase";
import { deployToVercel } from "@/lib/vercel";
import { 
    Rocket, 
    ExternalLink, 
    X,
    UploadCloud,
    FolderOpen,
    Plus,
    Trash2,
    Settings2,
    Monitor,
    Zap,
    Loader2,
    BarChart3,
    Image as ImageIcon,
    Eye,
    EyeOff,
    Link as LinkIcon
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export default function AdminDeploy() {
    const [projects, setProjects] = useState<any[]>([]);
    const [deployingId, setDeployingId] = useState<string | null>(null);
    const [vercelDeployingId, setVercelDeployingId] = useState<string | null>(null);
    const [configProjectId, setConfigProjectId] = useState<string | null>(null);
    const [projectFiles, setProjectFiles] = useState<any[]>([]);
    
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [newProject, setNewProject] = useState({ name: '', email: '', domain: '' });

    const fileInputRef = useRef<HTMLInputElement>(null);

    const loadProjects = async () => {
        const { data } = await supabase.from('projects').select('*').order('name');
        setProjects(data || []);
    };

    useEffect(() => {
        loadProjects();
    }, []);

    const updateProjectField = async (id: string, field: string, value: any) => {
        const { error } = await supabase.from('projects').update({ [field]: value }).eq('id', id);
        if (!error) loadProjects();
    };

    const loadProjectFiles = async (projectId: string) => {
        const { data } = await supabase.storage.from('project_files').list(projectId);
        setProjectFiles(data || []);
    };

    useEffect(() => {
        if (configProjectId) loadProjectFiles(configProjectId);
    }, [configProjectId]);

    const handleCreateProject = async (e: React.FormEvent) => {
        e.preventDefault();
        const { data: profile } = await supabase.from('profiles').select('id').ilike('email', newProject.email.trim()).single();
        if (!profile) {
            alert(`Erro: E-mail "${newProject.email}" não encontrado.`);
            return;
        }
        const { error } = await supabase.from('projects').insert([{
            name: newProject.name,
            client_id: profile.id,
            deploy_url: newProject.domain || 'susanoo-waiting.host',
            deploy_status: 'idle',
            manual_progress: 0,
            show_in_gallery: false
        }]);
        if (!error) {
            setIsModalOpen(false);
            setNewProject({ name: '', email: '', domain: '' });
            loadProjects();
        }
    };

    const handleDeleteProject = async (id: string) => {
        if (!confirm("Deletar PROJETO permanentemente?")) return;
        await supabase.from('projects').delete().eq('id', id);
        loadProjects();
        setConfigProjectId(null);
    };

    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file || !configProjectId) return;
        const { error } = await supabase.storage.from('project_files').upload(`${configProjectId}/${file.name}`, file, {
            upsert: true,
            contentType: file.name.endsWith('.html') ? 'text/html' : (file.name.endsWith('.css') ? 'text/css' : undefined)
        });
        if (!error) loadProjectFiles(configProjectId);
    };

    return (
        <div className="flex-1 overflow-y-auto p-8 bg-[#050505] text-white h-full flex flex-col font-sans custom-scrollbar">
            
            <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 mb-16 px-4">
                <div>
                   <h1 className="text-7xl font-black tracking-tighter uppercase italic text-white leading-none">
                       Deploy <span className="text-accent underline decoration-white/5 underline-offset-[15px]">HQ</span>
                   </h1>
                   <p className="text-[#333] font-black text-xs mt-6 uppercase tracking-[0.6em]">Management & Versioning Engine</p>
                </div>
                <button onClick={() => setIsModalOpen(true)} className="bg-white text-black font-black px-12 py-5 rounded-[24px] hover:scale-105 transition-all text-xs tracking-widest shadow-3xl">
                   NOVA OPERAÇÃO
                </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8">
                {projects.map((proj) => (
                    <motion.div layout key={proj.id} className="bg-[#0c0c0d] border border-white/5 rounded-[40px] p-8 flex flex-col relative group overflow-hidden shadow-2xl">
                        
                        <div className="flex items-start justify-between mb-8">
                            <div className="flex-1">
                                <h2 className="text-3xl font-black text-white italic tracking-tighter uppercase mb-2 truncate max-w-[200px]">{proj.name}</h2>
                                <div className="flex items-center gap-2">
                                     <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                                     <span className="text-[9px] font-black text-[#333] uppercase tracking-widest">Ativo</span>
                                </div>
                            </div>
                            <button onClick={() => setConfigProjectId(proj.id)} className="p-4 bg-white/5 hover:bg-white/10 rounded-2xl transition-all">
                                <Settings2 className="w-5 h-5 text-white" />
                            </button>
                        </div>

                        {/* Link de Produção (Demandado pelo User) */}
                        <div className="bg-[#050505] p-5 rounded-2xl border border-white/5 mb-6 flex items-center justify-between group/link">
                            <div className="flex flex-col">
                                <span className="text-[8px] font-black text-[#222] uppercase tracking-widest mb-1">Mirror URL</span>
                                <span className="text-[11px] font-bold text-[#666] truncate max-w-[150px]">{proj.deploy_url || 'Sem host'}</span>
                            </div>
                            {proj.deploy_url && (
                                <button onClick={() => window.open(proj.deploy_url.startsWith('http') ? proj.deploy_url : `https://${proj.deploy_url}`, '_blank')} className="p-2 bg-accent/10 rounded-lg text-accent hover:scale-110 transition-transform">
                                    <ExternalLink className="w-4 h-4"/>
                                </button>
                            )}
                        </div>

                        {/* Barra de Progresso Simples */}
                        <div className="mb-10">
                            <div className="flex justify-between items-end mb-3">
                                <span className="text-[9px] font-black text-[#222] uppercase tracking-widest">Progress</span>
                                <span className="text-xl font-black text-white italic">{proj.manual_progress ?? 0}%</span>
                            </div>
                            <input 
                                type="range" min="0" max="100" 
                                value={proj.manual_progress ?? 0} 
                                onChange={(e) => updateProjectField(proj.id, 'manual_progress', parseInt(e.target.value))}
                                className="w-full h-1 bg-white/5 rounded-lg appearance-none cursor-pointer accent-accent"
                            />
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                            <button className="py-4 rounded-2xl font-black text-[9px] uppercase tracking-widest bg-white text-black hover:bg-neutral-200 transition-all">Preview</button>
                            <button className="py-4 rounded-2xl font-black text-[9px] uppercase tracking-widest bg-accent text-white hover:scale-105 transition-all">Deploy</button>
                        </div>

                    </motion.div>
                ))}
            </div>

            {/* MODAL DE CONFIGURAÇÃO (VER MAIS / CARD NOVO) */}
            <AnimatePresence>
                {configProjectId && (
                    <div className="fixed inset-0 bg-black/90 backdrop-blur-md z-[500] flex items-center justify-center p-6 md:p-10">
                        <motion.div 
                            initial={{ opacity: 0, scale: 0.9, y: 30 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.9, y: 30 }}
                            className="bg-[#0c0c0d] border border-white/5 rounded-[60px] w-full max-w-5xl max-h-[90vh] overflow-y-auto custom-scrollbar p-10 md:p-16 relative"
                        >
                            <button onClick={() => setConfigProjectId(null)} className="absolute top-12 right-12 text-[#333] hover:text-white p-2">
                                <X className="w-10 h-10"/>
                            </button>

                            {projects.find(p => p.id === configProjectId) && (
                                <div className="grid grid-cols-1 lg:grid-cols-12 gap-16">
                                    {/* Esquerda: Detalhes e Status */}
                                    <div className="lg:col-span-12">
                                        <h2 className="text-6xl font-black text-white italic uppercase tracking-tighter mb-4">{projects.find(p => p.id === configProjectId).name}</h2>
                                        <div className="flex items-center gap-4 mb-16">
                                            <span className="text-[10px] font-black text-accent border border-accent/20 bg-accent/5 px-4 py-1.5 rounded-full uppercase tracking-widest">Configuration Mode</span>
                                            <button onClick={() => handleDeleteProject(configProjectId)} className="flex items-center gap-2 text-red-500/50 hover:text-red-500 text-[10px] font-black uppercase tracking-widest bg-red-500/5 p-2 px-4 rounded-full transition-all">
                                                <Trash2 className="w-4 h-4" /> Deletar Projeto
                                            </button>
                                        </div>
                                    </div>

                                    {/* Meio: Galeria (Capa) */}
                                    <div className="lg:col-span-5 space-y-10">
                                        <div className="bg-[#050505] p-10 rounded-[40px] border border-white/5 h-full">
                                            <div className="flex items-center justify-between mb-8">
                                                <h4 className="text-[10px] font-black text-[#222] uppercase tracking-[0.4em] flex items-center gap-3"><ImageIcon className="w-5 h-5"/> Vitrine Galeria</h4>
                                                <button 
                                                    onClick={() => updateProjectField(configProjectId, 'show_in_gallery', !projects.find(p => p.id === configProjectId).show_in_gallery)}
                                                    className={`px-4 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest transition-all ${
                                                        projects.find(p => p.id === configProjectId).show_in_gallery ? 'bg-white text-black' : 'bg-white/5 text-[#333]'
                                                    }`}
                                                >
                                                    {projects.find(p => p.id === configProjectId).show_in_gallery ? 'Visível' : 'Oculto'}
                                                </button>
                                            </div>
                                            
                                            {projects.find(p => p.id === configProjectId).cover_url ? (
                                                <div className="relative aspect-video rounded-3xl overflow-hidden mb-6 group">
                                                    <img src={projects.find(p => p.id === configProjectId).cover_url} className="w-full h-full object-cover grayscale group-hover:grayscale-0 transition-all duration-1000" />
                                                    <button onClick={() => updateProjectField(configProjectId, 'cover_url', null)} className="absolute top-4 right-4 bg-red-500 p-2 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"><X className="w-5 h-5 text-white"/></button>
                                                </div>
                                            ) : (
                                                <div className="aspect-video border-2 border-dashed border-white/5 rounded-3xl mb-6 flex items-center justify-center text-[11px] font-black text-[#111]">SEM CAPA DEFINIDA</div>
                                            )}
                                            <input 
                                                type="text" 
                                                placeholder="Insira a URL da imagem de capa..."
                                                defaultValue={projects.find(p => p.id === configProjectId).cover_url || ''}
                                                className="w-full bg-white/5 p-5 rounded-2xl text-sm text-foreground outline-none border border-transparent focus:border-accent transition-all"
                                                onKeyDown={(e) => e.key === 'Enter' && updateProjectField(configProjectId, 'cover_url', (e.target as HTMLInputElement).value)}
                                            />
                                        </div>
                                    </div>

                                    {/* Direita: Repository (Files) */}
                                    <div className="lg:col-span-7 space-y-10">
                                        <div className="bg-[#050505] p-10 rounded-[40px] border border-white/5 h-full flex flex-col">
                                            <div className="flex items-center justify-between mb-8">
                                                <h4 className="text-[10px] font-black text-[#222] uppercase tracking-[0.4em] flex items-center gap-3"><FolderOpen className="w-5 h-5"/> Arquivos do Sistema</h4>
                                                <span className="text-xl font-black text-white italic">{projectFiles.length}</span>
                                            </div>
                                            
                                            <div className="flex-1 space-y-3 mb-8 overflow-y-auto custom-scrollbar pr-4" style={{ maxHeight: '200px' }}>
                                                {projectFiles.map((f, i) => (
                                                    <div key={i} className="flex items-center justify-between p-4 bg-[#0c0c0d] rounded-2xl border border-white/5 text-sm font-bold text-[#444]">
                                                        <span>{f.name}</span>
                                                        <Trash2 className="w-4 h-4 text-red-500/20 hover:text-red-500 cursor-pointer transition-colors" onClick={() => supabase.storage.from('project_files').remove([`${configProjectId}/${f.name}`]).then(() => loadProjectFiles(configProjectId))}/>
                                                    </div>
                                                ))}
                                                {projectFiles.length === 0 && <p className="text-center py-10 text-[10px] font-black text-[#111] uppercase tracking-widest">Nenhum arquivo no repositório</p>}
                                            </div>

                                            <button onClick={() => fileInputRef.current?.click()} className="w-full py-6 border-2 border-dashed border-white/10 rounded-3xl text-sm font-black uppercase text-[#444] hover:text-white hover:border-white/20 transition-all flex items-center justify-center gap-3">
                                                <UploadCloud className="w-5 h-5"/> Enviar Arquivos
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            <input type="file" hidden ref={fileInputRef} onChange={handleFileUpload} />

            {/* Modal de Criação (Ficou como estava, mas com visual mais compacto) */}
            {isModalOpen && (
                <div className="fixed inset-0 bg-black/98 z-[600] flex items-center justify-center p-10">
                    <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="bg-[#0c0c0d] border border-white/5 p-16 rounded-[80px] w-full max-w-2xl relative shadow-3xl">
                        <button onClick={() => setIsModalOpen(false)} className="absolute top-12 right-12 text-[#333] hover:text-white"><X className="w-10 h-10"/></button>
                        <h2 className="text-6xl font-black text-white italic tracking-tighter mb-12 uppercase leading-none">Nova Operação</h2>
                        <form onSubmit={handleCreateProject} className="space-y-10">
                            <input required placeholder="NOME DO PROJETO" className="w-full bg-[#050505] p-8 rounded-[40px] text-white border-2 border-white/5 focus:border-accent outline-none font-black text-2xl uppercase italic" value={newProject.name} onChange={e => setNewProject({...newProject, name: e.target.value})} />
                            <input required type="email" placeholder="E-MAIL DO CLIENTE" className="w-full bg-[#050505] p-8 rounded-[40px] text-white border-2 border-white/5 focus:border-accent outline-none font-bold text-2xl" value={newProject.email} onChange={e => setNewProject({...newProject, email: e.target.value})} />
                            <button type="submit" className="w-full bg-white text-black font-black py-10 rounded-[50px] text-2xl mt-4 hover:bg-accent hover:text-white transition-all uppercase italic">Inicializar HQ</button>
                        </form>
                    </motion.div>
                </div>
            )}
        </div>
    );
}
