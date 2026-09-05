# Project notes (for the agent)

The product description is in `README.md`. What follows is what is easy to break without
knowing the intent.

## Two breeds of season

There are two breeds of season, and they live in different tables:

- a **personal season** (`user_seasons`) — your own collection, invisible from outside, a fork
  always makes a new row, the content can be edited as much as you like;
- a **published season** (`public_seasons`) — an idea put out with a permanent short address,
  likes, reports and favourites. The author is a person or the system (our examples).
  Publishing is a **copy**, not a pointer: there is no link to the personal season at all.

Three things hold up everything else:

- **every poster has exactly one storage.** A signed-in person has a row in the database, a
  signed-out one has a single draft in `localStorage`. The address used to play that role, and
  the ban on `localStorage` protected not against the technology but against two copies drifting
  apart; there is still only one copy.
- **people's names live apart from the content** (`names` next to `content`): the uniqueness of
  a publication is counted by content — the same season with different names cannot be published
  — and swapping exactly `names` is what anonymises a publication.
- **a dead database means "there are no seasons"**: the landing page, a signed-out person's
  draft and printing keep working. Nothing else lives without the database, and there is no need
  to pretend otherwise.

The history of the move from the address to the database is in git (steps E0–E9, August 2026);
what is described here is only today's life.

## The frame: Next.js

A poster comes in three kinds, and they differ by **where the content lies**: a signed-out
person's draft is in `localStorage`, your own season and a published one are rows in the
database. The sheet itself is the same component (`components/Poster.tsx`); the pages around it
differ.

**Every address has the language as its first segment** — `/ru`, `/en`, `/pl` — and the root
layout lives inside `[lang]` (see "Languages"). There are no addresses on the site without a
language: `proxy` supplies it with a redirect. There is one exception — `/api/*`: route
handlers do not get root params.

| Address | What | Rendering |
| --- | --- | --- |
| `/<lang>` | Landing page: what the project is about | Server component |
| `/<lang>/sheet` | The draft from `localStorage`, viewing | `'use client'` + `dynamic(ssr: false)` |
| `/<lang>/sheet/edit` | The same one, editing | same |
| `/<lang>/season/<code>` | Your own season from the database, viewing | Server page + client poster |
| `/<lang>/season/<code>/edit` | The same one, editing; edits write themselves | same |
| `/<lang>/s/<code>` | A published season (our examples included) | same |
| `/<lang>/seasons` | "My seasons", signed-in only | Server component |
| `/<lang>/ideas` | "Community Ideas" — the showcase of published seasons | Server component |
| `/<lang>/month` | The list of months we have written about | Server component |
| `/<lang>/month/<slug>` | What to do as a family in that month | Server component |
| `/<lang>/account` | Account: language, family, sign-out | Server component |
| `/<lang>/privacy` | Privacy policy | Server component |
| `/api/auth/*` | Sign-in: everything Auth.js serves | Route handler |
| `/api/family` | The family for the live poster | Route handler |
| `/<lang>/<anything else>` | Our own 404 page, not the Next stub | Server component |

**The path carries the mode, not a flag.** Viewing and editing are different addresses, and that
holds for all three kinds of poster. Switching is an ordinary link (`next/link` for a season
from the database, so an unwritten edit has time to reach the server from the unmount). There is
no more hand-written `history.pushState`: the content lies either in a row or in `localStorage`,
and remounting the poster loses nothing.

**There is no content in the address.** Neither the blank, nor the theme, nor the icon set: the
address holds the short code of a row (`src/model/shortcode.ts`). The only exception is `?p=`
and `?i=` on a published season: they are a **styling override**, so that someone who tried
another person's poster in their own theme can send a link to what they saw. They carry no
content and do not change the row.

- The bundler is **Turbopack**, the Next 16 default for both `dev` and `build`. Neither a flag
  nor a setting in `next.config.ts` is needed for that; webpack, on the contrary, is switched on
  with `--webpack`. The `vite-plus` line in `package-lock.json` is an optional peer dep of
  oxlint and has nothing to do with the build.
- **`output: 'export'` must not be added.** A static export turns off route handlers, i.e. it
  closes the road to the very backend we need.
- `ssr: false` on the sheet does not get in the backend's way: it only concerns page rendering.
  Route handlers (`src/app/api/*/route.ts`) are an independent server layer and can be added as
  usual. There is no smoke route any more: it only existed until the first real one, and
  `GET /api/auth/providers` plays its part now.
- **Every poster has exactly one storage, and there is never a second copy.** Your own season
  and a published one are rows in the database (`user_seasons`, `public_seasons`), a signed-out
  person's draft is in `localStorage` (`src/model/draft.ts`). Adding columns "month", "theme" or
  "people" next to a row is forbidden — those would be that second copy.
- `src/app/[lang]/sheet/page.tsx` and `src/app/[lang]/sheet/edit/page.tsx` are **server**
  components, but the sheet inside is still loaded with **`ssr: false`** — through the client
  `SheetLoader.tsx`. They had to be split because `next/dynamic` with `ssr: false` cannot be
  called from a server component, while the page does need to read the session: what the draft
  bar offers depends on being signed in. The draft itself still lies in the browser — the server
  has nowhere to take it from — and `location` and storage are available in the sheet's first
  render. The `/season` and `/s` pages are server pages throughout: the content arrives as a
  prop and the poster renders on the server.
- **Next patches `history.pushState`/`replaceState`.** If `data` already holds its internal
  `__NA` field, the patch takes a short path and leaves the router alone: the address changes,
  the React tree stays mounted. Hence the rule: call `replaceState` **with `history.state`** —
  that is what the single remaining place does, the styling override on `/s/<code>`. Pass `null`
  and the call goes through `ACTION_RESTORE`, and the poster may remount.
- The `<div id="root">` wrapper in `layout.tsx` is left over from the Vite version: screen
  padding, `min-height` and the print-check recipe are tied to `#root`. Do not remove it. Inside
  it the root layout draws the site frame: `SiteHeader`, `<main>` with the page and `SiteFooter`
  (`src/components/site/`). For that `#root` became a flex column, and the stretched `main`
  presses the footer to the bottom of short pages.
- **The site frame does not go to paper.** The header and footer are hidden in `@media print`,
  and `#root` and `main` go back to `display: block` there — Chrome slices a flex container into
  pages when printing (see "Printing: two A4 pages"). Hide any new frame element right away.
- In the header, the footer and the landing page, links to site pages are `next/link`, but
  **links into the poster are plain `<a href>`**: the poster pages are client pages and pull
  their own chunk of the bundle, the gain from a soft transition is small and a fresh document
  is more reliable. The exception is the "Edit"/"Done" transition inside your own season: there a
  soft transition is exactly what is needed, otherwise an unwritten edit does not reach the
  server in time.
- Sign-in (`site/LoginButtons.tsx`) is real and **entirely server-side** — see "Sign-in". There
  are three client components in the frame, all of them deliberate: `Toast`, `NewSeasonButton`
  (the "New season" button — it needs a dialog with a name) and `DraftClaimer` (the draft after
  sign-in — it lies in `localStorage` and the server has nowhere to take it from).
- Fonts are `next/font/google` in `layout.tsx`, and the site serves the files itself. Family
  names are hashed, so `tokens.css` substitutes them through the variables `--font-nunito`,
  `--font-caveat`, `--font-marck-script` rather than the string `'Nunito'`. Cyrillic has to be
  named explicitly in `subsets` — css2 picked it up by itself, `next/font` will not guess.
- In `.oxlintrc.json`, `react/only-export-components` is switched off for `src/app/**`: Next
  route files are obliged to export `metadata` next to the component.

## Languages

Three languages: Russian, English and Polish. Russian is the one the site started with and the
reference dictionary; the other two must have exactly the same keys.

| What | Where |
| --- | --- |
| The language list, the cookie, parsing `Accept-Language` | `src/model/lang.ts` |
| The dictionaries | `src/i18n/dict/{ru,en,pl}.ts`, registry in `dict/index.ts` |
| The shape of a dictionary | `src/i18n/types.ts` (`Dict = typeof ru`) |
| Substituting `{n}` and `**bold**` | `src/i18n/fill.ts` |
| Language and dictionary on the server | `src/i18n/server.ts` (`getLang`, `getDict`) |
| Language and dictionary on the client | `src/i18n/LangProvider.tsx`, `src/i18n/context.ts` |
| The language in the address | `src/proxy.ts`, `withLang`/`stripLang` in `model/site.ts` |
| A signed-in person's setting | the `user_settings.language` column, `readLanguage`/`writeLanguage` |
| Writing the detected language to the database | `components/site/LangSync.tsx`, action `rememberLanguage` |
| The switchers | `components/site/LangSwitcher.tsx` (header), `app/[lang]/account/LanguageEditor.tsx` |
| Schema | `tools/db/migrations/005_language.sql` |

### Two different languages, and they must not be confused

- the **interface language** — it captions the header, the buttons, the dialogs and the toasts.
  It stands in the address, is kept in a cookie and, for a signed-in person, in the database as
  well. Taken with `getDict()` on the server and `useDict()` on the client;
- the **season's language** — it captions the sheet itself: the month, the section labels, the
  placeholders of empty fields. It lies in a column next to the content
  (`user_seasons.language`, `public_seasons.language`, the `lang` field of a draft) and **does
  not follow the setting**: switching the site to English does not rewrite someone's Russian
  season. Taken with `usePoster()` from the poster context.

Keeping them apart is mandatory. The on-screen buttons on the poster itself (the month arrows,
"Change the drawing", "Add a person") are interface: they do not go to paper, and a person
editing someone else's season must read them in their own language.

**The language does not go inside `content`.** It lies in a column next to it, like the theme
and the icon set: otherwise we would have to raise the format version (`codec.ts`) and rewrite
every row for a value that has nothing to do with the blank. It is not a third exception to "only
`Template` is printed" — it is not printed, it chooses what to print with.

### The address

The language stands in the address **always, Russian included**: the address is then built the
same on all three, a link opens exactly as its sender saw it, and `[lang]` stays a **root param** —
otherwise `next/root-params` does not work at all and the language would have to be dragged as a
prop through every page.

Hence `src/app/[lang]/layout.tsx` instead of `src/app/layout.tsx`. Everything except `api/` lies
under `[lang]`; addresses are assembled by the builders in `model/site.ts`, which take the
language as their first argument (`seasonHref(lang, code)`, `publicSeasonHref(lang, code)`, …).
`ROUTES` remains a table of paths **without** the language: the path is the same on all three,
and three copies of every address are not needed.

### Who decides which language to show

`proxy` knows only the address, the `fs-lang` cookie and `Accept-Language`, and reads them like
this:

1. the path has a language — let it through and **remember it in the cookie**. That is what "the
   language can be changed by hand in the address" means: the next visit to a bare `/` will lead
   to the same place. This does not touch a signed-in person's setting — that changes only in
   the account;
2. the path has no language — take the cookie, then `Accept-Language`, then Russian, and redirect
   there.

At the same time `proxy` adds two headers to the request: `x-lang-path` (the path without the
language **together with the query** — otherwise the layout has nowhere to redirect to, a server
component does not know its own address, and without the query a redirect would lose the tried-on
styling `?p=`/`?i=` and the state of the lists) and `x-lang-source`: `url` — the language was in
the requested address, `auto` — `proxy` supplied it.

Verified by: `e2e/site/lang.spec.ts` — the switcher goes to the same address without losing the
query or the session.

**`url` and `auto` cannot be told apart by the address alone, and that has already cost
debugging.** After a `proxy` redirect the language stands in the path exactly as if it had been
typed by hand; while `proxy` honestly answered `url` there, the setting from the database **never**
won — a visit to a bare `/` led to the cookie's language and stayed. So `proxy` marks its own
redirect with a one-day `fs-lang-auto` cookie and removes it once it has read it.

**After signing in we come back to the path without a language.** `googleLoginUrl` strips the
language off the return address (`stripLang`), and that is not a detail: returning `/en/ideas` as
it was would say "the person chose English", and someone with a Russian setting would be left on
English — whereas signing in *is* "arriving at the site", where the language comes from the
database. We give back the bare path, `proxy` marks it `auto`, and the setting wins. The page and
the tried-on styling are not lost: `?p=` and `?i=` travel in the same address.

**The setting from the database is stronger than `auto` and weaker than `url`.** The root layout
does the check: signed in, the database language differs from the address language, the source is
`auto` — redirect to the database language. After that it ends by itself: the next request comes
without the marker, the source is `url`, and the cookie becomes equal to the database — so the
visit fixes the cookie too. A hand-typed `/en/...` is not knocked off course by this: its source
is `url`, English is shown, the setting is not changed — but the next visit to `/` will again
lead to the setting's language, as promised.

`proxy` never goes to the database — that is forbidden by the Next documentation and is not
needed.

**The switcher stands in the header, not in the footer.** At first it stood exactly there — "the
language is chosen once, and the header is busy with what is used every day" — and turned out to
be unfindable: for a signed-out person it is the **only** way to change the language, the landing
page is two and a half screens long, and someone who landed on the wrong language simply never
reaches the footer. It is made as a `<details>`: the browser can do the disclosure itself, no JS
is needed, and the site frame does not have to gain a client component.

**The button carries one globe, without the language name, on desktop too.** There are about
ninety free pixels in the header — collected by `margin-right: auto` on the brand — and a
language name does not fit into them: with "Русский" and `Polski` the sign-in button fell onto a
second line, and the row also jumped when the language changed, because three names have three
different widths. The icon is always the same. Which language is current is visible from the page
itself; for a screen reader it is named in `aria-label`, and the full names stand in the menu —
that is where they are needed.

The dropdown menu is part of the site's common ladder of layers: the poster's sticky toolbar 20,
the floating buttons 30, **the language menu 35**, the consent banner 36, the toast 40. A
`z-index` equal to the toolbar's would not do — that one stands later in the markup and won, and
the language list fell out under the season bar.

**A new user's language.** We have no table of people; "creation" is the first `user_settings`
row. It is written by the client `LangSync` in the root layout, in exactly the manner of
`DraftClaimer`: a server component has no right to write to the database while rendering, but a
server action does.

### The dictionary

- **Not a single user-facing string in the markup.** Everything lives in `src/i18n/dict/*`. The
  former rule "strings live in the model so copies do not drift apart" is not broken — the single
  place became the dictionary, and `library.ts`, `community.ts`, `labels.ts` and `accents.ts` kept
  their types, numbers and access, losing only the strings.
- **The shape is derived from Russian**: `Dict = typeof ru`, while `en.ts` and `pl.ts` are
  declared `const en: Dict`. A forgotten key is caught by `npm run typecheck`, not by an eye on
  the seventh screen. There is deliberately no `as const` on the dictionary: it would narrow the
  values to the Russian strings themselves.
- **Values are strings, not functions.** The dictionary travels into client components inside the
  RSC payload (the provider gets it as a prop), and functions do not serialise. Substitution uses
  `{n}` markers and the `fill()` helper. A side benefit: not one language ends up in the client
  bundle, and exactly the needed one travels in the payload.
- **Plurals are avoided with the house trick "Word: N"** ("Лайков: 3", "Likes: 3",
  "Polubienia: 3"). It already stood everywhere there are counters and survives translation
  without declension rules. Do not introduce `Intl.PluralRules` for the sake of one string.
- **There is exactly one piece of markup in the dictionary — `**bold**`,** and only on
  `/privacy`: the meaning there rests on the emphasised words, and cutting them into separate keys
  means handing the translator pieces a phrase cannot be assembled from. Parsed by `marked()`.
- **There are two month lists per language.** `months` is the nominative, captioning the sheet;
  `monthsOf` is the genitive, for dates ("27 августа", "27 sierpnia"). In English they coincide,
  and that is not sloppiness. Whether a month is written in lower case inside a sentence is
  decided by the `monthLowercaseInText` flag: a third list of twelve words is not needed.
- **The labels of a hundred themes and twenty icon sets are translated** — they are visible on
  the floating buttons. They lie in `tools/palettes/source.json` and `tools/icons/source.json` as
  a `{ru, en, pl}` object and are compiled into the registries; the build checks that no language
  is forgotten.
- **The language names in the switcher are not translated**: they are read by someone who cannot
  yet see the language they need, and "польский" will not help them while `Polski` will
  (`LANG_LABELS`).
- **The product's house vocabulary is translated deliberately and consistently:** сезон — season
  / sezon, постер — poster / plakat, недели — weeks / tygodnie, сюжетные линии — storylines /
  własne projekty, финал — wrap-up / podsumowanie, анонс — next up / na przyszły miesiąc. Write
  new text in these words, or the second translator will diverge from the first.

### What else became language-dependent

- **A publication lives only in its own language.** Both the showcase (`randomIdeas(lang)`) and a
  direct link: `/en/s/<code of a Russian season>` answers "no such season" rather than showing a
  Russian sheet in an English frame. An idea is taken to be read, and there is no point showing
  it to someone who will not read it.

  Hence a rule that is easy to break: **every link to `/s/` is built with the season's language,
  not the viewer's.** There are five such places — the showcase preview, the account row
  ("Favourites" and "Published" can be in another language), the transition after publishing (the
  language is chosen in the dialog and may differ from the interface) and the link to a duplicate
  in the same dialog. Take `useLang()` and you get a 404 on your own publication.

  The price is accepted deliberately: a link that was sent will not open for someone whom `proxy`
  takes to another language. This does **not** apply to your own seasons (`/season/<code>`) or
  private links (`/p/<token>`): the owner is looking at their own, and the recipient of a private
  link is most often on another language entirely, so locking it would break the very case it
  exists for.
- **The uniqueness of a publication is counted together with the language**: `content_key` is now
  `md5(language || content::text)`. The same blank translated into another language is a
  different idea: other people see it, and rejecting it as a duplicate would lock the showcase
  behind whoever was first. Hence the language list in the publish dialog: changing the language
  **recomputes** the showcase's answer rather than repainting a button.
- **Anonymising takes names from the season's language** (`anonymousNames(count, lang)`): Russian
  names in a Polish season would give away something other than what the person was hiding.
- **The examples are translated whole** — one file per language per example
  (`src/data/examples/<lang>/demo-N.json`), the fill layer included. Every one of them is a
  showcase row of its own, not one row with three captions. The row numbers are set by the
  `PUBLIC_IDS` table rather than by order: a short code is a permutation of an id, it is promised
  to be permanent, and neither a new language nor a new example has any right to shift codes
  already handed out. The week photographs are shared between the languages: there is not a word
  in them, so one drawing serves all three.
- **Examples and people's publications draw ids from one column, so the examples get a block of
  their own.** `public_seasons.id` is `generated by default as identity`: a publication takes the
  next value from the sequence, an example is written with the id spelled out in `PUBLIC_IDS`, and
  an explicit id does not move the sequence. Give a new example a low id and it lands on somebody's
  season — the seed upserts, so `on conflict (id) do update` replaces their content and leaves
  their name on the row. That has happened once, on a real publication. Hence `SYSTEM_ID_BASE`:
  everything new is numbered from **1 000 001**. The first three examples stay at 1..9 because
  their codes are out in the world; a short code is a permutation of thirty bits, so a million is
  nowhere near the ceiling.
- **The seed keeps the sequence below that block.** It ends with `setval`, and that used to follow
  `max(id)` over the whole table — right while the examples sat at 1..9, fatal with a block above:
  the sequence would park at the top of the block and hand the next publication an id an example
  owns. It now looks only at `id < SYSTEM_ID_BASE`, which is 9 on a fresh database and a person's
  own highest id once anyone has published.
- **The seed refuses to write over a publication.** Before each upsert it checks for a row with
  that id and an `author_key`, and throws with the id and the account. A wrong number in
  `PUBLIC_IDS` is a mistake in the table, not something to write through.
- **Moving an example to another id means deleting its old row by hand first.** `content_key` is
  unique, so the same content under a new id collides with the row still standing under the old
  one, and the seed stops half-way. The seed does not delete anything by itself: a script that
  removes seasons is too sharp a tool to keep loaded.
- **An adaptation is not a translation, and the shared photograph decides how far it can go.**
  The forest example goes mushrooming in all three languages, though picking mushrooms is a Russian
  and Polish habit far more than an English one: the week carries a drawing of a basket of
  mushrooms, and the drawing is one for all three. Where a week has no photograph the wording is
  free to move with the country; where it has one, the three languages must be telling the same
  story.
- **`localeCompare` takes the list's language**, not a hard-wired `'ru'`.
- **The fonts ask for `latin-ext`**: without it the Polish `ą ę ł ń ś ź ż` fall back to another
  font and the sheet prints in two typefaces at once. Subset lists in `next/font` must be
  literals — three calls cannot share a constant, the build fails.
- **Printing is checked in every language.** The field limits (`limits.ts`) were measured for
  Russian, while labels and months differ per language; `longestMonth(lang)` is a spacer for the
  heading, one per language ("Сентябрь", `September`, `Październik`).

### What languages do not have

- **No auto-translation of content.** A season is written in the language it was written in; we
  translate the interface and our own examples, not other people's posters.
- **No language inside `Template`** — see above.
- **No separate domain or subdomain per language.** One site, one address, the language is a path
  segment.

## The main invariant: two layers

- `Template` — the blank. **Only it is printed and only it is stored in `content`.**
- The colour theme and the icon set are **deliberate exceptions**: they print, but they are not
  part of the blank and live in their own columns next to it. Duplicating them inside `content`
  as well is forbidden: two copies of one value are bound to drift apart. There must not be a
  third such exception.
- `FillState` — the fill (moods, percentages, the notes in the summary and the ideas, photo
  paths). It is not stored, not copied by a fork, does not print — it exists only for the
  examples. A system season has a `fill_id` next to it, and the data itself is in the repository
  (`src/data/examples/<id>.json`, registry in `src/model/examples.ts`).

From this follow rules that must not be broken along the way:

- project progress in the blank is **0**, the mood cells are **empty**, "How it went" and "Ideas
  for next month" are **empty**; all of it is filled in with a pen on paper;
- any new field must be consciously assigned to one of the layers. It prints → `Template`. It is
  written by hand → `FillState`;
- week photos are shown only from `FillState.photos`; the blank always has an empty frame for
  gluing one in. There is no need to add `photoSrc` back to the template — that is a decision,
  not a gap. The space for gluing (`.placeholder`) is drawn **always**, and a photo lies on top
  of it: in printing the photo is hidden, and the frame must look exactly like the one on a week
  without a photograph.

## The month

`src/model/calendar.ts`. The month is stored as numbers (`year`, `monthIndex`), the name comes
from the dictionary of the **season's** language (`monthName(month, lang)`), and the number of
days comes from `daysInMonth`. There is no separate "days in the month" field and there must not
be one. A new sheet gets its month from `pickTargetMonth`: before the 10th (`MONTH_SWITCH_DAY`)
the current one, from the 10th the next one. It is switched by hand with the arrows in
`MonthTheme`.

The width of the month heading is held by a hidden spacer with the longest name
(`longestMonth(lang)`, a stack in one grid cell): without it the line changes length when the
month is switched and the arrows jump left and right. The name is centred inside that fixed
width, so short months ("Май") leave air before the arrows — that is intended.

## Address and storage

The address no longer carries content. It holds the short code of a row, and the poster itself
lies where it belongs: in the database for a signed-in person, in the browser for a signed-out
one.

| Kind of poster | Where the content is | Address |
| --- | --- | --- |
| Draft | `localStorage`, one per browser (`src/model/draft.ts`) | `/<lang>/sheet`, `/<lang>/sheet/edit` |
| Your own season | a `user_seasons` row | `/<lang>/season/<code>`, `…/edit` |
| The same one by private link | the same row, viewing only | `/<lang>/p/<token>` |
| Published | a `public_seasons` row | `/<lang>/s/<code>` |

- **A code is a permutation of the bits of an id** (`src/model/shortcode.ts`): six base32
  characters over 2^30 ≈ 1.07 billion rows, a Feistel network on two 15-bit halves. It is
  one-to-one, so collisions do not happen at all, and ids are not reused — a code is permanent.
  Each table has its own key and they must not be changed: codes that have been handed out live
  forever. There is deliberately no inverse transform — a row is looked up by its own `code`
  column.
- **The private link's token is random, not derived from the id.** It is the only address that
  can be **revoked**: issue a new link and the previous one stops working that same instant. A
  permutation of bits cannot do that, it always gives the same answer. Hence the length: sixteen
  characters, eighty bits — guessing a code is not frightening, it is public anyway, but a token
  must not be guessable.
- **`?p=` and `?i=` on a published season are a styling override, not content.** The theme and
  the icon set are kept in the row, but someone who tried another person's poster in their own
  theme must be able to send a link to what they see. The markers lie in the **query**, not in
  the hash: a hash never reaches the server, and a link that was sent would open in the other
  person's theme first and then repaint. The override does not touch the row.
- **The content is stored taken apart**: `content` is the output of `pack()` from `codec.ts`,
  `names` is a separate array of people's names (see `src/model/season.ts`). The format is still
  known to `codec.ts` alone; columns "month", "theme" or "people" must not be added next to it. A
  `language` column next to it is allowed and needed: like the theme and the icons, it is
  styling, not content (see "Languages").
- **The names were taken out of the content not for beauty.** The uniqueness of a publication is
  counted by content: a season with only the names changed is the same season. Anonymising on
  publication comes from the same place: exactly `names` has to be swapped.
- Everything that comes from outside — from the database, from `localStorage`, from a form — goes
  through `normalizeTemplate`: 2..5 people, exactly 4 weeks, the month within range, strings
  trimmed.
- There is no more compression or base64 in `codec.ts`: they were needed only while the blank
  travelled in the address bar. The same array goes into the database, but as `jsonb`.

**There is no more hand-written history.** No `pushState` with markers, no `popstate`/
`hashchange`, no transition counter: moves between viewing and editing are ordinary links, and
the content survives remounting because it does not live in the component. The "Navigation
history" section about that machinery was deleted along with it.

## Colour themes

A hundred poster themes, the Canva "100 colour combinations" collection, four paints per set.
There is nothing on the poster except those four paints, their shades, black and white.

| What | Where |
| --- | --- |
| Source: id, label, four hex values | `tools/palettes/source.json` |
| Build | `tools/palettes/build.mjs` (`npm run palettes`) |
| Theme paints (generated) | `src/styles/palettes.css` |
| Registry of ids and labels (generated) | `src/model/palettes.data.ts` |
| Choosing a theme, the default one, a random one | `src/model/palettes.ts` |
| The site theme and the handing out of roles | `src/styles/tokens.css` |

The chosen theme lies not in the blank but in its own column next to it (for a draft, in its own
field in the browser record). It survives a fork, it prints, and on someone else's published
season it is tried on and travels into the address as `?p=` — see "Address and storage".

- **The site theme is separate, neutral and does not switch.** It is declared in `:root` with the
  same role names as the poster theme (graphite and white), so the landing page, assembled from
  the same `SectionBox` and `Badge`, draws itself. A poster of any of the hundred sets may stand
  next to it — the site must neither argue with it nor pretend to be part of it. It has no
  switcher and does not need one.
- **Generated files are not edited by hand.** Change `source.json`, then `npm run palettes`. All
  the picking lives in `build.mjs` too: sorting the paints, the contrast of text on a badge, the
  dark shades. That is what CSS cannot do — the rest is derived in `tokens.css`.
- **The four paints of a set are sorted by lightness**, from the dark `--c1` to the light `--c4`.
  The ladder is constant across all themes, so the "deep" role (heading, ribbon, sheet frame) is
  everywhere the darkest, and the sheet does not fall apart on a random set.
- **A badge is painted with the paint as it is, while its frame and heading take its dark shade**
  (`--d1..--d4`, lightness no higher than 0.45: on white only such a shade holds its shape).
  That is why badges come out both dark and light — and that is what makes the themes different.
- **The colour of text on a badge is computed, not assigned.** `--on-c1..4` is white or ink, by
  contrast with the paint (threshold 4:1, `build.mjs`). Do not replace them with white "for
  consistency": a set may contain both `#FFFFFF` and lemon yellow. The thin frame on a badge
  (`Badge.module.css`) is there exactly for light paints — without it they dissolve into the
  paper.
- **Roles, not colours.** `--accent-<slot>` is the dark shade (frames, headings), `--badge-<slot>`
  is the paint (the badge fill), `--on-<slot>` is the text on it. Slots: `deep`/`projects` → 1,
  `theme` → 2, `weeks` → 3, `goal` → 4; people take the same four tones in the order of their
  drawings.
- **The recipe must lie on the same element as the paints.** A `var()` inside a custom property
  is substituted where the property is declared, so "recipe in `:root`, paints in the themes"
  would compute everything from the neutral `:root` paints. Hence the `[data-palette]` block in
  `tokens.css` — it matches any element with a theme.
- **The backgrounds are white — on paper and on screen.** `--paper`, `--surface` and
  `--photo-frame` are all `#fff`; colour is carried by badges, frames and ink. The only coloured
  fill is a personal project card (`ProjectsSection.module.css`, 10 % of the person's colour): it
  prints and looks the same on screen. Do not "bring the saturation back" to the backgrounds and
  do not add new fills — that is a regression, not decoration (see principle 3).
- **There is no separate print palette any more.** `print.css` used to reset the backgrounds to
  white; now there is nothing to reset, and substituting tokens in `@media print` is not needed.
- **Moods are excluded from the themes.** `--mood-good|ok|bad` is a traffic light: "good" must be
  green in any theme, otherwise the legend has to be read. These are the only colours outside the
  four paints, and there is no need to add them to a theme.
- **The theme lives on the poster itself, not on the page.** The attribute is set by `PaperSheet`
  through the `palette` prop (passed by `Poster`, which reads the theme from `useDoc`), so the
  site around the poster — header, toolbar, footer, buttons, page background, landing page —
  **never** changes its colours. Do not move the attribute onto `<html>`: the theme would then
  leak across the whole site and the page background would jump on every switch. A side benefit:
  the attribute is drawn by React, so when the poster unmounts the theme goes with it — nothing
  to clean up and nothing to flash on load.
- **Selectors go by attribute** (`[data-palette='desert']`), with no tie to `:root`: custom
  properties are inherited, so the nearest ancestor wins. Thanks to that the swatch on the theme
  button and the strip of themes on the landing page are each painted in their own theme, and the
  paints are duplicated nowhere. The attribute hangs on the swatch itself, not on the button: the
  swatch shows the paints, while the frame and the label stay in site colours.
- **The example cards on the landing page do not carry a theme** — they are part of the site. An
  example's theme is visible when you open it.
- **There is deliberately no dark theme.** Web and print are one layout, and a dark sheet eats the
  cartridge; to have a dark theme we would have to build a separate print palette and break
  principle 3. Dark Canva sets give dark badges on white paper — that is not the same thing as a
  dark sheet.
- A person's colour is derived from their drawing straight into `var(--person-${face})` — the
  `ACCENT_BY_FACE` table is gone and does not need to come back.
- **The switcher throws you into a random theme rather than walking the list.** Stepping through a
  hundred sets one by one is pointless, and neighbours in the list are often alike; the current
  theme is excluded from the choice, otherwise a click sometimes "does nothing"
  (`randomPalette`). The switcher (`src/components/edit/PaletteSwitcher.tsx`) is visible in **all
  three states of the poster**, an example included: the theme is not part of the blank, it is
  carried by `p=`, and `p=` already beats the `palette` key from `src/data/examples/<id>.json`.
  Changing an example's theme is not an edit, and a fork is not needed for it.
- **The theme button is floating, not part of the toolbar.** Since it depends on none of the
  three states, it has no business among buttons that do: `App.tsx` draws it next to `Toolbar`,
  and `position: fixed` keeps it in the bottom right corner of the window while the poster is
  scrolled. Its `z-index` is above the sticky toolbar, otherwise it dives under it at the top of
  the page; on a narrow screen the theme name is hidden and only the swatch remains.

## Icon sets

Twenty sets of eight drawings; the library holds forty, and the same drawing stands in different
sets and even in different slots of one set.

| What | Where |
| --- | --- |
| Source: forty drawings, slots and set compositions | `tools/icons/source.json` |
| Build | `tools/icons/build.mjs` (`npm run icons`) |
| Drawing geometry (generated) | `src/components/doodles/icons.generated.ts` |
| Set registry (generated) | `src/model/icons.data.ts` |
| Choosing a set, the default one, a random one | `src/model/icons.ts` |
| The renderer and the slot | `src/components/doodles/Icon.tsx`, `PosterIcon.tsx` |
| The set on the poster | `src/components/doodles/iconSetContext.ts` |

A set lies not in the blank but in its own column next to it. It survives a fork, it prints and
it is tried on with the `?i=` marker — exactly like a theme.

- **A slot is a place in the layout, not a drawing.** There are eight: `mark` and `love` in the
  header, `voice` and `spark` in the theme of the month, `path` in the storylines, `goal` and
  `care` at the goal of the month, `idea` in the next-up block. A section asks for a slot and the
  set puts a drawing into it — which is why changing the set touches neither the layout nor the
  sections. A new place for a drawing means a new slot in `source.json` and a line in each of the
  twenty sets; the build will not let you forget one.
- **All drawings sit on one `0 0 64 64` grid.** Otherwise substitution would change the
  proportions of the place: the slot sets the size, and any drawing must fit into someone else's
  place. Slot sizes are picked so that a drawing takes roughly the same piece of paper as the
  doodle did before the sets appeared — which is why printing stayed at two pages.
- **A set travels through context, not as an attribute on paper.** CSS hands out a theme through
  `data-palette`, but SVG geometry cannot be substituted with an attribute. The provider stands in
  `Poster` (`src/components/Poster.tsx`) around `PaperSheet`, so the site around the poster never
  changes its drawings, and the context's default value is a real one: a poster also exists
  without a provider (`/seasons` draws `PaperSheet` without a `palette`).
- **Generated files are not edited by hand.** Change `source.json`, then `npm run icons`. Unlike
  the themes there is nothing to compute — but there is something to check, and that is what the
  build exists for: a set has exactly eight slots, every drawing name exists, no drawing is left
  out of the sets, ids do not repeat. Spotting that by eye across twenty sets is impossible, and
  the price of a mistake is a hole on the poster instead of a drawing.
- **A small slot needs a different stroke.** `spark` is drawn at 18 px: the common stroke of 2.3
  on a grid of 64 gives 0.65 screen pixels there — a grey cobweb. So such drawings have their own
  `stroke` and `fill` in the source, as the old star did. Do not "bring them to a single
  thickness" — they are the smallest things on the poster.
- **The switcher throws you into a random set rather than walking the list** — for the same
  reasons as the themes, and the current one is excluded from the choice (`randomIconSet`). It is
  visible in **all three states of the poster**, an example included: a set is not part of the
  blank, it is carried by `i=`, and `i=` already beats the `icons` key from
  `src/data/examples/<id>.json`.
- **Both floating buttons live in a common wrapper** `FloatingControls`: the position and
  `z-index` are on it, not on the buttons. Two independent `position: fixed` elements would have
  to be spread apart with hand-picked `bottom` values — and repeated in every media query.
- **The swatch on the button shows three drawings, not one**: a set is a selection, and it cannot
  be recognised from one icon any more than a theme can from one paint. It is painted in site
  colours: drawings differ by shape, their paint comes from the poster's theme, and it has no
  business on the button. It is drawn by `Icon` directly — the button lives outside the poster,
  it has nowhere to take the set from and no need to: it is showing the set itself.

## Sign-in

Sign-in with Google on Auth.js (`next-auth@5`, beta — that is its normal state).

| What | Where |
| --- | --- |
| Configuration, `auth`/`signIn`/`signOut`/`handlers` | `src/server/auth.ts` |
| Server actions for signing in and out | `src/server/actions.ts` |
| The Auth.js route handler | `src/app/api/auth/[...nextauth]/route.ts` |
| The button and the right corner of the header | `src/components/site/LoginButtons.tsx` |
| The account gate | `src/app/[lang]/seasons/page.tsx` |
| Variable template | `.env.example` (values in `.env.local`) |

- **There is no database adapter, and that is not a gap.** It is not connected, so Auth.js keeps
  the session in an encrypted cookie (the JWT strategy) and not a line about the user is left on
  the server — the name and the email live only in the reader's cookie, and they are not in the
  database even now that their seasons are. What exactly is stored is written on `/seasons` and
  `/privacy`; those texts have already survived two such changes (the settings table, then the
  collection) and are **edited by the same change** as the storage, otherwise the site starts
  lying about itself. `/privacy` is not decoration either: without its address Google will not
  let sign-in out of Testing mode into production (app name, support email, homepage URL and
  privacy policy URL are required; ToS is not).
- **Postgres was not needed for sign-in and still is not.** The database is needed by the "Save"
  button, not by the login; sign-in was therefore built as a separate change, before it. The
  adapter can still be added **alongside**: Auth.js keeps the JWT together with it, and the
  strategy will not have to change.
- **`proxy.ts` is not a line of defence** (in Next 16 that is what `middleware.ts` is now
  called). The sign-in check stands in the `/seasons` server component — that is the check at the
  data source; per the Next documentation a proxy is only an optimistic guess. The file does
  exist in the project, but it does exactly one thing — **it puts the language in the address**
  (see "Languages"): that is its proper job, and the Next documentation suggests doing it exactly
  there. Neither the session nor the database is in it, and neither must be.
- **A signed-out person is not redirected away.** `/seasons` is in the header, and the address
  must open. The list is the same one, only short — there is one draft in the browser — and the
  emptiness is explained by a single phrase covering both roles (`EMPTY_LIST` in `library.ts`).
  There is no separate `/login` page and there must not be one; there is no sign-in button on
  `/seasons` either — the season-creation dialog talks about signing in when it comes to that,
  and a sermon on an empty page added nothing.
- **Sign-in is a server action, not `useSession`.** Not a line of Auth.js reaches the browser,
  `SessionProvider` is not needed, there is no flicker of state. Do not move sign-in to the
  Auth.js client hooks — that would cancel all of the above at once.
- **After signing in a person stays where they were.** The return address is assembled by
  `GoogleLoginButton` (`location.pathname + search + hash`) and handed to the action as an
  argument: the tried-on styling lives in `?p=` and `?i=`, and with a constant `redirectTo` a
  person would come back from Google to the wrong poster. The whole address survives the trip
  through Google — Auth.js puts it in the `authjs.callback-url` cookie (verified).
- **The browser takes you to Google, not the Next router.** `googleLoginUrl` is the only sign-in
  action that **does not redirect but returns an address**; `location.href` in
  `GoogleLoginButton` follows it. `redirect()` to a foreign origin worked, but the Next router
  first asked `accounts.google.com` for an RSC response, caught a CORS refusal and only then fell
  back to an ordinary navigation — with "Failed to fetch RSC payload …" in the console on every
  sign-in. The `state` and PKCE cookies do not suffer from this: `signIn` itself sets them
  through `cookies()`.
- **There is one sign-in button for the whole site** (`GoogleLoginButton`), and its label is a
  prop: "Sign in with Google" in the header, the same in the `LoginDialog`, and "Sign in again"
  in the stale-session blocks on `/seasons` and `/account`. They no longer have their own forms
  with a server action: there must be one path to signing in, otherwise half the places will keep
  going through the router.
- **`returnTo` comes from the browser, so it is checked** (`safeReturnTo` in `actions.ts`): only a
  relative path, and `//host` is rejected — otherwise sign-in would turn into an open redirect to
  someone else's site.
- **The price: the root layout became dynamic.** `LoginButtons` reads a cookie, the layout is
  shared, so not a single route is served as static any more (in the `next build` output every
  route is marked `ƒ`). Accepted deliberately: there are no heavy queries on the site, and the
  alternative is to drag the session to the client, i.e. to cancel the previous point.
- **The data set is the provider default** (`openid email profile`); we do not override
  `authorization.params`: the name and the email do not travel beyond the cookie anyway.
- **The session carries an `accountKey`** — `provider:id`, set by the `jwt`/`session` callbacks.
  That is the name of a row in the settings table (see "Settings and the database"); the types are
  extended in `src/server/next-auth.d.ts`.
- **The keys are read by provider name.** `AUTH_GOOGLE_ID`/`AUTH_GOOGLE_SECRET` are not mentioned
  in the config — Auth.js finds them itself; `auth.ts` is therefore empty on that point, and that
  is not forgetfulness.
- **A second provider is a line in `providers` and a button in `LoginButtons`.** The mark is
  drawn as inline SVG, like `GoogleMark`: there are no raster images in the project. We do not
  show the user's avatar — a foreign domain would require `images.remotePatterns` in an empty
  `next.config.ts`.
- The sign-in buttons live inside `.wrap`, which is already hidden in `@media print` — add new
  elements there too (the rule "the site frame does not go to paper").

## Settings and the database

The first table in PostgreSQL: `user_settings`. It holds three settings — the interface language
(see "Languages"), the family for new posters and the answer about analytics (see "Consent and
analytics"). The other two tables are covered in "My seasons"; the layer shared by all three
(`db.ts`, logging, the toast, applying the schema) is described here.

| What | Where |
| --- | --- |
| The connection pool, "a query that does not throw" | `src/server/db.ts` |
| Server logging | `src/server/logger.ts` |
| Reading and writing settings | `src/server/settings.ts` |
| The family model: type, normalisation, blank by family | `src/model/family.ts` |
| Schema and applying it | `tools/db/migrations/*.sql`, `tools/db/migrate.mjs`, `npm run db:migrate` |
| The account page | `src/app/[lang]/account/page.tsx` |
| The server-error toast | `src/components/site/Toast.tsx` |
| The family editor (client) | `src/app/[lang]/account/FamilyEditor.tsx` |
| The family for the live poster | `src/app/api/family/route.ts`, `src/state/useFamilyPreset.ts` |
| The button and the swap dialog | `src/components/edit/FamilySwap.tsx` |
| Connection string | `DATABASE_URL` in `.env.local`, template in `.env.example` |

- **There is no poster in `user_settings`** — the language, the analytics answer and from two to
  five "face — name" pairs. The language and the family are written by **different statements**
  (`writeFamily`, `writeLanguage`): a shared upsert would need both values at once, and whoever
  changed the language would overwrite the family with what was read before the edit. Poster
  addresses live in other tables, see "My seasons" and "The showcase: publishing".
- **The family has two routes to the poster, and they must not be confused.** Into a **new**
  season it travels when the row is created — the blank is assembled on the server, before it is
  opened. Into an **already open** (forked) one it cannot be put that way: the poster is live, and
  only it can change the people in itself. Hence `GET /api/family` and `useFamilyPreset`, with the
  swap itself being the `replacePeople` mutator in `useTemplateState`.
- **The request for the family goes out only in edit mode.** Elsewhere there is nowhere to put it.
  Silence from the server (not signed in, quiet database, no setting) is `null` and means "there
  will be no button": the poster must work without the server, just without that button.
- **The swap keeps the card content by position** — only the drawing and the name change. People
  fork for the ideas but change the cast. Extra cards are dropped, missing ones added empty;
  `templateForFamily` will not do — it would return the whole empty blank and wipe the theme, the
  weeks and the goal.
- **All dialogs share one wrapper** (see "Modal dialogs"). The swap wipes the names and, with a
  smaller family, drops cards together with their projects, so confirmation is mandatory: the
  dialog shows both families as lists and the loss of cards in a warning frame.
- **The setting reaches the poster by an action, not by a link.** "New season" for a signed-in
  person is the `createSeason` server action: it assembles the blank from the family
  (`templateForFamily`), creates the row and takes the person into it. The blank used to be encoded
  in the button's `href`; now it belongs in the database, and the poster still knows nothing about
  the database.
- **A signed-out person gets a draft.** No row, no settings: the season lands in the browser as an
  empty blank and the person goes to `/sheet/edit`.
- **"New season" is one button for the whole site** (`NewSeasonAction.tsx` — a server wrapper that
  reads the session; `NewSeasonButton.tsx` — the client button with the dialog). It stands in the
  header, the account, the landing page, "Ideas", `/account` and `/privacy`: one conversation,
  different labels. **The name is asked before creation, for both roles** — a signed-in person used
  to get a row silently, a signed-out one silently opened the previous draft. The price: without JS
  the button stopped working for a signed-in person (it was `<form action={createSeason}>`).
  Accepted deliberately: there is no dialog with a name without JS.
- **The default name is computed on the client and does not need the family.**
  `defaultSeasonTitle` reads only the blank's `theme`, and the family lives in `people`. That also
  removes the "today" disagreement between server and browser: a new blank's month depends on the
  date (`pickTargetMonth`).
- **There is deliberately no table of users.** A row is named by `accountKey` — `provider:id` from
  the session (set by the `jwt` callback). Neither the name from Google nor the email is in the
  database. The key is specifically not the email: emails change and the settings would be lost.
- **`token.sub` must not be substituted for `accountKey`.** It looks like a fix for sessions issued
  before the key appeared, but without a database adapter Auth.js puts a random UUID into `sub`
  that lives until the session ends: the settings would be found today and gone at the next
  sign-in. Verified on a live session. So an old session has no key, `familyState` returns `stale`,
  and the account asks the person to sign in again — once.
- **Family members' names are personal data, and they are in the database.** `/privacy` describes
  this literally, including that a person types the names themselves and may not type them at all.
- **Reading the session in the header is outside `try/catch`.** `auth()` touches cookies, and Next
  reports "this route must be dynamic" with an exception; swallowing it would fill the build with a
  log line and stop the router from marking the route. Only the encoding is wrapped.
- **The site must work with a dead database.** The landing page, the examples, the poster, printing
  and sign-in do not depend on it: `query` does not throw, `readFamily` returns `null`, the header
  quietly falls back on the "New season" link. Do not add queries that bring a page down.
- **A server error is shown one way across the site: a toast plus emptiness where the data should
  be.** `Toast` says what happened, and a block with nothing to show is not drawn. No stub pages
  per failure, no `error.tsx` per segment, no soft "try again later" plates: the first multiplies
  with every screen, the last lies — a default passes itself off as real settings, and "Save" on
  top of it is an `upsert` that overwrites what was never read.
- **`Toast` is one of the three client components in the site frame** (the others are
  `NewSeasonButton` and `DraftClaimer`): the message must go away by itself and close on a button.
  It can be drawn by a server component (the page knows at render time) or by a client one (a
  refusal came in reply to an action). A repeated refusal is shown again only with a changed `key`
  — hence the timestamp next to the status: the `error` string does not change on a second failure
  in a row and the toast would not remount.
- **"Does not throw" does not mean "says nothing".** `query` returns a tagged result: `ok` with
  rows, `unconfigured` (no `DATABASE_URL`) or `failed` (no answer). Keeping those apart is
  mandatory — they are fixed differently, and folded into one `null` they are indistinguishable in
  the log. The discriminant is a string, not `ok: boolean`: `strict` is off in `tsconfig` and
  TypeScript does not narrow a boolean union. **That difference does not go outward:**
  `familyState` and `writeFamily` collapse both into one `error` status.
- **The log is the only trace of a failure, and it must answer "what to fix".** The `catch` prints
  `error.code` (`42P01` — the schema was not applied, `28P01` — the password,
  `ENOTFOUND`/`ETIMEDOUT` — the network) and the stack, and the first argument of `query` is a call
  label (`settings:read`, `settings:read:account`, `settings:write`). The SQL is **not** logged:
  values would travel with it, and among them people's names. The "no `DATABASE_URL`" case is
  logged **once per process** — otherwise a line would be added on every header render and would
  drown the real errors.
- **`AggregateError` is unwrapped by hand.** A failed connection arrives as exactly that: empty
  `message`, useless stack, and the real causes in `errors`, one per address the host resolves to.
  Without `describe()` the log kept the line "AggregateError:" and nothing else.
- **Reading is wrapped in `cache()` from React.** Within one request both the header and the
  account ask for the family; the query must go out once. The cache does not live between requests,
  and that is right: the setting could have changed in another tab. The account therefore reads the
  uncached `familyState`: it needs a fresh answer right after a write, and the reason for the
  emptiness ("not signed in" and "the database is quiet" are different things).
- **The account is a page, not a dropdown in the header.** A dropdown would become the first client
  component in the site frame and would run into a page anyway once there was more than one
  setting. The name in the header is a link to it, and "Sign out" moved inside: signing out is an
  action on an account, not a section of the site.
- **The family editor repeats the poster's manner** — a click on a drawing cycles the character,
  the name is edited in place, "×" removes, "+" adds. This is the **first client component of the
  site outside the poster**, and it is deliberate: without JS every click would cost a page reload.
  `ProjectsSection` cannot be reused — it is tied to `useDoc`, i.e. to a poster document the
  account does not have.
- **The family travels as an action argument, not as form fields.** Not taste: React encodes a form
  submitted from a client component under its own names (`_1_name` instead of `name`), and
  `formData.getAll('name')` on the server silently returns nothing — the request goes out and
  nothing appears in the database. React serialises an argument itself. We still do not trust what
  arrives: `normalizeFamily` in `saveFamily` cuts the bounds, the faces and the name lengths.
  Success and failure diverge deliberately: **success travels as a marker in the address**
  (`?ok=1`), because it must survive a reload, while **failure comes back as a value** and is shown
  as a toast — a redirect would redraw the account from scratch, and the server does not have the
  typed family. Hence `useActionState` in the editor, which also cleans `?ok=1` out with
  `replaceState` after the first render: otherwise a reload would show "Saved ✓" an hour later.
- **The editor is keyed by the family from the server** (`key={JSON.stringify(family)}`): after a
  save new data arrives and it must start from that.
- **If the family was not read, the editor is not shown.** Its place is empty and the toast
  explains why. Otherwise it would show a default instead of the real settings, and "Save" is an
  `upsert`: it would overwrite what we never saw.
- **The schema is applied to production by hand.** `npm run db:migrate` reads only `.env.local`:
  `vercel env pull --environment=production .env.production.local`, then `node
  --env-file=.env.production.local tools/db/migrate.mjs`, then the seed with the same flag and
  `--import tsx tools/db/seed-examples.ts`. `--env-file` is a **node** flag, not a prefix to the
  command: it cannot be passed through `npm run`, and the script would take `.env.local`, i.e. dev.
  That is why every script that touches the database prints the host and the database name
  **before** connecting (`dbTarget` in `tools/db/target.mjs`) — the only protection against
  boarding the wrong train. The migration is not a build step: the Vercel build runs without
  production secrets, and its failure would take down the deploy of a site that must work with a
  dead database.
- **The family bounds are the poster's bounds** (`MIN_PEOPLE`..`MAX_PEOPLE`), held by
  `normalizeFamily`. Otherwise the setting would assemble a blank the poster refuses to assemble.
- **Names in the family are required, on the poster they are not.** That is checked by
  `familyNamed` (`model/family.ts`), and it stands **outside** `normalizeFamily`: that one reads old
  database rows and the `DEFAULT_FAMILY` default, where there are no names at all, and such
  settings must not be lost. One rule in two places: the "Save the family" button is disabled while
  any name is empty (the same trick as in the report dialog), and `saveFamily` answers `unnamed` —
  the button is a convenience, not a line of defence. A separate status rather than a shared
  `error`: the server is fine, and the person must be told exactly what to fix.
- **`/privacy` describes the contents of the database literally.** A row appeared — the page is
  rewritten by the same change. That is a rule, not a one-off courtesy.
- **The steps are numbered, and the applied ones are recorded in `schema_migrations`.** One
  idempotent file was enough while the tables were only being created; two breeds of season bring
  steps that are no longer safe to repeat. The old schema lies as the first step
  (`000_legacy.sql`) and runs as a no-op on the live database. `npm run db:status` shows what is
  applied and what is left.

## Consent and analytics

Google Analytics is the only thing the site collects **not for the sake of the viewer's poster**,
and the only third-party library that reaches the browser. So it gets one conversation about
consent for the whole site: consent that is its own, revocable and given before the first cookie.

| What | Where |
| --- | --- |
| The type, the version, the cookie, parsing the value, notifying | `src/model/consent.ts` |
| Reading the answer and `GA_ID` | `src/server/consent.ts` |
| The settings columns, `readConsentSetting`, `writeConsent` | `src/server/settings.ts` |
| Actions: answering the banner and editing in the account | `src/server/actions.ts` |
| The node in the root layout | `components/site/ConsentGate.tsx` |
| The tag itself | `components/site/Analytics.tsx` |
| The banner | `components/site/ConsentBanner.tsx` |
| "Cookies" in the footer | `components/site/ConsentLink.tsx` |
| The account section | `app/[lang]/account/ConsentEditor.tsx` |
| Schema | `tools/db/migrations/006_consent.sql` |
| `window.gtag` types | `src/model/gtag.d.ts` |

- **No `GA_ID` — nothing at all.** No banner, no line in the footer, no section in the account,
  not a byte of Google; we do not even go to the database for the answer. That is the master
  switch and what makes the mechanism safe: while the variable is absent the site behaves exactly
  as before. Asking consent for something that is not happening is forbidden — a person would
  answer a question that does not exist and we would get a record that means nothing.
- **The variable is a server one (`GA_ID`), not `NEXT_PUBLIC_GA_ID`.** A public one is
  substituted at build time, i.e. becomes part of the bundle: turning the tag off on Vercel
  without a rebuild would become impossible, and a test server would get its value from
  `npm run build` rather than from its own environment. Only the server reads it; the identifier
  travels to the browser **as a prop** — the same way everything else server-side gets there in
  this project.
- **Consent Mode v2, not "load after consent".** `gtag` is loaded straight away, but all four
  storage keys are `denied`: in that state it writes no cookies and collects no identifiers. The
  gain is one and it is substantial — "Accept" turns the tag on **in place**, a `consent update`
  changes the mode of an already loaded `gtag`, and the page need not be reloaded. The order of the
  two scripts is right by itself: `dataLayer` is a queue and `afterInteractive` executes in
  document order.
- **There are two storages, and the cookie is stronger than the setting.** The `fs-consent` cookie
  is **this browser's** answer, and a signed-out person has no other place; the `consent`,
  `consent_version`, `consent_at` columns are the account's answer, so a signed-in person does not
  answer the same question on every device. The order is simply `cookie ?? saved`. The language's
  tricks (`url` against `auto`, a marker for one navigation) are not needed here: there two sources
  of a guess argue, here two answers from the same person do, and the one given in this browser is
  the fresher.
- **We do not rewrite the setting into the cookie.** A client twin of `LangSync` is pointless:
  `readSettings` is cached with `cache()` from React and is called by the layout for the language
  anyway — the read is free, and there is nothing to write, the first decision will set the
  cookie.
- **There are three columns because there are three questions.** What was answered, to what
  exactly (`consent_version`) and when (`consent_at`). An answer without a version and a date is
  not proof of consent but merely a word; GDPR requires being able to produce it. The date comes
  from the database's `now()`, not from the browser: the clock of whoever consents cannot be
  proof.
- **`null` in `consent` means "not asked", not "forbidden".** The same difference as with
  `language`, and showing the banner rests on it. The column has no default and cannot have one —
  a default would mean someone has already answered for the person. In the account the default is
  honest, though: did not answer means did not allow.
- **Consent to a previous version does not cover new purposes.** `CONSENT_VERSION` does not match
  (in the cookie it travels right in the value — `granted.1`; in the database it is a column) — we
  read it as "not asked" and the banner comes out again. Today the version is `1`; when a second
  purpose appears, raise it and the conversation repeats itself.
- **The banner is a bar, not a modal dialog.** Locking the site until an answer is forbidden:
  consent must be free, and a dialog with no way out is a wall, and such consent is not consent at
  all. Hence `z-index: 36` — above the language menu but **below the toast**: the toast speaks
  about what has just happened, and it matters more than a question that is hanging there and can
  wait.
- **Both buttons carry the same weight.** A refusal has no right to be harder than consent — not
  by an extra click, not by a paler colour. The dialog roles (`.primary` on the left, `.ghost` on
  the right) are therefore not taken here: they separate an action from a refusal, and here there
  are two equal answers to one question.
- **A refusal is remembered the same way as consent.** "No" is an answer too; forgetting it would
  mean asking again on every page, i.e. pressing. Both have the same term — six months
  (`CONSENT_COOKIE_MAX_AGE`): asking someone who refused more often than someone who agreed is
  the same pressure.
- **There are two ways to change your mind, and both are mandatory.** In the account for a
  signed-in person, and through the "Cookies" link in the footer for everyone: a signed-out person
  has no account and has the right to withdraw consent as easily as it was given. The link is a
  button, not an address: it reopens the conversation through `openConsent`/`subscribeConsent` —
  the same trick as `announce` in `draft.ts`, and for the same reason: a context and a client
  footer for one button are pointless.
- **A server action sets the cookie.** The project never touches `document.cookie` anywhere, and
  we did not start doing it for consent: actions are the only place besides `proxy` where a cookie
  can be set at all. Hence also the fact that the banner does not wait for the server's answer: it
  closes itself, and `gtag` is switched to the new state in place.
- **Silence from the database for a signed-in person is not overridden by the cookie.** The answer
  is saved in the browser but did not turn up in the settings — we will ask again on the next
  device. That is more honest than treating something unsaved as saved.
- **`/privacy` is rewritten by the same change** — the rule is general, and here it applied in
  earnest: the page stated outright that there is no analytics on the site. `cookiesText` and
  `dbSettings` were rewritten, an `analyticsHead`/`analyticsText` pair was added and the date was
  raised — in all three languages.
- **There must not be a second such library.** The rule "not a single third-party library reaches
  the browser" held while the site had nothing to count. The tag cancels it — and cancels it
  **exactly once**.

Verified by: `e2e/site/consent.spec.ts` — analytics is off before the answer, "Accept" turns it
on without a reload, a refusal is remembered, the footer link opens the conversation again, and a
signed-in person's decision survives a cleared cookie.

## Modal dialogs

There is one wrapper for the whole site: `src/components/dialog/Dialog.tsx` draws the `<dialog>`,
`src/components/dialog/Dialog.module.css` holds all of its styling. There used to be three copies
of these rules (the poster's dialogs, the list's dialogs, the family swap) and they had already
diverged in heading size, padding and button height — which is how such copies end.

| What | Where |
| --- | --- |
| The wrapper: `<dialog>`, `showModal()`, the heading, the button row | `src/components/dialog/Dialog.tsx` |
| The styling: frame, padding, buttons, the warning | `src/components/dialog/Dialog.module.css` |
| Locking the scroll | `html:has(dialog:modal)` in `src/styles/global.css` |

- **`confirm()` will not do anywhere:** it hangs the tab, breaks the automated print check and
  cannot show the main thing — **what exactly** will change.
- **A dialog is drawn only while it is open.** The caller holds a `useState` and mounts it, while
  `onDismiss` catches Esc, a click on the backdrop and the cancel button at once: otherwise the
  state diverges from the dialog's real state and it will not open a second time. The approach of
  "always hang in the tree and open through `ref.showModal()`" was the second one and was
  cancelled — one wrapper cannot have two manners. A side benefit: the fields inside are new every
  time, and `defaultValue` works honestly even after a rename (the value used to have to be put
  into the node by hand).
- **Buttons have two roles: `.ghost` on the left, `.primary` on the right.** There is deliberately
  no third, red "dangerous" one — on this site the traffic-light colour means a warning about loss
  (`.warning`), not a button; a red button existed only in the list, and one and the same "Take
  off the showcase" looked different in two places. The row arrives in `Dialog` as a node rather
  than a description: it may contain a `<form>` with a server action (deleting a row), the sign-in
  button and a lone "Close" (the showcase's refusal).
- **The heading links itself to the dialog** (`useId`): hard-coded `id`s would have to be spread
  by hand wherever a page has several identical list dialogs.
- **The scroll under an open dialog is locked by one rule for the whole site**
  (`html:has(dialog:modal)`), and `scrollbar-gutter: stable` there keeps the page width so the
  layout does not twitch on opening. A dialog does not need its own locking.
- **`@media print { display: none }` stands in the shared module** — a closed `<dialog>` does not
  render anyway, but the rule is needed in case of printing with a dialog open.
- **The width of 560px is for three buttons in a row**, and that is a ceiling, not a goal: dialogs
  with four buttons (there used to be a "Share a link") wrap the row on a narrow screen and read
  as a breakage. If it does not fit, the button does not belong in the row.
- **The button row is pressed to the bottom of the dialog.** The dialog has a `min-height` so that
  a one-line phrase does not squeeze it into a strip — and the free space must go **above** the
  row, not below it: below it there was a hole and the buttons hung in the middle. That is held by
  `.dialog[open] { display: flex; flex-direction: column }` plus `margin-top: auto` on the row.
  The selector has `[open]` for a reason: an authored `display` beats the browser default, and a
  bare `.dialog` would show the dialog in the frame when it is already in the tree but
  `showModal()` has not been called yet.

## My seasons

Your own collection: the `user_seasons` table and the `/seasons` page. It is invisible from
outside, a fork always makes a new row, the content can be edited as much as you like.

| What | Where |
| --- | --- |
| Limits, the season's name, the statuses | `src/model/library.ts` |
| Reading, listing, writing, deleting | `src/server/userSeasons.ts` |
| Page and poster actions | `src/server/actions.ts` |
| The poster of your own season | `src/app/season/[code]/` |
| A signed-out person's draft | `src/model/draft.ts`, `src/app/[lang]/sheet/` |
| The draft as a list row (client) | `src/app/[lang]/seasons/DraftEntry.tsx` |
| Moving the draft after sign-in | `src/components/site/ClaimDraft.tsx` |
| The list, search and sorting | `src/app/[lang]/seasons/page.tsx` |
| Renaming and deleting a row (client) | `src/app/[lang]/seasons/RenameEntry.tsx`, `DeleteEntry.tsx` |
| Renaming from the poster itself | `src/components/edit/RenameDialog.tsx` |
| Schema | `tools/db/migrations/001_seasons_v2.sql` |

- **There is no uniqueness of content here and there must not be.** A fork of your own season is a
  lawful second row, and two seasons with the same name are lawful too. Uniqueness is a rule of
  the showcase, not of the collection.
- **"Fork" exists on your own season too**: next month is assembled from the last one, and the
  last one must stay. In edit mode there is no such button — there you are editing that very row,
  and starting a second one mid-work is pointless.
- **A row is always looked up together with its owner** (`where code = $1 and account_key = $2`).
  So someone else's code is indistinguishable from an invented one: both are a 404. A signed-out
  person is sent to the account, where it is explained what signing in is for.
- **A draft has a name and a date, and it is visible in the list.** For a signed-out person
  `/seasons` shows their single draft as the same kind of row as seasons from the database: open,
  rename, delete. While the draft was shown nowhere, the person had no way to check the "there is
  one draft" rule, and "New season" silently overwrote what they had typed. We do not show tabs to
  an anonymous person: there are no favourites and no publications without signing in.
- **The row is drawn by the client, and only by it.** The draft lies in `localStorage`, the server
  has nowhere to take it from. `DraftEntry` reads the storage through `useSyncExternalStore`
  rather than in an effect: the server snapshot is `undefined`, and that is **not the same** as
  "there is no draft", otherwise the phrase "there is no draft" would flash untruthfully for a
  frame. Honesty after a rename and during an edit in a neighbouring tab comes from the same
  place — the draft's writers wake the subscription themselves (`announce` in `draft.ts`), because
  your own write does not raise a `storage` event.
- **A draft's date lies in a field, while the month and the theme do not.** `savedAt` cannot be
  derived from anywhere, while the month and the theme are derived from the blank itself — a
  column next to it would be that second copy. The timestamp is set by `writeDraft`, not by
  whoever calls it: there are four writers, and forgetting it means showing someone else's date in
  the list.
- **Signing in finishes the job itself, from any button and any page.** The draft is taken by
  `components/site/ClaimDraft.tsx` — the server wrapper reads the session, the client
  `DraftClaimer` reads the storage — and it stands in the root layout, not on `/seasons`. There is
  no `?claim=1` marker and no sign-in button on the draft bar any more: **a signed-in person has no
  draft**, so a record in the browser means one thing — it was assembled before signing in, and
  there is no consent to ask about. From `/sheet` the person is taken to the new row keeping the
  mode, or the poster would be left without storage. A failure does not touch the draft — no row
  appeared and there is nothing to erase.
- **A claimed draft is sealed, not merely erased** (`sealDraft` in `draft.ts`). `DraftStore` works
  next to it on `/sheet` and writes with a debounce — its delayed write would land in the storage
  after the clean-up and resurrect a second copy. A manual deletion (`DraftEntry`) must not be
  sealed: right after it the person starts a new draft.
- **We do not show a signed-in person a draft on `/seasons`.** Their collection is in the
  database, and a draft has nowhere to linger now: signing in carries it away that same instant.
- **The name is given at creation and derived from the blank** (`defaultSeasonTitle`: the month
  plus the theme's subtitle) **in the season's language**: it is written into the `title` column
  once and then lives its own life — changing the language in the account does not touch it. It is
  needed by the list, and it is printed nowhere on the poster. Renaming **does not touch
  `updated_at`**: that is the date of the season's edit, the list is sorted by it, and changing a
  name must not raise a row to the top.
- **The limit is 100 rows per account**, and it is held by the application, not by the schema:
  overflow must be explained in words. The check stands **in the same query** as the insert (the
  `room` CTE) — between a separate `count` and `insert` there is a window.
- **The row's code is taken before the insert.** `insert ... returning` would give the id when the
  row is already written, and the code would have to be added with a second query; so the id is
  taken with `nextval`, the code is computed from it, and both travel in one insert.
- **The month in the list is derived from the content** rather than kept in a column next to it:
  that column would be the second copy. Parsing is cheap now — the database holds an unpacked
  array.
- **Search is `position(lower($2) in lower(title))`, not `ilike`:** there is no need to escape `%`
  and `_`, which people type in a search box easily enough. The sort order is substituted into the
  query text, but from the closed `LibrarySort` union, not from a person.
- **Search and sorting live in the address** (`?q=&sort=`), not in React state: they can be sent
  and reloaded, the page stays a server page and everything works without JS. Defaults are not
  written into the address — a short `/seasons` must stay short.
- **Deletion is confirmed with a dialog**, and `DeleteEntry` is a client component for the same
  reason as `FamilyEditor`: without JS the confirmation would cost a separate screen. We ask not
  for form's sake: there is no other copy of the season, neither with us nor with the person.
- **Two places in `RenameEntry` are easy to get wrong, and both have already cost debugging.** The
  action ends with a redirect, but **the component is not remounted because of it** — Next redraws
  the route in place. Hence: a home-made "saving" flag would stay raised and the button would
  stick forever (the pending state is held by `useTransition`, which clears itself), and
  `defaultValue` in the field would not update after a rename (the value is put into the node when
  the dialog opens).
- **If the list was not read — show emptiness and a toast**, never a default.
- **Favourites come back here at E6** — already on published seasons: what people set aside is
  someone else's published idea, not an arbitrary address. There are no account tabs yet.

## The showcase: publishing

Your own season can be **published** — then its copy lands in `public_seasons` and lives on the
"Community Ideas" showcase at its own permanent address.

| What | Where |
| --- | --- |
| Limits, the review threshold, `PublishStatus`, the refusal wording | `src/model/community.ts` |
| Reviewing reports and closing by hand | `tools/db/reports.ts` (`npm run db:reports`) |
| Publishing, withdrawing, the showcase query | `src/server/publicSeasons.ts` |
| Random names for anonymising | `src/model/season.ts` |
| Poster actions | `src/server/actions.ts` |
| The megaphone button and the dialog | `src/app/season/[code]/OwnBar.tsx`, `components/edit/PublishDialog.tsx` |
| Withdrawing and returning to the showcase | `src/app/s/[code]/PublicBar.tsx`, `components/edit/WithdrawDialog.tsx` |
| The same as an account row | `src/app/[lang]/seasons/ShowcaseEntry.tsx` |
| The showcase and the mini-poster | `src/app/[lang]/ideas/page.tsx`, `src/components/community/SeasonPreview.tsx` |
| Schema | `tools/db/migrations/001_seasons_v2.sql` (`public_*`), `004_reports_snapshot.sql` |

- **Publishing is a copy, not a pointer.** The link to the personal season is cut that same
  moment: edits in the account do not touch the showcase, a rename does not concern it, deleting
  the season does not take it away. Hence a publication has its own row, its own code and its own
  styling. Only a **saved** season can be published: there is nothing to copy while there is
  nothing to point at.
- **There are no identical contents on the showcase, and the database holds that.** `content_key`
  is a unique `md5(language || content::text)`, a generated column. Neither the theme, nor the
  icons, nor the names, nor the title enter the comparison: a season with changed paints or
  different names is the same season. **The language does enter it**: the same blank translated
  into another language is a different idea seen by different people (see "Languages"). Computing
  the key in the application would be worse: it would depend on who computed it and with what.
- **Publishing brings your own withdrawn row back, and never touches someone else's.** If the same
  content already lies withdrawn and was published **by the same person**, no second row is
  created: the previous one comes back with its code, its likes and everything else it collected.
  Nobody hijacks someone else's row, visible or withdrawn: published content stays with whoever
  published it, and a fork gives a copy of the blank, not the right to dispose of someone else's
  publication. The former rule "fork a withdrawn one, publish it again and it comes back under new
  authorship" is cancelled: it allowed appropriating someone else's, and it existed only because
  there was no way to return a withdrawn one to its author. Now there is — `republishPublic`.
- **A duplicate on the showcase leads you to it, a withdrawn one does not.** A visible one answers
  `duplicate` **with a code**, and the person is taken to that very publication: what they need is
  not a refusal but that season. A withdrawn one answers `duplicate` **without a code**, with a
  single toast: leading to a page that is not on the showcase is pointless. The order of the
  branches in the check is therefore not arbitrary — a visible duplicate beats a lack of room
  (free up all five and this still cannot be published), while a withdrawn one is weaker: a
  withdrawn row can be your own, and then the real reason for the refusal is exactly the room.
- **One person gets no more than five seasons on the showcase** (`PUBLISH_LIMIT` in
  `model/community.ts`). The number is its own, not `LIBRARY_LIMIT`: a collection is a warehouse,
  and a hundred rows in it bother nobody, while the showcase is a shared shelf and a dozen random
  ideas on it must not turn out to be one author's. Only **visible** rows count: withdrawn and
  closed ones take no room — otherwise the words "take the extra ones off the showcase" would be
  untrue. The check stands in the same statement as the insert (the `room` CTE), and reclaiming a
  hidden row obeys it too: a reclaimed row becomes visible, i.e. takes a place.
- **The conversation about publishing starts with the showcase's answer, it does not end with
  it.** `PublishDialog` asks the showcase the moment it opens: `previewPublish` is a dry run of the
  `publishSeason` checks with no write. Found the same season — it says so at once and offers to
  look; the limit of five is used up — it says that too. Before, a person filled in the dialog,
  pressed "Publish" and only then got a refusal as a toast. The dry run differs in one thing:
  **your own withdrawn row is `ok`**, publication brings it back. It is not a line of defence:
  `publishSeason` decides, and on a silent database the publication will explain the refusal.
- **There is not always a link in the dialog.** A visible copy gets "Look at it on the showcase";
  someone else's withdrawn one does not give an answer with a code at all (see the `duplicate`
  rule above), and there is nowhere to lead.
- **The megaphone in a personal season has no state: it is always an ordinary button.** The dialog
  has exactly two scenarios — publish, or "one like this already exists" with a link — and both
  come from one fresh check. A pressed state was a third answer to the same question and cost a
  database query on every page view, before the person took any interest; worse, it did not look
  for other people's publications of the same content at all. So `publishedCode` was deleted
  entirely rather than left "just in case".
- **Anonymising swaps exactly `names`** (`anonymousNames`), and only in the copy: your own season
  keeps the real names. The swap does not affect uniqueness — names do not take part in the
  comparison. The names are taken without repeats: two "Anyas" in one family would read as a bug,
  not as anonymity.
- **Withdrawing from the showcase depends on more than the author.** The row stays (and is merely
  marked `hidden_at`) if somebody **saved it to their favourites**: taking away what people set
  aside is not allowed, and the direct link has already gone around. Nothing holds it — we delete
  it outright. Likes and forks do not prevent deletion: a like is a sign of attention, a fork is a
  copy that lives its own life anyway. **A report does not hold the row any more either** — it has
  its own snapshot, see "Likes, reports and favourites".
- **A closed publication (`blocked_at`) is shown nowhere** — not in "Ideas", not by a direct link,
  not to its author: `/s/<code>` answers 404 to everyone. It stays in the database because it was
  reported and the review must not run into a deleted row. The author learns about the closure in
  their list of publications — there is a "closed after reports" mark there.
- **A person closes it, by hand, and it is a decision.** The `REPORTS_TO_REVIEW` threshold is a
  reason to look, not an action: the showcase hides nothing by itself. Automation stood here
  before and was bad in two ways at once — a season disappeared silently, explaining nothing to
  its author, and six people in agreement removed someone else's without any review. The queue and
  the closing are in `npm run db:reports` (`-- --block <code> "why"`, `-- --unblock <code>`); next
  to `blocked_at` lies `block_note`: in a month nobody will remember the "why".
- **Closed content is not resurrected by reclaiming.** A hidden row is reclaimed by whoever
  publishes the same content again — a closed one is reclaimed by nobody, otherwise closing would
  be worth nothing: fork it, publish it, and the same poster is back on the showcase. What is
  closed is not a row but content; an attempt to publish the same ends with the `blocked` status.
- **A hidden season is not a deleted one.** It opens at its address, accepts likes and forks, but
  it is not in "Ideas". The bar says nothing about it: the hint names a place, and a withdrawn
  season has no place — it is empty (see the hint rule in "State").
- **The megaphone works both ways, and identically in both places** — on `/s/<code>` itself and as
  a row in the account. Pressed (`aria-pressed`) means the season is on the showcase and a press
  takes it off; unpressed means a press brings it back (`republishPublic`, the `republishSeason`
  and `republishEntry` actions). The button was disabled while there was no way to bring a
  withdrawn one back: the season ended up in a dead end. A return asks for no dialog — nothing to
  lose, same row; only withdrawal is confirmed, where a season may disappear altogether. A return
  counts against the same `PUBLISH_LIMIT`. An already visible row answers `ok` rather than a
  refusal — the same trick as with a like: a repeated press in a neighbouring tab must break
  nothing.
- **A closed row is brought back by nobody**, the author included: `blocked` is the review's
  answer, not a state to be disposed of with a button.
- **A publication's name is not given by hand** — it is derived from the content (`ideaTitle`).
  There is no column next to it: that would be a second copy of what is already in `content`.
  **There is no month and year in it, unlike in your own collection** (`defaultSeasonTitle`): in
  the collection the month helps find a row, while on the showcase an idea is taken for what to
  fill a month with — whose month it was and when is beside the point.
- **A season can be taken off the showcase where it is visible** — on `/s/<code>` itself, and only
  by its author. The button is pressed (`aria-pressed`) while the season is on the showcase: that
  is the state of a row, not the action "publish once more" — publishing is done from your own
  season.
- **`/privacy` describes the contents of the database literally.** A showcase of copies appeared —
  the page was rewritten by the same change, including the main thing: **a published season is
  visible to everyone**.

About the showcase `/ideas` itself:

- **A dozen random ones, not the top ten by likes.** Sorting by rating would lock the showcase
  forever: whatever got to the top would collect likes simply because it is visible. The query is
  weighted — a row's key is `power(random(), 1.0 / (1 + likes))`, and we take the largest
  (Efraimidis–Spirakis): a liked one turns up more often but does not guarantee itself a place.
- **"Show others" is an ordinary link with a growing `?r=` marker,** not a JS button: the query is
  random on every render, a changing address honestly makes a history entry and works without JS.
  Computing the marker from `Date.now()` is not allowed — that is calling an impure function
  during render, and oxlint complains about it; it is therefore a counter taken from the address
  itself.
- **The preview is a mini-poster, not a site card,** and therefore carries a theme: `data-palette`
  hangs on the preview itself. That is the only exception to "cards on the site do not carry a
  theme" — the rule is about cards, and this is an image of a sheet.
- **The preview has no personal storylines, moods or wrap-up.** That is exactly what a season is
  opened for: the showcase entices, it does not replace the poster. Everything is drawn from the
  row's content, the preview has no second source. The month is absent for another reason — it
  adds nothing to an idea (see `ideaTitle` above); there is no caption under the preview either:
  the name *is* the theme of the month, written large on the preview itself.
- **System seasons (our examples) are the same kind of showcase rows**, only without an author and
  with a rolling month. They cannot be reported: otherwise six unhappy people would hide the
  examples.
- **If the showcase was not read — emptiness and a toast**, never a default.
- **From the showcase you can report but not like.** People like after looking at a season; abuse
  is visible at once — that is what the flag is doing here. `ReportEntry` is a client component for
  the same reason as `DeleteEntry`. Its dialogs and wording are shared with the poster, including
  the rule "sign-in is asked before the report dialog": the showcase reads the session and hands
  `signedIn` to the row.
- **System seasons have no flag on the showcase.** The rule "our examples are not reported" is one
  for all screens: the server would not accept such a report anyway (`author_key is null` is
  `own`), but a button that is bound to end in a refusal is not a button. That is why `Idea` has a
  `system` field, and it is taken from the same place as on the poster: `author_key is null`.

## Sharing a link

Your own season is invisible from outside — and sometimes it has to be shown: to the other
parent, to a grandmother, to anyone without an account. For that a row has a `share_token` and the
address `/p/<token>`.

| What | Where |
| --- | --- |
| The token and its check | `src/model/shortcode.ts` (`shareToken`, `tokenOrNull`) |
| Reading by token, issuing and revoking | `src/server/userSeasons.ts` |
| The link dialog | `src/components/edit/ShareLinkDialog.tsx` |
| The recipient's page | `src/app/p/[token]/` |
| The link's code for the sheet | `src/server/qr.ts` (`shareQr`, `sharedLink`) |

- **The link opens the season for anyone and without signing in** — that is the point: it is sent
  to someone who has no account. It never opens editing: the recipient gets viewing, printing and
  forking.
- **Revoking and issuing a new one are the same action**: the token is simply overwritten and the
  previous one stops working. A revoked link is indistinguishable from an invented one — both are
  a 404: the answer must not reveal whether such a token ever existed.
- **Neither the owner's name nor their account leaks outward.** The recipient sees a poster, not
  someone else's collection; the row's code is not in the address either — only the token.
- **The styling is not overridden by the address here**, unlike on the showcase: the address was
  handed out by the owner, and writing someone else's try-on into it would mean spoiling the link
  that was sent.
- **The link is printed on the sheet itself.** If there is a token, the QR next to the goal of the
  month leads to it rather than to the site (see "The QR code"): the printout is put on the fridge
  and shown to the same people the link is sent to, and sixteen characters of a token cannot be
  typed off paper. Revoking puts the site address back on the sheet: printing a code that leads
  nowhere is pointless.
- **The link and its code travel together** (`SharedLink` in `model/qr.ts`), and they have one
  state: it is held by the page (`OwnSeason`), not by the bar. The dialog in the bar issues and
  revokes the link, the sheet prints it, and both must learn about it at the same instant. The
  matrix is returned by the `shareLink` action itself — asking the server again after its own
  answer is pointless.
- **"Copy" stands next to the field, not in the dialog's row:** people copy what they see next to
  it, and the row is the same in all dialogs — refusal on the left, action on the right. There is
  deliberately **no separate "Issue a new one" button**: with it the buttons came to four, three
  of them alike. Revoking and issuing both remain, though — the dialog does not close on "Revoke",
  and the right button immediately becomes "Create a link".
- **The dialog says what the link is for, not what it does.** "The link opens the season for
  viewing" and "There is no link yet" retold the mechanism and the state, while the person came
  here to share; the second phrase also said nothing about what a press would give. Now both are
  instructions: "Send the link to whoever you want to show the season to" and "Create a link to
  share the season". **This link must not be called "public":** there is one public season on the
  site — the one put on the showcase — and confusing them means promising the wrong thing.

## Likes, reports and favourites

Three tables around a publication: `public_likes`, `public_reports`, `public_favorites`. They
live in `src/server/publicSeasons.ts` next to the publication itself — it is one subject, and
there is no point in splitting it across files.

- **The desired state comes from the client** (`setLike(code, on)`), it is not computed on the
  server. Not laziness: "toggle" does not work as one statement — a delete and an insert in a
  shared CTE do not see each other's work and fight over the primary key. This way there is one
  query and it is **idempotent**, and a repeated press in a neighbouring tab breaks nothing.
- **There is no like counter, there are rows.** The number is derived with `count(*)`, just as the
  month and the theme are derived from the content, and for the same reason. The primary key
  `(public_id, account_key)` *is* the rule "one person, one like".
- **You do not like your own, report your own or set aside your own.** For favourites there is a
  practical reason too: they hold a publication back from deletion, and the author would lock
  themselves out of withdrawing it. Your own season has no such buttons at all, but the checks
  stand on the server too — buttons are a convenience, not a line of defence; their answer is a
  separate `own` status.
- **System seasons are not reported**: otherwise six unhappy people would take our examples off
  the showcase. They can be liked and set aside — they belong to nobody.
- **A repeated report refines the previous one** (`on conflict … do update`) rather than making a
  second. So the `REPORTS_TO_REVIEW` threshold counts **authors**, not presses: otherwise one
  person could send someone else's season to review. The limit of a hundred reports per account is
  counted over other people's publications (`code is distinct from`): editing your own report has
  no right to run into it.
- **A report outlives the publication, so it carries a snapshot rather than a reference.** The row
  holds the `code` from the address, the `author_key` and **a copy of the content** — there is no
  reference to `public_seasons` at all (`004_reports_snapshot.sql`). Otherwise it did not add up:
  a hidden season disappears as soon as the last person who saved it removes it from favourites —
  and a report is reviewed by its text, which after that is nowhere to be taken from. The language
  is in the snapshot too, and it is needed: an empty field of a blank takes its text from the
  placeholder, and the placeholder differs per language — without the column the review queue
  would show a Polish season with a Russian caption. Names do not go into the snapshot: reports
  are about the content, and names are personal data that take no part in comparing publications.
  A repeated report does not rewrite the copy — a publication's content is never edited, only the
  comment changes.
- **A deleted publication cannot be closed, and that is accepted deliberately.** `blocked_at`
  lives on the row and disappears with it: publish the same content again and it is back on the
  showcase. A separate list of closed content surviving deletion was not introduced — the price is
  higher than the benefit; what comes back will be reviewed again, and the snapshot in the reports
  will show that this has been seen before. `npm run db:reports` shows such reports in the
  **"deleted"** state and prints the theme from the snapshot — otherwise there is no seeing what
  it was about; `--block` on them says honestly that there is nothing to close.
- **A closed publication is not reported, not liked and not set aside**: the review has already
  happened. A separate `blocked` status for the same reason as `own`: the person understands what
  happened.
- **The state of the buttons arrives from the page and then lives on the client**: the answer is
  known from the action itself, and asking the server again is pointless.
- **The account has three tabs: "My", "Favourites", "Published".** The third is about your own
  publications: each has three counters on a separate line — "likes: N", "in favourites: N",
  "forks: N". Pairs of the same kind and a line of their own are not taste: a `LikeCount` heart
  amid the words knocked the number off its baseline, and with the date and the month it all
  gathered into one untidy tail. The numbers are always shown, zeros included: this is the author's
  own data, not a rating. "In favourites" is exactly what decides whether a publication disappears
  or hides when withdrawn. The note in the withdrawal dialog says the same (`WITHDRAW_NOTE`):
  "take off" is not "delete", and a person has the right to know that before pressing. The
  conditional wording ("for those who added it") is not softness: if nobody set it aside, the row
  goes away completely, and promising a working link would be untrue. The dialog does not retell
  the rest of the showcase's workings.
- **The showcase is also managed from the list** (`ShowcaseEntry`), with the same megaphone and in
  both directions: pressed means take off, unpressed means bring back. A cross stood here while
  the button could do one move; "take off" and "bring back" cannot be shown with one cross, and
  there is no point in saying the same thing with different icons in two places. There is no
  button only for something closed after reports: the author does not decide there. The actions
  are separate from the buttons on the poster itself precisely because they end with a redirect:
  the list has to redraw and survive a reload.
- **Your own fork of your own publication does not count** — for the same reason you do not like
  your own: it is not someone else's interest but work on your own season.
- **"Favourites" and "Published" are searched and sorted in the application, not in the query.** A
  publication has no name — it is derived from the content, and there is nothing to search by in
  SQL; there are no more than a hundred rows.
- **What is taken off the showcase stays in favourites** and is marked in the list: the link
  works, but the season is no longer in "Ideas".
- **Removing a bookmark is not a deletion.** `UnfavoriteEntry` is therefore a server component with
  no dialog: the season itself is someone else's and is not going anywhere, there is nothing to
  confirm.
- **But for a hidden season the last bookmark is all that holds it**, and whoever removes it takes
  the row away entirely. A season withdrawn from the showcase lives exactly because somebody set
  it aside; nobody is left — there is nobody and nothing left to hold it. This does not concern a
  visible one: it is on the showcase, and bookmarks have nothing to do with that; nor a closed one
  (the ban on publishing the same content rests on it). All of it in one statement: between
  separate "remove the bookmark" and "are there any holders left" there is a window a stranger's
  bookmark fits into. The branches see one snapshot, so "my bookmark is gone" is not visible in the
  delete condition — and must not be: we write what is true in the snapshot — my bookmark exists,
  and there are no others at all.

## The QR code

A QR is printed to the right of the "Our goal for the month" frame. It leads to the site, and for
a season with a private link issued, to that link.

| What | Where |
| --- | --- |
| Source: the site address | `tools/qr/source.json` |
| The encoder: correction level, quiet zone, module merging | `src/server/qr.ts` |
| Building the permanent code | `tools/qr/build.ts` (`npm run qr`) |
| The site code's matrix (generated) | `src/model/qr.data.ts` |
| Choosing a code and the private link's address | `src/model/qr.ts` (`SITE_QR`, `shareQrUrl`) |
| The renderer | `src/components/QrCode.tsx` |
| Its place on the sheet | `MonthGoal.tsx` + `.qr` in its module |

- **By default the code leads to the site, not to this sheet.** It was not like that at first: it
  carried the address of the poster itself, but a link to a sheet is 780–1100 characters, which is
  version 20–24 and more than a hundred modules on a side. Such a code ripples like cloth, needs
  50 mm of paper and cannot be read on A4 at all. Besides, people who come from a code on the
  fridge come **to build their own season**, not to look at someone else's: the site address is
  both more useful and smaller here.
- **The private link is the exception, and exactly one.** If a season has a `share_token`, the
  sheet carries `/p/<token>` rather than the site address: the link exists precisely to show the
  season, and sixteen characters of a token are not typed off paper by hand. This does not
  resurrect the cancelled variant: there the **blank itself** went into the code, here it is a
  short row address (53 characters, version 4, 33 modules). It is printed both for the owner on
  `/season/<code>` and for the recipient on `/p/<token>`: it is the same sheet, and forwarding it
  further is an ordinary thing. This does not concern a published season: the showcase has its own
  permanent address, and `/s/<code>` opens for everyone anyway.
- **There are two codes but one encoder** (`src/server/qr.ts`). The permanent site code is built
  in advance (`npm run qr`), like the themes and the icon sets — there is no point computing the
  same matrix for every sheet; the private link's code is different for every season and is
  computed by the server. Both go through one `qrMatrix`: two codes on one sheet must be built
  identically, so the build no longer holds the correction level, the quiet zone or the module
  merging — only the address. The generated file is not edited by hand: edit `source.json` and
  rebuild.
- **The encoder does not reach the browser.** `qrcode-generator` became an ordinary dependency (it
  used to be a build one), but only server modules call it: the page knows the address at render
  time, and "Create a link" is a server action that returns a ready matrix together with the
  token. Eleven kilobytes in the poster bundle would buy nothing, and the sheet would be no more
  honest for them.
- **The matrix travels as a prop, not through context.** `Poster` gets it from the page and passes
  it to `MonthGoal`; the provider knows nothing about the QR — the context knows only about the
  blank, while the link is issued and revoked by the page. Without a prop `SITE_QR` is drawn: that
  is how a draft, a published season and an example print.
- **The site address lives in `source.json`,** and `SITE_URL` (`src/model/site.ts`) is a re-export
  of `QR_URL` from the generated file. There must not be a second copy of the address: the code is
  built from exactly that string, and diverging from it it would silently lead the wrong way. The
  private link's address is built from it too: it is **absolute and in the site's name**, not from
  the host the sheet was opened from — paper has no "current address". The language in it is the
  season's language: that is what captions the sheet.
- **It is still a constant of the blank, not data of the sheet.** The QR is not part of `Template`,
  does not go to the database and does not end up in `content`; the private link lies in its own
  column, like the theme and the icon set, and prints in exactly the same way.
- **The size is 84 px, i.e. 22 mm of layout and 31 mm on A3.** The site code has little data
  (version 3 at correction M, 29 modules) — a module comes out at 0.85 mm on A3 and 0.6 mm on A4.
  The private link has 33 modules and a smaller module: 0.76 mm on A3 and 0.54 mm on A4 — still
  readable, all the more so since printing is on A3 at the least. Its place on the sheet does not
  change: the width is set in pixels, only the `viewBox` side grows.
- **It adds no height.** The goal row is 72–92 px anyway and the code fits into it: after it
  appeared the unstretched height of the first page stayed the same (840 px for demo-3). If you
  change the size, measure again — the page budget is worked out to the pixel (see "Printing: two
  A4 pages").
- **The correction level is M, not L.** The safety margin is free here: on such a short string it
  does not raise the version enough to make a module small. L only makes sense for a long link,
  i.e. in the cancelled variant.
- **The colours are pure black and white** (`--qr-ink`, next to the moods, outside the themes): a
  camera reads a code by contrast, and tinting it with the theme's ink is not allowed. The fills
  are set in CSS rather than with presentational SVG attributes — `var()` in an attribute is not
  supported by every browser.
- **The quiet zone is 4 modules inside the `viewBox`.** Without it the code cannot be read, and
  relying on the margins of neighbouring blocks is not an option: they change with the layout. The
  build checks that the site address is absolute and free of non-ASCII characters; there is
  nothing to check about the private link — the site assembles it from its own address and a
  token.

## Link previews and icons

What the site looks like outside itself: the card a messenger draws for a link, and the icon
Google puts next to it in search results. The same generated-assets genre as the QR code.

| What | Where |
| --- | --- |
| The mark, its sizes, `favicon.ico` | `tools/logo/build.mjs` (`npm run logo`) |
| The preview picture | `tools/og/build.ts` (`npm run og`) |
| Headless Chrome, shared by both | `tools/shot.mjs` |
| Assembling the metadata | `src/model/meta.ts` (`pageMeta`) |
| `metadataBase` and the icon list | `src/app/[lang]/layout.tsx` |
| robots.txt, sitemap.xml | `src/app/robots.ts`, `src/app/sitemap.ts` |
| The alt text of the picture | `site.ogAlt` in the dictionaries |
| The structured data | `src/components/site/StructuredData.tsx` |
| A publication's own description | `ideaDescription` in `src/model/library.ts` |

- **A dotted address used to serve the landing page with code 200, and that is what left Google
  without an icon.** `proxy` lets any path containing a dot through untouched — static files must
  not be caught by the language redirect — but there was no such file, the request fell into
  `[lang]`, and `knownLang` quietly turned `"favicon.ico"` into Russian. Google and browsers ask
  for exactly `/favicon.ico` by convention, got HTML, and showed nothing. Closed in two places:
  the matcher now skips only real asset extensions (so junk like `/zzz.foo` still reaches **our**
  404 page rather than the Next stub), and the root layout refuses an unknown language outright.
  **`dynamicParams = false` does not work here** and was tried: nothing on this site is
  prerendered, so the params are never checked against `generateStaticParams`.
- **`favicon.svg` is not enough, `favicon.ico` is mandatory.** The SVG stays for browsers, but the
  address every crawler asks for first has to answer with a picture. Chrome cannot write an ICO,
  and there is no dependency for it: an ICO is a container — a 6-byte header, a 16-byte directory
  entry per image, then the PNGs as they are (`ico()` in `tools/logo/build.mjs`). It carries
  16/32/48; 48 is the size Google takes.
- **The mark is drawn at two scales, and one drawing does not serve both.** In search results the
  icon is 16–18 px, and there the roomy sheet of the full mark turns the heart into a speck. So
  `VARIANTS` holds a second geometry — `tight`, paper almost across the whole tile — and the small
  PNGs are built from it. The SVG and everything from 120 px up keep the original proportions.
  `apple-icon.png` is rendered with `radius: 0`: iOS applies its own mask, and a rounded tile
  inside a rounded mask reads as a mistake.
- **The preview picture is common to the site, and only the text is per page.** A mini-poster of
  the season was considered and rejected: `next/og` renders through satori, which knows neither
  CSS Modules, nor `var()`, nor `oklch(from …)`, nor `color-mix` — that is, neither
  `SeasonPreview.tsx` nor the poster works there at all; the palettes are not reachable from JS
  (`palettes.data.ts` keeps only ids and labels) and there are no font files in the repository.
- **The season's content does not go into the preview.** Titles come from the dictionary, as they
  did. A private link travels through a messenger, whose server fetches the page: family names
  have no business in Telegram's cache.
- **There are three pictures, one per language** (`public/og-<lang>.png`): there is a phrase on
  the picture, and it is `landing.heroLead` — **not** `site.description`. The card is the first
  thing a person reads about the project, and the phrase written for exactly that job is the one
  on the landing page. The script imports the dictionaries directly, so a second copy of the
  strings does not appear; change the lead and rerun `npm run og`, then look at the picture —
  a phrase that no longer fits is visible nowhere else.
- **The fonts are inlined into the page as data URIs** rather than linked. A linked face loads
  asynchronously, and a screenshot taken a moment early would silently come out in a system font —
  which is not visible in the code, only on the picture. The css2 answer keeps its `unicode-range`
  blocks, so Cyrillic and `latin-ext` travel along and Polish diacritics stay in the right font.
- **`og:title` does not fall back to the page's `title`.** Next inherits the whole `openGraph`
  block from the layout — the layout's heading included — so a page with its own text has to spell
  `openGraph` out in full. That is what `pageMeta` exists for: twelve hand-written copies would
  have drifted apart, and the layout's block still covers the pages that set no metadata of their
  own (404, `[...rest]`).
- **A personal page is `noindex`, but keeps its preview.** `/p/<token>`, `/season/<code>`,
  `/seasons`, `/account` and `/sheet` are closed from the index and have no `canonical`, while
  `og:image` and the text stay: a preview in a messenger has nothing to do with `robots`, and a
  private link exists precisely to be sent.
- **A publication is `alternates: 'self'`.** It lives only in its own language (see "Languages"),
  so `/en/s/<code of a Russian season>` is a 404 — and promising a crawler translations that
  answer 404 is not allowed. Everything open on all three (`/`, `/ideas`, `/privacy`) carries
  three `hreflang` plus `x-default` on Russian.
- **The sitemap does not list people's publications, but it does list our examples.** A person's
  publication would need the database, and a quiet database must not take a page down — the same
  rule that keeps the migration out of the build; the way to those is `/ideas`. An example is a
  different matter: its code comes from the `PUBLIC_IDS` table, so the list is assembled without a
  single query. The month pages are in the map for the same reason - they are files. Such a row carries **no** language alternates, for the same reason its page is
  built with `alternates: 'self'`.
- **There is no `lastModified` in the map, and that is a decision.** Nothing on this site carries
  the date a page was changed, and a date computed while the map is being rendered would say
  "just now" for ever. A field that always lies is worse than a missing one.
- **`Disallow` in robots.txt must carry the language.** Every real address is `/ru/seasons`, and
  robots.txt matches from the root: the old bare `/seasons` matched nothing at all, and the
  private pages were held out of the index by their `noindex` alone while the crawler kept
  walking them. Hence `/*/seasons` — the `*` stands for the language segment. Only `/api/` is
  written plain; it is the one path without a language.
- **A publication describes itself.** Every `/s/<code>` used to carry one and the same
  `pages.publicDescription`, and search engines throw duplicates away. The text is now built from
  the season by `ideaDescription`: the goal of the month and the week lines, empty fields skipped
  — four copies of one placeholder read as a bug, not as a season. No extra query: the content is
  already in hand when the metadata is assembled.
- **The site says in `application/ld+json` that it is an application.** The brand collides head-on
  with television vocabulary — "season" is *the* word for it, and the search results for both
  "family season" and "Семейный сезон" are IMDb, Wikipedia and the streaming services. Prose
  cannot settle that; the graph can: `Organization` and `WebSite` in the root layout, plus
  `WebApplication` on the landing page with `applicationCategory`, `isAccessibleForFree` and a
  zero-price `offers`. That is what `site.alternateName` in the dictionaries is for as well — the
  brand paired with what it actually is.
- **We do not fight for the brand query itself.** A domain with no age and no links will not
  displace IMDb, and there is no audience behind that query: whoever types "family season" is
  looking for a series. The words the site is written in — planner, plan for the month, print,
  free — are the ones people actually search, and they belong in `title`, `description` and the
  headings. This does not cancel the product vocabulary from "Conventions": "сезон" and "постер"
  stay, they simply stopped being the only words on the page.
- **A page must have an outline, and the badge is not one by itself.** `SectionBox` renders its
  label as a plain `<span>`, which left the landing page with an `<h1>` and eleven `<h3>`s and
  `/ideas` with no `<h1>` at all. The label becomes a heading only where a page asks for it —
  the `heading` prop, `'h1'` on `/ideas`, `'h2'` on the landing sections. **The poster keeps the
  span**: it prints, its sections are not a page outline, and a heading there would have to be
  measured against the two-page budget for nothing. `.label { font: inherit }` keeps a heading
  looking exactly like the span did.
- **The `<h1>` of the landing page carries meaning, not only the brand.** It was the bare
  `heroTitle`, i.e. the strongest signal on the page spent on a word we are not competing for.
  It is now two spans — the brand in the hand font as before, and `heroTitleTail` under it in the
  interface font. The rays flank the whole block, so they sit a little lower than they did; that
  is accepted.
- **The address of the site is not written a second time.** `metadataBase` is built from
  `SITE_URL`, i.e. from the same `tools/qr/source.json` the QR is built from.

Verified by: `e2e/site/meta.spec.ts` — the icon is a picture and not a page, an address that is
not a language is not the landing page, a link carries a preview, a page knows its canonical
address and its translations, a personal page stays out of the index without losing its preview
and is closed to the crawler together with its language, the map lists our examples in their own
language only, the landing page names itself an application rather than a television season, a
publication describes itself rather than publications in general, and both the landing page and
the showcase have a heading of their own. The month pages have a describe block of their own -
see "The month pages".

## The month pages

`/<lang>/month/<slug>` — one page per month, answering the question people actually type in a
search box: "what to do as a family in September". It is the only page on the site written as an
article rather than as a piece of the product.

| What | Where |
| --- | --- |
| The texts, one file per language | `src/data/months/<lang>/<slug>.json` |
| The registry, and which seasons belong to a month | `src/model/months.ts` |
| The page | `src/app/[lang]/month/[slug]/page.tsx` |
| The list of months | `src/app/[lang]/month/page.tsx` |
| The address builder | `monthHref` in `src/model/site.ts` |

- **The slug is English in all three languages** (`/month/september`). That keeps `ROUTES` a table
  of paths without the language, which is the rule, and makes the `hreflang` set between the
  translations trivial. The price is real and accepted: a transliterated Russian slug would have
  read slightly better to Yandex.
- **The cards are read from the database, by code** (`ideasByCode`), not drawn from the example
  files. The files are right there and it was built that way first - but then the card would come
  from one place and the link it carries from another, and the two are bound to part: a season
  taken off the showcase, or closed after reports, would still be advertised here and would lead
  to a 404. One source, and the visibility rules are the showcase's own.
- **The article is the page; the seasons are a bonus.** A quiet database leaves the block undrawn
  and the page whole - that is the rule about pages that must not depend on the database, and it
  is met by not drawing a block, not by avoiding the query. No toast either: on the showcase a
  person came for the seasons and deserves to be told, here they came to read.
- **What does stay in the repository is the line under each card.** It is editorial text about the
  idea, written for this page, and it is not part of any season - so it lives in the registry
  beside the code it belongs to.
- **The grouping "which seasons belong to September" lives here, not in the examples.** A
  publication has no month of its own on purpose (see "The showcase: publishing"); the month page
  is what groups them, so the grouping is the month page's business.
- **A month exists only when it has been written.** `monthPage` returns `null` and the page is a
  404 - there are no empty month pages, and there must not be: twelve templated pages with the
  words shuffled are what a search engine calls thin content, and the price is paid by the whole
  domain, not by the page.
- **The texts are not in the dictionaries.** They are long, they are one-per-month, and `dict/ru.ts`
  is already 550 lines. They lie next to the examples and are shaped like them.
- **A page nobody links to is a page nobody reaches.** The month pages were in the sitemap and in
  nothing else - unreachable by walking the site, and a crawler reads that as unimportant. They
  hang off three places now: `/month` in the header, and a "Ideas month by month" line on the
  showcase and in the landing page's community block. All three are built from the registry, so a
  new month appears in them by itself.
- **`Главная` left the header to make room.** There are about ninety free pixels there, and one
  more item pushed the sign-in button onto a second line at 1280px - the width of an ordinary
  laptop. The item that went is the one that was duplicated: the brand on the left has always been
  a link home. Nothing else was shortened, and `site.home` went with it - an unused key is dead
  code.
- **The cards are lined up by a fixed `min-height` on the summary, not by `subgrid`.** Subgrid was
  tried first: it lined the two rows up exactly and lost the gap between the columns, so the
  posters touched. The card is stretched by the grid anyway, so it is enough to fix the room the
  summary takes and let the poster have the rest.
- **The page carries an `<h1>` of its own, and the badge is a plain span** - the month's name in
  the badge, the searched phrase in the heading. That is the shape `/privacy` already has.

Verified by: `e2e/site/meta.spec.ts` — the page answers the question people type, a month nobody
has written about is a 404, the page opens in all three languages and knows its translations, it
is reachable by walking the site from the header rather than by knowing its address, and the map
of the site lists it.

## Inline editing

`src/components/edit/EditableText.tsx` — `contentEditable="plaintext-only"`, an **uncontrolled**
node: React does not render text inside while the element has focus, and the `useEffect` writes
`innerText` only if the node is not focused. Make the field controlled (`{value}` in children) and
the caret jumps to the start on every character — that is exactly the mistake the component is
shaped this way to avoid.

**There are no empty fields on the blank.** Outside edit mode an unfilled field shows and prints
its placeholder from `PLACEHOLDERS` (`src/model/labels.ts`) — so there are no required fields and
no holes in the layout either. Two consequences follow: placeholders are written as finished sheet
content ("Our life. Our adventures. Our months.") rather than as an instruction to a field
("Enter a motto"); and second copies of those texts must not be created — neither in
`createEmptyTemplate` nor as a fallback value in `normalizeTemplate`: a copy would diverge from
the placeholder. An empty sheet is literally empty all through, the title and the captions
included.

**All the blank's fields are single-line.** Enter blurs the field, pasting collapses line breaks
into a space (`singleLine`), and `text()` in `normalizeTemplate` does the same — the link could
have been edited by hand. Wrapping is the browser's job, the block's height is set by the layout
(`min-height` in the CSS modules). A manual line break is hand-made layout: it is used to fit text
into a frame, the block grows without limit (in the storylines a card stretched down as long as
Enter was pressed) and the sheet spills onto extra printed pages.

**Every field has its own length limit** — `src/model/limits.ts`, a table of "field path → number
of characters" and `limitFor('people.0.name')`, which reduces an index to `*`. That is not taste
but a paper budget: one extra line in a person's card is multiplied by five and carries the sheet
onto a third page.

- **The numbers are measured, not derived from the font size.** The poster was opened at the print
  width of 718 px with `media=print`, and for each field it was counted how many characters really
  fit in a line. The estimate "width ÷ font size" is off by a factor of two: handwriting fonts are
  wider and wrapping goes by words. Change a limit or a field's layout — measure again, do not
  recompute.
- **There are two checks, and both must give exactly two pages:** every field filled to the limit
  with plausible Russian text, and the same fields filled with seven-letter words in a row (the
  worst wrapping that can be typed). The second case is what determined the tightest limits.
- **A person's limits are held by the card's `min-height: 104px`** (see "Printing: two A4
  pages"): the project on one line, the description on two, the goal next to its label rather than
  under it. Any longer and
  the card grows for five people at once. That is why they are the tightest, and growing them
  without re-measuring the second page is not allowed.
- **The limits must be wider than the longest text in `src/data/examples/*.json`** and wider than
  all the `PLACEHOLDERS`: both print as sheet content. Today `goal` is right up against it — 87
  characters against a limit of 88.
- **The limit is one and the same for input and for storage.** `field(path)` in `useTemplateState`
  hands it out together with `value`/`onChange`, so the sections know nothing about it;
  `normalizeTemplate` trims by the same table — the database holds seasons assembled earlier, and
  anyone could have got into `localStorage`. The format version does not change because of it: the
  composition of `Template` is the same, long text is simply trimmed.
- **Input beyond the limit does not go through** (`onBeforeInput`) rather than being trimmed
  silently: the field flashes an underline for a moment, otherwise the refusal looks like a broken
  keyboard. Pasting and dragging put in what fits — through the same handler, not a check of their
  own.
- **An unbreakable word wraps rather than sticking out:** `overflow-wrap: anywhere` is declared
  once on `.sheet` and inherited across the poster. Specifically `anywhere` and not `break-word`:
  the weeks grid is `repeat(4, 1fr)`, and with `break-word` a long word would stretch a column.

Line breaks are left only in the fill layer — `summaryAnswer` and `nextIdeas` — where it is a list
of separate entries rather than formatting. They are drawn by `MonthTheme`/`NextMonthIdeas` with
their own `white-space: pre-line` and do not go through `EditableText`. In `EditableText` itself
and in the blank's containers (`.cardText`, `.description`, `.text`, `.goal`) there is no more
`pre-line`.

## State

`src/state/SeasonProvider.tsx` + `docContext.ts` (the context and the hook are moved to a separate
file because of the `react/only-export-components` rule in oxlint — do not merge them back). Edits
to the blank itself live in the shared `useTemplateState` hook: the poster has one provider, but
three pages set it up, and they differ not in the edits but in the storage.

**The context knows only about the blank.** Neither the address, nor the database, nor what can be
done with this poster is in it: the set of actions is the page's business. So every kind of poster
has its own bar rather than one toolbar full of branches:

| Page | Bar | What it can do |
| --- | --- | --- |
| Draft `/sheet*` | `app/[lang]/sheet/DraftBar.tsx` | Edit/Done, printing and "Save to my seasons" — signed-in only |
| Own season `/season/<code>*` | `app/season/[code]/OwnBar.tsx` | Edit/Done, renaming (in edit), "Fork" and the megaphone (in viewing), printing; edits write themselves |
| By private link `/p/<token>` | `app/p/[token]/SharedBar.tsx` | "Fork", the link, printing |
| Published `/s/<code>` | `app/s/[code]/PublicBar.tsx` | Star, like, report, "Fork", the link, printing; for the author, withdrawal and return to the showcase, the like count |

The theme and the icon set depend on none of these kinds and live apart — as floating buttons in
the corner of the window (`FloatingControls`). Where to put what was switched is decided by the
page: a draft writes to `localStorage`, your own season to the database, a published one as an
override in the address.

**The season's language lies in the same context**, next to the blank, and has no switcher: the
sheet's captions print, and there is no point changing them on a finished season. The sections
take them from `usePoster()`, while the on-screen buttons on the poster take `useDict()`, i.e. the
interface language.

The rules the bars are assembled from:

- **saving is not a button.** In your own season the edits go to the row with a debounce
  (`Autosave`), in a draft they go to `localStorage` (`DraftStore`). Both are made as a
  **component inside the provider** rather than a prop on it: that way they read the same context
  and see any change, a theme switch included. "Save" is left exactly where a season is
  **created**: a draft travels into the account as a row;
- **the draft bar knows about sign-in in advance** (a prop from the page) and therefore does not
  promise what will not happen: a signed-out person has no collection and must not be shown "Save
  to my seasons". It has no sign-in button of its own either — signing in with any button carries
  the draft into the collection by itself (see "My seasons"). This is the **only** place where
  sign-in is asked in advance to decide whether to show a button, rather than where the season
  will land;
- **the bar does not ask for a name.** The draft was named when it was created — asking the same
  thing a second time is pointless, and renaming lives in the list. That also removed a second
  "Done" from the bar: the word stood both on the dialog's button and, one step away, on the
  button that leaves edit mode, and it meant different things;
- **the name is asked once, with a dialog** (`NewSeasonDialog`): a list without names is
  unreadable, and creating a season silently looks too much like a misclick. The dialog is one for
  all cases of creating a season, and it **always** asks — a draft now has a name too, it is a row
  in the list on `/seasons`;
- **there is one conversation about loss, and it is about "now".** The red warning (`warning`,
  `draftWillBeLost` in `draft.ts`) is added only when a draft already exists, and names it: "the
  draft will be overwritten" is something a person cannot check, while ""September at Grandma's"
  will be overwritten" is. The wording lies in `draft.ts`, not in the dialog: there are two
  creation dialogs (`NewSeasonButton` and `ForkButton`) and a second copy would diverge. The
  permanent "the season lives only in this browser" and the sign-in button are gone from the
  creation dialog: signing in carries the draft into the collection by itself, and where the draft
  lies is said by the hint on its bar;
- **"Fork" is one component for all foreign posters**
  (`components/edit/ForkButton.tsx`): a published season and one sent by private link are forked
  identically, and there is no point keeping two identical conversations. It draws its dialog right
  in the bar, and that is allowed: a modal `<dialog>` lives in the top layer and `backdrop-filter`
  is no obstacle to it — unlike for a toast, which is why the button does not report a refusal
  itself but hands it outward;
- **a fork copies what is on screen**, together with the tried-on theme and icon set: a person
  takes what they saw, not a row from the database. The fill layer is never copied — it is not
  part of the blank. Nothing of the original season is left in the copy, so a second fork is simply
  one more row of your own rather than an "already exists" refusal;
- **sign-in is asked in advance on the poster pages** (`signedIn` as a prop from the server) —
  where the fork lands depends on it. Where there is nowhere to ask (a draft is loaded with
  `ssr: false`), the old trick works: the action goes to the server and opens the sign-in dialog on
  `anonymous`;
- **the bar does not ask about sign-in for the like and the star.** The action goes to the server,
  and if it answers `anonymous`, the sign-in dialog opens. Otherwise the poster would wait for the
  server's answer just to draw a button. **The report is the exception:** its dialog asks the
  person to write a text, and making someone compose a report only to hear "sign in first" is not
  allowed — the flag looks at `signedIn` (which the poster pages have asked for anyway) and opens
  the sign-in dialog straight away for a signed-out person. The `anonymous` answer is still
  handled, though: the session could have ended while the person was typing;
- **the hint names the place and the season, it does not explain the mechanism.** The left corner
  of the row holds the place and, after a colon, the season's name — "Our example: Month of
  Firsts", "A community season: …", "Your season: …" — and nothing more. Neither how the season got
  here nor what will happen to it: that is the site's workings, and its place is in this file. A
  draft and a season by link name only the place ("A draft in this browser", "A season by link"). A
  withdrawn season has no place and only the name is left; the `<span>` itself never disappears —
  it holds the buttons apart at the edges of the row;
- **for your own season the name is the very one in the list**, i.e. the `title` column, and it
  travels as a prop from the page. Deriving it from the content (`ideaTitle`) is not allowed: the
  person named the row themselves, and the bar must call the season what the list calls it —
  otherwise one and the same thing has to be recognised under two different names. For a published
  season and an example it is the other way round: a publication has no `title` column at all, and
  the name there is still derived from the theme of the month;
- **in edit mode you press on the name and a dialog opens** (`RenameDialog`, the `renameSeason`
  action): a season is renamed where it is changed, not in the account. The words about writing
  ("Saves itself") are gone from that place: autosaving is unnoticeable anyway, and the name is
  what a person looks for. **A field right in the row was tried and did not take:** its width
  followed what was typed and the neighbouring buttons twitched on every character — and a dialog
  repeats the manner of all the others. The button does not look like a button: in the row they are
  all on the right, on the left stands a caption, and a dotted underline says it is pressed. The
  same rule holds in the dialogs: one phrase about what will happen, no retelling of the site's
  workings. At most one note, and only where a person would otherwise answer the wrong question —
  as with withdrawal from the showcase (`WITHDRAW_NOTE`), where "take off" is too much like
  "delete";
- **everything the bar reports goes as one toast** — both "the link is copied" and a server
  refusal. There is one exception: `anonymous` is not a refusal but an offer to sign in, and it is
  shown by a dialog. **There is one sign-in dialog with a shared heading, and its own phrase under
  it for every button** — the lines lie in `LOGIN_TEXT` (`model/community.ts`), and the reason
  travels into `LoginDialog` as the `reason` prop. The phrase names exactly what the person
  pressed ("To leave a like you need to sign in") and nothing else: explaining how favourites work
  in the sign-in dialog is pointless;
- **the toast and the dialogs are drawn outside `.bar`, and that is mandatory.** The bar has a
  `backdrop-filter`, which makes an element a containing block for `position: fixed` — a toast
  inside it would stick to the bar instead of the bottom of the screen. So the bars return a
  fragment;
- **a toggle's state is shown by the button's fill, not by the drawing**
  (`.icon[aria-pressed='true']` in `Bar.module.css`). Agreeing through `filled` is impossible: the
  star and the heart have a filled shape, the megaphone does not. The rule must stand **after**
  `.icon:hover` — they have the same specificity;
- **the buttons without labels stand at the two edges, and those are two different edges.** On the
  left, before the hint, is what people do with the poster **for themselves**: the star, the like,
  the report. On the right is what carries it outward: the link and printing. Their labels are
  replaced by `title` and `aria-label` — next to text buttons, short captions would only make the
  row heavier;
- **the row is not broken up with breakpoints.** The hint pushes everything to the right
  (`.hint`), the actions are gathered into one flex item (`.actions`) and move down all at once
  when there is not enough room. A media query will not do here in principle: the width at which
  the row wraps depends on the set of buttons — which differs between the three kinds — and on the
  length of the labels, which are translated.

Text fields are bound by path: `field('people.0.name')`, and writing goes through `setByPath` with
`structuredClone`. A person's colour is not stored but derived from `face` — do not add an
`accent` field back.

## Printing: two A4 pages

The sheet must print as exactly two pages: `PrintPage` (`src/components/PrintPage.tsx`) splits the
sections into two groups, and the first gets `break-after: page`. Each group occupies a whole page
(`min-height: 275mm`).

**Free space goes inside the blocks, not into the gaps between them.** Empty strips between frames
look like a defect, so `justify-content: space-between` is not used here. Exactly one block grows
on each page — the field for writing by hand:

- page 1 — the frame under the question in the theme of the month (`.section { flex: 1 }` in
  `MonthTheme.module.css`). The weeks and the goal of the month are fixed (`flex: 0 0 auto`):
  stretched polaroids lose their square proportions, and the space for a photo must look the same
  as on the web;
- page 2 — "Ideas for next month" (`flex: 1`). The people's cards are deliberately of fixed height
  (`min-height: 104px`): let them grow and, with a family of two, the content hangs in the middle
  of an empty frame. That way a small family automatically gets a large field for the wrap-up and a
  large one gets a compact one.

Web and print must look the same: the empty space for notes is set on screen as well
(`.answerBox { min-height: 260px }`), and in printing the block simply stretches to the bottom of
the sheet. Do not introduce values in `@media print` that differ from the screen ones without a
reason: only tightening to the A4 width, restoring the desktop layout, hiding the on-screen
controls and the fill layer, and replacing unprintable shadows with frames belong there.

Stretching works only through an unbroken flex chain: section → `.box` → `.body` → content. **No
`height: 100%`** — a flex item's height is not definite, a percentage collapses to the content
height and silently kills the stretch (the frame stays small inside a stretched section). Every
link gets `display: flex; flex-direction: column` and `flex: 1; min-height: 0`.

The height budget of one group is **1046 px** (277 mm with 10 mm margins); a stretched group
occupies 1039 px. Measurements of unstretched content:

| Sheet | Page 1 | Slack | Page 2 | Slack |
| --- | --- | --- | --- | --- |
| 4 people, 30 days (demo-1) | 820 px | 220 px | 779 px | 261 px |
| 5 people, 30 days (demo-3) | 840 px | 200 px | 917 px | 123 px |
| 5 people, 31 days, long texts | 864 px | 175 px | 966 px | 74 px |

The slack on the first page barely depends on the family and never falls below ~175 px — its
content is fixed by the layout. The slack on the second is eaten by the people's cards and the mood
table, so **anything added to the second page must be measured on the worst case**: five people, a
month of 31 days and two-line descriptions. The rest is taken up by the stretched block; on
overflow the stretch turns into extra pages, and that is cured by tightening the sections, not by
raising `min-height`.

These numbers are taken with the recipe below: the print rules are applied as ordinary ones,
`#root` is narrowed to 718 px, the group's `min-height` is removed — and the difference between the
stretched and the natural height is the slack.

**Printing is on A3 at the least.** The layout stays A4: the printer scales the whole page,
everything comes out 1.41 times larger, and the "exactly two pages" check does not change. Hence
the rule for small details such as the QR: compute their size in the layout, and their readability
on paper with a factor of 1.41.

Three traps, each of which has already cost extra pages:

1. **Flex breaks pagination.** When printing, Chrome slices a flex container that does not fit on a
   page and scatters its children across separate sheets. `.sheet` in printing is therefore
   `display: block`. Flex is deliberately left on `.page` — only for the stretching, and only
   because the group is guaranteed to fit on a page and never has to be split.
2. **Mobile breakpoints fire on paper.** The print width is ≈ 718 px, i.e.
   `@media (max-width: 720|760|820px)` is active: the weeks go into two columns, the storylines into
   one, the doodles hide — and the sheet doubles in size. So the `@media print` block **must be
   last in every CSS module** (equal specificity — the last one wins) and must restore the
   "desktop" layout explicitly. When moving these blocks, keep them at the end of the file.
3. **`break-inside: avoid` on a large group** makes Chrome push it out whole and leave blank
   sheets. Forbidding breaks belongs on individual sections, not on a group.

The fill layer does not go to paper even on a demo: the scale fill, `.cellFace`, the notes in the
wrap-up and the ideas, the photos — all hidden in printing with `display: none` (not
`visibility: hidden`: hidden text keeps its height and can push out an extra page). Hide any new
on-screen control in `@media print` right away, or it will show up on the printout.

How to check it (without the modal print dialog, which blocks automation):

```bash
"/Applications/Google Chrome.app/Contents/MacOS/Google Chrome" --headless=new \
  --disable-gpu --no-pdf-header-footer --virtual-time-budget=6000 \
  --print-to-pdf=out.pdf http://localhost:3000/sheet
grep -ao "/Count [0-9]*" out.pdf | head -1   # the page count, must be 2
qlmanage -t -s 1200 -o . out.pdf             # a preview of the first page
```

To measure heights and check the second page visually in a browser: apply the rules from
`@media print` as an ordinary `<style>`, disable the on-screen `max-width` media queries
(`rule.media.mediaText = 'not all'`) and narrow `#root` to 718 px — that shows exactly what will go
to paper. Emulation without disabling the `max-width` media queries lies: the window is wide and
the mobile rules do not fire.

## Drawings

`src/components/AvatarFace.tsx` — four avatars in one `viewBox="0 0 64 64"`. Adults and children
must differ by **silhouette**, not by details: in the mood table an avatar is drawn at 20 px, where
only a blob is visible. Dad has a beard on the cheeks and chin, mum has a bob and earrings, the
children have noticeably smaller heads (r 13 against 15+), a cowlick and pigtails. Draw small
details on the hair in white with a stroke, or they drown in the dark mass (`currentColor` on the
hair and the details is one colour).

The drawings (`src/components/doodles/`) are inline SVG on `currentColor` too; there are no raster
images in the layout and none need to be added. They exist in two kinds, and they must not be
confused:

- **the library** — `icons.generated.ts` (generated) plus the `Icon.tsx` renderer. Forty drawings
  on a shared grid, from which the poster's sets are assembled (see "Icon sets"). The poster calls
  them only through `PosterIcon`, by slot;
- **the site doodles** — `HeartDoodle`, `FamilyIcon` and the other names in `index.ts`. Seven of
  them are one-line wrappers over `Icon` with a fixed name: the site has its own drawings and does
  not depend on the poster's set, but the geometry must not be kept in two copies. For their sake
  `Icon` has two overrides, `filled` and `strokeWidth`: on a toolbar button a drawing is 18 px, and
  the common stroke of 2.3 on a grid of 64 gives the same grey cobweb there as in the `spark` slot.
  Adding a second drawing for the sake of a button is not allowed. The rest (`SparkleRays`,
  `FridgeDoodle`, `PenDoodle`, `PrinterDoodle`) are not in the sets and are drawn right in their
  own files.

`PosterIcon` is deliberately not exported from `index.ts`: it reads context, and the barrel is
imported by the site's server components.

**The site's own raster pictures live in `public/` and are all generated.** `favicon.ico`,
`icon-*.png`, `apple-icon.png`, `logo-120.png` and `og-*.png` are built by `npm run logo` and
`npm run og`; they are not edited by hand. The rule "there are no raster images in the layout"
holds — none of them is in the markup: an icon and a link preview are exactly the places where
SVG is not accepted, neither by Google nor by messengers (see "Link previews and icons").

The example photographs are the only pictures kept as files: `public/examples/<id>/week-N.svg`, and
the paths to them lie in the `photos` of the corresponding fill set. They are vector too, but they
are painted in their own colours and know nothing of the themes: they are `<img>`, which CSS
variables cannot reach anyway. The rule "only the four paints of the set" does not apply to them —
they are the **fill layer**, not the layout: they do not go to paper, and there are no real
photographs in the project, these are deliberate stubs for "what a lived week looks like".

## Tests

E2E on Playwright plus formatting and linting on commit. The layer is young: the frame is up, the
scenarios are arriving one at a time.

| What | Where |
| --- | --- |
| Config, port, test server | `playwright.config.ts` |
| Fixtures (`signedIn`) | `e2e/fixtures.ts` |
| Faking the session cookie | `e2e/support/session.ts` |
| The scenarios themselves | `e2e/<breed>/<rule>.spec.ts` |
| The test database snapshot | `tools/db/reset-e2e.mjs` (`npm run e2e:db`) |
| Hooks | `.husky/pre-commit`, `.husky/pre-push` |
| Formatting | `.prettierrc`, `.prettierignore` |

- **The tests are a knowledge base about how everything must work.** A test title is a statement
  about the product ("what is taken off the showcase stays in favourites"), not a retelling of
  clicks ("a click on the megaphone opens a dialog"). The vocabulary is the product one, as the
  "Conventions" section requires.
- **The link with this file goes both ways.** The spec header names the CLAUDE.md section it
  checks; here, next to an invariant, stands a "Verified by: `<file>`" line. A divergence is
  visible from both sides, and a red test means the documentation is out of date.
- **Labels come from the dictionary, expected values are written out literally.** Locators go
  through `DICTS.ru.bars.fork`; we do not create a second copy of the Russian text in the tests.
  The expected result, though, is a literal (`/en/seasons?tab=published`) rather than a computation
  through `withLang`: a test that computes the answer with the same function it is checking asserts
  nothing.
- **We do not add `data-testid`.** There is not one in the markup; locators are `getByRole` and
  `getByLabel`, i.e. by the same things a person and a screen reader read the page by. Test markup
  has no business in the poster — it prints, after all.
- **We do not check layout and colours**, except for printing in two pages: that is principle 3.
  There are no screenshot tests here and none should be added — they break on a theme change (and
  there are a hundred themes) and keep images in the repository.
- **State is prepared by a fixture, and only the flow under test is clicked through.** A test about
  withdrawal from the showcase does not go through publishing with buttons.
- **What is deliberately not covered goes as a list at the end of the spec**, like "Deliberately
  not done" here. Empty space must be chosen, not forgotten.

About the infrastructure — the things that have already cost debugging:

- **The tests run against `next start` on port 3100, not against the dev server.** There are two
  reasons and both are hard. A developer's dev server looks at the **working** database, and
  substituting `DATABASE_URL` only affects the server Playwright starts itself —
  `reuseExistingServer` would pick up someone else's and write into dev with the tests. A second
  dev server cannot be raised either: `next dev` holds a lock in `distDir`, and there is no flag to
  change it. The build is cheap (about ten seconds on a warm cache) and additionally checks what
  goes to production.
- **The test server needs `AUTH_TRUST_HOST`.** In production mode Auth.js answers `UntrustedHost`
  and **silently does not read the session** — the page looks like a signed-out person's, and you
  look for the bug anywhere but here. On Vercel the host is supplied automatically, locally there
  is nobody to do it. The variable stands in `webServer.env` and does not touch the code.
- **Sign-in is faked with a cookie, not with a test provider.** That is possible precisely because
  sign-in has no database adapter: the session lies entirely in an encrypted cookie, and the same
  `AUTH_SECRET` is enough. `src/server/auth.ts` contains no test code and must not.
- **The test database is separate and is always built from a snapshot.** The snapshot is the
  migrations plus `db:seed`; there is no separate copy of the schema, so a new migration is picked
  up by itself. `reset-e2e.mjs` drops the schema whole, so it reads `E2E_DATABASE_URL` and
  **refuses to work if it matches `DATABASE_URL`**.
- **Isolation is by a per-test `accountKey`**, not by cleaning up afterwards. There is one snapshot
  per run, the tests are parallel, and all rows are keyed by account. Only the showcase is global:
  a test that publishes something must assemble unique content and check its own code rather than
  the number of seasons on the page.
- **E2E is not a build step on Vercel, and that is a decision.** The build must remain something
  that just builds the site: by the same rule the migration is not a build step — its failure would
  take down the deploy of a site that works with a dead database. A test database that fell over has
  no right to get in the way of a release. On top of that the Vercel build image is Amazon Linux
  2023, while Playwright supports only Debian and Ubuntu: the list of Chromium system libraries
  would have to be maintained by hand.
- **`npm run e2e` rebuilds the project, and that is not wasteful.** `e2e:only` runs the tests
  against the previous build, so after fixing application code and running it you would silently be
  checking the old one. The fast variant is left exactly for editing the specs themselves.
- **E2E is not on `pre-push` yet, and that is a decision.** The hook does only `lint` and
  `typecheck`. A suite of one test is not worth the wait, and a hook that slows you down for
  nothing starts getting skipped with `--no-verify` — and after that it is skipped out of habit.
  The line `npm run e2e` goes back into `.husky/pre-push` when there are enough scenarios.
- **A hook that cannot be skipped will make someone skip it by editing the hook.** The emergency
  exit is `git push --no-verify`, and it is named in the README deliberately.
- **Generated files are in `.prettierignore`.** Format them and the next `npm run palettes` silently
  produces a difference. `*.md` is there too: CLAUDE.md and the README are wrapped by hand.

## Development principles

1. **First decide which layer a change belongs to.** It prints → `Template` (and therefore it gets
   into the link and requires a format version). It is written by hand → `FillState` (and therefore
   it is hidden in printing). There is no third option.
2. **Printing is checked with a real PDF, not by eye.** Any layout change means running the recipe
   above on two configurations: the demo (4 people) and the worst case (5 people, a month of 31 days
   and two-line descriptions — that is what eats the second page's slack). Both must give exactly 2
   pages. **A change to captions, placeholders or month names means a run in all three languages**:
   the field limits were measured for Russian and the wrapping differs per language. The theme
   prints (`print-color-adjust: exact`) but does not affect the layout, so other themes need to be
   run only when the change touches the colours themselves; then take the extreme cases: a set with
   all-light paints (`pastel`) and a set with a white one (`authority`).
3. **The poster is drawn for print, and the screen shows the printout.** All the sheet's backgrounds
   are white on the web too — the only coloured fill is a personal project card, and it prints.
   Colour is carried by badges, frames, ink and doodles. On-screen "prettiness" that will not be on
   paper (coloured paper, gradients, shadows instead of frames, highlighted sections) is a
   regression: it disappears in printing, and the poster turns out not to be what was on screen.
   Hence: web and print are **one layout**, and in `@media print` only tightening to the A4 width,
   restoring the desktop layout, hiding the on-screen controls and the fill layer, and replacing
   unprintable shadows with frames belong. New styling is made in the shared styles first, not
   duplicated for printing.
4. **The link format must not be broken silently.** Change the composition of `Template` — new
   version prefix and reading of the old format in `decodeTemplate`.
5. **We do not keep dead code.** An unused export, prop or model field is deleted in the same change
   where it stopped being needed. The check: `grep` for the export name and a comparison of the CSS
   module's classes with `styles.*` in the component.
6. **A comment is written only where the code is ambiguous.** By default there is no comment: the
   function name, the type and the line itself say what is happening. A comment appears when the
   obvious solution is wrong and has already been tried — the uncontrolled `contentEditable`,
   `display: block` in printing, the scale's ticks as cells rather than a gradient. It explains
   "why", and such places are not reopened.

   What must not be in a comment: a retelling of the next line ("set the cookie", "read the
   session"), divider headings above blocks of code, the name of what is already in the identifier,
   "important" markers without a reason, and a retelling of CLAUDE.md — the site's workings are
   explained here, not in thirty copies across the files. See such a comment — delete it, do not fix
   it.
7. **The examples live in `src/data/examples/<id>.json`** and are wired up by the
   `src/model/examples.ts` registry. Do not hard-wire example text into components. Inside a file
   the layers lie apart — `template` and `fill` — and that is the only place where they are seen
   side by side. The theme lies next to them as a `"palette"` line: it is not part of the blank. A
   new example is a new file and a line in the registry; the card on the landing page appears by
   itself. There must be no line breaks in the blank's texts: an example shows a sheet, not the art
   of placing Enter.
8. **Before finishing a task:** `npm run lint`, `npm run typecheck`, `npm run build`, `npm run e2e`
   and printing in 2 pages. Everything clean — only then is the work done. The first two are on the
   hooks (`.husky/`), e2e is not and is run by hand; but do not rely on a hook instead of checking
   either — it is skipped with one flag.

## Conventions

- **Comments are in English, the UI is in the dictionary.** There are no user-facing strings in the
  markup at all: a new string is created in `src/i18n/dict/ru.ts` and translated into `en.ts` and
  `pl.ts` by the same change (`npm run typecheck` will not let you forget). A comment explains
  "why", it does not retell the code.
- **The product's vocabulary and the code's vocabulary are different, and that is deliberate.**
  Outward (the landing page, the toolbar, the metadata, the README introduction) a month is a
  **season**, a printout is a **poster**, the weeks are episodes, personal projects are storylines,
  the summary is the wrap-up and the ideas for next month are what is next up. Inside (`Template`,
  "the blank", "the fill layer", the sections about the invariants) the terms are the old ones: the
  main invariant is tied to them, and renaming them for the sake of a metaphor is not needed. Write
  new text for the user in the first vocabulary and a new comment in the second.
- **Text in the interface is simple and unambiguous; the site's workings are explained here, not on
  screen.** The expansive style of this file does not extend to user-facing strings: a dialog has a
  two-word heading and one phrase — a question ("Are you sure you want to delete the season "X"?")
  or an instruction ("Enter a new name for the season."). Neither "there is no other copy, with you
  or with us" nor a run-through of every branch: that is the content of CLAUDE.md. There are no
  metaphors ("the poster lives in this row") in the UI either. A second phrase is allowed exactly
  where without it a person would answer the wrong question — like the note on withdrawal from the
  showcase (`WITHDRAW_NOTE`), where "take off" is too much like "delete".
- Styles are CSS Modules next to the component only; colours and fonts come from
  `src/styles/tokens.css`. A new colour is created not as a literal in a module but as a role in
  `tokens.css` — and therefore derived from the theme's four paints, like all the others.
- `npm run lint` (oxlint) and `npm run build` (next build, which also typechecks) must pass clean.
- `noUnusedLocals`/`noUnusedParameters` are on in `tsconfig`, `strict` is not.
- We do not store field versions in the models: the format version lives in the link prefix. A `v`
  field in the document is not needed.

## Deliberately not done

- There is no editing of the fill layer from the interface (clicking a mood cell and so on) — the
  blank is filled in on paper.
- There is no photo upload: only an empty space for gluing one in.
- There is no adding or removing of weeks and sections — their composition is fixed by the layout.

<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->
