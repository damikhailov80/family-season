import type { AccentSlot } from '../types'
import styles from './Badge.module.css'

interface BadgeProps {
  children: React.ReactNode
  accent: AccentSlot
  size?: 'md' | 'sm'
  className?: string
}

/**
 * Скруглённая плашка с caps-текстом — заголовок секции. Заливка — краска темы как
 * есть, поэтому плашка бывает и тёмной, и светлой; цвет текста на ней подобран при
 * сборке тем (`--on-<слот>`), а тонкая рамка тёмного оттенка держит светлую плашку
 * на белой бумаге.
 */
export function Badge({ children, accent, size = 'md', className }: BadgeProps) {
  return (
    <span
      className={[styles.badge, styles[size], className].filter(Boolean).join(' ')}
      style={
        {
          '--badge-color': `var(--badge-${accent})`,
          '--badge-ink': `var(--on-${accent})`,
          '--badge-line': `var(--accent-${accent})`,
        } as React.CSSProperties
      }
    >
      {children}
    </span>
  )
}
