-- ─────────────────────────────────────────────────────────────────────────
-- Scalable Engineer Academy — Phase 1 Schema
-- Run: supabase db push
-- ─────────────────────────────────────────────────────────────────────────

-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- ── Users ──────────────────────────────────────────────────────────────────
create table if not exists public.users (
  id                    uuid primary key references auth.users(id) on delete cascade,
  username              text unique,
  full_name             text,
  avatar_url            text,
  plan                  text not null default 'free' check (plan in ('free','pro','team')),
  stripe_customer_id    text,
  stripe_subscription_id text,
  subscription_status   text check (subscription_status in ('active','cancelled','trialing','past_due')),
  current_streak        int not null default 0,
  longest_streak        int not null default 0,
  last_active_date      date,
  onboarding_complete   boolean not null default false,
  created_at            timestamptz not null default now(),
  updated_at            timestamptz not null default now()
);

alter table public.users enable row level security;
create policy "Users can read own profile"  on public.users for select using (auth.uid() = id);
create policy "Users can update own profile" on public.users for update using (auth.uid() = id);
create policy "Users can insert own profile" on public.users for insert with check (auth.uid() = id);

-- Auto-create profile on signup
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.users (id, full_name, avatar_url)
  values (
    new.id,
    new.raw_user_meta_data->>'full_name',
    new.raw_user_meta_data->>'avatar_url'
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- ── Learning paths ────────────────────────────────────────────────────────
create table if not exists public.learning_paths (
  id              uuid primary key default uuid_generate_v4(),
  slug            text unique not null,
  title           text not null,
  description     text not null default '',
  icon            text not null default '📚',
  order_index     int not null default 0,
  is_free         boolean not null default true,
  estimated_hours int not null default 2,
  skill_tags      text[] not null default '{}',
  created_at      timestamptz not null default now()
);

alter table public.learning_paths enable row level security;
create policy "Anyone can read learning paths" on public.learning_paths for select using (true);

-- ── Lessons ───────────────────────────────────────────────────────────────
create table if not exists public.lessons (
  id            uuid primary key default uuid_generate_v4(),
  path_id       uuid not null references public.learning_paths(id) on delete cascade,
  slug          text not null,
  title         text not null,
  content_mdx   text not null default '',
  order_index   int not null default 0,
  type          text not null default 'lesson' check (type in ('lesson','challenge','quiz','project')),
  xp_reward     int not null default 10,
  is_free       boolean not null default true,
  created_at    timestamptz not null default now(),
  unique (path_id, slug)
);

alter table public.lessons enable row level security;
create policy "Anyone can read lessons" on public.lessons for select using (true);

-- ── Quiz questions ────────────────────────────────────────────────────────
create table if not exists public.quiz_questions (
  id                uuid primary key default uuid_generate_v4(),
  lesson_id         uuid not null references public.lessons(id) on delete cascade,
  text              text not null,
  options           jsonb not null default '[]',
  correct_option_id text not null,
  explanation       text not null default '',
  order_index       int not null default 0,
  created_at        timestamptz not null default now()
);

alter table public.quiz_questions enable row level security;
create policy "Anyone can read quiz questions" on public.quiz_questions for select using (true);

-- ── User progress ─────────────────────────────────────────────────────────
create table if not exists public.user_progress (
  id                  uuid primary key default uuid_generate_v4(),
  user_id             uuid not null references public.users(id) on delete cascade,
  lesson_id           uuid not null references public.lessons(id) on delete cascade,
  status              text not null default 'not_started' check (status in ('not_started','in_progress','complete')),
  score               int,
  completed_at        timestamptz,
  time_spent_seconds  int not null default 0,
  created_at          timestamptz not null default now(),
  unique (user_id, lesson_id)
);

alter table public.user_progress enable row level security;
create policy "Users can read own progress"   on public.user_progress for select using (auth.uid() = user_id);
create policy "Users can insert own progress" on public.user_progress for insert with check (auth.uid() = user_id);
create policy "Users can update own progress" on public.user_progress for update using (auth.uid() = user_id);

-- ── Skill scores ──────────────────────────────────────────────────────────
create table if not exists public.skill_scores (
  id          uuid primary key default uuid_generate_v4(),
  user_id     uuid not null references public.users(id) on delete cascade,
  skill       text not null,
  score       int not null default 0 check (score >= 0 and score <= 100),
  updated_at  timestamptz not null default now(),
  unique (user_id, skill)
);

alter table public.skill_scores enable row level security;
create policy "Users can read own skills"   on public.skill_scores for select using (auth.uid() = user_id);
create policy "Users can upsert own skills" on public.skill_scores for insert with check (auth.uid() = user_id);
create policy "Users can update own skills" on public.skill_scores for update using (auth.uid() = user_id);

-- ── Achievements ──────────────────────────────────────────────────────────
create table if not exists public.achievements (
  id          uuid primary key default uuid_generate_v4(),
  key         text unique not null,
  title       text not null,
  description text not null default '',
  icon        text not null default '🏅',
  xp_reward   int not null default 0,
  created_at  timestamptz not null default now()
);

alter table public.achievements enable row level security;
create policy "Anyone can read achievements" on public.achievements for select using (true);

create table if not exists public.user_achievements (
  id             uuid primary key default uuid_generate_v4(),
  user_id        uuid not null references public.users(id) on delete cascade,
  achievement_id uuid not null references public.achievements(id) on delete cascade,
  earned_at      timestamptz not null default now(),
  unique (user_id, achievement_id)
);

alter table public.user_achievements enable row level security;
create policy "Users can read own achievements"   on public.user_achievements for select using (auth.uid() = user_id);
create policy "Service can insert achievements"   on public.user_achievements for insert with check (true);

-- ── Mentor conversations ──────────────────────────────────────────────────
create table if not exists public.mentor_conversations (
  id                  uuid primary key default uuid_generate_v4(),
  user_id             uuid not null references public.users(id) on delete cascade,
  messages            jsonb not null default '[]',
  context_lesson_id   uuid references public.lessons(id) on delete set null,
  context_design_id   uuid,
  message_count       int not null default 0,
  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now()
);

alter table public.mentor_conversations enable row level security;
create policy "Users can manage own conversations" on public.mentor_conversations
  for all using (auth.uid() = user_id);

-- ── Waitlist ──────────────────────────────────────────────────────────────
create table if not exists public.waitlist (
  id            uuid primary key default uuid_generate_v4(),
  email         text unique not null,
  source        text,
  referral_code text,
  created_at    timestamptz not null default now()
);

alter table public.waitlist enable row level security;
create policy "Anyone can insert waitlist" on public.waitlist for insert with check (true);

-- ─────────────────────────────────────────────────────────────────────────
-- Seed data
-- ─────────────────────────────────────────────────────────────────────────

insert into public.learning_paths (slug, title, description, icon, order_index, is_free, estimated_hours, skill_tags)
values
  ('foundations',    'Foundations',         'Client/server basics, HTTP, APIs, DNS, and how the web works end to end.',          '🌐', 0, true,  3, array['networking','databases']),
  ('databases',      'Databases & Storage', 'SQL, indexing, replication, sharding, and when to use which database.',              '🗄️', 1, true,  4, array['databases']),
  ('scalability',    'Scaling Systems',     'Load balancing, caching with Redis, message queues with Kafka, and horizontal scale.','⚡', 2, false, 4, array['caching','load_balancing','message_queues']),
  ('distributed',    'Distributed Systems', 'CAP theorem, consistency models, distributed transactions, and consensus.',           '🔗', 3, false, 5, array['distributed_systems']),
  ('system-design',  'System Design',       'Design YouTube, Discord, Uber from requirements to architecture.',                    '🏗️', 4, false, 6, array['databases','caching','distributed_systems'])
on conflict (slug) do nothing;

-- Seed achievements
insert into public.achievements (key, title, description, icon, xp_reward)
values
  ('first_lesson',    'First Step',         'Complete your first lesson',                            '👣', 10),
  ('first_design',    'Architect',          'Submit your first architecture design',                 '🏗️', 25),
  ('streak_7',        'Week Warrior',       '7-day learning streak',                                 '🔥', 50),
  ('streak_30',       'Committed',          '30-day learning streak',                                '💪', 100),
  ('quiz_perfect',    'Full Marks',         'Score 100% on any quiz',                                '💯', 20),
  ('path_complete',   'Path Master',        'Complete an entire learning path',                      '🎓', 75),
  ('design_90',       'Design Excellence',  'Get an architecture score of 90+',                     '⭐', 30),
  ('interview_ready', 'Interview Ready',    'Complete 5 interview practice sessions',                '💼', 40),
  ('all_skills_50',   'Well Rounded',       'Get all 6 skill scores above 50%',                     '🎯', 50),
  ('youtube_project', 'Built Like Google',  'Complete the YouTube system design project',            '▶️', 100),
  ('mentor_50',       'Curious Mind',       'Send 50 messages to the AI mentor',                    '🧠', 20)
on conflict (key) do nothing;
