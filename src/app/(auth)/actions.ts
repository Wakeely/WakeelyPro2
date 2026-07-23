"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";

// The state shape useActionState tracks between submissions. Keeping this
// exported means the client form component and this file always agree on
// the shape without duplicating it.
export interface AuthFormState {
  error?: string;
}

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
});

// useActionState requires the action's signature to be
// (previousState, formData) => State | Promise<State> — that's the piece
// that was missing before, which is exactly what the Vercel type error
// was pointing at.
export async function login(
  _prevState: AuthFormState,
  formData: FormData
): Promise<AuthFormState> {
  const parsed = loginSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
  });
  if (!parsed.success) return { error: "Invalid email or password format." };

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword(parsed.data);
  if (error) return { error: error.message };

  revalidatePath("/", "layout");
  redirect("/matters"); // redirect() throws internally — nothing after this line runs
}

const signupSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8, "Password must be at least 8 characters."),
  fullName: z.string().min(2, "Please enter your full name."),
});

export async function signup(
  _prevState: AuthFormState,
  formData: FormData
): Promise<AuthFormState> {
  const parsed = signupSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
    fullName: formData.get("fullName"),
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid input." };
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.signUp({
    email: parsed.data.email,
    password: parsed.data.password,
    options: { data: { full_name: parsed.data.fullName } },
  });
  if (error) return { error: error.message };

  // New users land with role='client' by default (see the handle_new_user
  // trigger in 0001_core_schema.sql). Promoting someone to
  // partner/associate/paralegal is a deliberate admin action — see the
  // "First real user" step in the migration plan — never something a
  // signup form itself should be trusted to set.
  redirect("/login?message=Check your email to confirm your account.");
}

export async function logout() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  revalidatePath("/", "layout");
  redirect("/login");
}
