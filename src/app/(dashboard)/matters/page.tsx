import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { getCurrentUser } from "@/lib/auth/permissions";

// This is a Server Component: it runs on the server, queries Supabase
// directly with the signed-in user's session, and RLS policy
// "matters: select if accessible" (0001_core_schema.sql) silently filters
// the result to only the matters this user is allowed to see — a partner
// sees the whole firm, an associate sees only matters they're staffed on,
// a client sees only their own matter. No manual filtering code needed here.
export default async function MattersPage() {
  const user = await getCurrentUser();
  const supabase = await createClient();

  const { data: matters, error } = await supabase
    .from("matters")
    .select("id, title, client_name, status, risk_level, win_probability")
    .order("created_at", { ascending: false });

  if (error) {
    return <p className="p-8 text-red-600">Failed to load matters: {error.message}</p>;
  }

  return (
    <div className="p-8">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-slate-900">Matters</h1>
        {user.role !== "client" && (
          <Link
            href="/matters/new"
            className="rounded-md bg-slate-900 px-4 py-2 text-sm font-medium text-white"
          >
            + New Matter
          </Link>
        )}
      </div>

      <div className="overflow-hidden rounded-lg border border-slate-200">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 text-left text-slate-500">
            <tr>
              <th className="px-4 py-2">Title</th>
              <th className="px-4 py-2">Client</th>
              <th className="px-4 py-2">Status</th>
              <th className="px-4 py-2">Risk</th>
            </tr>
          </thead>
          <tbody>
            {matters?.map((m) => (
              <tr key={m.id} className="border-t border-slate-100 hover:bg-slate-50">
                <td className="px-4 py-2">
                  <Link href={`/matters/${m.id}`} className="font-medium text-slate-900">
                    {m.title}
                  </Link>
                </td>
                <td className="px-4 py-2 text-slate-600">{m.client_name}</td>
                <td className="px-4 py-2">{m.status}</td>
                <td className="px-4 py-2">{m.risk_level}</td>
              </tr>
            ))}
            {matters?.length === 0 && (
              <tr>
                <td colSpan={4} className="px-4 py-8 text-center text-slate-400">
                  No matters yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
