import Link from 'next/link'
import { cn, formatRelativeTime } from '@/lib/utils'
import { BookOpen, ChevronRight, Trophy, AlertTriangle, CheckCircle2, Zap } from 'lucide-react'
import type { LearningPath, UserProgress, UserAchievement } from '@/types'
import { ProgressBar } from '@/components/ui/primitives'

// ─── Active Path Widget ─────────────────────────────────────────────────────

interface ActivePathWidgetProps {
  paths: (LearningPath & { lessons: { id: string }[] })[]
  userId: string
}

export function ActivePathWidget({ paths }: ActivePathWidgetProps) {
  const firstPath = paths[0]

  if (!firstPath) {
    return (
      <div className="bg-paper border border-paper-3 rounded-lg p-5 shadow-card h-full flex flex-col items-center justify-center text-center gap-3">
        <BookOpen className="w-8 h-8 text-ink-3" />
        <p className="text-[14px] font-medium text-ink">Start learning</p>
        <p className="text-[13px] text-ink-3">Pick a learning path to begin.</p>
        <Link
          href="/learn"
          className="mt-1 inline-flex items-center gap-1 text-[13px] font-medium text-accent hover:text-accent-2 transition-colors"
        >
          Browse paths <ChevronRight className="w-3.5 h-3.5" />
        </Link>
      </div>
    )
  }

  const total = firstPath.lessons?.length ?? 0
  const pct = total > 0 ? Math.round((0 / total) * 100) : 0

  return (
    <div className="bg-paper border border-paper-3 rounded-lg p-5 shadow-card">
      <div className="flex items-center justify-between mb-4">
        <h2 className="font-medium text-[15px] text-ink">Continue learning</h2>
        <Link
          href="/learn"
          className="text-[12px] text-ink-3 hover:text-accent transition-colors font-mono"
        >
          All paths →
        </Link>
      </div>

      <div className="space-y-3">
        {paths.slice(0, 3).map((path, i) => (
          <Link
            key={path.id}
            href={`/learn/${path.slug}`}
            className={cn(
              'flex items-center gap-3 p-3 rounded border transition-all duration-150 group',
              i === 0
                ? 'border-ink/20 bg-ink text-paper'
                : 'border-paper-3 bg-paper-2 hover:border-ink-2 hover:bg-paper'
            )}
          >
            <div className={cn(
              'w-9 h-9 rounded flex items-center justify-center text-lg flex-shrink-0',
              i === 0 ? 'bg-white/10' : 'bg-paper-3'
            )}>
              {path.icon}
            </div>
            <div className="flex-1 min-w-0">
              <p className={cn(
                'text-[13px] font-medium truncate',
                i === 0 ? 'text-paper' : 'text-ink'
              )}>
                {path.title}
              </p>
              <div className="flex items-center gap-2 mt-1">
                <ProgressBar
                  value={i === 0 ? pct : 0}
                  size="sm"
                  color={i === 0 ? 'green' : 'accent'}
                  className="flex-1"
                />
                <span className={cn(
                  'font-mono text-[10px] flex-shrink-0',
                  i === 0 ? 'text-paper/50' : 'text-ink-3'
                )}>
                  {path.lessons?.length ?? 0} lessons
                </span>
              </div>
            </div>
            <ChevronRight className={cn(
              'w-3.5 h-3.5 flex-shrink-0 transition-transform group-hover:translate-x-0.5',
              i === 0 ? 'text-paper/40' : 'text-ink-3'
            )} />
          </Link>
        ))}
      </div>
    </div>
  )
}

// ─── Recent Activity ────────────────────────────────────────────────────────

interface RecentActivityProps {
  progress: (UserProgress & { lesson: { id: string; title: string; type: string; path_id: string } | null })[]
}

export function RecentActivity({ progress }: RecentActivityProps) {
  return (
    <div className="bg-paper border border-paper-3 rounded-lg p-5 shadow-card">
      <h2 className="font-medium text-[15px] text-ink mb-4">Recent activity</h2>

      {progress.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-8 text-center gap-2">
          <Zap className="w-7 h-7 text-ink-3" />
          <p className="text-[13px] text-ink-3">No activity yet.</p>
          <Link href="/learn" className="text-[13px] text-accent hover:text-accent-2 font-medium transition-colors">
            Start a lesson →
          </Link>
        </div>
      ) : (
        <ul className="space-y-1">
          {progress.map((p) => (
            <li key={p.id} className="flex items-center gap-3 py-2 border-b border-paper-2 last:border-0">
              <CheckCircle2 className="w-4 h-4 text-sea-green flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-[13px] text-ink truncate">{p.lesson?.title ?? 'Lesson'}</p>
                <p className="text-[11px] text-ink-3 font-mono">{p.completed_at ? formatRelativeTime(p.completed_at) : ''}</p>
              </div>
              {p.score !== null && (
                <span className="font-mono text-[11px] text-ink-3 flex-shrink-0">
                  {p.score}%
                </span>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}

// ─── Achievement Shelf ──────────────────────────────────────────────────────

interface AchievementShelfProps {
  achievements: UserAchievement[]
}

export function AchievementShelf({ achievements }: AchievementShelfProps) {
  return (
    <div className="bg-paper border border-paper-3 rounded-lg p-5 shadow-card">
      <div className="flex items-center justify-between mb-4">
        <h2 className="font-medium text-[15px] text-ink">Achievements</h2>
        <Trophy className="w-4 h-4 text-amber-400" />
      </div>

      {achievements.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-8 text-center gap-2">
          <Trophy className="w-7 h-7 text-ink-3" />
          <p className="text-[13px] text-ink-3">Complete lessons to earn badges.</p>
        </div>
      ) : (
        <div className="grid grid-cols-3 gap-2">
          {achievements.map((ua) => (
            <div
              key={ua.id}
              title={ua.achievement?.title}
              className="aspect-square flex flex-col items-center justify-center gap-1.5 bg-paper-2 rounded-md border border-paper-3 p-2 hover:border-ink-2 transition-colors cursor-default group relative"
            >
              <span className="text-2xl">{ua.achievement?.icon ?? '🏅'}</span>
              <p className="text-[9px] font-mono text-ink-3 text-center leading-tight line-clamp-2">
                {ua.achievement?.title}
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

// ─── Weak Spot Alert ────────────────────────────────────────────────────────

interface WeakSpotAlertProps {
  skill: string
  score: number
}

export function WeakSpotAlert({ skill, score }: WeakSpotAlertProps) {
  const skillLabel = skill.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())

  return (
    <div className="flex items-center gap-4 bg-amber-50 border border-amber-200 rounded-lg px-5 py-3.5">
      <AlertTriangle className="w-4.5 h-4.5 text-amber-500 flex-shrink-0" />
      <div className="flex-1">
        <p className="text-[13px] font-medium text-amber-900">
          Weak spot detected: <span className="text-amber-700">{skillLabel}</span>
        </p>
        <p className="text-[12px] text-amber-700/70 mt-0.5">
          Your score is {score}% — focus here to move up faster.
        </p>
      </div>
      <Link
        href={`/learn?skill=${skill}`}
        className="flex-shrink-0 text-[12px] font-medium text-amber-800 hover:text-amber-900 transition-colors bg-amber-100 hover:bg-amber-200 px-3 py-1.5 rounded transition-colors"
      >
        Fix it →
      </Link>
    </div>
  )
}
