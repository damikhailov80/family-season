'use client'

import { useEffect } from 'react'
import type { Lang } from '../../../model/lang'
import { writeDraft } from '../../../model/draft'
import { useDoc } from '../../../state/docContext'

/** Столько же, сколько ждёт автосохранение своего сезона. */
const SAVE_DELAY = 400

/**
 * Компонент внутри провайдера, как `Autosave` у своего сезона, и по той же
 * причине: он читает тот же контекст и видит любое изменение, включая смену темы.
 *
 * Первый прогон тоже пишет: пустой бланк, который человек открыл, — уже черновик.
 * Имя и язык приходят пропами — контекст постера знает только про бланк.
 */
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
