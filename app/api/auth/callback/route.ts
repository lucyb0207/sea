import { createServerSupabaseClient } from '@/lib/supabase'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  const next = searchParams.get('next') ?? '/dashboard'

  if (code) {
    const supabase = await createServerSupabaseClient()
    const { data, error } = await supabase.auth.exchangeCodeForSession(code)

    if (!error && data.user) {
      // Ensure profile row exists for new OAuth users
      const { data: existing } = await supabase
        .from('users')
        .select('id')
        .eq('id', data.user.id)
        .single()

      if (!existing) {
        await supabase.from('users').insert({
          id: data.user.id,
          full_name: data.user.user_metadata?.full_name ?? null,
          avatar_url: data.user.user_metadata?.avatar_url ?? null,
          plan: 'free',
          current_streak: 0,
          longest_streak: 0,
          onboarding_complete: false,
        })
        return NextResponse.redirect(`${origin}/onboarding`)
      }

      return NextResponse.redirect(`${origin}${next}`)
    }
  }

  return NextResponse.redirect(`${origin}/login?error=oauth_failed`)
}
