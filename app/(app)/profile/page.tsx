import { createServerSupabaseClient } from '@/lib/supabase'
import { redirect } from 'next/navigation'
import { ProfileClient } from '@/components/settings/profile-client'

export const metadata = { title: 'Profile' }

export default async function ProfilePage() {
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('users')
    .select('*')
    .eq('id', user.id)
    .single()

  return (
    <div className="max-w-xl animate-fade-in">
      <h1 className="font-serif text-3xl text-ink mb-1">Profile</h1>
      <p className="text-[14px] text-ink-3 mb-8">Your account details.</p>
      <ProfileClient profile={profile} email={user.email ?? ''} />
    </div>
  )
}
