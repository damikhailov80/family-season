import type { MoodValue } from '../types'

interface MoodFaceProps {
  mood: Exclude<MoodValue, null>
  size?: number
  className?: string
}

const COLORS = {
  good: 'var(--mood-good)',
  ok: 'var(--mood-ok)',
  bad: 'var(--mood-bad)',
} as const

const MOUTHS = {
  good: 'M7.5 14c2 3 7 3 9 0',
  ok: 'M8 15h8',
  bad: 'M7.5 16.5c2-3 7-3 9 0',
} as const

export function MoodFace({ mood, size = 20, className }: MoodFaceProps) {
  return (
    <svg
      className={className}
      width={size}
      height={size}
      viewBox="0 0 24 24"
      aria-hidden="true"
      focusable="false"
    >
      <circle
        cx="12"
        cy="12"
        r="10.6"
        fill={COLORS[mood]}
        stroke="rgb(0 0 0 / 35%)"
        strokeWidth="1.2"
      />
      <g fill="rgb(0 0 0 / 78%)">
        <circle cx="8.6" cy="9.8" r="1.35" />
        <circle cx="15.4" cy="9.8" r="1.35" />
      </g>
      <path
        d={MOUTHS[mood]}
        fill="none"
        stroke="rgb(0 0 0 / 78%)"
        strokeWidth="1.7"
        strokeLinecap="round"
      />
    </svg>
  )
}
