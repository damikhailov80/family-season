import type { FaceVariant } from '../types'

/** Порядок перебора аватара по клику в режиме правки. */
export const FACE_ORDER: FaceVariant[] = ['dad', 'mom', 'son', 'daughter']

export const FACE_LABELS: Record<FaceVariant, string> = {
  dad: 'папа',
  mom: 'мама',
  son: 'сын',
  daughter: 'дочь',
}


export function nextFace(face: FaceVariant): FaceVariant {
  const index = FACE_ORDER.indexOf(face)
  return FACE_ORDER[(index + 1) % FACE_ORDER.length]
}
