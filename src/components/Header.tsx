import { PLACEHOLDERS } from '../model/labels'
import { useDoc } from '../state/docContext'
import { SparkleRays } from './doodles'
import { PosterIcon } from './doodles/PosterIcon'
import { EditableText } from './edit/EditableText'
import styles from './Header.module.css'

export function Header() {
  const { field } = useDoc()

  return (
    <header className={styles.header}>
      <PosterIcon slot="love" className={styles.heart} size={46} />
      <PosterIcon slot="mark" className={styles.family} size={66} />

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

      {/* Лента пустой не бывает: без своего девиза печатается девиз по умолчанию. */}
      <EditableText
        as="p"
        className={styles.ribbon}
        placeholder={PLACEHOLDERS.ribbon}
        {...field('header.ribbon')}
      />
    </header>
  )
}
