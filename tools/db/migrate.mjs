/*
 * Накатывает `schema.sql` на базу из DATABASE_URL.
 *
 * Полноценная система миграций здесь была бы больше самой базы: таблица одна,
 * схема идемпотентна. Появится вторая-третья — тогда и заведём нумерованные
 * шаги; пока это честный один шаг, а не заготовка на будущее.
 *
 * На прод накатывают руками, с ноутбука:
 *
 *   vercel env pull --environment=production .env.production.local
 *   node --env-file=.env.production.local tools/db/migrate.mjs
 *
 * Именно так, а не через `npm run db:migrate`: тот подмешивает `.env.local`,
 * и накатить на дев вместо прода слишком легко. Шагом сборки миграцию не
 * делаем сознательно — её падение завалило бы деплой сайта, который по
 * инварианту обязан работать и при мёртвой базе.
 */
import { readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import pg from 'pg'

const url = process.env.DATABASE_URL
if (!url) {
  console.error(
    'Нет DATABASE_URL. Для локальной базы положите строку подключения в .env.local' +
      ' (см. .env.example), для прода — запустите с `node --env-file=<файл>`.',
  )
  process.exit(1)
}

/** Куда именно едем — без пользователя и пароля. */
function target(value) {
  try {
    const parsed = new URL(value)
    return `${parsed.hostname}${parsed.port ? `:${parsed.port}` : ''}${parsed.pathname}`
  } catch {
    return 'адрес не разобрался'
  }
}

const here = dirname(fileURLToPath(import.meta.url))
const sql = readFileSync(join(here, 'schema.sql'), 'utf8')

// Печатаем до подключения: это единственная защита от «накатил не на ту базу».
console.log(`Накатываю схему на ${target(url)} …`)

const client = new pg.Client({ connectionString: url })
try {
  await client.connect()
  await client.query(sql)
  console.log('Схема накатена.')
} catch (error) {
  // Без кода не понять, что чинить: 28P01 — пароль, 3D000 — нет такой базы,
  // ENOTFOUND/ETIMEDOUT — адрес или закрытый доступ. Голый стек pg об этом молчит.
  console.error(`Не вышло${error?.code ? ` (${error.code})` : ''}: ${error?.message ?? error}`)
  process.exitCode = 1
} finally {
  await client.end().catch(() => {})
}
