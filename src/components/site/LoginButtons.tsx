'use client'

import { useState } from 'react'
import styles from './LoginButtons.module.css'

/** Значки провайдеров — inline SVG: растровых картинок в проекте нет. */
function GoogleMark() {
  return (
    <svg width="16" height="16" viewBox="0 0 18 18" aria-hidden="true" focusable="false">
      <path
        fill="#4285f4"
        d="M17.64 9.2c0-.64-.06-1.25-.16-1.84H9v3.48h4.84a4.14 4.14 0 0 1-1.8 2.72v2.26h2.92c1.7-1.57 2.68-3.88 2.68-6.62Z"
      />
      <path
        fill="#34a853"
        d="M9 18c2.43 0 4.47-.8 5.96-2.18l-2.92-2.26c-.8.54-1.84.86-3.04.86-2.34 0-4.32-1.58-5.03-3.7H.93v2.33A9 9 0 0 0 9 18Z"
      />
      <path
        fill="#fbbc05"
        d="M3.97 10.72a5.4 5.4 0 0 1 0-3.44V4.95H.93a9 9 0 0 0 0 8.1l3.04-2.33Z"
      />
      <path
        fill="#ea4335"
        d="M9 3.58c1.32 0 2.5.46 3.44 1.35l2.58-2.58C13.46.9 11.43 0 9 0A9 9 0 0 0 .93 4.95l3.04 2.33C4.68 5.16 6.66 3.58 9 3.58Z"
      />
    </svg>
  )
}

function FacebookMark() {
  return (
    <svg width="16" height="16" viewBox="0 0 18 18" aria-hidden="true" focusable="false">
      <path
        fill="#1877f2"
        d="M18 9a9 9 0 1 0-10.4 8.9v-6.3H5.3V9h2.3V7c0-2.3 1.36-3.56 3.45-3.56 1 0 2.05.18 2.05.18v2.25h-1.16c-1.14 0-1.5.71-1.5 1.43V9h2.55l-.4 2.6h-2.15v6.3A9 9 0 0 0 18 9Z"
      />
    </svg>
  )
}

/**
 * Заглушка входа. Личный кабинет ещё не сделан, поэтому кнопки честно говорят
 * «скоро», а не притворяются рабочими: настоящий OAuth появится вместе с бэкендом.
 */
export function LoginButtons() {
  const [soon, setSoon] = useState(false)

  return (
    <div className={styles.wrap}>
      <button type="button" className={styles.button} onClick={() => setSoon(true)}>
        <GoogleMark />
        Google
      </button>
      <button type="button" className={styles.button} onClick={() => setSoon(true)}>
        <FacebookMark />
        Facebook
      </button>
      {soon && (
        <p className={styles.soon} role="status">
          Скоро! Пока лист живёт в ссылке — сохраните её в закладки
        </p>
      )}
    </div>
  )
}
