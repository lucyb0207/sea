import { createServerSupabaseClient } from '@/lib/supabase'
import { NextResponse } from 'next/server'

export async function POST() {
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: profile } = await supabase
    .from('users')
    .select('current_streak, longest_streak, last_active_date')
    .eq('id', user.id)
    .single()

  if (!profile) return NextResponse.json({ error: 'Profile not found' }, { status: 404 })

  const today = new Date().toISOString().split('T')[0]
  const lastActive = profile.last_active_date

  if (lastActive === today) {
    // Already active today — no change
    return NextResponse.json({ streak: profile.current_streak, updated: false })
  }

  const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0]
  const isConsecutive = lastActive === yesterday

  const newStreak = isConsecutive ? (profile.current_streak ?? 0) + 1 : 1
  const newLongest = Math.max(newStreak, profile.longest_streak ?? 0)

  await supabase
    .from('users')
    .update({
      current_streak: newStreak,
      longest_streak: newLongest,
      last_active_date: today,
    })
    .eq('id', user.id)

  return NextResponse.json({ streak: newStreak, updated: true })
}
