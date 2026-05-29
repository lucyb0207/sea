import Link from 'next/link'
import { createServerSupabaseClient } from '@/lib/supabase'
import { redirect } from 'next/navigation'
import { ChevronRight, User, CreditCard, Bell, Shield } from 'lucide-react'

export const metadata = { title: 'Settings' }

const SETTINGS_LINKS = [
  { href: '/profile',          icon: User,       label: 'Profile',        desc: 'Name, username, avatar' },
  { href: '/settings/billing', icon: CreditCard, label: 'Billing',        desc: 'Plan, payments, invoices' },
  { href: '/settings/notifications', icon: Bell, label: 'Notifications',  desc: 'Email preferences, reminders' },
  { href: '/settings/security', icon: Shield,    label: 'Security',       desc: 'Password, connected accounts' },
]

export default async function SettingsPage() {
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  return (
    <div className="max-w-xl animate-fade-in">
      <h1 className="font-serif text-3xl text-ink mb-1">Settings</h1>
      <p className="text-[14px] text-ink-3 mb-8">Manage your account preferences.</p>

      <div className="space-y-1.5">
        {SETTINGS_LINKS.map(({ href, icon: Icon, label, desc }) => (
          <Link
            key={href}
            href={href}
            className="flex items-center gap-4 p-4 bg-paper border border-paper-3 rounded-lg hover:border-ink-2 hover:bg-paper-2 transition-all group"
          >
            <div className="w-9 h-9 bg-paper-2 border border-paper-3 rounded flex items-center justify-center flex-shrink-0 group-hover:border-ink-2 transition-colors">
              <Icon className="w-4 h-4 text-ink-2" />
            </div>
            <div className="flex-1">
              <p className="text-[14px] font-medium text-ink">{label}</p>
              <p className="text-[12px] text-ink-3">{desc}</p>
            </div>
            <ChevronRight className="w-4 h-4 text-ink-3 group-hover:text-ink transition-colors" />
          </Link>
        ))}
      </div>
    </div>
  )
}
