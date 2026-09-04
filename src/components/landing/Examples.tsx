import { examplesFor } from '../../model/examples'
import { getDict, getLang } from '../../i18n/server'
import { AvatarFace } from '../AvatarFace'
import { SectionBox } from '../SectionBox'
import { NewSeasonAction } from '../site/NewSeasonAction'
import styles from './Examples.module.css'

/** Карточки свои у каждого языка: это три разные строки витрины. */
export async function Examples() {
  const lang = await getLang()
  const { landing } = await getDict()

  return (
    <SectionBox
      accent="goal"
      label={landing.examplesLabel}
      note={landing.examplesNote}
      id="examples"
      className={styles.section}
    >
      <div className={styles.grid}>
        {/* Ссылки в постер — обычные <a>, а не next/link: страницы постера
            клиентские, мягкий переход выигрывает мало, а свежий документ надёжнее. */}
        {examplesFor(lang).map((example) => (
          <a className={styles.card} key={example.key} href={example.href}>
            <div className={styles.faces}>
              {example.faces.map((face, index) => (
                <span
                  className={styles.face}
                  key={`${face}-${index}`}
                  style={{ color: `var(--person-${face})` }}
                >
                  <AvatarFace variant={face} size={26} />
                </span>
              ))}
            </div>
            <h3 className={styles.title}>{example.name}</h3>
            <p className={styles.note}>{example.note}</p>
            <p className={styles.text}>{example.summary}</p>
            <span className={styles.more}>{landing.exampleOpen}</span>
          </a>
        ))}
      </div>

      <div className={styles.aside}>
        <div>
          <h3 className={styles.asideTitle}>{landing.examplesAsideTitle}</h3>
          <p className={styles.text}>{landing.examplesAsideText}</p>
          <p className={styles.hand}>{landing.examplesAsideHand}</p>
        </div>
        <NewSeasonAction className={styles.ghost}>{landing.examplesAction}</NewSeasonAction>
      </div>
    </SectionBox>
  )
}
