'use client'

import { useState, useTransition } from 'react'
import { Dialog } from '../../../components/dialog/Dialog'
import dialogStyles from '../../../components/dialog/Dialog.module.css'
import { MegaphoneDoodle } from '../../../components/doodles'
import { useDict } from '../../../i18n/context'
import { fill } from '../../../i18n/fill'
import type { Lang } from '../../../model/lang'
import { republishEntry, withdrawEntry } from '../../../server/actions'
import styles from './page.module.css'

/**
 * Значок и повадка те же, что на самом сезоне: мегафон нажат, пока сезон на
 * витрине. Спрашиваем только про снятие — там сезон может исчезнуть совсем, а
 * возврат терять нечему.
 *
 * Ожидание держит `useTransition` — та же ловушка с редиректом, что в
 * `RenameEntry`.
 */
export function ShowcaseEntry({
  code,
  title,
  hidden,
  back,
  lang,
}: {
  code: string
  title: string
  /** Снят с витрины: кнопка отжата и возвращает сезон обратно. */
  hidden: boolean
  back: string
  lang: Lang
}) {
  const [open, setOpen] = useState(false)
  const [busy, start] = useTransition()
  const { seasons, dialogs } = useDict()
  const label = fill(hidden ? seasons.showcaseOffOne : seasons.showcaseOnOne, { title })

  return (
    <>
      <button
        type="button"
        className={styles.rowButton}
        onClick={() => (hidden ? start(() => republishEntry(code, back, lang)) : setOpen(true))}
        disabled={busy}
        aria-pressed={!hidden}
        title={label}
        aria-label={label}
      >
        <MegaphoneDoodle size={17} strokeWidth={4} />
      </button>

      {open && (
        <Dialog
          title={dialogs.withdraw}
          onDismiss={() => setOpen(false)}
          actions={
            <>
              <button
                type="button"
                className={dialogStyles.ghost}
                disabled={busy}
                onClick={() => setOpen(false)}
              >
                {dialogs.cancel}
              </button>
              <button
                type="button"
                className={dialogStyles.primary}
                disabled={busy}
                onClick={() => {
                  setOpen(false)
                  start(() => withdrawEntry(code, back, lang))
                }}
              >
                {dialogs.withdrawAction}
              </button>
            </>
          }
        >
          <p className={dialogStyles.text}>{fill(seasons.withdrawAskOne, { title })}</p>
          {/* Приписка та же, что в окне у самого сезона, и оттуда же. */}
          <p className={dialogStyles.text}>{dialogs.withdrawNote}</p>
        </Dialog>
      )}
    </>
  )
}
