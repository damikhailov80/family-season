'use client'

import { useEffect, useRef } from 'react'
import { TITLE_LIMIT } from '../../model/library'
import styles from './Dialog.module.css'

/**
 * `new`    — сезон ещё нигде не сохранён: заводим строку.
 * `update`  — сезон сохранён, но выбора нет: обновляем ту же строку. Так в
 *             просмотре, где бланк не меняли и спрашивать не о чем.
 * `choice`  — то же, но в правке: там постер мог стать другим сезоном, поэтому
 *             «Перезаписать» и «Сохранить как новый» стоят рядом.
 *
 * Имя правится во всех трёх: окно и заведено ради него и ради подтверждения —
 * сохранение молча, одним нажатием, слишком похоже на промах по кнопке.
 */
export type SaveVariant = 'new' | 'update' | 'choice'

/**
 * Сохранение сезона в кабинет.
 *
 * Второй `<dialog>` в проекте после `FamilySwap`, и заведён по той же причине:
 * перезапись затирает прежнюю версию сезона, а `confirm()` не умеет показать
 * главное — **что именно** будет перезаписано, да ещё и вешает вкладку.
 *
 * Поле названия неконтролируемое: значение читается с узла при отправке.
 * Контролируемое пришлось бы сбрасывать при каждом изменении бланка — а бланк
 * под окном продолжает жить, и умолчание названия считается из него.
 *
 * Сохранение заканчивает правку: закрыть окно и остаться в ней можно только
 * «Отменой» — тем же Esc.
 */
export function SaveSeasonDialog({
  variant,
  initialTitle,
  savedTitle,
  busy,
  onDismiss,
  onSubmit,
}: {
  variant: SaveVariant
  initialTitle: string
  savedTitle: string
  busy: boolean
  onDismiss: () => void
  onSubmit: (title: string, overwrite: boolean) => void
}) {
  const dialog = useRef<HTMLDialogElement>(null)
  const input = useRef<HTMLInputElement>(null)

  // Окно рисуется, только пока открыто, поэтому показывать его надо при монтировании.
  useEffect(() => {
    dialog.current?.showModal()
  }, [])

  const submit = (overwrite: boolean) => onSubmit(input.current?.value ?? initialTitle, overwrite)
  const known = variant !== 'new'

  return (
    // Esc и клик по подложке закрывают окно и оставляют в правке: закончить её
    // без сохранения — это «Готово», отдельная кнопка тулбара.
    <dialog className={styles.dialog} ref={dialog} onClose={onDismiss} aria-labelledby="save-title">
      <h2 className={styles.title} id="save-title">
        {known ? 'Сохранить изменения?' : 'Сохранить сезон'}
      </h2>

      <p className={styles.text}>
        {variant === 'new' &&
          'Сезон появится в «Моих сезонах» под этим именем. Название потом можно поменять — при следующем сохранении.'}
        {variant === 'update' &&
          `Этот сезон уже лежит у вас как «${savedTitle}» — сохранение обновит его, второй строки не появится.`}
        {variant === 'choice' &&
          `Этот сезон уже лежит у вас как «${savedTitle}». Можно переписать его новой версией или оставить прежний и сохранить рядом ещё один — имена сезонов могут повторяться.`}
      </p>

      <label className={styles.label} htmlFor="season-title">
        Название
      </label>
      <input
        className={styles.input}
        id="season-title"
        ref={input}
        type="text"
        defaultValue={initialTitle}
        maxLength={TITLE_LIMIT}
        autoComplete="off"
      />

      <div className={styles.actions}>
        <button type="button" className={styles.ghost} onClick={onDismiss} disabled={busy}>
          Отмена
        </button>
        {variant === 'choice' && (
          <button
            type="button"
            className={styles.ghost}
            onClick={() => submit(false)}
            disabled={busy}
          >
            Сохранить как новый
          </button>
        )}
        <button
          type="button"
          className={styles.primary}
          onClick={() => submit(known)}
          disabled={busy}
        >
          {busy ? 'Сохраняем…' : variant === 'choice' ? 'Перезаписать' : 'Сохранить'}
        </button>
      </div>
    </dialog>
  )
}
