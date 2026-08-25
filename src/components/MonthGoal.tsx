import { LABELS, PLACEHOLDERS } from '../model/labels'
import { useDoc } from '../state/docContext'
import { PosterIcon } from './doodles/PosterIcon'
import { EditableText } from './edit/EditableText'
import { SectionBox } from './SectionBox'
import styles from './MonthGoal.module.css'

export function MonthGoal() {
  const { field } = useDoc()

  return (
    <section aria-labelledby="goal-label" className={styles.wrap}>
      <PosterIcon slot="goal" className={styles.target} size={72} />
      <SectionBox
        accent="goal"
        label={LABELS.goal}
        labelId="goal-label"
        className={styles.box}
        bodyClassName={styles.body}
      >
        <EditableText
          as="p"
          className={styles.text}
          placeholder={PLACEHOLDERS.goal}
          {...field('goal')}
        />
        <PosterIcon slot="care" className={styles.heart} size={38} />
      </SectionBox>
    </section>
  )
}
