import { Pool } from 'pg'
import { logger } from './logger'

/**
 * Единственное подключение к базе. Пул заводится лениво и один на модуль:
 * на serverless каждый инстанс держит свой, а плодить их на запрос нельзя —
 * кончатся соединения.
 *
 * Главное правило файла: **сайт обязан работать при мёртвой базе.** Постер,
 * лендинг, примеры, печать и вход от неё не зависят — в базе лежат только
 * настройки. Поэтому запросы ходят через `query`, который не бросает, а
 * возвращает причину отказа. Вызывающий обязан уметь жить без ответа.
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
  // Без обработчика разрыв соединения на стороне базы валит процесс целиком.
  pool.on('error', (error) => logger.error('database pool error', { err: error }))
  return pool
}

export type QueryResult<Row> =
  | { status: 'ok'; rows: Row[] }
  | { status: 'unconfigured' }
  | { status: 'failed' }

/**
 * Запрос, который не бросает. Разметка строкой, а не `ok: boolean`: в `tsconfig`
 * выключен `strict`, и по булеву дискриминанту TypeScript такой союз не сужает.
 *
 * `op` — имя операции для логов. Текст SQL в лог не пишем: вместе с ним туда
 * уехали бы значения, а среди них имена людей.
 */
export async function query<Row>(
  op: string,
  text: string,
  values: unknown[] = [],
): Promise<QueryResult<Row>> {
  const active = getPool()
  if (!active) {
    logger.error('database query failed', { op, reason: 'DATABASE_URL is not set' })
    return { status: 'unconfigured' }
  }

  try {
    const result = await active.query(text, values)
    return { status: 'ok', rows: result.rows as Row[] }
  } catch (error) {
    logger.error('database query failed', { op, err: error })
    return { status: 'failed' }
  }
}
