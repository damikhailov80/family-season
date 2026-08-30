'use client'

import { useRef, useState, useTransition } from 'react'
import { Dialog } from '../../components/dialog/Dialog'
import dialogStyles from '../../components/dialog/Dialog.module.css'
import { PenDoodle } from '../../components/doodles'
import { TITLE_LIMIT } from '../../model/library'
import { renameEntry } from '../../server/actions'
import styles from './page.module.css'

/**
 * Переименование строки списка.
 *
 * Клиентский по той же причине, что и `DeleteEntry`: без JS правка имени стоила
 * бы отдельного экрана. Поле неконтролируемое — значение читается с узла при
 * отправке, как в окне на самом постере.
 *
 * Ловушка, которая уже стоила отладки: действие заканчивается редиректом, но
 * **компонент от этого не монтируется заново** — Next перерисовывает маршрут на
 * месте. Свой флажок «сохраняем» так и остался бы поднятым, и кнопка строки
 * залипла бы навсегда. Поэтому ожидание держит `useTransition`: он гаснет сам,
 * когда перерисовка дошла.
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
  const input = useRef<HTMLInputElement>(null)
  const [open, setOpen] = useState(false)
  const [busy, start] = useTransition()

  const save = () => {
    const next = input.current?.value ?? title
    // Окно закрываем сразу: подтверждением служит сам список, он перерисуется
    // новым именем. Заодно это отсекает второе нажатие.
    setOpen(false)
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
        onClick={() => setOpen(true)}
        title={`Переименовать «${title}»`}
        aria-label={`Переименовать «${title}»`}
      >
        <PenDoodle size={16} strokeWidth={3.6} />
      </button>

      {open && (
        <Dialog
          title="Новое название"
          onDismiss={() => setOpen(false)}
          actions={
            <>
              <button
                type="button"
                className={dialogStyles.ghost}
                disabled={busy}
                onClick={() => setOpen(false)}
              >
                Отмена
              </button>
              <button
                type="button"
                className={dialogStyles.primary}
                disabled={busy}
                onClick={save}
              >
                Сохранить
              </button>
            </>
          }
        >
          <p className={dialogStyles.text}>Введите новое имя для сезона.</p>
          <label className={dialogStyles.label} htmlFor={`title-${code}`}>
            Название
          </label>
          {/* Окно рисуется, только пока открыто, поэтому поле каждый раз новое —
              `defaultValue` подставляется честно, класть значение в узел руками
              не надо. */}
          <input
            className={dialogStyles.input}
            id={`title-${code}`}
            ref={input}
            type="text"
            defaultValue={title}
            maxLength={TITLE_LIMIT}
            autoComplete="off"
          />
        </Dialog>
      )}
    </>
  )
}
