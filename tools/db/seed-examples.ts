import pg from 'pg'
import { EXAMPLE_LIST, SYSTEM_ID_BASE } from '../../src/model/examples'
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

    // The seed writes ids spelled out in PUBLIC_IDS, and it upserts. Land on a row somebody
    // published and "do update" would replace their season and keep their name on it - it has
    // happened once. Refuse loudly instead: a wrong id is a mistake in the table, not something
    // to write through.
    const taken = await client.query(
      'select author_key from public_seasons where id = $1 and author_key is not null',
      [id],
    )
    if (taken.rowCount) {
      throw new Error(
        `public_seasons id ${id} (${example.key}) belongs to a published season of ${taken.rows[0].author_key}. ` +
          'Give the example an id of its own in PUBLIC_IDS; nothing has been written.',
      )
    }

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

  // The sequence must stay BELOW the system block. It used to follow max(id) over the whole
  // table, which was right while examples sat at 1..9 - but with a reserved block above, that
  // would park the sequence at the top of the block and hand the next publication an id an
  // example already owns. Looking only at the low range gives 9 on a fresh database (the legacy
  // examples), and a person's own highest id once anyone has published.
  await client.query(
    `select setval(
       pg_get_serial_sequence('public_seasons', 'id'),
       greatest((select max(id) from public_seasons where id < $1), 1)
     )`,
    [SYSTEM_ID_BASE],
  )
  console.log(`System seasons in the database: ${EXAMPLE_LIST.length}.`)
} catch (error) {
  console.error(`Failed${error?.code ? ` (${error.code})` : ''}: ${error?.message ?? error}`)
  process.exitCode = 1
} finally {
  await client.end().catch(() => {})
}
