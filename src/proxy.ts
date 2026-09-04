import { NextResponse, type NextRequest } from 'next/server'
import {
  DEFAULT_LANG,
  LANG_AUTO_COOKIE,
  LANG_COOKIE,
  LANG_COOKIE_MAX_AGE,
  LANG_PATH_HEADER,
  LANG_SOURCE_HEADER,
  langFromAccept,
  langOrNull,
  type Lang,
} from './model/lang'

/**
 * Прокси делает ровно одно — ставит язык в путь: ни сессии, ни базы здесь нет и
 * быть не должно (проверка входа стоит у источника данных).
 *
 * `x-lang-source` говорит, кто поставил язык в адрес, и это не то же самое, что
 * «есть ли язык в пути»: после нашего же редиректа он стоит там точно так же,
 * как набранный руками. Различает их кука-однодневка `fs-lang-auto` — ставим на
 * своём редиректе и снимаем, прочитав на следующем запросе. Без этой разницы
 * настройка языка из базы не могла бы победить никогда (см. корневой лейаут).
 */
export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl
  const stored = langOrNull(request.cookies.get(LANG_COOKIE)?.value)
  const inPath = langOrNull(pathname.split('/')[1])

  if (inPath) {
    const auto = request.cookies.has(LANG_AUTO_COOKIE)
    const response = pass(
      request,
      auto ? 'auto' : 'url',
      // Вместе с query: по этому пути лейаут уводит на язык настройки, а в query
      // живёт примеренное оформление и состояние списков.
      `${pathname.slice(`/${inPath}`.length) || '/'}${request.nextUrl.search}`,
    )
    // Пометка живёт ровно один переход: прочитали — сняли.
    if (auto) response.cookies.delete(LANG_AUTO_COOKIE)
    // Куку обновляем только на адресе, который человек запросил сам.
    if (!auto && stored !== inPath) remember(response, inPath)
    return response
  }

  const detected = langFromAccept(request.headers.get('accept-language'))
  const lang = stored ?? detected ?? DEFAULT_LANG

  const url = request.nextUrl.clone()
  url.pathname = `/${lang}${pathname === '/' ? '' : pathname}`
  const response = NextResponse.redirect(url)
  // Определение запоминаем сразу: иначе язык «плавал» бы вместе с настройками
  // браузера. Настройке из базы это не мешает — она сильнее пометки `auto`.
  if (stored !== lang) remember(response, lang)
  // По пометке следующий запрос узнает, что язык в адресе не выбирали.
  response.cookies.set(LANG_AUTO_COOKIE, '1', { path: '/', sameSite: 'lax' })
  return response
}

function pass(request: NextRequest, source: 'url' | 'auto', path: string) {
  const headers = new Headers(request.headers)
  headers.set(LANG_SOURCE_HEADER, source)
  headers.set(LANG_PATH_HEADER, path)
  return NextResponse.next({ request: { headers } })
}

function remember(response: NextResponse, lang: Lang) {
  response.cookies.set(LANG_COOKIE, lang, {
    path: '/',
    maxAge: LANG_COOKIE_MAX_AGE,
    sameSite: 'lax',
  })
}

export const config = {
  // Мимо: служебные пути Next, роут-хендлеры (они живут вне `[lang]`) и файлы.
  matcher: ['/((?!_next|api|.*\\.).*)'],
}
