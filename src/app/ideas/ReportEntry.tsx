'use client'

import { useState } from 'react'
import { FlagDoodle } from '../../components/doodles'
import { LoginDialog } from '../../components/edit/LoginDialog'
import { ReportDialog } from '../../components/edit/ReportDialog'
import { Toast } from '../../components/site/Toast'
import { REACTION_TEXT } from '../../model/community'
import { reportSeason } from '../../server/actions'
import styles from './page.module.css'

/**
 * Жалоба прямо с витрины: чтобы убрать чужую брань, не надо открывать постер.
 *
 * Лайка здесь нет намеренно — лайкают, посмотрев сезон, а не пролистывая
 * карточки. Жалоба, наоборот, часто видна сразу: за тем она тут и стоит.
 *
 * Клиентский компонент по той же причине, что `DeleteEntry`: без JS окно с
 * комментарием стоило бы отдельного экрана. Сама витрина остаётся серверной —
 * клиентская здесь одна кнопка строки.
 *
 * Окна и слова те же, что у постера: `ReportDialog`, `LoginDialog` и
 * `REACTION_TEXT`. Вторых копий не заводим — разошлись бы при первой правке.
 *
 * Вход спрашивается **до** окна жалобы, а не после: окно просит написать текст,
 * и заставлять человека сочинять жалобу, чтобы в ответ услышать «сначала
 * войдите», нельзя. Ответ сервера `anonymous` при этом всё равно обрабатываем —
 * сессия могла кончиться, пока человек набирал текст.
 */
export function ReportEntry({
  code,
  title,
  signedIn,
}: {
  code: string
  title: string
  signedIn: boolean
}) {
  const [open, setOpen] = useState(false)
  const [loginOpen, setLoginOpen] = useState(false)
  const [busy, setBusy] = useState(false)
  const [sent, setSent] = useState(false)
  // Отметка времени — чтобы одинаковый отказ подряд перемонтировал тост.
  const [notice, setNotice] = useState<{ text: string; at: number } | null>(null)

  const send = async (comment: string) => {
    setBusy(true)
    const status = await reportSeason(code, comment)
    setBusy(false)
    setOpen(false)
    // «Войдите» — не отказ, а предложение: его показывает окно, а не тост.
    if (status === 'anonymous') {
      setLoginOpen(true)
      return
    }
    if (status !== 'ok') {
      setNotice({ text: REACTION_TEXT[status], at: Date.now() })
      return
    }
    setSent(true)
    setNotice({ text: 'Жалоба отправлена — спасибо, мы разберёмся', at: Date.now() })
  }

  return (
    <>
      <button
        type="button"
        className={styles.report}
        onClick={() => (signedIn ? setOpen(true) : setLoginOpen(true))}
        disabled={busy}
        aria-pressed={sent}
        title={`Пожаловаться на «${title}»`}
        aria-label={`Пожаловаться на «${title}»`}
      >
        <FlagDoodle size={16} filled={sent} strokeWidth={4} />
      </button>

      {open && (
        <ReportDialog
          busy={busy}
          sent={sent}
          onDismiss={() => setOpen(false)}
          onSubmit={(comment) => void send(comment)}
        />
      )}
      {/* Причина у флажка одна — жалоба, и других кнопок на витрине нет. */}
      {loginOpen && <LoginDialog reason="report" onClose={() => setLoginOpen(false)} />}
      {notice && <Toast key={notice.at} message={notice.text} />}
    </>
  )
}
