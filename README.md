# Family Season

Next month's poster for your family — what is ahead for you and the people close to you: the
name of the season, four weeks with room for a photo, everyone's personal storyline and a
chronicle of moods.

The metaphor is baked into the name: a month is a season, weeks are episodes, personal
projects are storylines, the summary is the wrap-up and the ideas for next month are what's
next up. The idea is simple: build the poster in advance, print it on two A4 sheets, put it on
the fridge and live the month.

At `/` there is a landing page with an explanation and three ready examples: "Spider-Man Month"
for four, "Board Game Month" for three and "Month of Firsts" for five — seasons deliberately at
different stages of being lived, from just started to finished, each in its own theme and with
its own drawings. Any of them can be **forked** and rewritten for your own family, or you can
build a season from scratch. A finished season lives as a row in your account and opens at a
short permanent address: you can show it with a private link or put it on the community
showcase.

The site speaks three languages — Russian, English and Polish — and the language is the first
segment of the address: `/ru`, `/en`, `/pl`. You can change it by hand in the address, with the
switcher in the header or with the setting in your account; a season has a language of its own,
chosen when it is created, and that is what captions the sheet itself.

| Address | What it is |
| --- | --- |
| `/<lang>` | Landing page: how to build a season and what is on the poster |
| `/<lang>/sheet`, `…/sheet/edit` | A signed-out person's draft: lives in their own browser |
| `/<lang>/season/<code>` | Your own season from the database; `…/edit` is the same one in edit mode |
| `/<lang>/s/<code>` | A published season, our examples included |
| `/<lang>/p/<token>` | Your own season by private link: viewing and forking |
| `/<lang>/seasons` | "My seasons": your own, favourites and published — signed-in only |
| `/<lang>/ideas` | "Community Ideas" — the showcase of published seasons in your language |
| `/<lang>/account` | Account: language, the family for new posters, sign-out |
| `/<lang>/privacy` | Privacy policy — Google requires its address |
| `/api/auth/*` | Sign-in with Google (Auth.js) |

Next.js (App Router, Turbopack bundler) + TypeScript, styles in CSS Modules; exactly one
third-party library reaches the browser — the Google Analytics tag, and only for someone who
allowed it in the consent banner. Everything else lives on the server: Auth.js never reaches
the browser, the sign-in buttons are a `<form>` with a server action. The poster itself is
entirely client-side.

## Cheat sheet

```bash
npm install       # also installs the git hooks (husky)
npm run dev       # http://localhost:3000
```

**Every day**

| Command | What it does |
| --- | --- |
| `npm run dev` | Dev server on 3000 |
| `npm run build` | Production build into `.next/` |
| `npm run start` | Production server on what was built |

**Checks** — the same ones that sit on the hooks

| Command | What it does |
| --- | --- |
| `npm run lint` | oxlint |
| `npm run typecheck` | `tsc --noEmit` |
| `npm run format` | Prettier across the project |
| `npm run format:check` | Check the formatting, change nothing |
| `npm run e2e` | **Database snapshot + build + tests.** The full run |
| `npm run e2e:only` | Tests only, against the previous build — for editing the specs themselves |
| `npm run e2e:db` | Only bring the test database to the snapshot |
| `npx playwright test --ui` | Interactive mode: handy for writing new tests |
| `npx playwright test -g "switching the language"` | One test or group |
| `npx playwright show-report` | Report on the last run |

**Database**

| Command | What it does |
| --- | --- |
| `npm run db:status` | What is applied, what is left |
| `npm run db:migrate` | Apply the migrations (on dev; for production see "Deployment") |
| `npm run db:seed` | Put the examples into `public_seasons` |
| `npm run db:reports` | The report queue; `-- --block <code> "why"` closes a publication |
| `docker start family-season-db` | Bring the local postgres up |

**Generated files** — edit the source, then rebuild

| Command | From | Into |
| --- | --- | --- |
| `npm run palettes` | `tools/palettes/source.json` | `src/styles/palettes.css`, `src/model/palettes.data.ts` |
| `npm run icons` | `tools/icons/source.json` | `src/components/doodles/icons.generated.ts`, `src/model/icons.data.ts` |
| `npm run qr` | `tools/qr/source.json` | `src/model/qr.data.ts` |
| `npm run logo` | `tools/logo/` | `public/favicon.svg`, `logo-120.png` |

**What runs on its own**

| When | What | How long |
| --- | --- | --- |
| `git commit` | `prettier` and `oxlint` over what is being committed | a fraction of a second |
| `git push` | `lint` and `typecheck` | ~5 s |
| Deploy to Vercel | Nothing beyond the build: no migrations, no tests | — |

**E2E runs nowhere automatically** — for now they are run by hand, `npm run e2e`. The reason is
in the "Hooks" section.

To skip a hook once — `git push --no-verify`. The tests need the database up and an
`E2E_DATABASE_URL` line in `.env.local` — see "Tests".

## Tests

E2E on Playwright. A test title is a statement about how the product must behave, so the tests
double as a description of the scenarios: what is guaranteed is visible from `e2e/`.

The tests need a **separate** database: before every run its schema is dropped and built again
from the migrations and the example seed. It is created next to the dev database:

```bash
docker exec family-season-db createdb -U postgres family_season_e2e
# and a line in .env.local, see .env.example:
# E2E_DATABASE_URL=postgres://postgres:local@localhost:5432/family_season_e2e
```

```bash
npm run e2e       # snapshot + build + tests — the full run
npm run e2e:only  # tests only, against what is already built: when editing the specs themselves
npm run e2e:db    # only bring the test database to the snapshot
npx playwright show-report
```

`e2e` rebuilds the project on purpose: `e2e:only` runs the tests against the **previous** build,
so after editing the application code you would silently be checking the old one. It is the
fast one only for editing the specs.

The tests run against `next start` on port 3100, not against the dev server: dev looks at the
working database, and a second `next dev` in the same project cannot be started anyway. The
build takes about ten seconds. The snapshot script refuses to work if `E2E_DATABASE_URL` turns
out to equal `DATABASE_URL` — it drops the schema whole, and picking the wrong database here is
far too expensive.

## Hooks

Installed on their own by `npm install` (husky):

| Hook | What it does |
| --- | --- |
| `pre-commit` | `prettier` and `oxlint` over what is being committed |
| `pre-push` | `npm run lint`, `npm run typecheck` |

**E2E is not in `pre-push` yet, and that is a decision, not a gap.** A suite of one test is not
worth the wait, and a hook that slows you down for nothing starts getting skipped with
`--no-verify` — and after that it is skipped out of habit. Once there are enough scenarios, a
line `npm run e2e` goes into `.husky/pre-push`: it brings the database to the snapshot and
builds the project by itself.

It fails for a reason — fix it. It fails at the wrong moment — `git push --no-verify`. A hook
that cannot be skipped will one day make someone skip it by editing the hook.

Formatting is Prettier configured to the style that grew here (no semicolons, single quotes,
width 100). Generated files and `*.md` are in `.prettierignore`: the first would drift from the
build, the second are wrapped by hand.

## Sign-in

Sign-in with Google on Auth.js. It has no storage: the session lives in an encrypted cookie,
and not a line about the user is left on the server. "My seasons" opens only for signed-in
people.

To make sign-in work locally you need three variables — a template is in `.env.example`, the
values go into `.env.local` (which never reaches git):

```bash
npx auth secret            # writes AUTH_SECRET into .env.local
```

`AUTH_GOOGLE_ID` and `AUTH_GOOGLE_SECRET` come from an OAuth client in the Google Cloud Console
(type Web application). Authorised redirect URIs:

```
http://localhost:3000/api/auth/callback/google
https://<domain>/api/auth/callback/google
```

To check that the server side came up:

```bash
curl http://localhost:3000/api/auth/providers
# {"google":{"id":"google","name":"Google","type":"oidc",…}}
```

## Storage

A season lives as a **row in the database**, and the address holds only the short code of that
row (six characters, a permutation of the bits of its id). There are six tables plus the
account settings:

| Table | What is in it |
| --- | --- |
| `user_settings` | The family for new posters |
| `user_seasons` | Your own seasons: the blank's content, names separately, palette, icons, share link |
| `public_seasons` | Published seasons — **copies**, each with its own permanent address |
| `public_likes`, `public_favorites`, `public_forks` | What a publication has collected from people |
| `public_reports` | Reports: the text, who reported and on whom (the publication's author) |

The content is stored taken apart — as the same positional array the blank has always lived in
(`src/model/codec.ts`), only as `jsonb`. The family names lie **separately** from it: the
uniqueness of a publication is counted by content (there are no duplicates on the showcase),
and the names are not part of that comparison — which is exactly why they can be swapped for
random ones on publication.

A signed-out person has no season in the database at all: their draft lies in the browser's
`localStorage`, one per browser. No account gets more than a hundred seasons, a hundred
favourites and a hundred publications.

```bash
# the connection string is in .env.local, see .env.example
npm run db:status        # what is applied, what is left
npm run db:migrate       # the steps from tools/db/migrations, one per transaction
npm run db:seed          # puts our examples into public_seasons as system seasons
npm run db:reports       # the report queue; -- --block <code> "why" closes a publication
```

The showcase does not hide seasons over reports by itself: the threshold is a reason to look,
and a person makes the decision. A closed publication (`blocked_at`) stays in the database but
is shown nowhere — neither in "Community Ideas" nor by a direct link; the same content cannot
be published again. A publication that has been reported can be taken off the showcase by its
author but not deleted: a report must point at what it was filed against.

Locally the easiest way is to bring the database up in docker:

```bash
docker run -d --name family-season-db \
  -e POSTGRES_PASSWORD=local -e POSTGRES_DB=family_season \
  -p 5432:5432 -v family-season-pgdata:/var/lib/postgresql \
  postgres:18-alpine

# DATABASE_URL=postgres://postgres:local@localhost:5432/family_season
```

The volume is mounted at `/var/lib/postgresql` and **not** at `/var/lib/postgresql/data`: since
version 18 the image keeps its data in a subdirectory named after the version, and it rejects
the old path with an error. To wipe everything including the data —
`docker rm -f family-season-db && docker volume rm family-season-pgdata`.

In production any PostgreSQL will do — Neon or Vercel Postgres, for instance. **The site works
without a database**: the landing page, the examples, the poster, printing and sign-in do not
depend on it. In the account the family and the season list are then empty, with a toast at the
bottom saying it could not be loaded: showing a default instead of the real data would be
lying. Neither a name nor an email is in the database — rows are keyed by an opaque account
key.

The easiest way to see what a dead database looks like is to stop the container and open
`/account`:

```bash
docker stop family-season-db     # the account is empty with a toast, the rest of the site works
docker start family-season-db
```

The server log will then have a line `database query failed` with the call label
(`settings:read:account`), the Postgres code and the reason — none of which goes outward, on
purpose.

## Deployment

Vercel detects Next.js by itself: connect the repository, build with no extra settings. The
`AUTH_*` and `DATABASE_URL` variables are set in the project settings; `AUTH_URL` is not needed
— Vercel supplies the address itself. Variables are picked up by a new build: add one after a
deploy and you need to rebuild.

`GA_ID` is the Google Analytics stream identifier, and it is also the master switch for the
whole consent conversation: empty means no tag, no banner, no "Cookies" link in the footer and
no section in the account. The variable is a server one on purpose (not `NEXT_PUBLIC_`): a
public one is substituted at build time, and turning the tag off without a rebuild would become
impossible.

**The schema is applied to production by hand — it will not appear on its own.** No build step
calls the migration (its failure would take down the deploy of a site that works without a
database anyway):

```bash
vercel env pull --environment=production .env.production.local
node --env-file=.env.production.local tools/db/migrate.mjs
node --env-file=.env.production.local --import tsx tools/db/seed-examples.ts
```

The seed runs after the schema and puts nine system seasons in place — three examples in each
language.

The scripts are called directly rather than through `npm run db:migrate` and `npm run db:seed`:
those mix in `.env.local`, and applying to dev instead of production is far too easy.
`--env-file` is a **node** flag, not a prefix to the command: the shell simply will not
understand `--env-file=… npm run db:seed`, and even if it did, the npm script would still take
its own `.env.local`.

Before connecting, each of them prints the host and the database name — that is the check that
you are going where you meant to.

`output: 'export'` must not be switched on in `next.config.ts`: a static export turns off route
handlers, and the server side is part of the plan.

## Two layers: the blank and the fill

| | Template (the blank) | Fill |
| --- | --- | --- |
| What it is | Everything that prints: headings, the theme of the month, the weeks, the family, projects and goals | Moods by day, project progress, the notes in "How it went" and "Ideas for next month", photos |
| Where it lives | In the season's row (or in the browser's draft) | In a local JSON (`src/data/examples/<id>.json`) |
| Copied by a fork | yes | no |
| Printed | yes | no |

Printing always gives a **blank sheet**: progress scales empty, mood cells empty, the note
fields ("How it went", "Ideas for next month") empty, and an empty space inside the polaroid
frame for gluing in a paper photo. All of it is filled in by hand on paper. The fill exists only
for the examples — to show what a lived month looks like. Which set to show is stated by the
`fill_id` column of a system season: our examples lie on the showcase as the same kind of rows
as people's, only without an author.

## Printing: exactly two A4 pages

The sheet is designed for two pages, two numbered sections on each:

| Page | What is on it |
| --- | --- |
| 1 | The header, "1. Theme of the month", "2. Weeks of the month", "Our goal for the month" |
| 2 | "3. Personal storylines", "4. How our family felt", "Ideas for next month" |

The free space on each page goes inside one block — the field for writing by hand: on the first
that is the "How it went" frame inside the theme of the month, on the second it is "Ideas for
next month". The other blocks keep their web proportions. The layout has been checked against
the worst case — five people and a month of 31 days — and still fits on two sheets. In the print
dialog leave the default margins: the layout is designed for 10 mm margins (`@page` in
`src/styles/print.css`).

## How to use it

1. A clean poster — **New season** in the site header. First you are asked for a name (a default
   is filled in — the month and the theme), and then: signed in, and the season is created in
   your account with the family from your settings; signed out, and the same blank goes into the
   browser as a draft.
2. From an example — a card on the landing page leads to a published season, then **Fork**: the
   copy lands in your "My seasons" (or, signed out, as a draft in the browser) together with the
   theme and the drawings currently on screen.
3. Edit the text right on the poster: click any underlined place. The theme and icon buttons
   float in the bottom right corner and work everywhere — the poster is recoloured whole, theme
   after theme, and the drawings change set after set.
4. **Nothing needs saving.** Your own season writes itself into the database, a draft into the
   browser. The draft's bar has one button about it: "Save to my seasons" for a signed-in
   person (one press and the draft became a season), "Sign in and save" for everyone else —
   signing in returns you to the account with the draft already a row there.
5. **Showing a season** works two ways. The chain-link icon issues a **private link**: the
   poster opens for anyone with no sign-in, they cannot edit it, and the link can be revoked or
   replaced with a new one. The megaphone **publishes a copy to the "Community Ideas"
   showcase** — everyone sees it there; when publishing you can replace the family names with
   random ones.
6. **Fork** is there for your own season too: next month is convenient to build out of the last
   one, and the last one stays where it is.
7. On someone else's published season the left side has a **star** (save it for yourself), a
   **heart** (like) and a **flag** (report — with a comment, which goes to us, not to the
   author).
8. **Printing** — the printer in the right corner of the bar; in the print dialog choose "Save
   as PDF".
9. Put the printout on the fridge and live the season, marking everything by hand.

The star, the like and the report need a sign-in: press one signed out and the poster offers to
do it and brings you back exactly where you were.

"My seasons" has three lists: your own seasons, other people's saved ones and your own
publications with statistics ("in favourites: N", "forks: N"). Your own rows can be renamed (the
pencil) or deleted (the cross); the name is only for the list — it is printed nowhere on the
poster. A publication can be taken off the showcase from there as well: if nobody has saved it,
it disappears altogether, and if somebody has, it stays open by its direct link.

A signed-out person's draft lives **only in their browser** and there is only one — but it is
visible in the same place, in "My seasons": a row with a name, a month and a date that can be
opened, renamed or deleted. Since there is only one, a fork and a new season overwrite the
previous one, and the dialog warns about that in advance, naming exactly what will disappear. It
also offers to sign in — then the previous draft moves into the collection as its first row
instead of being lost.

The mode is visible in the address: `/season/<code>` is viewing, `/season/<code>/edit` is
editing. Both addresses can be bookmarked, sent to yourself and opened in a new tab. The back
and forward buttons work as on any site — there is nothing to lose, the content does not live in
the page.

## What is editable and what is not

Editable (and stored in the season itself):

- the sheet's title and the ribbon motto;
- the month (the ‹ › arrows), the theme's subtitle, the question in the "How it went" block;
- the note captions of the sections, the names and texts of the four weeks;
- the shared goal for the month;
- the family: from 2 to 5 people — a name, a drawing (dad / mum / son / daughter, changed by
  clicking the avatar), a project name, a description, a personal goal;
- the colour theme — **a hundred sets** from the Canva "100 colour combinations" collection
  ("Desert", "Sea wave", "1950s kitchen"…). The floating button in the bottom right corner
  throws the poster into a random other theme, and the name of the current one is visible right
  on it. The chosen theme is kept next to the season (it is not part of the blank), survives a
  fork and prints. On someone else's published season it is tried on and travels into the
  address as a `?p=` marker — so that a link to what you saw can be sent without touching
  someone else's row. A theme is set by the four paints of its set — badges, frames, ink and
  the characters are coloured with them, and there are no other colours on the poster. The theme
  colours the poster only: the site around it is a neutral graphite and never changes;
- the poster's drawings — **twenty sets** of eight ("Classic", "Winter", "Travel", "Pets"…). The
  second floating button throws the poster into a random other set, and three drawings from the
  current one are visible right on it. A set works exactly like a theme: kept next to the
  season, tried on someone else's with `?i=`, survives a fork and prints. There are eight places
  for drawings on the poster and they do not change — what changes is what is drawn in them.

Not editable — this is the frame of the form:

- the numbers and names of the badges ("1. Theme of the month", "Ideas for next month" and so
  on);
- the set of themes (there are exactly a hundred) and the set of drawings (twenty) — you only
  pick from them;
- which paint answers for which section and where the drawings stand on the poster;
- the mood legend, the layout and the order of the sections;
- a person's colour — it is derived from the drawing (dad — blue, mum — pink, son — green,
  daughter — orange);
- the number of weeks (always 4) and the number of days in the month (counted from the month).

## The month fills itself in

A new sheet takes its month from today's date: **before the 10th — the current month, from the
10th — the next one** (the sheet is usually printed in advance). The number of days in the mood
calendar is counted from the month: 28, 29, 30 or 31. The month is switched by hand with the ‹ ›
arrows in edit mode — the days recount themselves.

## Addresses

There is no content in the address. It holds the short code of a row — six characters from
Crockford's alphabet, a permutation of the bits of its id (a Feistel network,
`src/model/shortcode.ts`). The space is exactly 32⁶ = 2³⁰ ≈ 1.07 billion, the permutation is
one-to-one, so collisions do not happen at all, and ids are not reused — the code is permanent.

| Address | Who can open it |
| --- | --- |
| `/season/<code>` | the owner only |
| `/s/<code>` | anyone: it is the showcase |
| `/p/<token>` | anyone who has the link |

The private link's token, unlike a code, is **random** (16 characters, 80 bits): it is revoked
and reissued, whereas a permutation of bits would always give the same answer.

The only other thing that travels in the address is the styling of a published season:
`?p=<theme>&i=<icons>`. It is an override, not content: the row holds its own styling, but
someone who tried another person's poster in their own theme must be able to send a link to what
they see. An unknown value is the same as no value. The id lists are in
`tools/palettes/source.json` and `tools/icons/source.json`.

## Where things are

| What | Where |
| --- | --- |
| The model of the blank and the fill | `src/model/types.ts` |
| The dad / mum / son / daughter avatars | `src/components/AvatarFace.tsx` |
| An empty blank "from scratch" | `src/model/templates.ts` |
| The month default and the day count | `src/model/calendar.ts` |
| The blank's format (packing into an array) | `src/model/codec.ts` |
| Short codes and tokens | `src/model/shortcode.ts` |
| The season's content and names apart | `src/model/season.ts` |
| A signed-out person's draft | `src/model/draft.ts` |
| Example seasons (blank + fill) | `src/data/examples/<lang>/<id>.json`, registry `src/model/examples.ts` |
| Week photos in the examples | `public/examples/<id>/week-N.svg` |
| The blank's permanent captions | `src/model/labels.ts` |
| Sheet state and edit mode | `src/state/SeasonProvider.tsx`, `src/state/useTemplateState.ts` |
| Inline editing of a field | `src/components/edit/EditableText.tsx` |
| The hundred poster themes | `src/model/palettes.ts`, paints in `src/styles/palettes.css` |
| The themes' source and build | `tools/palettes/source.json`, `tools/palettes/build.mjs` |
| The twenty icon sets | `src/model/icons.ts`, drawings in `src/components/doodles/icons.generated.ts` |
| The drawings' source and build | `tools/icons/source.json`, `tools/icons/build.mjs` |
| Site theme, poster recipe, fonts | `src/styles/tokens.css` |
| Sign-in with Google | `src/server/auth.ts`, `src/server/actions.ts` |
| Account settings in the database | `src/server/settings.ts`, schema in `tools/db/migrations/` |
| Your own seasons | `src/model/library.ts`, `src/server/userSeasons.ts` |
| Showcase, likes, reports, favourites | `src/server/publicSeasons.ts` |
| The poster bars | `src/app/[lang]/sheet/DraftBar.tsx`, `src/app/[lang]/season/[code]/OwnBar.tsx`, `src/app/[lang]/s/[code]/PublicBar.tsx` |
| The account: own, favourites, published | `src/app/[lang]/seasons/page.tsx` |
| Printing | `src/styles/print.css` and the `@media print` blocks in the modules |
| E2E tests and the database snapshot | `e2e/`, `playwright.config.ts`, `tools/db/reset-e2e.mjs` |
