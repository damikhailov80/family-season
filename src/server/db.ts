import { Pool } from 'pg'

/**
 * Единственное подключение к базе. Пул заводится лениво и один на модуль:
 * на serverless каждый инстанс держит свой, а плодить их на запрос нельзя —
 * кончатся соединения.
 *
 * Главное правило этого файла: **сайт обязан работать при мёртвой базе.**
 * Постер, лендинг, примеры, печать и сам вход от неё не зависят — в базе лежат
 * только настройки. Поэтому запросы ходят через `query`, который при любой беде
 * (нет `DATABASE_URL`, сеть, таймаут) не бросает. Вызывающий обязан уметь жить
 * без ответа — но обязан и **знать причину**: «переменной нет» и «база молчит»
 * чинятся по-разному, и страница не имеет права выдавать одно за другое.
 */

let pool: Pool | null = null

/**
 * «База не настроена» — не поломка, а обычное состояние машины без `.env.local`.
 * Поэтому ругаемся один раз на процесс: иначе строка добавлялась бы на каждый
 * рендер шапки и утопила бы в себе настоящие ошибки.
 */
let unconfiguredReported = false

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

/*
 * Разметка строкой, а не `ok: boolean`: в `tsconfig` выключен `strict`, и по
 * булеву дискриминанту TypeScript такой союз не сужает — `rows` и `reason`
 * оказываются недоступны в обеих ветках.
 */
export type QueryResult<Row> =
  | { status: 'ok'; rows: Row[] }
  | { status: 'unconfigured' }
  | { status: 'failed' }

/**
 * Запрос, который не бросает: причина неудачи приезжает разметкой, а не `null`.
 *
 * `label` идёт первым и нужен только логу: по строке «запрос не прошёл» без него
 * не понять, чтение это или запись. Сам SQL в лог не пишем — вместе с ним туда
 * уехали бы значения, а среди них имена людей.
 */
export async function query<Row>(
  label: string,
  text: string,
  values: unknown[] = [],
): Promise<QueryResult<Row>> {
  const active = getPool()
  if (!active) {
    if (!unconfiguredReported) {
      unconfiguredReported = true
      console.error(
        `[db] DATABASE_URL не задан (${label}): настройки аккаунта недоступны,` +
          ' остальной сайт работает. Дальше об этом молчу.',
      )
    }
    return { status: 'unconfigured' }
  }
  try {
    const result = await active.query(text, values)
    return { status: 'ok', rows: result.rows as Row[] }
  } catch (error) {
    /*
     * Главное у ошибок pg лежит не в `message`, а в `code`: `42P01` — нет
     * таблицы (схему не накатывали), `28P01` — пароль, `ENOTFOUND`/`ETIMEDOUT` —
     * сеть. Без кода и стека строка в логе не отвечает на вопрос «что чинить»,
     * а это единственный след, который останется от аварии в проде.
     */
    const code = (error as { code?: unknown })?.code
    console.error(
      `[db] запрос не прошёл (${label}${typeof code === 'string' ? `, код ${code}` : ''}):`,
      error instanceof Error ? (error.stack ?? error.message) : error,
    )
    return { status: 'failed' }
  }
}
