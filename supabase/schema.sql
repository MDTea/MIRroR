-- MIRROR relationship threads.
-- The app talks to Postgres with the service role on the server.
-- Authentication is intentionally skipped. Do not put the service role key in the browser.

create table if not exists public.threads (
  id uuid primary key,
  slug text not null,
  payload jsonb not null,
  updated_at timestamptz not null default now()
);

create index if not exists threads_slug_idx on public.threads (slug);
create index if not exists threads_updated_idx on public.threads (updated_at desc);

alter table public.threads enable row level security;
