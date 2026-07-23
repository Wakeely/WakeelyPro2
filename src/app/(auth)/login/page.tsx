import { login } from "../actions";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ message?: string; redirectedFrom?: string }>;
}) {
  const params = await searchParams;

  async function handleLogin(formData: FormData) {
    "use server";
    const result = await login(formData);
    return result;
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 p-4">
      <form
        action={handleLogin}
        className="w-full max-w-sm space-y-4 rounded-xl border border-slate-200 bg-white p-8 shadow-sm"
      >
        <h1 className="text-xl font-semibold text-slate-900">Sign in to Wakeely Pro</h1>
        {params.message && (
          <p className="rounded-md bg-blue-50 p-2 text-sm text-blue-700">{params.message}</p>
        )}
        <div>
          <label className="block text-sm font-medium text-slate-700">Email</label>
          <input
            name="email"
            type="email"
            required
            className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700">Password</label>
          <input
            name="password"
            type="password"
            required
            minLength={8}
            className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
          />
        </div>
        <button
          type="submit"
          className="w-full rounded-md bg-slate-900 py-2 text-sm font-medium text-white hover:bg-slate-800"
        >
          Sign in
        </button>
        <p className="text-center text-sm text-slate-500">
          No account? <a href="/signup" className="underline">Sign up</a>
        </p>
      </form>
    </div>
  );
}
