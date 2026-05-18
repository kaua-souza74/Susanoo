"use client";
import { Bot, Sparkles } from "lucide-react";

export default function AIPage() {
    return (
        <div className="flex-1 flex flex-col items-center justify-center p-8 bg-[#111213] text-center">
            <div className="w-24 h-24 bg-gradient-to-br from-accent to-blue-600 rounded-3xl flex items-center justify-center shadow-2xl shadow-accent/20 border border-white/10 mb-8 relative">
                <Bot className="w-12 h-12 text-white" />
                <Sparkles className="w-6 h-6 text-yellow-400 absolute -top-2 -right-2 animate-pulse" />
            </div>
            
            <h1 className="text-4xl font-black text-white mb-4 tracking-tighter">Inteligência Artificial Susanoo</h1>
            <p className="text-[#a0a0a0] max-w-lg mb-8 leading-relaxed font-medium">
                Nosso hub de IA vai analisar o progresso do seu site, sugerir copys para a sua marca, e enviar relatórios direto para o seu painel em breve.
            </p>

            <button className="bg-[#1e1f24] border border-[#2c2d30] text-white px-8 py-3 rounded-full font-bold shadow-lg flex items-center gap-2 hover:border-accent transition-colors">
                <Sparkles className="w-4 h-4 text-accent" />
                Entrar na Lista de Espera 
            </button>
        </div>
    );
}
