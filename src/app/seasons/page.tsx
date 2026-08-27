import type { Metadata } from 'next'
import { PaperSheet } from '../../components/PaperSheet'
import { SectionBox } from '../../components/SectionBox'
import { RocketDoodle } from '../../components/doodles'
import { GoogleLoginButton } from '../../components/site/GoogleLoginButton'
import { ROUTES } from '../../model/site'
import { auth } from '../../server/auth'
import styles from './page.module.css'

export const metadata: Metadata = {
  title: 'Мои сезоны — Семейный сезон',
  description: 'Личный кабинет: все сезоны вашей семьи в одном месте.',
}

/**
 * Кабинет открыт только вошедшим. Проверка стоит прямо здесь, в серверном
 * компоненте, а не в `proxy.ts`: это и есть проверка у источника данных, а
 * прокси по документации Next — лишь оптимистичная догадка и рубежом защиты
 * быть не может.
 *
 * Незалогиненного не уводим редиректом: адрес «Мои сезоны» есть в шапке, и он
 * обязан открываться и объяснять себя. Отдельная страница входа поэтому не нужна.
 */
export default async function SeasonsPage() {
  const session = await auth()
  const who = session?.user?.name || session?.user?.email

  if (!who) {
    return (
      <PaperSheet>
        <SectionBox accent="deep" label="Мои сезоны" className={styles.section}>
          <h1 className={styles.title}>Здесь живут ваши сезоны</h1>
          <p className={styles.text}>
            Все прожитые сезоны в одном месте: вернуться к прошлому месяцу, посмотреть, что из
            задуманного случилось, и собрать следующий из готового. Чтобы отличить ваши сезоны
            от чужих, нужно войти.
          </p>
          <div className={styles.login}>
            <GoogleLoginButton />
          </div>
          <p className={styles.hand}>
            А собрать и распечатать постер можно и без входа — сезон целиком помещается в ссылку.
          </p>
          <a className={styles.primary} href={ROUTES.sheetEdit}>
            Собрать свой сезон
          </a>
        </SectionBox>
      </PaperSheet>
    )
  }

  return (
    <PaperSheet>
      <SectionBox accent="deep" label="Мои сезоны" note="скоро" className={styles.section}>
        <RocketDoodle className={styles.rocket} size={54} />
        <h1 className={styles.title}>Здравствуйте, {who}!</h1>
        <p className={styles.text}>
          Сохранённых сезонов пока нет: хранилище ещё строится. Скоро прожитые сезоны будут
          лежать здесь — вернуться к прошлому месяцу, посмотреть, что из задуманного случилось,
          и собрать следующий из готового.
        </p>
        <p className={styles.hand}>
          Пока сезон хранится целиком в ссылке: нажмите «Скопировать ссылку» на постере и положите
          её в закладки — это и есть ваш сезон.
        </p>
        <a className={styles.primary} href={ROUTES.sheetEdit}>
          Собрать свой сезон
        </a>
        <p className={styles.note}>
          Имя и почта лежат только в куке вашего браузера — на сервере их нет. В базе у нас
          одна строка с настройками кабинета и ни одного вашего постера; подробности — на
          странице «Приватность».
        </p>
      </SectionBox>
    </PaperSheet>
  )
}
