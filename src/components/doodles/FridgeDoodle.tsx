interface DoodleProps {
  size?: number
  className?: string
}

export function FridgeDoodle({ size = 56, className }: DoodleProps) {
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
      {/* Корпус: морозилка сверху, ручки по обе стороны от разделителя */}
      <path d="M15 4h26a3 3 0 0 1 3 3v42a3 3 0 0 1-3 3H15a3 3 0 0 1-3-3V7a3 3 0 0 1 3-3Z" />
      <path d="M12 17h32" />
      <path d="M38 9v5M38 21v7" />
      {/* Пришпиленный магнитом лист — ради него всё и затевается */}
      <path d="M19 27h13v18H19z" transform="rotate(-5 25.5 36)" />
      <circle cx="26" cy="28" r="1.6" fill="currentColor" stroke="none" />
    </svg>
  )
}
