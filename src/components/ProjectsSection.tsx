import { faceLabels } from '../model/accents'
import { percentFor } from '../model/fill'
import { MAX_PEOPLE, MIN_PEOPLE } from '../model/types'
import { useDict } from '../i18n/context'
import { fill as insert } from '../i18n/fill'
import { useDoc, usePoster } from '../state/docContext'
import { AvatarFace } from './AvatarFace'
import { Badge } from './Badge'
import { PosterIcon } from './doodles/PosterIcon'
import { EditableText } from './edit/EditableText'
import { FamilySwap } from './edit/FamilySwap'
import { ProgressBar } from './ProgressBar'
import styles from './ProjectsSection.module.css'

export function ProjectsSection() {
  const { template, fill, field, editing, addPerson, removePerson, cycleFace, lang } = useDoc()
  const { labels, placeholders } = usePoster()
  const dict = useDict()
  // Подпись рисунка — часть листа, поэтому языком сезона; сама кнопка вокруг
  // неё экранная, и её слова приходят из словаря интерфейса.
  const faces = faceLabels(lang)
  const people = template.people

  return (
    <section aria-labelledby="projects-label" className={styles.section}>
      <div className={styles.head}>
        <Badge accent="projects">
          <span id="projects-label">{labels.projects}</span>
        </Badge>
        <EditableText
          className={styles.note}
          placeholder={placeholders.projectsNote}
          {...field('projectsNote')}
        />
        <PosterIcon slot="path" className={styles.rocket} size={48} />
      </div>

      <div className={styles.list}>
        {people.map((person, index) => {
          const percent = percentFor(fill, person.id)
          return (
            <article
              key={person.id}
              className={styles.row}
              style={{ '--accent': `var(--person-${person.face})` } as React.CSSProperties}
            >
              <div className={styles.avatarBlock}>
                {editing ? (
                  <button
                    type="button"
                    className={`${styles.avatarRing} ${styles.avatarButton}`}
                    onClick={() => cycleFace(person.id)}
                    title={dict.editor.changeFace}
                    aria-label={insert(dict.editor.faceAria, { face: faces[person.face] })}
                  >
                    <AvatarFace variant={person.face} size={48} />
                  </button>
                ) : (
                  <span className={styles.avatarRing}>
                    <AvatarFace variant={person.face} size={48} />
                  </span>
                )}
                <EditableText
                  className={styles.role}
                  placeholder={placeholders.name}
                  {...field(`people.${index}.name`)}
                />
              </div>

              <div className={styles.content}>
                <div className={styles.main}>
                  <p className={styles.projectLine}>
                    <span className={styles.fieldLabel}>{labels.fieldProject}</span>
                    <EditableText
                      className={styles.projectName}
                      placeholder={placeholders.project}
                      {...field(`people.${index}.project`)}
                    />
                  </p>
                  <EditableText
                    as="p"
                    className={styles.description}
                    placeholder={placeholders.description}
                    {...field(`people.${index}.description`)}
                  />
                </div>

                <div className={styles.progress}>
                  <span className={styles.fieldLabel}>{labels.fieldProgress}</span>
                  <div className={styles.progressRow}>
                    <ProgressBar
                      percent={percent}
                      label={person.project || person.name || placeholders.project}
                    />
                  </div>
                </div>

                <p className={styles.goal}>
                  <span className={styles.fieldLabel}>{labels.fieldGoal}</span>
                  <EditableText
                    className={styles.goalText}
                    placeholder={placeholders.personGoal}
                    {...field(`people.${index}.goal`)}
                  />
                </p>
              </div>

              {editing && people.length > MIN_PEOPLE && (
                <button
                  type="button"
                  className={styles.remove}
                  onClick={() => removePerson(person.id)}
                  aria-label={insert(dict.editor.removePerson, { name: person.name || faces[person.face] })}
                  title={dict.editor.removePersonTitle}
                >
                  ×
                </button>
              )}
            </article>
          )
        })}

        {editing && (
          <div className={styles.actions}>
            {people.length < MAX_PEOPLE && (
              <button type="button" className={styles.add} onClick={addPerson}>
                {dict.editor.addPerson}
              </button>
            )}
            {/* Кнопки нет, пока состав семьи не задан в кабинете, — см. FamilySwap. */}
            <FamilySwap />
          </div>
        )}
      </div>
    </section>
  )
}
