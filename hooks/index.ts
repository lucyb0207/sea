import { useEffect, useState, useCallback } from 'react'
import { createClient } from '@/lib/supabase'
import { getLevelProgress } from '@/lib/xp'
import type { UserProfile, SkillScore, UserProgress } from '@/types'

// ─── useUser ───────────────────────────────────────────────────────────────
// Lightweight client-side user profile hook

export function useUser() {
  const [user, setUser] = useState<UserProfile | null>(null)
  const [loading, setLoading] = useState(true)
  const supabase = createClient()

  useEffect(() => {
    supabase.auth.getUser().then(async ({ data: { user: authUser } }) => {
      if (!authUser) { setLoading(false); return }

      const { data } = await supabase
        .from('users')
        .select('*')
        .eq('id', authUser.id)
        .single()

      setUser(data)
      setLoading(false)
    })

    // Subscribe to auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (!session?.user) { setUser(null); return }
        const { data } = await supabase
          .from('users')
          .select('*')
          .eq('id', session.user.id)
          .single()
        setUser(data)
      }
    )

    return () => subscription.unsubscribe()
  }, [])

  return { user, loading }
}

// ─── useSkillScores ────────────────────────────────────────────────────────

export function useSkillScores(userId: string | undefined) {
  const [scores, setScores] = useState<SkillScore[]>([])
  const [loading, setLoading] = useState(true)
  const supabase = createClient()

  useEffect(() => {
    if (!userId) { setLoading(false); return }

    supabase
      .from('skill_scores')
      .select('*')
      .eq('user_id', userId)
      .then(({ data }) => {
        setScores(data ?? [])
        setLoading(false)
      })
  }, [userId])

  return { scores, loading }
}

// ─── useXP ────────────────────────────────────────────────────────────────
// Computes total XP and level from progress records

export function useXP(userId: string | undefined) {
  const [xp, setXP] = useState(0)
  const [loading, setLoading] = useState(true)
  const supabase = createClient()

  useEffect(() => {
    if (!userId) { setLoading(false); return }

    supabase
      .from('user_progress')
      .select('lesson:lessons(xp_reward), status')
      .eq('user_id', userId)
      .eq('status', 'complete')
      .then(({ data }) => {
        const total = (data ?? []).reduce((sum: number, p: any) => {
          return sum + (p.lesson?.xp_reward ?? 10)
        }, 0)
        setXP(total)
        setLoading(false)
      })
  }, [userId])

  const { level, progressPercent } = getLevelProgress(xp)
  return { xp, level, progressPercent, loading }
}

// ─── useLessonProgress ────────────────────────────────────────────────────

export function useLessonProgress(userId: string | undefined, lessonId: string) {
  const [progress, setProgress] = useState<UserProgress | null>(null)
  const supabase = createClient()

  const refetch = useCallback(async () => {
    if (!userId) return
    const { data } = await supabase
      .from('user_progress')
      .select('*')
      .eq('user_id', userId)
      .eq('lesson_id', lessonId)
      .single()
    setProgress(data)
  }, [userId, lessonId])

  useEffect(() => { refetch() }, [refetch])

  return { progress, refetch }
}
