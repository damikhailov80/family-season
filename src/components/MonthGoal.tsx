import type { QrMatrix } from '../model/qr'
import { useDoc, usePoster } from '../state/docContext'
import { PosterIcon } from './doodles/PosterIcon'
import { EditableText } from './edit/EditableText'
import { QrCode } from './QrCode'
import { SectionBox } from './SectionBox'
import styles from './MonthGoal.module.css'

/**
 * Какой из двух кодов печатать, лист не решает: матрица приходит пропом от
 * страницы — ссылку выдаёт и отзывает не постер (см. `model/qr.ts`).
 */
export function MonthGoal({ qr }: { qr?: QrMatrix }) {
  const { field } = useDoc()
  const { labels, placeholders } = usePoster()

  return (
    <section aria-labelledby="goal-label" className={styles.wrap}>
      <PosterIcon slot="goal" className={styles.target} size={72} />
      <SectionBox
        accent="goal"
        label={labels.goal}
        labelId="goal-label"
        className={styles.box}
        bodyClassName={styles.body}
      >
        <EditableText
          as="p"
          className={styles.text}
          placeholder={placeholders.goal}
          {...field('goal')}
        />
        <PosterIcon slot="care" className={styles.heart} size={38} />
      </SectionBox>
      <QrCode code={qr} className={styles.qr} />
    </section>
  )
}
