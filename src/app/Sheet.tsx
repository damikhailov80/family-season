'use client'

import { useEffect, useState } from 'react'
import App from '../App'
import { decodeTemplate, readEditFlag, readHashPayload } from '../model/codec'
import { createDemoTemplate } from '../model/templates'
import type { Boot } from '../state/DocProvider'

function demoBoot(): Boot {
  return { template: createDemoTemplate(), source: 'demo', mode: 'view' }
}

/**
 * Ссылки в адресе нет — пример показываем сразу, без ожидания. Компонент грузится
 * только в браузере (ssr: false), поэтому location доступен уже в первом рендере.
 */
function initialBoot(): Boot | null {
  return readHashPayload() ? null : demoBoot()
}

export default function Sheet() {
  const [boot, setBoot] = useState<Boot | null>(initialBoot)

  // Декодирование ссылки асинхронное. Пока оно идёт, лист не рисуем: показать
  // демо и через мгновение подменить его присланным листом — хуже, чем пауза.
  useEffect(() => {
    if (boot) return
    const payload = readHashPayload()
    let cancelled = false
    void (async () => {
      const template = payload ? await decodeTemplate(payload) : null
      if (cancelled) return
      // Своя ссылка из кнопки форка помечена `edit=1` — открываем сразу в правке.
      setBoot(
        template ? { template, source: 'custom', mode: readEditFlag() ? 'edit' : 'view' } : demoBoot(),
      )
    })()
    return () => {
      cancelled = true
    }
  }, [boot])

  if (!boot) return null
  return <App boot={boot} />
}
