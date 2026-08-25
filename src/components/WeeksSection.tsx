import { LABELS, PLACEHOLDERS } from '../model/labels'
import { useDoc } from '../state/docContext'
import { EditableText } from './edit/EditableText'
import { Polaroid } from './Polaroid'
import { SectionBox } from './SectionBox'
import styles from './WeeksSection.module.css'

export function WeeksSection() {
  const { template, field } = useDoc()

  return (
    <section aria-labelledby="weeks-label" className={styles.section}>
      <SectionBox
        accent="weeks"
        label={LABELS.weeks}
        labelId="weeks-label"
        note={
          <EditableText placeholder={PLACEHOLDERS.weeksNote} {...field('weeksNote')} />
        }
        bodyClassName={styles.grid}
      >
        {template.weeks.map((_week, index) => (
          <article key={index} className={styles.card}>
            <EditableText
              as="h3"
              className={styles.cardTitle}
              placeholder={`${PLACEHOLDERS.weekTitle} ${index + 1}`}
              {...field(`weeks.${index}.title`)}
            />
            <EditableText
              as="p"
              className={styles.cardText}
              placeholder={PLACEHOLDERS.weekText}
              {...field(`weeks.${index}.text`)}
            />
            <Polaroid index={index} />
          </article>
        ))}
      </SectionBox>
    </section>
  )
}
