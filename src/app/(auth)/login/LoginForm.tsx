"use client";

// Client Component: useActionState is a React hook, and hooks only work
// in Client Components. This is why the form itself is split out from
// page.tsx (which stays a Server Component so it can still read
// searchParams the async way).
import { useActionState } from "react";
import { login, type AuthFormState } from "../actions";

const initialState: AuthFormState = {};

export default function LoginForm() {
  // useActionState wraps `login` into `formAction`, whose type is exactly
  // `(formData: FormData) => void` — satisfying the form's `action` prop.
  // `state` holds whatever `login` last returned (e.g. { error: "..." }),
  // and `isPending` is true while the action is running.
  const [state, formAction, isPending] = useActionState(login, initialState);

  return (
    <form action={formAction} className="space-y-4">
      {state?.error && (
        <p role="alert" className="rounded-md bg-red-50 p-2 text-sm text-red-700">
          {state.error}
        </p>
      )}

      <div>
        <label htmlFor="email" className="block text-sm font-medium text-slate-700">
          Email
        </label>
        <input
          id="email"
          name="email"
          type="email"
          required
          autoComplete="email"
          className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
        />
      </div>

      <div>
        <label htmlFor="password" className="block text-sm font-medium text-slate-700">
          Password
        </label>
        <input
          id="password"
          name="password"
          type="password"
          required
          minLength={8}
          autoComplete="current-password"
          className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
        />
      </div>

      <button
        type="submit"
        disabled={isPending}
        className="w-full rounded-md bg-slate-900 py-2 text-sm font-medium text-white hover:bg-slate-800 disabled:opacity-60"
      >
        {isPending ? "Signing in…" : "Sign in"}
      </button>

      <p className="text-center text-sm text-slate-500">
        No account?{" "}
        <a href="/signup" className="underline">
          Sign up
        </a>
      </p>
    </form>
  );
}
