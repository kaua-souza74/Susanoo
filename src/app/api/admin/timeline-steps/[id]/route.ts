import { NextResponse } from "next/server";
import { authenticateAdminRequest, createAdminChatClient } from "@/lib/admin/chat-api";

export const runtime = "nodejs";
const headers = { "Cache-Control": "private, no-store", Vary: "Authorization" };
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const STATUSES = new Set(["upcoming","current","completed"]);
const ALLOWED = new Set(["title","description","date","status","order_index","photo_url"]);

export async function PATCH(request: Request, context: { params: Promise<{ id: string }> }) {
  if (!await authenticateAdminRequest(request)) return NextResponse.json({ error:"Não autorizado." }, { status:403, headers });
  const { id } = await context.params;
  if (!UUID.test(id)) return NextResponse.json({ error:"Identificador inválido." }, { status:400, headers });
  let body: unknown;
  try { body=await request.json(); } catch { return NextResponse.json({ error:"Payload inválido." }, { status:400, headers }); }
  if (!body || typeof body!=="object" || Array.isArray(body)) return NextResponse.json({ error:"Payload inválido." }, { status:400, headers });
  const value=body as Record<string,unknown>;
  if (!Object.keys(value).length || Object.keys(value).some(k=>!ALLOWED.has(k)) || ("title" in value && (typeof value.title!=="string" || !value.title.trim() || value.title.length>300)) || ("description" in value && (typeof value.description!=="string" || value.description.length>10000)) || ("date" in value && (typeof value.date!=="string" || value.date.length>80)) || ("status" in value && (typeof value.status!=="string" || !STATUSES.has(value.status))) || ("order_index" in value && (!Number.isInteger(value.order_index) || Number(value.order_index)<0 || Number(value.order_index)>10000)) || ("photo_url" in value && (typeof value.photo_url!=="string" || value.photo_url.length>2048))) return NextResponse.json({ error:"Payload inválido." }, { status:400, headers });
  const client=createAdminChatClient();
  if (!client) return NextResponse.json({ error:"Serviço indisponível." }, { status:503, headers });
  const { data,error }=await client.from("timeline_steps").update(value).eq("id",id).select("id,project_id,title,description,date,status,order_index,created_at,photo_url").maybeSingle();
  if (error) return NextResponse.json({ error:"Não foi possível atualizar a etapa." }, { status:503, headers });
  if (!data) return NextResponse.json({ error:"Etapa indisponível." }, { status:404, headers });
  return NextResponse.json({ step:data }, { headers });
}

export async function DELETE(request: Request, context: { params: Promise<{ id:string }> }) {
  if (!await authenticateAdminRequest(request)) return NextResponse.json({ error:"Não autorizado." }, { status:403, headers });
  const { id }=await context.params;
  if (!UUID.test(id)) return NextResponse.json({ error:"Identificador inválido." }, { status:400, headers });
  const client=createAdminChatClient();
  if (!client) return NextResponse.json({ error:"Serviço indisponível." }, { status:503, headers });
  const { data,error }=await client.from("timeline_steps").delete().eq("id",id).select("id").maybeSingle();
  if (error) return NextResponse.json({ error:"Não foi possível excluir a etapa." }, { status:503, headers });
  if (!data) return NextResponse.json({ error:"Etapa indisponível." }, { status:404, headers });
  return NextResponse.json({ deleted:true }, { headers });
}
