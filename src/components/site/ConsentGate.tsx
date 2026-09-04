import { Analytics } from './Analytics'
import { ConsentBanner } from './ConsentBanner'
import { analyticsId, readConsent } from '../../server/consent'

/**
 * Серверная обёртка над клиентскими компонентами, как `ClaimDraft`: клиенту
 * уезжает готовое решение, а не способ его вычислить. Нет `GA_ID` — не рисуется
 * ничего, и в базу мы за этим даже не ходим.
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
