'use client'

import { useState } from 'react'
import { Dialog } from '../../components/dialog/Dialog'
import dialogStyles from '../../components/dialog/Dialog.module.css'
import { dropEntry } from '../../server/actions'
import styles from './page.module.css'

/**
 * Удаление строки из библиотеки — с подтверждением.
 *
 * Клиентский компонент по той же причине, что и `FamilyEditor`: без JS
 * подтверждение стоило бы отдельного экрана и лишнего перехода. Сам список при
 * этом остаётся серверным — клиентская здесь одна кнопка.
 *
 * Спрашиваем не для порядка: другой копии сезона у сайта нет, и если ссылка на
 * него больше нигде не осталась, постер пропадает совсем.
 */
export function DeleteEntry({
  code,
  title,
  back,
}: {
  code: string
  title: string
  back: string
}) {
  const [open, setOpen] = useState(false)

  return (
    <>
      <button
        type="button"
        className={styles.rowButton}
        onClick={() => setOpen(true)}
        aria-label={`Удалить «${title}»`}
      >
        ×
      </button>

      {open && (
        <Dialog
          title="Подтверждение удаления"
          onDismiss={() => setOpen(false)}
          actions={
            <>
              <button
                type="button"
                className={dialogStyles.ghost}
                onClick={() => setOpen(false)}
              >
                Отмена
              </button>
              {/* Действие серверное: аргументы привязаны, но проверяются заново —
                  привязка уезжает в браузер и возвращается оттуда. */}
              <form action={dropEntry.bind(null, code, back)}>
                <button type="submit" className={dialogStyles.primary}>
                  Удалить
                </button>
              </form>
            </>
          }
        >
          <p className={dialogStyles.text}>Вы уверены, что хотите удалить сезон «{title}»?</p>
        </Dialog>
      )}
    </>
  )
}
