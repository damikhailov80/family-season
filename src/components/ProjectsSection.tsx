import { projects, projectsSection } from '../data/content'
import { AvatarFace } from './AvatarFace'
import { Badge } from './Badge'
import { RocketDoodle } from './doodles'
import { ProgressBar } from './ProgressBar'
import styles from './ProjectsSection.module.css'

export function ProjectsSection() {
  return (
    <section aria-labelledby="projects-label" className={styles.section}>
      <div className={styles.head}>
        <Badge accent="blue">
          <span id="projects-label">{projectsSection.badge}</span>
        </Badge>
        <span className={styles.note}>{projectsSection.note}</span>
        <RocketDoodle className={styles.rocket} size={48} />
      </div>

      <div className={styles.list}>
        {projects.map((person) => (
          <article
            key={person.role}
            className={styles.row}
            style={{ '--accent': `var(--${person.accent})` } as React.CSSProperties}
          >
            <div className={styles.avatarBlock}>
              <span className={styles.avatarRing}>
                <AvatarFace variant={person.face} size={48} />
              </span>
              <span className={styles.role}>{person.role}</span>
            </div>

            <div className={styles.content}>
              <div className={styles.main}>
                <p className={styles.projectLine}>
                  <span className={styles.fieldLabel}>Проект:</span>
                  <span className={styles.projectName}>{person.project}</span>
                </p>
                <p className={styles.description}>
                  {person.description.map((line) => (
                    <span key={line}>{line}</span>
                  ))}
                </p>
              </div>

              <div className={styles.progress}>
                <span className={styles.fieldLabel}>Прогресс</span>
                <div className={styles.progressRow}>
                  <ProgressBar percent={person.percent} label={person.project} />
                  <span className={styles.percent}>{person.percent}%</span>
                </div>
              </div>

              <p className={styles.goal}>
                <span className={styles.fieldLabel}>Моя цель месяца:</span>
                <span className={styles.goalText}>{person.monthGoal}</span>
              </p>
            </div>
          </article>
        ))}
      </div>
    </section>
  )
}
