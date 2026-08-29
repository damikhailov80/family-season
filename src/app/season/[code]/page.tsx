import type { Metadata } from 'next'
import { OwnSeasonPage, seasonMetadata } from './OwnSeasonPage'

export async function generateMetadata({
  params,
}: {
  params: Promise<{ code: string }>
}): Promise<Metadata> {
  return seasonMetadata((await params).code)
}

export default async function SeasonPage({ params }: { params: Promise<{ code: string }> }) {
  return <OwnSeasonPage code={(await params).code} editing={false} />
}
