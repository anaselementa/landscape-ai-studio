-- Landscape AI Studio V0.2 — schema complet prototype
-- A executer dans Supabase > SQL Editor.
-- Ce script est volontairement ouvert pour prototype. A securiser avant une vraie mise en production client.

create extension if not exists pgcrypto;

create table if not exists projects (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  project_type text,
  location text,
  style text,
  constraints text,
  status text default 'draft',
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists site_images (
  id uuid primary key default gen_random_uuid(),
  project_id uuid references projects(id) on delete cascade,
  title text,
  space text,
  space_name text,
  image_url text,
  storage_path text,
  public_url text,
  file_name text,
  mime_type text,
  file_size bigint,
  size_bytes bigint,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists analyses (
  id uuid primary key default gen_random_uuid(),
  project_id uuid references projects(id) on delete cascade,
  image_id uuid references site_images(id) on delete set null,
  analysis jsonb,
  analysis_json jsonb,
  summary text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists swots (
  id uuid primary key default gen_random_uuid(),
  project_id uuid references projects(id) on delete cascade,
  image_id uuid references site_images(id) on delete set null,
  analysis_id uuid references analyses(id) on delete set null,
  strengths jsonb default '[]'::jsonb,
  weaknesses jsonb default '[]'::jsonb,
  opportunities jsonb default '[]'::jsonb,
  threats jsonb default '[]'::jsonb,
  summary text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists project_references (
  id uuid primary key default gen_random_uuid(),
  project_id uuid references projects(id) on delete cascade,
  analysis_id uuid references analyses(id) on delete set null,
  title text not null,
  description text,
  tags jsonb default '[]'::jsonb,
  image_query text,
  reason text,
  source_type text default 'ai_suggested',
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists ideas (
  id uuid primary key default gen_random_uuid(),
  project_id uuid references projects(id) on delete cascade,
  analysis_id uuid references analyses(id) on delete set null,
  title text not null,
  description text,
  intervention_level text,
  materials jsonb default '[]'::jsonb,
  plants jsonb default '[]'::jsonb,
  furniture jsonb default '[]'::jsonb,
  lighting jsonb default '[]'::jsonb,
  cost_level text,
  maintenance_level text,
  selected boolean default false,
  status text default 'suggested',
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists master_plans (
  id uuid primary key default gen_random_uuid(),
  project_id uuid references projects(id) on delete cascade,
  title text,
  file_name text,
  storage_path text,
  public_url text,
  mime_type text,
  file_size bigint,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists plan_zones (
  id uuid primary key default gen_random_uuid(),
  project_id uuid references projects(id) on delete cascade,
  master_plan_id uuid references master_plans(id) on delete cascade,
  name text not null,
  description text,
  site_image_id uuid references site_images(id) on delete set null,
  idea_id uuid references ideas(id) on delete set null,
  geometry jsonb,
  status text default 'mapped',
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists plan_renders (
  id uuid primary key default gen_random_uuid(),
  project_id uuid references projects(id) on delete cascade,
  master_plan_id uuid references master_plans(id) on delete set null,
  render_type text,
  title text,
  summary text,
  render_json jsonb,
  image_url text,
  status text default 'draft',
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists validations (
  id uuid primary key default gen_random_uuid(),
  project_id uuid references projects(id) on delete cascade,
  status text not null,
  notes text,
  created_at timestamptz default now()
);

-- Alignement si les tables existaient deja en V0.1
alter table projects
add column if not exists status text default 'draft',
add column if not exists updated_at timestamptz default now();

alter table site_images
add column if not exists title text,
add column if not exists space text,
add column if not exists space_name text,
add column if not exists image_url text,
add column if not exists storage_path text,
add column if not exists public_url text,
add column if not exists file_name text,
add column if not exists mime_type text,
add column if not exists file_size bigint,
add column if not exists size_bytes bigint,
add column if not exists updated_at timestamptz default now();

alter table analyses
add column if not exists analysis jsonb,
add column if not exists analysis_json jsonb,
add column if not exists summary text,
add column if not exists updated_at timestamptz default now();

alter table swots
add column if not exists analysis_id uuid references analyses(id) on delete set null,
add column if not exists summary text,
add column if not exists updated_at timestamptz default now();

alter table ideas
add column if not exists analysis_id uuid references analyses(id) on delete set null,
add column if not exists intervention_level text,
add column if not exists materials jsonb default '[]'::jsonb,
add column if not exists plants jsonb default '[]'::jsonb,
add column if not exists furniture jsonb default '[]'::jsonb,
add column if not exists lighting jsonb default '[]'::jsonb,
add column if not exists cost_level text,
add column if not exists maintenance_level text,
add column if not exists selected boolean default false,
add column if not exists status text default 'suggested',
add column if not exists updated_at timestamptz default now();

-- RLS ouvert pour prototype
alter table projects enable row level security;
alter table site_images enable row level security;
alter table analyses enable row level security;
alter table swots enable row level security;
alter table project_references enable row level security;
alter table ideas enable row level security;
alter table master_plans enable row level security;
alter table plan_zones enable row level security;
alter table plan_renders enable row level security;
alter table validations enable row level security;

-- Policies prototype tables
DO $$
DECLARE t text;
BEGIN
  FOREACH t IN ARRAY ARRAY['projects','site_images','analyses','swots','project_references','ideas','master_plans','plan_zones','plan_renders','validations']
  LOOP
    EXECUTE format('drop policy if exists prototype_%s_all on %I', t, t);
    EXECUTE format('create policy prototype_%s_all on %I for all to anon, authenticated using (true) with check (true)', t, t);
  END LOOP;
END $$;

-- Storage bucket site-images : a creer dans l'interface si absent.
-- Policies Storage ouvertes pour prototype.
drop policy if exists prototype_site_images_storage_read on storage.objects;
create policy prototype_site_images_storage_read on storage.objects
for select to anon, authenticated using (bucket_id = 'site-images');

drop policy if exists prototype_site_images_storage_insert on storage.objects;
create policy prototype_site_images_storage_insert on storage.objects
for insert to anon, authenticated with check (bucket_id = 'site-images');

drop policy if exists prototype_site_images_storage_update on storage.objects;
create policy prototype_site_images_storage_update on storage.objects
for update to anon, authenticated using (bucket_id = 'site-images') with check (bucket_id = 'site-images');

drop policy if exists prototype_site_images_storage_delete on storage.objects;
create policy prototype_site_images_storage_delete on storage.objects
for delete to anon, authenticated using (bucket_id = 'site-images');
