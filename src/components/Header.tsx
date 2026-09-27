import { useDoc, usePoster } from '../state/docContext'
import { SparkleRays } from './doodles'
import { PosterIcon } from './doodles/PosterIcon'
import { EditableText } from './edit/EditableText'
import styles from './Header.module.css'

export function Header({ titleAs = 'h1' }: { titleAs?: 'h1' | 'p' }) {
  const { field } = useDoc()
  const { placeholders } = usePoster()

  return (
    <header className={styles.header}>
      <PosterIcon slot="love" className={styles.heart} size={46} />
      <PosterIcon slot="mark" className={styles.family} size={66} />

      <div className={styles.titleRow}>
        <SparkleRays className={styles.rays} />
        <EditableText
          as={titleAs}
          className={styles.title}
          placeholder={placeholders.title}
          {...field('header.title')}
        />
        <SparkleRays className={`${styles.rays} ${styles.raysRight}`} />
      </div>

      <EditableText
        as="p"
        className={styles.ribbon}
        placeholder={placeholders.ribbon}
        {...field('header.ribbon')}
      />
    </header>
  )
}
