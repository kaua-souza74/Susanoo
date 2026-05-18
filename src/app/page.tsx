"use client";

import { motion } from "framer-motion";
import { LogIn, ArrowRight, Zap } from "lucide-react";
import { ThemeToggle } from "@/components/theme-toggle";
import { Logo } from "@/components/logo";
import Link from "next/link";

export default function Home() {
  return (
    <main className="relative min-h-screen flex flex-col items-center justify-center overflow-hidden">
      {/* Background Glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-accent/10 blur-[120px] rounded-full pointer-events-none transition-colors duration-500" />

      {/* Navbar area */}
      <nav className="absolute top-0 w-full p-6 flex justify-between items-center z-10 max-w-7xl mx-auto">
        <Link href="/" className="flex items-center cursor-pointer">
          <Logo />
        </Link>
        <div className="flex items-center gap-4">
          <ThemeToggle />
          <Link href="/login" className="glass px-6 py-2 rounded-full text-sm font-medium hover:bg-surface/80 transition-colors flex items-center gap-2">
            Área do Cliente <LogIn className="w-4 h-4" />
          </Link>
        </div>
      </nav>

      {/* Hero Section */}
      <div className="z-10 flex flex-col items-center text-center px-4 max-w-4xl mt-16">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="inline-flex glass px-4 py-1.5 rounded-full text-sm font-medium text-accent mb-6 items-center gap-2 hidden sm:flex"
        >
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-accent opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-accent"></span>
          </span>
          SaaS Plataforma (Fase 1 MVP)
        </motion.div>

        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="text-5xl md:text-7xl font-extrabold tracking-tight mb-8 leading-tight"
        >
          A evolução digital do seu <br className="hidden md:block" />
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-accent to-fuchsia-400">
            pequeno comércio.
          </span>
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="text-lg text-foreground/60 mb-12 max-w-2xl"
        >
          Acompanhe a criação do seu site em tempo real, aprove tarefas e converse com a equipe 
          nesta plataforma desenvolvida exclusivamente para gerar resultados.
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.3 }}
          className="flex flex-col sm:flex-row gap-4"
        >
          <Link href="/login" className="bg-accent text-accent-foreground px-8 py-4 rounded-xl font-semibold flex items-center justify-center gap-2 hover:bg-accent/90 transition-all shadow-[0_0_30px_rgba(168,85,247,0.3)]">
            Entrar no Painel <ArrowRight className="w-5 h-5" />
          </Link>
          <button className="glass px-8 py-4 rounded-xl font-semibold hover:bg-surface/50 transition-all">
            Falar com a Equipe
          </button>
        </motion.div>
      </div>

      {/* Dashboard Preview Section */}
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.7, delay: 0.5 }}
        className="z-10 mt-24 glass w-full max-w-5xl rounded-2xl border border-surface-border p-2 hidden md:block"
      >
        <div className="bg-surface rounded-xl overflow-hidden w-full aspect-video relative flex flex-col items-center justify-center border border-surface-border/50">
          <div className="flex gap-4 w-full h-full p-8 text-left">
            {/* Sidebar Mock */}
            <div className="w-64 glass rounded-xl p-4 flex flex-col gap-4">
               <div className="h-8 bg-surface-border rounded-lg w-full mb-4"></div>
               <div className="h-4 bg-surface-border rounded w-3/4"></div>
               <div className="h-4 bg-surface-border rounded w-1/2"></div>
               <div className="h-4 bg-surface-border rounded w-5/6"></div>
            </div>
            
            <div className="flex-1 flex flex-col gap-4">
                {/* Header Mock */}
                <div className="h-24 glass rounded-xl w-full p-6 flex flex-col justify-center">
                    <span className="text-sm text-foreground/50">Status do Projeto</span>
                    <span className="text-xl font-bold flex items-center gap-2 mt-1">
                      <span className="w-2 h-2 rounded-full bg-accent"></span> Em Desenvolvimento
                    </span>
                </div>
                
                {/* Kanban/Content Mock */}
                <div className="flex-1 glass rounded-xl w-full p-6 flex gap-4">
                  <div className="flex-1 bg-surface-border/30 rounded-lg p-4">
                    <div className="h-4 bg-surface-border rounded w-1/2 mb-4"></div>
                    <div className="h-16 bg-surface-border/50 rounded-lg mb-2"></div>
                    <div className="h-16 bg-surface-border/50 rounded-lg"></div>
                  </div>
                  <div className="flex-1 bg-surface-border/30 rounded-lg p-4">
                     <div className="h-4 bg-surface-border rounded w-1/2 mb-4"></div>
                     <div className="h-16 bg-accent/20 border border-accent/20 rounded-lg mb-2"></div>
                  </div>
                </div>
            </div>
          </div>
        </div>
      </motion.div>
    </main>
  );
}
