'use client'

import { useEffect, useState } from 'react'
import App from '../../App'
import {
  decodeTemplate,
  readEditFlag,
  readFillId,
  readHashPayload,
  readIconSetId,
  readNewFlag,
  readPaletteId,
} from '../../model/codec'
import { DEFAULT_EXAMPLE_ID, exampleById, knownExampleId } from '../../model/examples'
import { modeFromPath } from '../../model/site'
import { DEFAULT_ICON_SET } from '../../model/icons'
import { DEFAULT_PALETTE } from '../../model/palettes'
import { createEmptyTemplate } from '../../model/templates'
import type { Boot } from '../../state/DocProvider'

function exampleBoot(id: string): Boot {
  const example = exampleById(id)!
  // Тема и рисунки примера — его собственные, но `p=` и `i=` в адресе сильнее.
  return {
    template: example.template(),
    fillId: id,
    palette: readPaletteId() ?? example.palette,
    iconSet: readIconSetId() ?? example.iconSet,
    mode: 'view',
  }
}

/**
 * Что показывать, решают путь и хэш — компонент грузится только в браузере
 * (ssr: false), поэтому `location` доступен уже в первом рендере.
 *
 *   /sheet                — пример; голый адрес равен `#data=demo-1`
 *   /sheet#data=<id>      — другой пример: шаблон свой, заполнение по id
 *   /sheet#d=…&data=<id>  — пример целиком из ссылки
 *   /sheet#d=…            — свой лист в просмотре
 *   /sheet/edit#d=…       — он же в правке
 *   /sheet/edit           — пустой бланк «с нуля»
 *
 * К любому из них можно дописать `&p=<тема>` и `&i=<набор рисунков>` — они
 * перебивают тему и рисунки примера. Пометки нет — значение по умолчанию.
 * Списки — `src/model/palettes.ts` и `src/model/icons.ts`.
 *
 * Пример не правится: `data=<id>` перебивает путь и оставляет просмотр. Приведением
 * адреса к этим правилам занимается DocProvider — здесь только чтение.
 */
function initialBoot(): Boot | null {
  if (readHashPayload()) return null // дальше асинхронное декодирование
  const fillId = knownExampleId(readFillId())
  if (fillId) return exampleBoot(fillId)
  // `new=1` — легаси-адрес кнопок «Собрать свой сезон», теперь это голый /sheet/edit.
  if (modeFromPath() === 'edit' || readNewFlag()) {
    return {
      template: createEmptyTemplate(),
      fillId: null,
      palette: readPaletteId() ?? DEFAULT_PALETTE,
      iconSet: readIconSetId() ?? DEFAULT_ICON_SET,
      mode: 'edit',
    }
  }
  return exampleBoot(DEFAULT_EXAMPLE_ID)
}

export default function Sheet() {
  const [boot, setBoot] = useState<Boot | null>(initialBoot)

  // Декодирование ссылки асинхронное. Пока оно идёт, лист не рисуем: показать
  // пример и через мгновение подменить его присланным листом — хуже, чем пауза.
  useEffect(() => {
    if (boot) return
    const payload = readHashPayload()
    let cancelled = false
    void (async () => {
      const template = payload ? await decodeTemplate(payload) : null
      if (cancelled) return
      if (!template) {
        setBoot(exampleBoot(DEFAULT_EXAMPLE_ID))
        return
      }
      const fillId = knownExampleId(readFillId())
      setBoot({
        template,
        fillId,
        palette: readPaletteId() ?? (fillId ? exampleById(fillId)!.palette : DEFAULT_PALETTE),
        iconSet: readIconSetId() ?? (fillId ? exampleById(fillId)!.iconSet : DEFAULT_ICON_SET),
        // `edit=1` — легаси-пометка ссылок форка; сегодня режим несёт путь.
        mode: fillId ? 'view' : readEditFlag() ? 'edit' : modeFromPath(),
      })
    })()
    return () => {
      cancelled = true
    }
  }, [boot])

  if (!boot) return null
  return <App boot={boot} />
}
