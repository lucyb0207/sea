import { createServerSupabaseClient } from '@/lib/supabase'
import { redirect } from 'next/navigation'
import { MentorChatWindow } from '@/components/mentor/mentor-chat-window'

export const metadata = { title: 'AI Mentor' }

export default async function MentorPage() {
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const [
    { data: profile },
    { data: conversations },
  ] = await Promise.all([
    supabase.from('users').select('plan').eq('id', user.id).single(),
    supabase
      .from('mentor_conversations')
      .select('id, messages, created_at, updated_at, message_count')
      .eq('user_id', user.id)
      .order('updated_at', { ascending: false })
      .limit(20),
  ])

  const isPro = profile?.plan === 'pro' || profile?.plan === 'team'

  // Count messages this month for free tier
  const now = new Date()
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString()
  const { count: messageCount } = await supabase
    .from('mentor_conversations')
    .select('message_count', { count: 'exact' })
    .eq('user_id', user.id)
    .gte('created_at', monthStart)

  const FREE_LIMIT = 20
  const messagesUsed = messageCount ?? 0
  const messagesRemaining = isPro ? Infinity : Math.max(0, FREE_LIMIT - messagesUsed)

  return (
    <div className="h-[calc(100vh-112px)] flex flex-col animate-fade-in">
      <div className="flex items-center justify-between mb-4 flex-shrink-0">
        <div>
          <h1 className="font-serif text-3xl text-ink">AI Mentor</h1>
          <p className="text-[13px] text-ink-3 mt-0.5">
            Ask anything about system design. Context-aware, no generic answers.
          </p>
        </div>
        {!isPro && (
          <div className="text-right">
            <p className="font-mono text-[12px] text-ink-3">
              {messagesUsed}/{FREE_LIMIT} messages used
            </p>
            <p className="text-[11px] text-ink-3">Resets monthly</p>
          </div>
        )}
      </div>

      <MentorChatWindow
        userId={user.id}
        isPro={isPro}
        messagesRemaining={messagesRemaining === Infinity ? null : messagesRemaining}
        initialConversations={conversations ?? []}
      />
    </div>
  )
}
