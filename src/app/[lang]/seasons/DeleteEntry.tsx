'use client'

import { useState } from 'react'
import { Dialog } from '../../../components/dialog/Dialog'
import dialogStyles from '../../../components/dialog/Dialog.module.css'
import { useDict, useLang } from '../../../i18n/context'
import { fill } from '../../../i18n/fill'
import { dropEntry } from '../../../server/actions'
import styles from './page.module.css'

/**
 * Клиентский по той же причине, что и `FamilyEditor`: без JS подтверждение стоило
 * бы отдельного экрана. Спрашиваем не для порядка — другой копии сезона нет ни у
 * нас, ни у человека.
 */
export function DeleteEntry({ code, title, back }: { code: string; title: string; back: string }) {
  const [open, setOpen] = useState(false)
  const lang = useLang()
  const { seasons, dialogs } = useDict()

  return (
    <>
      <button
        type="button"
        className={styles.rowButton}
        onClick={() => setOpen(true)}
        aria-label={fill(seasons.removeOne, { title })}
      >
        ×
      </button>

      {open && (
        <Dialog
          title={seasons.removeHeading}
          onDismiss={() => setOpen(false)}
          actions={
            <>
              <button type="button" className={dialogStyles.ghost} onClick={() => setOpen(false)}>
                {dialogs.cancel}
              </button>
              {/* Привязанные аргументы уезжают в браузер и проверяются заново. */}
              <form action={dropEntry.bind(null, code, back, lang)}>
                <button type="submit" className={dialogStyles.primary}>
                  {seasons.removeAction}
                </button>
              </form>
            </>
          }
        >
          <p className={dialogStyles.text}>{fill(seasons.removeAskOne, { title })}</p>
        </Dialog>
      )}
    </>
  )
}
