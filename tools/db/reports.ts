import pg from 'pg'
import { REPORTS_TO_REVIEW } from '../../src/model/community'
import { knownLang } from '../../src/model/lang'
import { ideaTitle } from '../../src/model/library'
import { joinSeason } from '../../src/model/season'
import { dbTarget } from './target.mjs'

const url = process.env.DATABASE_URL
if (!url) {
  console.error('No DATABASE_URL — put the connection string in .env.local (see .env.example).')
  process.exit(1)
}

const args = process.argv.slice(2)
const flag = args.find((arg) => arg === '--block' || arg === '--unblock')
const code = flag ? args[args.indexOf(flag) + 1] : null
const note = flag === '--block' ? args.slice(args.indexOf(flag) + 2).join(' ') || null : null

if (flag && !code) {
  console.error(`No code given: ${flag} <code>`)
  process.exit(1)
}

console.log(`Database ${dbTarget(url)}.`)

const client = new pg.Client({ connectionString: url })
try {
  await client.connect()

  if (flag) {
    const result = await client.query(
      flag === '--block'
        ? 'update public_seasons set blocked_at = now(), block_note = $2 where code = $1 returning code'
        : 'update public_seasons set blocked_at = null, block_note = null where code = $1 returning code',
      flag === '--block' ? [code, note] : [code],
    )
    if (!result.rowCount) {
      console.error(`No publication with code ${code} — nothing to close.`)
      process.exitCode = 1
    } else {
      console.log(flag === '--block' ? `Closed /s/${code}.` : `Reopened /s/${code}.`)
    }
  } else {
    const { rows } = await client.query(`
      select r.code, p.id is not null as alive, p.hidden_at, p.blocked_at, p.block_note,
             max(r.author_key) as author_key,
             (array_agg(r.content order by r.created_at desc))[1] as content,
             (array_agg(r.language order by r.created_at desc))[1] as language,
             count(distinct r.reporter_key)::int as reporters,
             (select count(*) from public_favorites f where f.public_id = p.id)::int as favorites,
             max(r.created_at) as last_report,
             string_agg(distinct r.comment, ' | ') as comments
        from public_reports r
        left join public_seasons p on p.code = r.code
       group by r.code, p.id, p.hidden_at, p.blocked_at, p.block_note
       order by count(distinct r.reporter_key) desc, max(r.created_at) desc`)

    if (!rows.length) {
      console.log('No reports.')
    } else {
      console.log(
        `Publications with reports: ${rows.length}. Review threshold — ${REPORTS_TO_REVIEW}.\n`,
      )
      for (const row of rows) {
        const state = !row.alive
          ? 'deleted'
          : row.blocked_at
            ? 'closed'
            : row.hidden_at
              ? 'withdrawn by the author'
              : 'on the showcase'
        const mark =
          row.alive && !row.blocked_at && row.reporters >= REPORTS_TO_REVIEW
            ? ' ← threshold passed'
            : ''
        console.log(
          `/s/${row.code}  reports: ${row.reporters}  favourites: ${row.favorites}  ${state}${mark}`,
        )
        console.log(`  theme: ${ideaTitle(joinSeason(row.content, []), knownLang(row.language))}`)
        console.log(`  author: ${row.author_key}`)
        console.log(`  latest: ${row.last_report.toISOString().slice(0, 16).replace('T', ' ')}`)
        console.log(`  reports: ${row.comments}`)
        if (row.block_note) console.log(`  closed because: ${row.block_note}`)
        console.log()
      }
    }
  }
} catch (error) {
  console.error(`Failed${error?.code ? ` (${error.code})` : ''}: ${error?.message ?? error}`)
  process.exitCode = 1
} finally {
  await client.end().catch(() => {})
}
