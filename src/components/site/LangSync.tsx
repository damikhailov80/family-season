'use client'

import { useEffect } from 'react'
import { rememberLanguage } from '../../server/actions'
import type { Lang } from '../../model/lang'

/**
 * «Создание пользователя» у нас — первая строка `user_settings`, и заводится она
 * здесь: вошедший впервые открыл сайт, а языка в настройках ещё нет.
 *
 * Клиентский компонент по той же причине, что и `DraftClaimer`: серверный
 * компонент писать в базу при рендере не имеет права, а действие — имеет.
 */
let written = false

export function LangSync({ lang, saved }: { lang: Lang; saved: Lang | null }) {
  useEffect(() => {
    // Флажок нужен из-за двойного вызова эффектов в dev.
    if (saved !== null || written) return
    written = true
    void rememberLanguage(lang)
  }, [lang, saved])

  return null
}
