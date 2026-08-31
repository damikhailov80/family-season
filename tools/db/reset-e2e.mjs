/*
 * Приводит тестовую базу к слепку — тому состоянию, с которого начинается
 * каждый прогон e2e.
 *
 * Слепка своей копией схемы здесь нет и быть не должно: он собирается тем, что
 * уже есть, — миграциями и посевом примеров. Значит, новая миграция
 * подхватывается сама, а дамп, который надо не забыть пересобрать, не заводится.
 *
 * Стартовое состояние: сезоны, настройки, лайки, жалобы и избранное пусты,
 * `public_seasons` — девять системных примеров (три сезона × три языка).
 *
 *   npm run e2e:db
 *
 * Строка подключения берётся из **E2E_DATABASE_URL**, а не из DATABASE_URL:
 * скрипт сносит схему целиком, и промахнуться базой здесь стоит слишком дорого.
 */
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

/*
 * Единственная защита от «снесли дев» и «снесли прод». Сравниваем строки как
 * есть: совпали — значит человек подставил рабочую базу, и никакие рассуждения
 * про «а вдруг он этого и хотел» тут неуместны.
 */
if (url === process.env.DATABASE_URL) {
  console.error(
    'E2E_DATABASE_URL совпадает с DATABASE_URL. Это рабочая база, а слепок сносит' +
      ' схему целиком — заведите отдельную базу для тестов.',
  )
  process.exit(1)
}

const here = dirname(fileURLToPath(import.meta.url))

// Куда едем — до того, как что-то снеслось.
console.log(`Слепок тестовой базы ${dbTarget(url)}.`)

const client = new pg.Client({ connectionString: url, connectionTimeoutMillis: 4000 })
try {
  await client.connect()
} catch (error) {
  /*
   * Самая частая причина — база просто не поднята, и об этом надо сказать
   * словами: скрипт зовётся из pre-push, а стек в хуке не объясняет ничего.
   */
  const code = error?.code ?? error?.errors?.[0]?.code
  const hint =
    code === 'ECONNREFUSED' || code === 'ENOTFOUND'
      ? '\nПохоже, база не поднята: `docker start family-season-db`.'
      : ''
  console.error(`Не удалось подключиться к тестовой базе (${code ?? 'причина неизвестна'}).${hint}`)
  process.exit(1)
}

try {
  // `drop schema` разом уносит и таблицы, и журнал миграций: слепок должен
  // собираться с нуля, иначе `schema_migrations` соврёт о том, что накатано.
  await client.query('drop schema public cascade')
  await client.query('create schema public')
} finally {
  await client.end()
}

/*
 * Миграции и посев — дочерними процессами, а не импортом: оба скрипта читают
 * DATABASE_URL и завершаются через `process.exit`, и подменять им окружение
 * внутри одного процесса пришлось бы обманом.
 */
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
