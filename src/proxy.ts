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
 * Язык в адресе.
 *
 * Прокси в этом проекте один и делает ровно одно: **ставит язык в путь**. Правило
 * «`proxy.ts` не заводим» касалось входа — проверка сессии обязана стоять у
 * источника данных, а не в оптимистичной догадке перед ним, — и остаётся в силе:
 * ни сессии, ни базы здесь нет. Маршрутизация же языка — прямая работа прокси, и
 * документация Next предлагает делать её именно так.
 *
 * Что происходит:
 *
 *   1. язык в пути есть — пропускаем, но **запоминаем его кукой**. Это и значит
 *      «язык можно поменять руками в адресе»: следующий заход на голый `/`
 *      приведёт человека туда же;
 *   2. языка в пути нет — берём куку, потом `Accept-Language`, потом русский, и
 *      уводим редиректом.
 *
 * Заодно в запрос уходят два заголовка. `x-lang-path` несёт путь без языка —
 * иначе лейауту некуда уводить: своего адреса серверный компонент не знает.
 * `x-lang-source` говорит, **кто поставил язык в адрес**, и это не то же самое,
 * что «есть ли язык в пути»: после нашего же редиректа он там стоит точно так
 * же, как если бы его набрали руками. Различает их кука-однодневка
 * `fs-lang-auto`: мы ставим её на своём редиректе и снимаем, прочитав на
 * следующем запросе. Настройка языка из базы сильнее `auto` и слабее `url` —
 * без этой разницы она не могла бы победить никогда (см. корневой лейаут).
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
      pathname.slice(`/${inPath}`.length) || '/',
    )
    // Пометка живёт ровно один переход: прочитали — сняли.
    if (auto) response.cookies.delete(LANG_AUTO_COOKIE)
    /*
     * Куку обновляем только на адресе, который человек запросил сам: это и есть
     * «язык, изменённый в адресе руками, запоминается». После нашего редиректа
     * трогать её незачем — там она уже равна тому, что мы подставили.
     */
    if (!auto && stored !== inPath) remember(response, inPath)
    return response
  }

  const detected = langFromAccept(request.headers.get('accept-language'))
  const lang = stored ?? detected ?? DEFAULT_LANG

  const url = request.nextUrl.clone()
  url.pathname = `/${lang}${pathname === '/' ? '' : pathname}`
  const response = NextResponse.redirect(url)
  // Определение запоминаем сразу: иначе разбор `Accept-Language` повторялся бы
  // на каждый заход, а язык у человека «плавал» бы вместе с настройками браузера.
  // Настройке из базы это не мешает — она сильнее не куки, а пометки `auto`.
  if (stored !== lang) remember(response, lang)
  // Пометка едет вместе с редиректом: по ней следующий запрос узнает, что язык
  // в адресе не выбирали, и лейаут сможет предпочесть настройку из базы.
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
  /*
   * Мимо идут служебные пути Next, роут-хендлеры (`/api/*` живут вне `[lang]`:
   * корневых параметров у них нет) и всё, что похоже на файл — шрифты, иконка,
   * картинки примеров.
   */
  matcher: ['/((?!_next|api|.*\\.).*)'],
}
