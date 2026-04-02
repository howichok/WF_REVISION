create table if not exists public.topic_coaching_memory (
  user_id uuid not null references public.profiles (id) on delete cascade,
  topic_id text not null,
  memory_snapshot jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  constraint topic_coaching_memory_pkey primary key (user_id, topic_id)
);

create index if not exists topic_coaching_memory_user_updated_idx
  on public.topic_coaching_memory (user_id, updated_at desc);

drop trigger if exists topic_coaching_memory_set_updated_at on public.topic_coaching_memory;
create trigger topic_coaching_memory_set_updated_at
before update on public.topic_coaching_memory
for each row execute function public.set_updated_at();

alter table public.topic_coaching_memory enable row level security;

drop policy if exists "topic_coaching_memory_manage_own" on public.topic_coaching_memory;
create policy "topic_coaching_memory_manage_own"
on public.topic_coaching_memory
for all
to authenticated
using (auth.uid() = user_id)
with check (auth.uid() = user_id);
