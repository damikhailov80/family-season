// Ставим одну жалобу на удалённую публикацию и одну на живую — только чтобы
// увидеть вывод очереди; в конце всё убираем.
import pg from 'pg'
const c = new pg.Client({ connectionString: process.env.DATABASE_URL })
await c.connect()
await c.query(`insert into public_reports (code, author_key, reporter_key, comment, content)
  values ('ttdead','test:author','test:other','мат в теме', '["Месяц брани","подзаголовок"]'::jsonb)`)
const live = (await c.query(`select code, content from public_seasons where author_key is not null limit 1`)).rows[0]
if (live) await c.query(`insert into public_reports (code, author_key, reporter_key, comment, content)
  values ($1,'test:author','test:other2','проверка живой', $2::jsonb)`, [live.code, JSON.stringify(live.content)])
await c.end()
