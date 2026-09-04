'use client'

import { Dialog } from '../dialog/Dialog'
import styles from '../dialog/Dialog.module.css'
import { useDict } from '../../i18n/context'

/**
 * Спрашиваем не для порядка: что станет с публикацией, зависит не только от
 * автора — отложенная в избранное остаётся жить по ссылке, неотложенная уходит
 * совсем.
 */
export function WithdrawDialog({
  busy,
  onDismiss,
  onSubmit,
}: {
  busy: boolean
  onDismiss: () => void
  onSubmit: () => void
}) {
  const { dialogs } = useDict()

  return (
    <Dialog
      title={dialogs.withdraw}
      onDismiss={onDismiss}
      actions={
        <>
          <button type="button" className={styles.ghost} onClick={onDismiss} disabled={busy}>
            {dialogs.cancel}
          </button>
          <button type="button" className={styles.primary} onClick={onSubmit} disabled={busy}>
            {busy ? dialogs.withdrawing : dialogs.withdrawAction}
          </button>
        </>
      }
    >
      {/* Приписка под вопросом одна: «убрать» слишком похоже на «удалить». */}
      <p className={styles.text}>{dialogs.withdrawAsk}</p>
      <p className={styles.text}>{dialogs.withdrawNote}</p>
    </Dialog>
  )
}
