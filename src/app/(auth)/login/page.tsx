import LoginForm from "./LoginForm";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ message?: string; redirectedFrom?: string }>;
}) {
  const params = await searchParams;

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 p-4">
      <div className="w-full max-w-sm space-y-4 rounded-xl border border-slate-200 bg-white p-8 shadow-sm">
        <h1 className="text-xl font-semibold text-slate-900">Sign in to Wakeely Pro</h1>

        {params.message && (
          <p className="rounded-md bg-blue-50 p-2 text-sm text-blue-700">{params.message}</p>
        )}

        <LoginForm />
      </div>
    </div>
  );
}
