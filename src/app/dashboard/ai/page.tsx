"use client";
import { AnimatedAIChat } from "@/components/ui/animated-ai-chat";
import { motion } from "framer-motion";

export default function AIPage() {
    return (
        <div className="flex-1 flex flex-col h-full bg-background overflow-hidden">
            <div className="p-8 border-b border-surface-border bg-surface/30 backdrop-blur-md relative z-20">
                <div className="max-w-5xl mx-auto flex items-center justify-between">
                    <div>
                        <h1 className="text-3xl font-black text-foreground tracking-tighter flex items-center gap-3">
                            Susanoo Intel AI <span className="text-[10px] bg-accent/20 text-accent px-3 py-1 rounded-full uppercase tracking-widest font-black border border-accent/20">Beta v2.0</span>
                        </h1>
                        <p className="text-foreground/40 text-xs font-bold uppercase tracking-widest mt-1">Conectado ao núcleo de processamento neural</p>
                    </div>
                </div>
            </div>

            <div className="flex-1 relative">
                <AnimatedAIChat />
            </div>
        </div>
    );
}
