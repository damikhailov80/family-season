import { auth } from '../../../server/auth'
import { SheetLoader } from './SheetLoader'

/*
 * Страница серверная, а лист внутри браузерный (см. `SheetLoader`). Сессия нужна
 * панели черновика: невошедшему «Сохранить в мои сезоны» предлагать нечего.
 */
export default async function Page() {
  const session = await auth()
  return <SheetLoader signedIn={Boolean(session?.user)} />
}
