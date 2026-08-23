interface DoodleProps {
  size?: number
  className?: string
}

export function MegaphoneDoodle({ size = 74, className }: DoodleProps) {
  return (
    <svg
      className={className}
      width={size}
      height={size * 0.78}
      viewBox="0 0 74 58"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.4"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
    >
      <path d="M5 22 33 9v40L5 36Z" />
      <path d="M5 24 1 26v6l4 2" />
      <path d="M13 34 9 50l8 3 5-15" />
      <path d="M42 18c6 5 6 17 0 22M52 12c9 8 9 26 0 34" />
    </svg>
  )
}
