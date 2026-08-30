/*
 * Разбор жалоб — руками.
 *
 * Витрина ничего не прячет сама: порог `REPORTS_TO_REVIEW` — это повод
 * посмотреть, а не действие. Закрывает публикацию человек, и вот чем:
 *
 *   npm run db:reports                      # очередь: на что жаловались
 *   npm run db:reports -- --block <code> «мат в описании»
 *   npm run db:reports -- --unblock <code>
 *
 * Закрытая публикация остаётся в базе, но не показывается нигде — ни в «Идеях
 * сообщества», ни по прямой ссылке; выложить такой же контент заново нельзя.
 * Автор видит пометку «закрыт после жалоб» в своём списке опубликованных.
 *
 * Жалоба живёт дольше публикации: у неё свой снимок — код и копия контента, — и
 * очередь показывает её даже тогда, когда самой строки уже нет («удалена»).
 * Закрывать в этом случае нечего: `blocked_at` живёт на строке. Вернётся тот же
 * контент — разбирать придётся заново, зато снимок покажет, что это уже видели.
 *
 * На прод — как и миграции, с явным файлом окружения:
 *   node --env-file=.env.production.local --import tsx tools/db/reports.ts
 */
import pg from 'pg'
import { REPORTS_TO_REVIEW } from '../../src/model/community'
import { knownLang } from '../../src/model/lang'
import { ideaTitle } from '../../src/model/library'
import { joinSeason } from '../../src/model/season'
import { dbTarget } from './target.mjs'

const url = process.env.DATABASE_URL
if (!url) {
  console.error('Нет DATABASE_URL — положите строку подключения в .env.local (см. .env.example).')
  process.exit(1)
}

const args = process.argv.slice(2)
const flag = args.find((arg) => arg === '--block' || arg === '--unblock')
const code = flag ? args[args.indexOf(flag) + 1] : null
const note = flag === '--block' ? args.slice(args.indexOf(flag) + 2).join(' ') || null : null

if (flag && !code) {
  console.error(`Не назван код: ${flag} <code>`)
  process.exit(1)
}

// Куда едем: очередь жалоб и `--block` зовут и на проде, руками.
console.log(`База ${dbTarget(url)}.`)

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
      // Строки нет — жалобы на неё могут быть, а закрывать нечего: `blocked_at`
      // живёт на строке и вместе с ней исчез.
      console.error(`Нет публикации с кодом ${code} — закрывать нечего.`)
      process.exitCode = 1
    } else {
      console.log(flag === '--block' ? `Закрыта /s/${code}.` : `Открыта заново /s/${code}.`)
    }
  } else {
    // Ведёт жалоба, а не публикация: строки может уже не быть, а разбирать надо.
    // Автор и контент берутся из снимка — у живой строки они те же самые.
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
      console.log('Жалоб нет.')
    } else {
      console.log(`Публикаций с жалобами: ${rows.length}. Порог для разбора — ${REPORTS_TO_REVIEW}.\n`)
      for (const row of rows) {
        const state = !row.alive
          ? 'удалена'
          : row.blocked_at
            ? 'закрыта'
            : row.hidden_at
              ? 'снята автором'
              : 'на витрине'
        // Порог — повод посмотреть, а у удалённой смотреть уже нечего.
        const mark =
          row.alive && !row.blocked_at && row.reporters >= REPORTS_TO_REVIEW
            ? ' ← порог пройден'
            : ''
        console.log(`/s/${row.code}  жалоб: ${row.reporters}  избранное: ${row.favorites}  ${state}${mark}`)
        // Тема из снимка: у удалённой публикации это единственное, по чему
        // вообще видно, о чём шла речь.
        console.log(`  тема: ${ideaTitle(joinSeason(row.content, []), knownLang(row.language))}`)
        console.log(`  автор: ${row.author_key}`)
        console.log(`  последняя: ${row.last_report.toISOString().slice(0, 16).replace('T', ' ')}`)
        console.log(`  жалобы: ${row.comments}`)
        if (row.block_note) console.log(`  закрыта потому что: ${row.block_note}`)
        console.log()
      }
    }
  }
} catch (error) {
  console.error(`Не вышло${error?.code ? ` (${error.code})` : ''}: ${error?.message ?? error}`)
  process.exitCode = 1
} finally {
  await client.end().catch(() => {})
}
