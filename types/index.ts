// ─── Database Row Types ────────────────────────────────────────────────────

export type UserPlan = 'free' | 'pro' | 'team'
export type SubscriptionStatus = 'active' | 'cancelled' | 'trialing' | 'past_due'
export type LessonType = 'lesson' | 'challenge' | 'quiz' | 'project'
export type ProgressStatus = 'not_started' | 'in_progress' | 'complete'

export interface UserProfile {
  id: string
  username: string | null
  full_name: string | null
  avatar_url: string | null
  plan: UserPlan
  stripe_customer_id: string | null
  stripe_subscription_id: string | null
  subscription_status: SubscriptionStatus | null
  current_streak: number
  longest_streak: number
  last_active_date: string | null
  onboarding_complete: boolean
  created_at: string
}

export interface LearningPath {
  id: string
  slug: string
  title: string
  description: string
  icon: string
  order_index: number
  is_free: boolean
  estimated_hours: number
  skill_tags: string[]
}

export interface Lesson {
  id: string
  path_id: string
  slug: string
  title: string
  content_mdx: string
  order_index: number
  type: LessonType
  xp_reward: number
  is_free: boolean
}

export interface UserProgress {
  id: string
  user_id: string
  lesson_id: string
  status: ProgressStatus
  score: number | null
  completed_at: string | null
  time_spent_seconds: number
}

export interface SkillScore {
  id: string
  user_id: string
  skill: string
  score: number
  updated_at: string
}

export interface Achievement {
  id: string
  key: string
  title: string
  description: string
  icon: string
  xp_reward: number
}

export interface UserAchievement {
  id: string
  user_id: string
  achievement_id: string
  earned_at: string
  achievement?: Achievement
}

export interface MentorConversation {
  id: string
  user_id: string
  messages: MentorMessage[]
  context_lesson_id: string | null
  context_design_id: string | null
  message_count: number
  created_at: string
  updated_at: string
}

export interface MentorMessage {
  role: 'user' | 'assistant' | 'system'
  content: string
}

// ─── Component Prop Types ──────────────────────────────────────────────────

export interface LessonWithProgress extends Lesson {
  progress?: UserProgress
}

export interface PathWithProgress extends LearningPath {
  lessons?: LessonWithProgress[]
  completedCount?: number
  totalCount?: number
  progressPercent?: number
}

export interface DashboardData {
  user: UserProfile
  skillScores: SkillScore[]
  recentProgress: (UserProgress & { lesson: Lesson })[]
  achievements: UserAchievement[]
  activePath: PathWithProgress | null
  xpTotal: number
  level: number
  levelTitle: string
}

// ─── Quiz Types ────────────────────────────────────────────────────────────

export interface QuizQuestion {
  id: string
  text: string
  options: { id: string; text: string }[]
  correctOptionId: string
  explanation: string
}

export interface QuizSubmission {
  lessonId: string
  answers: { questionId: string; selectedOptionId: string }[]
}

export interface QuizResult {
  score: number
  xpEarned: number
  correct: number
  total: number
  explanations: { questionId: string; correct: boolean; explanation: string }[]
}

// ─── API Response Types ────────────────────────────────────────────────────

export interface ApiResponse<T> {
  data?: T
  error?: string
}

export type XPLevel = {
  level: number
  title: string
  xpRequired: number
  xpNext: number
}
