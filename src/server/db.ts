import { Pool } from 'pg'

/**
 * Единственное подключение к базе. Пул заводится лениво и один на модуль:
 * на serverless каждый инстанс держит свой, а плодить их на запрос нельзя —
 * кончатся соединения.
 *
 * Главное правило этого файла: **сайт обязан работать при мёртвой базе.**
 * Постер, лендинг, примеры, печать и сам вход от неё не зависят — в базе лежат
 * только настройки. Поэтому запросы ходят через `query`, который при любой беде
 * (нет `DATABASE_URL`, сеть, таймаут) возвращает `null` вместо того, чтобы
 * ронять страницу. Вызывающий обязан уметь жить без ответа.
 */

let pool: Pool | null = null

function getPool(): Pool | null {
  if (pool) return pool
  const connectionString = process.env.DATABASE_URL
  if (!connectionString) return null
  pool = new Pool({
    connectionString,
    // Страница ждёт настройку — лучше отдать её без состава семьи, чем висеть.
    connectionTimeoutMillis: 4000,
    query_timeout: 4000,
  })
  // Иначе разрыв соединения на стороне базы валит процесс целиком.
  pool.on('error', (error) => console.error('[db] соединение потеряно:', error.message))
  return pool
}

/** Запрос, который не бросает: `null` означает «база не ответила». */
export async function query<Row>(text: string, values: unknown[] = []): Promise<Row[] | null> {
  const active = getPool()
  if (!active) return null
  try {
    const result = await active.query(text, values)
    return result.rows as Row[]
  } catch (error) {
    console.error('[db] запрос не прошёл:', error instanceof Error ? error.message : error)
    return null
  }
}

/** Настроена ли база вообще — чтобы страница могла честно сказать «недоступна». */
export function hasDatabase(): boolean {
  return Boolean(process.env.DATABASE_URL)
}
