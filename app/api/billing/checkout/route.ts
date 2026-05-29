import { createServerSupabaseClient } from '@/lib/supabase'
import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, { apiVersion: '2024-06-20' })

export async function POST(request: NextRequest) {
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { priceId } = await request.json()
  if (!priceId) return NextResponse.json({ error: 'Missing priceId' }, { status: 400 })

  const { data: profile } = await supabase
    .from('users')
    .select('stripe_customer_id, full_name')
    .eq('id', user.id)
    .single()

  // Get or create Stripe customer
  let customerId = profile?.stripe_customer_id

  if (!customerId) {
    const customer = await stripe.customers.create({
      email: user.email!,
      name: profile?.full_name ?? undefined,
      metadata: { supabase_user_id: user.id },
    })
    customerId = customer.id

    await supabase
      .from('users')
      .update({ stripe_customer_id: customerId })
      .eq('id', user.id)
  }

  const appUrl = process.env.NEXT_PUBLIC_APP_URL!

  // Determine if this is a subscription or one-time payment
  const price = await stripe.prices.retrieve(priceId)
  const isSubscription = price.type === 'recurring'

  const session = await stripe.checkout.sessions.create({
    customer: customerId,
    payment_method_types: ['card'],
    mode: isSubscription ? 'subscription' : 'payment',
    line_items: [{ price: priceId, quantity: 1 }],
    success_url: `${appUrl}/settings/billing?success=1`,
    cancel_url: `${appUrl}/settings/billing?cancelled=1`,
    metadata: { supabase_user_id: user.id },
    subscription_data: isSubscription ? {
      metadata: { supabase_user_id: user.id },
    } : undefined,
    allow_promotion_codes: true,
    billing_address_collection: 'auto',
  })

  return NextResponse.json({ url: session.url })
}
