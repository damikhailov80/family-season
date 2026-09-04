import qrcode from 'qrcode-generator'
import type { Lang } from '../model/lang'
import { shareQrUrl, type QrMatrix, type SharedLink } from '../model/qr'

const CORRECTION = 'M'

const QUIET_ZONE = 4

export function qrMatrix(url: string): QrMatrix {
  const qr = qrcode(0, CORRECTION)
  qr.addData(url, 'Byte')
  qr.make()

  const count = qr.getModuleCount()
  const runs: string[] = []

  for (let row = 0; row < count; row += 1) {
    let start = -1
    for (let col = 0; col <= count; col += 1) {
      const dark = col < count && qr.isDark(row, col)
      if (dark && start === -1) start = col
      if (!dark && start !== -1) {
        const width = col - start
        runs.push(`M${start + QUIET_ZONE} ${row + QUIET_ZONE}h${width}v1h-${width}z`)
        start = -1
      }
    }
  }

  return { size: count + QUIET_ZONE * 2, path: runs.join(''), url }
}

export function shareQr(lang: Lang, token: string): QrMatrix {
  return qrMatrix(shareQrUrl(lang, token))
}

export function sharedLink(season: { lang: Lang; shareToken: string | null }): SharedLink | null {
  return season.shareToken
    ? { token: season.shareToken, qr: shareQr(season.lang, season.shareToken) }
    : null
}
