create table if not exists public.workforce_form_submissions (
  id uuid primary key default gen_random_uuid(),
  form_type text not null check (form_type in ('contact', 'employer')),
  fields jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  email_sent boolean not null default false,
  email_sent_at timestamptz
);

alter table public.workforce_form_submissions enable row level security;
revoke all on table public.workforce_form_submissions from anon, authenticated;
grant usage on schema public to service_role;
grant select, insert, update on table public.workforce_form_submissions to service_role;
