import type { FaceVariant } from '../types'

interface AvatarFaceProps {
  variant: FaceVariant
  size?: number
  className?: string
}

/** Причёска рисуется под лицом, поэтому у каждого варианта только свой контур. */
const HAIR: Record<FaceVariant, React.ReactNode> = {
  dad: <path d="M17 35C17 20 23 12 32 12s15 8 15 23c-2-9-7-13-15-13s-13 4-15 13Z" />,
  mom: (
    <>
      <path d="M32 10c12 0 20 9 19 24 0 7-1 14-3 20h-7c3-13 3-24 1-29-5 5-15 7-24 4-2 5-3 17-1 25h-7c-2-6-3-13-3-20-1-15 8-24 20-24Z" />
    </>
  ),
  son: (
    <path d="M18 34c0-14 6-22 14-22s14 8 14 22c-2-8-5-13-9-15 1 4 0 7-2 8-4-4-9-5-13-3-3 2-4 6-4 10Z" />
  ),
  daughter: (
    <>
      <path d="M32 11c11 0 18 8 18 21 0 5-.5 10-2 15h-5c2-9 2-17 0-21-5 4-13 5-21 3-2 4-3 12-1 18h-5c-1.5-5-2-10-2-15 0-13 7-21 18-21Z" />
      <circle cx="10" cy="31" r="5.2" />
      <circle cx="54" cy="31" r="5.2" />
    </>
  ),
}

export function AvatarFace({ variant, size = 56, className }: AvatarFaceProps) {
  return (
    <svg
      className={className}
      width={size}
      height={size}
      viewBox="0 0 64 64"
      aria-hidden="true"
      focusable="false"
    >
      <g fill="currentColor">{HAIR[variant]}</g>
      <g stroke="currentColor" strokeWidth="2.4" fill="#fff">
        <circle cx="14" cy="41" r="3.4" />
        <circle cx="50" cy="41" r="3.4" />
        <circle cx="32" cy="40" r="15" />
      </g>
      <g fill="currentColor">
        <circle cx="26.5" cy="38" r="2.1" />
        <circle cx="37.5" cy="38" r="2.1" />
      </g>
      <path
        d="M26 45.5c2.5 4 9.5 4 12 0"
        fill="none"
        stroke="currentColor"
        strokeWidth="2.4"
        strokeLinecap="round"
      />
    </svg>
  )
}
