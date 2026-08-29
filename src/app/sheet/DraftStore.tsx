'use client'

import { useEffect } from 'react'
import { writeDraft } from '../../model/draft'
import { useDoc } from '../../state/docContext'

/** Столько же, сколько ждёт автосохранение своего сезона. */
const SAVE_DELAY = 400

/**
 * Черновик пишется в браузер — так же, как свой сезон пишется в базу
 * (`season/[code]/Autosave.tsx`), и по тем же причинам: отдельным компонентом
 * внутри провайдера, потому что он читает тот же контекст и видит любое
 * изменение, включая смену темы.
 *
 * Первый прогон тоже пишет, и это правильно: пустой бланк, который человек
 * открыл, — уже черновик, и после перезагрузки он должен остаться тем же.
 */
export function DraftStore() {
  const { template, palette, iconSet } = useDoc()

  useEffect(() => {
    const timer = setTimeout(() => writeDraft({ template, palette, iconSet }), SAVE_DELAY)
    return () => clearTimeout(timer)
  }, [template, palette, iconSet])

  return null
}
