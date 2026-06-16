-- Landscape AI Studio V0.1
-- À exécuter dans Supabase SQL Editor.

create extension if not exists pgcrypto;

create table if not exists public.projects (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  project_type text,
  location text,
  style text,
  constraints text,
  budget_level text,
  status text default 'draft',
  created_at timestamptz default now(),
  updated_at timestamptz default now()
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
  created_at timestamptz default now()
);

create table if not exists public.image_analyses (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects(id) on delete cascade,
  site_image_id uuid not null references public.site_images(id) on delete cascade,
  analysis_json jsonb not null,
  summary text,
  created_at timestamptz default now()
);

create table if not exists public.design_ideas (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects(id) on delete cascade,
  site_image_id uuid not null references public.site_images(id) on delete cascade,
  title text not null,
  description text,
  intervention_level text,
  materials jsonb default '[]'::jsonb,
  plants jsonb default '[]'::jsonb,
  furniture jsonb default '[]'::jsonb,
  lighting jsonb default '[]'::jsonb,
  cost_level text,
  maintenance_level text,
  status text default 'suggested',
  created_at timestamptz default now()
);

-- Bucket public simplifié pour MVP.
-- Plus tard, il faudra passer en bucket privé + signed URLs.
insert into storage.buckets (id, name, public)
values ('site-images', 'site-images', true)
on conflict (id) do nothing;

-- Politique simplifiée pour permettre l'affichage public des images du prototype.
-- Le code serveur utilise la service role key pour uploader.
create policy if not exists "Public read site images"
on storage.objects for select
using (bucket_id = 'site-images');
