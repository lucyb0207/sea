'use client'

import Link from 'next/link'
import { cn } from '@/lib/utils'
import { CheckCircle2, Circle, Lock, ChevronLeft } from 'lucide-react'
import { useState } from 'react'

interface NavLesson {
  id: string
  slug: string
  title: string
  type: string
  is_free: boolean
  xp_reward: number
}

interface LessonNavProps {
  pathSlug: string
  pathTitle: string
  lessons: NavLesson[]
  currentLessonId: string
}

export function LessonNav({ pathSlug, pathTitle, lessons, currentLessonId }: LessonNavProps) {
  const [collapsed, setCollapsed] = useState(false)

  if (collapsed) {
    return (
      <button
        onClick={() => setCollapsed(false)}
        className="flex-shrink-0 w-6 bg-paper-2 border border-paper-3 rounded-lg flex items-center justify-center hover:bg-paper-3 transition-colors"
        title="Show lesson list"
      >
        <ChevronLeft className="w-3.5 h-3.5 text-ink-3 -rotate-180" />
      </button>
    )
  }

  return (
    <aside className="flex-shrink-0 w-56 sticky top-0 h-[calc(100vh-112px)] flex flex-col">
      {/* Path header */}
      <div className="flex items-center justify-between mb-3">
        <Link
          href={`/learn/${pathSlug}`}
          className="flex items-center gap-1.5 text-[12px] text-ink-3 hover:text-ink transition-colors"
        >
          <ChevronLeft className="w-3.5 h-3.5" />
          {pathTitle}
        </Link>
        <button
          onClick={() => setCollapsed(true)}
          className="text-ink-3 hover:text-ink transition-colors p-1"
          title="Collapse"
        >
          <ChevronLeft className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Lesson list */}
      <div className="flex-1 overflow-y-auto space-y-0.5 pr-1">
        {lessons.map((lesson, i) => {
          const isCurrent = lesson.id === currentLessonId

          return (
            <Link
              key={lesson.id}
              href={`/learn/${pathSlug}/${lesson.slug}`}
              className={cn(
                'flex items-start gap-2.5 px-2.5 py-2 rounded text-[12px] transition-all duration-150 group',
                isCurrent
                  ? 'bg-ink text-paper'
                  : 'text-ink-2 hover:bg-paper-2 hover:text-ink'
              )}
            >
              <div className="flex-shrink-0 mt-0.5">
                <span className={cn(
                  'font-mono text-[10px]',
                  isCurrent ? 'text-paper/50' : 'text-ink-3'
                )}>
                  {String(i + 1).padStart(2, '0')}
                </span>
              </div>
              <span className="flex-1 leading-snug">{lesson.title}</span>
            </Link>
          )
        })}
      </div>
    </aside>
  )
}
