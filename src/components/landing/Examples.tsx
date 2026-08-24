import { ACCENT_BY_FACE } from '../../model/accents'
import { EXAMPLE_LIST } from '../../model/examples'
import { exampleHref, ROUTES } from '../../model/site'
import { AvatarFace } from '../AvatarFace'
import { SectionBox } from '../SectionBox'
import styles from './Examples.module.css'

export function Examples() {
  return (
    <SectionBox accent="orange" label="Примеры" note="три сезона, все разные">
      <div className={styles.grid}>
        {/* Обычная <a>, а не next/link: лист ведёт историю сам, см. комментарий в Hero. */}
        {EXAMPLE_LIST.map((example) => (
          <a className={styles.card} key={example.id} href={exampleHref(example.id)}>
            <div className={styles.faces}>
              {example.faces.map((face, index) => (
                <span
                  className={styles.face}
                  key={`${face}-${index}`}
                  style={{ color: `var(--${ACCENT_BY_FACE[face]})` }}
                >
                  <AvatarFace variant={face} size={26} />
                </span>
              ))}
            </div>
            <h3 className={styles.title}>{example.name}</h3>
            <p className={styles.note}>{example.note}</p>
            <p className={styles.text}>{example.summary}</p>
            <span className={styles.more}>Открыть пример →</span>
          </a>
        ))}
      </div>

      <div className={styles.aside}>
        <div>
          <h3 className={styles.asideTitle}>Возьмите за основу</h3>
          <p className={styles.text}>
            Любой пример можно форкнуть прямо на постере и переписать под себя — героев,
            проекты, название сезона. Или собрать сезон с нуля, если своё придумывается
            быстрее.
          </p>
          <p className={styles.hand}>
            Сезон целиком помещается в ссылку: отправили — и у близких открылся тот же постер.
          </p>
        </div>
        <a className={styles.ghost} href={ROUTES.sheetEdit}>
          Собрать свой сезон
        </a>
      </div>
    </SectionBox>
  )
}
