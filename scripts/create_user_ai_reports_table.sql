-- Create user_ai_reports table for caching AI report scores for 7 days
create table if not exists user_ai_reports (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  score integer not null check (score >= 0 and score <= 100),
  recommendation text not null,
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);

-- Create index for quick lookups by user_id
create index if not exists idx_user_ai_reports_user_id on user_ai_reports(user_id, created_at desc);

-- Enable RLS
alter table user_ai_reports enable row level security;

-- Allow users to read their own reports
create policy "Users can read their own AI reports"
  on user_ai_reports for select
  using (auth.uid() = user_id);

-- Allow authenticated users to insert their own reports
create policy "Users can insert their own AI reports"
  on user_ai_reports for insert
  with check (auth.uid() = user_id);
