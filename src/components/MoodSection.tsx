import { DAYS_IN_MONTH, moodRows, moodSection } from '../data/content'
import { AvatarFace } from './AvatarFace'
import { Badge } from './Badge'
import { MoodFace } from './MoodFace'
import styles from './MoodSection.module.css'

const days = Array.from({ length: DAYS_IN_MONTH }, (_, index) => index + 1)

export function MoodSection() {
  return (
    <section aria-labelledby="mood-label" className={styles.section}>
      <div className={styles.head}>
        <Badge accent="purple">
          <span id="mood-label">{moodSection.badge}</span>
        </Badge>
        <ul className={styles.legend}>
          {moodSection.legend.map((item) => (
            <li key={item.mood} className={styles.legendItem}>
              <MoodFace mood={item.mood} size={22} />
              <span>{item.label}</span>
            </li>
          ))}
        </ul>
      </div>

      <div className={styles.tableWrap}>
        <table className={styles.table}>
          <caption className={styles.caption}>Настроение каждого члена семьи по дням месяца</caption>
          <thead>
            <tr>
              <th scope="col" className={styles.whoHead}>
                Кто
              </th>
              {days.map((day) => (
                <th key={day} scope="col" className={styles.dayHead}>
                  {day}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {moodRows.map((row) => (
              <tr key={row.role}>
                <th
                  scope="row"
                  className={styles.who}
                  style={{ '--accent': `var(--${row.accent})` } as React.CSSProperties}
                >
                  <AvatarFace variant={row.face} size={20} className={styles.whoFace} />
                  <span>{row.role}</span>
                </th>
                {row.values.map((mood, index) => (
                  <td key={days[index]} className={styles.cell}>
                    {mood && <MoodFace mood={mood} size={19} className={styles.cellFace} />}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  )
}
