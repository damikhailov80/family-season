'use client'

import Script from 'next/script'

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
