import { auth } from '../../server/auth'
import { DraftClaimer } from './DraftClaimer'

/**
 * Разбор клиентский (черновик лежит в браузере), а вход читается здесь:
 * невошедшему разбирать нечего, и разборщик к нему не уезжает вовсе.
 *
 * Чтение сессии, как в шапке, намеренно вне `try`: `auth()` трогает куки, и Next
 * сообщает «маршрут обязан быть динамическим» исключением.
 */
export async function ClaimDraft() {
  const session = await auth()
  return session?.user ? <DraftClaimer /> : null
}
