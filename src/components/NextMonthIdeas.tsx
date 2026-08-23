import { LABELS } from '../model/labels'
import { useDoc } from '../state/docContext'
import { SparkStar } from './doodles'
import { SectionBox } from './SectionBox'
import styles from './NextMonthIdeas.module.css'

/**
 * Последняя секция листа — место под записи от руки.
 * На печати пустая и забирает всю свободную высоту второй страницы.
 */
export function NextMonthIdeas() {
  const { fill } = useDoc()

  return (
    <section aria-labelledby="ideas-label" className={styles.wrap}>
      <SparkStar className={styles.star} size={44} />

      <SectionBox
        accent="purple"
        label={LABELS.nextIdeas}
        labelId="ideas-label"
        className={styles.box}
        bodyClassName={styles.body}
      >
        {/* Записи — слой заполнения, на бумаге здесь пустое место. */}
        <p className={styles.ideas}>{fill.nextIdeas}</p>
        <div className={styles.space} aria-hidden="true" />
      </SectionBox>
    </section>
  )
}
