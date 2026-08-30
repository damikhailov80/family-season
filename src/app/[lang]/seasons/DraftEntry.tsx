'use client'

import { useMemo, useRef, useState, useSyncExternalStore } from 'react'
import { Dialog } from '../../components/dialog/Dialog'
import dialogStyles from '../../components/dialog/Dialog.module.css'
import { PenDoodle } from '../../components/doodles'
import { monthName } from '../../model/calendar'
import { clearDraft, draftSnapshot, parseDraft, subscribeDraft, writeDraft } from '../../model/draft'
import { EMPTY_LIST, savedOn, TITLE_LIMIT } from '../../model/library'
import { PALETTE_LABELS } from '../../model/palettes'
import { ROUTES } from '../../model/site'
import styles from './page.module.css'

/**
 * Черновик невошедшего строкой того же списка, что и сезоны из базы.
 *
 * Клиентский по единственной причине: черновик лежит в `localStorage`, а страница
 * серверная — взять его серверу негде. Хранилище внешнее, поэтому читаем его
 * `useSyncExternalStore`, а не эффектом: заодно строка сама обновляется после
 * переименования и не врёт, если черновик сменили в соседней вкладке.
 *
 * Серверный снимок — `undefined`, и это не то же самое, что «черновика нет»:
 * пока браузер не ответил, мы не знаем ничего и не рисуем ни строки, ни фразы
 * «черновика нет» — иначе она мигала бы неправдой на кадр.
 *
 * Строка одна и второй не бывает — это и есть правило «у каждого постера ровно
 * одно хранилище». Список из одной строки заведён не ради симметрии: пока
 * черновик нигде не показывался, человеку неоткуда было узнать, что он у него
 * один и что новый сезон его затрёт.
 *
 * Ни переименование, ни удаление сюда сервера не зовут: писать и стирать
 * `localStorage` умеет только браузер. Поэтому и `back` тут не нужен —
 * возвращаться неоткуда, список перерисовывает своё же состояние.
 */
export function DraftEntry() {
  const raw = useSyncExternalStore(subscribeDraft, draftSnapshot, () => undefined)
  const draft = useMemo(() => (raw === undefined ? null : parseDraft(raw)), [raw])
  const input = useRef<HTMLInputElement>(null)
  const [renaming, setRenaming] = useState(false)
  const [dropping, setDropping] = useState(false)

  if (raw === undefined) return null

  if (!draft) {
    // Фраза общая со списком вошедшего: пустая коллекция и отсутствие черновика —
    // для человека одно и то же, «сезонов пока нет».
    return <p className={styles.hand}>{EMPTY_LIST}</p>
  }

  const rename = () => {
    const title = input.current?.value ?? draft.title
    setRenaming(false)
    // Перерисовки не просим: запись сама будит подписку на хранилище.
    writeDraft({ ...draft, title })
  }

  const drop = () => {
    setDropping(false)
    clearDraft()
  }

  return (
    <>
      <ul className={styles.entries}>
        <li className={styles.entry}>
          <span
            className={styles.ink}
            data-palette={draft.palette}
            title={PALETTE_LABELS[draft.palette]}
            aria-hidden="true"
          />
          <span className={styles.entryText}>
            <a className={styles.entryTitle} href={ROUTES.sheet}>
              {draft.title}
            </a>
            <span className={styles.entryMeta}>
              сохранён {savedOn(new Date(draft.savedAt))} ·{' '}
              {monthName(draft.template.theme).toLowerCase()} {draft.template.theme.year}
            </span>
          </span>
          <span className={styles.rowTools}>
            <button
              type="button"
              className={styles.rowButton}
              onClick={() => setRenaming(true)}
              title={`Переименовать «${draft.title}»`}
              aria-label={`Переименовать «${draft.title}»`}
            >
              <PenDoodle size={16} strokeWidth={3.6} />
            </button>
            <button
              type="button"
              className={styles.rowButton}
              onClick={() => setDropping(true)}
              aria-label={`Удалить «${draft.title}»`}
            >
              ×
            </button>
          </span>
        </li>
      </ul>

      {renaming && (
        <Dialog
          title="Новое название"
          onDismiss={() => setRenaming(false)}
          actions={
            <>
              <button
                type="button"
                className={dialogStyles.ghost}
                onClick={() => setRenaming(false)}
              >
                Отмена
              </button>
              <button type="button" className={dialogStyles.primary} onClick={rename}>
                Сохранить
              </button>
            </>
          }
        >
          <p className={dialogStyles.text}>Введите новое имя для сезона.</p>
          <label className={dialogStyles.label} htmlFor="draft-title">
            Название
          </label>
          {/* Поле каждый раз новое — окно рисуется, только пока открыто, — и
              `defaultValue` подставляется честно даже после переименования. */}
          <input
            className={dialogStyles.input}
            id="draft-title"
            ref={input}
            type="text"
            defaultValue={draft.title}
            maxLength={TITLE_LIMIT}
            autoComplete="off"
          />
        </Dialog>
      )}

      {/* Спрашиваем по той же причине, что и у строки из базы: другой копии
          черновика нет ни у нас, ни у человека. */}
      {dropping && (
        <Dialog
          title="Подтверждение удаления"
          onDismiss={() => setDropping(false)}
          actions={
            <>
              <button
                type="button"
                className={dialogStyles.ghost}
                onClick={() => setDropping(false)}
              >
                Отмена
              </button>
              <button type="button" className={dialogStyles.primary} onClick={drop}>
                Удалить
              </button>
            </>
          }
        >
          <p className={dialogStyles.text}>
            Вы уверены, что хотите удалить черновик «{draft.title}»?
          </p>
        </Dialog>
      )}
    </>
  )
}
