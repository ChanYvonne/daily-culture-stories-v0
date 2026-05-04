alter table public.song_analyses
add column if not exists latency_ms integer check (latency_ms is null or latency_ms >= 0);
