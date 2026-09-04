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
const steps = readdirSync(dir)
  .filter((name) => name.endsWith('.sql'))
  .sort()

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
  console.error(`Не вышло${error?.code ? ` (${error.code})` : ''}: ${error?.message ?? error}`)
  process.exitCode = 1
} finally {
  await client.end().catch(() => {})
}
