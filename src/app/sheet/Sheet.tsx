'use client'

import { useEffect, useState } from 'react'
import App from '../../App'
import { decodeTemplate, readEditFlag, readHashPayload, readNewFlag } from '../../model/codec'
import { createDemoTemplate, createEmptyTemplate } from '../../model/templates'
import type { Boot } from '../../state/DocProvider'

function demoBoot(): Boot {
  return { template: createDemoTemplate(), source: 'demo', mode: 'view' }
}

/**
 * Ссылки в адресе нет — пример показываем сразу, без ожидания. Компонент грузится
 * только в браузере (ssr: false), поэтому location доступен уже в первом рендере.
 *
 * `#new=1` — приход с лендинга по кнопке «Создать свой лист»: пустой бланк сразу
 * в правке. Записи в историю здесь нет и быть не должно — позади лежит лендинг,
 * а не пример, поэтому «К примеру» уведёт на /sheet, а не назад.
 */
function initialBoot(): Boot | null {
  if (readHashPayload()) return null
  if (readNewFlag()) return { template: createEmptyTemplate(), source: 'custom', mode: 'edit' }
  return demoBoot()
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
