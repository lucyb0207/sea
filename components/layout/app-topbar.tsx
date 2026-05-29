'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase'
import { cn, slugToTitle } from '@/lib/utils'
import type { UserProfile } from '@/types'
import { Settings, LogOut, ChevronRight } from 'lucide-react'
import * as DropdownMenu from '@radix-ui/react-dropdown-menu'

interface AppTopbarProps {
  user: UserProfile | null
}

export function AppTopbar({ user }: AppTopbarProps) {
  const pathname = usePathname()
  const router = useRouter()
  const supabase = createClient()

  // Build breadcrumbs from pathname
  const segments = pathname.split('/').filter(Boolean)
  const crumbs = segments.map((seg, i) => ({
    label: slugToTitle(seg),
    href: '/' + segments.slice(0, i + 1).join('/'),
  }))

  async function handleSignOut() {
    await supabase.auth.signOut()
    router.push('/login')
    router.refresh()
  }

  return (
    <header className="h-12 flex-shrink-0 flex items-center justify-between px-6 bg-paper border-b border-paper-3">

      {/* Breadcrumbs */}
      <nav className="flex items-center gap-1.5 text-[13px]">
        {crumbs.map((crumb, i) => (
          <span key={crumb.href} className="flex items-center gap-1.5">
            {i > 0 && <ChevronRight className="w-3 h-3 text-ink-3" />}
            {i === crumbs.length - 1 ? (
              <span className="font-medium text-ink">{crumb.label}</span>
            ) : (
              <Link href={crumb.href} className="text-ink-3 hover:text-ink transition-colors">
                {crumb.label}
              </Link>
            )}
          </span>
        ))}
      </nav>

      {/* User dropdown */}
      {user && (
        <DropdownMenu.Root>
          <DropdownMenu.Trigger asChild>
            <button className="flex items-center gap-2 text-[13px] text-ink-2 hover:text-ink transition-colors focus-visible:outline-none group">
              <div className="w-7 h-7 bg-paper-2 border border-paper-3 rounded-full flex items-center justify-center text-[11px] font-semibold text-ink uppercase group-hover:border-ink-3 transition-colors">
                {(user.full_name ?? user.username ?? 'U').charAt(0)}
              </div>
            </button>
          </DropdownMenu.Trigger>

          <DropdownMenu.Portal>
            <DropdownMenu.Content
              align="end"
              sideOffset={8}
              className="w-48 bg-paper border border-paper-3 rounded-md shadow-card-hover py-1 z-50 animate-fade-in"
            >
              <div className="px-3 py-2 border-b border-paper-3 mb-1">
                <p className="text-[13px] font-medium text-ink truncate">
                  {user.full_name ?? user.username ?? 'Your account'}
                </p>
                <p className="text-[11px] font-mono text-ink-3 uppercase tracking-wide mt-0.5">
                  {user.plan} plan
                </p>
              </div>

              <DropdownMenu.Item asChild>
                <Link
                  href="/settings"
                  className="flex items-center gap-2.5 px-3 py-2 text-[13px] text-ink-2 hover:text-ink hover:bg-paper-2 transition-colors cursor-pointer outline-none"
                >
                  <Settings className="w-3.5 h-3.5" />
                  Settings
                </Link>
              </DropdownMenu.Item>

              <DropdownMenu.Item
                onSelect={handleSignOut}
                className="flex items-center gap-2.5 px-3 py-2 text-[13px] text-ink-2 hover:text-ink hover:bg-paper-2 transition-colors cursor-pointer outline-none"
              >
                <LogOut className="w-3.5 h-3.5" />
                Sign out
              </DropdownMenu.Item>
            </DropdownMenu.Content>
          </DropdownMenu.Portal>
        </DropdownMenu.Root>
      )}
    </header>
  )
}
