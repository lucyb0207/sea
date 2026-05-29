'use client'

import { useState, useRef, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/input'
import type { MentorMessage, MentorConversation } from '@/types'
import { Send, Plus, MessageSquare, Bot, User, ChevronRight, Lock, Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils'
import Link from 'next/link'
import { toast } from 'sonner'

const SUGGESTED_QUESTIONS = [
  'Why use Kafka instead of Redis for a queue?',
  'When should I add a cache to my architecture?',
  'Explain the CAP theorem in simple terms',
  'What\'s the difference between horizontal and vertical scaling?',
  'How does consistent hashing work?',
  'When should I use a read replica vs a cache?',
]

interface MentorChatWindowProps {
  userId: string
  isPro: boolean
  messagesRemaining: number | null
  initialConversations: MentorConversation[]
}

export function MentorChatWindow({
  userId,
  isPro,
  messagesRemaining,
  initialConversations,
}: MentorChatWindowProps) {
  const [messages, setMessages] = useState<MentorMessage[]>([])
  const [input, setInput] = useState('')
  const [isStreaming, setIsStreaming] = useState(false)
  const [remaining, setRemaining] = useState(messagesRemaining)
  const [conversationId, setConversationId] = useState<string | null>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  async function sendMessage(content: string) {
    if (!content.trim()) return
    if (!isPro && remaining !== null && remaining <= 0) {
      toast.error('Monthly message limit reached — upgrade to Pro for unlimited access.')
      return
    }

    const userMsg: MentorMessage = { role: 'user', content: content.trim() }
    const updatedMessages = [...messages, userMsg]
    setMessages(updatedMessages)
    setInput('')
    setIsStreaming(true)

    // Optimistically add streaming placeholder
    setMessages((prev) => [...prev, { role: 'assistant', content: '' }])

    try {
      const res = await fetch('/api/mentor/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: updatedMessages,
          conversationId,
        }),
      })

      if (!res.ok) throw new Error('API error')

      const reader = res.body?.getReader()
      const decoder = new TextDecoder()
      let assistantContent = ''
      let newConvId: string | null = null

      while (reader) {
        const { done, value } = await reader.read()
        if (done) break

        const chunk = decoder.decode(value)
        const lines = chunk.split('\n').filter(Boolean)

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const data = line.slice(6)
            if (data === '[DONE]') break

            try {
              const parsed = JSON.parse(data)
              if (parsed.text) {
                assistantContent += parsed.text
                setMessages((prev) => {
                  const updated = [...prev]
                  updated[updated.length - 1] = { role: 'assistant', content: assistantContent }
                  return updated
                })
              }
              if (parsed.conversationId) {
                newConvId = parsed.conversationId
              }
            } catch {}
          }
        }
      }

      if (newConvId) setConversationId(newConvId)
      if (!isPro && remaining !== null) {
        setRemaining((r) => (r !== null ? r - 1 : null))
      }
    } catch {
      setMessages((prev) => prev.slice(0, -1)) // remove placeholder
      toast.error('Failed to send message — please try again.')
    } finally {
      setIsStreaming(false)
    }
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      sendMessage(input)
    }
  }

  function startNewConversation() {
    setMessages([])
    setConversationId(null)
  }

  const isLimited = !isPro && remaining !== null && remaining <= 0

  return (
    <div className="flex flex-1 min-h-0 gap-4">
      {/* Conversation history sidebar */}
      <aside className="w-44 flex-shrink-0 flex flex-col gap-2">
        <button
          onClick={startNewConversation}
          className="flex items-center gap-2 px-3 py-2.5 rounded border border-paper-3 bg-paper text-[13px] text-ink-2 hover:bg-paper-2 hover:border-ink-2 transition-all"
        >
          <Plus className="w-3.5 h-3.5" />
          New chat
        </button>

        <div className="flex-1 overflow-y-auto space-y-1">
          {initialConversations.map((conv) => (
            <button
              key={conv.id}
              onClick={() => {
                setConversationId(conv.id)
                setMessages(conv.messages ?? [])
              }}
              className={cn(
                'w-full text-left px-3 py-2 rounded text-[12px] transition-colors truncate',
                conversationId === conv.id
                  ? 'bg-paper-3 text-ink font-medium'
                  : 'text-ink-3 hover:bg-paper-2 hover:text-ink'
              )}
            >
              <MessageSquare className="w-3 h-3 inline mr-1.5 opacity-50" />
              {conv.messages?.[0]?.content?.slice(0, 28) ?? 'Conversation'}…
            </button>
          ))}
        </div>
      </aside>

      {/* Main chat */}
      <div className="flex-1 flex flex-col min-h-0 bg-paper border border-paper-3 rounded-lg shadow-card overflow-hidden">

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-5 space-y-4">
          {messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full gap-6 text-center py-8">
              <div className="w-12 h-12 bg-ink rounded-full flex items-center justify-center">
                <Bot className="w-6 h-6 text-paper" />
              </div>
              <div>
                <p className="font-serif text-xl text-ink mb-1">Ask me anything</p>
                <p className="text-[13px] text-ink-3 max-w-xs">
                  System design, architecture tradeoffs, scaling decisions. I use your current context to give specific answers.
                </p>
              </div>
              <div className="grid grid-cols-2 gap-2 w-full max-w-lg">
                {SUGGESTED_QUESTIONS.map((q) => (
                  <button
                    key={q}
                    onClick={() => sendMessage(q)}
                    disabled={isLimited}
                    className="text-left px-3 py-2.5 bg-paper-2 border border-paper-3 rounded text-[12px] text-ink-2 hover:border-ink-2 hover:bg-paper hover:text-ink transition-all leading-snug"
                  >
                    {q}
                  </button>
                ))}
              </div>
            </div>
          ) : (
            messages.map((msg, i) => (
              <MentorMessageBubble key={i} message={msg} isStreaming={isStreaming && i === messages.length - 1 && msg.role === 'assistant'} />
            ))
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Paywall */}
        {isLimited && (
          <div className="flex items-center justify-between px-5 py-3 bg-amber-50 border-t border-amber-200">
            <div className="flex items-center gap-2">
              <Lock className="w-4 h-4 text-amber-600" />
              <p className="text-[13px] text-amber-800">Monthly limit reached (20 messages)</p>
            </div>
            <Link href="/settings/billing">
              <Button size="sm" variant="accent">
                Upgrade to Pro <ChevronRight className="w-3.5 h-3.5" />
              </Button>
            </Link>
          </div>
        )}

        {/* Usage meter for free tier */}
        {!isPro && remaining !== null && remaining > 0 && (
          <div className="px-5 py-2 border-t border-paper-3 flex items-center justify-between">
            <p className="text-[11px] text-ink-3 font-mono">{remaining} messages remaining this month</p>
            <Link href="/settings/billing" className="text-[11px] text-accent hover:text-accent-2 font-mono transition-colors">
              Upgrade for unlimited →
            </Link>
          </div>
        )}

        {/* Input */}
        <div className="p-4 border-t border-paper-3">
          <div className="flex gap-3 items-end">
            <Textarea
              ref={textareaRef}
              placeholder={isLimited ? 'Upgrade to continue chatting…' : 'Ask a system design question…'}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              disabled={isLimited || isStreaming}
              rows={2}
              className="flex-1 resize-none text-[14px] min-h-[60px]"
            />
            <Button
              onClick={() => sendMessage(input)}
              disabled={!input.trim() || isLimited || isStreaming}
              loading={isStreaming}
              variant="accent"
              size="icon"
              className="h-[60px] w-12 flex-shrink-0"
            >
              {isStreaming ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
            </Button>
          </div>
          <p className="text-[11px] text-ink-3 mt-1.5">Enter to send · Shift+Enter for new line</p>
        </div>
      </div>
    </div>
  )
}

function MentorMessageBubble({
  message,
  isStreaming,
}: {
  message: MentorMessage
  isStreaming: boolean
}) {
  const isUser = message.role === 'user'

  return (
    <div className={cn('flex gap-3', isUser && 'flex-row-reverse')}>
      {/* Avatar */}
      <div className={cn(
        'w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5',
        isUser ? 'bg-paper-3' : 'bg-ink'
      )}>
        {isUser
          ? <User className="w-3.5 h-3.5 text-ink-2" />
          : <Bot className="w-3.5 h-3.5 text-paper" />
        }
      </div>

      {/* Bubble */}
      <div className={cn(
        'max-w-[80%] px-4 py-3 rounded-lg text-[14px] leading-relaxed',
        isUser
          ? 'bg-ink text-paper rounded-tr-sm'
          : 'bg-paper-2 border border-paper-3 text-ink-2 rounded-tl-sm'
      )}>
        {message.content === '' && isStreaming ? (
          <span className="flex items-center gap-1">
            <span className="w-1.5 h-1.5 bg-ink-3 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
            <span className="w-1.5 h-1.5 bg-ink-3 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
            <span className="w-1.5 h-1.5 bg-ink-3 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
          </span>
        ) : (
          <div
            className="prose-lesson prose-sm"
            dangerouslySetInnerHTML={{ __html: simpleMarkdown(message.content) }}
          />
        )}
      </div>
    </div>
  )
}

function simpleMarkdown(text: string) {
  return text
    .replace(/```(\w+)?\n([\s\S]*?)```/g, (_, lang, code) =>
      `<pre style="background:#0e0e0c;color:#f5f3ed;padding:12px;border-radius:4px;font-size:12px;overflow-x:auto;margin:8px 0"><code>${code.trim()}</code></pre>`
    )
    .replace(/`([^`]+)`/g, '<code style="background:#ede9df;padding:2px 5px;border-radius:2px;font-size:12px;color:#c84b2f">$1</code>')
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/\n/g, '<br/>')
}
