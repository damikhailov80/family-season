import { auth } from '../../server/auth'
import { DraftClaimer } from './DraftClaimer'

export async function ClaimDraft() {
  const session = await auth()
  return session?.user ? <DraftClaimer /> : null
}
