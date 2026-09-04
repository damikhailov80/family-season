import { spawnSync } from 'node:child_process'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import pg from 'pg'
import { dbTarget } from './target.mjs'

const url = process.env.E2E_DATABASE_URL
if (!url) {
  console.error(
    'No E2E_DATABASE_URL. Put the test database connection string in .env.local' +
      ' (see .env.example) — a separate one from DATABASE_URL: this database is wiped whole.',
  )
  process.exit(1)
}

if (url === process.env.DATABASE_URL) {
  console.error(
    'E2E_DATABASE_URL is the same as DATABASE_URL. That is the working database, and the' +
      ' snapshot drops the schema whole — set up a separate database for tests.',
  )
  process.exit(1)
}

const here = dirname(fileURLToPath(import.meta.url))

console.log(`Snapshot of the test database ${dbTarget(url)}.`)

const client = new pg.Client({ connectionString: url, connectionTimeoutMillis: 4000 })
try {
  await client.connect()
} catch (error) {
  const code = error?.code ?? error?.errors?.[0]?.code
  const hint =
    code === 'ECONNREFUSED' || code === 'ENOTFOUND'
      ? '\nLooks like the database is not up: `docker start family-season-db`.'
      : ''
  console.error(`Could not connect to the test database (${code ?? 'reason unknown'}).${hint}`)
  process.exit(1)
}

try {
  await client.query('drop schema public cascade')
  await client.query('create schema public')
} finally {
  await client.end()
}

const env = { ...process.env, DATABASE_URL: url }

for (const [what, args] of [
  ['migrations', [join(here, 'migrate.mjs')]],
  ['seeding the examples', ['--import', 'tsx', join(here, 'seed-examples.ts')]],
]) {
  const done = spawnSync(process.execPath, args, { env, stdio: 'inherit' })
  if (done.status !== 0) {
    console.error(`The snapshot was not built: ${what} failed.`)
    process.exit(1)
  }
}

console.log('Snapshot ready.')
