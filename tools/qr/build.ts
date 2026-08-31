/*
 * Сборка постоянного кода сайта: source.json -> src/model/qr.data.ts
 *
 *   node --import tsx tools/qr/build.ts      (или npm run qr)
 *
 * Код сайта один и тот же у всех листов, поэтому его матрица — константа.
 * Считать её при каждом рендере незачем: здесь она превращается в готовый
 * `<path>`. Второй код листа — личная ссылка — так собран быть не может: он у
 * каждого сезона свой, и его считает сервер тем же `qrMatrix`.
 *
 * Правил кодирования (коррекция, тихая зона, склейка модулей) здесь поэтому
 * нет вовсе — они лежат в `src/server/qr.ts` в одном экземпляре: два кода на
 * одном листе обязаны быть собраны одинаково.
 *
 * Адрес сайта живёт здесь же, в source.json, и оттуда его берёт `SITE_URL`
 * (src/model/site.ts). Держать его двумя копиями — в константе и в исходнике
 * кода — нельзя: копии разойдутся, и QR молча поведёт не туда.
 */

import { readFileSync, writeFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { qrMatrix } from '../../src/server/qr'

const here = dirname(fileURLToPath(import.meta.url))
const root = resolve(here, '../..')

const fail = (message: string) => {
  console.error(`tools/qr/build.ts: ${message}`)
  process.exit(1)
}

const { url } = JSON.parse(readFileSync(resolve(here, 'source.json'), 'utf8'))

if (typeof url !== 'string' || !url.startsWith('https://')) {
  fail('url в source.json должен быть абсолютным https-адресом: код читают с бумаги')
}
// Адрес всегда ASCII, иначе байтовый режим кодировщика посчитает длину не по символам.
if (/[^\x20-\x7e]/.test(url)) fail('в url есть не-ASCII символы')

const { size, path } = qrMatrix(url)

const file = `/**
 * Постоянный код сайта — тот, что стоит на листе, пока у сезона нет личной
 * ссылки. Файл собирается: tools/qr/build.ts (npm run qr), руками его не
 * правят — правят tools/qr/source.json и пересобирают.
 *
 * Собран для адреса ниже; правила кодирования — в src/server/qr.ts.
 * Рисует код src/components/QrCode.tsx, ставит на лист MonthGoal.tsx.
 */

/** Адрес, зашитый в код. Он же единственный источник \`SITE_URL\` (см. site.ts). */
export const QR_URL = '${url}'

/** Сторона \`viewBox\`: модули кода плюс тихая зона с обеих сторон. */
export const QR_SIZE = ${size}

/** Тёмные модули одним путём; соседние в строке склеены в прямоугольники. */
export const QR_PATH =
  '${path}'
`

writeFileSync(resolve(root, 'src/model/qr.data.ts'), file)

console.log(`QR для ${url}: сторона ${size}, ${path.length} знаков пути — src/model/qr.data.ts`)
