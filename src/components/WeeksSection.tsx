import { weeks, weeksSection } from '../data/content'
import { Polaroid } from './Polaroid'
import { SectionBox } from './SectionBox'
import styles from './WeeksSection.module.css'

export function WeeksSection() {
  return (
    <section aria-labelledby="weeks-label">
      <SectionBox
        accent="green"
        label={weeksSection.badge}
        labelId="weeks-label"
        note={weeksSection.note}
        bodyClassName={styles.grid}
      >
        {weeks.map((week, index) => (
          <article key={week.title} className={styles.card}>
            <h3 className={styles.cardTitle}>{week.title}</h3>
            <p className={styles.cardText}>
              {week.lines.map((line) => (
                <span key={line}>{line}</span>
              ))}
            </p>
            <Polaroid week={week} index={index} />
          </article>
        ))}
      </SectionBox>
    </section>
  )
}
