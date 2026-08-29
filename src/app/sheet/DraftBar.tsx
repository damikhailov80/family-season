'use client'

import Link from 'next/link'
import { useState } from 'react'
import { PrinterDoodle } from '../../components/doodles'
import { LoginDialog } from '../../components/edit/LoginDialog'
import { NewSeasonDialog } from '../../components/edit/NewSeasonDialog'
import { Toast } from '../../components/site/Toast'
import { clearDraft } from '../../model/draft'
import { defaultSeasonTitle, LIBRARY_TEXT } from '../../model/library'
import { ROUTES, seasonHref } from '../../model/site'
import { storeSeason } from '../../server/actions'
import { useDoc } from '../../state/docContext'
import styles from '../../components/edit/Bar.module.css'

/**
 * Панель черновика.
 *
 * Про вход панель ничего не знает и не спрашивает: «Сохранить» уходит на сервер,
 * и если тот отвечает `anonymous`, открывается окно входа. Тот же приём, что был
 * у звёздочки, и по той же причине — постер не должен ждать ответа сервера, чтобы
 * нарисовать кнопку.
 *
 * «Править» и «Готово» — обычные ссылки на соседний путь: черновик лежит в
 * браузере, и переход его не теряет. Ни истории руками, ни хэша здесь больше нет.
 */
export function DraftBar({ editing }: { editing: boolean }) {
  const { template, palette, iconSet } = useDoc()
  const [nameOpen, setNameOpen] = useState(false)
  const [loginOpen, setLoginOpen] = useState(false)
  const [busy, setBusy] = useState(false)
  const [notice, setNotice] = useState<{ text: string; at: number } | null>(null)

  const store = async (title: string) => {
    setBusy(true)
    const result = await storeSeason({ title, template, palette, iconSet })
    setBusy(false)
    setNameOpen(false)

    if (result.status === 'anonymous') {
      setLoginOpen(true)
      return
    }
    if (result.status !== 'ok' || !result.code) {
      setNotice({ text: LIBRARY_TEXT[result.status], at: Date.now() })
      return
    }
    // Черновик уехал строкой — второй копии не держим.
    clearDraft()
    location.assign(seasonHref(result.code, 'edit'))
  }

  return (
    <>
      <div className={styles.bar} role="toolbar" aria-label="Действия с черновиком">
        <span className={styles.hint}>
          Черновик живёт только в этом браузере — сохраните его в свои сезоны, чтобы не потерять
        </span>
        <span className={styles.actions}>
          <Link
            className={editing ? styles.ghost : styles.primary}
            href={editing ? ROUTES.sheet : ROUTES.sheetEdit}
          >
            {editing ? 'Готово' : 'Править'}
          </Link>
          <button
            type="button"
            className={editing ? styles.primary : styles.ghost}
            disabled={busy}
            onClick={() => setNameOpen(true)}
          >
            Сохранить в мои сезоны
          </button>
          <button
            type="button"
            className={styles.icon}
            onClick={() => print()}
            title="Печать / PDF"
            aria-label="Печать / PDF"
          >
            <PrinterDoodle size={19} strokeWidth={3.4} />
          </button>
        </span>
      </div>

      {/* Окна и тост — вне бара: у `.bar` есть `backdrop-filter`, а он делает
          элемент содержащим блоком для `position: fixed`. */}
      {nameOpen && (
        <NewSeasonDialog
          heading="Сохранить сезон"
          text="Сезон появится в «Моих сезонах» под этим именем и дальше будет сохраняться сам. Название видно только вам и на постере нигде не печатается — переименовать его можно в кабинете."
          initialTitle={defaultSeasonTitle(template)}
          busy={busy}
          onDismiss={() => setNameOpen(false)}
          onSubmit={(title) => void store(title)}
        />
      )}
      <LoginDialog open={loginOpen} onClose={() => setLoginOpen(false)} />
      {notice && <Toast key={notice.at} message={notice.text} />}
    </>
  )
}
