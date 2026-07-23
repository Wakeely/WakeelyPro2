import Link from "next/link";
import { getCurrentUser, can } from "@/lib/auth/permissions";
import { logout } from "../(auth)/actions";

// Every route under (dashboard) is already guaranteed to have an
// authenticated user (middleware.ts redirects otherwise). This layout adds
// the second, ROLE-aware layer: which nav links even make sense to show.
// Remember — hiding a link here is UX, not security; the real enforcement
// is the RLS policy on the table each page queries.
export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getCurrentUser();

  return (
    <div className="flex min-h-screen">
      <aside className="w-56 shrink-0 border-e border-slate-200 bg-slate-50 p-4">
        <nav className="flex flex-col gap-1 text-sm">
          <Link href="/matters" className="rounded px-3 py-2 hover:bg-slate-100">
            Matters
          </Link>
          {can.viewBilling(user.role) && (
            <Link href="/billing" className="rounded px-3 py-2 hover:bg-slate-100">
              Billing
            </Link>
          )}
          {can.viewPrivilegeLog(user.role) && (
            <Link href="/privilege-log" className="rounded px-3 py-2 hover:bg-slate-100">
              Privilege Log
            </Link>
          )}
        </nav>
        <form action={logout} className="mt-6">
          <button className="text-sm text-slate-500 hover:text-slate-800">
            Sign out ({user.fullName || user.role})
          </button>
        </form>
      </aside>
      <main className="flex-1">{children}</main>
    </div>
  );
}
