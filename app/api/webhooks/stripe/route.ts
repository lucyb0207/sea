import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'
import { createServiceClient } from '@/lib/supabase'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, { apiVersion: '2024-06-20' })

export async function POST(request: NextRequest) {
  const body = await request.text()
  const sig = request.headers.get('stripe-signature')!

  let event: Stripe.Event

  try {
    event = stripe.webhooks.constructEvent(body, sig, process.env.STRIPE_WEBHOOK_SECRET!)
  } catch (err: any) {
    console.error('Webhook signature failed:', err.message)
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 })
  }

  const supabase = createServiceClient()

  switch (event.type) {
    // ── Checkout completed ───────────────────────────────────────────────
    case 'checkout.session.completed': {
      const session = event.data.object as Stripe.Checkout.Session
      const userId = session.metadata?.supabase_user_id
      if (!userId) break

      if (session.mode === 'subscription') {
        const subscription = await stripe.subscriptions.retrieve(session.subscription as string)
        await supabase.from('users').update({
          plan: 'pro',
          stripe_subscription_id: subscription.id,
          subscription_status: 'active',
        }).eq('id', userId)
      } else {
        // One-time purchase — store in user metadata
        const productId = session.metadata?.product_id
        if (productId) {
          const { data: profile } = await supabase
            .from('users')
            .select('id')
            .eq('id', userId)
            .single()
          // Future: store purchased packs in a separate table
        }
      }
      break
    }

    // ── Subscription updated ─────────────────────────────────────────────
    case 'customer.subscription.updated': {
      const sub = event.data.object as Stripe.Subscription
      const userId = sub.metadata?.supabase_user_id
      if (!userId) break

      const status = sub.status === 'active' ? 'active'
        : sub.status === 'trialing' ? 'trialing'
        : sub.status === 'past_due' ? 'past_due'
        : 'cancelled'

      await supabase.from('users').update({
        subscription_status: status,
        plan: status === 'active' || status === 'trialing' ? 'pro' : 'free',
      }).eq('id', userId)
      break
    }

    // ── Subscription cancelled ───────────────────────────────────────────
    case 'customer.subscription.deleted': {
      const sub = event.data.object as Stripe.Subscription
      const userId = sub.metadata?.supabase_user_id
      if (!userId) break

      await supabase.from('users').update({
        plan: 'free',
        subscription_status: 'cancelled',
        stripe_subscription_id: null,
      }).eq('id', userId)
      break
    }

    // ── Payment failed ───────────────────────────────────────────────────
    case 'invoice.payment_failed': {
      const invoice = event.data.object as Stripe.Invoice
      const customerId = invoice.customer as string

      const { data: profile } = await supabase
        .from('users')
        .select('id')
        .eq('stripe_customer_id', customerId)
        .single()

      if (profile) {
        await supabase.from('users').update({
          subscription_status: 'past_due',
        }).eq('id', profile.id)
      }
      break
    }
  }

  return NextResponse.json({ received: true })
}
