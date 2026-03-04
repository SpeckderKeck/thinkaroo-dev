-- Supabase Storage setup for user-bound CSV uploads
-- Run in Supabase SQL Editor

insert into storage.buckets (id, name, public)
values ('user-csv', 'user-csv', false)
on conflict (id) do nothing;

-- Read only files in own user-prefix: <uid>/...
create policy "user-csv read own prefix"
on storage.objects
for select
using (
  bucket_id = 'user-csv'
  and auth.uid()::text = (storage.foldername(name))[1]
);

-- Upload/create only in own user-prefix
create policy "user-csv insert own prefix"
on storage.objects
for insert
with check (
  bucket_id = 'user-csv'
  and auth.uid()::text = (storage.foldername(name))[1]
);

-- Update only own files
create policy "user-csv update own prefix"
on storage.objects
for update
using (
  bucket_id = 'user-csv'
  and auth.uid()::text = (storage.foldername(name))[1]
)
with check (
  bucket_id = 'user-csv'
  and auth.uid()::text = (storage.foldername(name))[1]
);

-- Delete only own files
create policy "user-csv delete own prefix"
on storage.objects
for delete
using (
  bucket_id = 'user-csv'
  and auth.uid()::text = (storage.foldername(name))[1]
);
