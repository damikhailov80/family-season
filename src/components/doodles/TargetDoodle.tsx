interface DoodleProps {
  size?: number
  className?: string
}

export function TargetDoodle({ size = 64, className }: DoodleProps) {
  return (
    <svg
      className={className}
      width={size}
      height={size}
      viewBox="0 0 64 64"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.3"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
    >
      <circle cx="34" cy="30" r="23" />
      <circle cx="34" cy="30" r="15" />
      <circle cx="34" cy="30" r="7" />
      <path d="M5 59 34 30" />
      <path d="M5 59v-9M5 59h9" />
      <path d="M34 30l-9 2M34 30l-2 9" />
    </svg>
  )
}
