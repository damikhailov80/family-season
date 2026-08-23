import type { AccentColor, FaceVariant } from '../types'

/** Порядок перебора аватара по клику в режиме правки. */
export const FACE_ORDER: FaceVariant[] = ['dad', 'mom', 'son', 'daughter']

export const FACE_LABELS: Record<FaceVariant, string> = {
  dad: 'папа',
  mom: 'мама',
  son: 'сын',
  daughter: 'дочь',
}

/** Цвет человека не хранится в модели — он однозначно выводится из типа аватара. */
export const ACCENT_BY_FACE: Record<FaceVariant, AccentColor> = {
  dad: 'blue',
  mom: 'pink',
  son: 'leaf',
  daughter: 'tangerine',
}

export function nextFace(face: FaceVariant): FaceVariant {
  const index = FACE_ORDER.indexOf(face)
  return FACE_ORDER[(index + 1) % FACE_ORDER.length]
}
