import { auth } from '../../../server/auth'
import { SheetLoader } from './SheetLoader'

/*
 * Страница серверная, а лист внутри — по-прежнему только браузерный (см.
 * `SheetLoader`). Сессия нужна самой панели черновика: невошедшему «Сохранить в
 * мои сезоны» предлагать нечего — у него нет ни коллекции, ни строки, — а
 * узнавать об этом из отказа сервера значит вести человека через два окна к
 * стене.
 */
export default async function Page() {
  const session = await auth()
  return <SheetLoader signedIn={Boolean(session?.user)} />
}
