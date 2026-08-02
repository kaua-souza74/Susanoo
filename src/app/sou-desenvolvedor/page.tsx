"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowRight, BadgeCheck, BriefcaseBusiness, CircleDollarSign, Code2, Layers3, ShieldCheck, Sparkles, Star, UserRoundCheck } from "lucide-react";

const benefits = [
  ["Projetos que combinam com você", "Receba oportunidades alinhadas às suas habilidades e à sua carreira.", BriefcaseBusiness],
  ["Portfólio que abre portas", "Apresente seus melhores trabalhos em um perfil profissional e marcante.", Layers3],
  ["Reputação que cresce", "Cada entrega bem-feita fortalece seu perfil com avaliações de clientes reais.", Star],
  ["Mais segurança para trabalhar", "Tenha projetos acompanhados e acordos transparentes do início ao fim.", ShieldCheck],
  ["Autonomia para evoluir", "Defina suas especialidades e construa seu ritmo de crescimento.", Sparkles],
  ["Potencial de faturamento", "Transforme sua expertise em novas conexões, projetos e resultados.", CircleDollarSign],
] as const;

const steps = [
  ["01", "Crie sua conta", "Conte para a gente quem você é e no que manda bem."],
  ["02", "Mostre seu trabalho", "Complete o perfil com suas especialidades e portfólio."],
  ["03", "Passe pela curadoria", "Validamos cada perfil para manter uma rede de alta qualidade."],
  ["04", "Conecte-se a projetos", "Receba propostas e encontre oportunidades para fazer acontecer."],
] as const;

export default function SouDesenvolvedorPage() {
  return <main className="min-h-screen overflow-hidden bg-background pt-6 text-foreground md:pt-10">
    <section className="relative mx-auto max-w-7xl px-4 pb-20 pt-24 md:px-6 md:pb-32 md:pt-32">
      <div className="pointer-events-none absolute -right-40 top-0 h-[34rem] w-[34rem] rounded-full bg-accent/15 blur-[130px]" />
      <div className="pointer-events-none absolute -left-48 bottom-0 h-96 w-96 rounded-full bg-accent/10 blur-[120px]" />
      <div className="relative overflow-hidden rounded-[2rem] border border-surface-border bg-surface/50 px-6 py-12 shadow-2xl backdrop-blur-xl md:rounded-[3.5rem] md:px-16 md:py-20">
        <div className="absolute right-0 top-0 h-48 w-48 rounded-bl-[6rem] border-b border-l border-accent/20 bg-accent/5" />
        <motion.div initial={{ opacity: 0, y: 22 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }} className="relative max-w-4xl">
          <div className="mb-8 flex items-center gap-3 text-xs font-black uppercase tracking-[0.22em] text-accent"><span className="flex h-9 w-9 items-center justify-center rounded-xl border border-accent/25 bg-accent/10"><Code2 className="h-4 w-4" /></span>Rede Susanoo</div>
          <h1 className="max-w-4xl text-5xl font-black uppercase italic leading-[0.9] tracking-tighter md:text-7xl lg:text-8xl">Seu próximo grande <span className="text-accent">projeto</span> começa aqui.</h1>
          <p className="mt-8 max-w-2xl text-base font-bold leading-relaxed text-foreground/55 md:text-xl">Uma plataforma para profissionais que querem construir produtos digitais relevantes, ganhar visibilidade e trabalhar com mais confiança.</p>
          <div className="mt-10 flex flex-col gap-4 sm:flex-row sm:items-center"><Link href="/register?role=developer" className="group inline-flex items-center justify-center gap-3 rounded-full bg-accent px-8 py-5 text-base font-black text-white shadow-xl shadow-accent/30 transition-all hover:scale-105 active:scale-95">Quero fazer parte <ArrowRight className="h-5 w-5 transition-transform group-hover:translate-x-1.5" /></Link><div className="flex items-center gap-3 text-sm font-bold text-foreground/50"><div className="flex -space-x-2"><span className="h-8 w-8 rounded-full border-2 border-surface bg-accent" /><span className="h-8 w-8 rounded-full border-2 border-surface bg-foreground" /><span className="h-8 w-8 rounded-full border-2 border-surface bg-accent/50" /></div>Uma rede feita para quem entrega excelência.</div></div>
        </motion.div>
      </div>
    </section>
    <section className="border-y border-surface-border bg-foreground py-6 text-background"><div className="mx-auto flex max-w-7xl flex-wrap items-center justify-center gap-x-8 gap-y-3 px-6 text-center text-xs font-black uppercase tracking-[0.2em] md:justify-between md:text-sm"><span>Portfólio em destaque</span><span className="text-accent">•</span><span>Projetos reais</span><span className="text-accent">•</span><span>Conexões qualificadas</span><span className="text-accent">•</span><span>Seu próximo nível</span></div></section>
    <section className="mx-auto max-w-7xl px-4 py-24 md:px-6 md:py-36"><div className="mb-12 flex flex-col justify-between gap-5 md:mb-16 md:flex-row md:items-end"><div className="max-w-2xl"><p className="mb-4 text-xs font-black uppercase tracking-[0.25em] text-accent">Por que Susanoo</p><h2 className="text-4xl font-black uppercase italic leading-none tracking-tighter md:text-6xl">A estrutura certa para você ir além.</h2></div><p className="max-w-sm text-sm font-bold leading-relaxed text-foreground/50">Menos ruído, mais espaço para criar, entregar e transformar cada projeto em uma nova oportunidade.</p></div><div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">{benefits.map(([title, desc, Icon], index) => <motion.article key={title} initial={{ opacity: 0, y: 18 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: index * 0.05 }} className="group rounded-[2rem] border border-surface-border bg-surface p-7 transition-all hover:-translate-y-1 hover:border-accent/40 hover:shadow-xl md:p-8"><div className="mb-8 flex h-12 w-12 items-center justify-center rounded-2xl border border-accent/20 bg-accent/10 text-accent transition-transform group-hover:scale-110"><Icon className="h-6 w-6" /></div><h3 className="text-xl font-black tracking-tight">{title}</h3><p className="mt-3 text-sm font-medium leading-relaxed text-foreground/55">{desc}</p></motion.article>)}</div></section>
    <section className="border-t border-surface-border bg-surface/40 px-4 py-24 md:px-6 md:py-36"><div className="mx-auto max-w-7xl"><div className="mb-14 max-w-2xl"><p className="mb-4 text-xs font-black uppercase tracking-[0.25em] text-accent">Seu caminho na plataforma</p><h2 className="text-4xl font-black uppercase italic leading-none tracking-tighter md:text-6xl">Do perfil ao próximo projeto.</h2></div><div className="grid gap-4 md:grid-cols-2">{steps.map(([num, title, desc]) => <article key={num} className="flex gap-5 rounded-[1.75rem] border border-surface-border bg-background p-6 md:p-8"><span className="text-3xl font-black italic text-accent/35">{num}</span><div><h3 className="text-lg font-black">{title}</h3><p className="mt-2 text-sm font-medium leading-relaxed text-foreground/55">{desc}</p></div></article>)}</div><div className="mt-14 flex flex-col items-center justify-between gap-6 rounded-[2rem] bg-foreground px-8 py-10 text-center text-background md:flex-row md:text-left"><div><div className="mb-2 flex justify-center gap-1 text-accent md:justify-start"><BadgeCheck className="h-5 w-5" /><UserRoundCheck className="h-5 w-5" /></div><h2 className="text-2xl font-black uppercase italic">Seu talento merece ser visto.</h2></div><Link href="/register?role=developer" className="group inline-flex items-center gap-2 rounded-full bg-accent px-7 py-4 text-sm font-black text-white transition-transform hover:scale-105">Criar meu perfil <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" /></Link></div></div></section>
  </main>;
}
