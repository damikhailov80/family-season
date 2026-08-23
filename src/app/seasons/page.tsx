import type { Metadata } from 'next'
import { PaperSheet } from '../../components/PaperSheet'
import { SectionBox } from '../../components/SectionBox'
import { RocketDoodle } from '../../components/doodles'
import { ROUTES } from '../../model/site'
import styles from './page.module.css'

export const metadata: Metadata = {
  title: 'Мои сезоны — Семейный сезон',
  description: 'Личный кабинет: все сезоны вашей семьи в одном месте.',
}

export default function SeasonsPage() {
  return (
    <PaperSheet>
      <SectionBox accent="navy" label="Мои сезоны" note="скоро" className={styles.section}>
        <RocketDoodle className={styles.rocket} size={54} />
        <h1 className={styles.title}>Здесь появятся ваши сезоны</h1>
        <p className={styles.text}>
          Все прожитые сезоны в одном месте: вернуться к прошлому месяцу, посмотреть, что из
          задуманного случилось, и собрать следующий из готового. Вход через Google или
          Facebook — тоже скоро.
        </p>
        <p className={styles.hand}>
          Пока сезон хранится целиком в ссылке: нажмите «Скопировать ссылку» на постере и положите
          её в закладки — это и есть ваш сезон.
        </p>
        <a className={styles.primary} href={ROUTES.newSheet}>
          Собрать свой сезон
        </a>
      </SectionBox>
    </PaperSheet>
  )
}
