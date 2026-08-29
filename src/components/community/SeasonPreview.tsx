import { PLACEHOLDERS } from '../../model/labels'
import { publicSeasonHref } from '../../model/site'
import { ideaMonth, type Idea } from '../../server/publicSeasons'

import styles from './SeasonPreview.module.css'

/**
 * Мини-постер на витрине: не карточка сайта, а **миниатюра листа**. Отсюда и
 * тема — `data-palette` висит на самом превью, как на кружке в «Моих сезонах»:
 * это изображение постера, и краски у него его собственные. Сайт вокруг при
 * этом своих цветов не меняет — атрибут дальше превью не уходит.
 *
 * Показываем шапку, месяц, тему месяца с её вопросом и четыре недели. Личные
 * проекты, настроения и итоги на превью не идут намеренно: это и есть то, ради
 * чего сезон открывают, — витрина заманивает, а не заменяет постер.
 *
 * Всё рисуется из содержимого строки: второго источника у превью нет.
 */
export function SeasonPreview({ idea }: { idea: Idea }) {
  const { template } = idea

  // Пустых полей на бланке не бывает: незаполненное показывает свою подсказку —
  // ровно то же, что человек увидит на постере и на бумаге.
  const shown = (value: string, fallback: string) => value.trim() || fallback

  return (
    <a className={styles.paper} data-palette={idea.palette} href={publicSeasonHref(idea.code)}>
      <span className={styles.month}>{ideaMonth(template)}</span>
      <span className={styles.headline}>{shown(template.theme.subtitle, PLACEHOLDERS.subtitle)}</span>
      <span className={styles.question}>{shown(template.theme.question, PLACEHOLDERS.question)}</span>

      <span className={styles.weeks}>
        {template.weeks.map((week, index) => (
          <span className={styles.week} key={week.title || index}>
            <b className={styles.weekTitle}>
              {shown(week.title, `${PLACEHOLDERS.weekTitle} ${index + 1}`)}
            </b>
            <span className={styles.weekText}>{shown(week.text, PLACEHOLDERS.weekText)}</span>
          </span>
        ))}
      </span>

      <span className={styles.goal}>{shown(template.goal, PLACEHOLDERS.goal)}</span>
    </a>
  )
}
