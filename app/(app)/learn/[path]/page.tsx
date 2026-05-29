import { createServerSupabaseClient } from '@/lib/supabase'
import { notFound, redirect } from 'next/navigation'
import Link from 'next/link'
import { ProgressBar, Badge } from '@/components/ui/primitives'
import { CheckCircle2, Circle, Lock, Clock, BookOpen, Zap, ChevronLeft } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { Lesson, LessonType } from '@/types'

export async function generateMetadata({ params }: { params: { path: string } }) {
  return { title: params.path.replace(/-/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase()) }
}

const TYPE_META: Record<LessonType, { label: string; color: string }> = {
  lesson:    { label: 'Lesson',    color: 'default' },
  challenge: { label: 'Challenge', color: 'info' },
  quiz:      { label: 'Quiz',      color: 'warning' },
  project:   { label: 'Project',   color: 'purple' },
}

export default async function LearningPathPage({
  params,
}: {
  params: { path: string }
}) {
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const [
    { data: path },
    { data: profile },
  ] = await Promise.all([
    supabase
      .from('learning_paths')
      .select('*, lessons(*)')
      .eq('slug', params.path)
      .single(),
    supabase.from('users').select('plan').eq('id', user.id).single(),
  ])

  if (!path) notFound()

  const { data: progress } = await supabase
    .from('user_progress')
    .select('lesson_id, status, score')
    .eq('user_id', user.id)

  const progressMap = Object.fromEntries(
    (progress ?? []).map((p) => [p.lesson_id, p])
  )

  const lessons = ((path as any).lessons as Lesson[]).sort(
    (a, b) => a.order_index - b.order_index
  )

  const isPro = profile?.plan === 'pro' || profile?.plan === 'team'
  const completed = lessons.filter((l) => progressMap[l.id]?.status === 'complete').length
  const pct = lessons.length > 0 ? Math.round((completed / lessons.length) * 100) : 0

  // Find next uncompleted lesson
  const nextLesson = lessons.find((l) => progressMap[l.id]?.status !== 'complete')

  return (
    <div className="max-w-3xl animate-fade-in">
      {/* Back */}
      <Link
        href="/learn"
        className="inline-flex items-center gap-1.5 text-[13px] text-ink-3 hover:text-ink transition-colors mb-6"
      >
        <ChevronLeft className="w-3.5 h-3.5" /> All paths
      </Link>

      {/* Header */}
      <div className="flex items-start gap-4 mb-6">
        <div className="w-14 h-14 bg-paper-2 border border-paper-3 rounded-lg flex items-center justify-center text-3xl flex-shrink-0">
          {path.icon}
        </div>
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <h1 className="font-serif text-3xl text-ink">{path.title}</h1>
            {!path.is_free && !isPro && <Lock className="w-4 h-4 text-ink-3" />}
          </div>
          <p className="text-[14px] text-ink-3">{path.description}</p>
          <div className="flex items-center gap-4 mt-2 text-[12px] text-ink-3">
            <span className="flex items-center gap-1">
              <BookOpen className="w-3.5 h-3.5" />
              {lessons.length} lessons
            </span>
            <span className="flex items-center gap-1">
              <Clock className="w-3.5 h-3.5" />
              ~{path.estimated_hours}h
            </span>
          </div>
        </div>
      </div>

      {/* Progress bar */}
      {completed > 0 && (
        <div className="bg-paper border border-paper-3 rounded-lg p-4 mb-6">
          <div className="flex justify-between text-[13px] mb-2">
            <span className="font-medium text-ink">{completed} of {lessons.length} completed</span>
            <span className="font-mono text-ink-3">{pct}%</span>
          </div>
          <ProgressBar value={pct} color={pct === 100 ? 'green' : 'accent'} />
        </div>
      )}

      {/* CTA if not started */}
      {nextLesson && (
        <Link
          href={`/learn/${params.path}/${nextLesson.slug}`}
          className="flex items-center justify-between bg-ink text-paper rounded-lg px-5 py-4 mb-6 group hover:bg-accent transition-colors"
        >
          <div>
            <p className="text-[11px] font-mono text-paper/50 uppercase tracking-wide mb-0.5">
              {completed > 0 ? 'Continue where you left off' : 'Start here'}
            </p>
            <p className="font-medium text-[15px]">{nextLesson.title}</p>
          </div>
          <div className="flex items-center gap-1 text-paper/60 group-hover:gap-2 transition-all">
            <Zap className="w-4 h-4" />
          </div>
        </Link>
      )}

      {/* Lesson list */}
      <div className="space-y-1.5">
        {lessons.map((lesson, i) => {
          const prog = progressMap[lesson.id]
          const isDone = prog?.status === 'complete'
          const isLocked = !lesson.is_free && !isPro
          const meta = TYPE_META[lesson.type]

          return (
            <Link
              key={lesson.id}
              href={isLocked ? '/settings/billing' : `/learn/${params.path}/${lesson.slug}`}
              className={cn(
                'flex items-center gap-4 px-4 py-3.5 rounded-lg border transition-all duration-150 group',
                isDone
                  ? 'bg-sea-green-light/30 border-sea-green/20 hover:border-sea-green/40'
                  : 'bg-paper border-paper-3 hover:border-ink-2 hover:bg-paper-2',
                isLocked && 'opacity-60'
              )}
            >
              {/* Completion icon */}
              <div className="flex-shrink-0">
                {isDone ? (
                  <CheckCircle2 className="w-5 h-5 text-sea-green" />
                ) : isLocked ? (
                  <Lock className="w-5 h-5 text-ink-3" />
                ) : (
                  <Circle className="w-5 h-5 text-ink-3 group-hover:text-ink transition-colors" />
                )}
              </div>

              {/* Number */}
              <span className="font-mono text-[11px] text-ink-3 w-5 text-center flex-shrink-0">
                {String(i + 1).padStart(2, '0')}
              </span>

              {/* Title */}
              <div className="flex-1 min-w-0">
                <p className={cn(
                  'text-[14px] font-medium truncate',
                  isDone ? 'text-sea-green' : 'text-ink'
                )}>
                  {lesson.title}
                </p>
              </div>

              {/* Type + score */}
              <div className="flex items-center gap-2 flex-shrink-0">
                {prog?.score != null && (
                  <span className="font-mono text-[11px] text-ink-3">{prog.score}%</span>
                )}
                <Badge variant={meta.color as any}>{meta.label}</Badge>
                <span className="font-mono text-[10px] text-ink-3">+{lesson.xp_reward}xp</span>
              </div>
            </Link>
          )
        })}
      </div>
    </div>
  )
}
