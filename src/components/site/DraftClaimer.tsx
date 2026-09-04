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
        if (result.status !== 'ok' && result.status !== 'anonymous') {
          setNotice({ text: libraryText(lang, result.status), at: Date.now() })
        }
        return
      }

      sealDraft()

      if (stripLang(location.pathname).startsWith(ROUTES.sheet)) {
        location.assign(seasonHref(lang, result.code, modeFromPath(location.pathname)))
        return
      }

      setNotice({
        text: fill(site.draftClaimed, { title: draft.title }),
        at: Date.now(),
      })
      router.refresh()
    })()
  }, [router, lang, site])

  return notice ? <Toast key={notice.at} message={notice.text} /> : null
}
