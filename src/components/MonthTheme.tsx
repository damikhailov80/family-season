import { LONGEST_MONTH_RU, monthName } from '../model/calendar'
import { LABELS, PLACEHOLDERS } from '../model/labels'
import { useDoc } from '../state/docContext'
import { Badge } from './Badge'
import { PosterIcon } from './doodles/PosterIcon'
import { EditableText } from './edit/EditableText'
import { SectionBox } from './SectionBox'
import styles from './MonthTheme.module.css'

export function MonthTheme() {
  const { template, fill, field, editing, stepMonth } = useDoc()

  return (
    <section aria-labelledby="theme-label" className={styles.section}>
      <SectionBox
        accent="theme"
        label={LABELS.theme}
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
              aria-label="Предыдущий месяц"
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
              {LONGEST_MONTH_RU}
            </span>
            <span>{monthName(template.theme)}</span>
          </p>
          {editing && (
            <button
              type="button"
              className={styles.monthNav}
              onClick={() => stepMonth(1)}
              aria-label="Следующий месяц"
            >
              ›
            </button>
          )}
          {editing && <span className={styles.year}>{template.theme.year}</span>}
        </div>

        <EditableText
          as="p"
          className={styles.subtitle}
          placeholder={PLACEHOLDERS.subtitle}
          {...field('theme.subtitle')}
        />

        {/* Итоги месяца: вопрос из шаблона, ответ вписывают руками (слой заполнения). */}
        <div className={styles.answerBox}>
          <Badge accent="theme" size="sm" className={styles.answerBadge}>
            {LABELS.themeSummary}
          </Badge>
          <EditableText
            as="p"
            className={styles.question}
            placeholder={PLACEHOLDERS.question}
            {...field('theme.question')}
          />
          <p className={styles.answer}>{fill.summaryAnswer}</p>
        </div>
      </SectionBox>
    </section>
  )
}
