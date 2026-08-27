/*
 * Накатывает `schema.sql` на базу из DATABASE_URL.
 *
 * Полноценная система миграций здесь была бы больше самой базы: таблица одна,
 * схема идемпотентна. Появится вторая-третья — тогда и заведём нумерованные
 * шаги; пока это честный один шаг, а не заготовка на будущее.
 */
import { readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import pg from 'pg'

const url = process.env.DATABASE_URL
if (!url) {
  console.error('Нет DATABASE_URL. Положите строку подключения в .env.local (см. .env.example).')
  process.exit(1)
}

const here = dirname(fileURLToPath(import.meta.url))
const sql = readFileSync(join(here, 'schema.sql'), 'utf8')

const client = new pg.Client({ connectionString: url })
await client.connect()
try {
  await client.query(sql)
  console.log('Схема накатена.')
} finally {
  await client.end()
}
