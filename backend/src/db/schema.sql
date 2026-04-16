create extension if not exists "pgcrypto";

create table if not exists public.micro_apps (
  id uuid primary key default gen_random_uuid(),
  owner_id text not null,
  name text not null,
  summary text not null,
  visibility text not null check (visibility in ('private', 'public', 'organization')),
  audience text not null,
  category text not null,
  generation_mode text not null,
  status text not null default 'draft' check (status in ('draft', 'building', 'ready', 'reviewing', 'failed')),
  deployment_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.generation_jobs (
  id uuid primary key default gen_random_uuid(),
  app_id uuid not null references public.micro_apps(id) on delete cascade,
  type text not null check (type in ('create', 'edit', 'rebuild')),
  status text not null default 'queued' check (status in ('queued', 'running', 'completed', 'failed')),
  prompt text not null,
  system_prompt text not null,
  created_at timestamptz not null default now()
);

create index if not exists micro_apps_owner_idx on public.micro_apps(owner_id, updated_at desc);
create index if not exists micro_apps_visibility_idx on public.micro_apps(visibility, updated_at desc);
create index if not exists generation_jobs_app_idx on public.generation_jobs(app_id, created_at desc);
