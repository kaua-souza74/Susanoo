"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Sparkles, Send, CheckCircle2, ShoppingBag, Lightbulb } from "lucide-react";
import { supabase } from "@/lib/supabase";

interface SurveyModalProps {
  viewCount: number;
  hasPurchased: boolean;
  onClose?: () => void;
}

const SEGMENTS = [
  "Agro & Produtores",
  "Barbearia & Estética",
  "Confeitaria & Docerias",
  "Restaurantes & Delivery",
  "Odonto & Saúde",
  "Moda & Vestuário",
  "Imobiliária & Corretores",
  "Prestação de Serviços",
  "Outro Segmento"
];

const SITE_TYPES = [
  "Landing Page de Alta Conversão",
  "Loja Virtual / E-commerce",
  "Catálogo Online com WhatsApp",
  "Sistema Web / PWA Personalizado",
  "Site Institucional & Portfólio"
];

const TECH_FEATURES = [
  "Pagamento Online (Pix / Cartão)",
  "Agendamento Automático",
  "Botão Direto para WhatsApp",
  "Painel Administrativo Fácil",
  "SEO Otimizado no Google",
  "Totalmente Responsivo / Celular"
];

export function ClientInterestSurveyModal({ viewCount, hasPurchased, onClose }: SurveyModalProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [segment, setSegment] = useState("");
  const [siteType, setSiteType] = useState("");
  const [selectedTechs, setSelectedTechs] = useState<string[]>([]);
  const [customNotes, setCustomNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => {
    // Checa se já respondeu recentemente no localStorage
    const alreadyAnswered = localStorage.getItem("susanoo_survey_answered");
    if (alreadyAnswered === "true" || hasPurchased) return;

    // Dispara após visualizar 2 ou mais sites sem comprar
    if (viewCount >= 2 && !isOpen && !submitted) {
      const timer = setTimeout(() => {
        setIsOpen(true);
      }, 1500);
      return () => clearTimeout(timer);
    }
  }, [viewCount, hasPurchased, isOpen, submitted]);

  const toggleTech = (tech: string) => {
    setSelectedTechs(prev => 
      prev.includes(tech) ? prev.filter(t => t !== tech) : [...prev, tech]
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!segment || !siteType) return;

    setSubmitting(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const user = session?.user;

      const payload = {
        user_id: user?.id || null,
        user_name: user?.user_metadata?.full_name || user?.email?.split("@")[0] || "Visitante",
        user_email: user?.email || null,
        segment,
        site_type: siteType,
        technologies: selectedTechs,
        custom_notes: customNotes.trim() || null,
        created_at: new Date().toISOString()
      };

      // Tenta gravar no banco
      await supabase.from("client_interests").insert([payload]);

      // Salva localmente para não incomodar novamente
      localStorage.setItem("susanoo_survey_answered", "true");
      setSubmitted(true);

      setTimeout(() => {
        setIsOpen(false);
        if (onClose) onClose();
      }, 2500);
    } catch (err) {
      console.error("Erro ao enviar interesse:", err);
      // Fallback local
      localStorage.setItem("susanoo_survey_answered", "true");
      setSubmitted(true);
      setTimeout(() => {
        setIsOpen(false);
        if (onClose) onClose();
      }, 2500);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDismiss = () => {
    localStorage.setItem("susanoo_survey_answered", "true");
    setIsOpen(false);
    if (onClose) onClose();
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[9999] bg-background/80 backdrop-blur-sm flex items-center justify-center p-4 sm:p-6 overflow-y-auto">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          className="bg-surface border border-surface-border w-full max-w-xl rounded-3xl p-6 sm:p-8 shadow-2xl relative overflow-hidden my-auto"
        >
          {/* Botão Fechar */}
          <button
            onClick={handleDismiss}
            className="absolute top-5 right-5 p-2 rounded-full hover:bg-surface-border text-foreground/40 hover:text-foreground transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>

          {submitted ? (
            <div className="py-12 text-center flex flex-col items-center justify-center gap-3">
              <div className="w-16 h-16 rounded-2xl bg-emerald-500/10 text-emerald-500 flex items-center justify-center mb-2">
                <CheckCircle2 className="w-8 h-8" />
              </div>
              <h3 className="text-xl font-bold text-foreground">Obrigado pelo seu feedback!</h3>
              <p className="text-xs text-foreground/60 max-w-sm leading-relaxed">
                Nossos desenvolvedores já foram notificados. Em breve você verá novas opções pensadas exatamente para o seu segmento!
              </p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <span className="text-[10px] font-black uppercase tracking-widest text-accent flex items-center gap-1 mb-1">
                  <Lightbulb className="w-3.5 h-3.5" /> Encontre o Site Ideal
                </span>
                <h3 className="text-xl font-black text-foreground">
                  Não encontrou o que procurava?
                </h3>
                <p className="text-xs text-foreground/50 mt-1 leading-relaxed">
                  Conte-nos qual o seu ramo e o que você precisa. Vamos conectar você aos melhores desenvolvedores da Susanoo!
                </p>
              </div>

              {/* 1. Escolha o Segmento */}
              <div>
                <label className="text-xs font-bold text-foreground block mb-2">
                  Qual é o seu segmento / nicho? <span className="text-accent">*</span>
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {SEGMENTS.map(s => (
                    <button
                      type="button"
                      key={s}
                      onClick={() => setSegment(s)}
                      className={`p-2.5 rounded-xl text-left text-xs font-medium border transition-all cursor-pointer ${
                        segment === s
                          ? "bg-accent text-white border-accent shadow-sm"
                          : "bg-background border-surface-border text-foreground/70 hover:border-accent/40"
                      }`}
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </div>

              {/* 2. Tipo de Site */}
              <div>
                <label className="text-xs font-bold text-foreground block mb-2">
                  Que tipo de site você prefere? <span className="text-accent">*</span>
                </label>
                <div className="space-y-1.5">
                  {SITE_TYPES.map(st => (
                    <button
                      type="button"
                      key={st}
                      onClick={() => setSiteType(st)}
                      className={`w-full p-2.5 rounded-xl text-left text-xs font-medium border transition-all cursor-pointer flex items-center justify-between ${
                        siteType === st
                          ? "bg-accent/10 text-accent border-accent font-bold"
                          : "bg-background border-surface-border text-foreground/70 hover:border-accent/40"
                      }`}
                    >
                      <span>{st}</span>
                      {siteType === st && <CheckCircle2 className="w-4 h-4 text-accent shrink-0" />}
                    </button>
                  ))}
                </div>
              </div>

              {/* 3. Recursos & Tecnologias */}
              <div>
                <label className="text-xs font-bold text-foreground block mb-2">
                  Recursos e tecnologias que você gostaria:
                </label>
                <div className="flex flex-wrap gap-1.5">
                  {TECH_FEATURES.map(tf => {
                    const isSelected = selectedTechs.includes(tf);
                    return (
                      <button
                        type="button"
                        key={tf}
                        onClick={() => toggleTech(tf)}
                        className={`px-3 py-1.5 rounded-xl text-xs transition-all cursor-pointer border ${
                          isSelected
                            ? "bg-foreground text-background font-bold border-foreground"
                            : "bg-background text-foreground/60 border-surface-border hover:text-foreground"
                        }`}
                      >
                        {isSelected ? "✓ " : "+ "} {tf}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* 4. Observações Opcionais */}
              <div>
                <label className="text-xs font-bold text-foreground block mb-1">
                  Algum detalhe ou ideia específica? (opcional)
                </label>
                <textarea
                  value={customNotes}
                  onChange={(e) => setCustomNotes(e.target.value)}
                  placeholder="Ex: Quero um site para minha barbearia com integração de agendamento e fotos dos cortes..."
                  rows={2}
                  className="w-full p-3 rounded-xl bg-background border border-surface-border text-xs text-foreground placeholder:text-foreground/30 focus:outline-none focus:border-accent transition-colors resize-none"
                />
              </div>

              {/* Botões de Ação */}
              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={handleDismiss}
                  className="px-4 py-2.5 rounded-xl text-xs font-semibold text-foreground/50 hover:text-foreground transition-colors cursor-pointer"
                >
                  Agora não
                </button>
                <button
                  type="submit"
                  disabled={!segment || !siteType || submitting}
                  className="px-6 py-2.5 bg-accent hover:bg-accent/90 disabled:opacity-50 text-white rounded-xl text-xs font-bold transition-all shadow-md flex items-center gap-2 cursor-pointer"
                >
                  {submitting ? "Enviando..." : (
                    <>
                      <Send className="w-3.5 h-3.5" /> Enviar Preferências
                    </>
                  )}
                </button>
              </div>
            </form>
          )}
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
