import assert from "node:assert/strict";
import { registerHooks } from "node:module";
import { existsSync } from "node:fs";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import test from "node:test";

const root = path.resolve(import.meta.dirname, "..");
globalThis.__adminUser = null;
registerHooks({
  resolve(specifier, context, nextResolve) {
    if (specifier === "server-only") return { shortCircuit: true, url: "mock:server-only" };
    if (specifier === "@supabase/supabase-js") return { shortCircuit: true, url: "mock:admin-supabase" };
    if (specifier === "next/server") return nextResolve("next/server.js", context);
    if (specifier.startsWith("@/")) return nextResolve(pathToFileURL(path.join(root, "src", `${specifier.slice(2)}.ts`)).href, context);
    if (specifier.startsWith(".") && context.parentURL?.startsWith("file:")) {
      const candidate = new URL(`${specifier}.ts`, context.parentURL);
      if (existsSync(fileURLToPath(candidate))) return nextResolve(candidate.href, context);
    }
    return nextResolve(specifier, context);
  },
  load(url, context, nextLoad) {
    if (url === "mock:server-only") return { format: "module", shortCircuit: true, source: "export {};" };
    if (url === "mock:admin-supabase") return {
      format: "module", shortCircuit: true,
      source: "export function createClient() { return { auth: { async getUser(token) { return { data: { user: token === 'valid' ? globalThis.__adminUser : null }, error: token === 'valid' ? null : new Error('invalid') }; } } }; }",
    };
    return nextLoad(url, context);
  },
});
const { isAuthenticatedAdmin } = await import("../src/lib/admin/auth.ts");
const { POST, DELETE } = await import("../src/app/api/admin/session/route.ts");
const { NextRequest } = await import("next/server.js");
process.env.NEXT_PUBLIC_SUPABASE_URL = "https://example.supabase.co";
process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = "test-public-key";
function request(token = "valid", origin = "https://susanoo.com.br") {
  return new NextRequest("https://susanoo.com.br/api/admin/session", {
    method: "POST", headers: { origin, authorization: `Bearer ${token}` },
  });
}
for (const id of ["f981bed8-1965-478b-84d1-c7de041731dc", "9f285817-8dfd-48da-a797-c6caeda9906b"]) {
  test(`authorized administrator ${id}`, async () => {
    globalThis.__adminUser = { id };
    const response = await POST(request());
    assert.equal(response.status, 200);
    const cookie = response.headers.get("set-cookie");
    assert.match(cookie, /HttpOnly/i);
    assert.match(cookie, /SameSite=strict/i);
    assert.equal(response.headers.get("cache-control"), "no-store");
  });
}
test("customer cannot grant themselves admin using metadata", async () => {
  globalThis.__adminUser = { id: "dd69d348-16b5-4ff8-9bdb-619126c6a734", user_metadata: { role: "admin" } };
  assert.equal((await POST(request())).status, 403);
});
test("missing token denied", async () => assert.equal(await isAuthenticatedAdmin(undefined), false));
test("forged token denied even for admin", async () => {
  globalThis.__adminUser = { id: "f981bed8-1965-478b-84d1-c7de041731dc" };
  assert.equal((await POST(request("forged"))).status, 403);
});
test("cross-origin session creation denied", async () => assert.equal((await POST(request("valid", "https://evil.example"))).status, 403));
test("logout expires admin cookie", async () => {
  assert.match((await DELETE(request())).headers.get("set-cookie"), /Max-Age=0/i);
});
test("cross-origin logout denied", async () => assert.equal((await DELETE(request("valid", "https://evil.example"))).status, 403));
