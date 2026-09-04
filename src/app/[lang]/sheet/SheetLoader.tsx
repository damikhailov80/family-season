'use client'

import dynamic from 'next/dynamic'

/*
 * Лист грузится только в браузере: содержимое лежит в `localStorage`, а дата
 * нового бланка считается «сейчас» — серверный рендер разошёлся бы с клиентским.
 *
 * Загрузчик вынесен в отдельный клиентский модуль потому, что `next/dynamic` с
 * `ssr: false` из серверного компонента звать нельзя, а странице нужна сессия.
 */
const Sheet = dynamic(() => import('./Sheet'), { ssr: false })

export function SheetLoader({ signedIn }: { signedIn: boolean }) {
  return <Sheet signedIn={signedIn} />
}
