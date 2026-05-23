"use client";
import { useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  X, Upload, Link2, Tag, DollarSign,
  Sparkles, Image as ImageIcon, ChevronDown,
  CheckCircle2, Loader2, ArrowRight, FileArchive,
} from "lucide-react";
import { supabase } from "@/lib/supabase";

interface PublishMarketplaceModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const CATEGORIES = [
  "E-commerce / Loja",
  "Restaurante / Food",
  "Landing Page",
  "Portfólio",
  "SaaS / Dashboard",
  "Blog / Notícias",
  "Imóveis",
  "Saúde / Clínica",
  "Educação",
  "Outro",
];

export default function PublishMarketplaceModal({
  isOpen,
  onClose,
}: PublishMarketplaceModalProps) {
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("");
  const [demoUrl, setDemoUrl] = useState("");
  const [deliveryType, setDeliveryType] = useState<"github" | "zip">("github");
  const [githubUrl, setGithubUrl] = useState("");
  const [zipFile, setZipFile] = useState<File | null>(null);
  const [price, setPrice] = useState("");
  const [tagInput, setTagInput] = useState("");
  const [tags, setTags] = useState<string[]>([]);
  const [coverImages, setCoverImages] = useState<File[]>([]);
  const [coverPreviews, setCoverPreviews] = useState<string[]>([]);

  const zipRef = useRef<HTMLInputElement>(null);
  const imgRef = useRef<HTMLInputElement>(null);

  const handleAddTag = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && tagInput.trim() && tags.length < 8) {
      e.preventDefault();
      if (!tags.includes(tagInput.trim())) setTags([...tags, tagInput.trim()]);
      setTagInput("");
    }
  };

  const handleImages = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []).slice(0, 4 - coverImages.length);
    const newPreviews = files.map((f) => URL.createObjectURL(f));
    setCoverImages((prev) => [...prev, ...files]);
    setCoverPreviews((prev) => [...prev, ...newPreviews]);
  };

  const removeImage = (i: number) => {
    setCoverImages((prev) => prev.filter((_, idx) => idx !== i));
    setCoverPreviews((prev) => prev.filter((_, idx) => idx !== i));
  };

  const resetForm = () => {
    setStep(1); setName(""); setDescription(""); setCategory("");
    setDemoUrl(""); setDeliveryType("github"); setGithubUrl("");
    setZipFile(null); setPrice(""); setTags([]); setTagInput("");
    setCoverImages([]); setCoverPreviews([]); setSuccess(false);
  };

  const handleClose = () => { resetForm(); onClose(); };

  const handleSubmit = async () => {
    setLoading(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error("Sessão expirada");

      const uploadedUrls: string[] = [];
      for (const file of coverImages) {
        const ext = file.name.split(".").pop();
        const path = `marketplace_covers/${session.user.id}/${Date.now()}_${Math.random().toString(36).slice(2)}.${ext}`;
        const { error } = await supabase.storage.from("project_files").upload(path, file);
        if (!error) {
          const { data: pub } = supabase.storage.from("project_files").getPublicUrl(path);
          uploadedUrls.push(pub.publicUrl);
        }
      }

      let zipUrl: string | null = null;
      if (deliveryType === "zip" && zipFile) {
        const path = `marketplace_zips/${session.user.id}/${Date.now()}_${zipFile.name}`;
        const { error } = await supabase.storage.from("project_files").upload(path, zipFile);
        if (!error) {
          const { data: pub } = supabase.storage.from("project_files").getPublicUrl(path);
          zipUrl = pub.publicUrl;
        }
      }

      const { error: dbError } = await supabase.from("marketplace_templates").insert({
        dev_id: session.user.id,
        name,
        description,
        category,
        demo_url: demoUrl,
        delivery_type: deliveryType,
        github_url: deliveryType === "github" ? githubUrl : null,
        zip_url: zipUrl,
        price: parseFloat(price.replace(",", ".")),
        tags,
        cover_images: uploadedUrls,
        status: "pending",
      });

      if (dbError) throw dbError;
      setSuccess(true);
    } catch (err) {
      console.error(err);
      alert("Erro ao publicar. Verifique os dados e tente novamente.");
    } finally {
      setLoading(false);
    }
  };

  const canGoStep2 = name.trim() && description.trim() && category && demoUrl.trim();
  const canGoStep3 = (deliveryType === "github" ? githubUrl.trim() : zipFile !== null) && price.trim();
  const canSubmit = canGoStep3 && coverImages.length > 0;

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
          onClick={(e) => e.target === e.currentTarget && handleClose()}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            className="w-full max-w-2xl bg-surface border border-surface-border rounded-3xl shadow-2xl overflow-hidden"
          >
            {/* ── Header ── */}
            {!success && (
              <div className="flex items-center justify-between px-8 py-6 border-b border-surface-border">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-accent/10 flex items-center justify-center">
                    <Sparkles className="w-5 h-5 text-accent" />
                  </div>
                  <div>
                    <h2 className="text-lg font-black text-foreground">Publicar no Marketplace</h2>
                    <p className="text-xs text-foreground/40 font-medium">Etapa {step} de 3</p>
                  </div>
                </div>
                <button onClick={handleClose} className="w-8 h-8 rounded-xl bg-background border border-surface-border flex items-center justify-center hover:bg-surface-border/50 transition-colors cursor-pointer">
                  <X className="w-4 h-4 text-foreground/60" />
                </button>
              </div>
            )}

            {/* ── Progress Bar ── */}
            {!success && (
              <div className="h-1 bg-background">
                <motion.div
                  className="h-full bg-accent"
                  animate={{ width: `${(step / 3) * 100}%` }}
                  transition={{ duration: 0.4 }}
                />
              </div>
            )}

            {/* ── Body ── */}
            <div className="p-8 overflow-y-auto max-h-[70vh] custom-scrollbar">
              <AnimatePresence mode="wait">

                {/* SUCCESS */}
                {success && (
                  <motion.div
                    key="success"
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="flex flex-col items-center justify-center py-12 text-center"
                  >
                    <div className="w-20 h-20 rounded-full bg-emerald-500/10 flex items-center justify-center mb-6">
                      <CheckCircle2 className="w-10 h-10 text-emerald-500" />
                    </div>
                    <h3 className="text-2xl font-black text-foreground mb-2">Template Enviado! 🎉</h3>
                    <p className="text-foreground/50 text-sm max-w-sm mb-8">
                      Seu template está em análise e será publicado na categoria{" "}
                      <strong className="text-foreground">Comunidade (Geral)</strong> em até 24h.
                    </p>
                    <button
                      onClick={handleClose}
                      className="px-8 py-3 bg-accent text-white font-bold rounded-xl hover:opacity-90 transition-opacity cursor-pointer"
                    >
                      Perfeito, fechar!
                    </button>
                  </motion.div>
                )}

                {/* STEP 1 — Identidade do Template */}
                {!success && step === 1 && (
                  <motion.div key="step1" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="flex flex-col gap-6">
                    <div>
                      <h3 className="text-sm font-black text-foreground mb-1">Identidade do Template</h3>
                      <p className="text-xs text-foreground/40">Informações que aparecem na vitrine do Marketplace.</p>
                    </div>

                    <div className="flex flex-col gap-2">
                      <label className="text-xs font-bold text-foreground/60 uppercase tracking-wider">Nome do Template *</label>
                      <input
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder="Ex: LojaPro — E-commerce Premium"
                        className="w-full bg-background border border-surface-border rounded-xl px-4 py-3 text-sm text-foreground placeholder:text-foreground/30 focus:outline-none focus:border-accent transition-colors"
                      />
                    </div>

                    <div className="flex flex-col gap-2">
                      <label className="text-xs font-bold text-foreground/60 uppercase tracking-wider">Descrição *</label>
                      <textarea
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        placeholder="Descreva as funcionalidades e diferenciais do seu template..."
                        rows={3}
                        className="w-full bg-background border border-surface-border rounded-xl px-4 py-3 text-sm text-foreground placeholder:text-foreground/30 focus:outline-none focus:border-accent transition-colors resize-none"
                      />
                    </div>

                    <div className="flex flex-col gap-2">
                      <label className="text-xs font-bold text-foreground/60 uppercase tracking-wider">Categoria *</label>
                      <div className="relative">
                        <select
                          value={category}
                          onChange={(e) => setCategory(e.target.value)}
                          className="w-full bg-background border border-surface-border rounded-xl px-4 py-3 text-sm text-foreground focus:outline-none focus:border-accent transition-colors appearance-none cursor-pointer"
                        >
                          <option value="">Selecione uma categoria...</option>
                          {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
                        </select>
                        <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-foreground/40 pointer-events-none" />
                      </div>
                    </div>

                    <div className="flex flex-col gap-2">
                      <label className="text-xs font-bold text-foreground/60 uppercase tracking-wider">Link de Demonstração (Review URL) *</label>
                      <div className="relative">
                        <Link2 className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-foreground/30" />
                        <input
                          value={demoUrl}
                          onChange={(e) => setDemoUrl(e.target.value)}
                          placeholder="https://seu-template.vercel.app"
                          className="w-full bg-background border border-surface-border rounded-xl pl-11 pr-4 py-3 text-sm text-foreground placeholder:text-foreground/30 focus:outline-none focus:border-accent transition-colors"
                        />
                      </div>
                      <p className="text-[11px] text-foreground/30">Cole aqui o link da sua demo no Vercel. As lojas vão testar direto nele.</p>
                    </div>

                    <div className="flex flex-col gap-2">
                      <label className="text-xs font-bold text-foreground/60 uppercase tracking-wider">Tecnologias / Tags</label>
                      <div className="relative">
                        <Tag className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-foreground/30" />
                        <input
                          value={tagInput}
                          onChange={(e) => setTagInput(e.target.value)}
                          onKeyDown={handleAddTag}
                          placeholder="Digite e pressione Enter (ex: Next.js, Tailwind...)"
                          className="w-full bg-background border border-surface-border rounded-xl pl-11 pr-4 py-3 text-sm text-foreground placeholder:text-foreground/30 focus:outline-none focus:border-accent transition-colors"
                        />
                      </div>
                      {tags.length > 0 && (
                        <div className="flex flex-wrap gap-2 mt-1">
                          {tags.map((t) => (
                            <span key={t} className="flex items-center gap-1 bg-accent/10 text-accent border border-accent/20 px-3 py-1 rounded-full text-xs font-bold">
                              {t}
                              <button onClick={() => setTags(tags.filter(x => x !== t))} className="ml-1 hover:text-red-400 transition-colors cursor-pointer">×</button>
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  </motion.div>
                )}

                {/* STEP 2 — Entrega e Preço */}
                {!success && step === 2 && (
                  <motion.div key="step2" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="flex flex-col gap-6">
                    <div>
                      <h3 className="text-sm font-black text-foreground mb-1">Forma de Entrega e Preço</h3>
                      <p className="text-xs text-foreground/40">Como o comprador vai receber o projeto após a aquisição.</p>
                    </div>

                    <div className="flex flex-col gap-3">
                      <label className="text-xs font-bold text-foreground/60 uppercase tracking-wider">Forma de Entrega *</label>
                      <div className="grid grid-cols-2 gap-3">
                        <button
                          onClick={() => setDeliveryType("github")}
                          className={`flex flex-col items-center gap-3 p-5 rounded-2xl border-2 transition-all cursor-pointer ${deliveryType === "github" ? "border-accent bg-accent/5 text-accent" : "border-surface-border text-foreground/50 hover:border-foreground/20"}`}
                        >
                          <Link2 className="w-7 h-7" />
                          <div className="text-center">
                            <p className="text-sm font-black">Repositório GitHub</p>
                            <p className="text-[11px] opacity-60 mt-0.5">Link do repo privado ou público</p>
                          </div>
                        </button>
                        <button
                          onClick={() => setDeliveryType("zip")}
                          className={`flex flex-col items-center gap-3 p-5 rounded-2xl border-2 transition-all cursor-pointer ${deliveryType === "zip" ? "border-accent bg-accent/5 text-accent" : "border-surface-border text-foreground/50 hover:border-foreground/20"}`}
                        >
                          <FileArchive className="w-7 h-7" />
                          <div className="text-center">
                            <p className="text-sm font-black">Código-Fonte .ZIP</p>
                            <p className="text-[11px] opacity-60 mt-0.5">Upload do arquivo compactado</p>
                          </div>
                        </button>
                      </div>
                    </div>

                    <AnimatePresence mode="wait">
                      {deliveryType === "github" ? (
                        <motion.div key="github" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="flex flex-col gap-2">
                          <label className="text-xs font-bold text-foreground/60 uppercase tracking-wider">URL do Repositório *</label>
                          <div className="relative">
                            <Link2 className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-foreground/30" />
                            <input
                              value={githubUrl}
                              onChange={(e) => setGithubUrl(e.target.value)}
                              placeholder="https://github.com/seu-usuario/seu-repo"
                              className="w-full bg-background border border-surface-border rounded-xl pl-11 pr-4 py-3 text-sm text-foreground placeholder:text-foreground/30 focus:outline-none focus:border-accent transition-colors"
                            />
                          </div>
                        </motion.div>
                      ) : (
                        <motion.div key="zip" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="flex flex-col gap-2">
                          <label className="text-xs font-bold text-foreground/60 uppercase tracking-wider">Arquivo .ZIP do Código *</label>
                          <input ref={zipRef} type="file" accept=".zip" className="hidden" onChange={(e) => setZipFile(e.target.files?.[0] || null)} />
                          <button
                            onClick={() => zipRef.current?.click()}
                            className={`w-full border-2 border-dashed rounded-2xl p-6 flex flex-col items-center gap-3 transition-all cursor-pointer ${zipFile ? "border-accent/40 bg-accent/5" : "border-surface-border hover:border-foreground/20"}`}
                          >
                            {zipFile ? (
                              <>
                                <FileArchive className="w-8 h-8 text-accent" />
                                <p className="text-sm font-bold text-accent">{zipFile.name}</p>
                                <p className="text-xs text-foreground/40">{(zipFile.size / 1024 / 1024).toFixed(2)} MB</p>
                              </>
                            ) : (
                              <>
                                <Upload className="w-8 h-8 text-foreground/30" />
                                <p className="text-sm font-bold text-foreground/50">Clique para fazer upload</p>
                                <p className="text-xs text-foreground/30">Apenas arquivos .ZIP</p>
                              </>
                            )}
                          </button>
                        </motion.div>
                      )}
                    </AnimatePresence>

                    <div className="flex flex-col gap-2">
                      <label className="text-xs font-bold text-foreground/60 uppercase tracking-wider">Preço de Venda (R$) *</label>
                      <div className="relative">
                        <DollarSign className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-foreground/30" />
                        <input
                          value={price}
                          onChange={(e) => setPrice(e.target.value.replace(/[^0-9,]/g, ""))}
                          placeholder="499,00"
                          className="w-full bg-background border border-surface-border rounded-xl pl-11 pr-4 py-3 text-sm text-foreground placeholder:text-foreground/30 focus:outline-none focus:border-accent transition-colors"
                        />
                      </div>
                      <p className="text-[11px] text-foreground/30">A Susanoo retém a taxa da plataforma e repassa o restante para você.</p>
                    </div>
                  </motion.div>
                )}

                {/* STEP 3 — Imagens de Capa */}
                {!success && step === 3 && (
                  <motion.div key="step3" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="flex flex-col gap-6">
                    <div>
                      <h3 className="text-sm font-black text-foreground mb-1">Imagens do Template</h3>
                      <p className="text-xs text-foreground/40">Adicione até 4 screenshots ou mockups do seu template. A primeira será a capa principal.</p>
                    </div>

                    <input ref={imgRef} type="file" accept="image/*" multiple className="hidden" onChange={handleImages} />

                    <div className="grid grid-cols-2 gap-4">
                      {coverPreviews.map((src, i) => (
                        <div key={i} className="relative aspect-video rounded-2xl overflow-hidden border border-surface-border group">
                          <img src={src} alt="" className="w-full h-full object-cover" />
                          <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                            <button onClick={() => removeImage(i)} className="w-8 h-8 bg-red-500 rounded-full flex items-center justify-center cursor-pointer">
                              <X className="w-4 h-4 text-white" />
                            </button>
                          </div>
                          {i === 0 && (
                            <div className="absolute top-2 left-2 bg-accent text-white text-[10px] font-black px-2 py-0.5 rounded-lg">CAPA</div>
                          )}
                        </div>
                      ))}

                      {coverImages.length < 4 && (
                        <button
                          onClick={() => imgRef.current?.click()}
                          className="aspect-video rounded-2xl border-2 border-dashed border-surface-border hover:border-accent/40 transition-colors flex flex-col items-center justify-center gap-2 cursor-pointer group"
                        >
                          <ImageIcon className="w-8 h-8 text-foreground/20 group-hover:text-accent/50 transition-colors" />
                          <span className="text-xs font-bold text-foreground/30 group-hover:text-foreground/50 transition-colors">
                            {coverImages.length === 0 ? "Adicionar capa *" : "Adicionar mais"}
                          </span>
                        </button>
                      )}
                    </div>

                    <div className="bg-background border border-surface-border rounded-2xl p-5 flex flex-col gap-3">
                      <p className="text-xs font-black text-foreground/40 uppercase tracking-wider">Resumo do Anúncio</p>
                      <div className="flex justify-between items-center">
                        <span className="text-sm font-bold text-foreground">{name}</span>
                        <span className="text-sm font-black text-accent">R$ {price}</span>
                      </div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="bg-surface border border-surface-border px-2 py-0.5 rounded-lg text-[11px] font-bold text-foreground/60">{category}</span>
                        <span className="bg-surface border border-surface-border px-2 py-0.5 rounded-lg text-[11px] font-bold text-foreground/60">
                          {deliveryType === "github" ? "GitHub" : ".ZIP"}
                        </span>
                        {tags.slice(0, 3).map(t => (
                          <span key={t} className="bg-accent/10 text-accent border border-accent/20 px-2 py-0.5 rounded-lg text-[11px] font-bold">{t}</span>
                        ))}
                      </div>
                    </div>
                  </motion.div>
                )}

              </AnimatePresence>
            </div>

            {/* ── Footer ── */}
            {!success && (
              <div className="flex items-center justify-between px-8 py-5 border-t border-surface-border bg-surface/50">
                <button
                  onClick={() => step > 1 ? setStep((s) => (s - 1) as 1 | 2 | 3) : handleClose()}
                  className="px-5 py-2.5 text-sm font-bold text-foreground/50 hover:text-foreground transition-colors cursor-pointer"
                >
                  {step === 1 ? "Cancelar" : "Voltar"}
                </button>

                {step < 3 ? (
                  <button
                    onClick={() => setStep((s) => (s + 1) as 2 | 3)}
                    disabled={step === 1 ? !canGoStep2 : !canGoStep3}
                    className="flex items-center gap-2 px-6 py-2.5 bg-accent text-white font-bold rounded-xl hover:opacity-90 transition-all disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer text-sm"
                  >
                    Continuar <ArrowRight className="w-4 h-4" />
                  </button>
                ) : (
                  <button
                    onClick={handleSubmit}
                    disabled={!canSubmit || loading}
                    className="flex items-center gap-2 px-6 py-2.5 bg-accent text-white font-bold rounded-xl hover:opacity-90 transition-all disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer text-sm"
                  >
                    {loading ? (
                      <><Loader2 className="w-4 h-4 animate-spin" /> Publicando...</>
                    ) : (
                      <><Sparkles className="w-4 h-4" /> Publicar no Marketplace</>
                    )}
                  </button>
                )}
              </div>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}