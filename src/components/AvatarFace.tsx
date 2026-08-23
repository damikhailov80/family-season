import type { FaceVariant } from '../types'

interface AvatarFaceProps {
  variant: FaceVariant
  size?: number
  className?: string
}

/**
 * Взрослые и дети должны различаться силуэтом, а не только причёской: в таблице
 * настроений аватар рисуется в 20 px, там читается лишь общая форма.
 * Папа — борода, мама — каре и серьги, дети — головы мельче, вихор и хвостики.
 */
interface FaceGeometry {
  /** Центр и радиус головы. */
  cy: number
  r: number
}

const FACE: Record<FaceVariant, FaceGeometry> = {
  dad: { cy: 38, r: 15.5 },
  mom: { cy: 39, r: 15 },
  son: { cy: 42, r: 13 },
  daughter: { cy: 42, r: 13 },
}

/** Волосы за головой — рисуются до лица. */
const HAIR_BACK: Record<FaceVariant, React.ReactNode> = {
  dad: null,
  mom: (
    <path d="M32 11c11.5 0 19 8 19 21 0 8-1.5 15-3.5 20h-6.5c2.5-7 3.5-13 3.5-19 0-7-4.5-10.5-12.5-10.5S19.5 26 19.5 33c0 6 1 12 3.5 19H16.5C14.5 47 13 40 13 32c0-13 7.5-21 19-21Z" />
  ),
  son: null,
  daughter: (
    <>
      <circle cx="12" cy="36" r="5.4" />
      <circle cx="52" cy="36" r="5.4" />
      <path d="M32 15c10 0 16.5 7 16.5 18 0 4-.5 8-1.5 11.5h-4.5c1.5-6 1.5-11 0-14.5-4.5 3.5-16 3.5-21 0-1.5 3.5-1.5 8.5 0 14.5H17c-1-3.5-1.5-7.5-1.5-11.5 0-11 6.5-18 16.5-18Z" />
    </>
  ),
}

/** Причёска поверх лба. */
const HAIR_FRONT: Record<FaceVariant, React.ReactNode> = {
  dad: <path d="M18 33c0-11.5 6-18 14-18s14 6.5 14 18c-2.5-7.5-7-11-14-11s-11.5 3.5-14 11Z" />,
  mom: <path d="M20 29.5c3-5.5 7-8.5 12-8.5s9 3 12 8.5c-3.5-3.5-7.5-5-12-5s-8.5 1.5-12 5Z" />,
  son: (
    <path d="M20 36c0-10 5-16 12-16s12 6 12 16c-1.5-6-4-9.5-7.5-11 1 3 0 5.5-1.5 6.5-3.5-3-7.5-3.5-11-2-2.5 1.5-3.5 4-4 6.5Z" />
  ),
  daughter: null,
}

/** Что делает взрослого взрослым: борода с усами, серьги. */
const DETAILS: Record<FaceVariant, React.ReactNode> = {
  dad: (
    <>
      {/* борода охватывает подбородок */}
      <path
        d="M19 36.5c0 12.5 5.5 21.5 13 21.5s13-9 13-21.5c-.8 8.5-2.5 13.5-4.8 16.2-1.9-2.4-4.8-3.7-8.2-3.7s-6.3 1.3-8.2 3.7C21.5 50 19.8 45 19 36.5Z"
        fill="currentColor"
      />
      {/* усы */}
      <path
        d="M26 39.8c1.8 1.6 4 1.6 6 0 2 1.6 4.2 1.6 6 0"
        fill="none"
        stroke="currentColor"
        strokeWidth="2.6"
        strokeLinecap="round"
      />
      {/* брови */}
      <g fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round">
        <path d="M23.5 32.5c1.8-1.4 4.2-1.4 6 0" />
        <path d="M34.5 32.5c1.8-1.4 4.2-1.4 6 0" />
      </g>
    </>
  ),
  mom: (
    <g fill="#fff" stroke="currentColor" strokeWidth="1.6">
      <circle cx="14.2" cy="47.5" r="2.6" />
      <circle cx="49.8" cy="47.5" r="2.6" />
    </g>
  ),
  son: null,
  daughter: (
    <g fill="#fff" stroke="currentColor" strokeWidth="1.6">
      {/* резинки на хвостиках */}
      <circle cx="12" cy="36" r="2.4" />
      <circle cx="52" cy="36" r="2.4" />
    </g>
  ),
}

/** У папы рот короче — он внутри бороды. */
const MOUTH: Record<FaceVariant, string> = {
  dad: 'M28.5 42.6c1.6 2.2 5.4 2.2 7 0',
  mom: 'M26.5 45c2.4 3.6 8.6 3.6 11 0',
  son: 'M27 47c2 3 8 3 10 0',
  daughter: 'M27 47c2 3 8 3 10 0',
}

export function AvatarFace({ variant, size = 56, className }: AvatarFaceProps) {
  const { cy, r } = FACE[variant]
  const earOffset = r + 3.2
  const eyeY = cy - 2

  return (
    <svg
      className={className}
      width={size}
      height={size}
      viewBox="0 0 64 64"
      aria-hidden="true"
      focusable="false"
    >
      <g fill="currentColor">{HAIR_BACK[variant]}</g>

      <g stroke="currentColor" strokeWidth="2.4" fill="#fff">
        <circle cx={32 - earOffset} cy={cy + 1} r="3.2" />
        <circle cx={32 + earOffset} cy={cy + 1} r="3.2" />
        <circle cx="32" cy={cy} r={r} />
      </g>

      <g fill="currentColor">{HAIR_FRONT[variant]}</g>

      <g fill="currentColor">
        <circle cx="26.5" cy={eyeY} r="2.1" />
        <circle cx="37.5" cy={eyeY} r="2.1" />
      </g>

      {DETAILS[variant]}

      <path
        d={MOUTH[variant]}
        fill="none"
        stroke="currentColor"
        strokeWidth="2.4"
        strokeLinecap="round"
      />
    </svg>
  )
}
