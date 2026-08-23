import type { Metadata } from 'next'

/* Как и у /sheet, лейаут заведён только ради metadata: страница — 'use client'. */
export const metadata: Metadata = {
  title: 'Правка сезона — Семейный сезон',
  description: 'Перепишите сезон под свою семью: герои, недели, проекты и цель месяца.',
}

export default function SheetEditLayout({ children }: { children: React.ReactNode }) {
  return children
}
