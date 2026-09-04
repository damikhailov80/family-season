'use client'

import { useEffect } from 'react'
import { rememberLanguage } from '../../server/actions'
import type { Lang } from '../../model/lang'

let written = false

export function LangSync({ lang, saved }: { lang: Lang; saved: Lang | null }) {
  useEffect(() => {
    if (saved !== null || written) return
    written = true
    void rememberLanguage(lang)
  }, [lang, saved])

  return null
}
