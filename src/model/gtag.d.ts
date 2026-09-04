/**
 * `gtag` на `window` — ровно столько типов, сколько мы им пользуемся.
 *
 * Пакета с типами Google не ставим: он тянул бы описание всего измерительного
 * API ради двух наших вызовов. Функция помечена необязательной намеренно — без
 * `NEXT_PUBLIC_GA_ID` её на странице нет вовсе, и вызывать её можно только
 * через `?.`.
 */
declare global {
  interface Window {
    gtag?: (
      command: 'consent',
      action: 'default' | 'update',
      params: Record<string, 'granted' | 'denied'>,
    ) => void
  }
}

export {}
