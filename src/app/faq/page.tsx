"use client";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { HelpCircle, ChevronDown, ChevronUp, Search, Sparkles, MessageSquare, ShieldCheck, CreditCard, ArrowLeft } from "lucide-react";
import { useRouter } from "next/navigation";

const FAQ_ITEMS = [
  {
    category: "Geral & Pagamentos",
    icon: CreditCard,
    questions: [
      {
        q: "Como funciona o cronograma do meu projeto?",
        a: "O cronograma detalhado de entrega é liberado automaticamente na sua conta assim que o pagamento do projeto ou template for confirmado no checkout. Você pode acompanhar todas as etapas de briefing, design de interface (UI), desenvolvimento e deploy em tempo real pelo seu painel do cliente."
      },
      {
        q: "Quais são os métodos de pagamento aceitos?",
        a: "Aceitamos pagamentos via PIX (com liberação e ativação imediata) e Cartão de Crédito (com processamento seguro e opção de parcelamento). Toda a transação é processada em um ambiente criptografado e seguro com garantia Susanoo."
      },
      {
        q: "O que são templates vs. sites prontos na Susanoo?",
        a: "Os templates são bases estruturadas premium prontas para personalização rápida, ideais para início imediato. Já os sites prontos ou projetos sob demanda são desenvolvimentos sob medida realizados por desenvolvedores e designers profissionais selecionados na nossa plataforma."
      }
    ]
  },
  {
    category: "Desenvolvimento & Acompanhamento",
    icon: Sparkles,
    questions: [
      {
        q: "Como faço para conversar com o desenvolvedor responsável?",
        a: "Pelo seu painel do cliente, acesse a aba 'Chat' ou vá na seção de 'Profissionais' para iniciar uma conversa direta por mensagem com o desenvolvedor do seu projeto. O suporte e acompanhamento são integrados e transparentes."
      },
      {
        q: "O que é o Kanban e como posso interagir?",
        a: "O Kanban é um quadro visual onde você pode ver as tarefas do projeto divididas em 'A Fazer', 'Em Andamento', 'Revisão' e 'Concluído'. Isso garante que você saiba exatamente o que está sendo desenvolvido a cada dia."
      },
      {
        q: "Como funciona a publicação (deploy) do meu site?",
        a: "Quando o desenvolvimento é concluído, o desenvolvedor publica o site e ele passa por uma homologação. Você receberá uma URL de demonstração e, após aprovar, o site é publicado definitivamente no ambiente de produção com alta performance."
      }
    ]
  },
  {
    category: "Tecnologia & Suporte",
    icon: ShieldCheck,
    questions: [
      {
        q: "Os sites possuem otimização para SEO e Google?",
        a: "Sim! Todos os projetos desenvolvidos na Susanoo utilizam Next.js e TailwindCSS de última geração, garantindo nota máxima no Google Lighthouse, carregamento ultrarápido e melhor ranqueamento orgânico."
      },
      {
        q: "Tenho direito a suporte pós-lançamento?",
        a: "Sim, oferecemos suporte técnico e de deploys por 7 dias após a entrega do projeto para corrigir qualquer dúvida ou ajuste inicial sem custos adicionais."
      },
      {
        q: "Como a Susanoo garante a entrega do meu projeto?",
        a: "Nossa plataforma retém o valor pago de forma segura. O desenvolvedor só recebe o pagamento final quando você homologar o site e confirmar que todas as etapas foram concluídas com sucesso."
      }
    ]
  }
];

export default function FAQPage() {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState("");
  const [expandedIndex, setExpandedIndex] = useState<string | null>(null);

  const toggleExpand = (id: string) => {
    setExpandedIndex(expandedIndex === id ? null : id);
  };

  const filteredFaq = FAQ_ITEMS.map(category => {
    const filteredQuestions = category.questions.filter(
      item =>
        item.q.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.a.toLowerCase().includes(searchQuery.toLowerCase())
    );
    return { ...category, questions: filteredQuestions };
  }).filter(category => category.questions.length > 0);

  return (
    <div className="min-h-screen bg-background text-foreground transition-colors selection:bg-accent selection:text-white pt-28 pb-20 px-4 md:px-6">
      <div className="max-w-4xl mx-auto">
        {/* Voltar */}
        <button
          onClick={() => router.push("/")}
          className="flex items-center gap-2 text-sm font-bold opacity-60 hover:opacity-100 transition-opacity uppercase tracking-wider mb-8 cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" /> Voltar ao Início
        </button>

        {/* Título Principal */}
        <div className="text-center md:text-left mb-12">
          <span className="text-xs font-black uppercase tracking-[0.24em] text-accent mb-3 block">FAQ & Dúvidas</span>
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-black uppercase italic tracking-tighter mb-4">
            Como podemos ajudar?
          </h1>
          <p className="text-base md:text-lg text-foreground/50 font-bold max-w-2xl leading-relaxed italic border-l-4 border-accent pl-4">
            Tire suas dúvidas sobre o funcionamento da Susanoo, liberação de cronogramas, pagamentos, dezenas de ferramentas e suporte.
          </p>
        </div>

        {/* Busca */}
        <div className="relative mb-12">
          <Search className="w-5 h-5 absolute left-5 top-1/2 -translate-y-1/2 text-foreground/25" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Digite sua dúvida ou palavra-chave (Ex: cronograma, pagamento)..."
            className="w-full bg-surface border border-surface-border rounded-2xl py-4.5 pl-14 pr-6 text-[15px] font-medium text-foreground focus:border-accent/50 focus:outline-none transition-all placeholder:text-foreground/25 shadow-sm"
          />
        </div>

        {/* Lista de FAQ */}
        <div className="space-y-10">
          {filteredFaq.length > 0 ? (
            filteredFaq.map((cat, catIdx) => {
              const CategoryIcon = cat.icon;
              return (
                <div key={catIdx} className="space-y-4">
                  <div className="flex items-center gap-2 pb-2 border-b border-surface-border">
                    <CategoryIcon className="w-5 h-5 text-accent" />
                    <h2 className="text-sm font-black uppercase tracking-wider text-foreground/75">
                      {cat.category}
                    </h2>
                  </div>

                  <div className="flex flex-col gap-3">
                    {cat.questions.map((item, qIdx) => {
                      const id = `${catIdx}-${qIdx}`;
                      const isExpanded = expandedIndex === id;
                      return (
                        <div
                          key={qIdx}
                          className={`bg-surface border border-surface-border rounded-2xl overflow-hidden transition-all duration-350 ${
                            isExpanded ? "shadow-md hover:border-accent/30" : "hover:border-foreground/15"
                          }`}
                        >
                          <button
                            onClick={() => toggleExpand(id)}
                            className="w-full text-left p-5 md:p-6 flex items-center justify-between gap-4 font-black text-sm md:text-base text-foreground cursor-pointer"
                          >
                            <span className={isExpanded ? "text-accent" : ""}>{item.q}</span>
                            {isExpanded ? (
                              <ChevronUp className="w-5 h-5 text-accent shrink-0" />
                            ) : (
                              <ChevronDown className="w-5 h-5 text-foreground/40 shrink-0" />
                            )}
                          </button>

                          <AnimatePresence initial={false}>
                            {isExpanded && (
                              <motion.div
                                initial={{ height: 0, opacity: 0 }}
                                animate={{ height: "auto", opacity: 1 }}
                                exit={{ height: 0, opacity: 0 }}
                                transition={{ duration: 0.25, ease: "easeInOut" }}
                              >
                                <div className="px-5 pb-5 md:px-6 md:pb-6 text-sm text-foreground/60 leading-relaxed border-t border-surface-border/50 pt-4 font-medium">
                                  {item.a}
                                </div>
                              </motion.div>
                            )}
                          </AnimatePresence>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })
          ) : (
            <div className="py-16 text-center border border-dashed border-surface-border rounded-2xl">
              <HelpCircle className="w-12 h-12 text-foreground/20 mx-auto mb-4" />
              <h3 className="text-lg font-bold text-foreground/45">Nenhum resultado encontrado</h3>
              <p className="text-sm text-foreground/30 mt-1">Tente buscar por termos mais simples.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
