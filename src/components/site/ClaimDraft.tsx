import { auth } from '../../server/auth'
import { DraftClaimer } from './DraftClaimer'

/**
 * Серверная обёртка над `DraftClaimer`: сам разбор клиентский (черновик лежит в
 * браузере, серверу его негде взять), а вход читается здесь — ровно как у
 * «Нового сезона» (`NewSeasonAction`).
 *
 * Невошедшему разбирать нечего: черновик и есть его единственное хранилище.
 * Поэтому у него в браузер не уезжает и сам разборщик.
 *
 * Чтение сессии, как в шапке, намеренно **вне** `try`: `auth()` трогает куки, и
 * Next сообщает «маршрут обязан быть динамическим» исключением.
 */
export async function ClaimDraft() {
  const session = await auth()
  return session?.user ? <DraftClaimer /> : null
}
