import { createServerSupabaseClient } from '@/lib/supabase'
import { NextRequest, NextResponse } from 'next/server'

// GET /api/quiz?lessonId=xxx — return quiz questions for a lesson
export async function GET(request: NextRequest) {
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const lessonId = request.nextUrl.searchParams.get('lessonId')
  if (!lessonId) return NextResponse.json({ error: 'Missing lessonId' }, { status: 400 })

  const { data: questions, error } = await supabase
    .from('quiz_questions')
    .select('id, text, options, correct_option_id, explanation')
    .eq('lesson_id', lessonId)
    .order('order_index')

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  // Map DB shape to client shape
  const mapped = (questions ?? []).map((q: any) => ({
    id: q.id,
    text: q.text,
    options: q.options,
    correctOptionId: q.correct_option_id,
    explanation: q.explanation,
  }))

  return NextResponse.json({ questions: mapped })
}
