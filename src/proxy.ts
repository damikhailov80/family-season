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

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl
  const stored = langOrNull(request.cookies.get(LANG_COOKIE)?.value)
  const inPath = langOrNull(pathname.split('/')[1])

  if (inPath) {
    const auto = request.cookies.has(LANG_AUTO_COOKIE)
    const response = pass(
      request,
      auto ? 'auto' : 'url',
      `${pathname.slice(`/${inPath}`.length) || '/'}${request.nextUrl.search}`,
    )
    if (auto) response.cookies.delete(LANG_AUTO_COOKIE)
    if (!auto && stored !== inPath) remember(response, inPath)
    return response
  }

  const detected = langFromAccept(request.headers.get('accept-language'))
  const lang = stored ?? detected ?? DEFAULT_LANG

  const url = request.nextUrl.clone()
  url.pathname = `/${lang}${pathname === '/' ? '' : pathname}`
  const response = NextResponse.redirect(url)
  if (stored !== lang) remember(response, lang)
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
  matcher: [
    '/((?!_next|api|.*\\.(?:ico|svg|png|jpg|jpeg|gif|webp|txt|xml|webmanifest|woff2?)$).*)',
  ],
}
