'use client'

import posthog from 'posthog-js'
import { PostHogProvider as PHProvider } from 'posthog-js/react'
import { useEffect } from 'react'

export function PostHogProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    if (typeof window === 'undefined') return
    if (!process.env.NEXT_PUBLIC_POSTHOG_KEY) return

    posthog.init(process.env.NEXT_PUBLIC_POSTHOG_KEY, {
      api_host: process.env.NEXT_PUBLIC_POSTHOG_HOST ?? 'https://app.posthog.com',
      capture_pageview: false, // we handle this manually
      capture_pageleave: true,
      persistence: 'localStorage',
    })
  }, [])

  return <PHProvider client={posthog}>{children}</PHProvider>
}

// Typed event names so we don't typo them
export const track = {
  signup:                   (props: { source?: string; plan?: string }) =>
                              posthog.capture('signup', props),
  lessonStarted:            (props: { lessonId: string; pathId: string; lessonType: string }) =>
                              posthog.capture('lesson_started', props),
  lessonCompleted:          (props: { lessonId: string; timeSpent: number; xpEarned: number }) =>
                              posthog.capture('lesson_completed', props),
  quizSubmitted:            (props: { lessonId: string; score: number; attempt: number }) =>
                              posthog.capture('quiz_submitted', props),
  mentorMessageSent:        (props: { hasContext: boolean; freeTierRemaining?: number }) =>
                              posthog.capture('mentor_message_sent', props),
  upgradeCTAShown:          (props: { location: string; userPlan: string; featureGated: string }) =>
                              posthog.capture('upgrade_cta_shown', props),
  upgradeCompleted:         (props: { plan: string; billingPeriod: string }) =>
                              posthog.capture('upgrade_completed', props),
  achievementEarned:        (props: { achievementKey: string; xp: number }) =>
                              posthog.capture('achievement_earned', props),
  streakBroken:             (props: { streakLength: number }) =>
                              posthog.capture('streak_broken', props),
}
