/*
 * Кладёт наши примеры в `public_seasons` как **системные публичные сезоны**.
 *
 * Примеры — такие же публичные сезоны, как людские: их открывают по короткой
 * ссылке, кладут в избранное и форкают. Отличий ровно три, и все три — колонки:
 * автора нет (`author_key is null`), есть набор заполнения (`fill_id`) и месяц
 * подставляется при чтении (`rolling_month`) — иначе пример протух бы к
 * следующему сентябрю.
 *
 * Источник по-прежнему `src/data/examples/<id>.json` и реестр рядом с ними:
 * второй копии примеров не заводим, строки в базе — то же, что собранные файлы
 * тем и рисунков. Поэтому скрипт можно гонять сколько угодно: он перезаписывает
 * системные строки на месте.
 *
 * Id системных строк фиксированы порядком реестра (1, 2, 3, …), и это важно:
 * код адреса — перестановка id, а значит ссылка на пример постоянна и её можно
 * посчитать в самом репозитории, не спрашивая базу.
 *
 *   npm run db:seed
 */
import pg from 'pg'
import { EXAMPLE_LIST } from '../../src/model/examples'
import { splitSeason } from '../../src/model/season'
import { shortCode } from '../../src/model/shortcode'

const url = process.env.DATABASE_URL
if (!url) {
  console.error('Нет DATABASE_URL — положите строку подключения в .env.local (см. .env.example).')
  process.exit(1)
}

const client = new pg.Client({ connectionString: url })
try {
  await client.connect()

  for (const example of EXAMPLE_LIST) {
    const id = example.publicId
    const code = shortCode('public', id)
    const { content, names } = splitSeason(example.template())

    await client.query(
      `insert into public_seasons
         (id, code, author_key, content, names, palette, icon_set, fill_id, rolling_month)
       values ($1, $2, null, $3, $4, $5, $6, $7, true)
       on conflict (id) do update set
         content   = excluded.content,
         names     = excluded.names,
         palette   = excluded.palette,
         icon_set  = excluded.icon_set,
         fill_id   = excluded.fill_id,
         hidden_at = null`,
      [id, code, JSON.stringify(content), JSON.stringify(names), example.palette, example.iconSet, example.id],
    )
    console.log(`${example.id} → /s/${code}`)
  }

  // Людские сезоны обязаны начинаться после системных: id мы проставили руками,
  // а последовательность об этом не знает и выдала бы первому же человеку id 1.
  await client.query(
    `select setval(
       pg_get_serial_sequence('public_seasons', 'id'),
       greatest((select max(id) from public_seasons), 1)
     )`,
  )
  console.log(`Системных сезонов в базе: ${EXAMPLE_LIST.length}.`)
} catch (error) {
  console.error(`Не вышло${error?.code ? ` (${error.code})` : ''}: ${error?.message ?? error}`)
  process.exitCode = 1
} finally {
  await client.end().catch(() => {})
}
