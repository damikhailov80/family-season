'use client'

import { useRef, useState, useTransition } from 'react'
import { Dialog } from '../../../components/dialog/Dialog'
import dialogStyles from '../../../components/dialog/Dialog.module.css'
import { PenDoodle } from '../../../components/doodles'
import { useDict } from '../../../i18n/context'
import { fill } from '../../../i18n/fill'
import type { Lang } from '../../../model/lang'
import { TITLE_LIMIT } from '../../../model/library'
import { renameEntry } from '../../../server/actions'
import styles from './page.module.css'

export function RenameEntry({
  code,
  title,
  back,
  lang,
}: {
  code: string
  title: string
  back: string
  lang: Lang
}) {
  const input = useRef<HTMLInputElement>(null)
  const { seasons, dialogs } = useDict()
  const [open, setOpen] = useState(false)
  const [busy, start] = useTransition()

  const save = () => {
    const next = input.current?.value ?? title
    setOpen(false)
    start(() => renameEntry(code, back, next, lang))
  }

  return (
    <>
      <button
        type="button"
        className={styles.rowButton}
        onClick={() => setOpen(true)}
        title={fill(seasons.renameOne, { title })}
        aria-label={fill(seasons.renameOne, { title })}
      >
        <PenDoodle size={16} strokeWidth={3.6} />
      </button>

      {open && (
        <Dialog
          title={dialogs.rename}
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
              <button type="button" className={dialogStyles.primary} disabled={busy} onClick={save}>
                {dialogs.save}
              </button>
            </>
          }
        >
          <p className={dialogStyles.text}>{dialogs.renameHint}</p>
          <label className={dialogStyles.label} htmlFor={`title-${code}`}>
            {dialogs.titleLabel}
          </label>
          <input
            className={dialogStyles.input}
            id={`title-${code}`}
            ref={input}
            type="text"
            defaultValue={title}
            maxLength={TITLE_LIMIT}
            autoComplete="off"
          />
        </Dialog>
      )}
    </>
  )
}
