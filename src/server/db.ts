import { Pool } from 'pg'
import { logger } from './logger'

let pool: Pool | null = null

function getPool(): Pool | null {
  if (pool) return pool
  const connectionString = process.env.DATABASE_URL
  if (!connectionString) return null

  pool = new Pool({
    connectionString,
    connectionTimeoutMillis: 4000,
    query_timeout: 4000,
  })
  pool.on('error', (error) => logger.error('database pool error', { err: error }))
  return pool
}

export type QueryResult<Row> =
  { status: 'ok'; rows: Row[] } | { status: 'unconfigured' } | { status: 'failed' }

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
