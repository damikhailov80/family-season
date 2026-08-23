'use client'

import dynamic from 'next/dynamic'

/*
 * Лист целиком живёт в хэше, а хэш до сервера не доходит — предрендерить нечего.
 * Плюс дата в демо-бланке считается «сейчас»: серверный рендер разошёлся бы с
 * клиентским при гидратации. Поэтому лист грузится только в браузере.
 */
const Sheet = dynamic(() => import('./Sheet'), { ssr: false })

export default function Page() {
  return <Sheet />
}
