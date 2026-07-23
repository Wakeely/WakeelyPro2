# Wakeely Pro — v2 Starter Kit (Next.js 15 + Supabase)

This is a **foundation**, not a finished app: real auth, real RBAC, real
Row Level Security, real file storage, and the bilingual RTL system —
wired up correctly so every module you migrate from the old prototype
inherits these guarantees automatically instead of needing its own
security logic.

## What's included
- `supabase/migrations/0001_core_schema.sql` — every table + RLS policy
- `supabase/migrations/0002_storage.sql` — private document storage bucket
- `src/lib/supabase/*` — browser + server Supabase clients, session middleware
- `src/lib/auth/permissions.ts` — RBAC helper (Partner/Associate/Paralegal/Client)
- `src/contexts/LanguageProvider.tsx` + `src/lib/i18n/*` — SSR-safe bilingual/RTL system
- `src/app/(auth)/*` — login/signup
- `src/app/(dashboard)/matters/page.tsx` — a fully working, RLS-secured example page
- `src/app/api/documents/upload/route.ts` — **real** file upload (replaces the old fake one)
- `src/app/api/ai/summarize/route.ts` — Gemini call, ported from the old `server.ts`

## Setup — run these in order

```bash
# 1. Unzip this kit into a fresh Next.js project
npx create-next-app@latest wakeely-pro --typescript --tailwind --eslint --app --src-dir --import-alias "@/*"
cd wakeely-pro
# now copy every file from this starter kit into the new project, overwriting
# the defaults create-next-app generated (package.json, tailwind.config.ts, etc.)

# 2. Install dependencies
npm install

# 3. Create a free Supabase project at https://supabase.com/dashboard
#    then copy your URL + anon key + service role key into a real .env.local
cp .env.example .env.local
# edit .env.local with your real values

# 4. Link the CLI to your project and push the schema
npx supabase login
npx supabase link --project-ref <your-project-ref>
npx supabase db push

# 5. Generate exact TypeScript types from your live schema
npm run supabase:types

# 6. Run it
npm run dev
```

Then open `http://localhost:3000`, sign up, and in the Supabase dashboard's
Table Editor open `profiles` → find your new row → set `role` to `partner`
and set a `firm_id` (create one row in `firms` first). That's your first
real admin account — see migration plan step 5 for why this has to be a
manual, deliberate step rather than something a signup form can set.

## Deploying to Vercel
1. Push this project to a GitHub repo.
2. Import it in Vercel.
3. Add the same environment variables from `.env.local` in Vercel's Project
   Settings → Environment Variables (mark `SUPABASE_SERVICE_ROLE_KEY` and
   `GEMINI_API_KEY` as **server-only** — never add `NEXT_PUBLIC_` to them).
4. Deploy. Unlike the old repo, there's no separate Express server and no
   `vercel.json` rewrite conflict — Next.js API routes ARE the backend, and
   Vercel runs them natively.
