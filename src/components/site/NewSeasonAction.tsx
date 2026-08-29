import { auth } from '../../server/auth'
import { NewSeasonButton } from './NewSeasonButton'

/**
 * Серверная обёртка над кнопкой «Новый сезон». Нужна ровно затем, чтобы места
 * вызова — шапка, лендинг, «Идеи», кабинет, `/privacy` — остались серверными и
 * не тащили `auth()` каждое само: от входа зависит, куда ляжет новый сезон.
 *
 * Чтение сессии, как и в шапке, намеренно **вне** `try`: `auth()` трогает куки, а
 * Next сообщает «маршрут обязан быть динамическим» исключением — проглотив его,
 * мы помешали бы роутеру пометить маршрут.
 */
export async function NewSeasonAction({
  className,
  children,
}: {
  className?: string
  children: React.ReactNode
}) {
  const session = await auth()
  return (
    <NewSeasonButton signedIn={Boolean(session?.user)} className={className}>
      {children}
    </NewSeasonButton>
  )
}
