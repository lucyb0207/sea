import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase'

export async function POST(request: NextRequest) {
  const { email, source } = await request.json()

  if (!email || !email.includes('@')) {
    return NextResponse.json({ error: 'Invalid email' }, { status: 400 })
  }

  const supabase = createServiceClient()

  const { error } = await supabase
    .from('waitlist')
    .insert({ email: email.toLowerCase().trim(), source: source ?? 'unknown' })

  if (error) {
    if (error.code === '23505') {
      // Already on waitlist — silent success
      return NextResponse.json({ ok: true, alreadyExists: true })
    }
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ ok: true })
}
