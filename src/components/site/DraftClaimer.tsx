'use client'

import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { useDict, useLang } from '../../i18n/context'
import { fill } from '../../i18n/fill'
import { readDraft, sealDraft } from '../../model/draft'
import { libraryText } from '../../model/library'
import { modeFromPath, ROUTES, seasonHref, stripLang } from '../../model/site'
import { storeSeason } from '../../server/actions'
import { Toast } from './Toast'

/**
 * Черновик уезжает в коллекцию сам, как только человек вошёл.
 *
 * Раньше это делала пометка `?claim=1` и своя кнопка «Войти и сохранить» в
 * панели черновика: вход спрашивали заранее, ради подписи на кнопке, и забирали
 * набранное только тем одним путём. Теперь путь один и никаких пометок:
 * **у вошедшего черновика не бывает** — коллекция у него в базе, — поэтому
 * запись в браузере может означать ровно одно: её собрали до входа. Значит,
 * согласия спрашивать не о чем, и вход любой кнопкой, из любого места, доводит
 * дело до конца.
 *
 * Компонент стоит в корневом лейауте и потому монтируется один раз на весь
 * документ: мягкие переходы его не перезапускают. Флажок `taken` нужен всё
 * равно — в dev React зовёт эффект дважды, а две попытки подряд завели бы две
 * строки.
 *
 * Неудача черновик не трогает: строки не появилось, и стирать нечего.
 */
let taken = false

export function DraftClaimer() {
  const router = useRouter()
  const lang = useLang()
  const { site } = useDict()
  const [notice, setNotice] = useState<{ text: string; at: number } | null>(null)

  useEffect(() => {
    if (taken) return
    const draft = readDraft()
    // Пусто — обычное дело: черновика нет, приватное окно, запрет на данные сайта.
    if (!draft) return
    taken = true

    void (async () => {
      const result = await storeSeason({
        title: draft.title,
        template: draft.template,
        palette: draft.palette,
        iconSet: draft.iconSet,
        // Язык уезжает вместе с бланком: подписи листа — часть черновика.
        lang: draft.lang,
      })

      if (result.status !== 'ok' || !result.code) {
        taken = false
        // `anonymous` сюда приходит с протухшей кукой. Слов у него нет: человек
        // никуда не шёл, а предлагать вход тому, кто только что вошёл, — вздор.
        // `ok` без кода невозможен, но проверка стоит рядом с ним, а не в вере.
        if (result.status !== 'ok' && result.status !== 'anonymous') {
          setNotice({ text: libraryText(lang, result.status), at: Date.now() })
        }
        return
      }

      // Уехал строкой — второй копии не держим. Запираем, а не просто стираем:
      // на самом черновике рядом работает `DraftStore`, и его отложенная запись
      // вернула бы вычищенное обратно.
      sealDraft()

      /*
       * С самого черновика уходим в его новую строку — иначе человек остался бы
       * на постере, за которым больше нет хранилища. Переход жёсткий: страница
       * `/sheet` грузится с `ssr: false` и о базе ничего не знает. Режим
       * сохраняем: правил — правит дальше, смотрел — смотрит.
       */
      if (stripLang(location.pathname).startsWith(ROUTES.sheet)) {
        location.assign(seasonHref(lang, result.code, modeFromPath(location.pathname)))
        return
      }

      setNotice({
        text: fill(site.draftClaimed, { title: draft.title }),
        at: Date.now(),
      })
      // Списку «Моих сезонов» надо показать новую строку; на остальных страницах
      // перерисовка ничего не стоит.
      router.refresh()
    })()
  }, [router, lang, site])

  return notice ? <Toast key={notice.at} message={notice.text} /> : null
}
