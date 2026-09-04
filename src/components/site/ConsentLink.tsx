'use client'

import { useDict } from '../../i18n/context'
import { openConsent } from '../../model/consent'
import styles from './SiteFooter.module.css'

/**
 * Единственный способ передумать для невошедшего: кабинета у него нет. Кнопка, а
 * не ссылка — никуда не ведёт, а открывает тот же разговор заново; стили берёт у
 * соседней ссылки на `/privacy`, в подвале это один ряд.
 */
export function ConsentLink() {
  const { site } = useDict()

  return (
    <button type="button" className={styles.linkButton} onClick={() => openConsent()}>
      {site.cookies}
    </button>
  )
}
