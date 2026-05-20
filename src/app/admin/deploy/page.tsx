"use client";
import { useState, useEffect, useRef } from "react";
import { supabase } from "@/lib/supabase";
import { deployToVercel } from "@/lib/vercel";
import { 
    Globe, 
    Rocket, 
    ExternalLink, 
    ShieldCheck, 
    Activity, 
    Terminal, 
    RefreshCw, 
    Layers, 
    CheckCircle2, 
    AlertCircle, 
    X,
    FileCode,
    FileText,
    UploadCloud,
    FolderOpen,
    Plus,
    Trash2,
    Settings2,
    Monitor,
    Zap,
    Loader2,
    BarChart3
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export default function AdminDeploy() {
    const [projects, setProjects] = useState<any[]>([]);
    const [deployingId, setDeployingId] = useState<string | null>(null);
    const [vercelDeployingId, setVercelDeployingId] = useState<string | null>(null);
    const [selectedProjectFiles, setSelectedProjectFiles] = useState<string | null>(null);
    const [projectFiles, setProjectFiles] = useState<any[]>([]);
    const [loadingFiles, setLoadingFiles] = useState(false);
    
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

    const updateManualProgress = async (id: string, value: number) => {
        const { error } = await supabase.from('projects').update({ manual_progress: value }).eq('id', id);
        if (!error) loadProjects();
    };

    const loadProjectFiles = async (projectId: string) => {
        setLoadingFiles(true);
        const { data } = await supabase.storage.from('project_files').list(projectId);
        setProjectFiles(data || []);
        setLoadingFiles(false);
    };

    useEffect(() => {
        if (selectedProjectFiles) loadProjectFiles(selectedProjectFiles);
    }, [selectedProjectFiles]);

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
            manual_progress: 0
        }]);
        if (!error) {
            setIsModalOpen(false);
            setNewProject({ name: '', email: '', domain: '' });
            loadProjects();
        }
    };

    const handleDeleteProject = async (id: string) => {
        if (!confirm("Deletar PROJETO?")) return;
        await supabase.from('projects').delete().eq('id', id);
        loadProjects();
    };

    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file || !selectedProjectFiles) return;
        const { error } = await supabase.storage.from('project_files').upload(`${selectedProjectFiles}/${file.name}`, file, {
            upsert: true,
            contentType: file.name.endsWith('.html') ? 'text/html' : (file.name.endsWith('.css') ? 'text/css' : undefined)
        });
        if (!error) loadProjectFiles(selectedProjectFiles);
    };

    const handleDeploy = async (projectId: string) => {
        setDeployingId(projectId);
        await supabase.from('projects').update({ deploy_status: 'building' }).eq('id', projectId);
        setTimeout(async () => {
            const { data: files } = await supabase.storage.from('project_files').list(projectId);
            const hasIndex = files?.find(f => f.name.toLowerCase() === 'index.html');
            const finalUrl = hasIndex ? `/preview/${projectId}` : 'no-index';
            await supabase.from('projects').update({ 
                deploy_status: 'ready',
                deploy_url: finalUrl,
                last_deploy: new Date().toISOString()
            }).eq('id', projectId);
            setDeployingId(null);
            loadProjects();
        }, 1500);
    };

    const handleVercelDeploy = async (project: any) => {
        setVercelDeployingId(project.id);
        try {
            const { data: fileList } = await supabase.storage.from('project_files').list(project.id);
            if (!fileList || fileList.length === 0) throw new Error("Sem arquivos.");
            const filesToDeploy = [];
            for (const f of fileList) {
                const { data } = await supabase.storage.from('project_files').download(`${project.id}/${f.name}`);
                if (data) filesToDeploy.push({ file: f.name, data: await data.text() });
            }
            const result = await deployToVercel(project.name, filesToDeploy);
            await supabase.from('projects').update({ deploy_url: result.url, deploy_status: 'ready' }).eq('id', project.id);
            alert("Sucesso Vercel!");
            loadProjects();
        } catch (error: any) {
            alert(error.message);
        } finally {
            setVercelDeployingId(null);
        }
    };

    return (
        <div className="flex-1 overflow-y-auto p-8 bg-[#050505] text-white h-full flex flex-col">
            
            <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 mb-16">
                <div>
                   <h1 className="text-6xl font-black tracking-tighter uppercase italic text-white flex items-center gap-4">
                       Deploy HQ <Zap className="w-10 h-10 text-accent fill-accent" />
                   </h1>
                   <p className="text-[#444] font-bold text-lg mt-2 uppercase tracking-widest italic">Controle de Produção & Infraestrutura</p>
                </div>
                <button onClick={() => setIsModalOpen(true)} className="bg-white text-black font-black px-12 py-5 rounded-[24px] hover:scale-105 transition-all text-xs tracking-widest shadow-2xl">
                   NOVO PROJETO
                </button>
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-2 gap-10">
                {projects.map((proj) => (
                    <motion.div layout key={proj.id} className="bg-[#0c0c0d] border border-white/5 rounded-[48px] p-10 flex flex-col relative group overflow-hidden">
                        
                        <div className="flex justify-between items-start mb-8">
                            <div>
                                <h2 className="text-4xl font-black text-white italic tracking-tighter leading-none mb-2">{proj.name}</h2>
                                <span className="text-[10px] font-black text-accent uppercase bg-accent/5 px-4 py-1 rounded-full border border-accent/20">Operational</span>
                            </div>
                            <button onClick={() => handleDeleteProject(proj.id)} className="text-[#333] hover:text-red-500 transition-colors"><Trash2 className="w-6 h-6" /></button>
                        </div>

                        {/* CONTROLE DE PORCENTAGEM (DEMANDADO) */}
                        <div className="bg-[#050505] border border-white/5 p-8 rounded-[40px] mb-8 relative overflow-hidden">
                            <div className="flex items-center justify-between mb-6">
                                <h4 className="text-[10px] font-black text-[#444] uppercase tracking-[0.3em] flex items-center gap-2"><BarChart3 className="w-4 h-4"/> Progresso do Sistema</h4>
                                <span className="text-2xl font-black text-white">{proj.manual_progress ?? 0}%</span>
                            </div>
                            <input 
                                type="range" min="0" max="100" 
                                value={proj.manual_progress ?? 0} 
                                onChange={(e) => updateManualProgress(proj.id, parseInt(e.target.value))}
                                className="w-full h-2 bg-white/5 rounded-lg appearance-none cursor-pointer accent-accent"
                            />
                            <div className="flex justify-between mt-4">
                                <span className="text-[9px] font-bold text-[#222]">START</span>
                                <span className="text-[9px] font-bold text-[#222]">DELIVERY</span>
                            </div>
                        </div>

                        <div className="bg-[#050505] border border-white/5 p-8 rounded-[40px] mb-8">
                             <div className="flex items-center justify-between mb-4">
                                <h4 className="text-[10px] font-black text-[#444] uppercase tracking-[0.3em] flex items-center gap-2"><FolderOpen className="w-4 h-4"/> Repository</h4>
                                <button onClick={() => setSelectedProjectFiles(selectedProjectFiles === proj.id ? null : proj.id)} className="text-[10px] font-black text-white p-2">
                                    {selectedProjectFiles === proj.id ? <X/> : <Settings2/>}
                                </button>
                             </div>
                             <AnimatePresence>
                                {selectedProjectFiles === proj.id && (
                                    <div className="space-y-3 pt-4 border-t border-white/5">
                                        {projectFiles.map((f, i) => (
                                            <div key={i} className="flex items-center justify-between p-4 bg-[#0c0c0d] rounded-2xl border border-white/5 text-[12px] font-bold text-[#666]">
                                                {f.name}
                                                <button onClick={() => supabase.storage.from('project_files').remove([`${proj.id}/${f.name}`]).then(() => loadProjectFiles(proj.id))}><X className="w-4 h-4 text-red-500/50"/></button>
                                            </div>
                                        ))}
                                        <button onClick={() => fileInputRef.current?.click()} className="w-full py-4 border-2 border-dashed border-white/5 rounded-2xl text-[10px] font-black text-[#333] hover:text-white transition-all uppercase">Upload Cloud</button>
                                    </div>
                                )}
                             </AnimatePresence>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <button onClick={() => handleDeploy(proj.id)} className="py-6 rounded-[32px] font-black text-[10px] uppercase tracking-widest bg-white text-black hover:bg-neutral-200 transition-all flex items-center justify-center gap-2">
                                {deployingId === proj.id ? <Loader2 className="animate-spin w-4 h-4"/> : <Monitor className="w-4 h-4"/>} Local Live
                            </button>
                            <button onClick={() => handleVercelDeploy(proj)} className="py-6 rounded-[32px] font-black text-[10px] uppercase tracking-widest bg-accent text-white flex items-center justify-center gap-2 hover:scale-[1.02] transition-all">
                                {vercelDeployingId === proj.id ? <Loader2 className="animate-spin w-4 h-4"/> : <Rocket className="w-4 h-4"/>} Vercel Push
                            </button>
                        </div>
                    </motion.div>
                ))}
            </div>

            <input type="file" hidden ref={fileInputRef} onChange={handleFileUpload} />

            {isModalOpen && (
                <div className="fixed inset-0 bg-black/98 z-[400] flex items-center justify-center p-10">
                    <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="bg-[#0c0c0d] border border-white/5 p-16 rounded-[60px] w-full max-w-2xl relative">
                        <button onClick={() => setIsModalOpen(false)} className="absolute top-12 right-12 text-[#333] hover:text-white"><X className="w-8 h-8"/></button>
                        <h2 className="text-5xl font-black text-white italic tracking-tighter mb-10">NOVA INSTÂNCIA</h2>
                        <form onSubmit={handleCreateProject} className="space-y-10">
                            <div>
                                <label className="text-[10px] font-black uppercase text-[#222] mb-4 block ml-4">Nome do Projeto</label>
                                <input required className="w-full bg-[#050505] p-6 rounded-[32px] text-white border-2 border-white/5 focus:border-accent outline-none font-bold" value={newProject.name} onChange={e => setNewProject({...newProject, name: e.target.value})} />
                            </div>
                            <div>
                                <label className="text-[10px] font-black uppercase text-[#222] mb-4 block ml-4">Email do Cliente</label>
                                <input required type="email" className="w-full bg-[#050505] p-6 rounded-[32px] text-white border-2 border-white/5 focus:border-accent outline-none font-bold" value={newProject.email} onChange={e => setNewProject({...newProject, email: e.target.value})} />
                            </div>
                            <button type="submit" className="w-full bg-white text-black font-black py-8 rounded-[40px] text-xl mt-4">CRIAR AGORA</button>
                        </form>
                    </motion.div>
                </div>
            )}
        </div>
    );
}
