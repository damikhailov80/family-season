'use client'

import { useRef, useTransition } from 'react'
import { MegaphoneDoodle } from '../../components/doodles'
import { withdrawEntry } from '../../server/actions'
import styles from './page.module.css'

/**
 * Снятие своей публикации с витрины прямо из списка.
 *
 * Клиентский по той же причине, что `DeleteEntry`: без JS подтверждение стоило
 * бы отдельного экрана. А подтверждение здесь обязательно — что случится со
 * строкой, зависит не только от автора: отложил кто-то сезон в избранное или
 * пожаловался на него — он останется жить по ссылке; не случилось ни того ни
 * другого — исчезнет вместе с лайками. В окне этой ветки нет: оно спрашивает
 * про то, что человек нажал, а устройство витрины описано в CLAUDE.md.
 *
 * Ожидание держит `useTransition`: действие кончается редиректом, а компонент
 * от этого не монтируется заново — свой флажок «убираем» так и остался бы
 * поднятым (та же ловушка, что в `RenameEntry`).
 */
export function WithdrawEntry({
  code,
  title,
  back,
}: {
  code: string
  title: string
  back: string
}) {
  const dialog = useRef<HTMLDialogElement>(null)
  const [busy, start] = useTransition()

  return (
    <>
      <button
        type="button"
        className={styles.rowButton}
        onClick={() => dialog.current?.showModal()}
        disabled={busy}
        title={`Убрать «${title}» с витрины`}
        aria-label={`Убрать «${title}» с витрины`}
      >
        <MegaphoneDoodle size={16} strokeWidth={4} />
      </button>

      <dialog className={styles.dialog} ref={dialog} aria-labelledby={`off-${code}`}>
        <h2 className={styles.dialogTitle} id={`off-${code}`}>
          Убрать с витрины
        </h2>
        <p className={styles.dialogText}>
          Вы уверены, что хотите убрать сезон «{title}» из «Идей сообщества»?
        </p>
        <div className={styles.dialogActions}>
          <button
            type="button"
            className={styles.ghost}
            disabled={busy}
            onClick={() => dialog.current?.close()}
          >
            Отмена
          </button>
          <button
            type="button"
            className={styles.danger}
            disabled={busy}
            onClick={() => {
              dialog.current?.close()
              start(() => withdrawEntry(code, back))
            }}
          >
            Убрать
          </button>
        </div>
      </dialog>
    </>
  )
}
