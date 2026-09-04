'use client'

import { useEffect, useState } from 'react'
import { useDict } from '../../i18n/context'
import styles from './Toast.module.css'

/**
 * Тост говорит, что случилось, а на месте данных остаётся пусто: страниц-заглушек
 * под каждый отказ не заводим. Повторный отказ показывается заново только со
 * сменой `key` — тост монтируется с нуля.
 */
export function Toast({ message, timeout = 7000 }: { message: string; timeout?: number }) {
  const [visible, setVisible] = useState(true)
  const { site } = useDict()

  useEffect(() => {
    const id = setTimeout(() => setVisible(false), timeout)
    return () => clearTimeout(id)
  }, [timeout])

  if (!visible) return null

  return (
    // `alert`, а не `status`: ошибку читалка должна прочитать сразу.
    <div className={styles.toast} role="alert">
      <p className={styles.text}>{message}</p>
      <button
        type="button"
        className={styles.close}
        onClick={() => setVisible(false)}
        aria-label={site.toastClose}
      >
        ×
      </button>
    </div>
  )
}
