create extension if not exists pgcrypto;

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create table if not exists public.cultural_calendar (
  id uuid primary key default gen_random_uuid(),
  month integer not null check (month between 1 and 12),
  day integer not null check (day between 1 and 31),
  title text not null,
  title_chinese text,
  region text not null check (region in ('china', 'taiwan', 'shared')),
  kind text not null check (kind in ('holiday', 'historical_event', 'solar_term', 'festival', 'anniversary')),
  brief_context text not null,
  recurs_yearly boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.stories (
  id uuid primary key default gen_random_uuid(),
  story_date date not null,
  is_featured boolean not null default false,
  display_order integer not null default 0,
  slug text not null,
  category text not null check (category in ('Chinese History', 'Taiwanese History', 'Chinese Idiom', 'Language Lesson', 'Cultural Tradition')),
  title text not null,
  title_chinese text,
  summary text not null,
  content text not null,
  read_time integer not null check (read_time > 0),
  lesson_learned text,
  theme_key text,
  source_event_id uuid references public.cultural_calendar(id) on delete set null,
  content_hash text,
  model_name text,
  prompt_version text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.generation_runs (
  id uuid primary key default gen_random_uuid(),
  story_date date not null,
  status text not null check (status in ('queued', 'running', 'succeeded', 'failed', 'skipped')),
  model_name text,
  response_id text,
  error_message text,
  started_at timestamptz not null default now(),
  finished_at timestamptz,
  created_at timestamptz not null default now()
);

create unique index if not exists stories_slug_key on public.stories (slug);
create unique index if not exists stories_featured_story_date_key on public.stories (story_date) where is_featured = true;
create index if not exists stories_story_date_desc_idx on public.stories (story_date desc);
create index if not exists stories_story_date_display_order_idx on public.stories (story_date, display_order);

create trigger set_cultural_calendar_updated_at
before update on public.cultural_calendar
for each row
execute function public.set_updated_at();

create trigger set_stories_updated_at
before update on public.stories
for each row
execute function public.set_updated_at();

alter table public.stories enable row level security;
alter table public.cultural_calendar enable row level security;
alter table public.generation_runs enable row level security;

grant select on public.stories to anon, authenticated;

create policy "stories_public_read"
on public.stories
for select
to anon, authenticated
using (true);
