'use client'

import { useEffect } from 'react'
import { PaperSheet } from '../../components/PaperSheet'
import { SectionBox } from '../../components/SectionBox'
import { ROUTES } from '../../model/site'
import styles from './page.module.css'

/**
 * Первый error boundary в проекте, и стоит он **на сегменте кабинета**, а не в
 * корне. Это ровно граница между двумя отношениями к мёртвой базе: настройки
 * без хранилища не существуют и обязаны падать, а лендинг, постер, примеры и
 * печать от базы не зависят и падать не должны — их этот boundary не накрывает.
 *
 * Мягкой плашки «попробуйте попозже» здесь нет намеренно: она прятала бы аварию
 * и от человека, и от нас. Страница честно говорит, что сломалось, и показывает
 * `digest` — по нему находится строка в логах сервера.
 */
export default function AccountError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  // В проде текст ошибки до браузера не доезжает (Next его прячет), поэтому в
  // консоль пишем то, что есть: в деве это сообщение, в проде — хотя бы digest.
  useEffect(() => {
    console.error('[account] страница не собралась:', error.digest ?? error.message)
  }, [error])

  return (
    <PaperSheet>
      <SectionBox accent="deep" label="Кабинет" className={styles.section}>
        <h1 className={styles.title}>Настройки не открылись</h1>
        <p className={styles.text}>
          Хранилище настроек не ответило, поэтому показать состав семьи сейчас нечем.
          Постеры, примеры и печать от него не зависят и работают как обычно.
        </p>

        <div className={styles.familyActions}>
          <button type="button" className={styles.primary} onClick={reset}>
            Попробовать снова
          </button>
          <a className={styles.ghost} href={ROUTES.sheetEdit}>
            Собрать свой сезон
          </a>
        </div>

        {error.digest && (
          <p className={styles.sub}>
            Код ошибки: {error.digest} — по нему её видно в логах сервера.
          </p>
        )}
      </SectionBox>
    </PaperSheet>
  )
}
