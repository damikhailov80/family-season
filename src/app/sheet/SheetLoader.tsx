'use client'

import dynamic from 'next/dynamic'

/*
 * Лист по-прежнему грузится только в браузере: содержимое лежит в `localStorage`,
 * предрендерить нечего, а дата нового бланка считается «сейчас» — серверный рендер
 * разошёлся бы с клиентским при гидратации.
 *
 * Загрузчик вынесен в отдельный клиентский модуль ровно потому, что `next/dynamic`
 * с `ssr: false` из серверного компонента звать нельзя, а странице нужно прочитать
 * сессию: от входа зависит, что панель черновика вообще предлагает сделать.
 */
const Sheet = dynamic(() => import('./Sheet'), { ssr: false })

export function SheetLoader({ signedIn }: { signedIn: boolean }) {
  return <Sheet signedIn={signedIn} />
}
