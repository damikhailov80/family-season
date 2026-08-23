import { LABELS, PLACEHOLDERS } from '../model/labels'
import { useDoc } from '../state/docContext'
import { HeartDoodle, TargetDoodle } from './doodles'
import { EditableText } from './edit/EditableText'
import { SectionBox } from './SectionBox'
import styles from './MonthGoal.module.css'

export function MonthGoal() {
  const { field } = useDoc()

  return (
    <section aria-labelledby="goal-label" className={styles.wrap}>
      <TargetDoodle className={styles.target} size={72} />
      <SectionBox
        accent="orange"
        label={LABELS.goal}
        labelId="goal-label"
        className={styles.box}
        bodyClassName={styles.body}
      >
        <EditableText
          as="p"
          multiline
          className={styles.text}
          placeholder={PLACEHOLDERS.goal}
          {...field('goal')}
        />
        <HeartDoodle className={styles.heart} size={38} />
      </SectionBox>
    </section>
  )
}
