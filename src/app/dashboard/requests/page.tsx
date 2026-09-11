"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowLeft, CalendarDays, Loader2, MessageCircle, Plus, UserRound, Users, WandSparkles } from "lucide-react";
import { supabase } from "@/lib/supabase";

type SiteRequest = {
  id: string;
  project_name: string;
  business_type: string;
  description: string;
  requirements: string | null;
  budget_range: string | null;
  desired_deadline: string | null;
  assignment_type: "team" | "developer";
  status: string;
  chat_id: string | null;
  created_at: string;
};

const STATUS: Record<string, { label: string; className: string }> = {
  submitted: { label: "Enviado", className: "bg-blue-500/10 text-blue-500" },
  triage: { label: "Em análise", className: "bg-amber-500/10 text-amber-500" },
  quoted: { label: "Proposta enviada", className: "bg-violet-500/10 text-violet-500" },
  accepted: { label: "Aceito", className: "bg-emerald-500/10 text-emerald-500" },
  in_progress: { label: "Em desenvolvimento", className: "bg-cyan-500/10 text-cyan-500" },
  delivered: { label: "Entregue", className: "bg-emerald-500/10 text-emerald-500" },
  cancelled: { label: "Cancelado", className: "bg-red-500/10 text-red-500" },
};

export default function CustomSiteRequestsPage() {
  const [requests, setRequests] = useState<SiteRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDeveloper, setIsDeveloper] = useState(false);

  useEffect(() => {
    let active = true;
    const load = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).maybeSingle();
      const developer = profile?.role === "developer";
      let query = supabase.from("custom_site_requests").select("*").order("created_at", { ascending: false });
      query = developer ? query.eq("preferred_developer_id", user.id) : query.eq("client_id", user.id);
      const { data } = await query;
      if (active) {
        setIsDeveloper(developer);
        setRequests((data as SiteRequest[] | null) ?? []);
        setLoading(false);
      }
    };
    load();
    return () => { active = false; };
  }, []);

  return (
    <div className="custom-scrollbar flex-1 overflow-y-auto bg-background text-foreground">
      <header className="sticky top-0 z-20 flex items-center justify-between gap-4 bg-background/80 px-4 py-4 shadow-sm backdrop-blur-xl sm:px-7">
        <div className="flex items-center gap-3"><Link href="/dashboard" aria-label="Voltar" className="flex h-10 w-10 items-center justify-center rounded-xl text-foreground/50 hover:bg-foreground/5 hover:text-foreground"><ArrowLeft className="h-5 w-5" /></Link><div><span className="text-[10px] font-black uppercase tracking-[0.2em] text-accent">Sob medida</span><h1 className="text-xl font-black tracking-tight">{isDeveloper ? "Solicitações direcionadas" : "Meus pedidos personalizados"}</h1></div></div>
        {!isDeveloper ? <Link href="/dashboard?customRequest=1" className="flex h-10 items-center gap-2 rounded-full bg-accent px-4 text-xs font-black text-white"><Plus className="h-4 w-4" /><span className="hidden sm:inline">Novo pedido</span></Link> : null}
      </header>

      <main className="mx-auto w-full max-w-6xl px-4 py-7 sm:px-7">
        {loading ? <div className="flex justify-center py-24"><Loader2 className="h-7 w-7 animate-spin text-accent" /></div> : requests.length === 0 ? (
          <section className="flex flex-col items-center rounded-[2rem] border border-dashed border-surface-border bg-surface/50 px-6 py-20 text-center"><span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-accent/10 text-accent"><WandSparkles className="h-6 w-6" /></span><h2 className="mt-4 text-lg font-black">{isDeveloper ? "Nenhuma solicitação direcionada" : "Você ainda não fez um pedido"}</h2><p className="mt-1 max-w-md text-sm text-foreground/45">{isDeveloper ? "Quando um cliente escolher seu perfil, o briefing aparecerá aqui." : "Conte o que precisa e a Susanoo prepara um projeto exclusivo."}</p>{!isDeveloper ? <Link href="/dashboard?customRequest=1" className="mt-6 rounded-full bg-foreground px-5 py-3 text-xs font-black text-background">Solicitar meu site</Link> : null}</section>
        ) : (
          <div className="grid gap-4 md:grid-cols-2">
            {requests.map((request) => {
              const status = STATUS[request.status] ?? { label: request.status, className: "bg-foreground/5 text-foreground/50" };
              return <article key={request.id} className="rounded-[1.75rem] bg-surface p-5 shadow-[0_16px_45px_rgba(15,23,42,0.06)] ring-1 ring-surface-border sm:p-6">
                <div className="flex items-start justify-between gap-4"><div><span className="text-[10px] font-black uppercase tracking-[0.18em] text-accent">{request.business_type}</span><h2 className="mt-1 text-lg font-black text-foreground">{request.project_name}</h2></div><span className={`shrink-0 rounded-full px-3 py-1.5 text-[10px] font-black ${status.className}`}>{status.label}</span></div>
                <p className="mt-4 line-clamp-3 text-sm leading-relaxed text-foreground/55">{request.description}</p>
                <div className="mt-5 flex flex-wrap gap-2 text-[11px] font-bold text-foreground/45"><span className="flex items-center gap-1.5 rounded-full bg-background px-3 py-1.5">{request.assignment_type === "team" ? <Users className="h-3.5 w-3.5" /> : <UserRound className="h-3.5 w-3.5" />}{request.assignment_type === "team" ? "Equipe Susanoo" : "Desenvolvedor escolhido"}</span>{request.desired_deadline ? <span className="flex items-center gap-1.5 rounded-full bg-background px-3 py-1.5"><CalendarDays className="h-3.5 w-3.5" />{new Date(`${request.desired_deadline}T12:00:00`).toLocaleDateString("pt-BR")}</span> : null}</div>
                <div className="mt-5 flex items-center justify-between border-t border-surface-border pt-4"><span className="text-[10px] font-bold text-foreground/30">Enviado em {new Date(request.created_at).toLocaleDateString("pt-BR")}</span>{request.chat_id ? <Link href={`/dashboard/chat?chatId=${request.chat_id}`} className="flex h-9 items-center gap-2 rounded-full bg-foreground px-4 text-[11px] font-black text-background"><MessageCircle className="h-3.5 w-3.5" /> Abrir chat</Link> : null}</div>
              </article>;
            })}
          </div>
        )}
      </main>
    </div>
  );
}
