interface DoodleProps {
  size?: number
  className?: string
}

export function HeartDoodle({ size = 48, className }: DoodleProps) {
  return (
    <svg
      className={className}
      width={size}
      height={size * 0.96}
      viewBox="0 0 50 48"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.4"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
    >
      <path d="M25 45C10 33 3 24 3 16 3 8 12 4 18 8c3 2 6 5 7 9 1-4 4-7 7-9 6-4 15 0 15 8 0 8-7 17-22 29Z" />
    </svg>
  )
}
