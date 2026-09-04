import Link from 'next/link'
import { PaperSheet } from '../PaperSheet'
import { SectionBox } from '../SectionBox'
import styles from './NotFoundBox.module.css'

export function NotFoundBox({
  heading,
  text,
  actions,
}: {
  heading: string
  text: string
  actions: React.ReactNode
}) {
  return (
    <PaperSheet>
      <SectionBox accent="deep" label={heading} className={styles.section}>
        <p className={styles.text}>{text}</p>
        <div className={styles.actions}>{actions}</div>
      </SectionBox>
    </PaperSheet>
  )
}

export function NotFoundLink({
  href,
  primary,
  children,
}: {
  href: string
  primary?: boolean
  children: React.ReactNode
}) {
  return (
    <Link className={primary ? styles.primary : styles.ghost} href={href}>
      {children}
    </Link>
  )
}
