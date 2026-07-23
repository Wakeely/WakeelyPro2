import Link from "next/link";

// Migration note: port the old repo's LandingPage.tsx content/design here.
// This is a public route (see isPublicRoute in lib/supabase/middleware.ts),
// so it intentionally does NOT query Supabase for any matter data.
export default function HomePage() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-6 p-8 text-center">
      <h1 className="text-3xl font-bold text-slate-900">Wakeely Pro</h1>
      <p className="max-w-md text-slate-600">
        Bilingual legal practice &amp; litigation management, rebuilt on Next.js 15 + Supabase.
      </p>
      <div className="flex gap-3">
        <Link href="/login" className="rounded-md bg-slate-900 px-5 py-2 text-white">
          Sign in
        </Link>
        <Link href="/signup" className="rounded-md border border-slate-300 px-5 py-2">
          Sign up
        </Link>
      </div>
    </main>
  );
}
