"use client";
import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { Plus, MoreHorizontal, LayoutList, ChevronDown, Check, X, Trash2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

const TEAM = [
    { name: 'Davi', color: 'bg-emerald-600', ring: 'ring-emerald-600/30' },
    { name: 'Vinícius', color: 'bg-blue-600', ring: 'ring-blue-600/30' },
    { name: 'Lucas', color: 'bg-orange-600', ring: 'ring-orange-600/30' },
    { name: 'Kauã', color: 'bg-purple-600', ring: 'ring-purple-600/30' }
];

export default function AdminTrello() {
   const [tasks, setTasks] = useState<any[]>([]);
   const [projects, setProjects] = useState<any[]>([]);
   
   // Trello Menu Customizado
   const [filterProject, setFilterProject] = useState<string>("all");
   const [isDropdown, setIsDropdown] = useState(false);

   // Criação de Modal Options
   const [isModalOpen, setIsModalOpen] = useState(false);
   const [newTask, setNewTask] = useState({ title: '', assignee: TEAM[0].name, project_id: 'all' });

   const load = async () => {
      const { data: projs } = await supabase.from('projects').select('*');
      setProjects(projs || []);
      
      const { data: allTasks } = await supabase.from('tasks').select('*, projects(name)').order('created_at', { ascending: false });
      setTasks(allTasks || []);
   };

   useEffect(() => {
       load();

       const channel = supabase.channel('tasks_sync')
           .on('postgres_changes', { event: '*', schema: 'public', table: 'tasks' }, () => {
               load();
           })
           .subscribe();

       return () => { supabase.removeChannel(channel) };
   }, []);

   const cols = [
       { id: 'todo', name: 'Backlog Interno' },
       { id: 'doing', name: 'Em Produção' },
       { id: 'review', name: 'Revisão da Agência' },
       { id: 'done', name: 'Entregue (Live)' },
   ];

   const handleDragStart = (e: React.DragEvent, taskId: string) => { e.dataTransfer.setData('taskId', taskId); };
   const handleDragOver = (e: React.DragEvent) => { e.preventDefault(); };

   const handleDrop = async (e: React.DragEvent, newStatus: string) => {
       e.preventDefault();
       const taskId = e.dataTransfer.getData('taskId');
       if (!taskId) return;
       
       // Update local
       setTasks(prev => prev.map(t => t.id === taskId ? { ...t, status: newStatus } : t));
       
       // Update DB
       await supabase.from('tasks').update({ status: newStatus }).eq('id', taskId);
   };

   const handleCreateTaskForm = async (e: React.FormEvent) => {
       e.preventDefault();
       const payload = {
           title: newTask.title,
           status: 'todo',
           assignee: newTask.assignee,
           project_id: newTask.project_id === 'all' ? null : newTask.project_id
       };

       const { error } = await supabase.from('tasks').insert([payload]);
       if (!error) {
           setIsModalOpen(false);
           setNewTask({ title: '', assignee: TEAM[0].name, project_id: 'all' });
           load();
       } else {
           alert("Erro ao lançar carta: " + error.message);
       }
   };

   const handleDeleteTask = async (id: string) => {
       if (confirm("Deseja mobilizar esta carta para o arquivo morto (Deletar)?")) {
           await supabase.from('tasks').delete().eq('id', id);
           setTasks(prev => prev.filter(t => t.id !== id));
       }
   };

   const displayTasks = filterProject === 'all' ? tasks : tasks.filter(t => t.project_id === filterProject);
   const selectedProjectName = filterProject === 'all' ? 'Universo Global (Todos Canais)' : projects.find(p => p.id === filterProject)?.name || 'Todos';

   return (
       <div className="flex-1 overflow-x-hidden p-8 md:p-12 2xl:p-16 bg-[#050505] flex flex-col h-full relative">
           
           <div className="flex flex-col md:flex-row justify-between md:items-end gap-6 mb-10 shrink-0">
               <div>
                   <h1 className="text-5xl font-black text-white tracking-tighter mb-3 flex items-center gap-4">
                       <LayoutList className="w-10 h-10 text-accent"/> Trello HQ
                   </h1>
                   <p className="text-[#888] font-medium text-lg">Gerenciamento ágil de demandas transversais.</p>
               </div>
               <div className="flex flex-col sm:flex-row gap-4 items-center">
                   
                   <div className="relative w-full sm:w-auto z-40">
                       <button onClick={() => setIsDropdown(!isDropdown)} className="bg-[#111] border border-[#222] hover:border-accent text-white px-6 py-4 rounded-2xl text-sm font-bold flex items-center justify-between w-full sm:w-[300px] transition-all shadow-2xl">
                           <span className="truncate">{selectedProjectName}</span>
                           <ChevronDown className={`w-4 h-4 text-accent transition-transform ${isDropdown ? 'rotate-180' : ''}`}/>
                       </button>

                       <AnimatePresence>
                       {isDropdown && (
                           <motion.div initial={{opacity:0, y:-10}} animate={{opacity:1, y:0}} exit={{opacity:0, y:-10}} className="absolute top-[110%] left-0 w-full min-w-[300px] bg-[#0a0a0a] border border-[#222] rounded-2xl shadow-3xl flex flex-col overflow-hidden">
                               <button onClick={() => {setFilterProject('all'); setIsDropdown(false)}} className={`p-4 text-sm font-bold text-left transition-colors flex items-center justify-between ${filterProject === 'all' ? 'bg-accent/20 text-white' : 'text-[#888] hover:text-white hover:bg-[#111]'}`}>
                                   Universo Global (Todos)
                                   {filterProject === 'all' && <Check className="w-4 h-4 text-accent"/>}
                               </button>
                               {projects.map(p => (
                                   <button key={p.id} onClick={() => {setFilterProject(p.id); setIsDropdown(false)}} className={`p-4 text-sm font-bold text-left border-t border-[#222] transition-colors flex items-center justify-between ${filterProject === p.id ? 'bg-accent/20 text-white' : 'text-[#888] hover:text-white hover:bg-[#111]'}`}>
                                       {p.name}
                                       {filterProject === p.id && <Check className="w-4 h-4 text-accent"/>}
                                   </button>
                               ))}
                           </motion.div>
                       )}
                       </AnimatePresence>
                   </div>

                   <button onClick={() => setIsModalOpen(true)} className="bg-white text-black font-black text-sm px-8 py-4 rounded-2xl flex items-center justify-center gap-2 hover:bg-neutral-200 transition-all shadow-2xl w-full sm:w-auto">
                       <Plus className="w-5 h-5"/> NOVA TAREFA
                   </button>
               </div>
           </div>

           <div className="flex flex-1 gap-8 overflow-x-auto w-full pb-8">
               {cols.map(col => {
                   const colTasks = displayTasks.filter(t => t.status === col.id);
                   return (
                       <div key={col.id} onDrop={(e) => handleDrop(e, col.id)} onDragOver={handleDragOver} className="w-[400px] shrink-0 bg-[#0a0a0b]/50 backdrop-blur-xl border border-[#111] rounded-[40px] flex flex-col max-h-[75vh] shadow-3xl">
                           <div className="px-8 py-6 border-b border-[#111] flex justify-between items-center bg-[#0a0a0b] rounded-t-[40px]">
                               <h3 className="font-black text-[12px] uppercase tracking-[0.2em] text-[#888] flex items-center gap-3">
                                  {col.name} <span className="bg-[#111] border border-[#222] text-accent px-3 py-1 rounded-full text-[10px]">{colTasks.length}</span>
                               </h3>
                               <button className="text-[#333] hover:text-white transition-colors"><MoreHorizontal className="w-5 h-5"/></button>
                           </div>
                           
                           <div className="flex-1 p-6 overflow-y-auto flex flex-col gap-6 custom-scrollbar">
                               {colTasks.map(task => {
                                   const assigneeMode = TEAM.find(t => t.name === task.assignee) || TEAM[0];
                                   return (
                                   <div 
                                      key={task.id} 
                                      draggable 
                                      onDragStart={(e) => handleDragStart(e, task.id)} 
                                      className="bg-[#0f0f10] border border-[#1a1a1a] p-6 rounded-3xl hover:border-accent/40 cursor-grab transition-all shadow-xl active:cursor-grabbing group relative"
                                   >
                                       <button 
                                          onClick={() => handleDeleteTask(task.id)}
                                          className="absolute top-4 right-4 p-2 bg-red-500/10 text-red-500 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-500 hover:text-white"
                                       >
                                          <Trash2 className="w-3.5 h-3.5" />
                                       </button>

                                       <div className="mb-4">
                                           <span className="bg-[#111] border border-[#222] text-[9px] uppercase font-black tracking-[0.2em] text-[#555] px-3 py-1.5 rounded-lg">
                                               {task.projects?.name || 'Geral HQ'}
                                           </span>
                                       </div>
                                       <p className="font-bold text-white text-lg leading-tight mb-8">
                                           {task.title}
                                       </p>
                                       <div className="flex justify-between items-center pt-5 border-t border-[#111]">
                                           <div className="flex items-center gap-3 bg-black/40 px-3 py-2 rounded-2xl border border-[#111]">
                                               <div className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-black text-white ${assigneeMode.color} shadow-lg`}>
                                                   {assigneeMode.name.substring(0,1)}
                                               </div>
                                               <span className="text-[12px] font-bold text-[#666] tracking-tight">{assigneeMode.name}</span>
                                           </div>
                                           <span className="text-[10px] font-black text-[#333] uppercase tracking-widest">
                                               {new Date(task.created_at).toLocaleDateString('pt-BR', {day:'2-digit', month: 'short'})}
                                           </span>
                                       </div>
                                   </div>
                               )})}
                               
                               <button onClick={() => setIsModalOpen(true)} className="w-full py-6 mt-2 rounded-3xl border-2 border-dashed border-[#111] text-[#333] font-black text-[11px] uppercase tracking-widest hover:border-accent/20 hover:text-accent/60 transition-all flex justify-center items-center gap-3">
                                   <Plus className="w-4 h-4"/> Nova Demanda
                               </button>
                           </div>
                       </div>
                   );
               })}
           </div>

           {/* Modal Task */}
           <AnimatePresence>
           {isModalOpen && (
               <div className="fixed inset-0 bg-black/90 backdrop-blur-md z-[100] flex items-center justify-center p-6">
                   <motion.div initial={{opacity:0, scale:0.95}} animate={{opacity:1, scale:1}} exit={{opacity:0, scale:0.95}} className="w-full max-w-xl bg-[#0a0a0a] border border-[#222] p-10 rounded-[40px] shadow-3xl relative">
                       <button onClick={() => setIsModalOpen(false)} className="absolute top-8 right-8 text-[#555] hover:text-white"><X className="w-6 h-6"/></button>
                       <h3 className="text-3xl font-black text-white tracking-widest uppercase mb-8">Mobilizar Operação</h3>
                       
                       <form onSubmit={handleCreateTaskForm} className="flex flex-col gap-6">
                           <div>
                               <label className="block text-[10px] font-black text-[#555] mb-3 uppercase tracking-[0.3em]">Qual a Missão?</label>
                               <input type="text" autoFocus required value={newTask.title} onChange={e => setNewTask({...newTask, title: e.target.value})} placeholder="Ex: Deploy Home Client X" className="w-full bg-[#111] border border-[#222] p-5 text-white rounded-2xl outline-none focus:border-accent" />
                           </div>
                           
                           <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                               <div>
                                   <label className="block text-[10px] font-black text-[#555] mb-3 uppercase tracking-[0.3em]">Canal / Projeto</label>
                                   <select value={newTask.project_id} onChange={e => setNewTask({...newTask, project_id: e.target.value})} className="w-full bg-[#111] border border-[#222] p-5 text-white rounded-2xl outline-none focus:border-accent appearance-none cursor-pointer">
                                       <option value="all">Universo Global</option>
                                       {projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                                   </select>
                               </div>
                               <div>
                                   <label className="block text-[10px] font-black text-[#555] mb-3 uppercase tracking-[0.3em]">Executivo Agente</label>
                                   <select value={newTask.assignee} onChange={e => setNewTask({...newTask, assignee: e.target.value})} className="w-full bg-[#111] border border-[#222] p-5 text-white rounded-2xl outline-none focus:border-accent appearance-none cursor-pointer">
                                       {TEAM.map(m => <option key={m.name} value={m.name}>{m.name}</option>)}
                                   </select>
                               </div>
                           </div>

                           <div className="flex gap-4 mt-8">
                               <button type="button" onClick={() => setIsModalOpen(false)} className="px-8 py-5 rounded-2xl font-black text-[12px] uppercase tracking-widest text-[#555] hover:bg-[#111] hover:text-white flex-1 transition-all">Abortar</button>
                               <button type="submit" className="px-8 py-5 rounded-2xl font-black text-[12px] uppercase tracking-widest bg-white text-black hover:bg-neutral-200 shadow-3xl flex-1 transition-all">Lançar Carta</button>
                           </div>
                       </form>
                   </motion.div>
               </div>
           )}
           </AnimatePresence>

       </div>
   );
}
