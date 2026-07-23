import { signup } from "../actions";

export default function SignupPage() {
  async function handleSignup(formData: FormData) {
    "use server";
    return signup(formData);
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 p-4">
      <form
        action={handleSignup}
        className="w-full max-w-sm space-y-4 rounded-xl border border-slate-200 bg-white p-8 shadow-sm"
      >
        <h1 className="text-xl font-semibold text-slate-900">Create your account</h1>
        <div>
          <label className="block text-sm font-medium text-slate-700">Full name</label>
          <input
            name="fullName"
            type="text"
            required
            className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
          />
        </div>
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
          Sign up
        </button>
        <p className="text-center text-sm text-slate-500">
          New accounts start as a <strong>client</strong> role. A partner promotes
          staff accounts afterwards — see the migration plan, step 5.
        </p>
      </form>
    </div>
  );
}
