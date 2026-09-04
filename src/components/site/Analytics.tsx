'use client'

import Script from 'next/script'

/**
 * Google Analytics — единственная сторонняя библиотека, которая доезжает до
 * браузера.
 *
 * Правило «в браузер не едет ни одной сторонней библиотеки» держалось, пока
 * сайту нечего было считать; счётчик его отменяет, и отменяет **ровно один
 * раз** — второй такой библиотеки быть не должно.
 *
 * Consent Mode v2, а не «грузить после согласия».
 *
 * Разница в том, что делает `gtag` до ответа. Здесь он загружен, но все четыре
 * ключа хранения стоят в `denied`: в этом состоянии он не пишет ни одной куки и
 * не собирает идентификаторов, а Google получает обезличенный сигнал без
 * хранения на устройстве. Выигрыш — согласие включает счётчик **на месте**:
 * `consent update` меняет режим уже загруженного `gtag`, и человеку не надо
 * перезагружать страницу, чтобы его «Принять» что-то значило.
 *
 * Порядок двух скриптов правильный сам собой: `dataLayer` — очередь, а
 * `afterInteractive` выполняется в порядке документа, поэтому `consent default`
 * встаёт в очередь раньше, чем библиотека до неё доберётся.
 *
 * Идентификатор приходит пропом с сервера, а не из окружения: переменная у нас
 * серверная (см. `analyticsId`), и в браузере её попросту нет. Нет её и на
 * сервере — тогда этот компонент не монтируется вовсе, и на страницу не
 * попадает ни байта Google.
 */
export function Analytics({ id, granted }: { id: string; granted: boolean }) {
  return (
    <>
      <Script id="ga-consent" strategy="afterInteractive">
        {`window.dataLayer=window.dataLayer||[];
function gtag(){dataLayer.push(arguments)}
window.gtag=gtag;
gtag('consent','default',{ad_storage:'denied',ad_user_data:'denied',ad_personalization:'denied',analytics_storage:'denied'});
${granted ? "gtag('consent','update',{analytics_storage:'granted'});\n" : ''}gtag('js',new Date());
gtag('config',${JSON.stringify(id)});`}
      </Script>
      <Script
        id="ga-lib"
        strategy="afterInteractive"
        src={`https://www.googletagmanager.com/gtag/js?id=${encodeURIComponent(id)}`}
      />
    </>
  )
}
