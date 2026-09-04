import { DICTS } from '../i18n/dict'
import type { Lang } from './lang'

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
