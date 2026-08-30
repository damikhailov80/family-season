'use client'

import { useRef, useTransition } from 'react'
import { MegaphoneDoodle } from '../../components/doodles'
import { WITHDRAW_NOTE } from '../../model/community'
import { republishEntry, withdrawEntry } from '../../server/actions'
import styles from './page.module.css'

/**
 * Витрина под своей публикацией — прямо из списка, в обе стороны.
 *
 * Значок тот же, что на самом сезоне, и повадка та же: мегафон нажат
 * (`aria-pressed`), пока сезон на витрине, и снимает его; отжатый возвращает
 * обратно. Крестик здесь стоял, пока кнопка умела одно движение, — а «убрать» и
 * «вернуть» одним крестиком не показать, да и в двух местах про одно и то же
 * незачем говорить двумя разными значками.
 *
 * Спрашиваем только про снятие: что случится со строкой, зависит не только от
 * автора — отложил кто-то сезон в избранное, и он останется жить по ссылке; не
 * отложил никто — исчезнет вместе с лайками. Возврат не спрашивает ничего:
 * строка та же самая, и терять нечего.
 *
 * Ожидание держит `useTransition`: действие кончается редиректом, а компонент от
 * этого не монтируется заново — свой флажок «убираем» так и остался бы поднятым
 * (та же ловушка, что в `RenameEntry`).
 */
export function ShowcaseEntry({
  code,
  title,
  hidden,
  back,
}: {
  code: string
  title: string
  /** Снят с витрины: кнопка отжата и возвращает сезон обратно. */
  hidden: boolean
  back: string
}) {
  const dialog = useRef<HTMLDialogElement>(null)
  const [busy, start] = useTransition()
  const label = hidden ? `Вернуть «${title}» на витрину` : `Убрать «${title}» с витрины`

  return (
    <>
      <button
        type="button"
        className={styles.rowButton}
        onClick={() =>
          hidden ? start(() => republishEntry(code, back)) : dialog.current?.showModal()
        }
        disabled={busy}
        aria-pressed={!hidden}
        title={label}
        aria-label={label}
      >
        <MegaphoneDoodle size={17} strokeWidth={4} />
      </button>

      <dialog className={styles.dialog} ref={dialog} aria-labelledby={`off-${code}`}>
        <h2 className={styles.dialogTitle} id={`off-${code}`}>
          Убрать с витрины
        </h2>
        <p className={styles.dialogText}>
          Вы уверены, что хотите убрать сезон «{title}» из «Идей сообщества»?
        </p>
        {/* Приписка та же, что в окне у самого сезона, и оттуда же: «убрать» —
            не «удалить», отложенный кем-то сезон никуда не денется. */}
        <p className={styles.dialogText}>{WITHDRAW_NOTE}</p>
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
