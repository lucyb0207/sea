'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/primitives'
import { Check, Zap, Users, ExternalLink, AlertCircle } from 'lucide-react'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'

const PLANS = [
  {
    id: 'free',
    label: 'Free',
    price: '£0',
    period: 'forever',
    features: [
      '2 learning paths',
      '5 challenges per month',
      '20 AI mentor messages/month',
      'Progress dashboard',
      'Skill tracking',
    ],
    cta: 'Current plan',
    priceId: null,
  },
  {
    id: 'pro_monthly',
    label: 'Pro',
    price: '£12',
    period: '/month',
    annualNote: '£99/year — save 31%',
    features: [
      'All learning paths',
      'Unlimited AI mentor',
      'Architecture simulator',
      'Interview prep mode',
      'Real-world projects',
      'Certificates',
      'Streak freeze (2/month)',
    ],
    cta: 'Upgrade to Pro',
    priceId: process.env.NEXT_PUBLIC_STRIPE_PRO_MONTHLY_PRICE_ID,
    featured: true,
  },
  {
    id: 'pro_annual',
    label: 'Pro Annual',
    price: '£99',
    period: '/year',
    annualNote: 'Best value — save £45',
    features: [
      'Everything in Pro Monthly',
      'Priority support',
      'Early access to new features',
    ],
    cta: 'Get annual plan',
    priceId: process.env.NEXT_PUBLIC_STRIPE_PRO_ANNUAL_PRICE_ID,
  },
]

const ONE_TIME_PACKS = [
  { id: 'interview_pack',   label: 'Interview Prep Pack',    price: '£49', desc: '150 questions, AI interviewer, mock sessions' },
  { id: 'netflix_pack',     label: 'Netflix Architecture',   price: '£19', desc: 'Deep dive: CDN, transcoding, recommendations' },
  { id: 'microservices',    label: 'Microservices Pack',     price: '£25', desc: 'Service mesh, event sourcing, CQRS, Saga pattern' },
  { id: 'distributed_pack', label: 'Distributed Systems',   price: '£29', desc: 'Consensus, clock sync, partition tolerance' },
]

interface BillingClientProps {
  plan: string
  subscriptionStatus: string | null
  hasSubscription: boolean
  successRedirect: boolean
  reason?: string
}

export function BillingClient({
  plan,
  subscriptionStatus,
  hasSubscription,
  successRedirect,
  reason,
}: BillingClientProps) {
  const [loading, setLoading] = useState<string | null>(null)
  const isPro = plan === 'pro' || plan === 'team'

  async function handleUpgrade(priceId: string, planId: string) {
    setLoading(planId)
    try {
      const res = await fetch('/api/billing/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ priceId }),
      })
      const data = await res.json()
      if (data.url) {
        window.location.href = data.url
      } else {
        throw new Error(data.error ?? 'Checkout failed')
      }
    } catch (e: any) {
      toast.error(e.message ?? 'Something went wrong')
    } finally {
      setLoading(null)
    }
  }

  async function handleManage() {
    setLoading('manage')
    try {
      const res = await fetch('/api/billing/portal', { method: 'POST' })
      const data = await res.json()
      if (data.url) window.location.href = data.url
    } catch {
      toast.error('Could not open billing portal')
    } finally {
      setLoading(null)
    }
  }

  return (
    <div className="space-y-8">
      {/* Success banner */}
      {successRedirect && (
        <div className="flex items-center gap-3 bg-sea-green-light border border-sea-green/20 rounded-lg px-5 py-4">
          <Check className="w-5 h-5 text-sea-green flex-shrink-0" />
          <div>
            <p className="text-[14px] font-medium text-sea-green">Upgrade successful!</p>
            <p className="text-[13px] text-sea-green/70 mt-0.5">
              Your Pro features are now active. Go build something.
            </p>
          </div>
        </div>
      )}

      {/* Reason banner */}
      {reason === 'lesson_locked' && !isPro && (
        <div className="flex items-center gap-3 bg-amber-50 border border-amber-200 rounded-lg px-5 py-4">
          <AlertCircle className="w-5 h-5 text-amber-600 flex-shrink-0" />
          <p className="text-[13px] text-amber-800">
            This content requires a Pro plan. Upgrade below to unlock it.
          </p>
        </div>
      )}

      {/* Current plan */}
      <div className="bg-paper border border-paper-3 rounded-lg p-5">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-[13px] text-ink-3 font-mono uppercase tracking-wide mb-1">Current plan</p>
            <div className="flex items-center gap-2">
              <p className="font-serif text-2xl text-ink capitalize">{plan}</p>
              {subscriptionStatus && (
                <Badge variant={subscriptionStatus === 'active' ? 'success' : 'warning'}>
                  {subscriptionStatus}
                </Badge>
              )}
            </div>
          </div>
          {hasSubscription && (
            <Button
              variant="outline"
              size="sm"
              loading={loading === 'manage'}
              onClick={handleManage}
              rightIcon={<ExternalLink className="w-3.5 h-3.5" />}
            >
              Manage subscription
            </Button>
          )}
        </div>
      </div>

      {/* Plan cards */}
      {!isPro && (
        <>
          <h2 className="font-medium text-[15px] text-ink">Upgrade your plan</h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {PLANS.map((p) => {
              const isCurrent = p.id === 'free' && plan === 'free'
              return (
                <div
                  key={p.id}
                  className={cn(
                    'relative rounded-lg border p-5 flex flex-col',
                    p.featured
                      ? 'border-ink bg-ink text-paper'
                      : 'border-paper-3 bg-paper'
                  )}
                >
                  {p.featured && (
                    <div className="absolute -top-2.5 left-1/2 -translate-x-1/2 bg-accent text-white font-mono text-[10px] tracking-wide uppercase px-3 py-1 rounded-full">
                      Most popular
                    </div>
                  )}

                  <div className="mb-4">
                    <p className={cn('font-mono text-[11px] uppercase tracking-wide mb-2', p.featured ? 'text-paper/50' : 'text-ink-3')}>
                      {p.label}
                    </p>
                    <div className="flex items-baseline gap-1">
                      <span className={cn('font-serif text-3xl', p.featured ? 'text-paper' : 'text-ink')}>
                        {p.price}
                      </span>
                      <span className={cn('text-[13px]', p.featured ? 'text-paper/50' : 'text-ink-3')}>
                        {p.period}
                      </span>
                    </div>
                    {p.annualNote && (
                      <p className={cn('text-[11px] font-mono mt-1', p.featured ? 'text-accent-2' : 'text-sea-green')}>
                        {p.annualNote}
                      </p>
                    )}
                  </div>

                  <ul className="space-y-2 flex-1 mb-5">
                    {p.features.map((f) => (
                      <li key={f} className={cn('flex items-start gap-2 text-[13px]', p.featured ? 'text-paper/80' : 'text-ink-2')}>
                        <Check className={cn('w-3.5 h-3.5 mt-0.5 flex-shrink-0', p.featured ? 'text-accent-2' : 'text-sea-green')} />
                        {f}
                      </li>
                    ))}
                  </ul>

                  {isCurrent ? (
                    <Button variant="outline" size="sm" disabled className="w-full">
                      Current plan
                    </Button>
                  ) : p.priceId ? (
                    <Button
                      variant={p.featured ? 'accent' : 'secondary'}
                      size="sm"
                      className="w-full"
                      loading={loading === p.id}
                      onClick={() => handleUpgrade(p.priceId!, p.id)}
                      leftIcon={<Zap className="w-3.5 h-3.5" />}
                    >
                      {p.cta}
                    </Button>
                  ) : null}
                </div>
              )
            })}
          </div>
        </>
      )}

      {/* One-time packs */}
      <div>
        <h2 className="font-medium text-[15px] text-ink mb-3">One-time packs</h2>
        <p className="text-[13px] text-ink-3 mb-4">No subscription needed. Buy once, keep forever.</p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {ONE_TIME_PACKS.map((pack) => (
            <div
              key={pack.id}
              className="flex items-start justify-between bg-paper border border-paper-3 rounded-lg p-4 gap-4"
            >
              <div className="flex-1">
                <p className="text-[14px] font-medium text-ink">{pack.label}</p>
                <p className="text-[12px] text-ink-3 mt-0.5">{pack.desc}</p>
              </div>
              <div className="flex flex-col items-end gap-2 flex-shrink-0">
                <span className="font-serif text-lg text-ink">{pack.price}</span>
                <Button
                  size="sm"
                  variant="outline"
                  loading={loading === pack.id}
                  onClick={() => handleUpgrade(`price_${pack.id}`, pack.id)}
                >
                  Buy
                </Button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
