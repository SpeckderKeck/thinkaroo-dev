-- Supabase Storage setup for user-bound CSV uploads
-- Run in Supabase SQL Editor

insert into storage.buckets (id, name, public)
values ('cardsets', 'cardsets', false)
on conflict (id) do nothing;

-- Read only files in own folder: <uid>/<safeFileName>.csv
create policy "cardsets read own prefix"
on storage.objects
for select
using (
  bucket_id = 'cardsets'
  and auth.uid()::text = (storage.foldername(name))[1]
);

-- Upload/create only in own folder
create policy "cardsets insert own prefix"
on storage.objects
for insert
with check (
  bucket_id = 'cardsets'
  and auth.uid()::text = (storage.foldername(name))[1]
);

-- Update only own files
create policy "cardsets update own prefix"
on storage.objects
for update
using (
  bucket_id = 'cardsets'
  and auth.uid()::text = (storage.foldername(name))[1]
)
with check (
  bucket_id = 'cardsets'
  and auth.uid()::text = (storage.foldername(name))[1]
);

-- Delete only own files
create policy "cardsets delete own prefix"
on storage.objects
for delete
using (
  bucket_id = 'cardsets'
  and auth.uid()::text = (storage.foldername(name))[1]
);
