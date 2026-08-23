import { SectionBox } from '../SectionBox'
import { FamilyIcon, FridgeDoodle, PenDoodle, PrinterDoodle } from '../doodles'
import styles from './Steps.module.css'

const STEPS = [
  {
    Doodle: FamilyIcon,
    size: 62,
    title: 'Придумайте сезон',
    text: 'Название месяца, кто в главных ролях и чем займётся каждый. Всё правится прямо на постере.',
  },
  {
    Doodle: PrinterDoodle,
    size: 50,
    title: 'Распечатайте афишу',
    text: 'Ровно две страницы A4 — вёрстка проверена на семье из пяти человек и месяце из 31 дня.',
  },
  {
    Doodle: FridgeDoodle,
    size: 50,
    title: 'Повесьте на холодильник',
    text: 'На магнит, на видное место: постер работает, только когда попадается на глаза.',
  },
  {
    Doodle: PenDoodle,
    size: 50,
    title: 'Проживите месяц',
    text: 'Настроения по дням, проценты проектов, фото недель, финал сезона — ручкой, всей семьёй.',
  },
]

export function Steps() {
  return (
    <SectionBox accent="green" label="Как собрать сезон" note="четыре шага" className={styles.section}>
      <ol className={styles.grid}>
        {STEPS.map(({ Doodle, size, title, text }, index) => (
          <li className={styles.step} key={title}>
            <span className={styles.number}>{index + 1}</span>
            <span className={styles.doodleSlot}>
              <Doodle size={size} />
            </span>
            <h3 className={styles.title}>{title}</h3>
            <p className={styles.text}>{text}</p>
          </li>
        ))}
      </ol>
    </SectionBox>
  )
}
