'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { GraduationCap, ChevronRight, Check } from 'lucide-react'
import { toast } from 'sonner'

type Role = 'junior' | 'mid' | 'self_taught' | 'student'
type Goal = 'interviews' | 'promotion' | 'fundamentals' | 'architecture' | 'curiosity'
type SkillLevel = 'none' | 'some' | 'confident'

const ROLES = [
  { id: 'junior' as Role,      label: 'Junior developer',     desc: 'Under 2 years experience' },
  { id: 'mid' as Role,         label: 'Mid-level developer',  desc: '2–5 years experience' },
  { id: 'self_taught' as Role, label: 'Self-taught',          desc: 'No formal CS background' },
  { id: 'student' as Role,     label: 'Student',              desc: 'CS degree in progress' },
]

const GOALS = [
  { id: 'interviews' as Goal,   label: 'Ace system design interviews' },
  { id: 'promotion' as Goal,    label: 'Get promoted to senior' },
  { id: 'fundamentals' as Goal, label: 'Fill gaps in my fundamentals' },
  { id: 'architecture' as Goal, label: 'Design better systems at work' },
  { id: 'curiosity' as Goal,    label: 'I\'m just curious' },
]

const SKILLS = [
  { key: 'databases',           label: 'Databases & SQL' },
  { key: 'caching',             label: 'Caching (Redis etc.)' },
  { key: 'load_balancing',      label: 'Load balancing' },
  { key: 'distributed_systems', label: 'Distributed systems' },
  { key: 'message_queues',      label: 'Message queues (Kafka etc.)' },
  { key: 'networking',          label: 'Networking & HTTP' },
]

const SKILL_OPTIONS: { id: SkillLevel; label: string }[] = [
  { id: 'none',      label: 'Not really' },
  { id: 'some',      label: 'Some idea' },
  { id: 'confident', label: 'Confident' },
]

export default function OnboardingPage() {
  const router = useRouter()
  const supabase = createClient()

  const [step, setStep] = useState(0)
  const [role, setRole] = useState<Role | null>(null)
  const [goals, setGoals] = useState<Goal[]>([])
  const [skillLevels, setSkillLevels] = useState<Record<string, SkillLevel>>({})
  const [saving, setSaving] = useState(false)

  const totalSteps = 3

  function toggleGoal(g: Goal) {
    setGoals((prev) => prev.includes(g) ? prev.filter((x) => x !== g) : [...prev, g])
  }

  function setSkill(key: string, level: SkillLevel) {
    setSkillLevels((prev) => ({ ...prev, [key]: level }))
  }

  async function handleFinish() {
    setSaving(true)
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { router.push('/login'); return }

    // Upsert profile
    const { error: profileError } = await supabase
      .from('users')
      .upsert({
        id: user.id,
        onboarding_complete: true,
      })

    if (profileError) {
      toast.error('Failed to save your profile. Please try again.')
      setSaving(false)
      return
    }

    // Seed initial skill scores based on self-assessment
    const skillRows = Object.entries(skillLevels).map(([skill, level]) => ({
      user_id: user.id,
      skill,
      score: level === 'none' ? 5 : level === 'some' ? 25 : 55,
      updated_at: new Date().toISOString(),
    }))

    if (skillRows.length > 0) {
      await supabase.from('skill_scores').upsert(skillRows, { onConflict: 'user_id,skill' })
    }

    router.push('/dashboard')
    router.refresh()
  }

  const canNext = [
    role !== null,
    goals.length > 0,
    true, // skill step is optional
  ][step]

  return (
    <div className="min-h-screen bg-paper flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between px-8 py-5 border-b border-paper-3">
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 bg-ink rounded flex items-center justify-center">
            <GraduationCap className="w-4 h-4 text-paper" />
          </div>
          <span className="font-mono text-[12px] tracking-wider text-ink-2 uppercase">Scalable Engineer Academy</span>
        </div>
        {/* Step dots */}
        <div className="flex items-center gap-2">
          {Array.from({ length: totalSteps }).map((_, i) => (
            <div
              key={i}
              className={cn(
                'rounded-full transition-all duration-300',
                i < step ? 'w-2 h-2 bg-sea-green' :
                i === step ? 'w-6 h-2 bg-ink' :
                'w-2 h-2 bg-paper-3'
              )}
            />
          ))}
        </div>
      </div>

      {/* Body */}
      <div className="flex-1 flex items-center justify-center px-8 py-12">
        <div className="w-full max-w-lg animate-fade-up">

          {/* Step 0 — Role */}
          {step === 0 && (
            <div>
              <p className="font-mono text-[11px] tracking-widest text-accent uppercase mb-3">Step 1 of 3</p>
              <h1 className="font-serif text-3xl text-ink mb-2">What describes you best?</h1>
              <p className="text-[14px] text-ink-3 mb-8">We'll personalise your learning path.</p>
              <div className="space-y-3">
                {ROLES.map((r) => (
                  <button
                    key={r.id}
                    onClick={() => setRole(r.id)}
                    className={cn(
                      'w-full text-left px-5 py-4 rounded-md border transition-all duration-150',
                      role === r.id
                        ? 'border-ink bg-ink text-paper'
                        : 'border-paper-3 bg-paper hover:border-ink-2 hover:bg-paper-2'
                    )}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <p className={cn('font-medium text-[14px]', role === r.id ? 'text-paper' : 'text-ink')}>
                          {r.label}
                        </p>
                        <p className={cn('text-[13px] mt-0.5', role === r.id ? 'text-paper/60' : 'text-ink-3')}>
                          {r.desc}
                        </p>
                      </div>
                      {role === r.id && (
                        <div className="w-5 h-5 bg-accent rounded-full flex items-center justify-center flex-shrink-0">
                          <Check className="w-3 h-3 text-white" />
                        </div>
                      )}
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Step 1 — Goals */}
          {step === 1 && (
            <div>
              <p className="font-mono text-[11px] tracking-widest text-accent uppercase mb-3">Step 2 of 3</p>
              <h1 className="font-serif text-3xl text-ink mb-2">What are you here for?</h1>
              <p className="text-[14px] text-ink-3 mb-8">Pick all that apply.</p>
              <div className="space-y-2.5">
                {GOALS.map((g) => {
                  const selected = goals.includes(g.id)
                  return (
                    <button
                      key={g.id}
                      onClick={() => toggleGoal(g.id)}
                      className={cn(
                        'w-full text-left px-5 py-3.5 rounded-md border transition-all duration-150 flex items-center justify-between',
                        selected
                          ? 'border-ink bg-ink text-paper'
                          : 'border-paper-3 bg-paper hover:border-ink-2'
                      )}
                    >
                      <span className={cn('text-[14px] font-medium', selected ? 'text-paper' : 'text-ink')}>
                        {g.label}
                      </span>
                      {selected && (
                        <div className="w-5 h-5 bg-accent rounded-full flex items-center justify-center flex-shrink-0">
                          <Check className="w-3 h-3 text-white" />
                        </div>
                      )}
                    </button>
                  )
                })}
              </div>
            </div>
          )}

          {/* Step 2 — Skill self-assessment */}
          {step === 2 && (
            <div>
              <p className="font-mono text-[11px] tracking-widest text-accent uppercase mb-3">Step 3 of 3</p>
              <h1 className="font-serif text-3xl text-ink mb-2">Rate your current knowledge</h1>
              <p className="text-[14px] text-ink-3 mb-8">
                Honest answers help us show you the right content first. You can skip any.
              </p>
              <div className="space-y-4">
                {SKILLS.map(({ key, label }) => (
                  <div key={key}>
                    <p className="text-[13px] font-medium text-ink mb-2">{label}</p>
                    <div className="flex gap-2">
                      {SKILL_OPTIONS.map((opt) => (
                        <button
                          key={opt.id}
                          onClick={() => setSkill(key, opt.id)}
                          className={cn(
                            'flex-1 py-2 px-3 rounded border text-[13px] font-medium transition-all duration-150',
                            skillLevels[key] === opt.id
                              ? 'border-ink bg-ink text-paper'
                              : 'border-paper-3 bg-paper-2 text-ink-2 hover:border-ink-2 hover:bg-paper'
                          )}
                        >
                          {opt.label}
                        </button>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Navigation */}
          <div className="flex items-center justify-between mt-10">
            {step > 0 ? (
              <button
                onClick={() => setStep((s) => s - 1)}
                className="text-[13px] text-ink-3 hover:text-ink transition-colors font-medium"
              >
                ← Back
              </button>
            ) : <div />}

            {step < totalSteps - 1 ? (
              <Button
                onClick={() => setStep((s) => s + 1)}
                disabled={!canNext}
                rightIcon={<ChevronRight className="w-4 h-4" />}
                size="lg"
              >
                Continue
              </Button>
            ) : (
              <Button onClick={handleFinish} loading={saving} size="lg" variant="accent">
                Go to dashboard →
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
