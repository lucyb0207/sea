import { Flame, Zap, BookOpen, Trophy } from 'lucide-react'

interface StatsBarProps {
  streak: number
  longestStreak: number
  xpTotal: number
  lessonsCompleted: number
  achievementCount: number
}

export function StatsBar({
  streak,
  longestStreak,
  xpTotal,
  lessonsCompleted,
  achievementCount,
}: StatsBarProps) {
  const stats = [
    {
      label: 'Current streak',
      value: `${streak}d`,
      icon: Flame,
      iconColor: streak > 0 ? 'text-amber-500' : 'text-ink-3',
      sub: `Best: ${longestStreak}d`,
    },
    {
      label: 'Total XP',
      value: xpTotal.toLocaleString(),
      icon: Zap,
      iconColor: 'text-accent',
      sub: 'Experience points',
    },
    {
      label: 'Lessons done',
      value: lessonsCompleted.toString(),
      icon: BookOpen,
      iconColor: 'text-blue-500',
      sub: 'All time',
    },
    {
      label: 'Achievements',
      value: achievementCount.toString(),
      icon: Trophy,
      iconColor: 'text-amber-400',
      sub: 'Badges earned',
    },
  ]

  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
      {stats.map(({ label, value, icon: Icon, iconColor, sub }) => (
        <div
          key={label}
          className="bg-paper border border-paper-3 rounded-lg px-4 py-3.5 shadow-card flex items-center gap-3"
        >
          <div className="w-9 h-9 bg-paper-2 rounded flex items-center justify-center flex-shrink-0">
            <Icon className={`w-4.5 h-4.5 ${iconColor}`} />
          </div>
          <div>
            <p className="font-serif text-2xl text-ink leading-tight">{value}</p>
            <p className="text-[11px] text-ink-3 mt-0.5">{sub}</p>
          </div>
        </div>
      ))}
    </div>
  )
}
