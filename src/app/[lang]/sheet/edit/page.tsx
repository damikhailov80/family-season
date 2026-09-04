import { auth } from '../../../../server/auth'
import { SheetLoader } from '../SheetLoader'

export default async function Page() {
  const session = await auth()
  return <SheetLoader signedIn={Boolean(session?.user)} />
}
