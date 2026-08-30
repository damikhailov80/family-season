import { moodValues } from '../model/fill'
import { moodLegend } from '../model/labels'
import { useDoc, usePoster } from '../state/docContext'
import { AvatarFace } from './AvatarFace'
import { Badge } from './Badge'
import { MoodFace } from './MoodFace'
import styles from './MoodSection.module.css'

export function MoodSection() {
  const { template, fill, days, lang } = useDoc()
  const { labels, placeholders } = usePoster()
  const legend = moodLegend(lang)
  const dayNumbers = Array.from({ length: days }, (_, index) => index + 1)

  return (
    <section aria-labelledby="mood-label" className={styles.section}>
      <div className={styles.head}>
        <Badge accent="theme">
          <span id="mood-label">{labels.mood}</span>
        </Badge>
        <ul className={styles.legend}>
          {legend.map((item) => (
            <li key={item.mood} className={styles.legendItem}>
              <MoodFace mood={item.mood} size={22} />
              <span>{item.label}</span>
            </li>
          ))}
        </ul>
      </div>

      <div className={styles.tableWrap}>
        <table className={styles.table}>
          <caption className={styles.caption}>{labels.moodCaption}</caption>
          <thead>
            <tr>
              <th scope="col" className={styles.whoHead}>
                {labels.moodWho}
              </th>
              {dayNumbers.map((day) => (
                <th key={day} scope="col" className={styles.dayHead}>
                  {day}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {template.people.map((person) => (
              <tr key={person.id}>
                <th
                  scope="row"
                  className={styles.who}
                  style={
                    { '--accent': `var(--person-${person.face})` } as React.CSSProperties
                  }
                >
                  <AvatarFace variant={person.face} size={20} className={styles.whoFace} />
                  <span>{person.name || placeholders.name}</span>
                </th>
                {moodValues(fill.moods[person.id], days).map((mood, index) => (
                  <td key={index} className={styles.cell}>
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
