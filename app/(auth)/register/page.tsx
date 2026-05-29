'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { GraduationCap, Check } from 'lucide-react'
import { toast } from 'sonner'

const PERKS = [
  'Interactive architecture builder',
  'Scenario simulator — make decisions, see outcomes',
  'AI mentor with lesson context',
  'Skill dashboard that tracks your gaps',
]

export default function RegisterPage() {
  const router = useRouter()
  const supabase = createClient()

  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [googleLoading, setGoogleLoading] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})

  function validate() {
    const errs: Record<string, string> = {}
    if (!fullName.trim()) errs.fullName = 'Name is required'
    if (!email) errs.email = 'Email is required'
    if (!password) errs.password = 'Password is required'
    if (password && password.length < 8) errs.password = 'At least 8 characters'
    return errs
  }

  async function handleRegister(e: React.FormEvent) {
    e.preventDefault()
    const errs = validate()
    if (Object.keys(errs).length) { setErrors(errs); return }
    setErrors({})
    setLoading(true)

    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { full_name: fullName },
        emailRedirectTo: `${window.location.origin}/api/auth/callback?next=/onboarding`,
      },
    })

    if (error) {
      setLoading(false)
      toast.error(error.message)
      return
    }

    router.push('/onboarding')
    router.refresh()
  }

  async function handleGoogle() {
    setGoogleLoading(true)
    await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: `${window.location.origin}/api/auth/callback?next=/onboarding` },
    })
  }

  return (
    <div className="min-h-screen bg-paper flex">
      {/* Left — perks */}
      <div className="hidden lg:flex flex-col justify-center flex-1 bg-ink px-16 py-12 relative overflow-hidden">
        <div className="absolute top-8 left-8">
          <Link href="/" className="flex items-center gap-2.5">
            <div className="w-7 h-7 bg-accent rounded flex items-center justify-center">
              <GraduationCap className="w-4 h-4 text-white" />
            </div>
            <span className="font-mono text-[11px] tracking-wider text-paper/60 uppercase">SEA</span>
          </Link>
        </div>

        <div className="max-w-sm">
          <p className="font-mono text-[11px] tracking-widest text-accent-2 uppercase mb-4">Free to start</p>
          <h2 className="font-serif text-4xl text-paper leading-tight mb-8">
            Go from writing code to designing systems.
          </h2>
          <ul className="space-y-3.5">
            {PERKS.map((perk) => (
              <li key={perk} className="flex items-start gap-3">
                <div className="w-5 h-5 bg-sea-green/20 rounded-sm flex items-center justify-center flex-shrink-0 mt-0.5">
                  <Check className="w-3 h-3 text-sea-green-light" />
                </div>
                <span className="text-[14px] text-paper/70">{perk}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* Right — form */}
      <div className="flex-1 flex flex-col justify-center px-8 py-12 max-w-md mx-auto w-full">
        <div className="animate-fade-up">
          <h1 className="font-serif text-3xl text-ink mb-1">Create your account</h1>
          <p className="text-[14px] text-ink-3 mb-8">Free forever. No credit card needed.</p>

          <form onSubmit={handleRegister} className="space-y-4">
            <Input
              label="Full name"
              placeholder="Alex Johnson"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              error={errors.fullName}
              autoComplete="name"
            />
            <Input
              label="Email"
              type="email"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              error={errors.email}
              autoComplete="email"
            />
            <Input
              label="Password"
              type="password"
              placeholder="8+ characters"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              error={errors.password}
              hint="Minimum 8 characters"
              autoComplete="new-password"
            />
            <Button type="submit" loading={loading} className="w-full" size="lg">
              Create free account
            </Button>
          </form>

          <div className="relative my-5">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-paper-3" />
            </div>
            <div className="relative flex justify-center">
              <span className="bg-paper px-3 text-[12px] text-ink-3 font-mono">OR</span>
            </div>
          </div>

          <Button
            variant="secondary"
            className="w-full"
            size="lg"
            loading={googleLoading}
            onClick={handleGoogle}
            leftIcon={
              <svg className="w-4 h-4" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
              </svg>
            }
          >
            Continue with Google
          </Button>

          <p className="text-center text-[12px] text-ink-3 mt-5">
            By signing up you agree to our{' '}
            <Link href="/terms" className="underline hover:text-ink transition-colors">Terms</Link>
            {' '}and{' '}
            <Link href="/privacy" className="underline hover:text-ink transition-colors">Privacy Policy</Link>.
          </p>

          <p className="text-center text-[13px] text-ink-3 mt-5">
            Already have an account?{' '}
            <Link href="/login" className="text-accent hover:text-accent-2 font-medium transition-colors">Sign in</Link>
          </p>
        </div>
      </div>
    </div>
  )
}
