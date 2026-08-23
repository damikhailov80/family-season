import { monthSummary } from '../data/content'
import { SparkStar } from './doodles'
import { SectionBox } from './SectionBox'
import styles from './MonthSummary.module.css'

export function MonthSummary() {
  return (
    <section aria-labelledby="summary-label" className={styles.wrap}>
      <SparkStar className={styles.star} size={44} />

      <SectionBox
        accent="purple"
        label={monthSummary.badge}
        labelId="summary-label"
        className={styles.box}
        bodyClassName={styles.body}
      >
        <p className={styles.question}>{monthSummary.question}</p>
        <p className={styles.answer}>{monthSummary.answer}</p>
      </SectionBox>
    </section>
  )
}
