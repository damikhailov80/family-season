import { posterText } from './labels'
import type { Lang } from './lang'
import type { FaceVariant } from '../types'

/** Порядок перебора аватара по клику в режиме правки. */
export const FACE_ORDER: FaceVariant[] = ['dad', 'mom', 'son', 'daughter']

/**
 * Ключи (`dad`, `mom`, …) трогать нельзя: лицо едет в формат номером — индексом
 * в `FACE_ORDER`.
 */
export function faceLabels(lang: Lang): Record<FaceVariant, string> {
  return posterText(lang).faces
}

export function nextFace(face: FaceVariant): FaceVariant {
  const index = FACE_ORDER.indexOf(face)
  return FACE_ORDER[(index + 1) % FACE_ORDER.length]
}
