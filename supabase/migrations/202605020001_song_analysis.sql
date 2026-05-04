create table if not exists public.song_analyses (
  id uuid primary key default gen_random_uuid(),
  source_type text not null check (source_type in ('spotify', 'youtube')),
  source_id text not null,
  source_url text not null,
  title text not null,
  artist text not null,
  album text,
  artwork_url text,
  lyrics_provider text not null,
  provider_track_id text,
  raw_lyrics text,
  analysis jsonb not null,
  model_name text,
  status text not null default 'published' check (status in ('published', 'failed')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index if not exists song_analyses_source_key on public.song_analyses (source_type, source_id);
create index if not exists song_analyses_created_at_desc_idx on public.song_analyses (created_at desc);

create trigger set_song_analyses_updated_at
before update on public.song_analyses
for each row
execute function public.set_updated_at();

alter table public.song_analyses enable row level security;

grant select on public.song_analyses to anon, authenticated;

create policy "song_analyses_public_read"
on public.song_analyses
for select
to anon, authenticated
using (status = 'published');
