import { createServerSupabaseClient } from '@/lib/supabase'
import { redirect } from 'next/navigation'
import { getLevelProgress } from '@/lib/xp'
import { SkillRadarChart } from '@/components/dashboard/skill-radar'
import { ActivePathWidget } from '@/components/dashboard/active-path-widget'
import { RecentActivity } from '@/components/dashboard/recent-activity'
import { AchievementShelf } from '@/components/dashboard/achievement-shelf'
import { StatsBar } from '@/components/dashboard/stats-bar'
import { WeakSpotAlert } from '@/components/dashboard/weak-spot-alert'
import { ProgressBar } from '@/components/ui/primitives'
import { Flame, Zap, Trophy } from 'lucide-react'

export const metadata = { title: 'Dashboard' }

export default async function DashboardPage() {
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  // Parallel data fetching
  const [
    { data: profile },
    { data: skillScores },
    { data: recentProgress },
    { data: achievements },
    { data: paths },
  ] = await Promise.all([
    supabase.from('users').select('*').eq('id', user.id).single(),
    supabase.from('skill_scores').select('*').eq('user_id', user.id),
    supabase
      .from('user_progress')
      .select('*, lesson:lessons(id, title, type, path_id)')
      .eq('user_id', user.id)
      .eq('status', 'complete')
      .order('completed_at', { ascending: false })
      .limit(5),
    supabase
      .from('user_achievements')
      .select('*, achievement:achievements(*)')
      .eq('user_id', user.id)
      .order('earned_at', { ascending: false })
      .limit(6),
    supabase
      .from('learning_paths')
      .select('*, lessons(id)')
      .order('order_index'),
  ])

  // Compute XP from progress
  const xpTotal = (recentProgress?.length ?? 0) * 10 // simplified — real: sum xp_reward
  const { level, progressPercent } = getLevelProgress(xpTotal)

  // Find weakest skill
  const weakest = skillScores?.sort((a, b) => a.score - b.score)[0] ?? null

  const displayName = profile?.full_name?.split(' ')[0] ?? 'there'
  const streak = profile?.current_streak ?? 0

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="font-serif text-3xl text-ink">
            {getGreeting()}, {displayName}
          </h1>
          <p className="text-[14px] text-ink-3 mt-1">
            {streak > 0
              ? `${streak}-day streak — keep it going`
              : 'Complete a lesson to start your streak'}
          </p>
        </div>

        {/* Level badge */}
        <div className="hidden sm:block text-right">
          <div className="inline-flex flex-col items-end gap-1.5 bg-paper border border-paper-3 rounded-lg px-4 py-3 shadow-card">
            <div className="flex items-center gap-2">
              <Zap className="w-3.5 h-3.5 text-accent" />
              <span className="font-mono text-[11px] text-ink-3 uppercase tracking-wide">
                Level {level.level}
              </span>
            </div>
            <p className="text-[13px] font-medium text-ink">{level.title}</p>
            <ProgressBar value={progressPercent} size="sm" color="accent" className="w-32" />
            <p className="font-mono text-[10px] text-ink-3">{xpTotal} XP</p>
          </div>
        </div>
      </div>

      {/* Stats bar */}
      <StatsBar
        streak={streak}
        longestStreak={profile?.longest_streak ?? 0}
        xpTotal={xpTotal}
        lessonsCompleted={recentProgress?.length ?? 0}
        achievementCount={achievements?.length ?? 0}
      />

      {/* Weak spot alert */}
      {weakest && weakest.score < 40 && (
        <WeakSpotAlert skill={weakest.skill} score={weakest.score} />
      )}

      {/* Main grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Skill radar — 2 cols */}
        <div className="lg:col-span-2 bg-paper border border-paper-3 rounded-lg p-5 shadow-card">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-medium text-[15px] text-ink">Your skill map</h2>
            <span className="font-mono text-[11px] text-ink-3">6 skills tracked</span>
          </div>
          <SkillRadarChart skillScores={skillScores ?? []} />
        </div>

        {/* Active path */}
        <div className="space-y-4">
          <ActivePathWidget paths={paths ?? []} userId={user.id} />
        </div>
      </div>

      {/* Bottom grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <RecentActivity progress={recentProgress ?? []} />
        <AchievementShelf achievements={achievements ?? []} />
      </div>
    </div>
  )
}

function getGreeting() {
  const h = new Date().getHours()
  if (h < 12) return 'Good morning'
  if (h < 17) return 'Good afternoon'
  return 'Good evening'
}
