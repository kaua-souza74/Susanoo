import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { ADMIN_SESSION_COOKIE, isAuthenticatedAdmin } from "@/lib/admin/auth";

// Unlike persistent layouts, templates re-check access on navigation.
export default async function AdminTemplate({ children }: { children: React.ReactNode }) {
  if (!(await isAuthenticatedAdmin((await cookies()).get(ADMIN_SESSION_COOKIE)?.value))) {
    redirect("/admin/login");
  }
  return children;
}
