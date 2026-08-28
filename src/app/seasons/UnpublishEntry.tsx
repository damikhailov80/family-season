'use client'

import { useRef } from 'react'
import { MegaphoneDoodle } from '../../components/doodles'
import { unpublishEntry } from '../../server/actions'
import styles from './page.module.css'

/**
 * Убрать сезон с витрины сообщества — с подтверждением.
 *
 * Спрашиваем не для порядка: вместе с публикацией каскадом уходят собранные ею
 * лайки, и вернуть их обратно нельзя — выложив сезон заново, человек начнёт
 * с нуля. Окно единственное место, где это можно сказать заранее.
 *
 * Клиентский по той же причине, что `DeleteEntry`: без JS подтверждение стоило
 * бы отдельного экрана. Сам список остаётся серверным.
 */
export function UnpublishEntry({
  id,
  title,
  likes,
  back,
}: {
  id: string
  title: string
  likes: number
  back: string
}) {
  const dialog = useRef<HTMLDialogElement>(null)

  return (
    <>
      <button
        type="button"
        className={styles.rowButton}
        onClick={() => dialog.current?.showModal()}
        aria-label={`Убрать «${title}» с витрины`}
        title="Убрать с витрины сообщества"
      >
        <MegaphoneDoodle size={15} strokeWidth={4} />
      </button>

      <dialog className={styles.dialog} ref={dialog} aria-labelledby={`hide-${id}`}>
        <h2 className={styles.dialogTitle} id={`hide-${id}`}>
          Убрать «{title}» с витрины?
        </h2>
        <p className={styles.dialogText}>
          Сезон исчезнет из «Идей сообщества» и останется только у вас. Сам постер никуда не
          денется — он живёт в своей ссылке.
          {likes > 0 &&
            ` Лайки пропадут вместе с публикацией: выложив сезон заново, вы начнёте с нуля, а их уже ${likes}.`}
        </p>
        <div className={styles.dialogActions}>
          <button type="button" className={styles.ghost} onClick={() => dialog.current?.close()}>
            Отмена
          </button>
          {/* Действие серверное: аргументы привязаны, но проверяются заново —
              привязка уезжает в браузер и возвращается оттуда. */}
          <form action={unpublishEntry.bind(null, id, back)}>
            <button type="submit" className={styles.danger}>
              Убрать
            </button>
          </form>
        </div>
      </dialog>
    </>
  )
}
