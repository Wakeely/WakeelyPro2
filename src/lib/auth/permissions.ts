// Central place for "who is allowed to do what" at the APPLICATION layer.
// This is a convenience/UX layer only (e.g. hiding a button a client
// shouldn't see) — it is NOT the security boundary. The real boundary is
// the Row Level Security policies in supabase/migrations/0001_core_schema.sql,
// which apply even if this file has a bug or is bypassed entirely.

export type UserRole = "partner" | "associate" | "paralegal" | "client";

export interface CurrentUser {
  id: string;
  role: UserRole;
  firmId: string | null;
  fullName: string;
}

export const isAttorney = (role: UserRole) =>
  role === "partner" || role === "associate" || role === "paralegal";

export const isPartner = (role: UserRole) => role === "partner";

export const can = {
  viewPrivilegeLog: (role: UserRole) => isAttorney(role),
  viewBilling: (role: UserRole) => isAttorney(role),
  editMatter: (role: UserRole) => isAttorney(role),
  deleteMatter: (role: UserRole) => isPartner(role),
  manageMatterStaffing: (role: UserRole) => isPartner(role),
  toggleClientVisibility: (role: UserRole) => isAttorney(role),
  uploadDocument: (role: UserRole) => isAttorney(role),
  viewTranscripts: (role: UserRole) => isAttorney(role),
  useAiDrafting: (role: UserRole) => isAttorney(role),
};

/**
 * Fetch the current user's profile (role + firm) from Supabase.
 * Call this at the top of any Server Component / Server Action / Route
 * Handler that needs to branch on role. Throws if not authenticated —
 * callers in protected routes can let this bubble up since middleware
 * already guarantees a session exists there.
 */
export async function getCurrentUser(): Promise<CurrentUser> {
  const { createClient } = await import("@/lib/supabase/server");
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) throw new Error("Not authenticated");

  const { data: profile, error } = await supabase
    .from("profiles")
    .select("id, role, firm_id, full_name")
    .eq("id", user.id)
    .single();

  if (error || !profile) throw new Error("Profile not found");

  return {
    id: profile.id,
    role: profile.role as UserRole,
    firmId: profile.firm_id,
    fullName: profile.full_name,
  };
}
