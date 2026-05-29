import { createServerSupabaseClient } from '@/lib/supabase'
import { redirect } from 'next/navigation'
import { AppSidebar } from '@/components/layout/app-sidebar'
import { AppTopbar } from '@/components/layout/app-topbar'

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('users')
    .select('*')
    .eq('id', user.id)
    .single()

  if (profile && !profile.onboarding_complete) {
    redirect('/onboarding')
  }

  return (
    <div className="flex h-screen overflow-hidden bg-paper-2">
      <AppSidebar user={profile} />
      <div className="flex flex-col flex-1 min-w-0 overflow-hidden">
        <AppTopbar user={profile} />
        <main className="flex-1 overflow-y-auto">
          <div className="max-w-6xl mx-auto px-6 py-8">
            {children}
          </div>
        </main>
      </div>
    </div>
  )
}
