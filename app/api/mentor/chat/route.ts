import { createServerSupabaseClient } from '@/lib/supabase'
import { NextRequest, NextResponse } from 'next/server'
import OpenAI from 'openai'
import type { MentorMessage } from '@/types'

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })

const FREE_MONTHLY_LIMIT = 20

const SYSTEM_PROMPT = `You are a senior software engineer and system design mentor at Scalable Engineer Academy.

Your job: help developers understand system design concepts clearly and practically.

You always:
- Use concrete examples from real companies (Netflix, Discord, Uber, etc.)
- Explain tradeoffs, not just answers — WHY one choice beats another in context
- Keep responses focused and not too long. Learners disengage with walls of text.
- Use code snippets only when they genuinely help (config, pseudocode, not boilerplate)
- Reference the user's current lesson or design if provided in context

Format:
- Use **bold** for key terms
- Use \`inline code\` for technical terms and component names
- Use bullet points for lists of options or steps
- Use code blocks only for actual code or config`

export async function POST(request: NextRequest) {
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { messages, conversationId, contextLessonId, contextDesignId } = await request.json()

  // Check plan
  const { data: profile } = await supabase
    .from('users')
    .select('plan')
    .eq('id', user.id)
    .single()

  const isPro = profile?.plan === 'pro' || profile?.plan === 'team'

  // Free tier: count messages this month
  if (!isPro) {
    const monthStart = new Date()
    monthStart.setDate(1)
    monthStart.setHours(0, 0, 0, 0)

    const { count } = await supabase
      .from('mentor_conversations')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', user.id)
      .gte('created_at', monthStart.toISOString())

    if ((count ?? 0) >= FREE_MONTHLY_LIMIT) {
      return NextResponse.json({ error: 'Monthly message limit reached' }, { status: 429 })
    }
  }

  // Build context string
  let contextStr = ''
  if (contextLessonId) {
    const { data: lesson } = await supabase
      .from('lessons')
      .select('title, content_mdx')
      .eq('id', contextLessonId)
      .single()
    if (lesson) {
      contextStr += `\n\nUser's current lesson: "${lesson.title}". Content summary: ${lesson.content_mdx?.slice(0, 400)}...`
    }
  }

  // Stream response
  const encoder = new TextEncoder()

  const stream = new ReadableStream({
    async start(controller) {
      try {
        const completion = await openai.chat.completions.create({
          model: isPro ? 'gpt-4o' : 'gpt-4o-mini',
          stream: true,
          messages: [
            { role: 'system', content: SYSTEM_PROMPT + contextStr },
            ...(messages as MentorMessage[]).map((m) => ({
              role: m.role as 'user' | 'assistant',
              content: m.content,
            })),
          ],
          max_tokens: 800,
          temperature: 0.7,
        })

        let fullContent = ''
        for await (const chunk of completion) {
          const text = chunk.choices[0]?.delta?.content ?? ''
          if (text) {
            fullContent += text
            controller.enqueue(encoder.encode(`data: ${JSON.stringify({ text })}\n\n`))
          }
        }

        // Save conversation
        let savedConvId = conversationId
        const allMessages: MentorMessage[] = [
          ...(messages as MentorMessage[]),
          { role: 'assistant', content: fullContent },
        ]

        if (conversationId) {
          await supabase
            .from('mentor_conversations')
            .update({
              messages: allMessages,
              message_count: allMessages.length,
              updated_at: new Date().toISOString(),
            })
            .eq('id', conversationId)
            .eq('user_id', user.id)
        } else {
          const { data: newConv } = await supabase
            .from('mentor_conversations')
            .insert({
              user_id: user.id,
              messages: allMessages,
              context_lesson_id: contextLessonId ?? null,
              context_design_id: contextDesignId ?? null,
              message_count: allMessages.length,
            })
            .select('id')
            .single()
          savedConvId = newConv?.id ?? null
        }

        controller.enqueue(
          encoder.encode(`data: ${JSON.stringify({ conversationId: savedConvId })}\n\n`)
        )
        controller.enqueue(encoder.encode('data: [DONE]\n\n'))
        controller.close()
      } catch (err) {
        controller.enqueue(
          encoder.encode(`data: ${JSON.stringify({ error: 'Stream failed' })}\n\n`)
        )
        controller.close()
      }
    },
  })

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      Connection: 'keep-alive',
    },
  })
}
