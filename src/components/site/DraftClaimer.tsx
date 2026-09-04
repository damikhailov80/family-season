'use client'

import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { useDict, useLang } from '../../i18n/context'
import { fill } from '../../i18n/fill'
import { readDraft, sealDraft } from '../../model/draft'
import { libraryText } from '../../model/library'
import { modeFromPath, ROUTES, seasonHref, stripLang } from '../../model/site'
import { storeSeason } from '../../server/actions'
import { Toast } from './Toast'

/**
 * Черновик уезжает в коллекцию сам, как только человек вошёл: у вошедшего
 * черновика не бывает, поэтому запись в браузере означает ровно одно — её
 * собрали до входа, и согласия спрашивать не о чем.
 *
 * Флажок `taken` нужен из-за двойного вызова эффектов в dev: две попытки подряд
 * завели бы две строки. Неудача черновик не трогает — стирать нечего.
 */
let taken = false

export function DraftClaimer() {
  const router = useRouter()
  const lang = useLang()
  const { site } = useDict()
  const [notice, setNotice] = useState<{ text: string; at: number } | null>(null)

  useEffect(() => {
    if (taken) return
    const draft = readDraft()
    if (!draft) return
    taken = true

    void (async () => {
      const result = await storeSeason({
        title: draft.title,
        template: draft.template,
        palette: draft.palette,
        iconSet: draft.iconSet,
        lang: draft.lang,
      })

      if (result.status !== 'ok' || !result.code) {
        taken = false
        // `anonymous` приходит с протухшей кукой: предлагать вход тому, кто
        // только что вошёл, вздор — молчим.
        if (result.status !== 'ok' && result.status !== 'anonymous') {
          setNotice({ text: libraryText(lang, result.status), at: Date.now() })
        }
        return
      }

      // Запираем, а не просто стираем: отложенная запись `DraftStore` вернула бы
      // вычищенное обратно.
      sealDraft()

      /*
       * С самого черновика уходим в новую строку: иначе человек остался бы на
       * постере, за которым больше нет хранилища. Режим сохраняем.
       */
      if (stripLang(location.pathname).startsWith(ROUTES.sheet)) {
        location.assign(seasonHref(lang, result.code, modeFromPath(location.pathname)))
        return
      }

      setNotice({
        text: fill(site.draftClaimed, { title: draft.title }),
        at: Date.now(),
      })
      // Списку «Моих сезонов» надо показать новую строку.
      router.refresh()
    })()
  }, [router, lang, site])

  return notice ? <Toast key={notice.at} message={notice.text} /> : null
}
