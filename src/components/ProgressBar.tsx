import styles from './ProgressBar.module.css'

interface ProgressBarProps {
  percent: number
  label: string
}

export function ProgressBar({ percent, label }: ProgressBarProps) {
  const clamped = Math.min(100, Math.max(0, percent))

  return (
    <div className={styles.track} role="img" aria-label={`${label}: прогресс ${clamped}%`}>
      <div className={styles.fill} style={{ width: `${clamped}%` }} />
    </div>
  )
}
