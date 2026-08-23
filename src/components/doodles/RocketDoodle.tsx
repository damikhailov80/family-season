interface DoodleProps {
  size?: number
  className?: string
}

export function RocketDoodle({ size = 56, className }: DoodleProps) {
  return (
    <svg
      className={className}
      width={size}
      height={size}
      viewBox="0 0 56 56"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.3"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
    >
      <path d="M28 4c8 8 10 19 8 30H20C18 23 20 12 28 4Z" />
      <circle cx="28" cy="19" r="4.5" />
      <path d="M20 25 11 36h9M36 25l9 11h-9" />
      <path d="M24 38l-3 10M28 38v12M32 38l3 10" />
    </svg>
  )
}
