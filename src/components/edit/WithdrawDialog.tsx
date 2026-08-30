'use client'

import { Dialog } from '../dialog/Dialog'
import styles from '../dialog/Dialog.module.css'
import { WITHDRAW_NOTE } from '../../model/community'

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
  return (
    <Dialog
      title="Убрать с витрины"
      onDismiss={onDismiss}
      actions={
        <>
          <button type="button" className={styles.ghost} onClick={onDismiss} disabled={busy}>
            Отмена
          </button>
          <button type="button" className={styles.primary} onClick={onSubmit} disabled={busy}>
            {busy ? 'Убираем…' : 'Убрать'}
          </button>
        </>
      }
    >
      {/* Вопрос про то, что человек нажал, и одна приписка под ним: «убрать» —
          не «удалить», отложенный кем-то сезон никуда не денется. Остального
          устройства витрины окно по-прежнему не пересказывает. */}
      <p className={styles.text}>Вы уверены, что хотите убрать сезон из «Идей сообщества»?</p>
      <p className={styles.text}>{WITHDRAW_NOTE}</p>
    </Dialog>
  )
}
