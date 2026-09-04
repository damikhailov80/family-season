'use client'

import dynamic from 'next/dynamic'

const Sheet = dynamic(() => import('./Sheet'), { ssr: false })

export function SheetLoader({ signedIn }: { signedIn: boolean }) {
  return <Sheet signedIn={signedIn} />
}
