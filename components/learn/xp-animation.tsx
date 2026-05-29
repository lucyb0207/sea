'use client'

import { Zap } from 'lucide-react'

export function XPAnimation({ xp }: { xp: number }) {
  return (
    <div className="fixed top-1/3 left-1/2 -translate-x-1/2 pointer-events-none z-50 animate-xp-float">
      <div className="flex items-center gap-2 bg-ink text-paper px-5 py-3 rounded-full shadow-xl text-[15px] font-semibold">
        <Zap className="w-4 h-4 text-accent-2" />
        +{xp} XP
      </div>
    </div>
  )
}
