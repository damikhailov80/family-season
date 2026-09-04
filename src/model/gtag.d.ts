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
