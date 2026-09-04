import { cookies } from 'next/headers'
import { readConsentSetting } from './settings'
import { CONSENT_COOKIE, consentFromCookie, type Consent } from '../model/consent'

/**
 * Хранилищ два, и старшинство одно: кука сильнее настройки. Решение принимают в
 * браузере, и невошедшему больше негде его держать, а настройка аккаунта нужна
 * затем, чтобы вошедший не отвечал на тот же вопрос на каждом устройстве.
 *
 * Куку из настройки не переписываем: клиентского близнеца `LangSync` заводить
 * незачем — куку поставит первое же решение.
 *
 * Молчание базы означает «не знаем», то есть `null`: показать вопрос лишний раз
 * неприятно, а счесть молчание согласием — нельзя.
 */
export async function readConsent(): Promise<Consent | null> {
  const jar = await cookies()
  const fromCookie = consentFromCookie(jar.get(CONSENT_COOKIE)?.value)
  if (fromCookie) return fromCookie

  return readConsentSetting()
}

/**
 * Переменная серверная (`GA_ID`, а не `NEXT_PUBLIC_GA_ID`): публичная
 * подставляется сборкой, то есть становится частью бандла — выключить счётчик
 * без пересборки стало бы нельзя. В браузер идентификатор уезжает пропом.
 */
export function analyticsId(): string | null {
  return process.env.GA_ID || null
}
