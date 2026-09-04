'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'
import { useDict, useLang } from '../../i18n/context'
import { subscribeConsent, type Consent } from '../../model/consent'
import { ROUTES, withLang } from '../../model/site'
import { saveConsent } from '../../server/actions'
import styles from './ConsentBanner.module.css'

/**
 * Разговор о согласии на аналитику.
 *
 * **Полоса, а не модальное окно.** Запирать сайт до ответа нельзя: согласие
 * обязано быть свободным, а окно, из которого нет выхода без «да», — это стена,
 * и такое согласие не считается согласием вовсе. Поэтому баннер ничего не
 * загораживает, а тот, кто не хочет отвечать, просто продолжает читать.
 *
 * **Обе кнопки одного веса.** Отказ не имеет права быть труднее согласия — ни
 * лишним кликом, ни бледной краской. Роли из общего словаря окон (`.primary` и
 * `.ghost`) здесь не годятся именно поэтому: они разводят действие и отказ, а
 * тут это два равных ответа на один вопрос.
 *
 * Показывается, только если ответа ещё нет (`initial === null`). Открыть его
 * заново умеет ссылка «Куки» в подвале — через `subscribeConsent`.
 */
export function ConsentBanner({ initial }: { initial: Consent | null }) {
  const [open, setOpen] = useState(initial === null)
  const { consent } = useDict()
  const lang = useLang()

  useEffect(() => subscribeConsent(() => setOpen(true)), [])

  if (!open) return null

  function answer(value: Consent) {
    setOpen(false)
    void saveConsent(value)
    /*
     * Режим меняем на месте, не дожидаясь ни ответа сервера, ни перезагрузки:
     * в этом и весь смысл Consent Mode. `gtag` может и не быть — без
     * `NEXT_PUBLIC_GA_ID` баннер не рисуется вовсе, но ссылка «Куки» и здесь
     * должна отвечать молча, а не падать.
     */
    window.gtag?.('consent', 'update', {
      analytics_storage: value === 'granted' ? 'granted' : 'denied',
    })
  }

  return (
    <section className={styles.banner} aria-label={consent.bannerAria}>
      <div className={styles.text}>
        <h2 className={styles.title}>{consent.bannerTitle}</h2>
        <p className={styles.note}>
          {consent.bannerText}{' '}
          <Link className={styles.more} href={withLang(lang, ROUTES.privacy)}>
            {consent.more}
          </Link>
        </p>
      </div>
      <div className={styles.actions}>
        <button type="button" className={styles.button} onClick={() => answer('denied')}>
          {consent.decline}
        </button>
        <button type="button" className={styles.button} onClick={() => answer('granted')}>
          {consent.accept}
        </button>
      </div>
    </section>
  )
}
