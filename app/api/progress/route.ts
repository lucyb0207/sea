import { createServerSupabaseClient } from '@/lib/supabase'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const body = await request.json()
  const { lessonId, status, timeSpentSeconds } = body

  if (!lessonId || !status) {
    return NextResponse.json({ error: 'Missing fields' }, { status: 400 })
  }

  // Upsert progress
  const { error: progressError } = await supabase
    .from('user_progress')
    .upsert({
      user_id: user.id,
      lesson_id: lessonId,
      status,
      time_spent_seconds: timeSpentSeconds ?? 0,
      completed_at: status === 'complete' ? new Date().toISOString() : null,
    }, { onConflict: 'user_id,lesson_id' })

  if (progressError) {
    return NextResponse.json({ error: progressError.message }, { status: 500 })
  }

  if (status !== 'complete') {
    return NextResponse.json({ ok: true })
  }

  // Fetch lesson to get skill tags and XP
  const { data: lesson } = await supabase
    .from('lessons')
    .select('xp_reward, path_id, learning_paths(skill_tags)')
    .eq('id', lessonId)
    .single()

  if (!lesson) return NextResponse.json({ ok: true })

  const skillTags: string[] = (lesson as any).learning_paths?.skill_tags ?? []
  const xpReward: number = lesson.xp_reward ?? 10

  // Update skill scores — increment each skill by a small amount
  for (const skill of skillTags) {
    const { data: existing } = await supabase
      .from('skill_scores')
      .select('score')
      .eq('user_id', user.id)
      .eq('skill', skill)
      .single()

    const currentScore = existing?.score ?? 0
    const increment = Math.min(5, Math.round((100 - currentScore) * 0.08))
    const newScore = Math.min(100, currentScore + increment)

    await supabase
      .from('skill_scores')
      .upsert({
        user_id: user.id,
        skill,
        score: newScore,
        updated_at: new Date().toISOString(),
      }, { onConflict: 'user_id,skill' })
  }

  // Check and grant achievements
  await checkAchievements(user.id, supabase)

  return NextResponse.json({ ok: true, xpEarned: xpReward })
}

async function checkAchievements(userId: string, supabase: Awaited<ReturnType<typeof createServerSupabaseClient>>) {
  const [
    { count: completedCount },
    { data: existingAchievements },
  ] = await Promise.all([
    supabase
      .from('user_progress')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId)
      .eq('status', 'complete'),
    supabase
      .from('user_achievements')
      .select('achievement:achievements(key)')
      .eq('user_id', userId),
  ])

  const earned = new Set(
    existingAchievements?.map((ua: any) => ua.achievement?.key).filter(Boolean) ?? []
  )

  const toGrant: string[] = []

  if (!earned.has('first_lesson') && (completedCount ?? 0) >= 1) {
    toGrant.push('first_lesson')
  }

  for (const key of toGrant) {
    const { data: achievement } = await supabase
      .from('achievements')
      .select('id')
      .eq('key', key)
      .single()

    if (achievement) {
      await supabase
        .from('user_achievements')
        .insert({ user_id: userId, achievement_id: achievement.id, earned_at: new Date().toISOString() })
        .onConflict('user_id,achievement_id')
        .ignore()
    }
  }
}
