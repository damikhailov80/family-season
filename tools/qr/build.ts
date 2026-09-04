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
  fail('url in source.json must be an absolute https address: the code is read off paper')
}
if (/[^\x20-\x7e]/.test(url)) fail('the url has non-ASCII characters')

const { size, path } = qrMatrix(url)

const file = `/* Built by tools/qr/build.ts (npm run qr) from tools/qr/source.json. */

export const QR_URL = '${url}'

export const QR_SIZE = ${size}

export const QR_PATH =
  '${path}'
`

writeFileSync(resolve(root, 'src/model/qr.data.ts'), file)

console.log(`QR for ${url}: side ${size}, ${path.length} path characters — src/model/qr.data.ts`)
