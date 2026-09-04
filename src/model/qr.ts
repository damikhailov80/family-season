import type { Lang } from './lang'
import { QR_PATH, QR_SIZE, QR_URL } from './qr.data'
import { SITE_URL, sharedHref } from './site'

export interface QrMatrix {
  size: number
  path: string
  url: string
}

export const SITE_QR: QrMatrix = { size: QR_SIZE, path: QR_PATH, url: QR_URL }

export interface SharedLink {
  token: string
  qr: QrMatrix
}

export function shareQrUrl(lang: Lang, token: string): string {
  return `${SITE_URL.replace(/\/+$/, '')}${sharedHref(lang, token)}`
}
