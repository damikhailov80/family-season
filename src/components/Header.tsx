import { PLACEHOLDERS } from '../model/labels'
import { useDoc } from '../state/docContext'
import { FamilyIcon, HeartDoodle, SparkleRays } from './doodles'
import { EditableText } from './edit/EditableText'
import styles from './Header.module.css'

export function Header() {
  const { field, editing, template } = useDoc()

  return (
    <header className={styles.header}>
      <HeartDoodle className={styles.heart} size={46} />
      <FamilyIcon className={styles.family} size={66} />

      <div className={styles.titleRow}>
        <SparkleRays className={styles.rays} />
        <EditableText
          as="h1"
          className={styles.title}
          placeholder={PLACEHOLDERS.title}
          {...field('header.title')}
        />
        <SparkleRays className={`${styles.rays} ${styles.raysRight}`} />
      </div>

      {/* Пустую ленту не печатаем: тёмная плашка без текста выглядит как брак. */}
      {(editing || template.header.ribbon) && (
        <EditableText
          as="p"
          className={styles.ribbon}
          placeholder={PLACEHOLDERS.ribbon}
          {...field('header.ribbon')}
        />
      )}
    </header>
  )
}
