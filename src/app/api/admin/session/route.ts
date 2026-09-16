import { NextRequest, NextResponse } from "next/server";
import { ADMIN_SESSION_COOKIE, isAuthenticatedAdmin } from "@/lib/admin/auth";

function sessionResponse(token: string, status: number) {
  const response = NextResponse.json({ authorized: status === 200 && !!token }, { status });
  response.headers.set("Cache-Control", "no-store");
  response.cookies.set(ADMIN_SESSION_COOKIE, token, {
    httpOnly: true, secure: process.env.NODE_ENV === "production",
    sameSite: "strict", path: "/", maxAge: token ? 900 : 0,
  });
  return response;
}
export async function POST(request: NextRequest) {
  if (request.headers.get("origin") !== request.nextUrl.origin) {
    return NextResponse.json({ authorized: false }, { status: 403 });
  }
  const token = /^Bearer ([^\s]+)$/.exec(request.headers.get("authorization") ?? "")?.[1];
  if (!token || !(await isAuthenticatedAdmin(token))) return sessionResponse("", 403);
  return sessionResponse(token, 200);
}
export async function DELETE(request: NextRequest) {
  if (request.headers.get("origin") !== request.nextUrl.origin) {
    return NextResponse.json({ authorized: false }, { status: 403 });
  }
  return sessionResponse("", 200);
}
