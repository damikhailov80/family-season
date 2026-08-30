import { auth } from '../../../server/auth'
import { SheetLoader } from '../SheetLoader'

/*
 * Тот же лист, что и на /sheet: режим несёт путь, а не пометка. Маршрут нужен,
 * чтобы адрес правки открывался напрямую — из закладки, после перезагрузки и в
 * новой вкладке. Про сессию и `ssr: false` см. соседний src/app/sheet/page.tsx.
 */
export default async function Page() {
  const session = await auth()
  return <SheetLoader signedIn={Boolean(session?.user)} />
}
