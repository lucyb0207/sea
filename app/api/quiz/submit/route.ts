import { createServerSupabaseClient } from '@/lib/supabase'
import { NextRequest, NextResponse } from 'next/server'
import { XP_REWARDS } from '@/lib/xp'

export async function POST(request: NextRequest) {
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { lessonId, answers } = await request.json()
  if (!lessonId || !answers?.length) {
    return NextResponse.json({ error: 'Missing fields' }, { status: 400 })
  }

  // Fetch all questions for this lesson
  const { data: questions } = await supabase
    .from('quiz_questions')
    .select('id, correct_option_id, explanation')
    .eq('lesson_id', lessonId)

  if (!questions?.length) {
    return NextResponse.json({ error: 'Questions not found' }, { status: 404 })
  }

  // Score
  const correctMap = Object.fromEntries(
    questions.map((q) => [q.id, { correctOptionId: q.correct_option_id, explanation: q.explanation }])
  )

  let correct = 0
  const explanations = answers.map(({ questionId, selectedOptionId }: { questionId: string; selectedOptionId: string }) => {
    const isCorrect = correctMap[questionId]?.correctOptionId === selectedOptionId
    if (isCorrect) correct++
    return {
      questionId,
      correct: isCorrect,
      explanation: correctMap[questionId]?.explanation ?? '',
    }
  })

  const score = Math.round((correct / questions.length) * 100)
  const xpEarned = score === 100
    ? XP_REWARDS.quiz_full_score
    : XP_REWARDS.quiz_partial(score)

  // Save progress
  await supabase
    .from('user_progress')
    .upsert({
      user_id: user.id,
      lesson_id: lessonId,
      status: 'complete',
      score,
      completed_at: new Date().toISOString(),
    }, { onConflict: 'user_id,lesson_id' })

  // Update streak
  await fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/streak`, {
    method: 'POST',
    headers: { cookie: request.headers.get('cookie') ?? '' },
  }).catch(() => {})

  return NextResponse.json({
    score,
    xpEarned,
    correct,
    total: questions.length,
    explanations,
  })
}
