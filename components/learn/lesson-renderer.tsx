'use client'

import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import { MDXRemote, type MDXRemoteSerializeResult } from 'next-mdx-remote'
import { Button } from '@/components/ui/button'
import { XPAnimation } from '@/components/learn/xp-animation'
import { QuizBlock } from '@/components/learn/quiz-block'
import { Badge } from '@/components/ui/primitives'
import type { Lesson, UserProgress, QuizQuestion } from '@/types'
import { CheckCircle2, ChevronLeft, ChevronRight, Clock, Zap } from 'lucide-react'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'

// MDX components available in lesson content
const MDX_COMPONENTS = {
  // Callout boxes
  Info:    ({ children }: { children: React.ReactNode }) => (
    <div className="callout callout-info">{children}</div>
  ),
  Warning: ({ children }: { children: React.ReactNode }) => (
    <div className="callout callout-warn">{children}</div>
  ),
  Tip:     ({ children }: { children: React.ReactNode }) => (
    <div className="callout callout-tip">{children}</div>
  ),
  Success: ({ children }: { children: React.ReactNode }) => (
    <div className="callout callout-success">{children}</div>
  ),
  // Architecture diagram placeholder (Phase 2 will add interactive version)
  Diagram: ({ src, alt }: { src: string; alt: string }) => (
    <div className="my-6 border border-paper-3 rounded-lg overflow-hidden bg-paper-2">
      <img src={src} alt={alt} className="w-full" />
      <p className="text-center text-[12px] text-ink-3 py-2 font-mono">{alt}</p>
    </div>
  ),
}

interface LessonRendererProps {
  lesson: Lesson
  pathSlug: string
  userId: string
  initialProgress: UserProgress | null
  prevLesson: { slug: string; title: string } | null
  nextLesson: { slug: string; title: string } | null
  // MDX is pre-serialized server-side and passed as serialized; for now we render raw content
  serializedMdx?: MDXRemoteSerializeResult
}

export function LessonRenderer({
  lesson,
  pathSlug,
  userId,
  initialProgress,
  prevLesson,
  nextLesson,
}: LessonRendererProps) {
  const [isDone, setIsDone] = useState(initialProgress?.status === 'complete')
  const [showXP, setShowXP] = useState(false)
  const [completing, setCompleting] = useState(false)
  const startTimeRef = useRef(Date.now())

  // Track reading time
  useEffect(() => {
    startTimeRef.current = Date.now()
  }, [lesson.id])

  async function handleComplete() {
    if (isDone || completing) return
    setCompleting(true)

    const timeSpent = Math.round((Date.now() - startTimeRef.current) / 1000)

    try {
      const res = await fetch('/api/progress', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          lessonId: lesson.id,
          status: 'complete',
          timeSpentSeconds: timeSpent,
        }),
      })

      if (!res.ok) throw new Error('Failed to save progress')

      setIsDone(true)
      setShowXP(true)
      setTimeout(() => setShowXP(false), 1600)

      // Update streak
      await fetch('/api/streak', { method: 'POST' })
    } catch {
      toast.error('Could not save progress — please try again.')
    } finally {
      setCompleting(false)
    }
  }

  const isQuiz = lesson.type === 'quiz'

  return (
    <div className="relative max-w-2xl">
      {showXP && <XPAnimation xp={lesson.xp_reward} />}

      {/* Lesson header */}
      <div className="mb-8">
        <div className="flex items-center gap-2 mb-3">
          <Badge variant={lesson.type === 'lesson' ? 'default' : lesson.type === 'quiz' ? 'warning' : 'info'}>
            {lesson.type}
          </Badge>
          <span className="font-mono text-[11px] text-ink-3 flex items-center gap-1">
            <Zap className="w-3 h-3" /> +{lesson.xp_reward} XP
          </span>
          {isDone && (
            <span className="flex items-center gap-1 text-[11px] text-sea-green font-mono">
              <CheckCircle2 className="w-3 h-3" /> Completed
            </span>
          )}
        </div>
        <h1 className="font-serif text-4xl text-ink leading-tight">{lesson.title}</h1>
      </div>

      {/* Lesson content */}
      {isQuiz ? (
        <QuizBlock
          lessonId={lesson.id}
          xpReward={lesson.xp_reward}
          onComplete={() => { setIsDone(true); setShowXP(true); setTimeout(() => setShowXP(false), 1600) }}
        />
      ) : (
        <>
          <div className="prose-lesson">
            {/* Render raw MDX as HTML for now — Phase 2: use next-mdx-remote with serialize */}
            <div dangerouslySetInnerHTML={{ __html: mdxToHtml(lesson.content_mdx) }} />
          </div>

          {/* Complete button */}
          <div className={cn(
            'mt-10 pt-8 border-t border-paper-3 flex items-center justify-between',
          )}>
            {prevLesson ? (
              <Link
                href={`/learn/${pathSlug}/${prevLesson.slug}`}
                className="flex items-center gap-1.5 text-[13px] text-ink-3 hover:text-ink transition-colors"
              >
                <ChevronLeft className="w-4 h-4" />
                {prevLesson.title}
              </Link>
            ) : <div />}

            <div className="flex items-center gap-3">
              {!isDone ? (
                <Button
                  onClick={handleComplete}
                  loading={completing}
                  variant="accent"
                  size="lg"
                  leftIcon={<CheckCircle2 className="w-4 h-4" />}
                >
                  Mark complete
                </Button>
              ) : nextLesson ? (
                <Link href={`/learn/${pathSlug}/${nextLesson.slug}`}>
                  <Button size="lg" rightIcon={<ChevronRight className="w-4 h-4" />}>
                    Next lesson
                  </Button>
                </Link>
              ) : (
                <Link href={`/learn/${pathSlug}`}>
                  <Button size="lg" variant="accent">
                    ✓ Path complete!
                  </Button>
                </Link>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  )
}

// Minimal MDX-to-HTML renderer for lesson content stored as MDX strings.
// In production, use next-mdx-remote/serialize in a server component.
function mdxToHtml(mdx: string): string {
  if (!mdx) return '<p>No content yet.</p>'
  return mdx
    // Code blocks
    .replace(/```(\w+)?\n([\s\S]*?)```/g, (_, lang, code) =>
      `<pre><code class="language-${lang ?? 'text'}">${escHtml(code.trim())}</code></pre>`
    )
    // Inline code
    .replace(/`([^`]+)`/g, '<code>$1</code>')
    // Bold
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    // Italic
    .replace(/\*(.+?)\*/g, '<em>$1</em>')
    // H2
    .replace(/^## (.+)$/gm, '<h2>$1</h2>')
    // H3
    .replace(/^### (.+)$/gm, '<h3>$1</h3>')
    // Blockquote
    .replace(/^> (.+)$/gm, '<blockquote>$1</blockquote>')
    // Unordered list items
    .replace(/^- (.+)$/gm, '<li>$1</li>')
    .replace(/(<li>.*<\/li>\n?)+/g, (match) => `<ul>${match}</ul>`)
    // Paragraphs (lines that aren't already HTML)
    .replace(/^(?!<)(.+)$/gm, '<p>$1</p>')
}

function escHtml(s: string) {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
}
