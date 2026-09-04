import { Analytics } from './Analytics'
import { ConsentBanner } from './ConsentBanner'
import { analyticsId, readConsent } from '../../server/consent'

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
