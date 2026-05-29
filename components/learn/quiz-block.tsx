'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { ProgressBar } from '@/components/ui/primitives'
import type { QuizQuestion, QuizResult } from '@/types'
import { CheckCircle2, XCircle, ChevronRight, Trophy } from 'lucide-react'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'

interface QuizBlockProps {
  lessonId: string
  xpReward: number
  onComplete: () => void
}

export function QuizBlock({ lessonId, xpReward, onComplete }: QuizBlockProps) {
  const [questions, setQuestions] = useState<QuizQuestion[]>([])
  const [loading, setLoading] = useState(true)
  const [currentQ, setCurrentQ] = useState(0)
  const [selected, setSelected] = useState<Record<string, string>>({})
  const [result, setResult] = useState<QuizResult | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [revealed, setRevealed] = useState(false)

  useEffect(() => {
    fetch(`/api/quiz?lessonId=${lessonId}`)
      .then((r) => r.json())
      .then((d) => { setQuestions(d.questions ?? []); setLoading(false) })
      .catch(() => { toast.error('Failed to load quiz'); setLoading(false) })
  }, [lessonId])

  async function handleSubmit() {
    if (Object.keys(selected).length < questions.length) {
      toast.error('Answer all questions before submitting.')
      return
    }
    setSubmitting(true)

    try {
      const res = await fetch('/api/quiz/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          lessonId,
          answers: Object.entries(selected).map(([questionId, selectedOptionId]) => ({
            questionId,
            selectedOptionId,
          })),
        }),
      })

      if (!res.ok) throw new Error()
      const data: QuizResult = await res.json()
      setResult(data)
      onComplete()
    } catch {
      toast.error('Failed to submit quiz.')
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="skeleton h-14 rounded-lg" />
        ))}
      </div>
    )
  }

  if (questions.length === 0) {
    return (
      <div className="bg-paper-2 border border-paper-3 rounded-lg p-8 text-center">
        <p className="text-ink-3">No quiz questions available for this lesson yet.</p>
      </div>
    )
  }

  // ── Result view ────────────────────────────────────────────────────────

  if (result) {
    const pct = result.score
    const passed = pct >= 70

    return (
      <div className="animate-fade-up">
        {/* Score banner */}
        <div className={cn(
          'rounded-lg p-6 mb-6 text-center',
          passed ? 'bg-sea-green-light border border-sea-green/20' : 'bg-amber-50 border border-amber-200'
        )}>
          <div className="text-4xl font-serif font-bold mb-1" style={{ color: passed ? '#1a5c3a' : '#92400e' }}>
            {pct}%
          </div>
          <p className={cn(
            'text-[15px] font-medium',
            passed ? 'text-sea-green' : 'text-amber-800'
          )}>
            {passed ? '🎉 Great work!' : 'Keep practising — review the lesson and try again.'}
          </p>
          <p className="text-[13px] mt-1 opacity-70" style={{ color: passed ? '#1a5c3a' : '#92400e' }}>
            {result.correct}/{result.total} correct · +{result.xpEarned} XP earned
          </p>
        </div>

        {/* Question review */}
        <div className="space-y-4">
          {questions.map((q, i) => {
            const exp = result.explanations.find((e) => e.questionId === q.id)
            const isCorrect = exp?.correct ?? false
            const chosenId = selected[q.id]

            return (
              <div
                key={q.id}
                className={cn(
                  'rounded-lg border p-4',
                  isCorrect ? 'bg-sea-green-light/30 border-sea-green/20' : 'bg-red-50 border-red-200'
                )}
              >
                <div className="flex items-start gap-3 mb-3">
                  {isCorrect
                    ? <CheckCircle2 className="w-5 h-5 text-sea-green flex-shrink-0 mt-0.5" />
                    : <XCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
                  }
                  <p className="text-[14px] font-medium text-ink">{q.text}</p>
                </div>

                <div className="space-y-1.5 ml-8">
                  {q.options.map((opt) => {
                    const isChosen = opt.id === chosenId
                    const isCorrectOpt = opt.id === q.correctOptionId
                    return (
                      <div
                        key={opt.id}
                        className={cn(
                          'text-[13px] px-3 py-2 rounded flex items-center gap-2',
                          isCorrectOpt ? 'bg-sea-green-light text-sea-green font-medium' :
                          isChosen && !isCorrectOpt ? 'bg-red-100 text-red-700 line-through opacity-70' :
                          'text-ink-3'
                        )}
                      >
                        {isCorrectOpt && <CheckCircle2 className="w-3.5 h-3.5 flex-shrink-0" />}
                        {opt.text}
                      </div>
                    )
                  })}
                </div>

                {exp?.explanation && (
                  <p className="ml-8 mt-3 text-[12px] text-ink-2 italic border-t border-paper-3 pt-3">
                    {exp.explanation}
                  </p>
                )}
              </div>
            )
          })}
        </div>
      </div>
    )
  }

  // ── Quiz taking view ───────────────────────────────────────────────────

  const q = questions[currentQ]
  const totalAnswered = Object.keys(selected).length
  const pct = Math.round((totalAnswered / questions.length) * 100)

  return (
    <div className="animate-fade-in">
      {/* Progress */}
      <div className="mb-6">
        <div className="flex justify-between text-[12px] text-ink-3 mb-2">
          <span className="font-mono">Question {currentQ + 1} of {questions.length}</span>
          <span>{totalAnswered} answered</span>
        </div>
        <ProgressBar value={pct} size="sm" color="accent" />
      </div>

      {/* Question navigation tabs */}
      <div className="flex gap-1.5 mb-6">
        {questions.map((question, i) => (
          <button
            key={question.id}
            onClick={() => setCurrentQ(i)}
            className={cn(
              'w-8 h-8 rounded text-[12px] font-mono font-medium transition-all',
              i === currentQ ? 'bg-ink text-paper' :
              selected[question.id] ? 'bg-sea-green-light text-sea-green border border-sea-green/20' :
              'bg-paper-2 text-ink-3 border border-paper-3 hover:border-ink-2'
            )}
          >
            {i + 1}
          </button>
        ))}
      </div>

      {/* Question */}
      <div className="bg-paper border border-paper-3 rounded-lg p-5 mb-4">
        <p className="font-serif text-xl text-ink leading-snug">{q.text}</p>
      </div>

      {/* Options */}
      <div className="space-y-2.5 mb-8">
        {q.options.map((opt) => {
          const isSelected = selected[q.id] === opt.id
          return (
            <button
              key={opt.id}
              onClick={() => setSelected((prev) => ({ ...prev, [q.id]: opt.id }))}
              className={cn(
                'w-full text-left px-4 py-3.5 rounded-lg border text-[14px] transition-all duration-150',
                isSelected
                  ? 'border-ink bg-ink text-paper'
                  : 'border-paper-3 bg-paper hover:border-ink-2 hover:bg-paper-2 text-ink'
              )}
            >
              <span className={cn(
                'font-mono text-[11px] mr-3 uppercase',
                isSelected ? 'text-paper/50' : 'text-ink-3'
              )}>
                {String.fromCharCode(65 + q.options.indexOf(opt))}
              </span>
              {opt.text}
            </button>
          )
        })}
      </div>

      {/* Navigation */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => setCurrentQ((i) => Math.max(0, i - 1))}
          disabled={currentQ === 0}
          className="text-[13px] text-ink-3 hover:text-ink transition-colors disabled:opacity-30"
        >
          ← Previous
        </button>

        {currentQ < questions.length - 1 ? (
          <Button
            onClick={() => setCurrentQ((i) => i + 1)}
            rightIcon={<ChevronRight className="w-4 h-4" />}
          >
            Next question
          </Button>
        ) : (
          <Button
            onClick={handleSubmit}
            loading={submitting}
            variant="accent"
            disabled={totalAnswered < questions.length}
            leftIcon={<Trophy className="w-4 h-4" />}
          >
            Submit quiz
          </Button>
        )}
      </div>
    </div>
  )
}
