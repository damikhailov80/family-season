import { Analytics } from './Analytics'
import { ConsentBanner } from './ConsentBanner'
import { analyticsId, readConsent } from '../../server/consent'

/**
 * Всё, что связано с согласием на аналитику, одним узлом в корневом лейауте.
 *
 * Серверная обёртка над клиентскими компонентами — та же повадка, что у
 * `ClaimDraft`: ответ лежит в куке и в настройках, а прочитать их может только
 * сервер. Клиенту уезжает готовое решение, а не способ его вычислить.
 *
 * Нет `GA_ID` — не рисуется ничего, и в базу мы за этим даже не ходим:
 * спрашивать согласие на то, чего не происходит, нельзя.
 */
export async function ConsentGate() {
  const id = analyticsId()
  if (!id) return null

  const consent = await readConsent()

  return (
    <>
      <Analytics id={id} granted={consent === 'granted'} />
      <ConsentBanner initial={consent} />
    </>
  )
}
