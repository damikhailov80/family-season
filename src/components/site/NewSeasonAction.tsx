import { auth } from '../../server/auth'
import { NewSeasonButton } from './NewSeasonButton'

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
