import type { FaceVariant } from '../types'

/** Порядок перебора аватара по клику в режиме правки. */
export const FACE_ORDER: FaceVariant[] = ['dad', 'mom', 'son', 'daughter']

/**
 * Подписи к четырём рисункам. Намеренно не «папа/мама/сын/дочь»: рисунков
 * четыре, а семьи разные — бывает бабушка с внуком, бывают двое взрослых.
 * Подпись описывает **рисунок**, а не родство.
 *
 * Ключи (`dad`, `mom`, …) остались прежними и трогать их нельзя: лицо едет
 * в ссылку номером — индексом в `FACE_ORDER`.
 */
export const FACE_LABELS: Record<FaceVariant, string> = {
  dad: 'взрослый',
  mom: 'взрослая',
  son: 'мальчик',
  daughter: 'девочка',
}

/**
 * Те же подписи с заглавной — для видимого интерфейса, где они начинают строку.
 * Считаются из `FACE_LABELS`, а не объявляются вторым списком: два словаря для
 * одних и тех же четырёх слов рано или поздно разойдутся.
 */
export const FACE_TITLES: Record<FaceVariant, string> = Object.fromEntries(
  FACE_ORDER.map((face) => [face, FACE_LABELS[face][0].toUpperCase() + FACE_LABELS[face].slice(1)]),
) as Record<FaceVariant, string>

export function nextFace(face: FaceVariant): FaceVariant {
  const index = FACE_ORDER.indexOf(face)
  return FACE_ORDER[(index + 1) % FACE_ORDER.length]
}
