"use client";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { User, Shield, Bell, CreditCard, Camera } from "lucide-react";
import { motion } from "framer-motion";

export default function SettingsPage() {
    const [user, setUser] = useState<any>(null);

    useEffect(() => {
        supabase.auth.getSession().then(({data}) => setUser(data.session?.user));
    }, []);

    const tabs = [
        { id: "profile", label: "Meu Perfil", icon: <User className="w-5 h-5"/> },
        { id: "security", label: "Segurança", icon: <Shield className="w-5 h-5"/> },
        { id: "notifications", label: "Notificações", icon: <Bell className="w-5 h-5"/> },
        { id: "billing", label: "Faturamento e API", icon: <CreditCard className="w-5 h-5"/> },
    ];

    if (!user) return (
        <div className="flex-1 flex flex-col items-center justify-center bg-[#111213]">
            <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1, ease: "linear" }} className="w-12 h-12 border-[3px] border-[#2c2d30] border-t-accent rounded-full mb-4" />
        </div>
    );

    return (
        <div className="flex-1 overflow-y-auto bg-[#111213] p-6 sm:p-12 max-w-6xl mx-auto w-full">
            <motion.h1 initial={{opacity:0, y:-10}} animate={{opacity:1, y:0}} className="text-3xl md:text-5xl font-extrabold text-white mb-10 tracking-tight">
                Configurações
            </motion.h1>
            
            <div className="flex flex-col md:flex-row gap-10">
                {/* Sidebar das Settings */}
                <motion.div initial={{opacity:0, x:-20}} animate={{opacity:1, x:0}} transition={{delay: 0.1}} className="w-full md:w-64 flex flex-col gap-2 shrink-0">
                    {tabs.map((t, i) => (
                        <button key={t.id} className={`flex items-center gap-3 px-4 py-4 rounded-xl font-bold text-sm transition-all ${i === 0 ? 'bg-[#1e1f24] text-white border border-[#2c2d30] shadow-sm' : 'text-[#888] hover:text-[#d0d0d0] hover:bg-[#1a1b1e]'}`}>
                            {t.icon} {t.label}
                        </button>
                    ))}
                </motion.div>

                {/* Conteúdo principal */}
                <motion.div initial={{opacity:0, y:20}} animate={{opacity:1, y:0}} transition={{delay: 0.2}} className="flex-1 flex flex-col gap-8">
                    <div className="bg-[#141516] p-8 md:p-10 rounded-[32px] border border-[#2c2d30] shadow-2xl shadow-black/40">
                        <h2 className="text-2xl font-bold text-white mb-8 border-b border-[#2c2d30] pb-4">Identificação do Workspace</h2>
                        
                        <div className="flex flex-col gap-8">
                            <div className="flex items-center gap-8">
                                <div className="relative">
                                    <div className="w-28 h-28 rounded-full bg-gradient-to-tr from-blue-600 to-accent flex items-center justify-center text-4xl font-black text-white shadow-lg border-4 border-[#1e1f24]">
                                        {user.email?.substring(0,2).toUpperCase()}
                                    </div>
                                    <button className="absolute bottom-0 right-0 p-3 bg-[#1e1f24] border border-[#2c2d30] rounded-full text-white hover:bg-[#2c2d30] transition-colors shadow-lg shadow-black cursor-pointer">
                                       <Camera className="w-5 h-5" />
                                    </button>
                                </div>
                                <div className="flex flex-col gap-3">
                                    <h3 className="text-2xl font-bold text-white tracking-tight">{user.user_metadata?.full_name || 'Conta Corporativa'}</h3>
                                    <span className="bg-accent/10 border border-accent/20 text-accent uppercase text-[10px] font-bold px-3 py-1.5 rounded w-max tracking-widest shadow-lg shadow-accent/10">Plano Oficial Susanoo</span>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
                                <div>
                                    <label className="text-sm font-semibold opacity-70 mb-3 block text-[#d0d0d0]">E-mail de Contato Principal</label>
                                    <input type="text" disabled value={user.email} className="w-full bg-[#1e1f24] border border-[#2c2d30] rounded-2xl p-5 text-[#888] font-medium text-[15px]" />
                                </div>
                                <div>
                                    <label className="text-sm font-semibold opacity-70 mb-3 block text-[#d0d0d0]">ID Único da Empresa</label>
                                    <input type="text" disabled value={user.id.substring(0,20) + '...'} className="w-full bg-[#1e1f24] border border-[#2c2d30] rounded-2xl p-5 text-[#888] font-medium text-[15px]" />
                                </div>
                            </div>

                            <div className="mt-8 pt-8 border-t border-[#2c2d30] flex justify-end">
                                <button className="bg-white hover:bg-gray-200 text-black font-bold px-10 py-4 rounded-xl transition-all shadow-xl shadow-white/10 text-[15px]">
                                    Salvar Alterações
                                </button>
                            </div>
                        </div>
                    </div>
                </motion.div>
            </div>
        </div>
    );
}
