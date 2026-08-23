interface DoodleProps {
  size?: number
  className?: string
}

export function FamilyIcon({ size = 68, className }: DoodleProps) {
  return (
    <svg
      className={className}
      width={size}
      height={size * 0.75}
      viewBox="0 0 68 51"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.6"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
    >
      {/* папа */}
      <circle cx="13" cy="10" r="5.5" />
      <path d="M13 16v16M13 21 5.5 27M13 21l7.5 6M13 32 8 47M13 32l5 15" />
      {/* ребёнок */}
      <circle cx="34" cy="21" r="4.5" />
      <path d="M34 26v11M34 29l-6 5M34 29l6 5M34 37l-4 10M34 37l4 10" />
      {/* мама */}
      <circle cx="55" cy="10" r="5.5" />
      <path d="M55 16 47.5 38h15L55 16ZM50 22l-5.5 6M60 22l5.5 6M51 38l-1 9M59 38l1 9" />
    </svg>
  )
}
