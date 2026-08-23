'use client'

import dynamic from 'next/dynamic'

/*
 * Тот же лист, что и на /sheet: режим несёт путь, а не пометка в хэше. Маршрут нужен,
 * чтобы адрес правки открывался напрямую — из закладки, после перезагрузки и в новой
 * вкладке. Про `ssr: false` см. соседний src/app/sheet/page.tsx.
 */
const Sheet = dynamic(() => import('../Sheet'), { ssr: false })

export default function Page() {
  return <Sheet />
}
