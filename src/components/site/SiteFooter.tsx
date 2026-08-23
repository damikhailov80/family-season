import { CONTACT_EMAIL } from '../../model/site'
import { HeartDoodle } from '../doodles'
import styles from './SiteFooter.module.css'

export function SiteFooter() {
  return (
    <footer className={styles.footer}>
      <HeartDoodle className={styles.heart} size={26} />
      <p className={styles.note}>Предложения и отзывы очень ждём — напишите нам</p>
      <a className={styles.mail} href={`mailto:${CONTACT_EMAIL}`}>
        {CONTACT_EMAIL}
      </a>
    </footer>
  )
}
