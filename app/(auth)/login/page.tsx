'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { createClient } from '@/lib/supabase'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { GraduationCap } from 'lucide-react'
import { toast } from 'sonner'

export default function LoginPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const redirectTo = searchParams.get('redirectTo') ?? '/dashboard'
  const supabase = createClient()

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [googleLoading, setGoogleLoading] = useState(false)
  const [errors, setErrors] = useState<{ email?: string; password?: string; form?: string }>({})

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault()
    setErrors({})

    if (!email) return setErrors({ email: 'Email is required' })
    if (!password) return setErrors({ password: 'Password is required' })

    setLoading(true)
    const { error } = await supabase.auth.signInWithPassword({ email, password })

    if (error) {
      setLoading(false)
      if (error.message.includes('Invalid login')) {
        setErrors({ form: 'Invalid email or password' })
      } else {
        setErrors({ form: error.message })
      }
      return
    }

    router.push(redirectTo)
    router.refresh()
  }

  async function handleGoogle() {
    setGoogleLoading(true)
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/api/auth/callback?next=${redirectTo}`,
      },
    })
    if (error) {
      toast.error(error.message)
      setGoogleLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-paper flex">
      {/* Left panel — form */}
      <div className="flex-1 flex flex-col justify-center px-8 py-12 max-w-md mx-auto w-full">
        <Link href="/" className="flex items-center gap-2.5 mb-12">
          <div className="w-8 h-8 bg-ink rounded flex items-center justify-center">
            <GraduationCap className="w-4.5 h-4.5 text-paper" />
          </div>
          <span className="font-mono text-[12px] tracking-wider text-ink-2 uppercase">Scalable Engineer Academy</span>
        </Link>

        <div className="animate-fade-up">
          <h1 className="font-serif text-3xl text-ink mb-1">Welcome back</h1>
          <p className="text-[14px] text-ink-3 mb-8">Continue your engineering journey</p>

          {errors.form && (
            <div className="mb-5 p-3.5 bg-red-50 border border-red-200 rounded text-[13px] text-red-700">
              {errors.form}
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-4">
            <Input
              label="Email"
              type="email"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              error={errors.email}
              autoComplete="email"
            />
            <div>
              <Input
                label="Password"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                error={errors.password}
                autoComplete="current-password"
              />
              <div className="text-right mt-1.5">
                <Link href="/forgot-password" className="text-[12px] text-ink-3 hover:text-accent transition-colors">
                  Forgot password?
                </Link>
              </div>
            </div>

            <Button type="submit" loading={loading} className="w-full" size="lg">
              Sign in
            </Button>
          </form>

          <div className="relative my-6">
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

          <p className="text-center text-[13px] text-ink-3 mt-6">
            No account?{' '}
            <Link href="/register" className="text-accent hover:text-accent-2 font-medium transition-colors">
              Sign up free
            </Link>
          </p>
        </div>
      </div>

      {/* Right panel — visual */}
      <div className="hidden lg:flex flex-1 bg-ink items-center justify-center p-12 relative overflow-hidden">
        <div className="absolute inset-0 opacity-[0.04]"
          style={{
            backgroundImage: `repeating-linear-gradient(0deg, transparent, transparent 39px, rgba(245,243,237,0.5) 39px, rgba(245,243,237,0.5) 40px),
              repeating-linear-gradient(90deg, transparent, transparent 39px, rgba(245,243,237,0.5) 39px, rgba(245,243,237,0.5) 40px)`
          }}
        />
        <div className="relative max-w-sm text-center">
          <p className="font-serif text-5xl text-paper leading-tight mb-4">
            "I stopped googling and started <em className="text-accent-2 not-italic">thinking</em>"
          </p>
          <p className="text-[14px] text-paper/40 font-mono">— SEA member, 3 months in</p>
        </div>
      </div>
    </div>
  )
}
