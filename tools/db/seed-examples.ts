import pg from 'pg'
import { EXAMPLE_LIST } from '../../src/model/examples'
import { splitSeason } from '../../src/model/season'
import { shortCode } from '../../src/model/shortcode'
import { dbTarget } from './target.mjs'

const url = process.env.DATABASE_URL
if (!url) {
  console.error('No DATABASE_URL — put the connection string in .env.local (see .env.example).')
  process.exit(1)
}

console.log(`Database ${dbTarget(url)}, seasons in the registry: ${EXAMPLE_LIST.length}.`)

const client = new pg.Client({ connectionString: url })
try {
  await client.connect()

  for (const example of EXAMPLE_LIST) {
    const id = example.publicId
    const code = shortCode('public', id)
    const { content, names } = splitSeason(example.template())

    await client.query(
      `insert into public_seasons
         (id, code, author_key, content, names, palette, icon_set, language, fill_id, rolling_month)
       values ($1, $2, null, $3, $4, $5, $6, $7, $8, true)
       on conflict (id) do update set
         content   = excluded.content,
         names     = excluded.names,
         palette   = excluded.palette,
         icon_set  = excluded.icon_set,
         language  = excluded.language,
         fill_id   = excluded.fill_id,
         hidden_at = null`,
      [
        id,
        code,
        JSON.stringify(content),
        JSON.stringify(names),
        example.palette,
        example.iconSet,
        example.lang,
        example.key,
      ],
    )
    console.log(`${example.key} → /${example.lang}/s/${code}`)
  }

  await client.query(
    `select setval(
       pg_get_serial_sequence('public_seasons', 'id'),
       greatest((select max(id) from public_seasons), 1)
     )`,
  )
  console.log(`System seasons in the database: ${EXAMPLE_LIST.length}.`)
} catch (error) {
  console.error(`Failed${error?.code ? ` (${error.code})` : ''}: ${error?.message ?? error}`)
  process.exitCode = 1
} finally {
  await client.end().catch(() => {})
}
