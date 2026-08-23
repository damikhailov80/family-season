import { monthGoal } from '../data/content'
import { HeartDoodle, TargetDoodle } from './doodles'
import { SectionBox } from './SectionBox'
import styles from './MonthGoal.module.css'

export function MonthGoal() {
  return (
    <section aria-labelledby="goal-label" className={styles.wrap}>
      <TargetDoodle className={styles.target} size={72} />
      <SectionBox
        accent="orange"
        label={monthGoal.badge}
        labelId="goal-label"
        className={styles.box}
        bodyClassName={styles.body}
      >
        <p className={styles.text}>
          {monthGoal.lines.map((line) => (
            <span key={line}>{line}</span>
          ))}
        </p>
        <HeartDoodle className={styles.heart} size={38} />
      </SectionBox>
    </section>
  )
}
