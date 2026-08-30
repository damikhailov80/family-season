'use client'

import { Dialog } from '../dialog/Dialog'
import styles from '../dialog/Dialog.module.css'
import { useDict } from '../../i18n/context'

/**
 * Убрать свой сезон с витрины.
 *
 * Спрашиваем не для порядка: что станет с публикацией, зависит не только от
 * автора. Отложили её в избранное — строка остаётся жить по прямой ссылке (у
 * людей не должно пропадать отложенное); не отложил никто — уходит совсем,
 * вместе с лайками.
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
      {/* Вопрос про то, что человек нажал, и одна приписка под ним: «убрать» —
          не «удалить», отложенный кем-то сезон никуда не денется. Остального
          устройства витрины окно по-прежнему не пересказывает. */}
      <p className={styles.text}>{dialogs.withdrawAsk}</p>
      <p className={styles.text}>{dialogs.withdrawNote}</p>
    </Dialog>
  )
}
