import { NextResponse } from "next/server";
import { authenticateAdminRequest, createAdminChatClient } from "@/lib/admin/chat-api";

export const runtime = "nodejs";
const headers = { "Cache-Control": "private, no-store", Vary: "Authorization" };

export async function GET(request: Request) {
  if (!await authenticateAdminRequest(request)) return NextResponse.json({ error: "Não autorizado." }, { status: 403, headers });
  const client = createAdminChatClient();
  if (!client) return NextResponse.json({ error: "Serviço indisponível." }, { status: 503, headers });
  const [{ count: clients, error: clientsError }, { count: projects, error: projectsError }, { count: pendingTasks, error: tasksError }] = await Promise.all([
    client.from("profiles").select("id", { count: "exact", head: true }),
    client.from("projects").select("id", { count: "exact", head: true }),
    client.from("tasks").select("id", { count: "exact", head: true }).neq("status", "done"),
  ]);
  if (clientsError || projectsError || tasksError) return NextResponse.json({ error: "Não foi possível carregar os indicadores." }, { status: 503, headers });
  return NextResponse.json({ clients: clients ?? 0, activeProjects: projects ?? 0, pendingTasks: pendingTasks ?? 0 }, { headers });
}

