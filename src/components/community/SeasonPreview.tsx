import { posterText } from '../../model/labels'
import { publicSeasonHref } from '../../model/site'
import type { Idea } from '../../server/publicSeasons'

import styles from './SeasonPreview.module.css'

/**
 * Мини-постер на витрине: не карточка сайта, а **миниатюра листа**. Отсюда и
 * тема — `data-palette` висит на самом превью, как на кружке в «Моих сезонах»:
 * это изображение постера, и краски у него его собственные. Сайт вокруг при
 * этом своих цветов не меняет — атрибут дальше превью не уходит.
 *
 * Показываем тему месяца с её вопросом, четыре недели и цель. Месяца с годом
 * здесь нет намеренно: идею берут ради того, чем занять месяц, — чей это был
 * месяц и когда, к делу не относится. Личные проекты, настроения и итоги на
 * превью тоже не идут: это и есть то, ради чего сезон открывают, — витрина
 * заманивает, а не заменяет постер.
 *
 * Всё рисуется из содержимого строки: второго источника у превью нет.
 *
 * Язык здесь один — язык **сезона**: им берутся подсказки пустых полей (они
 * часть листа) и им же собирается адрес (публикация живёт только в своём языке,
 * и `/en/s/<русский код>` отвечает «сезона нет»). Языка интерфейса превью не
 * знает вовсе: оно ничего не говорит от себя.
 */
export function SeasonPreview({ idea }: { idea: Idea }) {
  const { template } = idea
  const placeholders = posterText(idea.lang).placeholders

  // Пустых полей на бланке не бывает: незаполненное показывает свою подсказку —
  // ровно то же, что человек увидит на постере и на бумаге.
  const shown = (value: string, fallback: string) => value.trim() || fallback

  return (
    <a className={styles.paper} data-palette={idea.palette} href={publicSeasonHref(idea.lang, idea.code)}>
      <span className={styles.headline}>{shown(template.theme.subtitle, placeholders.subtitle)}</span>
      <span className={styles.question}>{shown(template.theme.question, placeholders.question)}</span>

      <span className={styles.weeks}>
        {template.weeks.map((week, index) => (
          <span className={styles.week} key={week.title || index}>
            <b className={styles.weekTitle}>
              {shown(week.title, `${placeholders.weekTitle} ${index + 1}`)}
            </b>
            <span className={styles.weekText}>{shown(week.text, placeholders.weekText)}</span>
          </span>
        ))}
      </span>

      <span className={styles.goal}>{shown(template.goal, placeholders.goal)}</span>
    </a>
  )
}
