'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import { getLevelFromXP } from '@/lib/xp'
import type { UserProfile } from '@/types'
import {
  LayoutDashboard, BookOpen, Cpu, Zap,
  FolderKanban, MessageSquare, Flame, ChevronRight,
  GraduationCap
} from 'lucide-react'

const NAV_ITEMS = [
  { href: '/dashboard',  label: 'Dashboard',  icon: LayoutDashboard },
  { href: '/learn',      label: 'Learn',       icon: BookOpen },
  { href: '/architect',  label: 'Architect',   icon: Cpu,             phase2: true },
  { href: '/simulate',   label: 'Simulate',    icon: Zap,             phase2: true },
  { href: '/projects',   label: 'Projects',    icon: FolderKanban,    phase3: true },
  { href: '/mentor',     label: 'AI Mentor',   icon: MessageSquare },
]

interface AppSidebarProps {
  user: UserProfile | null
}

export function AppSidebar({ user }: AppSidebarProps) {
  const pathname = usePathname()

  // Compute XP from user (placeholder — real XP comes from a hook/store)
  const xp = 0
  const level = getLevelFromXP(xp)
  const isPro = user?.plan === 'pro' || user?.plan === 'team'

  return (
    <aside className="w-56 flex-shrink-0 h-full flex flex-col bg-ink border-r border-white/[0.06] overflow-y-auto">

      {/* Logo */}
      <div className="px-5 pt-6 pb-5 border-b border-white/[0.06]">
        <Link href="/dashboard" className="flex items-center gap-2.5">
          <div className="w-7 h-7 bg-accent rounded flex items-center justify-center flex-shrink-0">
            <GraduationCap className="w-4 h-4 text-white" />
          </div>
          <div>
            <p className="font-mono text-[11px] text-paper/80 leading-tight tracking-wide">SCALABLE</p>
            <p className="font-mono text-[11px] text-paper/80 leading-tight tracking-wide">ENGINEER</p>
          </div>
        </Link>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-4 space-y-0.5">
        {NAV_ITEMS.map(({ href, label, icon: Icon, phase2, phase3 }) => {
          const active = pathname === href || pathname.startsWith(href + '/')
          const locked = (phase2 || phase3) && !isPro

          return (
            <Link
              key={href}
              href={locked ? '/settings/billing' : href}
              className={cn(
                'flex items-center gap-3 px-3 py-2.5 rounded text-[13px] font-medium transition-all duration-150 group',
                active
                  ? 'bg-white/10 text-paper'
                  : 'text-paper/50 hover:text-paper/80 hover:bg-white/[0.05]',
                locked && 'opacity-40 cursor-not-allowed'
              )}
            >
              <Icon className={cn('w-4 h-4 flex-shrink-0', active ? 'text-accent-2' : 'text-current')} />
              <span className="flex-1">{label}</span>
              {active && <ChevronRight className="w-3 h-3 text-paper/30" />}
              {locked && (
                <span className="text-[9px] font-mono tracking-wide bg-accent/20 text-accent-2 px-1.5 py-0.5 rounded-sm">
                  PRO
                </span>
              )}
            </Link>
          )
        })}
      </nav>

      {/* Streak + level */}
      <div className="px-4 py-4 border-t border-white/[0.06] space-y-3">
        {/* Streak */}
        {user && (
          <div className="flex items-center gap-2.5">
            <div className={cn(
              'w-7 h-7 rounded flex items-center justify-center flex-shrink-0',
              (user.current_streak ?? 0) > 0 ? 'bg-amber-500/20' : 'bg-white/5'
            )}>
              <Flame className={cn(
                'w-4 h-4',
                (user.current_streak ?? 0) > 0 ? 'text-amber-400' : 'text-paper/20'
              )} />
            </div>
            <div>
              <p className="text-[13px] font-medium text-paper/90 leading-tight">
                {user.current_streak ?? 0} day streak
              </p>
              <p className="text-[11px] text-paper/35 font-mono">best: {user.longest_streak ?? 0}</p>
            </div>
          </div>
        )}

        {/* Level */}
        <div className="bg-white/[0.04] rounded p-2.5">
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-[11px] font-mono text-paper/40 uppercase tracking-wide">Level {level.level}</span>
            <span className="text-[10px] font-mono text-accent-2">{xp} XP</span>
          </div>
          <p className="text-[12px] text-paper/70 mb-2 font-medium">{level.title}</p>
          <div className="h-1 bg-white/10 rounded-full overflow-hidden">
            <div
              className="h-full bg-accent rounded-full transition-all duration-700"
              style={{ width: `${Math.min(100, (xp / level.xpNext) * 100)}%` }}
            />
          </div>
        </div>
      </div>

      {/* User */}
      {user && (
        <Link
          href="/profile"
          className="flex items-center gap-3 px-4 py-3.5 border-t border-white/[0.06] hover:bg-white/[0.04] transition-colors"
        >
          <div className="w-7 h-7 bg-accent/20 rounded-full flex items-center justify-center flex-shrink-0 text-accent-2 text-[12px] font-semibold uppercase">
            {(user.full_name ?? user.username ?? 'U').charAt(0)}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-[13px] text-paper/80 font-medium truncate leading-tight">
              {user.full_name ?? user.username ?? 'You'}
            </p>
            <p className="text-[11px] font-mono text-paper/35 uppercase tracking-wide">{user.plan}</p>
          </div>
        </Link>
      )}
    </aside>
  )
}
