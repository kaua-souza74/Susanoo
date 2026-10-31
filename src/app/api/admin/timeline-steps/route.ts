import { NextResponse } from "next/server";
import { authenticateAdminRequest, createAdminChatClient } from "@/lib/admin/chat-api";

export const runtime = "nodejs";
const headers = { "Cache-Control": "private, no-store", Vary: "Authorization" };
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const STATUSES = new Set(["upcoming", "current", "completed"]);

export async function GET(request: Request) {
  if (!await authenticateAdminRequest(request)) return NextResponse.json({ error: "Não autorizado." }, { status: 403, headers });
  const client = createAdminChatClient();
  if (!client) return NextResponse.json({ error: "Serviço indisponível." }, { status: 503, headers });
  const url = new URL(request.url);
  const projectId = url.searchParams.get("project_id");
  if (projectId && !UUID.test(projectId)) return NextResponse.json({ error: "Identificador inválido." }, { status: 400, headers });
  const [{ data: projects, error: projectsError }, stepsResult] = await Promise.all([
    client.from("projects").select("id,name,client_id,created_at,timeline_requested,profiles(name,email)").order("created_at", { ascending: false }).limit(500),
    projectId ? client.from("timeline_steps").select("id,project_id,title,description,date,status,order_index,created_at,photo_url").eq("project_id", projectId).order("order_index", { ascending: true }).limit(500) : Promise.resolve({ data: [], error: null }),
  ]);
  if (projectsError || stepsResult.error) return NextResponse.json({ error: "Não foi possível carregar o cronograma." }, { status: 503, headers });
  return NextResponse.json({ projects: projects ?? [], steps: stepsResult.data ?? [] }, { headers });
}

export async function POST(request: Request) {
  if (!await authenticateAdminRequest(request)) return NextResponse.json({ error: "Não autorizado." }, { status: 403, headers });
  let body: unknown;
  try { body = await request.json(); } catch { return NextResponse.json({ error: "Payload inválido." }, { status: 400, headers }); }
  if (!body || typeof body !== "object" || Array.isArray(body)) return NextResponse.json({ error: "Payload inválido." }, { status: 400, headers });
  const value = body as Record<string, unknown>;
  if (Object.keys(value).some((key) => !["project_id","title","description","date","status","order_index","photo_url"].includes(key)) || typeof value.project_id !== "string" || !UUID.test(value.project_id) || typeof value.title !== "string" || !value.title.trim() || value.title.length>300 || typeof value.description !== "string" || value.description.length>10000 || typeof value.date !== "string" || value.date.length>80 || typeof value.status !== "string" || !STATUSES.has(value.status) || !Number.isInteger(value.order_index) || Number(value.order_index)<0 || Number(value.order_index)>10000 || typeof value.photo_url !== "string" || value.photo_url.length>2048) return NextResponse.json({ error: "Payload inválido." }, { status: 400, headers });
  const client = createAdminChatClient();
  if (!client) return NextResponse.json({ error: "Serviço indisponível." }, { status: 503, headers });
  const { data, error } = await client.from("timeline_steps").insert({ project_id:value.project_id,title:value.title.trim(),description:value.description,date:value.date,status:value.status,order_index:value.order_index,photo_url:value.photo_url }).select("id,project_id,title,description,date,status,order_index,created_at,photo_url").single();
  if (error) return NextResponse.json({ error: "Não foi possível criar a etapa." }, { status: 503, headers });
  return NextResponse.json({ step:data }, { status:201, headers });
}
