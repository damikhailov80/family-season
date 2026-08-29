'use client'

import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { Toast } from '../../components/site/Toast'
import { clearDraft, readDraft } from '../../model/draft'
import { LIBRARY_TEXT } from '../../model/library'
import { ROUTES } from '../../model/site'
import { storeSeason } from '../../server/actions'

/**
 * Черновик, за которым человек и пошёл входить.
 *
 * Из окна «черновик будет затёрт» вход уводит не назад, на ту же страницу, а
 * сюда, с пометкой `?claim=1`: точка разбора должна быть одна, и человек сразу
 * видит, что набранное не пропало — оно лежит в списке.
 *
 * Черновик забирается **только по пометке**, а не при каждом заходе вошедшего:
 * заход в кабинет — не согласие отдать в коллекцию то, что лежало в браузере.
 *
 * Неудача черновик не трогает: строки не появилось, и стирать нечего — человек
 * попробует ещё раз с самого постера.
 */
export function ClaimDraft() {
  const router = useRouter()
  const [notice, setNotice] = useState<{ text: string; at: number } | null>(null)

  useEffect(() => {
    const url = new URL(location.href)
    if (!url.searchParams.has('claim')) return

    /*
     * Пометку снимаем сразу, до всякой работы, и делает это ровно `replaceState`:
     * перезагрузка посреди запроса иначе повторила бы попытку, а в dev React
     * зовёт эффект дважды — второй заход просто не найдёт пометки.
     * `history.state` передаём целиком: `null` затёр бы служебные поля Next.
     */
    url.searchParams.delete('claim')
    history.replaceState(history.state, '', `${url.pathname}${url.search}${url.hash}`)

    const draft = readDraft()
    // Пусто — приватное окно или запрет на данные сайта. Говорить не о чем.
    if (!draft) return

    void (async () => {
      const result = await storeSeason({
        title: draft.title,
        template: draft.template,
        palette: draft.palette,
        iconSet: draft.iconSet,
      })
      if (result.status === 'ok') {
        // Уехал строкой — второй копии не держим.
        clearDraft()
        setNotice({ text: `Черновик «${draft.title}» сохранён в вашу коллекцию.`, at: Date.now() })
      } else if (result.status !== 'anonymous') {
        // `anonymous` сюда прийти может: кука входа не доехала. Слов у него нет —
        // человек и так на странице, которая объясняет вход.
        setNotice({ text: LIBRARY_TEXT[result.status], at: Date.now() })
      }

      /*
       * А вот роутеру про снятую пометку сказать обязан именно `replace`.
       * `replaceState` с `history.state` уходит на короткий путь патча Next и
       * роутера не трогает — тот по-прежнему считает адресом `?claim=1` и вернул
       * бы пометку в строку при первой же перерисовке. Заодно `replace`
       * перерисовывает серверный список, которому надо показать новую строку.
       */
      router.replace(ROUTES.seasons)
      router.refresh()
    })()
  }, [router])

  return notice ? <Toast key={notice.at} message={notice.text} /> : null
}
