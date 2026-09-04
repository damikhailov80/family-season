import { DICTS } from '../i18n/dict'
import type { Lang } from './lang'

/**
 * Подписи бланка — каркас формы, а не содержимое: в `content` они не попадают.
 * Берутся языком сезона, а не интерфейса (компоненты листа зовут `usePoster()`):
 * русский сезон остаётся русским, даже если сайт переключили на английский.
 */
export type PosterText = (typeof DICTS)['ru']['poster']

export function posterText(lang: Lang): PosterText {
  return DICTS[lang].poster
}

export function moodLegend(lang: Lang) {
  const { mood } = posterText(lang)
  return [
    { mood: 'good' as const, label: mood.good },
    { mood: 'ok' as const, label: mood.ok },
    { mood: 'bad' as const, label: mood.bad },
  ]
}
