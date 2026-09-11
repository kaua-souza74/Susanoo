"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowRight, Check, CheckCircle2, ChevronDown, Loader2, MessageCircle, Search, UserRound, Users, WandSparkles, X } from "lucide-react";
import { supabase } from "@/lib/supabase";

type Developer = { id: string; name: string | null; avatar_url: string | null; skills: string[] | null };

const BUDGET_OPTIONS = ["A definir", "Até R$ 1.500", "R$ 1.500 a R$ 3.000", "R$ 3.000 a R$ 6.000", "Acima de R$ 6.000"];
const normalizeSearch = (value: string) =>
  value.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLocaleLowerCase("pt-BR");

export function CustomSiteRequestModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [developers, setDevelopers] = useState<Developer[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [created, setCreated] = useState(false);
  const [createdChatId, setCreatedChatId] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [assignmentType, setAssignmentType] = useState<"team" | "developer">("team");
  const [developerId, setDeveloperId] = useState("");
  const [projectName, setProjectName] = useState("");
  const [businessType, setBusinessType] = useState("");
  const [description, setDescription] = useState("");
  const [requirements, setRequirements] = useState("");
  const [budgetRange, setBudgetRange] = useState("");
  const [deadline, setDeadline] = useState("");
  const [referenceUrl, setReferenceUrl] = useState("");
  const [developerMenuOpen, setDeveloperMenuOpen] = useState(false);
  const [developerSearch, setDeveloperSearch] = useState("");
  const [budgetMenuOpen, setBudgetMenuOpen] = useState(false);

  const selectedDeveloper = developers.find((developer) => developer.id === developerId);
  const filteredDevelopers = useMemo(() => {
    const term = normalizeSearch(developerSearch.trim());
    if (!term) return developers;
    return developers.filter((developer) =>
      normalizeSearch(`${developer.name || ""} ${(developer.skills || []).join(" ")}`).includes(term),
    );
  }, [developerSearch, developers]);
  const visibleDevelopers = filteredDevelopers.slice(0, 50);

  useEffect(() => {
    if (!open || developers.length > 0) return;
    let active = true;
    supabase.from("profiles").select("id, name, avatar_url, skills").eq("role", "developer").order("name").then(({ data }) => {
      if (active) setDevelopers((data as Developer[] | null) ?? []);
    });
    return () => { active = false; };
  }, [open, developers.length]);

  const close = () => {
    onClose();
    window.setTimeout(() => {
      setCreated(false);
      setCreatedChatId(null);
      setErrorMessage(null);
    }, 250);
  };

  const ensureConversation = async (userId: string) => {
    const developer = developers.find((item) => item.id === developerId);
    const direct = assignmentType === "developer" && Boolean(developer);
    let query = supabase.from("chats").select("id").limit(1);
    query = direct
      ? query.eq("type", "dm").contains("participants", [userId, developerId])
      : query.eq("type", "support").eq("user_id", userId);
    const { data: existing } = await query.maybeSingle();
    if (existing?.id) return existing.id as string;

    const { data: chat } = await supabase.from("chats").insert({
      name: direct ? `Projeto personalizado com ${developer?.name || "desenvolvedor"}` : "Solicitação de site personalizado",
      type: direct ? "dm" : "support",
      user_id: userId,
      participants: direct ? [userId, developerId] : [userId],
    }).select("id").single();
    return (chat?.id as string | undefined) ?? null;
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (assignmentType === "developer" && !developerId) {
      setErrorMessage("Escolha um desenvolvedor para continuar.");
      return;
    }
    setSubmitting(true);
    setErrorMessage(null);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      setErrorMessage("Sua sessão expirou. Entre novamente para enviar o pedido.");
      setSubmitting(false);
      return;
    }

    const { data: request, error } = await supabase.from("custom_site_requests").insert({
      client_id: user.id,
      project_name: projectName.trim(),
      business_type: businessType.trim(),
      description: description.trim(),
      requirements: requirements.trim() || null,
      budget_range: budgetRange || null,
      desired_deadline: deadline || null,
      reference_url: referenceUrl.trim() || null,
      assignment_type: assignmentType,
      preferred_developer_id: assignmentType === "developer" ? developerId : null,
      status: "submitted",
    }).select("id").single();

    if (error || !request) {
      setErrorMessage("Não foi possível registrar seu pedido. Tente novamente.");
      setSubmitting(false);
      return;
    }

    const chatId = await ensureConversation(user.id);
    if (chatId) {
      await Promise.all([
        supabase.from("custom_site_requests").update({ chat_id: chatId, updated_at: new Date().toISOString() }).eq("id", request.id),
        supabase.from("messages").insert({
          chat_id: chatId,
          user_id: user.id,
          sender_name: user.user_metadata?.full_name || user.email?.split("@")[0] || "Cliente",
          content: `**Nova solicitação de site personalizado: ${projectName.trim()}**\n\n${description.trim()}${requirements.trim() ? `\n\nRecursos desejados: ${requirements.trim()}` : ""}`,
        }),
      ]);
    }
    setCreatedChatId(chatId);
    setCreated(true);
    setSubmitting(false);
  };

  return (
    <AnimatePresence>
      {open ? (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[1100] flex items-end justify-center bg-black/70 p-0 backdrop-blur-sm sm:items-center sm:p-5" role="dialog" aria-modal="true" aria-labelledby="custom-site-title">
          <button type="button" aria-label="Fechar solicitação" onClick={close} className="absolute inset-0" />
          <motion.section initial={{ opacity: 0, y: 30, scale: 0.98 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: 24, scale: 0.98 }} className="relative z-10 flex max-h-[94svh] w-full max-w-3xl flex-col overflow-hidden rounded-t-[2rem] bg-surface shadow-2xl ring-1 ring-surface-border sm:rounded-[2rem]">
            <header className="flex items-start justify-between gap-4 px-5 pb-4 pt-5 sm:px-7 sm:pt-7">
              <div className="flex gap-3"><span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-accent text-white shadow-lg shadow-accent/20"><WandSparkles className="h-5 w-5" /></span><div><span className="text-[10px] font-black uppercase tracking-[0.2em] text-accent">Projeto exclusivo</span><h2 id="custom-site-title" className="mt-1 text-xl font-black tracking-tight text-foreground sm:text-2xl">Solicite seu site personalizado</h2></div></div>
              <button type="button" onClick={close} aria-label="Fechar" className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-foreground/40 hover:bg-foreground/5 hover:text-foreground"><X className="h-5 w-5" /></button>
            </header>

            {created ? (
              <div className="flex flex-col items-center px-6 py-12 text-center sm:px-10 sm:py-16">
                <span className="flex h-16 w-16 items-center justify-center rounded-full bg-emerald-500/10 text-emerald-500"><CheckCircle2 className="h-8 w-8" /></span>
                <h3 className="mt-5 text-2xl font-black text-foreground">Pedido enviado</h3>
                <p className="mt-2 max-w-md text-sm leading-relaxed text-foreground/55">O briefing está salvo na sua conta e a conversa correspondente já foi preparada.</p>
                <div className="mt-7 flex flex-wrap justify-center gap-3"><Link href="/dashboard/requests" onClick={close} className="flex h-11 items-center gap-2 rounded-full bg-foreground px-5 text-xs font-black text-background">Acompanhar pedido <ArrowRight className="h-4 w-4" /></Link>{createdChatId ? <Link href={`/dashboard/chat?chatId=${createdChatId}`} onClick={close} className="flex h-11 items-center gap-2 rounded-full border border-surface-border bg-background px-5 text-xs font-black text-foreground"><MessageCircle className="h-4 w-4" /> Abrir conversa</Link> : null}</div>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="custom-scrollbar overflow-y-auto px-5 pb-6 sm:px-7 sm:pb-7">
                <div className="grid gap-4 sm:grid-cols-2"><Field label="Nome do projeto"><input required value={projectName} onChange={(event) => setProjectName(event.target.value)} placeholder="Ex.: Novo site da cafeteria" className="field-input" /></Field><Field label="Tipo de negócio"><input required value={businessType} onChange={(event) => setBusinessType(event.target.value)} placeholder="Ex.: Cafeteria, clínica, escritório" className="field-input" /></Field></div>
                <Field label="Conte o que você precisa"><textarea required rows={4} value={description} onChange={(event) => setDescription(event.target.value)} placeholder="Objetivo, público e como o site deve funcionar..." className="field-input min-h-28 resize-y py-3" /></Field>
                <Field label="Recursos desejados"><input value={requirements} onChange={(event) => setRequirements(event.target.value)} placeholder="Ex.: WhatsApp, Pix, agendamento, catálogo" className="field-input" /></Field>
                <fieldset className="mt-5"><legend className="mb-2 text-xs font-black text-foreground/65">Quem deve atender?</legend><div className="grid gap-3 sm:grid-cols-2"><AssignmentButton active={assignmentType === "team"} onClick={() => { setAssignmentType("team"); setDeveloperId(""); }} icon={<Users className="h-5 w-5" />} title="Equipe Susanoo" subtitle="A equipe escolhe o melhor especialista" /><AssignmentButton active={assignmentType === "developer"} onClick={() => setAssignmentType("developer")} icon={<UserRound className="h-5 w-5" />} title="Escolher desenvolvedor" subtitle="Direcione para um perfil específico" /></div></fieldset>
                {assignmentType === "developer" ? (
                  <Field label="Desenvolvedor preferido">
                    <div className="relative">
                      <button
                        type="button"
                        aria-haspopup="listbox"
                        aria-expanded={developerMenuOpen}
                        onClick={() => { setDeveloperMenuOpen((current) => !current); setBudgetMenuOpen(false); }}
                        className={`flex min-h-14 w-full items-center gap-3 rounded-2xl border bg-background px-3.5 text-left shadow-sm transition-all ${developerMenuOpen ? "border-accent ring-4 ring-accent/5" : "border-surface-border hover:border-foreground/20"}`}
                      >
                        {selectedDeveloper ? <DeveloperAvatar developer={selectedDeveloper} /> : <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-accent/10 text-accent"><Search className="h-4 w-4" /></span>}
                        <span className="min-w-0 flex-1"><strong className={`block truncate text-sm ${selectedDeveloper ? "text-foreground" : "text-foreground/40"}`}>{selectedDeveloper?.name || "Pesquise e escolha um desenvolvedor"}</strong>{selectedDeveloper?.skills?.length ? <small className="mt-0.5 block truncate text-[10px] font-bold text-foreground/35">{selectedDeveloper.skills.slice(0, 3).join(" · ")}</small> : null}</span>
                        <ChevronDown className={`h-4 w-4 shrink-0 text-foreground/35 transition-transform ${developerMenuOpen ? "rotate-180" : ""}`} />
                      </button>

                      <AnimatePresence>
                        {developerMenuOpen ? (
                          <motion.div initial={{ opacity: 0, y: 6, scale: 0.98 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: 4, scale: 0.98 }} className="absolute inset-x-0 top-full z-50 mt-2 overflow-hidden rounded-2xl border border-surface-border bg-surface p-2 shadow-2xl">
                            <div className="relative mb-2"><Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-foreground/30" /><input autoFocus type="search" value={developerSearch} onChange={(event) => setDeveloperSearch(event.target.value)} placeholder="Buscar por nome ou especialidade..." className="h-11 w-full rounded-xl bg-background pl-10 pr-3 text-sm font-medium text-foreground outline-none ring-1 ring-surface-border placeholder:text-foreground/30 focus:ring-2 focus:ring-accent" /></div>
                            <div role="listbox" aria-label="Desenvolvedores" className="custom-scrollbar max-h-64 space-y-1 overflow-y-auto">
                              {filteredDevelopers.length ? visibleDevelopers.map((developer) => (
                                <button key={developer.id} type="button" role="option" aria-selected={developer.id === developerId} onClick={() => { setDeveloperId(developer.id); setDeveloperMenuOpen(false); setDeveloperSearch(""); }} className={`flex w-full items-center gap-3 rounded-xl p-2.5 text-left transition-colors ${developer.id === developerId ? "bg-accent/10 text-accent" : "text-foreground hover:bg-foreground/5"}`}>
                                  <DeveloperAvatar developer={developer} />
                                  <span className="min-w-0 flex-1"><strong className="block truncate text-sm">{developer.name || "Desenvolvedor Susanoo"}</strong><small className="mt-0.5 block truncate text-[10px] font-bold text-foreground/35">{developer.skills?.length ? developer.skills.slice(0, 3).join(" · ") : "Perfil profissional"}</small></span>
                                  {developer.id === developerId ? <Check className="h-4 w-4 shrink-0" /> : null}
                                </button>
                              )) : <div className="px-4 py-8 text-center"><p className="text-sm font-black text-foreground/60">Nenhum perfil encontrado</p><p className="mt-1 text-xs text-foreground/35">Tente outro nome ou especialidade.</p></div>}
                            </div>
                          </motion.div>
                        ) : null}
                      </AnimatePresence>
                    </div>
                  </Field>
                ) : null}

                <div className="grid gap-4 sm:grid-cols-3">
                  <Field label="Faixa de investimento">
                    <div className="relative">
                      <button type="button" aria-haspopup="listbox" aria-expanded={budgetMenuOpen} onClick={() => { setBudgetMenuOpen((current) => !current); setDeveloperMenuOpen(false); }} className={`flex h-12 w-full items-center justify-between rounded-2xl border bg-background px-4 text-sm font-semibold text-foreground shadow-sm transition-all ${budgetMenuOpen ? "border-accent ring-4 ring-accent/5" : "border-surface-border hover:border-foreground/20"}`}><span>{budgetRange || "A definir"}</span><ChevronDown className={`h-4 w-4 text-foreground/35 transition-transform ${budgetMenuOpen ? "rotate-180" : ""}`} /></button>
                      <AnimatePresence>{budgetMenuOpen ? <motion.div initial={{ opacity: 0, y: 6, scale: 0.98 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: 4, scale: 0.98 }} role="listbox" aria-label="Faixa de investimento" className="absolute bottom-full left-0 z-50 mb-2 w-full min-w-56 space-y-1 rounded-2xl border border-surface-border bg-surface p-2 shadow-2xl">{BUDGET_OPTIONS.map((option) => <button key={option} type="button" role="option" aria-selected={(budgetRange || "A definir") === option} onClick={() => { setBudgetRange(option === "A definir" ? "" : option); setBudgetMenuOpen(false); }} className={`flex w-full items-center justify-between rounded-xl px-3 py-2.5 text-left text-xs font-bold transition-colors ${(budgetRange || "A definir") === option ? "bg-accent/10 text-accent" : "text-foreground/60 hover:bg-foreground/5 hover:text-foreground"}`}><span>{option}</span>{(budgetRange || "A definir") === option ? <Check className="h-3.5 w-3.5" /> : null}</button>)}</motion.div> : null}</AnimatePresence>
                    </div>
                  </Field>
                  <Field label="Prazo desejado"><input type="date" value={deadline} onChange={(event) => setDeadline(event.target.value)} className="field-input" /></Field>
                  <Field label="Site de referência"><input type="url" value={referenceUrl} onChange={(event) => setReferenceUrl(event.target.value)} placeholder="https://..." className="field-input" /></Field>
                </div>
                {errorMessage ? <p role="alert" className="mt-4 rounded-xl bg-red-500/10 px-4 py-3 text-xs font-bold text-red-500">{errorMessage}</p> : null}
                <div className="mt-6 flex items-center justify-end gap-3"><button type="button" onClick={close} className="h-11 rounded-full px-5 text-xs font-black text-foreground/45 hover:bg-foreground/5">Cancelar</button><button type="submit" disabled={submitting} className="flex h-11 items-center gap-2 rounded-full bg-accent px-6 text-xs font-black text-white shadow-lg shadow-accent/20 disabled:opacity-60">{submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <WandSparkles className="h-4 w-4" />} Enviar solicitação</button></div>
              </form>
            )}
          </motion.section>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return <div className="mt-4 block"><span className="mb-2 block text-xs font-black text-foreground/65">{label}</span>{children}</div>;
}

function DeveloperAvatar({ developer }: { developer: Developer }) {
  const initials = (developer.name || "Dev").split(" ").slice(0, 2).map((part) => part[0]).join("").toUpperCase();
  return developer.avatar_url
    ? <img src={developer.avatar_url} alt="" className="h-9 w-9 shrink-0 rounded-xl object-cover ring-1 ring-surface-border" />
    : <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-accent/10 text-[10px] font-black text-accent ring-1 ring-accent/15">{initials}</span>;
}

function AssignmentButton({ active, onClick, icon, title, subtitle }: { active: boolean; onClick: () => void; icon: React.ReactNode; title: string; subtitle: string }) {
  return <button type="button" onClick={onClick} className={`flex items-center gap-3 rounded-2xl border p-4 text-left transition-all ${active ? "border-accent bg-accent/10 text-accent" : "border-surface-border bg-background text-foreground/60"}`}>{icon}<span><strong className="block text-sm">{title}</strong><small className="text-[11px] opacity-70">{subtitle}</small></span></button>;
}
