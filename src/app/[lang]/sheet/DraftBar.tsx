'use client'

import Link from 'next/link'
import { useState } from 'react'
import { PrinterDoodle } from '../../../components/doodles'
import { Toast } from '../../../components/site/Toast'
import { useDict, useLang } from '../../../i18n/context'
import { sealDraft } from '../../../model/draft'
import { libraryText } from '../../../model/library'
import { seasonHref, sheetHref } from '../../../model/site'
import { storeSeason } from '../../../server/actions'
import { useDoc } from '../../../state/docContext'
import styles from '../../../components/edit/Bar.module.css'

/**
 * Панель черновика.
 *
 * Вход известен заранее, пропом со страницы, и от него зависит **единственное**
 * действие, которое здесь вообще есть кроме печати: «Сохранить в мои сезоны».
 * Невошедшему её показывать нельзя — коллекции у него нет, — но и своей кнопки
 * входа у панели больше не бывает: вход любой кнопкой, хоть из шапки, сам
 * увозит черновик в коллекцию (`components/site/ClaimDraft.tsx`). Дублировать
 * его здесь значило бы держать второй разговор о том же.
 *
 * Имени панель не спрашивает вовсе: черновик назвали, когда заводили, и второй
 * раз спрашивать то же самое незачем. Заодно ушло второе «Готово» — слово стояло
 * и на кнопке окна, и в шаге от неё на кнопке выхода из правки, и означало
 * разное. В панели оно теперь одно.
 *
 * «Править» и «Готово» — обычные ссылки на соседний путь: черновик лежит в
 * браузере, и переход его не теряет. Ни истории руками, ни хэша здесь больше нет.
 *
 * Залитая кнопка в ряду одна, и она **не переезжает** при смене режима: заливку
 * носит переключатель «Править»/«Готово». Раньше её отдавали «тому, что человек
 * скорее всего сделает дальше», и она прыгала с кнопки на кнопку на каждом
 * переключении — ряд мигал, а глазу не за что было держаться. Сохранение
 * остаётся `.ghost`: заливка в ряду одна, и она у переключателя режима.
 */
export function DraftBar({
  editing,
  title,
  signedIn,
}: {
  editing: boolean
  title: string
  signedIn: boolean
}) {
  const { template, palette, iconSet, lang } = useDoc()
  const uiLang = useLang()
  const { bars } = useDict()
  const [busy, setBusy] = useState(false)
  const [notice, setNotice] = useState<{ text: string; at: number } | null>(null)

  const store = async () => {
    setBusy(true)
    const result = await storeSeason({ title, template, palette, iconSet, lang })
    setBusy(false)
    if (result.status === 'ok' && result.code) {
      // Черновик уехал строкой — второй копии не держим. Запираем, а не просто
      // стираем: `DraftStore` рядом пишет дебаунсом и вернул бы вычищенное.
      sealDraft()
      location.assign(seasonHref(uiLang, result.code, 'edit'))
      return
    }
    // `anonymous` сюда может прийти только с протухшей кукой, и лечится он тем же,
    // чем `stale`: войти заново.
    setNotice({
      text: libraryText(
        uiLang,
        // `anonymous` лечится тем же, чем `stale`; `ok` без кода невозможен,
        // но проверка стоит рядом, а не в вере.
        result.status === 'ok' || result.status === 'anonymous' ? 'stale' : result.status,
      ),
      at: Date.now(),
    })
  }

  return (
    <>
      <div className={styles.bar} role="toolbar" aria-label={bars.toolbarDraftAria}>
        {/* Одна фраза, одна на обе роли: где лежит черновик — всё, что тут
            стоит сказать. Что вход увезёт его в коллекцию, человек увидит
            делом, а не прочитает в панели. */}
        <span className={styles.hint}>{bars.placeDraft}</span>
        <span className={styles.actions}>
          <Link className={styles.primary} href={sheetHref(uiLang, editing ? 'view' : 'edit')}>
            {editing ? bars.ready : bars.edit}
          </Link>
          {signedIn && (
            <button
              type="button"
              className={styles.ghost}
              disabled={busy}
              onClick={() => void store()}
            >
              {busy ? bars.saving : bars.save}
            </button>
          )}
          <button
            type="button"
            className={styles.icon}
            onClick={() => print()}
            title={bars.printTitle}
            aria-label={bars.printTitle}
          >
            <PrinterDoodle size={19} strokeWidth={3.4} />
          </button>
        </span>
      </div>

      {/* Тост — вне бара: у `.bar` есть `backdrop-filter`, а он делает элемент
          содержащим блоком для `position: fixed`. */}
      {notice && <Toast key={notice.at} message={notice.text} />}
    </>
  )
}
