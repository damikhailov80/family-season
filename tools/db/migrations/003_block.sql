-- Блокировка публикации и уборка в жалобах.
--
-- Появилось состояние **закрыт**: сезон остаётся в базе, но не показывается
-- нигде — ни в «Идеях сообщества», ни по прямой ссылке. Ставит его пока руками
-- разработчик (`npm run db:reports -- --block <code>`), когда жалоб набралось
-- достаточно; автоматического порога в выборке витрины больше нет — прятать
-- сезон молча, никому об этом не сказав, оказалось хуже, чем разобрать вручную.
--
-- Отсюда же правило удаления: **публикация с жалобами не удаляется никогда**.
-- Раньше её мог унести автор, нажав «Убрать с витрины», — и жалобы теряли то,
-- на что были поданы. Теперь такая строка прячется, как и та, что кто-то отложил
-- в избранное.
--
-- Поэтому же из жалоб уходит `code`: он был снимком на случай, когда публикация
-- исчезнет, а исчезнуть она больше не может. `author_key` рядом остаётся и
-- снимком быть не перестаёт: у скрытой публикации авторство может смениться
-- (её перехватывает тот, кто выложил тот же контент заново), а жалоба обязана
-- помнить, на кого её подавали.

alter table public_seasons add column if not exists blocked_at timestamptz;
-- Зачем закрыли: разбирать будут люди, и через месяц «почему» не вспомнит никто.
alter table public_seasons add column if not exists block_note text;

-- Витрина и прямая ссылка спрашивают именно «не закрыт ли»: индекс частичный,
-- потому что закрытых всегда единицы.
create index if not exists public_seasons_blocked
  on public_seasons (blocked_at) where blocked_at is not null;

alter table public_reports drop column if exists code;

-- Ссылка на публикацию перестаёт быть необязательной: терять цель жалобе теперь
-- негде. Каскад вместо обнуления — на случай, когда строку всё же сносят руками:
-- тогда сносят её целиком, вместе с историей, осознанно.
delete from public_reports where public_id is null;
alter table public_reports alter column public_id set not null;
alter table public_reports drop constraint if exists public_reports_public_id_fkey;
alter table public_reports
  add constraint public_reports_public_id_fkey
  foreign key (public_id) references public_seasons (id) on delete cascade;
