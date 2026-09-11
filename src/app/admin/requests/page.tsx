"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { CalendarDays, Loader2, MessageSquareText, UserRound, Users, WandSparkles } from "lucide-react";
import { supabase } from "@/lib/supabase";

type RequestRow = {
  id: string;
  project_name: string;
  business_type: string;
  description: string;
  requirements: string | null;
  budget_range: string | null;
  desired_deadline: string | null;
  reference_url: string | null;
  assignment_type: "team" | "developer";
  status: string;
  chat_id: string | null;
  created_at: string;
  client: { name: string | null; email: string | null } | null;
  developer: { name: string | null; email: string | null } | null;
};

const STATUS_OPTIONS = [
  ["submitted", "Enviado"], ["triage", "Em análise"], ["quoted", "Proposta enviada"],
  ["accepted", "Aceito"], ["in_progress", "Em desenvolvimento"], ["delivered", "Entregue"], ["cancelled", "Cancelado"],
];

export default function AdminCustomRequestsPage() {
  const [requests, setRequests] = useState<RequestRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    supabase.from("custom_site_requests").select("*, client:profiles!custom_site_requests_client_profile_fkey(name,email), developer:profiles!custom_site_requests_preferred_developer_id_fkey(name,email)").order("created_at", { ascending: false }).then(({ data }) => {
      if (!active) return;
      setRequests((data as RequestRow[] | null) ?? []);
      setLoading(false);
    });
    return () => { active = false; };
  }, []);

  const updateStatus = async (id: string, status: string) => {
    setUpdatingId(id);
    const { error } = await supabase.from("custom_site_requests").update({ status, updated_at: new Date().toISOString() }).eq("id", id);
    if (!error) setRequests((current) => current.map((item) => item.id === id ? { ...item, status } : item));
    setUpdatingId(null);
  };

  return (
    <div className="custom-scrollbar flex-1 overflow-y-auto bg-background px-4 py-6 text-foreground sm:px-8">
      <div className="mx-auto w-full max-w-7xl">
        <div className="mb-7 flex items-end justify-between gap-4"><div><span className="text-[10px] font-black uppercase tracking-[0.2em] text-accent">Novos negócios</span><h1 className="mt-1 text-3xl font-black tracking-tight">Sites personalizados</h1><p className="mt-1 text-sm text-foreground/45">Briefings enviados por clientes e desenvolvedores escolhidos.</p></div><span className="rounded-full bg-accent/10 px-3 py-1.5 text-xs font-black text-accent">{requests.length} pedidos</span></div>

        {loading ? <div className="flex justify-center py-24"><Loader2 className="h-7 w-7 animate-spin text-accent" /></div> : requests.length === 0 ? <div className="flex flex-col items-center rounded-[2rem] border border-dashed border-surface-border bg-surface/40 px-6 py-20 text-center"><WandSparkles className="h-8 w-8 text-accent" /><h2 className="mt-4 font-black">Nenhum briefing recebido</h2></div> : (
          <div className="grid gap-5 xl:grid-cols-2">{requests.map((request) => <article key={request.id} className="rounded-[1.75rem] bg-surface p-5 shadow-sm ring-1 ring-surface-border sm:p-6">
            <div className="flex flex-wrap items-start justify-between gap-4"><div><span className="text-[10px] font-black uppercase tracking-[0.18em] text-accent">{request.business_type}</span><h2 className="mt-1 text-xl font-black">{request.project_name}</h2><p className="mt-1 text-xs font-bold text-foreground/40">{request.client?.name || request.client?.email || "Cliente"}</p></div><div className="flex items-center gap-2">{updatingId === request.id ? <Loader2 className="h-4 w-4 animate-spin text-accent" /> : null}<select aria-label={`Status de ${request.project_name}`} value={request.status} onChange={(event) => updateStatus(request.id, event.target.value)} disabled={updatingId === request.id} className="h-10 rounded-full border border-surface-border bg-background px-4 text-xs font-black outline-none focus:border-accent">{STATUS_OPTIONS.map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></div></div>
            <p className="mt-5 whitespace-pre-line text-sm leading-relaxed text-foreground/60">{request.description}</p>
            {request.requirements ? <div className="mt-4 rounded-2xl bg-background p-4"><span className="text-[9px] font-black uppercase tracking-wider text-foreground/35">Recursos desejados</span><p className="mt-1 text-xs font-medium text-foreground/65">{request.requirements}</p></div> : null}
            <div className="mt-5 flex flex-wrap gap-2 text-[11px] font-bold text-foreground/50"><span className="flex items-center gap-1.5 rounded-full bg-background px-3 py-2">{request.assignment_type === "team" ? <Users className="h-3.5 w-3.5" /> : <UserRound className="h-3.5 w-3.5" />}{request.assignment_type === "team" ? "Equipe Susanoo" : request.developer?.name || "Desenvolvedor escolhido"}</span>{request.budget_range ? <span className="rounded-full bg-background px-3 py-2">{request.budget_range}</span> : null}{request.desired_deadline ? <span className="flex items-center gap-1.5 rounded-full bg-background px-3 py-2"><CalendarDays className="h-3.5 w-3.5" />{new Date(`${request.desired_deadline}T12:00:00`).toLocaleDateString("pt-BR")}</span> : null}</div>
            <div className="mt-5 flex flex-wrap items-center justify-between gap-3 border-t border-surface-border pt-4"><span className="text-[10px] font-bold text-foreground/30">Recebido em {new Date(request.created_at).toLocaleString("pt-BR")}</span><div className="flex gap-2">{request.reference_url ? <a href={request.reference_url} target="_blank" rel="noreferrer" className="rounded-full border border-surface-border px-4 py-2 text-[11px] font-black">Ver referência</a> : null}{request.chat_id ? <Link href="/admin/chat" className="flex items-center gap-2 rounded-full bg-foreground px-4 py-2 text-[11px] font-black text-background"><MessageSquareText className="h-3.5 w-3.5" /> Abrir chat</Link> : null}</div></div>
          </article>)}</div>
        )}
      </div>
    </div>
  );
}
