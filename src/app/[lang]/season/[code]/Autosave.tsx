'use client'

import { useEffect, useRef, useState } from 'react'
import { Toast } from '../../../../components/site/Toast'
import { useDict } from '../../../../i18n/context'
import { saveSeason } from '../../../../server/actions'
import { useDoc } from '../../../../state/docContext'

/** Столько же, сколько ждала запись адреса, пока лист жил в ссылке. */
const SAVE_DELAY = 400

/**
 * Автосохранение своего сезона.
 *
 * Кнопки «Сохранить» больше нет и быть не должно: сезон — это строка в базе, а
 * не адрес, который человек уносит с собой. Отсюда и способ — не проп у
 * провайдера, а отдельный компонент внутри него: он читает тот же контекст и
 * видит любое изменение, кем бы оно ни было сделано, включая смену темы.
 *
 * Первый прогон ничего не пишет: то, что пришло с сервера, там уже лежит.
 * Снимок — сериализованное состояние; сравнивать бланки по ссылке нельзя,
 * каждое нажатие клавиши создаёт новый объект.
 */
export function Autosave({ code }: { code: string }) {
  const { pages } = useDict()
  const { template, palette, iconSet } = useDoc()
  const saved = useRef<string | null>(null)
  const latest = useRef({ template, palette, iconSet })
  const [failed, setFailed] = useState<number | null>(null)

  // Снимок «последнего, что было на экране» — для записи при уходе со страницы.
  // Обновляется эффектом, а не в рендере: ссылка на изменяемое значение во время
  // рендера — верный способ прочитать в другом месте вчерашнее состояние.
  useEffect(() => {
    latest.current = { template, palette, iconSet }
  })

  useEffect(() => {
    const snapshot = JSON.stringify([template, palette, iconSet])
    // Первый прогон: пришедшее с сервера уже сохранено.
    if (saved.current === null) {
      saved.current = snapshot
      return
    }
    if (saved.current === snapshot) return

    const timer = setTimeout(() => {
      saved.current = snapshot
      void saveSeason(code, { template, palette, iconSet }).then((status) => {
        // Не сохранилось — надо сказать, иначе правки пропадут молча. И снимок
        // сбрасываем: следующая же правка попробует записать всё заново.
        if (status === 'ok') return
        saved.current = null
        setFailed(Date.now())
      })
    }, SAVE_DELAY)

    return () => clearTimeout(timer)
  }, [template, palette, iconSet, code])

  /*
   * Уход со страницы. Переход внутри сайта — клиентский, поэтому запрос из
   * размонтирования успевает уйти и дойти. Отдельным эффектом с пустыми
   * зависимостями: в чистке основного эффекта это сработало бы на каждой букве
   * и убило бы дебаунс.
   */
  useEffect(() => {
    return () => {
      const snapshot = JSON.stringify([
        latest.current.template,
        latest.current.palette,
        latest.current.iconSet,
      ])
      if (saved.current === snapshot) return
      void saveSeason(code, latest.current)
    }
  }, [code])

  return failed ? <Toast key={failed} message={pages.autosaveFailed} /> : null
}
