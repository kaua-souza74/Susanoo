"use client";
import React from "react";
import { useRouter } from "next/navigation";
import { ArrowRight, CheckCircle2, UserCheck, Briefcase, Award, ShieldCheck, Compass, Sparkles, Star } from "lucide-react";
import { motion } from "framer-motion";

export default function SouDesenvolvedorPage() {
  const router = useRouter();

  const beneficios = [
    { title: "Receba propostas de clientes", desc: "Acesso direto a empresas buscando tirar projetos do papel.", icon: <Briefcase className="w-6 h-6 text-accent" /> },
    { title: "Monte seu portfólio", desc: "Exiba seus melhores trabalhos em uma galeria organizada.", icon: <Compass className="w-6 h-6 text-accent" /> },
    { title: "Defina suas especialidades", desc: "Destaque suas habilidades e tecnologias prediletas.", icon: <Sparkles className="w-6 h-6 text-accent" /> },
    { title: "Ganhe avaliações", desc: "Construa reputação digital com feedback real de contratantes.", icon: <Star className="w-6 h-6 text-accent" /> },
    { title: "Trabalhe com segurança", desc: "Garantia de recebimento e entregas monitoradas pela Susanoo.", icon: <ShieldCheck className="w-6 h-6 text-accent" /> },
    { title: "Expanda sua carreira", desc: "Aumente seu faturamento e conquiste novos parceiros comerciais.", icon: <UserCheck className="w-6 h-6 text-accent" /> },
  ];

  const passos = [
    { num: "01", title: "Crie sua conta", desc: "Cadastre-se como desenvolvedor em poucos cliques." },
    { num: "02", title: "Complete seu perfil", desc: "Preencha suas informações profissionais e portfólio." },
    { num: "03", title: "Aguarde a aprovação", desc: "Nossa equipe valida sua conta para manter a alta qualidade." },
    { num: "04", title: "Receba projetos", desc: "Seja procurado por empresas ou aplique para propostas." },
    { num: "05", title: "Desenvolva e seja avaliado", desc: "Entregue o projeto com excelência e receba sua avaliação de 5 estrelas." },
  ];

  return (
    <div className="min-h-screen bg-background text-foreground transition-colors duration-300 pb-20 pt-32">
      {/* Hero Section */}
      <section className="relative px-6 max-w-5xl mx-auto text-center mb-24">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="flex flex-col items-center"
        >
          <span className="text-xs font-black uppercase tracking-[0.3em] text-accent mb-4 bg-accent/10 px-3 py-1.5 rounded-full border border-accent/20">
            Para Desenvolvedores & Designers
          </span>
          <h1 className="text-4xl md:text-7xl font-black mb-6 tracking-tighter uppercase italic leading-none max-w-4xl text-foreground">
            Transforme seu talento em <span className="text-accent">novos projetos</span>.
          </h1>
          <p className="text-base md:text-xl font-bold text-foreground/50 max-w-2xl leading-relaxed mb-10 italic">
            Encontre clientes, construa sua reputação e desenvolva projetos reais através da plataforma Susanoo.
          </p>

          <button
            onClick={() => router.push("/register?role=developer")}
            className="group bg-accent text-white font-black text-lg px-10 py-5 rounded-[2.5rem] hover:scale-105 active:scale-95 transition-all shadow-xl shadow-accent/30 flex items-center gap-3 relative z-10"
          >
            Quero fazer parte
            <ArrowRight className="w-5 h-5 group-hover:translate-x-1.5 transition-transform" />
          </button>
        </motion.div>
      </section>

      {/* Benefícios */}
      <section className="px-6 max-w-6xl mx-auto mb-28 border-t border-surface-border pt-20">
        <div className="text-center mb-16">
          <h2 className="text-2xl md:text-4xl font-black uppercase italic tracking-tight text-foreground">
            Benefícios de atuar na plataforma
          </h2>
          <p className="text-sm md:text-base text-foreground/40 mt-2 font-bold italic">
            Tudo que você precisa para alavancar sua carreira freelancer.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {beneficios.map((ben, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 25 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.05 }}
              className="bg-surface border border-surface-border p-8 rounded-3xl shadow-sm hover:border-accent/30 transition-all group"
            >
              <div className="w-12 h-12 rounded-2xl bg-accent/10 border border-accent/20 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                {ben.icon}
              </div>
              <h3 className="text-lg font-black text-foreground mb-2">{ben.title}</h3>
              <p className="text-sm text-foreground/60 leading-relaxed font-medium">{ben.desc}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Como Funciona */}
      <section className="px-6 max-w-5xl mx-auto mb-20 border-t border-surface-border pt-20">
        <div className="text-center mb-16">
          <h2 className="text-2xl md:text-4xl font-black uppercase italic tracking-tight text-foreground">
            Como funciona o processo
          </h2>
          <p className="text-sm md:text-base text-foreground/40 mt-2 font-bold italic">
            Do cadastro até a entrega do primeiro projeto qualificado.
          </p>
        </div>

        <div className="flex flex-col gap-4">
          {passos.map((passo, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.08 }}
              className="flex items-center gap-6 bg-surface border border-surface-border p-6 rounded-2xl"
            >
              <span className="text-3xl font-black text-accent/20 select-none shrink-0">{passo.num}</span>
              <div>
                <h3 className="text-base font-black text-foreground">{passo.title}</h3>
                <p className="text-sm text-foreground/50 leading-relaxed font-medium">{passo.desc}</p>
              </div>
            </motion.div>
          ))}
        </div>

        <div className="mt-16 text-center">
          <button
            onClick={() => router.push("/register?role=developer")}
            className="group bg-foreground text-background font-black text-base px-10 py-5 rounded-[2.5rem] hover:scale-105 active:scale-95 transition-all shadow-xl flex items-center gap-2 mx-auto"
          >
            Começar Agora
            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </button>
        </div>
      </section>
    </div>
  );
}
