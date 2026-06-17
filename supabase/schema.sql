-- Landscape AI Studio V0.1
-- Execute this file in the Supabase SQL editor.

create extension if not exists pgcrypto;

create table if not exists public.projects (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  project_type text,
  location text,
  style text,
  constraints text,
  status text not null default 'draft',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.site_images (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects(id) on delete cascade,
  title text,
  space_name text,
  storage_path text not null,
  public_url text not null,
  mime_type text,
  file_size bigint,
  created_at timestamptz not null default now()
);

create table if not exists public.analyses (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects(id) on delete cascade,
  summary text,
  analysis_json jsonb not null,
  is_demo boolean not null default false,
  demo_reason text,
  created_at timestamptz not null default now()
);

create table if not exists public.swots (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects(id) on delete cascade,
  analysis_id uuid references public.analyses(id) on delete set null,
  strengths jsonb not null default '[]'::jsonb,
  weaknesses jsonb not null default '[]'::jsonb,
  opportunities jsonb not null default '[]'::jsonb,
  threats jsonb not null default '[]'::jsonb,
  is_demo boolean not null default false,
  demo_reason text,
  created_at timestamptz not null default now()
);

create table if not exists public.ideas (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects(id) on delete cascade,
  analysis_id uuid references public.analyses(id) on delete set null,
  title text not null,
  description text,
  intervention_level text,
  materials jsonb not null default '[]'::jsonb,
  plants jsonb not null default '[]'::jsonb,
  furniture jsonb not null default '[]'::jsonb,
  lighting jsonb not null default '[]'::jsonb,
  cost_level text,
  maintenance_level text,
  status text not null default 'suggested',
  is_demo boolean not null default false,
  demo_reason text,
  created_at timestamptz not null default now()
);

create table if not exists public.benchmarks (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects(id) on delete cascade,
  analysis_id uuid references public.analyses(id) on delete set null,
  summary text,
  benchmark_json jsonb not null,
  is_demo boolean not null default false,
  demo_reason text,
  created_at timestamptz not null default now()
);

create table if not exists public.plans (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects(id) on delete cascade,
  analysis_id uuid references public.analyses(id) on delete set null,
  plan_json jsonb not null,
  realistic_plan_prompt text,
  is_demo boolean not null default false,
  demo_reason text,
  created_at timestamptz not null default now()
);

alter table public.analyses add column if not exists is_demo boolean not null default false;
alter table public.analyses add column if not exists demo_reason text;
alter table public.swots add column if not exists is_demo boolean not null default false;
alter table public.swots add column if not exists demo_reason text;
alter table public.ideas add column if not exists is_demo boolean not null default false;
alter table public.ideas add column if not exists demo_reason text;

create index if not exists site_images_project_id_idx on public.site_images(project_id);
create index if not exists analyses_project_id_created_at_idx on public.analyses(project_id, created_at desc);
create index if not exists swots_project_id_created_at_idx on public.swots(project_id, created_at desc);
create index if not exists ideas_project_id_created_at_idx on public.ideas(project_id, created_at desc);
create index if not exists benchmarks_project_id_created_at_idx on public.benchmarks(project_id, created_at desc);
create index if not exists plans_project_id_created_at_idx on public.plans(project_id, created_at desc);

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists projects_set_updated_at on public.projects;
create trigger projects_set_updated_at
before update on public.projects
for each row execute function public.set_updated_at();

insert into storage.buckets (id, name, public)
values ('site-images', 'site-images', true)
on conflict (id) do update set public = excluded.public;

do $$
begin
  if not exists (
    select 1
    from pg_policies
    where schemaname = 'storage'
      and tablename = 'objects'
      and policyname = 'Public read site images'
  ) then
    create policy "Public read site images"
    on storage.objects for select
    using (bucket_id = 'site-images');
  end if;
end $$;
