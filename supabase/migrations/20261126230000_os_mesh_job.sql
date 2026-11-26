-- Meshy jobs, run by the meshy-studio edge function the same way os_art_job is run by art-studio.
-- A row only ever spends Meshy credits once, when it goes from queued to running. Nobody outside the
-- service role can insert or read rows: RLS on, no policies.
create table if not exists public.os_mesh_job (
  id bigserial primary key,
  kind text not null default 'multi' check (kind in ('multi', 'rig')),
  path text not null,
  refs text[] not null default '{}',
  params jsonb not null default '{}',
  task_id text,
  status text not null default 'queued',
  result jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
alter table public.os_mesh_job enable row level security;
insert into storage.buckets (id, name, public) values ('mesh', 'mesh', false) on conflict (id) do nothing;
-- Use: insert a row (kind 'multi', refs = up to 4 art-branch image paths, params e.g. {"pose_mode":"a-pose"}),
-- POST {"job": id} to /functions/v1/meshy-studio to start it, POST again to check it. When done, result.files
-- holds the model in the `mesh` bucket with 7-day links. A rig job: kind 'rig', params {"input_task_id": <multi task_id>}.
