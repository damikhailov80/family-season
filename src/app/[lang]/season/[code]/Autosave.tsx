'use client'

import { useEffect, useRef, useState } from 'react'
import { Toast } from '../../../../components/site/Toast'
import { useDict } from '../../../../i18n/context'
import { saveSeason } from '../../../../server/actions'
import { useDoc } from '../../../../state/docContext'

/** Столько же, сколько ждала запись адреса, пока лист жил в ссылке. */
const SAVE_DELAY = 400

/**
 * Отдельный компонент внутри провайдера, а не проп у него: так он читает тот же
 * контекст и видит любое изменение, включая смену темы.
 *
 * Первый прогон ничего не пишет: пришедшее с сервера там уже лежит. Снимок —
 * сериализованное состояние: сравнивать бланки по ссылке нельзя, каждое нажатие
 * клавиши создаёт новый объект.
 */
export function Autosave({ code }: { code: string }) {
  const { pages } = useDict()
  const { template, palette, iconSet } = useDoc()
  const saved = useRef<string | null>(null)
  const latest = useRef({ template, palette, iconSet })
  const [failed, setFailed] = useState<number | null>(null)

  // Снимок для записи при уходе со страницы. Обновляется эффектом, а не в
  // рендере: изменяемое значение в рендере читается потом вчерашним.
  useEffect(() => {
    latest.current = { template, palette, iconSet }
  })

  useEffect(() => {
    const snapshot = JSON.stringify([template, palette, iconSet])
    if (saved.current === null) {
      saved.current = snapshot
      return
    }
    if (saved.current === snapshot) return

    const timer = setTimeout(() => {
      saved.current = snapshot
      void saveSeason(code, { template, palette, iconSet }).then((status) => {
        // Снимок сбрасываем: следующая же правка попробует записать всё заново.
        if (status === 'ok') return
        saved.current = null
        setFailed(Date.now())
      })
    }, SAVE_DELAY)

    return () => clearTimeout(timer)
  }, [template, palette, iconSet, code])

  /*
   * Уход со страницы: переход внутри сайта клиентский, и запрос из размонтирования
   * успевает уйти. Отдельным эффектом с пустыми зависимостями — в чистке основного
   * это срабатывало бы на каждой букве и убило бы дебаунс.
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
