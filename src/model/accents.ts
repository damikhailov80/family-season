import { posterText } from './labels'
import type { Lang } from './lang'
import type { FaceVariant } from '../types'

export const FACE_ORDER: FaceVariant[] = ['dad', 'mom', 'son', 'daughter']

export function faceLabels(lang: Lang): Record<FaceVariant, string> {
  return posterText(lang).faces
}

export function nextFace(face: FaceVariant): FaceVariant {
  const index = FACE_ORDER.indexOf(face)
  return FACE_ORDER[(index + 1) % FACE_ORDER.length]
}
