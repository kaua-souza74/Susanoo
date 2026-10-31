import { NextResponse } from "next/server";
import { authenticateAdminRequest, createAdminChatClient } from "@/lib/admin/chat-api";

export const runtime = "nodejs";
const headers = { "Cache-Control": "private, no-store", Vary: "Authorization" };
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const STATUSES = new Set(["todo", "doing", "review", "done"]);

export async function PATCH(request: Request, context: { params: Promise<{ id: string }> }) {
  if (!await authenticateAdminRequest(request)) return NextResponse.json({ error: "Não autorizado." }, { status: 403, headers });
  const { id } = await context.params;
  if (!UUID.test(id)) return NextResponse.json({ error: "Identificador inválido." }, { status: 400, headers });
  let body: unknown;
  try { body = await request.json(); } catch { return NextResponse.json({ error: "Payload inválido." }, { status: 400, headers }); }
  if (!body || typeof body !== "object" || Array.isArray(body)) return NextResponse.json({ error: "Payload inválido." }, { status: 400, headers });
  const value = body as Record<string, unknown>;
  if (Object.keys(value).length !== 1 || typeof value.status !== "string" || !STATUSES.has(value.status)) return NextResponse.json({ error: "Payload inválido." }, { status: 400, headers });
  const client = createAdminChatClient();
  if (!client) return NextResponse.json({ error: "Serviço indisponível." }, { status: 503, headers });
  const { data, error } = await client.from("tasks").update({ status: value.status }).eq("id", id).select("id,status").maybeSingle();
  if (error) return NextResponse.json({ error: "Não foi possível atualizar a tarefa." }, { status: 503, headers });
  if (!data) return NextResponse.json({ error: "Tarefa indisponível." }, { status: 404, headers });
  return NextResponse.json({ task: data }, { headers });
}

export async function DELETE(request: Request, context: { params: Promise<{ id: string }> }) {
  if (!await authenticateAdminRequest(request)) return NextResponse.json({ error: "Não autorizado." }, { status: 403, headers });
  const { id } = await context.params;
  if (!UUID.test(id)) return NextResponse.json({ error: "Identificador inválido." }, { status: 400, headers });
  const client = createAdminChatClient();
  if (!client) return NextResponse.json({ error: "Serviço indisponível." }, { status: 503, headers });
  const { data, error } = await client.from("tasks").delete().eq("id", id).select("id").maybeSingle();
  if (error) return NextResponse.json({ error: "Não foi possível excluir a tarefa." }, { status: 503, headers });
  if (!data) return NextResponse.json({ error: "Tarefa indisponível." }, { status: 404, headers });
  return NextResponse.json({ deleted: true }, { headers });
}
