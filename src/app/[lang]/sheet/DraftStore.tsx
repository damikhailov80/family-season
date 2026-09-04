'use client'

import { useEffect } from 'react'
import type { Lang } from '../../../model/lang'
import { writeDraft } from '../../../model/draft'
import { useDoc } from '../../../state/docContext'

const SAVE_DELAY = 400

export function DraftStore({ title, lang }: { title: string; lang: Lang }) {
  const { template, palette, iconSet } = useDoc()

  useEffect(() => {
    const timer = setTimeout(
      () => writeDraft({ title, template, palette, iconSet, lang }),
      SAVE_DELAY,
    )
    return () => clearTimeout(timer)
  }, [title, template, palette, iconSet, lang])

  return null
}
