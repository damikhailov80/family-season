'use client'

import Link from 'next/link'
import { useState } from 'react'
import { PrinterDoodle } from '../../components/doodles'
import { Toast } from '../../components/site/Toast'
import { sealDraft } from '../../model/draft'
import { LIBRARY_TEXT } from '../../model/library'
import { ROUTES, seasonHref } from '../../model/site'
import { storeSeason } from '../../server/actions'
import { useDoc } from '../../state/docContext'
import styles from '../../components/edit/Bar.module.css'

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
 * остаётся `.ghost`: о его важности говорит подсказка слева, а не заливка.
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
  const { template, palette, iconSet } = useDoc()
  const [busy, setBusy] = useState(false)
  const [notice, setNotice] = useState<{ text: string; at: number } | null>(null)

  const store = async () => {
    setBusy(true)
    const result = await storeSeason({ title, template, palette, iconSet })
    setBusy(false)
    if (result.status === 'ok' && result.code) {
      // Черновик уехал строкой — второй копии не держим. Запираем, а не просто
      // стираем: `DraftStore` рядом пишет дебаунсом и вернул бы вычищенное.
      sealDraft()
      location.assign(seasonHref(result.code, 'edit'))
      return
    }
    // `anonymous` сюда может прийти только с протухшей кукой, и лечится он тем же,
    // чем `stale`: войти заново.
    setNotice({
      text: result.status === 'anonymous' ? LIBRARY_TEXT.stale : LIBRARY_TEXT[result.status],
      at: Date.now(),
    })
  }

  return (
    <>
      <div className={styles.bar} role="toolbar" aria-label="Действия с черновиком">
        <span className={styles.hint}>
          {signedIn
            ? 'Черновик живёт только в этом браузере — сохраните его в свои сезоны, чтобы не потерять'
            : 'Черновик живёт только в этом браузере — войдите, и он сам уедет в вашу коллекцию'}
        </span>
        <span className={styles.actions}>
          <Link
            className={styles.primary}
            href={editing ? ROUTES.sheet : ROUTES.sheetEdit}
          >
            {editing ? 'Готово' : 'Править'}
          </Link>
          {signedIn && (
            <button
              type="button"
              className={styles.ghost}
              disabled={busy}
              onClick={() => void store()}
            >
              {busy ? 'Сохраняем…' : 'Сохранить в мои сезоны'}
            </button>
          )}
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

      {/* Тост — вне бара: у `.bar` есть `backdrop-filter`, а он делает элемент
          содержащим блоком для `position: fixed`. */}
      {notice && <Toast key={notice.at} message={notice.text} />}
    </>
  )
}
