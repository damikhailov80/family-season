/**
 * Пакета с типами Google не ставим: он тянул бы описание всего измерительного API
 * ради двух вызовов. Функция необязательная намеренно — без `GA_ID` её на
 * странице нет вовсе, и звать её можно только через `?.`.
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
