import { createServerSupabaseClient } from '@/lib/supabase'
import { notFound, redirect } from 'next/navigation'
import { LessonRenderer } from '@/components/learn/lesson-renderer'
import { LessonNav } from '@/components/learn/lesson-nav'
import type { Lesson } from '@/types'

export async function generateMetadata({ params }: { params: { path: string; lesson: string } }) {
  return { title: params.lesson.replace(/-/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase()) }
}

export default async function LessonPage({
  params,
}: {
  params: { path: string; lesson: string }
}) {
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  // Fetch lesson + its path
  const { data: lesson } = await supabase
    .from('lessons')
    .select('*, learning_path:learning_paths(*)')
    .eq('slug', params.lesson)
    .single()

  if (!lesson) notFound()

  // Fetch all lessons in path for navigation
  const { data: pathLessons } = await supabase
    .from('lessons')
    .select('id, slug, title, order_index, type, is_free, xp_reward')
    .eq('path_id', lesson.path_id)
    .order('order_index')

  // Fetch user's progress for this lesson
  const { data: progress } = await supabase
    .from('user_progress')
    .select('*')
    .eq('user_id', user.id)
    .eq('lesson_id', lesson.id)
    .single()

  const { data: profile } = await supabase
    .from('users')
    .select('plan')
    .eq('id', user.id)
    .single()

  const isPro = profile?.plan === 'pro' || profile?.plan === 'team'

  // Lock check
  if (!lesson.is_free && !isPro) {
    redirect('/settings/billing?reason=lesson_locked')
  }

  const lessons = pathLessons ?? []
  const currentIdx = lessons.findIndex((l) => l.id === lesson.id)
  const prevLesson = currentIdx > 0 ? lessons[currentIdx - 1] : null
  const nextLesson = currentIdx < lessons.length - 1 ? lessons[currentIdx + 1] : null

  return (
    <div className="flex gap-8 animate-fade-in">
      {/* Sidebar nav */}
      <LessonNav
        pathSlug={params.path}
        pathTitle={(lesson as any).learning_path?.title ?? ''}
        lessons={lessons}
        currentLessonId={lesson.id}
      />

      {/* Main content */}
      <div className="flex-1 min-w-0">
        <LessonRenderer
          lesson={lesson as Lesson}
          pathSlug={params.path}
          userId={user.id}
          initialProgress={progress ?? null}
          prevLesson={prevLesson ? { slug: prevLesson.slug, title: prevLesson.title } : null}
          nextLesson={nextLesson ? { slug: nextLesson.slug, title: nextLesson.title } : null}
        />
      </div>
    </div>
  )
}
