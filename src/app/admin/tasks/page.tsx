"use client";
import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { Plus, MoreHorizontal, LayoutList, ChevronDown, Check, X } from "lucide-react";
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

   useEffect(() => {
       const load = async () => {
          const { data: projs } = await supabase.from('projects').select('*');
          setProjects(projs || []);
          
          const { data: allTasks } = await supabase.from('tasks').select('*, projects(name)');
          const mappedTasks = allTasks?.map(t => ({
              ...t, 
              assignee: t.assignee || TEAM[Math.floor(Math.random() * TEAM.length)].name
          })) || [];
          setTasks(mappedTasks);
       };
       load();
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
       setTasks(prev => prev.map(t => t.id === taskId ? { ...t, status: newStatus } : t));
       await supabase.from('tasks').update({ status: newStatus }).eq('id', taskId);
   };

   const handleCreateTaskForm = async (e: React.FormEvent) => {
       e.preventDefault();
       const payload = {
           title: newTask.title,
           status: 'todo',
           assignee: newTask.assignee,
           project_id: newTask.project_id === 'all' ? null : newTask.project_id // Se for all, n atrela a ngm no DB (tarefa avulsa agência)
       };

       const { data } = await supabase.from('tasks').insert([payload]).select('*, projects(name)').single();
       if (data) setTasks(prev => [...prev, data]);
       setIsModalOpen(false);
       setNewTask({ title: '', assignee: TEAM[0].name, project_id: 'all' });
   };

   const displayTasks = filterProject === 'all' ? tasks : tasks.filter(t => t.project_id === filterProject);
   const selectedProjectName = filterProject === 'all' ? 'Universo Global (Todos Canais)' : projects.find(p => p.id === filterProject)?.name || 'Todos';

   return (
       <div className="flex-1 overflow-x-hidden p-8 md:p-12 2xl:p-16 bg-[#050505] flex flex-col h-full relative">
           
           {/* Cabeçalho */}
           <div className="flex flex-col md:flex-row justify-between md:items-end gap-6 mb-10 shrink-0">
               <div>
                   <h1 className="text-4xl font-black text-white tracking-tighter mb-2 flex items-center gap-4">
                       <LayoutList className="w-8 h-8 text-accent"/> Trello HQ
                   </h1>
                   <p className="text-[#888] font-medium text-sm">Visualize, crie e arraste tarefas entre todos os sócios e projetos integrados.</p>
               </div>
               <div className="flex flex-col sm:flex-row gap-4 items-center">
                   
                   {/* Dropdown Customizado Maravilhoso */}
                   <div className="relative w-full sm:w-auto z-40">
                       <button onClick={() => setIsDropdown(!isDropdown)} className="bg-[#111213] border border-[#333] hover:border-accent text-white px-5 py-3 rounded-xl text-sm font-bold flex items-center justify-between w-full sm:w-[280px] transition-all shadow-[0_0_20px_rgba(0,0,0,0.5)]">
                           <span className="truncate">{selectedProjectName}</span>
                           <ChevronDown className={`w-4 h-4 text-accent transition-transform ${isDropdown ? 'rotate-180' : ''}`}/>
                       </button>

                       <AnimatePresence>
                       {isDropdown && (
                           <motion.div initial={{opacity:0, y:-10}} animate={{opacity:1, y:0}} exit={{opacity:0, y:-10}} className="absolute top-[110%] left-0 w-full min-w-[280px] bg-[#1a1b1e] border border-[#333] rounded-xl shadow-2xl flex flex-col overflow-hidden">
                               <button onClick={() => {setFilterProject('all'); setIsDropdown(false)}} className={`p-3 text-sm font-bold text-left transition-colors flex items-center justify-between ${filterProject === 'all' ? 'bg-accent/20 text-white' : 'text-[#a0a0a0] hover:text-white hover:bg-[#222]'}`}>
                                   Universo Global (Todos)
                                   {filterProject === 'all' && <Check className="w-4 h-4 text-accent"/>}
                               </button>
                               {projects.map(p => (
                                   <button key={p.id} onClick={() => {setFilterProject(p.id); setIsDropdown(false)}} className={`p-3 text-sm font-bold text-left border-t border-[#333] transition-colors flex items-center justify-between ${filterProject === p.id ? 'bg-accent/20 text-white' : 'text-[#a0a0a0] hover:text-white hover:bg-[#222]'}`}>
                                       {p.name}
                                       {filterProject === p.id && <Check className="w-4 h-4 text-accent"/>}
                                   </button>
                               ))}
                           </motion.div>
                       )}
                       </AnimatePresence>
                   </div>

                   <button onClick={() => setIsModalOpen(true)} className="bg-white text-black font-extrabold text-[13px] px-6 py-3 rounded-xl flex items-center justify-center gap-2 hover:bg-neutral-200 transition-colors shadow-[0_0_20px_rgba(255,255,255,0.1)] w-full sm:w-auto">
                       <Plus className="w-4 h-4"/> NOMEAR TAREFA
                   </button>
               </div>
           </div>

           {/* Filtro Operacional dos 4 Sócios */}
           <div className="flex items-center gap-3 mb-8 shrink-0 bg-[#0a0a0a] p-3 rounded-2xl w-max border border-[#222]">
               <span className="text-[10px] font-black uppercase tracking-[0.2em] text-[#555] ml-2 mr-4">Sócios ADM:</span>
               {TEAM.map(member => (
                   <button key={member.name} className="flex items-center gap-2 bg-[#111] hover:bg-[#1a1b1e] border border-[#222] hover:border-[#444] px-4 py-2 rounded-xl transition-all group cursor-pointer">
                       <span className={`w-2.5 h-2.5 rounded-full ${member.color} ring-2 ${member.ring} transition-all group-hover:scale-125`}></span>
                       <span className="text-[13px] font-bold text-[#e0e0e0] group-hover:text-white transition-colors">{member.name}</span>
                   </button>
               ))}
           </div>

           {/* Kanban Master Board */}
           <div className="flex flex-1 gap-6 overflow-x-auto w-full pb-8">
               {cols.map(col => {
                   const colTasks = displayTasks.filter(t => t.status === col.id);
                   return (
                       <div key={col.id} onDrop={(e) => handleDrop(e, col.id)} onDragOver={handleDragOver} className="w-[360px] shrink-0 bg-[#0a0a0b] border border-[#222] rounded-[32px] flex flex-col max-h-[80vh] shadow-2xl">
                           <div className="px-6 py-5 border-b border-[#222] flex justify-between items-center bg-[#111213] rounded-t-[32px]">
                               <h3 className="font-bold text-[14px] uppercase tracking-[0.1em] text-[#e0e0e0] flex items-center gap-2">
                                  {col.name} <span className="bg-[#222] border border-[#333] text-[#888] px-2.5 py-0.5 rounded-md text-[11px]">{colTasks.length}</span>
                               </h3>
                               <button className="text-[#555] hover:text-white transition-colors"><MoreHorizontal className="w-5 h-5"/></button>
                           </div>
                           
                           <div className="flex-1 p-5 overflow-y-auto flex flex-col gap-4 custom-scrollbar">
                               {colTasks.map(task => {
                                   const assigneeMode = TEAM.find(t => t.name === task.assignee) || TEAM[0];
                                   return (
                                   <div key={task.id} draggable onDragStart={(e) => handleDragStart(e, task.id)} className="bg-[#141516] border border-[#2c2d30] p-5 rounded-[20px] hover:border-accent/40 cursor-grab transition-colors shadow-lg active:cursor-grabbing group opacity-100">
                                       <div className="flex justify-between items-start mb-4">
                                           <span className="bg-[#0f0f10] border border-[#222] text-[10px] uppercase font-bold tracking-widest text-[#888] px-3 py-1.5 rounded-md">
                                               {task.projects?.name || 'Projeto Susanoo'}
                                           </span>
                                       </div>
                                       <p className="font-bold text-white text-[15px] leading-relaxed mb-6">
                                           {task.title}
                                       </p>
                                       <div className="flex justify-between items-center pt-4 border-t border-[#222]/50">
                                           <div className="flex items-center gap-2.5 bg-[#0a0a0a] px-3 py-1.5 rounded-full border border-[#222]">
                                               <div className={`w-5 h-5 rounded-full flex items-center justify-center text-[9px] font-black text-white ${assigneeMode.color} shadow-lg`}>
                                                   {assigneeMode.name.substring(0,1)}
                                               </div>
                                               <span className="text-[11px] font-bold text-[#a0a0a0] tracking-wider">{assigneeMode.name}</span>
                                           </div>
                                           <span className="text-[11px] font-bold text-[#444] uppercase tracking-widest">
                                               {new Date(task.created_at).toLocaleDateString('pt-BR', {day:'2-digit', month: 'short'})}
                                           </span>
                                       </div>
                                   </div>
                               )})}
                               
                               <button onClick={() => setIsModalOpen(true)} className="w-full py-4 mt-2 rounded-[20px] border-2 border-dashed border-[#222] text-[#666] font-bold text-[13px] tracking-wide hover:border-[#444] hover:text-[#888] transition-all flex justify-center group-hover:bg-[#111]">
                                   + Criar Demanda Rápida
                               </button>
                           </div>
                       </div>
                   );
               })}
           </div>

           {/* Modal de Criação de Tarefa */}
           {isModalOpen && (
               <div className="absolute inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                   <motion.div initial={{opacity:0, scale:0.95}} animate={{opacity:1, scale:1}} className="w-full max-w-lg bg-[#111213] border border-[#222] p-8 rounded-[32px] shadow-2xl relative">
                       <button onClick={() => setIsModalOpen(false)} className="absolute top-6 right-6 text-[#555] hover:text-white"><X className="w-5 h-5"/></button>
                       <h3 className="text-2xl font-black text-white tracking-tighter mb-6">Nova Operação</h3>
                       
                       <form onSubmit={handleCreateTaskForm} className="flex flex-col gap-5">
                           <div>
                               <label className="block text-sm font-bold text-[#888] mb-2 uppercase tracking-widest">O que precisa ser feito?</label>
                               <input type="text" autoFocus required value={newTask.title} onChange={e => setNewTask({...newTask, title: e.target.value})} placeholder="Ex: Ajustar Home do Client X" className="w-full bg-[#0a0a0a] border border-[#333] p-4 text-white rounded-xl outline-none focus:border-accent" />
                           </div>
                           
                           <div>
                               <label className="block text-sm font-bold text-[#888] mb-2 uppercase tracking-widest">Para Qual Projeto?</label>
                               <select value={newTask.project_id} onChange={e => setNewTask({...newTask, project_id: e.target.value})} className="w-full bg-[#0a0a0a] border border-[#333] p-4 text-white rounded-xl outline-none focus:border-accent appearance-none cursor-pointer">
                                   <option value="all">Sem Projeto / Geral Agência</option>
                                   {projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                               </select>
                           </div>

                           <div>
                               <label className="block text-sm font-bold text-[#888] mb-2 uppercase tracking-widest">Atribuir Executivo (Sócio)</label>
                               <div className="grid grid-cols-2 gap-3">
                                   {TEAM.map(member => (
                                       <button type="button" key={member.name} onClick={() => setNewTask({...newTask, assignee: member.name})} className={`p-4 rounded-xl border flex items-center gap-3 transition-colors ${newTask.assignee === member.name ? 'border-accent bg-[#1a1b1e]' : 'border-[#333] hover:border-[#555] bg-[#0a0a0a]'}`}>
                                           <div className={`w-3 h-3 rounded-full ${member.color}`}></div>
                                           <span className="font-bold text-white text-sm">{member.name}</span>
                                       </button>
                                   ))}
                               </div>
                           </div>

                           <div className="flex gap-4 mt-4">
                               <button type="button" onClick={() => setIsModalOpen(false)} className="px-6 py-4 rounded-xl font-bold text-[#888] hover:bg-[#1a1b1e] hover:text-white flex-1 transition-all">Cancelar</button>
                               <button type="submit" className="px-6 py-4 rounded-xl font-bold bg-white text-black hover:bg-neutral-200 shadow-xl flex-1 transition-all">Mobilizar Carta</button>
                           </div>
                       </form>
                   </motion.div>
               </div>
           )}

       </div>
   );
}
