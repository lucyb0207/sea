import { createServerSupabaseClient } from '@/lib/supabase'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { ProgressBar, Badge } from '@/components/ui/primitives'
import { Clock, BookOpen, ChevronRight, Lock } from 'lucide-react'
import type { LearningPath } from '@/types'

export const metadata = { title: 'Learn' }

export default async function LearnPage() {
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const [
    { data: profile },
    { data: paths },
    { data: progress },
  ] = await Promise.all([
    supabase.from('users').select('plan').eq('id', user.id).single(),
    supabase.from('learning_paths').select('*, lessons(id)').order('order_index'),
    supabase.from('user_progress').select('lesson_id, status').eq('user_id', user.id).eq('status', 'complete'),
  ])

  const completedLessonIds = new Set(progress?.map((p) => p.lesson_id) ?? [])
  const isPro = profile?.plan === 'pro' || profile?.plan === 'team'

  return (
    <div className="animate-fade-in">
      <div className="mb-8">
        <h1 className="font-serif text-3xl text-ink">Learning paths</h1>
        <p className="text-[14px] text-ink-3 mt-1">
          Structured roadmaps from foundations to distributed systems.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {(paths ?? []).map((path, i) => {
          const lessons = (path as any).lessons as { id: string }[] ?? []
          const completed = lessons.filter((l) => completedLessonIds.has(l.id)).length
          const pct = lessons.length > 0 ? Math.round((completed / lessons.length) * 100) : 0
          const locked = !path.is_free && !isPro

          return (
            <PathCard
              key={path.id}
              path={path}
              completed={completed}
              total={lessons.length}
              pct={pct}
              locked={locked}
              featured={i === 0}
            />
          )
        })}
      </div>
    </div>
  )
}

function PathCard({
  path,
  completed,
  total,
  pct,
  locked,
  featured,
}: {
  path: LearningPath
  completed: number
  total: number
  pct: number
  locked: boolean
  featured: boolean
}) {
  const isStarted = completed > 0
  const isDone = completed === total && total > 0

  return (
    <Link
      href={locked ? '/settings/billing' : `/learn/${path.slug}`}
      className={`group relative flex flex-col bg-paper border rounded-lg p-5 shadow-card transition-all duration-200 hover:shadow-card-hover hover:-translate-y-0.5 ${
        featured ? 'border-ink/20' : 'border-paper-3'
      }`}
    >
      {locked && (
        <div className="absolute top-4 right-4">
          <Lock className="w-4 h-4 text-ink-3" />
        </div>
      )}

      {featured && !locked && (
        <div className="absolute top-4 right-4">
          <Badge variant="accent">Start here</Badge>
        </div>
      )}

      {isDone && (
        <div className="absolute top-4 right-4">
          <Badge variant="success">✓ Done</Badge>
        </div>
      )}

      {/* Icon */}
      <div className="w-12 h-12 bg-paper-2 rounded-lg flex items-center justify-center text-2xl mb-4 border border-paper-3">
        {path.icon}
      </div>

      {/* Content */}
      <h3 className="font-serif text-xl text-ink mb-1.5 group-hover:text-accent transition-colors">
        {path.title}
      </h3>
      <p className="text-[13px] text-ink-3 leading-relaxed flex-1 mb-4">
        {path.description}
      </p>

      {/* Tags */}
      <div className="flex flex-wrap gap-1.5 mb-4">
        {path.skill_tags.slice(0, 3).map((tag) => (
          <span
            key={tag}
            className="font-mono text-[10px] text-ink-3 bg-paper-2 border border-paper-3 px-2 py-0.5 rounded-sm uppercase tracking-wide"
          >
            {tag}
          </span>
        ))}
      </div>

      {/* Meta */}
      <div className="flex items-center gap-3 text-[12px] text-ink-3 mb-3">
        <span className="flex items-center gap-1">
          <BookOpen className="w-3.5 h-3.5" />
          {total} lessons
        </span>
        <span className="flex items-center gap-1">
          <Clock className="w-3.5 h-3.5" />
          ~{path.estimated_hours}h
        </span>
      </div>

      {/* Progress */}
      {isStarted && (
        <div>
          <div className="flex justify-between mb-1">
            <span className="text-[11px] text-ink-3">{completed}/{total} completed</span>
            <span className="font-mono text-[11px] text-ink-3">{pct}%</span>
          </div>
          <ProgressBar value={pct} size="sm" color={isDone ? 'green' : 'accent'} />
        </div>
      )}

      {!isStarted && !locked && (
        <div className="flex items-center gap-1 text-[13px] font-medium text-accent group-hover:gap-2 transition-all">
          Start path <ChevronRight className="w-3.5 h-3.5" />
        </div>
      )}

      {locked && (
        <p className="text-[12px] text-ink-3 font-mono">Pro plan required</p>
      )}
    </Link>
  )
}
