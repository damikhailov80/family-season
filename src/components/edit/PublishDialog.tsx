'use client'

import { useRef } from 'react'
import { Dialog } from '../dialog/Dialog'
import styles from '../dialog/Dialog.module.css'
import { PUBLISH_TEXT, type PublishStatus } from '../../model/community'
import { publicSeasonHref } from '../../model/site'

/**
 * Выложить сезон на витрину.
 *
 * Окно спрашивает подтверждение и предлагает обезличить имена — и больше ничего.
 * Что на витрину уезжает **копия**, что связь с этим сезоном обрывается и что
 * одинакового контента витрина не держит, в тексте не разбирается: это устройство
 * сайта (см. «Витрина» в CLAUDE.md), а не забота нажимающего.
 *
 * Галочка обезличивания стоит здесь же, а не в настройках: решение принимают
 * про конкретный сезон, а не вообще. Имена подменяются только в копии — свой
 * сезон остаётся с настоящими.
 *
 * **Ответ витрины приходит до нажатия, а не после.** Пока идёт проверка
 * (`check === null`), кнопка ждёт; нашёлся такой же сезон — окно говорит об этом
 * сразу и, если ему есть куда вести, предлагает посмотреть. Прежде человек
 * заполнял окно, жал «Выложить» и только тогда получал отказ тостом.
 *
 * Своей беды проверка не показывает: не ответила база — окно ведёт себя как
 * раньше, а отказ, если он будет, объяснит сама публикация.
 */
export function PublishDialog({
  check,
  busy,
  onDismiss,
  onSubmit,
}: {
  /** Что показала проверка витрины; `null` — ещё проверяем. */
  check: { status: PublishStatus; code?: string } | null
  busy: boolean
  onDismiss: () => void
  onSubmit: (anonymize: boolean) => void
}) {
  const anonymize = useRef<HTMLInputElement>(null)

  const refusal =
    check?.status === 'duplicate' || check?.status === 'blocked' || check?.status === 'limit'
      ? PUBLISH_TEXT[check.status]
      : null

  if (refusal) {
    return (
      <Dialog
        title="Выложить на витрину"
        onDismiss={onDismiss}
        actions={
          // Отменять тут нечего: ничего не случится в любом случае, и кнопка
          // остаётся одна.
          <button type="button" className={styles.primary} onClick={onDismiss}>
            Закрыть
          </button>
        }
      >
        <p className={styles.text}>{refusal}</p>
        {/* Ссылка есть не всегда: у снятого с витрины сезона места нет, и
            вести туда незачем — на витрине его не увидят. */}
        {check.code && (
          <a className={styles.link} href={publicSeasonHref(check.code)}>
            Посмотреть на витрине
          </a>
        )}
      </Dialog>
    )
  }

  return (
    <Dialog
      title="Выложить на витрину"
      onDismiss={onDismiss}
      actions={
        <>
          <button type="button" className={styles.ghost} onClick={onDismiss} disabled={busy}>
            Отмена
          </button>
          <button
            type="button"
            className={styles.primary}
            onClick={() => onSubmit(Boolean(anonymize.current?.checked))}
            disabled={busy || !check}
          >
            {busy ? 'Выкладываем…' : check ? 'Выложить' : 'Проверяем…'}
          </button>
        </>
      }
    >
      <p className={styles.text}>Копия сезона появится в «Идеях сообщества».</p>

      <label className={styles.check}>
        <input className={styles.checkBox} ref={anonymize} type="checkbox" />
        <span>Заменить имена на случайные</span>
      </label>
    </Dialog>
  )
}
