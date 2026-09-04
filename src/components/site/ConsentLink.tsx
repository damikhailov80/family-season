'use client'

import { useDict } from '../../i18n/context'
import { openConsent } from '../../model/consent'
import styles from './SiteFooter.module.css'

/**
 * «Куки» в подвале — единственный способ передумать для невошедшего: кабинета
 * у него нет, а отзывать согласие он вправе так же легко, как давал.
 *
 * Кнопка, а не ссылка: никуда не ведёт, а открывает тот же разговор заново.
 * Стили берёт у соседней ссылки на `/privacy` — в подвале это один ряд, и две
 * копии одних и тех же правил разошлись бы.
 */
export function ConsentLink() {
  const { site } = useDict()

  return (
    <button type="button" className={styles.linkButton} onClick={() => openConsent()}>
      {site.cookies}
    </button>
  )
}
