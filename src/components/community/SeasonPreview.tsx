import { posterText } from '../../model/labels'
import type { Lang } from '../../model/lang'
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
 * Языков здесь два, и путать их нельзя: подсказки пустых полей — часть листа и
 * берутся по языку **сезона** (`idea.lang`), а адрес ссылки — часть сайта и
 * собирается языком **интерфейса** (`lang`). На самой витрине они совпадают —
 * она показывает свой язык, — но превью об этом знать не обязано.
 */
export function SeasonPreview({ idea, lang }: { idea: Idea; lang: Lang }) {
  const { template } = idea
  const placeholders = posterText(idea.lang).placeholders

  // Пустых полей на бланке не бывает: незаполненное показывает свою подсказку —
  // ровно то же, что человек увидит на постере и на бумаге.
  const shown = (value: string, fallback: string) => value.trim() || fallback

  return (
    <a className={styles.paper} data-palette={idea.palette} href={publicSeasonHref(lang, idea.code)}>
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
