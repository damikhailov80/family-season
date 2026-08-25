import type { AccentSlot } from '../types'
import styles from './Badge.module.css'

interface BadgeProps {
  children: React.ReactNode
  accent: AccentSlot
  size?: 'md' | 'sm'
  className?: string
}

/** Тёмная скруглённая плашка с белым caps-текстом — заголовок секции. */
export function Badge({ children, accent, size = 'md', className }: BadgeProps) {
  return (
    <span
      className={[styles.badge, styles[size], className].filter(Boolean).join(' ')}
      style={{ '--badge-color': `var(--accent-${accent})` } as React.CSSProperties}
    >
      {children}
    </span>
  )
}
