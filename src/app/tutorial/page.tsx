"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowDown, ArrowRight, ClipboardPenLine, MessageSquareText, MonitorSmartphone, Rocket, SearchCheck } from "lucide-react";

const journey = [
  ["Descoberta", "Você conta a visão do seu negócio", "Começamos com uma conversa simples: objetivo, público, referências e o que precisa mudar para a sua marca avançar.", ClipboardPenLine],
  ["Direção", "Transformamos a ideia em um plano", "Você recebe uma proposta com escopo, investimento e prazo. Nada segue em frente sem alinhamento claro.", SearchCheck],
  ["Construção", "O projeto toma forma com você por perto", "Acompanhe entregas, centralize feedbacks e veja cada decisão se converter em uma presença digital consistente.", MessageSquareText],
  ["Lançamento", "Publicamos quando tudo estiver pronto", "Revisamos os detalhes e colocamos seu site no ar com qualidade técnica para funcionar em qualquer tela.", MonitorSmartphone],
] as const;

export default function TutorialPage() {
  return <main className="min-h-screen bg-background text-foreground">
    <section className="border-b border-surface-border px-5 pb-20 pt-32 md:px-10 md:pb-28 md:pt-44">
      <div className="mx-auto max-w-7xl">
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mb-12 flex items-center gap-4"><span className="h-px w-12 bg-accent" /><span className="text-xs font-black uppercase tracking-[0.3em] text-accent">O processo Susanoo</span></motion.div>
        <div className="grid gap-10 lg:grid-cols-12 lg:items-end">
          <motion.h1 initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }} className="text-5xl font-black uppercase italic leading-[0.88] tracking-tighter md:text-7xl lg:col-span-8 lg:text-8xl">Sem mistério.<br />Só um caminho <span className="text-accent">bem feito.</span></motion.h1>
          <motion.div initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }} className="lg:col-span-4 lg:pb-2"><p className="text-base font-bold leading-relaxed text-foreground/55">Você participa das decisões importantes; a Susanoo cuida da complexidade de transformar a sua ideia em resultado.</p><div className="mt-7 flex items-center gap-3 text-xs font-black uppercase tracking-[0.2em] text-foreground/45">Role para conhecer <ArrowDown className="h-4 w-4 text-accent" /></div></motion.div>
        </div>
      </div>
    </section>

    <section className="relative mx-auto max-w-7xl px-5 py-20 md:px-10 md:py-32">
      <div className="pointer-events-none absolute left-[19%] top-20 hidden h-[calc(100%-10rem)] w-px bg-surface-border md:block" />
      <div className="space-y-10 md:space-y-0">
        {journey.map(([eyebrow, title, description, Icon], index) => <motion.article key={eyebrow} initial={{ opacity: 0, y: 22 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, amount: 0.35 }} transition={{ duration: 0.45 }} className="relative grid gap-6 md:grid-cols-[20%_1fr_34%] md:gap-10 md:py-12">
          <div className="md:pt-2"><span className="mb-3 block text-5xl font-black italic tracking-tighter text-accent/20">0{index + 1}</span><span className="text-xs font-black uppercase tracking-[0.2em] text-accent">{eyebrow}</span></div>
          <div className="relative flex items-start gap-5 md:pt-2"><span className="relative z-10 hidden h-4 w-4 shrink-0 rounded-full border-4 border-background bg-accent shadow-[0_0_0_1px_var(--accent)] md:block" /><div><h2 className="text-3xl font-black uppercase italic leading-none tracking-tighter md:text-5xl">{title}</h2><p className="mt-5 max-w-xl text-sm font-medium leading-relaxed text-foreground/55 md:text-base">{description}</p></div></div>
          <div className="flex items-end md:justify-end"><div className="flex h-16 w-16 items-center justify-center rounded-full border border-surface-border bg-surface text-accent shadow-sm"><Icon className="h-7 w-7" /></div></div>
        </motion.article>)}
      </div>
    </section>

    <section className="border-y border-surface-border bg-foreground px-5 py-16 text-background md:px-10 md:py-24"><div className="mx-auto grid max-w-7xl gap-10 md:grid-cols-[1fr_auto] md:items-center"><div><p className="text-xs font-black uppercase tracking-[0.25em] text-accent">Depois do lançamento</p><h2 className="mt-5 max-w-3xl text-4xl font-black uppercase italic leading-none tracking-tighter md:text-6xl">Seu site não é o fim. É a nova base para crescer.</h2></div><Rocket className="h-16 w-16 text-accent md:h-24 md:w-24" /></div></section>

    <section className="px-5 py-20 md:px-10 md:py-28"><div className="mx-auto flex max-w-7xl flex-col justify-between gap-8 border-l-2 border-accent pl-7 md:flex-row md:items-end md:pl-10"><div><p className="text-xs font-black uppercase tracking-[0.25em] text-accent">Seu próximo passo</p><h2 className="mt-4 text-3xl font-black uppercase italic tracking-tighter md:text-5xl">Vamos conversar sobre sua ideia?</h2></div><Link href="/register?role=client" className="group inline-flex w-fit items-center gap-3 rounded-full bg-accent px-7 py-4 text-sm font-black text-white shadow-xl shadow-accent/25 transition-transform hover:scale-105">Começar agora <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" /></Link></div></section>
  </main>;
}
