import type { MonthRef } from '../../model/types'
import { auth } from '../../server/auth'
import { NewSeasonButton } from './NewSeasonButton'

export async function NewSeasonAction({
  className,
  month,
  children,
}: {
  className?: string
  month?: MonthRef
  children: React.ReactNode
}) {
  const session = await auth()
  return (
    <NewSeasonButton signedIn={Boolean(session?.user)} className={className} month={month}>
      {children}
    </NewSeasonButton>
  )
}
