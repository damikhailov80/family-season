import { spawnSync } from 'node:child_process'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import pg from 'pg'
import { dbTarget } from './target.mjs'

const url = process.env.E2E_DATABASE_URL
if (!url) {
  console.error(
    'Нет E2E_DATABASE_URL. Положите строку подключения тестовой базы в .env.local' +
      ' (см. .env.example) — отдельную от DATABASE_URL: эта база сносится целиком.',
  )
  process.exit(1)
}

if (url === process.env.DATABASE_URL) {
  console.error(
    'E2E_DATABASE_URL совпадает с DATABASE_URL. Это рабочая база, а слепок сносит' +
      ' схему целиком — заведите отдельную базу для тестов.',
  )
  process.exit(1)
}

const here = dirname(fileURLToPath(import.meta.url))

console.log(`Слепок тестовой базы ${dbTarget(url)}.`)

const client = new pg.Client({ connectionString: url, connectionTimeoutMillis: 4000 })
try {
  await client.connect()
} catch (error) {
  const code = error?.code ?? error?.errors?.[0]?.code
  const hint =
    code === 'ECONNREFUSED' || code === 'ENOTFOUND'
      ? '\nПохоже, база не поднята: `docker start family-season-db`.'
      : ''
  console.error(`Не удалось подключиться к тестовой базе (${code ?? 'причина неизвестна'}).${hint}`)
  process.exit(1)
}

try {
  await client.query('drop schema public cascade')
  await client.query('create schema public')
} finally {
  await client.end()
}

const env = { ...process.env, DATABASE_URL: url }

for (const [what, args] of [
  ['миграции', [join(here, 'migrate.mjs')]],
  ['посев примеров', ['--import', 'tsx', join(here, 'seed-examples.ts')]],
]) {
  const done = spawnSync(process.execPath, args, { env, stdio: 'inherit' })
  if (done.status !== 0) {
    console.error(`Слепок не собрался: ${what} не прошли.`)
    process.exit(1)
  }
}

console.log('Слепок готов.')
