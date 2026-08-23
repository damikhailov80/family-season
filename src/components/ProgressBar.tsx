import styles from './ProgressBar.module.css'

interface ProgressBarProps {
  percent: number
  label: string
}

const SEGMENTS = 10

export function ProgressBar({ percent, label }: ProgressBarProps) {
  const clamped = Math.min(100, Math.max(0, percent))

  return (
    <div className={styles.track} role="img" aria-label={`${label}: прогресс ${clamped}%`}>
      <div className={styles.fill} style={{ width: `${clamped}%` }} />
      {/*
       * Деления — настоящие ячейки, а не градиент в процентах: на печати
       * дробные позиции градиента округляются и линии расползаются.
       */}
      <div className={styles.ticks} aria-hidden="true">
        {Array.from({ length: SEGMENTS }, (_, index) => (
          <span key={index} className={styles.tick} />
        ))}
      </div>
    </div>
  )
}
