'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'
import { useDict, useLang } from '../../i18n/context'
import { subscribeConsent, type Consent } from '../../model/consent'
import { ROUTES, withLang } from '../../model/site'
import { saveConsent } from '../../server/actions'
import styles from './ConsentBanner.module.css'

export function ConsentBanner({ initial }: { initial: Consent | null }) {
  const [open, setOpen] = useState(initial === null)
  const { consent } = useDict()
  const lang = useLang()

  useEffect(() => subscribeConsent(() => setOpen(true)), [])

  if (!open) return null

  function answer(value: Consent) {
    setOpen(false)
    void saveConsent(value)
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
