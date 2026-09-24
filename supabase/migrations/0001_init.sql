-- Profile data for each signed-up user, one row per auth user.
create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  email text not null,
  full_name text,
  resume_path text,              -- path in the "resumes" storage bucket
  resume_text text,               -- extracted plain text, used for matching
  keywords text[] not null default '{}',  -- e.g. {"defense tech","cyber","intern","remote"}
  remote_only boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.profiles enable row level security;

create policy "Users can view their own profile"
  on public.profiles for select
  using (auth.uid() = id);

create policy "Users can update their own profile"
  on public.profiles for update
  using (auth.uid() = id);

create policy "Users can insert their own profile"
  on public.profiles for insert
  with check (auth.uid() = id);

-- Jobs found by a given day's scan, deduped per user by source+external id.
create table if not exists public.job_matches (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  source text not null,            -- 'adzuna' | 'remoteok' | 'usajobs'
  external_id text not null,
  title text not null,
  company text,
  location text,
  remote boolean not null default false,
  url text not null,
  description text,
  score numeric not null default 0,  -- 0-100 match score
  matched_keywords text[] not null default '{}',
  posted_at timestamptz,
  found_at timestamptz not null default now(),
  unique (user_id, source, external_id)
);

alter table public.job_matches enable row level security;

create policy "Users can view their own job matches"
  on public.job_matches for select
  using (auth.uid() = user_id);

-- Inserts/updates during the daily scan happen with the service role key,
-- which bypasses RLS, so no insert/update policy is needed for end users.

create index if not exists job_matches_user_found_idx
  on public.job_matches (user_id, found_at desc);

-- Storage bucket for uploaded resumes (private; access via signed URLs only).
insert into storage.buckets (id, name, public)
values ('resumes', 'resumes', false)
on conflict (id) do nothing;

create policy "Users can upload their own resume"
  on storage.objects for insert
  with check (bucket_id = 'resumes' and auth.uid()::text = (storage.foldername(name))[1]);

create policy "Users can read their own resume"
  on storage.objects for select
  using (bucket_id = 'resumes' and auth.uid()::text = (storage.foldername(name))[1]);

create policy "Users can replace their own resume"
  on storage.objects for update
  using (bucket_id = 'resumes' and auth.uid()::text = (storage.foldername(name))[1]);
