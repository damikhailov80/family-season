'use client'

import Script from 'next/script'

/**
 * Consent Mode v2, а не «грузить после согласия»: `gtag` загружен сразу, но все
 * четыре ключа хранения стоят в `denied` — в этом состоянии он не пишет кук и не
 * собирает идентификаторов. Выигрыш один и существенный: «Принять» включает
 * счётчик на месте, без перезагрузки страницы.
 *
 * Порядок двух скриптов правильный сам собой: `dataLayer` — очередь, а
 * `afterInteractive` выполняется в порядке документа.
 *
 * Идентификатор приходит пропом с сервера: переменная серверная, и в браузере её
 * попросту нет (см. `analyticsId`).
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
