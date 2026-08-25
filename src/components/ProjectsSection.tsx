import { FACE_LABELS } from '../model/accents'
import { percentFor } from '../model/fill'
import { LABELS, PLACEHOLDERS } from '../model/labels'
import { MAX_PEOPLE, MIN_PEOPLE } from '../model/types'
import { useDoc } from '../state/docContext'
import { AvatarFace } from './AvatarFace'
import { Badge } from './Badge'
import { PosterIcon } from './doodles/PosterIcon'
import { EditableText } from './edit/EditableText'
import { ProgressBar } from './ProgressBar'
import styles from './ProjectsSection.module.css'

export function ProjectsSection() {
  const { template, fill, field, editing, addPerson, removePerson, cycleFace } = useDoc()
  const people = template.people

  return (
    <section aria-labelledby="projects-label" className={styles.section}>
      <div className={styles.head}>
        <Badge accent="projects">
          <span id="projects-label">{LABELS.projects}</span>
        </Badge>
        <EditableText
          className={styles.note}
          placeholder={PLACEHOLDERS.projectsNote}
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
                    title="Сменить рисунок"
                    aria-label={`Рисунок: ${FACE_LABELS[person.face]}. Сменить`}
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
                  placeholder={PLACEHOLDERS.name}
                  {...field(`people.${index}.name`)}
                />
              </div>

              <div className={styles.content}>
                <div className={styles.main}>
                  <p className={styles.projectLine}>
                    <span className={styles.fieldLabel}>{LABELS.fieldProject}</span>
                    <EditableText
                      className={styles.projectName}
                      placeholder={PLACEHOLDERS.project}
                      {...field(`people.${index}.project`)}
                    />
                  </p>
                  <EditableText
                    as="p"
                    className={styles.description}
                    placeholder={PLACEHOLDERS.description}
                    {...field(`people.${index}.description`)}
                  />
                </div>

                <div className={styles.progress}>
                  <span className={styles.fieldLabel}>{LABELS.fieldProgress}</span>
                  <div className={styles.progressRow}>
                    <ProgressBar
                      percent={percent}
                      label={person.project || person.name || PLACEHOLDERS.project}
                    />
                  </div>
                </div>

                <p className={styles.goal}>
                  <span className={styles.fieldLabel}>{LABELS.fieldGoal}</span>
                  <EditableText
                    className={styles.goalText}
                    placeholder={PLACEHOLDERS.personGoal}
                    {...field(`people.${index}.goal`)}
                  />
                </p>
              </div>

              {editing && people.length > MIN_PEOPLE && (
                <button
                  type="button"
                  className={styles.remove}
                  onClick={() => removePerson(person.id)}
                  aria-label={`Убрать: ${person.name || FACE_LABELS[person.face]}`}
                  title="Убрать из листа"
                >
                  ×
                </button>
              )}
            </article>
          )
        })}

        {editing && people.length < MAX_PEOPLE && (
          <button type="button" className={styles.add} onClick={addPerson}>
            + Добавить человека
          </button>
        )}
      </div>
    </section>
  )
}
