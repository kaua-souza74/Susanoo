import { NextResponse } from "next/server";
import { authenticateAdminRequest, createAdminChatClient } from "@/lib/admin/chat-api";

export const runtime = "nodejs";
const headers = { "Cache-Control": "private, no-store", Vary: "Authorization" };
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export async function GET(request: Request) {
  if (!await authenticateAdminRequest(request)) return NextResponse.json({ error: "Não autorizado." }, { status: 403, headers });
  const client = createAdminChatClient();
  if (!client) return NextResponse.json({ error: "Serviço indisponível." }, { status: 503, headers });
  const [{ data: tasks, error: tasksError }, { data: projects, error: projectsError }] = await Promise.all([
    client.from("tasks").select("id,project_id,title,description,status,created_at,assignee,projects(id,name,profiles(email,name))").order("created_at", { ascending: false }).limit(1000),
    client.from("projects").select("id,name,client_id,created_at,profiles(email,name)").order("created_at", { ascending: false }).limit(500),
  ]);
  if (tasksError || projectsError) return NextResponse.json({ error: "Não foi possível carregar as tarefas." }, { status: 503, headers });
  return NextResponse.json({ tasks: tasks ?? [], projects: projects ?? [] }, { headers });
}

export async function POST(request: Request) {
  if (!await authenticateAdminRequest(request)) return NextResponse.json({ error: "Não autorizado." }, { status: 403, headers });
  let body: unknown;
  try { body = await request.json(); } catch { return NextResponse.json({ error: "Payload inválido." }, { status: 400, headers }); }
  if (!body || typeof body !== "object" || Array.isArray(body)) return NextResponse.json({ error: "Payload inválido." }, { status: 400, headers });
  const value = body as Record<string, unknown>;
  if (Object.keys(value).some((key) => !["title", "assignee", "project_id"].includes(key)) || typeof value.title !== "string" || !value.title.trim() || value.title.length > 500 || typeof value.assignee !== "string" || value.assignee.length > 120 || !(value.project_id === null || (typeof value.project_id === "string" && UUID.test(value.project_id)))) return NextResponse.json({ error: "Payload inválido." }, { status: 400, headers });
  const client = createAdminChatClient();
  if (!client) return NextResponse.json({ error: "Serviço indisponível." }, { status: 503, headers });
  const { data, error } = await client.from("tasks").insert({ title: value.title.trim(), assignee: value.assignee, project_id: value.project_id, status: "todo" }).select("id,project_id,title,description,status,created_at,assignee").single();
  if (error) return NextResponse.json({ error: "Não foi possível criar a tarefa." }, { status: 503, headers });
  return NextResponse.json({ task: data }, { status: 201, headers });
}
