'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/primitives'
import type { UserProfile } from '@/types'
import { User, Mail, Calendar } from 'lucide-react'
import { toast } from 'sonner'
import { formatDate } from '@/lib/utils'

interface ProfileClientProps {
  profile: UserProfile | null
  email: string
}

export function ProfileClient({ profile, email }: ProfileClientProps) {
  const supabase = createClient()
  const [fullName, setFullName] = useState(profile?.full_name ?? '')
  const [username, setUsername] = useState(profile?.username ?? '')
  const [saving, setSaving] = useState(false)

  async function handleSave(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)

    const { error } = await supabase
      .from('users')
      .update({ full_name: fullName.trim() || null, username: username.trim() || null })
      .eq('id', profile!.id)

    setSaving(false)

    if (error) {
      if (error.code === '23505') {
        toast.error('That username is already taken.')
      } else {
        toast.error('Failed to save — please try again.')
      }
    } else {
      toast.success('Profile updated.')
    }
  }

  return (
    <div className="space-y-6">
      {/* Avatar */}
      <div className="flex items-center gap-4">
        <div className="w-16 h-16 bg-paper-2 border border-paper-3 rounded-full flex items-center justify-center text-2xl font-semibold text-ink uppercase">
          {(fullName || email).charAt(0)}
        </div>
        <div>
          <p className="font-medium text-[15px] text-ink">{fullName || 'No name set'}</p>
          <p className="text-[13px] text-ink-3">{email}</p>
        </div>
      </div>

      {/* Info cards */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { icon: Mail, label: 'Email', value: email },
          { icon: Calendar, label: 'Joined', value: profile?.created_at ? formatDate(profile.created_at) : '—' },
          { icon: User, label: 'Plan', value: profile?.plan ?? 'free', badge: true },
        ].map(({ icon: Icon, label, value, badge }) => (
          <div key={label} className="bg-paper-2 border border-paper-3 rounded-lg p-3">
            <div className="flex items-center gap-1.5 mb-1.5">
              <Icon className="w-3.5 h-3.5 text-ink-3" />
              <span className="font-mono text-[10px] text-ink-3 uppercase tracking-wide">{label}</span>
            </div>
            {badge
              ? <Badge variant={value === 'free' ? 'default' : 'pro'}>{value}</Badge>
              : <p className="text-[13px] text-ink truncate">{value}</p>
            }
          </div>
        ))}
      </div>

      {/* Edit form */}
      <form onSubmit={handleSave} className="space-y-4 bg-paper border border-paper-3 rounded-lg p-5">
        <h2 className="font-medium text-[14px] text-ink">Edit details</h2>
        <Input
          label="Full name"
          value={fullName}
          onChange={(e) => setFullName(e.target.value)}
          placeholder="Your name"
        />
        <Input
          label="Username"
          value={username}
          onChange={(e) => setUsername(e.target.value.toLowerCase().replace(/[^a-z0-9_-]/g, ''))}
          placeholder="your_username"
          hint="Letters, numbers, underscores, hyphens only."
        />
        <Button type="submit" loading={saving} size="md">
          Save changes
        </Button>
      </form>

      {/* Danger zone */}
      <div className="border border-red-200 rounded-lg p-5">
        <h2 className="font-medium text-[14px] text-red-700 mb-1">Danger zone</h2>
        <p className="text-[13px] text-ink-3 mb-3">
          Deleting your account is permanent and cannot be undone.
        </p>
        <Button
          variant="danger"
          size="sm"
          onClick={() => toast.error('Please contact support to delete your account.')}
        >
          Delete account
        </Button>
      </div>
    </div>
  )
}
