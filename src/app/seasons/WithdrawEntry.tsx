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
 * строкой, зависит от чужих людей: отложил кто-то сезон в избранное, он
 * останется жить по ссылке; не отложил никто — исчезнет вместе с лайками.
 *
 * Ожидание держит `useTransition`: действие кончается редиректом, а компонент
 * от этого не монтируется заново — свой флажок «убираем» так и остался бы
 * поднятым (та же ловушка, что в `RenameEntry`).
 */
export function WithdrawEntry({
  code,
  title,
  favorites,
  back,
}: {
  code: string
  title: string
  /** Сколько людей отложило сезон: от этого зависит, что с ним станет. */
  favorites: number
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
          Убрать «{title}» с витрины?
        </h2>
        <p className={styles.dialogText}>
          {favorites > 0
            ? `Сезон отложили себе ${favorites} чел. — он останется открываться по прямой ссылке, но из «Идей сообщества» пропадёт. Забирать отложенное у людей мы не будем.`
            : 'Публикацию никто не откладывал, поэтому она исчезнет совсем — вместе с лайками. Ваш собственный сезон это не тронет: на витрине лежит его копия.'}
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
