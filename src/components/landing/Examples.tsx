import { EXAMPLE_LIST } from '../../model/examples'
import { AvatarFace } from '../AvatarFace'
import { SectionBox } from '../SectionBox'
import { NewSeasonAction } from '../site/NewSeasonAction'
import styles from './Examples.module.css'

export function Examples() {
  return (
    <SectionBox
      accent="goal"
      label="Примеры"
      note="три сезона, все разные"
      id="examples"
      className={styles.section}
    >
      <div className={styles.grid}>
        {/*
          Ссылки в постер — обычные <a>, а не next/link: страницы постера клиентские и
          тянут за собой свой кусок бандла, так что мягкий переход выигрывает немного, а
          свежий документ надёжнее — на нём точно не останется состояния лендинга.
        */}
        {EXAMPLE_LIST.map((example) => (
          <a className={styles.card} key={example.id} href={example.href}>
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
            Своим сезоном можно поделиться личной ссылкой: она открывается у кого угодно и без
            входа.
          </p>
        </div>
        <NewSeasonAction className={styles.ghost}>Собрать свой сезон</NewSeasonAction>
      </div>
    </SectionBox>
  )
}
