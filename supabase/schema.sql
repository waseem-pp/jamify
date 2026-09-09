-- Run this in Supabase → SQL Editor → New query → Run.

create table if not exists public.tracks (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  artist text,
  url text not null,
  owner uuid references auth.users(id) on delete cascade,
  created_at timestamptz default now()
);

create table if not exists public.rooms (
  id uuid primary key default gen_random_uuid(),
  code text unique not null,
  name text,
  host uuid references auth.users(id) on delete cascade,
  created_at timestamptz default now()
);

alter table public.tracks enable row level security;
alter table public.rooms  enable row level security;

-- Everyone signed in can see the shared library and every jam code.
create policy "read tracks" on public.tracks for select to authenticated using (true);
create policy "add own tracks" on public.tracks for insert to authenticated with check (auth.uid() = owner);
create policy "delete own tracks" on public.tracks for delete to authenticated using (auth.uid() = owner);

create policy "read rooms" on public.rooms for select to authenticated using (true);
create policy "create rooms" on public.rooms for insert to authenticated with check (auth.uid() = host);
create policy "host deletes room" on public.rooms for delete to authenticated using (auth.uid() = host);

-- Storage bucket for uploaded songs.
insert into storage.buckets (id, name, public)
values ('songs', 'songs', true)
on conflict (id) do nothing;

create policy "read songs" on storage.objects for select to authenticated
  using (bucket_id = 'songs');
create policy "upload songs" on storage.objects for insert to authenticated
  with check (bucket_id = 'songs' and (storage.foldername(name))[1] = auth.uid()::text);
