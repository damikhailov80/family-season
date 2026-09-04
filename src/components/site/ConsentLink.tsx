'use client'

import { useDict } from '../../i18n/context'
import { openConsent } from '../../model/consent'
import styles from './SiteFooter.module.css'

export function ConsentLink() {
  const { site } = useDict()

  return (
    <button type="button" className={styles.linkButton} onClick={() => openConsent()}>
      {site.cookies}
    </button>
  )
}
