'use client'

import { useEffect } from 'react'
import { rememberLanguage } from '../../server/actions'
import type { Lang } from '../../model/lang'

/**
 * Язык, определённый по браузеру, доезжает до настроек аккаунта.
 *
 * «Создание пользователя» у нас — первая строка `user_settings`: таблицы людей
 * нет, есть ключ из сессии. Поэтому запись заводится в тот момент, когда
 * вошедший впервые открыл сайт, а языка в его настройках ещё нет.
 *
 * Клиентский компонент по той же причине, что и `DraftClaimer`: серверный
 * компонент писать в базу при рендере не имеет права — на GET-запрос страница
 * обязана оставаться чтением, — а серверное действие имеет.
 *
 * `saved !== null` значит «человек язык уже выбирал»: тогда тут делать нечего,
 * а расхождение с адресом разбирает сам лейаут.
 */
let written = false

export function LangSync({ lang, saved }: { lang: Lang; saved: Lang | null }) {
  useEffect(() => {
    // Флажок нужен из-за двойного вызова эффектов в dev: два действия подряд
    // завели бы две записи — вернее, вторая молча переписала бы первую.
    if (saved !== null || written) return
    written = true
    void rememberLanguage(lang)
  }, [lang, saved])

  return null
}
