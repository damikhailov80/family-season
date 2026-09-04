import type { Lang } from './lang'
import { QR_PATH, QR_SIZE, QR_URL } from './qr.data'
import { SITE_URL, sharedHref } from './site'

/**
 * Кодов на листе бывает два, и различаются они только адресом: по умолчанию адрес
 * сайта (по коду с холодильника приходят собирать свой сезон), а у сезона с
 * выданной личной ссылкой — она сама.
 */
export interface QrMatrix {
  size: number
  path: string
  url: string
}

/** Адрес постоянный, поэтому матрица собрана заранее (`npm run qr`). */
export const SITE_QR: QrMatrix = { size: QR_SIZE, path: QR_PATH, url: QR_URL }

/** Токен — окну, готовый код — листу; ходят они вместе, код собран из токена. */
export interface SharedLink {
  token: string
  qr: QrMatrix
}

/**
 * Адрес абсолютный и от имени сайта, а не от хоста, с которого открыли лист: у
 * бумаги «текущего адреса» нет. Язык — сезона: им напечатан сам лист.
 */
export function shareQrUrl(lang: Lang, token: string): string {
  return `${SITE_URL.replace(/\/+$/, '')}${sharedHref(lang, token)}`
}
