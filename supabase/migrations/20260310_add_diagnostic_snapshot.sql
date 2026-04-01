alter table public.diagnostic_attempts
add column if not exists version integer not null default 1 check (version >= 1);

alter table public.diagnostic_attempts
add column if not exists diagnostic_snapshot jsonb not null default '{}'::jsonb;
