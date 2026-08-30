/*
 * Катит миграции из `tools/db/migrations` на базу из DATABASE_URL.
 *
 * Шаги нумерованные и применяются по одному в транзакции, а применённые
 * записываются в `schema_migrations`. Раньше здесь был один идемпотентный
 * файл, и этого хватало: таблицы заводились `create if not exists`,
 * повторный прогон ничего не значил. С переездом на две породы сезонов
 * появились шаги, которые повторять уже не всё равно, — отсюда журнал.
 *
 * Старая схема лежит первым шагом (`000_legacy.sql`) как была. На базе, где её
 * когда-то накатывали руками, она пройдёт вхолостую: там всё то же
 * `create if not exists`.
 *
 * На прод накатывают руками, с ноутбука:
 *
 *   vercel env pull --environment=production .env.production.local
 *   node --env-file=.env.production.local tools/db/migrate.mjs
 *
 * Именно так, а не через `npm run db:migrate`: тот подмешивает `.env.local`,
 * и накатить на дев вместо прода слишком легко. Шагом сборки миграцию не
 * делаем сознательно — её падение завалило бы деплой сайта.
 *
 * `--status` показывает, что применено и что осталось, ничего не трогая.
 */
import { readdirSync, readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import pg from 'pg'
import { dbTarget } from './target.mjs'

const url = process.env.DATABASE_URL
if (!url) {
  console.error(
    'Нет DATABASE_URL. Для локальной базы положите строку подключения в .env.local' +
      ' (см. .env.example), для прода — запустите с `node --env-file=<файл>`.',
  )
  process.exit(1)
}

const statusOnly = process.argv.includes('--status')

const here = dirname(fileURLToPath(import.meta.url))
const dir = join(here, 'migrations')
// Порядок — имя файла: нумерация для того и нужна.
const steps = readdirSync(dir)
  .filter((name) => name.endsWith('.sql'))
  .sort()

// Печатаем до подключения: это единственная защита от «накатил не на ту базу».
console.log(`База ${dbTarget(url)}, шагов в папке: ${steps.length}`)

const client = new pg.Client({ connectionString: url })
try {
  await client.connect()
  await client.query(
    `create table if not exists schema_migrations (
       name       text        primary key,
       applied_at timestamptz not null default now()
     )`,
  )

  const applied = new Set(
    (await client.query('select name from schema_migrations')).rows.map((row) => row.name),
  )
  const pending = steps.filter((name) => !applied.has(name))

  if (statusOnly) {
    for (const name of steps) console.log(`${applied.has(name) ? '✓' : '·'} ${name}`)
    console.log(pending.length ? `Осталось: ${pending.length}` : 'Всё накатано.')
  } else if (!pending.length) {
    console.log('Нечего катить — база в актуальном состоянии.')
  } else {
    for (const name of pending) {
      console.log(`→ ${name}`)
      // Шаг целиком в транзакции: упавший шаг не должен остаться половиной.
      await client.query('begin')
      try {
        await client.query(readFileSync(join(dir, name), 'utf8'))
        await client.query('insert into schema_migrations (name) values ($1)', [name])
        await client.query('commit')
      } catch (error) {
        await client.query('rollback').catch(() => {})
        throw error
      }
    }
    console.log(`Накатано шагов: ${pending.length}.`)
  }
} catch (error) {
  // Без кода не понять, что чинить: 28P01 — пароль, 3D000 — нет такой базы,
  // ENOTFOUND/ETIMEDOUT — адрес или закрытый доступ. Голый стек pg об этом молчит.
  console.error(`Не вышло${error?.code ? ` (${error.code})` : ''}: ${error?.message ?? error}`)
  process.exitCode = 1
} finally {
  await client.end().catch(() => {})
}
