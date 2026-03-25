-- Advanced Schema for Quiz Mate (Gamification & Streaks)

-- 1. Profiles & Badges
create table profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  username text unique not null,
  avatar_url text,
  total_xp integer default 0,
  streak_count integer default 0,
  last_active_date date,
  created_at timestamp with time zone default now()
);

create table badges (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  description text,
  icon_url text,
  threshold_xp integer default 0
);

create table user_badges (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references profiles(id) on delete cascade,
  badge_id uuid references badges(id) on delete cascade,
  awarded_at timestamp with time zone default now()
);

-- 2. Quizzes (Added metadata for tasks/concepts)
create table quizzes (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  description text,
  category text,
  difficulty text check (difficulty in ('Easy', 'Medium', 'Hard')),
  creator_id uuid references auth.users(id) on delete cascade,
  tasks text[], -- Tasks to complete for the quiz
  concepts text[], -- Associated concepts/notes
  share_token text unique default encode(gen_random_bytes(12), 'hex'), -- For sharing
  is_live boolean default false, -- For live monitoring
  start_time timestamp with time zone, -- Fixed start time for contests
  duration_minutes integer, -- Exam duration in minutes
  created_at timestamp with time zone default now()
);

-- Active quiz sessions for live tracking
create table live_sessions (
  id uuid primary key default gen_random_uuid(),
  quiz_id uuid references quizzes(id) on delete cascade,
  user_id uuid references profiles(id) on delete cascade,
  current_score integer default 0,
  current_question_index integer default 0,
  status text check (status in ('active', 'completed', 'abandoned')),
  last_ping timestamp with time zone default now(),
  unique(quiz_id, user_id)
);

-- 3. Questions & Options
create table questions (
  id uuid primary key default gen_random_uuid(),
  quiz_id uuid references quizzes(id) on delete cascade,
  question_text text not null,
  type text default 'mcq', -- 'mcq' or 'programming'
  test_cases jsonb, -- Array of {input: string, output: string} for programming
  points integer default 1,
  created_at timestamp with time zone default now()
);

create table options (
  id uuid primary key default gen_random_uuid(),
  question_id uuid references questions(id) on delete cascade,
  option_text text not null,
  is_correct boolean default false,
  explanation text -- Why this is correct/incorrect
);

-- 4. Attempts & Performance
create table attempts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references profiles(id) on delete cascade,
  quiz_id uuid references quizzes(id) on delete cascade,
  score integer not null,
  total_points integer not null,
  time_spent integer, -- in seconds
  attempt_data jsonb, -- Store the user's answers for review
  completed_at timestamp with time zone default now()
);

-- 5. Row Level Security (RLS)
alter table profiles enable row level security;
alter table quizzes enable row level security;
alter table questions enable row level security;
alter table options enable row level security;
alter table live_sessions enable row level security;
alter table badges enable row level security;
alter table user_badges enable row level security;

-- Policies
create policy "Anyone can view live sessions" on live_sessions for select using (true);
create policy "Users can update their own live session" on live_sessions for all using (auth.uid() = user_id);
create policy "Anyone can view profiles" on profiles for select using (true);
create policy "Users can update their own profile" on profiles for update using (auth.uid() = id);

create policy "Anyone can view quizzes" on quizzes for select using (true);
create policy "Admins/Creators can manage quizzes" on quizzes for all using (auth.uid() = creator_id);

create policy "Anyone can view questions" on questions for select using (true);
create policy "Authenticated users can insert questions" on questions for insert with check (auth.role() = 'authenticated');

create policy "Anyone can view options" on options for select using (true);
create policy "Authenticated users can insert options" on options for insert with check (auth.role() = 'authenticated');

create policy "Anyone can view badges" on badges for select using (true);
create policy "Users can view their own badges" on user_badges for select using (auth.uid() = user_id);
