import { DICTS } from '../i18n/dict'
import type { Lang } from './lang'

/**
 * Подписи бланка. Это каркас формы, а не содержимое листа: они одинаковы у
 * всех, не редактируются и в `content` не попадают.
 *
 * Берутся **по языку сезона**, а не по языку интерфейса: подписи печатаются, и
 * русский сезон обязан остаться русским, даже если человек переключил сайт на
 * английский. Язык сезона лежит колонкой рядом с содержимым и в контексте
 * постера (`docContext.ts`); компоненты листа зовут `usePoster()`.
 *
 * Сами строки живут в словаре (`src/i18n/dict/*`), здесь только доступ.
 */
export type PosterText = (typeof DICTS)['ru']['poster']

export function posterText(lang: Lang): PosterText {
  return DICTS[lang].poster
}

/** Легенда светофора настроений — тремя парами, как её рисует таблица. */
export function moodLegend(lang: Lang) {
  const { mood } = posterText(lang)
  return [
    { mood: 'good' as const, label: mood.good },
    { mood: 'ok' as const, label: mood.ok },
    { mood: 'bad' as const, label: mood.bad },
  ]
}
