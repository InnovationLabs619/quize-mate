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
  created_at timestamp with time zone default now()
);

-- 3. Questions & Options
create table questions (
  id uuid primary key default gen_random_uuid(),
  quiz_id uuid references quizzes(id) on delete cascade,
  question_text text not null,
  points integer default 1,
  created_at timestamp with time zone default now()
);

create table options (
  id uuid primary key default gen_random_uuid(),
  question_id uuid references questions(id) on delete cascade,
  option_text text not null,
  is_correct boolean default false
);

-- 4. Attempts & Performance
create table attempts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references profiles(id) on delete cascade,
  quiz_id uuid references quizzes(id) on delete cascade,
  score integer not null,
  total_points integer not null,
  time_spent integer, -- in seconds
  completed_at timestamp with time zone default now()
);

-- 5. Row Level Security (RLS)
alter table profiles enable row level security;
alter table quizzes enable row level security;
alter table questions enable row level security;
alter table options enable row level security;
alter table attempts enable row level security;
alter table badges enable row level security;
alter table user_badges enable row level security;

-- Policies
create policy "Anyone can view profiles" on profiles for select using (true);
create policy "Users can update their own profile" on profiles for update using (auth.uid() = id);

create policy "Anyone can view quizzes" on quizzes for select using (true);
create policy "Admins/Creators can manage quizzes" on quizzes for all using (auth.uid() = creator_id);

create policy "Anyone can view badges" on badges for select using (true);
create policy "Users can view their own badges" on user_badges for select using (auth.uid() = user_id);
