import { longestMonth, monthName } from '../model/calendar'
import { useDict } from '../i18n/context'
import { useDoc, usePoster } from '../state/docContext'
import { Badge } from './Badge'
import { PosterIcon } from './doodles/PosterIcon'
import { EditableText } from './edit/EditableText'
import { SectionBox } from './SectionBox'
import styles from './MonthTheme.module.css'

export function MonthTheme() {
  const { template, fill, field, editing, stepMonth, lang } = useDoc()
  const { labels, placeholders } = usePoster()
  const dict = useDict()

  return (
    <section aria-labelledby="theme-label" className={styles.section}>
      <SectionBox
        accent="theme"
        label={labels.theme}
        labelId="theme-label"
        bodyClassName={styles.body}
      >
        <PosterIcon slot="voice" className={styles.megaphone} size={78} />

        <div className={styles.stars}>
          <PosterIcon slot="spark" className={styles.starBig} size={34} />
          <PosterIcon slot="spark" className={styles.starMid} size={26} />
          <PosterIcon slot="spark" className={styles.starSmall} size={18} />
        </div>

        {/* Месяц подставляется от даты; в правке его переключают стрелками. */}
        <div className={styles.monthRow}>
          {editing && (
            <button
              type="button"
              className={styles.monthNav}
              onClick={() => stepMonth(-1)}
              aria-label={dict.editor.prevMonth}
            >
              ‹
            </button>
          )}
          {/*
            Ширину держит самое длинное название: без распорки строка при
            переключении месяцев меняет длину и стрелки скачут влево-вправо.
          */}
          <p className={styles.month}>
            <span className={styles.monthSizer} aria-hidden="true">
              {longestMonth(lang)}
            </span>
            <span>{monthName(template.theme, lang)}</span>
          </p>
          {editing && (
            <button
              type="button"
              className={styles.monthNav}
              onClick={() => stepMonth(1)}
              aria-label={dict.editor.nextMonth}
            >
              ›
            </button>
          )}
          {editing && <span className={styles.year}>{template.theme.year}</span>}
        </div>

        <EditableText
          as="p"
          className={styles.subtitle}
          placeholder={placeholders.subtitle}
          {...field('theme.subtitle')}
        />

        {/* Итоги месяца: вопрос из шаблона, ответ вписывают руками (слой заполнения). */}
        <div className={styles.answerBox}>
          <Badge accent="theme" size="sm" className={styles.answerBadge}>
            {labels.themeSummary}
          </Badge>
          <EditableText
            as="p"
            className={styles.question}
            placeholder={placeholders.question}
            {...field('theme.question')}
          />
          <p className={styles.answer}>{fill.summaryAnswer}</p>
        </div>
      </SectionBox>
    </section>
  )
}
