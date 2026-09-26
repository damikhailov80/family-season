-- A season shows the month it was saved with. Our examples keep only the month: the year is
-- substituted with the current one when they are read.
alter table public_seasons rename column rolling_month to rolling_year;

-- Uniqueness of a publication counts the month but not the year: content[2] is the theme,
-- [year, monthIndex, subtitle, question], and the year is blanked out of the key.
-- The same expression is written in src/server/publicSeasons.ts (CONTENT_KEY) and must match.
do $$
declare
  clash text;
begin
  select string_agg(code, ', ') into clash
    from (
      select code, count(*) over (
               partition by md5(language || jsonb_set(content, '{2,0}', 'null')::text)
             ) as same
        from public_seasons
    ) keyed
   where same > 1;
  if clash is not null then
    raise exception 'Publications differ only by year, resolve them by hand first: %', clash;
  end if;
end $$;

alter table public_seasons drop column content_key;
alter table public_seasons add column content_key text
  generated always as (md5(language || jsonb_set(content, '{2,0}', 'null')::text)) stored;
create unique index public_seasons_content on public_seasons (content_key);
