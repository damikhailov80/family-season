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

/**
 * Ловушка, которая уже стоила отладки: действие заканчивается редиректом, но
 * компонент от этого не монтируется заново — Next перерисовывает маршрут на
 * месте, и свой флажок «сохраняем» залип бы навсегда. Поэтому ожидание держит
 * `useTransition`: он гаснет сам, когда перерисовка дошла.
 */
export function RenameEntry({
  code,
  title,
  back,
  lang,
}: {
  code: string
  title: string
  back: string
  /** Язык **сезона**: им подставляется запасное имя, если поле оставили пустым. */
  lang: Lang
}) {
  const input = useRef<HTMLInputElement>(null)
  const { seasons, dialogs } = useDict()
  const [open, setOpen] = useState(false)
  const [busy, start] = useTransition()

  const save = () => {
    const next = input.current?.value ?? title
    // Окно закрываем сразу: подтверждением служит сам список.
    setOpen(false)
    /*
     * Название уезжает аргументом, а не полем формы: форму из клиентского
     * компонента React кодирует под своими именами (`_1_title`), и
     * `formData.get('title')` на сервере молча вернул бы пустоту.
     */
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
          {/* Окно рисуется, только пока открыто, поэтому поле каждый раз новое и
              `defaultValue` подставляется честно. */}
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
