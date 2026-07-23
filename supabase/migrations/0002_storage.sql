-- ============================================================================
-- STORAGE: a private 'documents' bucket. Files are NEVER public — every
-- download goes through a short-lived signed URL generated server-side
-- after an RLS check on the `documents` table row.
-- ============================================================================

insert into storage.buckets (id, name, public)
values ('documents', 'documents', false)
on conflict (id) do nothing;

-- Storage object paths are namespaced as: {matter_id}/{document_id}/{filename}
-- so policies can reuse the same can_access_matter() logic as the table above.

create policy "storage: attorneys upload to their matters"
  on storage.objects for insert
  with check (
    bucket_id = 'documents'
    and public.is_attorney()
    and public.can_access_matter((storage.foldername(name))[1]::uuid)
  );

create policy "storage: attorneys read their matters"
  on storage.objects for select
  using (
    bucket_id = 'documents'
    and public.is_attorney()
    and public.can_access_matter((storage.foldername(name))[1]::uuid)
  );

create policy "storage: clients read only shared documents"
  on storage.objects for select
  using (
    bucket_id = 'documents'
    and public.current_role() = 'client'
    and exists (
      select 1 from documents d
      where d.storage_path = storage.objects.name
        and d.visible_to_client = true
        and public.can_access_matter(d.matter_id)
    )
  );

create policy "storage: attorneys delete own matter files"
  on storage.objects for delete
  using (
    bucket_id = 'documents'
    and public.is_attorney()
    and public.can_access_matter((storage.foldername(name))[1]::uuid)
  );
