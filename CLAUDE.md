# Project notes (for the agent)

The product description is in `README.md`. Here is only what is easy to break without knowing
the intent. Rationale that is no longer needed to act on is in git history.

## The main invariant: two layers

- `Template` — the blank. **Only it is printed and only it is stored in `content`.**
- `FillState` — the fill (moods, percentages, notes, photos). Not stored, not copied by a fork,
  not printed; it exists only for the examples (`src/data/examples/`, registry
  `src/model/examples.ts`).

Consequences:

- in the blank, project progress is **0**, mood cells and "How it went" / "Ideas for next month"
  are **empty** — all of it is filled in with a pen on paper;
- any new field is consciously assigned to a layer: it prints → `Template`, it is written by hand
  → `FillState`;
- week photos come only from `FillState.photos`; the blank always draws the empty `.placeholder`
  frame, and a photo lies on top of it (hidden in print);
- **the theme, the icon set and the language are deliberate exceptions**: they print (the language
  chooses what to print with) but live in their own columns next to `content`, never inside it.
  There must not be a fourth exception, and no value may exist in two copies.

## Two breeds of season

- a **personal season** (`user_seasons`) — your own collection, invisible from outside, a fork
  always makes a new row, the content can be edited;
- a **published season** (`public_seasons`) — an idea with a permanent short address, likes,
  reports, favourites. Publishing is a **copy**, not a pointer: no link back to the personal row.

Three things hold up everything else:

- **every poster has exactly one storage.** Signed in — a database row; signed out — a single
  draft in `localStorage`. There is never a second copy.
- **people's names live apart from the content** (`names` next to `content`): uniqueness of a
  publication is counted by content, and swapping exactly `names` is what anonymises it.
- **a dead database means "there are no seasons"**: the landing page, a signed-out person's draft
  and printing keep working. Nothing else lives without the database, and there is no need to
  pretend otherwise.

## The frame: Next.js

**Every address has the language as its first segment** (`/ru`, `/en`, `/pl`); the root layout
lives inside `[lang]`. The only exception is `/api/*` — route handlers get no root params.

| Address | What | Rendering |
| --- | --- | --- |
| `/<lang>` | Landing page | Server component |
| `/<lang>/sheet`, `…/edit` | The draft from `localStorage` | `'use client'` + `dynamic(ssr: false)` |
| `/<lang>/season/<code>`, `…/edit` | Your own season; edits write themselves | Server page + client poster |
| `/<lang>/p/<token>` | The same row by private link, viewing only | same |
| `/<lang>/s/<code>` | A published season (examples included) | same |
| `/<lang>/seasons` | "My seasons" (tabs: my, favourites, published) | Server component |
| `/<lang>/ideas` | "Community Ideas" — the showcase | Server component |
| `/<lang>/month`, `/<lang>/month/<slug>` | The month articles | Server component |
| `/<lang>/account`, `/<lang>/privacy` | Account, privacy policy | Server component |
| `/api/auth/*`, `/api/family` | Sign-in, the family for the live poster | Route handlers |
| `/<lang>/<anything else>` | Our own 404 page | Server component |

- **The path carries the mode, not a flag**: viewing and editing are different addresses for all
  three kinds of poster. Switching is an ordinary link; there is no hand-written `history` work.
- **There is no content in the address** — only a row's short code. The only exception is `?p=`
  and `?i=` on a published season: a styling override that does not touch the row.
- The bundler is **Turbopack** (the Next 16 default). **`output: 'export'` must not be added** —
  it would kill the route handlers.
- `ssr: false` on the sheet only concerns page rendering; route handlers are an independent layer.
  `src/app/[lang]/sheet/*/page.tsx` are server components with the sheet loaded through the client
  `SheetLoader.tsx` (`next/dynamic` with `ssr: false` cannot be called from a server component).
- **Next patches `history.pushState`/`replaceState`.** Call `replaceState` **with `history.state`**
  (the styling override on `/s/<code>` is the one remaining caller); `null` goes through
  `ACTION_RESTORE` and may remount the poster.
- The `<div id="root">` wrapper in `layout.tsx` stays: padding, `min-height` and the print-check
  recipe are tied to it. Inside it the layout draws `SiteHeader`, `<main>`, `SiteFooter`.
- **The site frame does not go to paper.** Header and footer are hidden in `@media print`, and
  `#root`/`main` go back to `display: block` there. Hide any new frame element right away.
- Links to site pages are `next/link`; **links into the poster are plain `<a href>`** (client
  pages with their own bundle chunk). The exception is "Edit"/"Done" inside your own season — a
  soft transition, so an unwritten edit reaches the server.
- Only four client components live in the site frame, all deliberate: `Toast`, `NewSeasonButton`,
  `DraftClaimer`, `LangSync`.
- Fonts are `next/font/google`; `tokens.css` uses `--font-nunito`, `--font-caveat`,
  `--font-marck-script`. `subsets` must name `cyrillic` and `latin-ext` explicitly, as literals.
- In `.oxlintrc.json`, `react/only-export-components` is off for `src/app/**`.

## Languages

Three languages: Russian (the reference dictionary), English, Polish. The other two must have
exactly the same keys.

| What | Where |
| --- | --- |
| Language list, cookie, `Accept-Language` | `src/model/lang.ts` |
| Dictionaries, registry | `src/i18n/dict/{ru,en,pl}.ts`, `dict/index.ts` |
| Dictionary shape | `src/i18n/types.ts` (`Dict = typeof ru`) |
| `{n}` and `**bold**` | `src/i18n/fill.ts` |
| Server / client access | `src/i18n/server.ts` (`getLang`, `getDict`), `src/i18n/LangProvider.tsx` |
| Language in the address | `src/proxy.ts`, `withLang`/`stripLang` in `model/site.ts` |
| A signed-in person's setting | `user_settings.language`, `readLanguage`/`writeLanguage` |
| Writing the detected language | `components/site/LangSync.tsx`, action `rememberLanguage` |
| Switchers | `components/site/LangSwitcher.tsx`, `app/[lang]/account/LanguageEditor.tsx` |

**Two languages that must not be confused:**

- the **interface language** — header, buttons, dialogs, toasts, and the on-screen buttons on the
  poster itself. Stands in the address, in a cookie and, for a signed-in person, in the database.
  `getDict()` / `useDict()`;
- the **season's language** — the sheet's own captions (month, section labels, placeholders). Lies
  in a column next to the content and **does not follow the setting**. `usePoster()`.

### The address and who decides

`proxy` knows only the address, the `fs-lang` cookie and `Accept-Language`:

1. the path has a language — let it through and remember it in the cookie;
2. no language — cookie, then `Accept-Language`, then Russian, and redirect.

It adds `x-lang-path` (the path without the language **with the query**) and `x-lang-source`
(`url` — the language was requested, `auto` — `proxy` supplied it, marked by the one-day
`fs-lang-auto` cookie so its own redirect is distinguishable). **The database setting is stronger
than `auto` and weaker than `url`**; the root layout does that redirect. `proxy` never goes to the
database. After signing in we return to the path **without** a language (`stripLang` in
`googleLoginUrl`), so the setting wins; `?p=`/`?i=` survive the trip.

The switcher is in the header (a `<details>`, no JS), carries one globe without the language name,
and its `z-index` is 35 — the site's ladder is toolbar 20, floating buttons 30, language menu 35,
consent banner 36, toast 40.

Verified by: `e2e/site/lang.spec.ts`.

### The dictionary

- **Not a single user-facing string in the markup** — everything is in `src/i18n/dict/*`.
- **The shape is derived from Russian** (`Dict = typeof ru`); no `as const`.
- **Values are strings, not functions** (they travel in the RSC payload); substitution is `{n}`
  plus `fill()`.
- **Plurals are avoided with "Word: N"** ("Лайков: 3"). No `Intl.PluralRules`.
- The only markup in the dictionary is `**bold**` on `/privacy`, parsed by `marked()`.
- **Two month lists per language**: `months` (nominative, captions) and `monthsOf` (genitive, for
  dates); lower case inside a sentence is decided by `monthLowercaseInText`.
- Theme and icon-set labels are `{ru, en, pl}` in `tools/palettes/source.json` and
  `tools/icons/source.json`; the build checks no language is forgotten.
- **Language names in the switcher are not translated** (`LANG_LABELS`).
- House vocabulary, translated consistently: сезон — season / sezon, постер — poster / plakat,
  недели — weeks / tygodnie, сюжетные линии — storylines / własne projekty, финал — wrap-up /
  podsumowanie, анонс — next up / na przyszły miesiąc.

### What is language-dependent

- **A publication lives only in its own language**: `randomIdeas(lang)`, and
  `/en/s/<code of a Russian season>` is a 404. Therefore **every link to `/s/` is built with the
  season's language, not the viewer's** — five places: the showcase preview, the two account rows,
  the transition after publishing, the duplicate link in the publish dialog. This does **not**
  apply to `/season/<code>` or `/p/<token>`.
- **Uniqueness of a publication counts the language**: `content_key = md5(language || content)`.
  Changing the language in the publish dialog recomputes the showcase's answer.
- **Anonymising takes names from the season's language** (`anonymousNames(count, lang)`).
- **The examples are translated whole** — one file per language (`src/data/examples/<lang>/demo-N.json`),
  each a showcase row of its own; week photographs are shared. Row ids come from the `PUBLIC_IDS`
  table, never from order: a short code is permanent.
  - `public_seasons.id` is `generated by default as identity`, so examples and people's
    publications share one column. Everything new is numbered from `SYSTEM_ID_BASE` (1 000 001);
    the first three examples stay at 1..9 because their codes are out in the world.
  - The seed's closing `setval` looks only at `id < SYSTEM_ID_BASE`, and it **refuses to write over
    a row with an `author_key`**. Moving an example to another id means deleting its old row by
    hand first (`content_key` is unique).
- **An adaptation is not a translation, and the shared photograph decides how far it can go**:
  where a week has a drawing, the three languages tell the same story.
- `localeCompare` takes the list's language.
- **Printing is checked in every language** — `longestMonth(lang)` is the heading spacer.

### What languages do not have

No auto-translation of content, no language inside `Template`, no separate domain per language.

## Address and storage

| Kind of poster | Where the content is | Address |
| --- | --- | --- |
| Draft | `localStorage`, one per browser (`src/model/draft.ts`) | `/<lang>/sheet`, `…/edit` |
| Your own season | a `user_seasons` row | `/<lang>/season/<code>`, `…/edit` |
| The same one by private link | the same row, viewing only | `/<lang>/p/<token>` |
| Published | a `public_seasons` row | `/<lang>/s/<code>` |

- **A code is a permutation of the bits of an id** (`src/model/shortcode.ts`): a Feistel network
  over 2^30, one-to-one, no collisions, codes live forever. Each table has its own key and they
  must not be changed. There is deliberately no inverse transform — a row is found by its `code`.
- **The private link's token is random**, sixteen characters: it is the only address that can be
  **revoked**.
- **The content is stored taken apart**: `content` is `pack()` from `codec.ts`, `names` is a
  separate array (`src/model/season.ts`). Columns "month", "theme" or "people" must not be added;
  `language`, `palette`, `icons`, `share_token` next to it are the allowed styling columns.
- Everything from outside — database, `localStorage`, a form — goes through `normalizeTemplate`:
  2..5 people, exactly 4 weeks, month in range, strings trimmed, limits applied.
- No compression or base64 in `codec.ts` any more; the same array goes into the database as `jsonb`.

## The month

`src/model/calendar.ts`. Stored as numbers (`year`, `monthIndex`); the name comes from the
**season's** dictionary (`monthName(month, lang)`), the length from `daysInMonth`. There is no
"days in the month" field. A new sheet takes its month from `pickTargetMonth` (before
`MONTH_SWITCH_DAY` = the 10th, the current one; after, the next). The heading's width is held by a
hidden spacer with `longestMonth(lang)`, so the arrows do not jump.

## Colour themes

A hundred themes, four paints each.

| What | Where |
| --- | --- |
| Source | `tools/palettes/source.json` |
| Build (`npm run palettes`) | `tools/palettes/build.mjs` |
| Generated | `src/styles/palettes.css`, `src/model/palettes.data.ts` |
| Choosing, default, random | `src/model/palettes.ts` |
| Site theme and roles | `src/styles/tokens.css` |

- **Generated files are not edited by hand**: change `source.json`, run `npm run palettes`. All the
  picking (sorting by lightness, contrast, dark shades) lives in `build.mjs`.
- **The site theme is separate, neutral and does not switch**; a poster of any theme may stand
  next to it.
- **The four paints are sorted by lightness** `--c1`..`--c4`, so the "deep" role is everywhere the
  darkest.
- **Roles, not colours**: `--accent-<slot>` is the dark shade (frames, headings), `--badge-<slot>`
  the paint, `--on-<slot>` the computed text colour (white or ink, threshold 4:1). Slots:
  `deep`/`projects` → 1, `theme` → 2, `weeks` → 3, `goal` → 4.
- **The recipe must lie on the same element as the paints** — hence the `[data-palette]` block in
  `tokens.css`, not `:root`.
- **The backgrounds are white, on paper and on screen** (`--paper`, `--surface`, `--photo-frame`).
  The only coloured fill is a personal project card (10 % of the person's colour). Do not add
  fills — that is a regression, not decoration. There is no separate print palette.
- **Moods are excluded from the themes** (`--mood-good|ok|bad` is a traffic light).
- **The theme lives on the poster, not on the page**: `PaperSheet` sets `data-palette` from the
  `palette` prop. Do not move it onto `<html>`. Selectors go by attribute, with no tie to `:root`,
  so a swatch can carry its own theme.
- **The example cards on the landing page do not carry a theme** — they are part of the site.
- **There is deliberately no dark theme.**
- A person's colour is derived from their drawing into `var(--person-${face})`.
- **The switcher throws you into a random theme** (`randomPalette`, the current one excluded) and
  is visible in **all three states of the poster**, examples included. It is a floating button
  (`FloatingControls`), not part of the toolbar.

## Icon sets

Twenty sets of eight drawings, from a library of forty.

| What | Where |
| --- | --- |
| Source | `tools/icons/source.json` |
| Build (`npm run icons`) | `tools/icons/build.mjs` |
| Generated | `src/components/doodles/icons.generated.ts`, `src/model/icons.data.ts` |
| Choosing, default, random | `src/model/icons.ts` |
| Renderer and slot | `src/components/doodles/Icon.tsx`, `PosterIcon.tsx` |
| The set on the poster | `src/components/doodles/iconSetContext.ts` |

- **A slot is a place in the layout, not a drawing.** Eight of them: `mark`, `love`, `voice`,
  `spark`, `path`, `goal`, `care`, `idea`. A new place means a new slot in `source.json` and a line
  in each of the twenty sets — the build will not let you forget one.
- **All drawings sit on one `0 0 64 64` grid**; the slot sets the size.
- **A set travels through context, not as an attribute** (SVG geometry cannot be substituted with
  CSS). The context default is a real set — `PaperSheet` also exists without a provider.
- **A small slot needs a different stroke** (`spark` at 18 px has its own `stroke`/`fill` in the
  source). Do not bring them to a single thickness.
- **The switcher is random too** (`randomIconSet`), visible in all three states; the swatch shows
  three drawings in site colours.
- Generated files are not edited by hand; the build checks eight slots per set, existing names, no
  unused drawing, no repeated ids.

## Sign-in

Google on Auth.js (`next-auth@5`, beta is its normal state).

| What | Where |
| --- | --- |
| Config, `auth`/`signIn`/`signOut`/`handlers` | `src/server/auth.ts` |
| Server actions | `src/server/actions.ts` |
| Route handler | `src/app/api/auth/[...nextauth]/route.ts` |
| The button | `src/components/site/LoginButtons.tsx` |
| Variables | `.env.example` (values in `.env.local`) |

- **There is no database adapter**: the session lives in an encrypted cookie (JWT), and not a line
  about the user is on the server. What is stored is described on `/seasons` and `/privacy`, and
  those texts are **edited by the same change** as the storage.
- **Sign-in is a server action, not `useSession`** — no Auth.js code reaches the browser, no
  `SessionProvider`. Do not move it to the client hooks.
- **`proxy.ts` is not a line of defence.** The check stands in the server components at the data
  source; `proxy` only puts the language in the address.
- **A signed-out person is not redirected away** from `/seasons`; there is no `/login` page.
- **After signing in a person stays where they were**: `GoogleLoginButton` passes
  `location.pathname + search + hash`; `googleLoginUrl` **returns an address** and the browser
  follows it with `location.href` (a router `redirect()` to Google costs a failed RSC fetch).
  `returnTo` is checked by `safeReturnTo` — relative only, `//host` rejected.
- **One sign-in button for the whole site** (`GoogleLoginButton`), its label a prop.
- **The session carries an `accountKey`** — `provider:id`, set by the `jwt`/`session` callbacks
  (types in `src/server/next-auth.d.ts`). **`token.sub` must not be substituted for it** — without
  an adapter it is a random per-session UUID. An old session without a key gives `stale`, and the
  account asks the person to sign in again.
- Keys are found by provider name; `AUTH_GOOGLE_ID`/`SECRET` are not mentioned in the config.
- A second provider is a line in `providers` plus a button with an inline-SVG mark. We do not show
  avatars (a foreign domain would need `images.remotePatterns`).
- **The price: the root layout is dynamic** — no route is static. Accepted deliberately.

## Settings and the database

`user_settings` holds three settings: interface language, the family for new posters, the
analytics answer.

| What | Where |
| --- | --- |
| Pool, "a query that does not throw" | `src/server/db.ts` |
| Logging | `src/server/logger.ts` |
| Reading/writing settings | `src/server/settings.ts` |
| The family model | `src/model/family.ts` |
| Schema, migrations | `tools/db/migrations/*.sql`, `tools/db/migrate.mjs` (`npm run db:migrate`) |
| Account page and editors | `src/app/[lang]/account/` |
| The server-error toast | `src/components/site/Toast.tsx` |
| The family for the live poster | `src/app/api/family/route.ts`, `src/state/useFamilyPreset.ts` |
| The swap button and dialog | `src/components/edit/FamilySwap.tsx` |

- **There is no poster in `user_settings`**, and no table of users: a row is named by `accountKey`
  (deliberately not the email). Neither the name nor the email from Google is in the database.
- **Language and family are written by different statements** — a shared upsert would let one
  writer overwrite the other's value.
- **The family has two routes to the poster**: into a **new** season at creation
  (`templateForFamily` inside the `createSeason` action), into an **already open** one only through
  `GET /api/family` + `useFamilyPreset` + the `replacePeople` mutator. The request goes out only in
  edit mode; silence from the server is `null` and means "no button".
- **The swap keeps card content by position** — only drawing and name change; extra cards are
  dropped, missing ones added empty. Confirmation is mandatory (cards may be lost).
- **"New season" is one button for the whole site** (`NewSeasonAction.tsx` server wrapper +
  `NewSeasonButton.tsx` client button) and **always asks for a name** — for both roles. The default
  name is computed on the client (`defaultSeasonTitle`, from the blank's `theme`).
- A signed-out person gets a draft in `localStorage` and goes to `/sheet/edit`.
- **The site must work with a dead database**: `query` does not throw, `readFamily` returns `null`.
  Do not add queries that bring a page down.
- **A server error is shown one way: a toast plus emptiness where the data should be.** No stub
  pages, no `error.tsx` per segment, no "try again later" defaults — a default passed off as real
  settings would be overwritten by the next `upsert`.
- **`query` returns a tagged result**: `ok`, `unconfigured`, `failed` (a string discriminant —
  `strict` is off and TypeScript will not narrow a boolean). Outward they collapse to `error`.
- **The log must answer "what to fix"**: `error.code` plus a call label (`settings:read`, …); the
  SQL is **not** logged (people's names travel in the values). "No `DATABASE_URL`" is logged once
  per process. `AggregateError` is unwrapped by hand (`describe()`).
- **Reading is wrapped in `cache()` from React** (per request). The account uses the uncached
  `familyState`: it needs a fresh answer and the reason for emptiness.
- **If the family was not read, the editor is not shown** — never a default.
- **The family travels as an action argument, not as form fields** (React renames fields of a form
  submitted from a client component). `normalizeFamily` in `saveFamily` still cuts the bounds.
  Success travels as `?ok=1` in the address (it must survive a reload), failure comes back as a
  value and becomes a toast; the editor cleans `?ok=1` with `replaceState` after the first render
  and is keyed by the family from the server.
- **Family bounds are the poster's bounds** (`MIN_PEOPLE`..`MAX_PEOPLE`). **Names are required in
  the family, not on the poster**: `familyNamed` stands outside `normalizeFamily` (old rows and
  `DEFAULT_FAMILY` have no names); the Save button is disabled and `saveFamily` answers `unnamed`.
- **The schema is applied to production by hand**, not as a build step:
  `vercel env pull --environment=production .env.production.local`, then
  `node --env-file=.env.production.local tools/db/migrate.mjs`, then the seed with
  `--import tsx tools/db/seed-examples.ts`. `--env-file` is a node flag and cannot go through
  `npm run`. Every script prints host and database before connecting (`dbTarget`).
- **Steps are numbered and recorded in `schema_migrations`**; `npm run db:status` shows what is
  left. The old schema is `000_legacy.sql`.
- **`/privacy` describes the contents of the database literally** — a new row means rewriting the
  page in the same change, in all three languages.

## Consent and analytics

Google Analytics is the only third-party library that reaches the browser.

| What | Where |
| --- | --- |
| Type, version, cookie, parsing | `src/model/consent.ts` |
| Reading the answer and `GA_ID` | `src/server/consent.ts` |
| Columns, `readConsentSetting`, `writeConsent` | `src/server/settings.ts` |
| The node, the tag, the banner | `components/site/ConsentGate.tsx`, `Analytics.tsx`, `ConsentBanner.tsx` |
| Footer link, account section | `components/site/ConsentLink.tsx`, `app/[lang]/account/ConsentEditor.tsx` |
| Schema, gtag types | `tools/db/migrations/006_consent.sql`, `src/model/gtag.d.ts` |

- **No `GA_ID` — nothing at all**: no banner, no footer line, no account section, no database
  query. Asking consent for something that is not happening is forbidden.
- **The variable is a server one** (`GA_ID`, not `NEXT_PUBLIC_`), and the id travels to the browser
  as a prop.
- **Consent Mode v2**: `gtag` loads at once with all four keys `denied`, and "Accept" updates the
  mode in place — no reload.
- **Two storages, cookie stronger than setting**: `fs-consent` is this browser's answer, the
  `consent`/`consent_version`/`consent_at` columns are the account's. The order is `cookie ?? saved`.
  Silence from the database for a signed-in person is not overridden by the cookie.
- **Three columns because there are three questions**: what, to what version, when — `consent_at`
  comes from the database's `now()`. `null` means "not asked", never "forbidden"; the column has no
  default.
- **A changed `CONSENT_VERSION` reads as "not asked"** and the banner comes out again.
- **The banner is a bar, not a modal**: locking the site would make consent unfree. Both buttons
  carry the same weight, and a refusal is remembered for the same six months as consent.
- **Two ways to change your mind, both mandatory**: the account, and the footer "Cookies" link
  (`openConsent`/`subscribeConsent`) for everyone.
- **A server action sets the cookie** — the project never touches `document.cookie`.
- **There must not be a second such library.**

Verified by: `e2e/site/consent.spec.ts`.

## Modal dialogs

One wrapper for the whole site: `src/components/dialog/Dialog.tsx` and `Dialog.module.css`.

- **`confirm()` will not do anywhere**: it hangs the tab, breaks the print check and cannot show
  **what exactly** will change.
- **A dialog is drawn only while it is open**: the caller holds a `useState` and mounts it;
  `onDismiss` catches Esc, the backdrop and the cancel button at once. Do not switch to
  "always mounted + `ref.showModal()`".
- **Two button roles: `.ghost` on the left, `.primary` on the right.** No red "dangerous" button —
  the traffic-light colour means a warning about loss (`.warning`). The row arrives as a node, so
  it can hold a `<form>` with a server action.
- The heading links itself with `useId`; the scroll is locked once for the site by
  `html:has(dialog:modal)` with `scrollbar-gutter: stable`.
- The 560px width is a ceiling for **three** buttons; if a fourth does not fit, it does not belong.
- The button row is pressed to the bottom by `.dialog[open] { display: flex; flex-direction: column }`
  plus `margin-top: auto`. `[open]` matters: a bare `.dialog` would show it before `showModal()`.

## My seasons

| What | Where |
| --- | --- |
| Limits, names, statuses | `src/model/library.ts` |
| Reading, listing, writing, deleting | `src/server/userSeasons.ts` |
| Actions | `src/server/actions.ts` |
| Own season's poster | `src/app/season/[code]/` |
| A signed-out person's draft | `src/model/draft.ts`, `src/app/[lang]/sheet/` |
| The draft as a list row | `src/app/[lang]/seasons/DraftEntry.tsx` |
| Moving the draft after sign-in | `src/components/site/ClaimDraft.tsx` |
| The list, rename, delete | `src/app/[lang]/seasons/page.tsx`, `RenameEntry.tsx`, `DeleteEntry.tsx` |
| Rename from the poster | `src/components/edit/RenameDialog.tsx` |
| Schema | `tools/db/migrations/001_seasons_v2.sql` |

- **There is no uniqueness of content here** — a fork is a lawful second row. Uniqueness is a rule
  of the showcase only.
- **"Fork" exists on your own season too** (next month from the last one), but not in edit mode.
- **A row is always looked up together with its owner** (`where code = $1 and account_key = $2`):
  someone else's code is indistinguishable from an invented one.
- **A draft has a name and a date and is visible in the list.** It is drawn by the client only
  (`DraftEntry` through `useSyncExternalStore`; the server snapshot is `undefined`, which is not
  "there is no draft"). Draft writers wake the subscription themselves (`announce` in `draft.ts`).
- **A draft's date lies in a field** (`savedAt`, set by `writeDraft`); the month and the theme are
  derived from the blank.
- **Signing in claims the draft from any button and any page** (`ClaimDraft` in the root layout):
  a signed-in person has no draft. A claimed draft is **sealed** (`sealDraft`), or `DraftStore`'s
  debounced write would resurrect it; a manual deletion is not sealed.
- **The name is given at creation** (`defaultSeasonTitle`: month plus theme subtitle, in the
  season's language) and then lives its own life. **Renaming does not touch `updated_at`.**
- **The limit is 100 rows per account**, held by the application in the same query as the insert
  (the `room` CTE). The code is computed from `nextval` **before** the insert.
- **The month in the list is derived from the content**, not kept in a column.
- **Search is `position(lower($2) in lower(title))`**, not `ilike`; the sort order is substituted
  from the closed `LibrarySort` union. **Search and sorting live in the address** (`?q=&sort=`),
  and defaults are not written into it.
- **Deletion is confirmed with a dialog** — there is no other copy of the season.
- **In `RenameEntry` the action redirects but the component is not remounted**: hold the pending
  state in `useTransition` (a home-made flag would stick), and remember that `defaultValue` is set
  when the dialog opens.
- **If the list was not read — emptiness and a toast**, never a default.

## The showcase: publishing

| What | Where |
| --- | --- |
| Limits, threshold, statuses, wording | `src/model/community.ts` |
| Reviewing reports, closing by hand | `tools/db/reports.ts` (`npm run db:reports`) |
| Publishing, withdrawing, the showcase query | `src/server/publicSeasons.ts` |
| Anonymous names | `src/model/season.ts` |
| Bars and dialogs | `app/season/[code]/OwnBar.tsx`, `app/s/[code]/PublicBar.tsx`, `components/edit/{Publish,Withdraw}Dialog.tsx` |
| The account row | `src/app/[lang]/seasons/ShowcaseEntry.tsx` |
| The showcase and the mini-poster | `src/app/[lang]/ideas/page.tsx`, `src/components/community/SeasonPreview.tsx` |
| Schema | `001_seasons_v2.sql` (`public_*`), `004_reports_snapshot.sql` |

- **Publishing is a copy, not a pointer**: edits, renames and deletion of the personal season do
  not touch the publication. Only a **saved** season can be published.
- **No identical contents on the showcase**: `content_key` is a unique generated
  `md5(language || content::text)`. Theme, icons, names and title do not enter the comparison; the
  language does.
- **Publishing brings your own withdrawn row back and never touches someone else's**
  (`republishPublic`). A **visible** duplicate answers `duplicate` **with a code** and the person is
  taken to it; a withdrawn one answers without a code and a single toast. Branch order: a visible
  duplicate beats a lack of room, a withdrawn one is weaker.
- **Five visible publications per account** (`PUBLISH_LIMIT`, its own number, not `LIBRARY_LIMIT`).
  Withdrawn and closed rows take no room. The check is in the same statement as the insert.
- **The dialog starts with the showcase's answer**: `previewPublish` is a dry run of the checks
  with no write (your own withdrawn row is `ok` there). It is not a line of defence —
  `publishSeason` decides.
- **The megaphone in a personal season has no state**: always an ordinary button, two scenarios.
- **Anonymising swaps exactly `names`** (`anonymousNames`, no repeats), and only in the copy.
- **Withdrawing**: the row stays as `hidden_at` if somebody has it in favourites, otherwise it is
  deleted outright. Likes, forks and reports do not hold it (a report carries its own snapshot).
- **A closed publication (`blocked_at`) is shown nowhere**, its author included; `/s/<code>` is a
  404 for everyone. The author sees the mark in their list of publications.
- **A person closes it, by hand.** `REPORTS_TO_REVIEW` is a reason to look, not an action; the
  queue and the closing are `npm run db:reports` (`-- --block <code> "why"`, `-- --unblock <code>`),
  and `block_note` records why. **Closed content is not resurrected by reclaiming or by
  republishing the same content** (status `blocked`).
- **A hidden season is not a deleted one**: it opens at its address, accepts likes and forks, and
  is absent from "Ideas". Its bar names no place.
- **The megaphone works both ways and identically on `/s/<code>` and in the account**: pressed
  (`aria-pressed`) means "on the showcase, press to take off". A return asks no dialog and counts
  against `PUBLISH_LIMIT`; an already visible row answers `ok`. Only withdrawal is confirmed.
- **A publication's name is derived from the content** (`ideaTitle`), with no column and **without
  the month and year**, unlike `defaultSeasonTitle`.

About `/ideas`:

- **A dozen random ones, not the top by likes**: the query key is `power(random(), 1.0 / (1 + likes))`
  (Efraimidis–Spirakis).
- **"Show others" is an ordinary link with a growing `?r=` counter** taken from the address (not
  `Date.now()` — that is an impure call during render).
- **The preview is a mini-poster and therefore carries `data-palette`** — the only exception to
  "cards do not carry a theme". It has no storylines, moods, wrap-up, month or caption.
- **System seasons are ordinary showcase rows** without an author, with a rolling month, and they
  **cannot be reported** — so they carry no flag either (`Idea.system`, from `author_key is null`).
- **From the showcase you can report but not like.** Sign-in is asked **before** the report dialog.
- **If the showcase was not read — emptiness and a toast.**

## Sharing a link

`share_token` on the row and the address `/p/<token>`.

| What | Where |
| --- | --- |
| Token and check | `src/model/shortcode.ts` (`shareToken`, `tokenOrNull`) |
| Reading, issuing, revoking | `src/server/userSeasons.ts` |
| The dialog | `src/components/edit/ShareLinkDialog.tsx` |
| The recipient's page | `src/app/p/[token]/` |
| The link's QR | `src/server/qr.ts` (`shareQr`, `sharedLink`) |

- **The link opens the season for anyone without signing in**, viewing only: printing and forking.
- **Revoking and issuing are the same action** (the token is overwritten); a revoked link is a 404,
  indistinguishable from an invented one.
- **Nothing about the owner leaks** — no name, no account, no row code in the address.
- **The styling is not overridden by the address here**, unlike on the showcase.
- **The link is printed on the sheet**: with a token the QR leads to `/p/<token>`, revoking puts
  the site address back.
- **The link and its matrix travel together** (`SharedLink` in `model/qr.ts`) and are held by the
  page (`OwnSeason`), not the bar; the `shareLink` action returns the matrix with the token.
- **"Copy" stands next to the field**, not in the dialog's button row; there is no separate
  "Issue a new one" button — after "Revoke" the right button becomes "Create a link".
- **This link must not be called "public"** — the public season is the one on the showcase.

## Likes, reports and favourites

`public_likes`, `public_reports`, `public_favorites`, all in `src/server/publicSeasons.ts`.

- **The desired state comes from the client** (`setLike(code, on)`): one idempotent statement, so a
  repeated press in a neighbouring tab breaks nothing.
- **There is no like counter, there are rows**; the number is `count(*)`, and the primary key
  `(public_id, account_key)` *is* "one person, one like".
- **You do not like, report or favourite your own** (status `own`) — checked on the server, not
  only by hiding buttons. Favourites hold a publication back from deletion, so the author would
  lock themselves out.
- **System seasons are not reported**, but can be liked and set aside.
- **A repeated report refines the previous one**, so `REPORTS_TO_REVIEW` counts **authors**. The
  limit of a hundred reports per account counts other people's publications only.
- **A report outlives the publication**: it stores `code`, `author_key`, a copy of the content and
  the language — no reference to `public_seasons` at all. Names do not go into the snapshot. A
  repeated report does not rewrite the copy.
- **A deleted publication cannot be closed**, and that is accepted: `db:reports` shows such reports
  as **"deleted"** and prints the theme from the snapshot.
- **A closed publication is not reported, liked or set aside** (status `blocked`).
- **Button state arrives from the page and then lives on the client** — no second server round trip.
- **The account has three tabs: "My", "Favourites", "Published"**, and a publication's row shows
  "likes / in favourites / forks" on a line of their own, zeros included.
- **The showcase is also managed from the list** (`ShowcaseEntry`), same megaphone, both
  directions; those actions end with a redirect so the list redraws.
- **Your own fork of your own publication does not count.**
- **"Favourites" and "Published" are searched and sorted in the application**, not in SQL.
- **What is taken off the showcase stays in favourites** and is marked in the list.
- **Removing a bookmark is not a deletion** (`UnfavoriteEntry` is a server component, no dialog) —
  **except for a hidden season, where the last bookmark is all that holds it**: removing it takes
  the row away, all in one statement (between separate steps a stranger's bookmark fits).

## The QR code

Printed to the right of "Our goal for the month". It leads to the site, or to the private link.

| What | Where |
| --- | --- |
| Source: the site address | `tools/qr/source.json` |
| The encoder | `src/server/qr.ts` |
| Build (`npm run qr`) | `tools/qr/build.ts` |
| Generated matrix | `src/model/qr.data.ts` |
| Choosing a code | `src/model/qr.ts` (`SITE_QR`, `shareQrUrl`) |
| Renderer and place | `src/components/QrCode.tsx`, `MonthGoal.tsx` |

- **By default the code leads to the site, not to this sheet.** A link with the blank inside was
  780–1100 characters, i.e. version 20–24, unreadable on A4.
- **The private link is the one exception**: a 53-character row address, version 4, 33 modules.
  Printed both for the owner and for the recipient. Not for a published season.
- **Two codes, one encoder**: the site matrix is prebuilt, the private one is computed by the
  server. The encoder never reaches the browser.
- **The matrix travels as a prop**, not through context; without it `SITE_QR` is drawn.
- **`SITE_URL` re-exports `QR_URL`** from the generated file — there must not be a second copy of
  the address. The private link is **absolute and in the site's name**, in the season's language.
- **It is a constant of the blank**, not data of the sheet: not in `Template`, not in the database.
- **84 px, correction level M, quiet zone of 4 modules inside the `viewBox`.** It adds no height to
  the goal row; if you change the size, measure the page budget again.
- **Pure black and white** (`--qr-ink`), set in CSS, not as SVG attributes.

## Link previews and icons

| What | Where |
| --- | --- |
| The mark, sizes, `favicon.ico` | `tools/logo/build.mjs` (`npm run logo`) |
| The preview picture | `tools/og/build.ts` (`npm run og`) |
| Headless Chrome | `tools/shot.mjs` |
| Metadata | `src/model/meta.ts` (`pageMeta`), `src/app/[lang]/layout.tsx` |
| robots, sitemap | `src/app/robots.ts`, `src/app/sitemap.ts` |
| Structured data | `src/components/site/StructuredData.tsx` |
| A publication's description | `ideaDescription` in `src/model/library.ts` |

- **A dotted address must not fall into `[lang]`**: the `proxy` matcher skips only real asset
  extensions (junk like `/zzz.foo` still reaches **our** 404), and the root layout refuses an
  unknown language. `dynamicParams = false` does not work here — nothing is prerendered.
- **`favicon.ico` is mandatory** next to `favicon.svg`: it carries 16/32/48 (Google takes 48), and
  the ICO container is assembled by hand in `ico()`.
- **The mark is drawn at two scales**: `tight` geometry for the small PNGs, the original for SVG
  and everything from 120 px. `apple-icon.png` is rendered with `radius: 0`.
- **The preview picture is common to the site; only the text is per page.** A mini-poster is
  impossible — satori knows neither CSS Modules nor `var()` nor `color-mix`.
- **The season's content never goes into the preview** (a messenger's server fetches the page).
- **Three pictures, one per language**, carrying `landing.heroLead` (not `site.description`); the
  script imports the dictionaries directly. Change the lead → `npm run og` → look at the picture.
- **Fonts are inlined as data URIs** in the screenshot page, or the shot silently comes out in a
  system font.
- **`og:title` does not fall back to `title`** — a page with its own text spells `openGraph` out in
  full, which is what `pageMeta` is for.
- **A personal page is `noindex` but keeps its preview**: `/p/<token>`, `/season/<code>`,
  `/seasons`, `/account`, `/sheet`.
- **A publication is `alternates: 'self'`** (it lives only in its own language); everything open on
  all three carries three `hreflang` plus `x-default` on Russian.
- **The sitemap lists our examples and the month pages, never people's publications** (that would
  need the database). **There is no `lastModified`** — a computed one would always lie.
- **`Disallow` in robots.txt must carry the language** (`/*/seasons`); only `/api/` is plain.
- **A publication describes itself** via `ideaDescription` — one shared description is a duplicate
  in the index.
- **The site says in `application/ld+json` that it is an application**: `Organization` + `WebSite`
  in the root layout, `WebApplication` on the landing page. The brand collides with television
  vocabulary, so **we do not fight for the brand query** — the words to rank for are planner, plan
  for the month, print, free.
- **A page must have an outline**: `SectionBox` renders its label as a heading only through the
  `heading` prop (`'h1'` on `/ideas`, `'h2'` on landing sections). **The poster keeps the span.**
- The landing `<h1>` is the brand plus `heroTitleTail`, not the brand alone.
- **`metadataBase` is built from `SITE_URL`** — the address is never written twice.

Verified by: `e2e/site/meta.spec.ts`.

## The month pages

`/<lang>/month/<slug>` — one article per month, answering what people type in a search box.

| What | Where |
| --- | --- |
| The texts | `src/data/months/<lang>/<slug>.json` |
| The registry and the grouping | `src/model/months.ts` |
| The pages | `src/app/[lang]/month/page.tsx`, `month/[slug]/page.tsx` |
| The address builder | `monthHref` in `src/model/site.ts` |

- **The slug is English in all three languages** (`/month/september`), so `ROUTES` stays a table of
  paths without the language and `hreflang` is trivial.
- **The cards are read from the database by code** (`ideasByCode`), not from the example files:
  otherwise a withdrawn or closed season would still be advertised here.
- **The article is the page; the seasons are a bonus** — a quiet database leaves the block undrawn
  and the page whole, with no toast.
- **The editorial line under each card lives in the registry**, beside the code: it is not part of
  any season.
- **The grouping "which seasons belong to September" lives here**, since a publication has no month.
- **A month exists only when it has been written** — `monthPage` returns `null` and the page is a
  404. No empty or templated month pages.
- **The texts are not in the dictionaries** (long, one per month); they lie next to the examples.
- **The pages are linked from three places** — `/month` in the header, a line on the showcase and
  in the landing community block — all built from the registry.
- The cards are lined up by a fixed `min-height` on the summary, not by `subgrid` (which lost the
  column gap).
- The page carries its own `<h1>`; the month's name stays in the badge span.

Verified by: `e2e/site/meta.spec.ts`.

## Inline editing

`src/components/edit/EditableText.tsx` — `contentEditable="plaintext-only"`, an **uncontrolled**
node: the `useEffect` writes `innerText` only when the node is not focused. Make it controlled and
the caret jumps to the start on every character.

**There are no empty fields on the blank.** Outside edit mode an unfilled field shows and prints
its placeholder from `PLACEHOLDERS` (`src/model/labels.ts`). So placeholders are written as
finished sheet content ("Our life. Our adventures. Our months."), not as instructions, and second
copies of those texts must not appear in `createEmptyTemplate` or `normalizeTemplate`.

**All the blank's fields are single-line.** Enter blurs, pasting collapses breaks (`singleLine`),
and `text()` in `normalizeTemplate` does the same. Wrapping is the browser's job; a manual break is
hand-made layout that spills the sheet onto a third page.

**Every field has its own length limit** — `src/model/limits.ts`, `limitFor('people.0.name')`
(indexes reduce to `*`). This is a paper budget, not taste:

- **The numbers are measured, not derived from the font size** — the poster was opened at the print
  width of 718 px with `media=print` and the fitting characters counted. Change a limit or a
  field's layout → measure again.
- **Two checks, both must give exactly two pages**: every field filled to its limit with plausible
  text, and the same filled with seven-letter words in a row.
- **A person's limits are held by the card's `min-height: 104px`** and are the tightest; growing
  them without re-measuring page 2 is not allowed.
- **The limits must be wider than the longest example text and every placeholder** (`goal` is at
  87 against 88 today).
- **One limit for input and storage**: `field(path)` in `useTemplateState` hands it out with
  `value`/`onChange`; `normalizeTemplate` trims by the same table. The format version does not
  change for it.
- **Input beyond the limit does not go through** (`onBeforeInput`, with a brief underline) rather
  than being trimmed silently; pasting and dragging go through the same handler.
- **An unbreakable word wraps**: `overflow-wrap: anywhere` on `.sheet` (not `break-word`, which
  would stretch a weeks column).

Line breaks live only in the fill layer (`summaryAnswer`, `nextIdeas`), drawn with their own
`white-space: pre-line` outside `EditableText`.

## State

`src/state/SeasonProvider.tsx` + `docContext.ts` (kept apart because of
`react/only-export-components` — do not merge them back). Edits to the blank live in the shared
`useTemplateState`.

**The context knows only about the blank** — not the address, not the database, not what can be
done with this poster. So each kind of poster has its own bar:

| Page | Bar | What it can do |
| --- | --- | --- |
| Draft `/sheet*` | `app/[lang]/sheet/DraftBar.tsx` | Edit/Done, print, "Save to my seasons" (signed-in only) |
| Own season `/season/<code>*` | `app/season/[code]/OwnBar.tsx` | Edit/Done, rename (in edit), fork and megaphone (in viewing), print |
| Private link `/p/<token>` | `app/p/[token]/SharedBar.tsx` | Fork, link, print |
| Published `/s/<code>` | `app/s/[code]/PublicBar.tsx` | Star, like, report, fork, link, print; for the author withdrawal/return and the like count |

The theme and the icon set depend on none of them and live in `FloatingControls`. **The season's
language lies in the context** and has no switcher; sections take it from `usePoster()`, on-screen
buttons take `useDict()`.

- **Saving is not a button**: `Autosave` writes to the row, `DraftStore` to `localStorage`, both as
  **components inside the provider** so they see every change, a theme switch included. "Save"
  exists only where a season is **created**.
- **The draft bar knows about sign-in in advance** (a prop) — the only place where sign-in is asked
  to decide whether to show a button.
- **The bar does not ask for a name**; renaming lives in the list and, in edit mode, behind the
  name in the row (`RenameDialog` — a field in the row twitched on every character).
- **The name is asked once, with a dialog** (`NewSeasonDialog`), always, for both roles.
- **One conversation about loss, and it is about "now"**: the red `warning` appears only when a
  draft exists and names it ("«September at Grandma's» will be overwritten"); the wording lives in
  `draft.ts`, shared by `NewSeasonButton` and `ForkButton`.
- **"Fork" is one component for all foreign posters** (`components/edit/ForkButton.tsx`) and draws
  its dialog in the bar. **A fork copies what is on screen**, tried-on theme and icons included,
  never the fill layer.
- **Sign-in is asked in advance on poster pages** (`signedIn` prop); where there is nowhere to ask,
  the action returns `anonymous` and the sign-in dialog opens. **The report is the exception** — it
  checks `signedIn` before opening its dialog, so nobody composes a report only to be refused.
- **The hint names the place and the season, it does not explain the mechanism**: "Our example:
  Month of Firsts", "A draft in this browser", "A season by link". A withdrawn season has no place.
  The `<span>` never disappears — it holds the buttons at the edges. For your own season the name
  is the `title` column, for a publication it is derived (`ideaTitle`).
- **Everything the bar reports is one toast**, except `anonymous`, which is a `LoginDialog` with a
  shared heading and a per-button phrase from `LOGIN_TEXT`.
- **The toast and the dialogs are drawn outside `.bar`** — its `backdrop-filter` would trap
  `position: fixed`. So the bars return a fragment.
- **A toggle's state is the button's fill, not the drawing**: `.icon[aria-pressed='true']` in
  `Bar.module.css`, placed **after** `.icon:hover`.
- **Buttons without labels stand at the two edges**: left, what people do for themselves (star,
  like, report); right, what carries the poster outward (link, print). Labels become `title` and
  `aria-label`.
- **The row is not broken up with breakpoints** — `.hint` pushes, `.actions` wraps as one item.

Text fields are bound by path (`field('people.0.name')`); writing goes through `setByPath` with
`structuredClone`. A person's colour is derived from `face` — do not add an `accent` field.

## Printing: two A4 pages

`PrintPage` (`src/components/PrintPage.tsx`) splits the sections into two groups; the first gets
`break-after: page`, each group takes `min-height: 275mm`.

**Free space goes inside the blocks, not into the gaps** (no `space-between`). Exactly one block
grows per page — the field for writing by hand:

- page 1 — the frame under the question in the theme of the month (`.section { flex: 1 }`); weeks
  and goal are `flex: 0 0 auto`, or polaroids lose their proportions;
- page 2 — "Ideas for next month" (`flex: 1`); people's cards stay at `min-height: 104px`, so a
  small family automatically gets a large wrap-up field.

Web and print must look the same: `.answerBox { min-height: 260px }` on screen too. In
`@media print` belong only tightening to the A4 width, restoring the desktop layout, hiding the
on-screen controls and the fill layer, and replacing shadows with frames.

Stretching works only through an unbroken flex chain: section → `.box` → `.body` → content, each
link `display: flex; flex-direction: column` and `flex: 1; min-height: 0`. **No `height: 100%`** —
it collapses to the content height and silently kills the stretch.

The height budget of one group is **1046 px**; a stretched group takes 1039 px.

| Sheet | Page 1 | Slack | Page 2 | Slack |
| --- | --- | --- | --- | --- |
| 4 people, 30 days (demo-1) | 820 px | 220 px | 779 px | 261 px |
| 5 people, 30 days (demo-3) | 840 px | 200 px | 917 px | 123 px |
| 5 people, 31 days, long texts | 864 px | 175 px | 966 px | 74 px |

Page 1's slack never falls below ~175 px; page 2's is eaten by the cards and the mood table, so
**anything added to page 2 must be measured on the worst case** (5 people, 31 days, two-line
descriptions). Overflow is cured by tightening sections, not by raising `min-height`.

**Printing is on A3 at the least.** The layout stays A4 — the printer scales by 1.41, so compute
small details' readability with that factor.

Three traps, each of which has already cost extra pages:

1. **Flex breaks pagination** — Chrome scatters a too-tall flex container's children across sheets.
   `.sheet` in print is `display: block`; flex stays on `.page` only, which always fits.
2. **Mobile breakpoints fire on paper** (print width ≈ 718 px). The `@media print` block **must be
   last in every CSS module** and must restore the desktop layout explicitly.
3. **`break-inside: avoid` on a large group** makes Chrome push it out whole and leave blank sheets.
   Forbid breaks on individual sections only.

The fill layer never goes to paper — hidden with `display: none` (not `visibility: hidden`, which
keeps the height). Hide any new on-screen control in `@media print` right away.

How to check it:

```bash
"/Applications/Google Chrome.app/Contents/MacOS/Google Chrome" --headless=new \
  --disable-gpu --no-pdf-header-footer --virtual-time-budget=6000 \
  --print-to-pdf=out.pdf http://localhost:3000/sheet
grep -ao "/Count [0-9]*" out.pdf | head -1   # the page count, must be 2
qlmanage -t -s 1200 -o . out.pdf             # a preview of the first page
```

To measure heights in a browser: apply the `@media print` rules as an ordinary `<style>`, disable
the on-screen `max-width` media queries (`rule.media.mediaText = 'not all'`) and narrow `#root` to
718 px. Emulation without disabling those queries lies.

## Drawings

`src/components/AvatarFace.tsx` — four avatars in one `viewBox="0 0 64 64"`. Adults and children
differ by **silhouette**, not by details (in the mood table an avatar is 20 px): dad has a beard,
mum a bob and earrings, the children noticeably smaller heads (r 13 against 15+), a cowlick and
pigtails. Small details on the hair are drawn in white with a stroke.

Drawings (`src/components/doodles/`) are inline SVG on `currentColor`; there are no raster images
in the layout. Two kinds, not to be confused:

- **the library** — `icons.generated.ts` plus `Icon.tsx`, from which the poster's sets are
  assembled; the poster calls them only through `PosterIcon`, by slot;
- **the site doodles** — `HeartDoodle`, `FamilyIcon` and the rest in `index.ts`. Seven are one-line
  wrappers over `Icon` with a fixed name (hence `Icon`'s `filled` and `strokeWidth` overrides — an
  18 px button needs a thicker stroke). Adding a second drawing for a button is not allowed. The
  rest (`SparkleRays`, `FridgeDoodle`, `PenDoodle`, `PrinterDoodle`) are drawn in their own files.

`PosterIcon` is deliberately not exported from `index.ts` — it reads context, and the barrel is
imported by server components.

**The site's raster pictures live in `public/` and are all generated** (`npm run logo`,
`npm run og`); none of them is in the markup. The example photographs
(`public/examples/<id>/week-N.svg`) are the only pictures kept as files: they belong to the **fill
layer**, are painted in their own colours and know nothing of the themes.

## Tests

E2E on Playwright plus formatting and linting on commit.

| What | Where |
| --- | --- |
| Config, port, test server | `playwright.config.ts` |
| Fixtures (`signedIn`), session cookie | `e2e/fixtures.ts`, `e2e/support/session.ts` |
| Scenarios | `e2e/<breed>/<rule>.spec.ts` |
| Test database snapshot | `tools/db/reset-e2e.mjs` (`npm run e2e:db`) |
| Hooks, formatting | `.husky/`, `.prettierrc`, `.prettierignore` |

- **The tests are a knowledge base about how everything must work.** A title is a statement about
  the product ("what is taken off the showcase stays in favourites"), not a retelling of clicks.
- **The link with this file goes both ways**: the spec header names the section it checks, and the
  section carries a "Verified by: `<file>`" line.
- **Labels come from the dictionary** (`DICTS.ru.bars.fork`); **expected values are literals**, not
  computed with the same function under test.
- **We do not add `data-testid`** — locators are `getByRole`/`getByLabel`.
- **We do not check layout and colours**, except printing in two pages. No screenshot tests.
- **State is prepared by a fixture**; only the flow under test is clicked through.
- **What is deliberately not covered goes as a list at the end of the spec.**

Infrastructure, all of it hard-won:

- **The tests run against `next start` on port 3100**, not the dev server: `reuseExistingServer`
  would pick up a developer's server pointed at the working database, and `next dev` holds a lock
  in `distDir`.
- **The test server needs `AUTH_TRUST_HOST`** — otherwise Auth.js answers `UntrustedHost` and
  **silently** does not read the session.
- **Sign-in is faked with a cookie** (possible because there is no adapter); `src/server/auth.ts`
  contains no test code.
- **The test database is separate and always rebuilt from a snapshot** (migrations + `db:seed`).
  `reset-e2e.mjs` refuses to run if `E2E_DATABASE_URL` matches `DATABASE_URL`.
- **Isolation is by a per-test `accountKey`**, not by cleaning up. Only the showcase is global — a
  test that publishes must assemble unique content and check its own code.
- **E2E is not a build step on Vercel** and is not on `pre-push` yet (the hook does `lint` and
  `typecheck`); `npm run e2e` is run by hand. `e2e:only` skips the rebuild and therefore may test
  the previous build.
- **Generated files and `*.md` are in `.prettierignore`.**

## Development principles

1. **First decide which layer a change belongs to.** It prints → `Template`. It is written by hand
   → `FillState`. There is no third option.
2. **Printing is checked with a real PDF, not by eye.** Any layout change: run the recipe above on
   the demo (4 people) and the worst case (5 people, 31 days, two-line descriptions) — both must
   give exactly 2 pages. **Captions, placeholders or month names mean a run in all three
   languages.** Colour changes mean the extreme themes (`pastel`, `authority`).
3. **The poster is drawn for print, and the screen shows the printout.** All backgrounds are white
   on the web too. On-screen prettiness that will not be on paper (gradients, shadows instead of
   frames, coloured sections) is a regression. New styling goes into the shared styles first.
4. **The link format must not be broken silently**: change the composition of `Template` → new
   version prefix and reading of the old format in `decodeTemplate`.
5. **We do not keep dead code.** An unused export, prop or field is deleted in the same change.
6. **A comment is written only where the code is ambiguous** — where the obvious solution is wrong
   and has already been tried. It explains "why". Never a retelling of the next line, never divider
   headings, never a retelling of CLAUDE.md. See such a comment — delete it.
7. **The examples live in `src/data/examples/`** and are wired up by `src/model/examples.ts`. Do not
   hard-wire example text into components; `template` and `fill` lie apart, the theme next to them.
   No line breaks in the blank's texts.
8. **Before finishing a task:** `npm run lint`, `npm run typecheck`, `npm run build`, `npm run e2e`
   and printing in 2 pages. The first two are on hooks, but do not rely on a hook instead of
   checking — it is skipped with one flag.

## Conventions

- **Comments are in English, the UI is in the dictionary.** A new string is created in
  `dict/ru.ts` and translated into `en.ts` and `pl.ts` by the same change.
- **The product's vocabulary and the code's vocabulary differ deliberately.** Outward: a month is a
  **season**, a printout a **poster**, weeks are episodes, personal projects storylines, the summary
  the wrap-up, the ideas next up. Inside: `Template`, "the blank", "the fill layer". Write new user
  text in the first vocabulary and new comments in the second.
- **Interface text is simple and unambiguous**; the site's workings are explained here, not on
  screen. A dialog has a two-word heading and one phrase — a question or an instruction. No
  metaphors. A second phrase only where a person would otherwise answer the wrong question
  (`WITHDRAW_NOTE`).
- Styles are CSS Modules next to the component; colours and fonts come from `src/styles/tokens.css`,
  and a new colour is a role derived from the theme's four paints, not a literal.
- `npm run lint` (oxlint) and `npm run build` must pass clean. `noUnusedLocals`/
  `noUnusedParameters` are on, `strict` is not.
- We do not store field versions in the models — the format version lives in the link prefix.

## Deliberately not done

- No editing of the fill layer from the interface — the blank is filled in on paper.
- No photo upload: only an empty space for gluing one in.
- No adding or removing of weeks and sections — their composition is fixed by the layout.

<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->
