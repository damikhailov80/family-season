import { monthName } from '../model/calendar'
import { LABELS, PLACEHOLDERS } from '../model/labels'
import { useDoc } from '../state/docContext'
import { Badge } from './Badge'
import { MegaphoneDoodle, SparkStar } from './doodles'
import { EditableText } from './edit/EditableText'
import { SectionBox } from './SectionBox'
import styles from './MonthTheme.module.css'

export function MonthTheme() {
  const { template, fill, field, editing, stepMonth } = useDoc()

  return (
    <section aria-labelledby="theme-label" className={styles.section}>
      <SectionBox
        accent="purple"
        label={LABELS.theme}
        labelId="theme-label"
        bodyClassName={styles.body}
      >
        <MegaphoneDoodle className={styles.megaphone} size={78} />

        <div className={styles.stars}>
          <SparkStar className={styles.starBig} size={34} />
          <SparkStar className={styles.starMid} size={26} />
          <SparkStar className={styles.starSmall} size={18} />
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
          <p className={styles.month}>{monthName(template.theme)}</p>
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
          <Badge accent="purple" size="sm" className={styles.answerBadge}>
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
