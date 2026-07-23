-- ============================================================================
-- WAKEELY PRO — CORE SCHEMA + ROW LEVEL SECURITY
-- Run this in the Supabase SQL editor, or via `supabase db push`.
-- ============================================================================

-- ---------- Extensions ----------
create extension if not exists "pgcrypto";

-- ---------- Enums ----------
create type user_role as enum ('partner', 'associate', 'paralegal', 'client');
create type risk_level as enum ('Low', 'Medium', 'High');
create type matter_status as enum ('Active', 'On Hold', 'Closed', 'Archived');
create type task_status as enum ('To Do', 'In Progress', 'Under Review', 'Completed');
create type priority_level as enum ('Low', 'Medium', 'High');
create type invoice_status as enum ('Draft', 'Sent', 'Paid', 'Overdue');
create type privilege_type as enum (
  'Attorney-Client Privilege', 'Work-Product Doctrine',
  'Common Interest Privilege', 'Bank Confidentiality', 'Sharia Professional Secrecy'
);
create type review_status as enum ('Flagged', 'Verified', 'Withheld');

-- ============================================================================
-- FIRMS + USERS
-- A "firm" is the tenant boundary. Every table below is scoped to a firm.
-- ============================================================================

create table firms (
  id          uuid primary key default gen_random_uuid(),
  name        text not null,
  created_at  timestamptz not null default now()
);

-- One row per authenticated user, created automatically on signup (see trigger below).
create table profiles (
  id          uuid primary key references auth.users(id) on delete cascade,
  firm_id     uuid references firms(id) on delete set null,
  full_name   text not null default '',
  role        user_role not null default 'client',
  avatar_url  text,
  created_at  timestamptz not null default now()
);

-- Auto-create a profile row whenever a new auth.users row appears.
create function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, full_name, role)
  values (new.id, coalesce(new.raw_user_meta_data->>'full_name', ''), 'client');
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- ============================================================================
-- MATTERS (cases) + per-matter access control ("ethical wall")
-- ============================================================================

create table matters (
  id                    uuid primary key default gen_random_uuid(),
  firm_id               uuid not null references firms(id) on delete cascade,
  title                 text not null,
  description           text,
  client_name           text not null,
  client_email          text not null,
  client_user_id        uuid references profiles(id), -- links a client login to this matter
  jurisdiction          text,
  opposing_party        text,
  opposing_counsel      text,
  judge                 text,
  court                 text,
  statute_of_limitations date,
  risk_level            risk_level not null default 'Medium',
  status                matter_status not null default 'Active',
  win_probability       int check (win_probability between 0 and 100),
  budget                numeric(14,2) default 0,
  expenses              numeric(14,2) default 0,
  created_by            uuid references profiles(id),
  created_at            timestamptz not null default now()
);

-- Explicit staffing table: only attorneys listed here (or firm partners) can see a matter.
-- This is what makes conflict walls / need-to-know actually enforceable.
create table matter_members (
  matter_id   uuid not null references matters(id) on delete cascade,
  user_id     uuid not null references profiles(id) on delete cascade,
  added_at    timestamptz not null default now(),
  primary key (matter_id, user_id)
);

-- ============================================================================
-- DOCUMENTS (real files, in Supabase Storage — see storage policies below)
-- ============================================================================

create table documents (
  id                  uuid primary key default gen_random_uuid(),
  matter_id           uuid not null references matters(id) on delete cascade,
  name                text not null,
  category            text default 'General',
  storage_path        text not null,       -- path inside the 'documents' storage bucket
  file_size_bytes     bigint not null default 0,
  mime_type           text,
  uploaded_by         uuid references profiles(id),
  uploaded_at         timestamptz not null default now(),
  visible_to_client   boolean not null default false,
  version             int not null default 1,
  parent_document_id  uuid references documents(id), -- version chain
  is_redacted         boolean not null default false,
  redacted_from_id    uuid references documents(id),
  ai_summary          text,
  ai_tags             text[] default '{}'
);

-- ============================================================================
-- TASKS
-- ============================================================================

create table tasks (
  id                  uuid primary key default gen_random_uuid(),
  matter_id           uuid not null references matters(id) on delete cascade,
  title               text not null,
  description         text,
  assigned_to         uuid references profiles(id),
  due_date            date,
  priority            priority_level not null default 'Medium',
  status              task_status not null default 'To Do',
  visible_to_client   boolean not null default false,
  depends_on_task_ids uuid[] default '{}',
  created_at          timestamptz not null default now()
);

-- ============================================================================
-- BILLING
-- ============================================================================

create table time_entries (
  id            uuid primary key default gen_random_uuid(),
  matter_id     uuid not null references matters(id) on delete cascade,
  description   text not null,
  hours         numeric(6,2) not null,
  rate          numeric(10,2) not null,
  entry_date    date not null default current_date,
  billed        boolean not null default false,
  task_code     text,       -- UTBMS e.g. L110
  activity_code text,       -- UTBMS e.g. A101
  created_by    uuid references profiles(id),
  created_at    timestamptz not null default now()
);

create table invoices (
  id              uuid primary key default gen_random_uuid(),
  matter_id       uuid not null references matters(id) on delete cascade,
  invoice_number  text not null,
  total_amount    numeric(14,2) not null,
  status          invoice_status not null default 'Draft',
  issue_date      date not null default current_date,
  due_date        date,
  payment_tx_id   text
);

-- ============================================================================
-- TIMELINE / CALENDAR
-- ============================================================================

create table timeline_events (
  id                uuid primary key default gen_random_uuid(),
  matter_id         uuid not null references matters(id) on delete cascade,
  title             text not null,
  description       text,
  event_date        date not null,
  visible_to_client boolean not null default false,
  event_type        text
);

create table calendar_events (
  id                        uuid primary key default gen_random_uuid(),
  matter_id                 uuid not null references matters(id) on delete cascade,
  title                     text not null,
  description               text,
  start_date                date not null,
  event_time                text,
  location                  text,
  category                  text,
  synced_to_google_calendar boolean not null default false,
  google_event_id           text
);

-- ============================================================================
-- DEPOSITIONS
-- ============================================================================

create table deposition_transcripts (
  id                     uuid primary key default gen_random_uuid(),
  matter_id              uuid not null references matters(id) on delete cascade,
  witness_name           text not null,
  witness_role           text,
  deposition_date        date,
  deponent_party         text,
  key_admissions_summary text,
  uploaded_at            timestamptz not null default now()
);

create table transcript_pages (
  id                uuid primary key default gen_random_uuid(),
  transcript_id     uuid not null references deposition_transcripts(id) on delete cascade,
  page_number       int not null,
  line_number       text,
  page_timestamp    text,
  speaker           text,
  text              text,
  is_key_admission  boolean not null default false,
  tags              text[] default '{}'
);

-- ============================================================================
-- PRIVILEGE LOG (the most sensitive table in the whole app)
-- ============================================================================

create table privilege_log_entries (
  id                uuid primary key default gen_random_uuid(),
  matter_id         uuid not null references matters(id) on delete cascade,
  doc_control_num   text not null,
  doc_date          date,
  author            text,
  recipients        text,
  doc_type          text,
  subject           text,
  privilege_claimed privilege_type not null,
  justification     text,
  is_redacted       boolean not null default true,
  review_status     review_status not null default 'Flagged',
  created_at        timestamptz not null default now()
);

-- ============================================================================
-- CLIENT MESSAGES
-- ============================================================================

create table client_messages (
  id          uuid primary key default gen_random_uuid(),
  matter_id   uuid not null references matters(id) on delete cascade,
  sender_id   uuid not null references profiles(id),
  sender_role user_role not null,
  text        text not null,
  created_at  timestamptz not null default now()
);

-- ============================================================================
-- AUDIT LOG — who touched what, when. Non-negotiable for a legal product.
-- ============================================================================

create table audit_log (
  id          bigint generated always as identity primary key,
  actor_id    uuid references profiles(id),
  matter_id   uuid references matters(id),
  action      text not null,      -- e.g. 'document.view', 'privilege_log.export'
  target_table text,
  target_id   uuid,
  metadata    jsonb,
  created_at  timestamptz not null default now()
);

-- ============================================================================
-- HELPER FUNCTIONS (used by RLS policies below)
-- ============================================================================

create function public.current_role() returns user_role
language sql stable security definer set search_path = public as $$
  select role from profiles where id = auth.uid();
$$;

create function public.current_firm() returns uuid
language sql stable security definer set search_path = public as $$
  select firm_id from profiles where id = auth.uid();
$$;

-- Can this user see this matter at all? Partners see every matter in their firm.
-- Associates/paralegals need an explicit matter_members row. Clients need to be
-- the matter's client_user_id.
create function public.can_access_matter(target_matter_id uuid) returns boolean
language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from matters m
    where m.id = target_matter_id
      and (
        (public.current_role() = 'partner' and m.firm_id = public.current_firm())
        or exists (
          select 1 from matter_members mm
          where mm.matter_id = m.id and mm.user_id = auth.uid()
        )
        or (public.current_role() = 'client' and m.client_user_id = auth.uid())
      )
  );
$$;

create function public.is_attorney() returns boolean
language sql stable security definer set search_path = public as $$
  select public.current_role() in ('partner', 'associate', 'paralegal');
$$;

-- ============================================================================
-- ENABLE RLS ON EVERYTHING
-- ============================================================================

alter table firms enable row level security;
alter table profiles enable row level security;
alter table matters enable row level security;
alter table matter_members enable row level security;
alter table documents enable row level security;
alter table tasks enable row level security;
alter table time_entries enable row level security;
alter table invoices enable row level security;
alter table timeline_events enable row level security;
alter table calendar_events enable row level security;
alter table deposition_transcripts enable row level security;
alter table transcript_pages enable row level security;
alter table privilege_log_entries enable row level security;
alter table client_messages enable row level security;
alter table audit_log enable row level security;

-- ---------- profiles ----------
create policy "profiles: read own firm" on profiles for select
  using (firm_id = public.current_firm() or id = auth.uid());
create policy "profiles: update own" on profiles for update
  using (id = auth.uid());

-- ---------- matters ----------
create policy "matters: select if accessible" on matters for select
  using (public.can_access_matter(id));
create policy "matters: insert by attorneys" on matters for insert
  with check (public.is_attorney() and firm_id = public.current_firm());
create policy "matters: update by staffed attorneys" on matters for update
  using (public.is_attorney() and public.can_access_matter(id));

-- ---------- matter_members ----------
create policy "matter_members: select if accessible" on matter_members for select
  using (public.can_access_matter(matter_id));
create policy "matter_members: managed by partners" on matter_members for all
  using (public.current_role() = 'partner')
  with check (public.current_role() = 'partner');

-- ---------- documents (client sees ONLY visible_to_client = true) ----------
create policy "documents: attorneys full access" on documents for select
  using (public.is_attorney() and public.can_access_matter(matter_id));
create policy "documents: clients see shared only" on documents for select
  using (
    public.current_role() = 'client'
    and visible_to_client = true
    and public.can_access_matter(matter_id)
  );
create policy "documents: attorneys write" on documents for insert
  with check (public.is_attorney() and public.can_access_matter(matter_id));
create policy "documents: attorneys update" on documents for update
  using (public.is_attorney() and public.can_access_matter(matter_id));

-- ---------- tasks (same visible_to_client pattern) ----------
create policy "tasks: attorneys full access" on tasks for select
  using (public.is_attorney() and public.can_access_matter(matter_id));
create policy "tasks: clients see shared only" on tasks for select
  using (public.current_role() = 'client' and visible_to_client = true and public.can_access_matter(matter_id));
create policy "tasks: attorneys write" on tasks for insert
  with check (public.is_attorney() and public.can_access_matter(matter_id));
create policy "tasks: attorneys update" on tasks for update
  using (public.is_attorney() and public.can_access_matter(matter_id));

-- ---------- billing: attorneys only, never exposed to clients directly ----------
create policy "time_entries: attorneys only" on time_entries for all
  using (public.is_attorney() and public.can_access_matter(matter_id))
  with check (public.is_attorney() and public.can_access_matter(matter_id));

create policy "invoices: attorneys manage" on invoices for all
  using (public.is_attorney() and public.can_access_matter(matter_id))
  with check (public.is_attorney() and public.can_access_matter(matter_id));
create policy "invoices: clients read own" on invoices for select
  using (public.current_role() = 'client' and public.can_access_matter(matter_id));

-- ---------- timeline / calendar ----------
create policy "timeline: attorneys full access" on timeline_events for select
  using (public.is_attorney() and public.can_access_matter(matter_id));
create policy "timeline: clients see shared only" on timeline_events for select
  using (public.current_role() = 'client' and visible_to_client = true and public.can_access_matter(matter_id));
create policy "timeline: attorneys write" on timeline_events for all
  using (public.is_attorney() and public.can_access_matter(matter_id))
  with check (public.is_attorney() and public.can_access_matter(matter_id));

create policy "calendar: attorneys manage" on calendar_events for all
  using (public.is_attorney() and public.can_access_matter(matter_id))
  with check (public.is_attorney() and public.can_access_matter(matter_id));

-- ---------- depositions & privilege log: attorneys ONLY, never clients ----------
create policy "transcripts: attorneys only" on deposition_transcripts for all
  using (public.is_attorney() and public.can_access_matter(matter_id))
  with check (public.is_attorney() and public.can_access_matter(matter_id));

create policy "transcript_pages: attorneys only" on transcript_pages for all
  using (public.is_attorney() and exists (
    select 1 from deposition_transcripts dt
    where dt.id = transcript_id and public.can_access_matter(dt.matter_id)
  ))
  with check (public.is_attorney());

create policy "privilege_log: attorneys only" on privilege_log_entries for all
  using (public.is_attorney() and public.can_access_matter(matter_id))
  with check (public.is_attorney() and public.can_access_matter(matter_id));

-- ---------- client messages: both sides can read/write on their own matter ----------
create policy "messages: participants read" on client_messages for select
  using (public.can_access_matter(matter_id));
create policy "messages: participants write own" on client_messages for insert
  with check (sender_id = auth.uid() and public.can_access_matter(matter_id));

-- ---------- audit log: append-only, readable by partners only ----------
create policy "audit: partners read" on audit_log for select
  using (public.current_role() = 'partner' and matter_id is not null and public.can_access_matter(matter_id));
create policy "audit: any authenticated user can write their own actions" on audit_log for insert
  with check (actor_id = auth.uid());
