-- Жалоба перестаёт быть ссылкой и становится снимком.
--
-- Шаг `003` убрал из жалоб `code` со словами «исчезнуть публикация больше не
-- может»: строку с жалобами тогда решили не удалять никогда, и снимок был не
-- нужен. Теперь она исчезнуть может — скрытый с витрины сезон удаляется, как
-- только его убирает из избранного последний, кто его отложил. Держать ради
-- жалобы строку, которой больше никто не видит, оказалось хуже, чем дать жалобе
-- собственную память.
--
-- Память эта — код из адреса и **копия контента**. Кода хватает, чтобы связать
-- жалобу с живой публикацией (он постоянен и не переиспользуется), а копии —
-- чтобы разобрать жалобу, когда публикации уже нет: разбирают ведь текст, а его
-- в базе больше взять неоткуда.
--
-- Имена в снимок не идут: жалуются на содержимое, а имена — персональные данные
-- и в сравнении публикаций не участвуют. `author_key` остаётся тем же снимком,
-- каким был. Контент публикации не правится никогда, поэтому повторная жалоба
-- копию не переписывает — только комментарий.
--
-- Цена решения принята сознательно: `blocked_at` живёт на строке, и вместе со
-- строкой исчезает. Выложат тот же контент заново — он снова на витрине, и
-- разбирать придётся заново; снимок в жалобах хотя бы покажет, что это уже
-- разбирали.

alter table public_reports add column if not exists code    text;
alter table public_reports add column if not exists content jsonb;

update public_reports r
   set code = p.code, content = p.content
  from public_seasons p
 where p.id = r.public_id and r.code is null;

-- Жалоб без цели быть не должно (`public_id` был not null с каскадом), но если
-- такая нашлась — разбирать в ней нечего.
delete from public_reports where code is null or content is null;

alter table public_reports alter column code    set not null;
alter table public_reports alter column content set not null;

-- Одна жалоба на пару «публикация + жалобщик» — теперь по коду. На этом
-- по-прежнему держится порог: считаются авторы жалоб, а не нажатия.
drop index if exists public_reports_once;
create unique index if not exists public_reports_once on public_reports (code, reporter_key);

-- По коду ищут и «жаловался ли я на этот сезон», и предел жалоб на аккаунт.
create index if not exists public_reports_code on public_reports (code);

alter table public_reports drop constraint if exists public_reports_public_id_fkey;
alter table public_reports drop column if exists public_id;
