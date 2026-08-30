"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
	Empty,
	EmptyContent,
	EmptyDescription,
	EmptyHeader,
	EmptyTitle,
} from "@/components/ui/empty";
import { HomeIcon, CompassIcon, Sparkles } from "lucide-react";
import { motion } from "framer-motion";

export function NotFound() {
	return (
		<div className="relative flex min-h-screen w-full items-center justify-center overflow-hidden bg-[#050505] text-white p-6">
			{/* Efeitos de Iluminação de Fundo Susanoo */}
			<div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-accent/20 rounded-full blur-[140px] pointer-events-none" />
			<div className="absolute top-1/4 left-1/3 w-[300px] h-[300px] bg-blue-600/15 rounded-full blur-[100px] pointer-events-none" />
			<div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 mix-blend-overlay pointer-events-none"></div>

			<motion.div 
				initial={{ opacity: 0, y: 20, scale: 0.95 }}
				animate={{ opacity: 1, y: 0, scale: 1 }}
				transition={{ duration: 0.5, ease: "easeOut" }}
				className="relative z-10 w-full max-w-lg"
			>
				<Empty className="border-0 bg-transparent p-0">
					<EmptyHeader className="max-w-md">
						<div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-accent/10 border border-accent/20 text-accent text-xs font-black uppercase tracking-widest mb-2 self-center">
							<Sparkles className="w-3.5 h-3.5" /> Página Não Encontrada
						</div>
						<EmptyTitle className="text-8xl md:text-9xl font-black tracking-tighter text-transparent bg-clip-text bg-gradient-to-b from-white via-white/80 to-white/10 select-none">
							404
						</EmptyTitle>
						<EmptyDescription className="text-sm md:text-base text-zinc-400 font-medium leading-relaxed max-w-md mx-auto">
							A página que você está procurando pode ter sido movida, excluída ou nunca existiu em nossos servidores.
						</EmptyDescription>
					</EmptyHeader>
					<EmptyContent className="mt-4">
						<div className="flex flex-col sm:flex-row gap-3 w-full justify-center">
							<Button asChild className="bg-accent hover:bg-accent/90 text-white font-bold h-12 px-6 rounded-2xl shadow-xl shadow-accent/25">
								<Link href="/">
									<HomeIcon className="size-4 mr-2" />
									Voltar ao Início
								</Link>
							</Button>

							<Button asChild variant="outline" className="border-white/10 hover:bg-white/5 text-white font-bold h-12 px-6 rounded-2xl bg-[#111]">
								<Link href="/dashboard">
									<CompassIcon className="size-4 mr-2 text-accent" />
									Explorar Plataforma
								</Link>
							</Button>
						</div>
					</EmptyContent>
				</Empty>
			</motion.div>
		</div>
	);
}

export default NotFound;
