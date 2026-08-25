/*
 * Сборка QR-кода постера: source.json -> src/model/qr.data.ts
 *
 *   node tools/qr/build.mjs      (или npm run qr)
 *
 * Код на постере ведёт на сайт и один и тот же у всех листов, поэтому его
 * матрица — константа. Считать её в браузере на каждой загрузке незачем: здесь
 * она превращается в готовый `<path>`, а кодировщик (`qrcode-generator`) остаётся
 * сборочной зависимостью и в клиент не едет.
 *
 * Адрес сайта живёт здесь же, в source.json, и оттуда его берёт `SITE_URL`
 * (src/model/site.ts). Держать его двумя копиями — в константе и в исходнике
 * кода — нельзя: копии разойдутся, и QR молча поведёт не туда.
 *
 * Уровень коррекции M, а не L: строка короткая, запас прочности не поднимает
 * версию настолько, чтобы модуль стал мелким на бумаге.
 */

import { readFileSync, writeFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import qrcode from 'qrcode-generator'

const here = dirname(fileURLToPath(import.meta.url))
const root = resolve(here, '../..')

const fail = (message) => {
  console.error(`tools/qr/build.mjs: ${message}`)
  process.exit(1)
}

const { url, errorCorrection, quietZone } = JSON.parse(
  readFileSync(resolve(here, 'source.json'), 'utf8'),
)

if (typeof url !== 'string' || !url.startsWith('https://')) {
  fail('url в source.json должен быть абсолютным https-адресом: код читают с бумаги')
}
if (!['L', 'M', 'Q', 'H'].includes(errorCorrection)) fail('errorCorrection: L, M, Q или H')
if (!Number.isInteger(quietZone) || quietZone < 4) {
  fail('quietZone меньше четырёх модулей — такой код камерой не читается')
}
// Адрес всегда ASCII, иначе байтовый режим ниже посчитает длину не по символам.
if (/[^\x20-\x7e]/.test(url)) fail('в url есть не-ASCII символы')

// 0 — версия подбирается по длине данных.
const qr = qrcode(0, errorCorrection)
qr.addData(url, 'Byte')
qr.make()

const count = qr.getModuleCount()
const size = count + quietZone * 2

/*
 * Соседние тёмные модули в строке склеиваются в один прямоугольник: у версии 3
 * это сотни модулей, и без склейки путь раздувается в несколько килобайт.
 */
const runs = []
for (let row = 0; row < count; row += 1) {
  let start = -1
  for (let col = 0; col <= count; col += 1) {
    const dark = col < count && qr.isDark(row, col)
    if (dark && start === -1) start = col
    if (!dark && start !== -1) {
      const width = col - start
      runs.push(`M${start + quietZone} ${row + quietZone}h${width}v1h-${width}z`)
      start = -1
    }
  }
}

const file = `/**
 * QR-код постера. Файл собирается: tools/qr/build.mjs (npm run qr), руками его
 * не правят — правят tools/qr/source.json и пересобирают.
 *
 * Собран для адреса ниже с коррекцией ${errorCorrection} и тихой зоной ${quietZone} модуля.
 * Рисует его src/components/QrCode.tsx, ставит на лист MonthGoal.tsx.
 */

/** Адрес, зашитый в код. Он же единственный источник \`SITE_URL\` (см. site.ts). */
export const QR_URL = '${url}'

/** Сторона \`viewBox\`: ${count} модулей кода плюс тихая зона с обеих сторон. */
export const QR_SIZE = ${size}

/** Тёмные модули одним путём; соседние в строке склеены в прямоугольники. */
export const QR_PATH =
  '${runs.join('')}'
`

writeFileSync(resolve(root, 'src/model/qr.data.ts'), file)

console.log(
  `QR ${count}×${count} модулей (коррекция ${errorCorrection}), ` +
    `${runs.length} прямоугольников: src/model/qr.data.ts`,
)
