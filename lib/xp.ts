import type { XPLevel } from '@/types'

export const LEVELS: XPLevel[] = [
  { level: 1, title: 'Code Writer',                    xpRequired: 0,      xpNext: 200 },
  { level: 2, title: 'API Builder',                    xpRequired: 200,    xpNext: 500 },
  { level: 3, title: 'System Thinker',                 xpRequired: 500,    xpNext: 1000 },
  { level: 4, title: 'Architecture Apprentice',        xpRequired: 1000,   xpNext: 2000 },
  { level: 5, title: 'Scale Engineer',                 xpRequired: 2000,   xpNext: 4000 },
  { level: 6, title: 'Distributed Systems Engineer',   xpRequired: 4000,   xpNext: 8000 },
  { level: 7, title: 'Senior Architect',               xpRequired: 8000,   xpNext: 15000 },
  { level: 8, title: 'Staff Engineer',                 xpRequired: 15000,  xpNext: Infinity },
]

export function getLevelFromXP(xp: number): XPLevel {
  for (let i = LEVELS.length - 1; i >= 0; i--) {
    if (xp >= LEVELS[i].xpRequired) return LEVELS[i]
  }
  return LEVELS[0]
}

export function getLevelProgress(xp: number): { level: XPLevel; progressPercent: number } {
  const level = getLevelFromXP(xp)
  if (level.xpNext === Infinity) return { level, progressPercent: 100 }
  const intoLevel = xp - level.xpRequired
  const levelSize = level.xpNext - level.xpRequired
  return { level, progressPercent: Math.round((intoLevel / levelSize) * 100) }
}

export const SKILL_LABELS: Record<string, string> = {
  databases:           'Databases',
  caching:             'Caching',
  load_balancing:      'Load Balancing',
  distributed_systems: 'Distributed Systems',
  message_queues:      'Message Queues',
  networking:          'Networking',
}

export const ALL_SKILLS = Object.keys(SKILL_LABELS)

// XP rewards
export const XP_REWARDS = {
  lesson_complete:      10,
  quiz_full_score:      20,
  quiz_partial:         (score: number) => Math.round(score * 0.15),
  challenge_complete:   25,
  design_reviewed:      30,
  scenario_complete:    20,
  project_complete:     100,
  streak_7:             50,
  interview_session:    40,
} as const
