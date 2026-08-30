import { getDict } from '../../i18n/server'
import { SectionBox } from '../SectionBox'
import { FamilyIcon, FridgeDoodle, PenDoodle, PrinterDoodle } from '../doodles'
import styles from './Steps.module.css'

/**
 * Рисунки живут здесь, а слова — в словаре: перевод не имеет права переставить
 * доодлы, а порядок шагов один и тот же на всех языках.
 */
const DOODLES = [
  { Doodle: FamilyIcon, size: 54 },
  { Doodle: PrinterDoodle, size: 50 },
  { Doodle: FridgeDoodle, size: 50 },
  { Doodle: PenDoodle, size: 50 },
]

export async function Steps() {
  const { landing } = await getDict()

  return (
    <SectionBox
      accent="weeks"
      label={landing.stepsLabel}
      note={landing.stepsNote}
      className={styles.section}
    >
      <ol className={styles.grid}>
        {landing.steps.map(({ title, text }, index) => {
          const { Doodle, size } = DOODLES[index]
          return (
            <li className={styles.step} key={title}>
              <span className={styles.number}>{index + 1}</span>
              <span className={styles.doodleSlot}>
                <Doodle size={size} />
              </span>
              <h3 className={styles.title}>{title}</h3>
              <p className={styles.text}>{text}</p>
            </li>
          )
        })}
      </ol>
    </SectionBox>
  )
}
