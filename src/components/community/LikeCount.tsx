import { HeartDoodle } from '../doodles'
import styles from './LikeCount.module.css'

const HEART_STROKE = 4

export function LikeCount({
  likes,
  size = 18,
  filled = true,
  hideZero = false,
  label,
  className,
}: {
  likes: number
  size?: number
  filled?: boolean
  hideZero?: boolean
  label: string
  className?: string
}) {
  return (
    <span
      className={className ? `${styles.likes} ${className}` : styles.likes}
      role="img"
      aria-label={label}
    >
      <HeartDoodle size={size} filled={filled} strokeWidth={HEART_STROKE} />
      {(likes > 0 || !hideZero) && likes}
    </span>
  )
}
