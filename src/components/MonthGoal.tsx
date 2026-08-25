import { LABELS, PLACEHOLDERS } from '../model/labels'
import { useDoc } from '../state/docContext'
import { PosterIcon } from './doodles/PosterIcon'
import { EditableText } from './edit/EditableText'
import { QrCode } from './QrCode'
import { SectionBox } from './SectionBox'
import styles from './MonthGoal.module.css'

/**
 * Цель месяца, а справа от рамки — QR на сайт. Код ведёт не на этот лист, а на
 * адрес сайта: постер висит на холодильнике, и по коду приходят собирать свой
 * сезон, а не смотреть чужой. Заодно данных в коде мало, и он остаётся мелким
 * и спокойным — длинная ссылка на лист рябила бы полотном модулей.
 */
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
      <QrCode className={styles.qr} />
    </section>
  )
}
