'use client'

import { useEffect, useState } from 'react'

/**
 * Библиотека сезонов глазами живого постера.
 *
 * Спрашиваем `/api/library`: лист клиентский (`ssr: false`) и до базы не
 * дотягивается. Любая беда — сеть, нет сессии, молчащая база — это «ничего не
 * нашлось», а не ошибка: постер обязан работать без сервера. Ошибку человек
 * увидит тогда, когда сам нажмёт кнопку, — от действия отказ отличим.
 */

/** Столько же, сколько ждёт запись адреса в `DocProvider`. */
const LOOKUP_DELAY = 400

export interface SavedSeason {
  id: string
  title: string
  url: string
}

export interface Lookup {
  /** id строки избранного с этим адресом; `null` — нет или ещё не знаем. */
  favoriteId: string | null
  /**
   * Своя сохранённая строка. Три состояния здесь настоящие: `undefined` — ответа
   * ещё нет, `null` — сезон не сохранён, объект — нашёлся. Различать обязательно:
   * пока ответа нет, кнопка «Сохранить» не имеет права быть доступной — иначе в
   * эту щель успевает попасть клик и заводит вторую такую же строку.
   */
  season: SavedSeason | null | undefined
}

const EMPTY: Lookup = { favoriteId: null, season: undefined }

/**
 * Адрес постера для библиотеки: он собирается кодированием, а кодирование
 * асинхронное, поэтому в рендере его просто так не возьмёшь.
 *
 * Ответ помечается тождеством самого `build`: в `DocProvider` это `useCallback`,
 * который меняется ровно тогда, когда меняется постер. Так адрес от прошлого
 * постера не подставится под нынешний, и гасить его лишним прогоном рендера не
 * приходится.
 */
export function useSeasonUrl(build: () => Promise<string>): string | null {
  const [answer, setAnswer] = useState<{ from: unknown; url: string } | null>(null)

  useEffect(() => {
    let cancelled = false
    // Дебаунс тот же, что у записи адреса в `DocProvider`, и по той же причине:
    // в правке `build` меняется на каждый набранный символ, а за ним уходит
    // запрос. Пауза в наборе — и спрашиваем один раз.
    const timer = setTimeout(() => {
      void build().then((url) => {
        if (!cancelled) setAnswer({ from: build, url })
      })
    }, LOOKUP_DELAY)

    return () => {
      cancelled = true
      clearTimeout(timer)
    }
  }, [build])

  return answer?.from === build ? answer.url : null
}

/**
 * Что библиотека знает про этот постер: лежит ли он в избранном и не он ли —
 * один из сохранённых сезонов.
 *
 * Запрос один на оба ответа: они про один и тот же адрес, а адрес в правке
 * меняется постоянно. Ответ хранится **вместе с вопросом**, на который отвечал,
 * и нужное выводится при рендере: иначе прежний ответ пришлось бы гасить из
 * эффекта — лишний прогон рендера и чужой ответ на экране между ними.
 *
 * Сеттер отдаём наружу: после нажатия ответ уже известен из самого действия,
 * и переспрашивать сервер незачем.
 */
export function useLibrary(
  url: string | null,
  seasonId: string | null,
): [Lookup, (next: Partial<Lookup>) => void] {
  const key = `${url ?? ''}|${seasonId ?? ''}`
  const [answer, setAnswer] = useState<({ key: string } & Lookup) | null>(null)

  useEffect(() => {
    if (!url) return
    let cancelled = false
    const params = new URLSearchParams({ url })
    if (seasonId) params.set('season', seasonId)

    void (async () => {
      try {
        const response = await fetch(`/api/library?${params}`)
        const data = response.ok ? ((await response.json()) as Partial<Lookup>) : null
        if (cancelled) return
        setAnswer({
          key,
          favoriteId: typeof data?.favoriteId === 'string' ? data.favoriteId : null,
          // Пришло из сети — доверять нельзя: строка без названия для нас не строка.
          season: data?.season && typeof data.season.id === 'string' ? data.season : null,
        })
      } catch {
        // Молчание сервера — не ошибка: кнопки просто останутся в исходном виде.
        if (!cancelled) setAnswer({ key, favoriteId: null, season: null })
      }
    })()

    return () => {
      cancelled = true
    }
  }, [key, url, seasonId])

  const lookup = answer?.key === key ? answer : EMPTY
  return [lookup, (next) => setAnswer({ key, ...lookup, ...next })]
}
