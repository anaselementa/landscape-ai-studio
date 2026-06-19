-- Landscape AI Studio V0.3

create extension if not exists pgcrypto;

create table if not exists public.projects (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  project_type text,
  location text,
  style text,
  constraints text,
  status text not null default 'draft',
  selected_idea_id uuid,
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
  concept_keywords jsonb not null default '[]'::jsonb,
  materials jsonb not null default '[]'::jsonb,
  plants jsonb not null default '[]'::jsonb,
  furniture jsonb not null default '[]'::jsonb,
  lighting jsonb not null default '[]'::jsonb,
  cost_level text,
  maintenance_level text,
  status text not null default 'suggested',
  selected boolean not null default false,
  is_demo boolean not null default false,
  demo_reason text,
  created_at timestamptz not null default now()
);

create table if not exists public.benchmarks (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects(id) on delete cascade,
  analysis_id uuid references public.analyses(id) on delete set null,
  selected_idea_id uuid references public.ideas(id) on delete set null,
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
  selected_idea_id uuid references public.ideas(id) on delete set null,
  plan_json jsonb not null,
  concept_svg text,
  realistic_image_prompt text,
  is_demo boolean not null default false,
  demo_reason text,
  created_at timestamptz not null default now()
);

alter table public.projects add column if not exists selected_idea_id uuid;
alter table public.ideas add column if not exists concept_keywords jsonb not null default '[]'::jsonb;
alter table public.ideas add column if not exists selected boolean not null default false;
alter table public.benchmarks add column if not exists selected_idea_id uuid;
alter table public.plans add column if not exists selected_idea_id uuid;
alter table public.plans add column if not exists concept_svg text;
alter table public.plans add column if not exists realistic_image_prompt text;

create index if not exists site_images_project_id_idx on public.site_images(project_id);
create index if not exists analyses_project_id_created_at_idx on public.analyses(project_id, created_at desc);
create index if not exists swots_project_id_created_at_idx on public.swots(project_id, created_at desc);
create index if not exists ideas_project_id_created_at_idx on public.ideas(project_id, created_at desc);
create index if not exists ideas_project_id_selected_idx on public.ideas(project_id, selected);
create index if not exists benchmarks_project_id_created_at_idx on public.benchmarks(project_id, created_at desc);
create index if not exists plans_project_id_created_at_idx on public.plans(project_id, created_at desc);

insert into storage.buckets (id, name, public)
values ('site-images', 'site-images', true)
on conflict (id) do update set public = excluded.public;

do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'storage'
      and tablename = 'objects'
      and policyname = 'Public read site images'
  ) then
    create policy "Public read site images"
    on storage.objects for select
    using (bucket_id = 'site-images');
  end if;
end $$;
