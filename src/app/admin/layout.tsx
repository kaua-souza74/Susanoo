import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import AdminShell from "@/components/admin/AdminShell";
import { ADMIN_SESSION_COOKIE, isAuthenticatedAdmin } from "@/lib/admin/auth";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const token = (await cookies()).get(ADMIN_SESSION_COOKIE)?.value;
  if (!(await isAuthenticatedAdmin(token))) redirect("/admin/login");
  return <AdminShell>{children}</AdminShell>;
}
