'use client'

import { useRef, useTransition } from 'react'
import { PenDoodle } from '../../components/doodles'
import { TITLE_LIMIT } from '../../model/library'
import { renameEntry } from '../../server/actions'
import styles from './page.module.css'

/**
 * Переименование строки списка.
 *
 * Клиентский по той же причине, что и `DeleteEntry`: без JS правка имени стоила
 * бы отдельного экрана. Поле неконтролируемое — значение читается с узла при
 * отправке, как в окне сохранения на постере.
 *
 * Два места, где легко ошибиться, и оба уже стоили отладки:
 *
 * 1. Действие заканчивается редиректом, но **компонент от этого не монтируется
 *    заново** — Next перерисовывает маршрут на месте. Свой флажок «сохраняем»
 *    так и остался бы поднятым, и кнопка строки залипла бы навсегда. Поэтому
 *    ожидание держит `useTransition`: он гаснет сам, когда перерисовка дошла.
 * 2. По той же причине `defaultValue` в поле не обновится после переименования —
 *    узел уже есть, React его не трогает. Значение кладём при открытии окна.
 */
export function RenameEntry({
  code,
  title,
  back,
}: {
  code: string
  title: string
  back: string
}) {
  const dialog = useRef<HTMLDialogElement>(null)
  const input = useRef<HTMLInputElement>(null)
  const [busy, start] = useTransition()

  const open = () => {
    if (input.current) input.current.value = title
    dialog.current?.showModal()
  }

  const save = () => {
    const next = input.current?.value ?? title
    // Окно закрываем сразу: подтверждением служит сам список, он перерисуется
    // новым именем. Заодно это отсекает второе нажатие.
    dialog.current?.close()
    /*
     * Название уезжает **аргументом, а не полем формы**: форму, отправленную из
     * клиентского компонента, React кодирует под своими именами (`_1_title`), и
     * разбор `formData.get('title')` на сервере молча вернул бы пустоту — запрос
     * ушёл бы, а в базе ничего не изменилось (см. «Настройки и база» в CLAUDE.md).
     */
    start(() => renameEntry(code, back, next))
  }

  return (
    <>
      <button
        type="button"
        className={styles.rowButton}
        onClick={open}
        title={`Переименовать «${title}»`}
        aria-label={`Переименовать «${title}»`}
      >
        <PenDoodle size={16} strokeWidth={3.6} />
      </button>

      <dialog className={styles.dialog} ref={dialog} aria-labelledby={`rename-${code}`}>
        <h2 className={styles.dialogTitle} id={`rename-${code}`}>
          Новое название
        </h2>
        <p className={styles.dialogText}>Введите новое имя для сезона.</p>
        <label className={styles.dialogLabel} htmlFor={`title-${code}`}>
          Название
        </label>
        <input
          className={styles.nameInput}
          id={`title-${code}`}
          ref={input}
          type="text"
          defaultValue={title}
          maxLength={TITLE_LIMIT}
          autoComplete="off"
        />
        <div className={styles.dialogActions}>
          <button
            type="button"
            className={styles.ghost}
            disabled={busy}
            onClick={() => dialog.current?.close()}
          >
            Отмена
          </button>
          <button type="button" className={styles.primaryAction} disabled={busy} onClick={save}>
            Сохранить
          </button>
        </div>
      </dialog>
    </>
  )
}
