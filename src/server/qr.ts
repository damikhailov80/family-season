import qrcode from 'qrcode-generator'
import type { Lang } from '../model/lang'
import { shareQrUrl, type QrMatrix, type SharedLink } from '../model/qr'

/*
 * Кодировщик QR. Живёт на сервере: код с личной ссылкой у каждого сезона свой,
 * заранее его не собрать, — но в браузер кодировщик от этого не едет. Адрес
 * известен серверу и при рендере страницы, и в ответ на «Создать ссылку», а
 * лишние одиннадцать килобайт в бандле постера ничего бы не купили.
 *
 * Тот же кодировщик зовёт `tools/qr/build.ts`, собирая постоянный код сайта:
 * правила кодирования обязаны быть одни, иначе два кода на одном листе начнут
 * отличаться зерном.
 */

/**
 * Уровень коррекции. M, а не L: на такой короткой строке запас прочности
 * достаётся почти даром — он не поднимает версию настолько, чтобы модуль стал
 * мелким на бумаге.
 */
const CORRECTION = 'M'

/** Тихая зона в модулях. Меньше четырёх — и код не читается камерой вовсе. */
const QUIET_ZONE = 4

/**
 * Матрица кода для адреса: `viewBox` со стороной «модули плюс тихая зона» и
 * один `<path>` со всеми тёмными модулями.
 */
export function qrMatrix(url: string): QrMatrix {
  // 0 — версия подбирается по длине данных.
  const qr = qrcode(0, CORRECTION)
  qr.addData(url, 'Byte')
  qr.make()

  const count = qr.getModuleCount()
  const runs: string[] = []

  /*
   * Соседние тёмные модули в строке склеиваются в один прямоугольник: их
   * сотни, и без склейки путь раздувается в несколько килобайт.
   */
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

/** Код личной ссылки — тот, что уходит на бумагу вместо адреса сайта. */
export function shareQr(lang: Lang, token: string): QrMatrix {
  return qrMatrix(shareQrUrl(lang, token))
}

/**
 * Личная ссылка сезона целиком: токен для окна, код для листа. `null` — ссылку
 * не выдавали, и на листе останется постоянный код сайта.
 */
export function sharedLink(season: { lang: Lang; shareToken: string | null }): SharedLink | null {
  return season.shareToken
    ? { token: season.shareToken, qr: shareQr(season.lang, season.shareToken) }
    : null
}
