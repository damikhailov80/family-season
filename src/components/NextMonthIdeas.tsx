import { useDoc, usePoster } from '../state/docContext'
import { PosterIcon } from './doodles/PosterIcon'
import { SectionBox } from './SectionBox'
import styles from './NextMonthIdeas.module.css'

/** На печати пустая: забирает всю свободную высоту второй страницы. */
export function NextMonthIdeas() {
  const { fill } = useDoc()
  const { labels } = usePoster()

  return (
    <section aria-labelledby="ideas-label" className={styles.wrap}>
      <PosterIcon slot="idea" className={styles.star} size={44} />

      <SectionBox
        accent="theme"
        label={labels.nextIdeas}
        labelId="ideas-label"
        className={styles.box}
        bodyClassName={styles.body}
      >
        <p className={styles.ideas}>{fill.nextIdeas}</p>
        <div className={styles.space} aria-hidden="true" />
      </SectionBox>
    </section>
  )
}
