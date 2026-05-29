'use client'

import {
  RadarChart, Radar, PolarGrid, PolarAngleAxis, ResponsiveContainer, Tooltip
} from 'recharts'
import type { SkillScore } from '@/types'
import { SKILL_LABELS, ALL_SKILLS } from '@/lib/xp'

interface SkillRadarChartProps {
  skillScores: SkillScore[]
}

export function SkillRadarChart({ skillScores }: SkillRadarChartProps) {
  const scoreMap = Object.fromEntries(skillScores.map((s) => [s.skill, s.score]))

  const data = ALL_SKILLS.map((skill) => ({
    skill: SKILL_LABELS[skill] ?? skill,
    score: scoreMap[skill] ?? 0,
    fullMark: 100,
  }))

  return (
    <div>
      <ResponsiveContainer width="100%" height={260}>
        <RadarChart data={data} margin={{ top: 8, right: 20, bottom: 8, left: 20 }}>
          <PolarGrid stroke="#e3ddd1" />
          <PolarAngleAxis
            dataKey="skill"
            tick={{ fontSize: 12, fontFamily: 'var(--font-sans)', fill: '#72726b' }}
          />
          <Radar
            name="Score"
            dataKey="score"
            stroke="#c84b2f"
            fill="#c84b2f"
            fillOpacity={0.12}
            strokeWidth={2}
          />
          <Tooltip
            formatter={(value: number) => [`${value}%`, 'Score']}
            contentStyle={{
              background: '#0e0e0c',
              border: 'none',
              borderRadius: '3px',
              color: '#f5f3ed',
              fontSize: '13px',
              fontFamily: 'var(--font-mono)',
            }}
          />
        </RadarChart>
      </ResponsiveContainer>

      {/* Legend grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 mt-2">
        {data.map(({ skill, score }) => (
          <div key={skill} className="flex items-center gap-2">
            <div className="w-20 h-1 bg-paper-3 rounded-full overflow-hidden">
              <div
                className="h-full bg-accent rounded-full transition-all duration-700"
                style={{ width: `${score}%` }}
              />
            </div>
            <span className="text-[11px] text-ink-3 font-mono">{score}%</span>
            <span className="text-[11px] text-ink-2 truncate">{skill}</span>
          </div>
        ))}
      </div>
    </div>
  )
}
