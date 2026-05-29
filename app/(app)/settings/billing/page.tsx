import { createServerSupabaseClient } from '@/lib/supabase'
import { redirect } from 'next/navigation'
import { BillingClient } from '@/components/settings/billing-client'

export const metadata = { title: 'Billing' }

export default async function BillingPage({
  searchParams,
}: {
  searchParams: { reason?: string; success?: string; cancelled?: string }
}) {
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('users')
    .select('plan, subscription_status, stripe_subscription_id')
    .eq('id', user.id)
    .single()

  return (
    <div className="max-w-2xl animate-fade-in">
      <h1 className="font-serif text-3xl text-ink mb-1">Billing</h1>
      <p className="text-[14px] text-ink-3 mb-8">Manage your plan and subscription.</p>

      <BillingClient
        plan={profile?.plan ?? 'free'}
        subscriptionStatus={profile?.subscription_status ?? null}
        hasSubscription={!!profile?.stripe_subscription_id}
        successRedirect={!!searchParams.success}
        reason={searchParams.reason}
      />
    </div>
  )
}
