import { monthTheme } from '../data/content'
import { MegaphoneDoodle, SparkStar } from './doodles'
import { SectionBox } from './SectionBox'
import styles from './MonthTheme.module.css'

export function MonthTheme() {
  return (
    <section aria-labelledby="theme-label">
      <SectionBox
        accent="purple"
        label={monthTheme.badge}
        labelId="theme-label"
        bodyClassName={styles.body}
      >
        <MegaphoneDoodle className={styles.megaphone} size={78} />

        <div className={styles.stars}>
          <SparkStar className={styles.starBig} size={34} />
          <SparkStar className={styles.starMid} size={26} />
          <SparkStar className={styles.starSmall} size={18} />
        </div>

        <p className={styles.month}>{monthTheme.month}</p>
        <p className={styles.subtitle}>{monthTheme.subtitle}</p>

        <div className={styles.answerBox}>
          <p className={styles.question}>{monthTheme.question}</p>
          <p className={styles.answer}>{monthTheme.answer}</p>
        </div>
      </SectionBox>
    </section>
  )
}
