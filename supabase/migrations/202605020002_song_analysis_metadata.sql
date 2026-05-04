alter table public.song_analyses
add column if not exists release_year text,
add column if not exists genre_tags text[] not null default '{}';
