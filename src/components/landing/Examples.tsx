import { ACCENT_BY_FACE } from '../../model/accents'
import { ROUTES } from '../../model/site'
import type { FaceVariant } from '../../types'
import { AvatarFace } from '../AvatarFace'
import { SectionBox } from '../SectionBox'
import styles from './Examples.module.css'

const DEMO_FAMILY: FaceVariant[] = ['dad', 'mom', 'son', 'daughter']

export function Examples() {
  return (
    <SectionBox accent="orange" label="Примеры" note="пока один — будет больше">
      <div className={styles.grid}>
        {/* Обычная <a>, а не next/link: лист ведёт историю сам, см. комментарий в Hero. */}
        <a className={styles.card} href={ROUTES.sheet}>
          <div className={styles.faces}>
            {DEMO_FAMILY.map((face) => (
              <span
                className={styles.face}
                key={face}
                style={{ color: `var(--${ACCENT_BY_FACE[face]})` }}
              >
                <AvatarFace variant={face} size={38} />
              </span>
            ))}
          </div>
          <h3 className={styles.title}>Marvel-лихорадка</h3>
          <p className={styles.text}>
            Сезон на четверых: фильмы по неделям, паста как в кино, робот из LEGO и первый комикс.
          </p>
          <span className={styles.more}>Открыть пример →</span>
        </a>

        <div className={styles.aside}>
          <h3 className={styles.asideTitle}>Возьмите за основу</h3>
          <p className={styles.text}>
            Пример можно форкнуть прямо на постере и переписать под себя — героев, проекты,
            название сезона. Или собрать сезон с нуля, если своё придумывается быстрее.
          </p>
          <p className={styles.hand}>
            Сезон целиком помещается в ссылку: отправили — и у близких открылся тот же постер.
          </p>
          <a className={styles.ghost} href={ROUTES.sheetEdit}>
            Собрать свой сезон
          </a>
        </div>
      </div>
    </SectionBox>
  )
}
