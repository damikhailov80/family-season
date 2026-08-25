import type { PaletteId } from '../types'

/**
 * Адреса и контакты сайта вокруг листа. Собраны в одном месте, чтобы почта и
 * маршруты не расползались по разметке шапки, подвала и лендинга.
 */

export const CONTACT_EMAIL = 'smart.scriptorium+familyseason.online@gmail.com'

export const ROUTES = {
  home: '/',
  /** Просмотр: пример (`#d=…&data=<id>`) или свой лист (`#d=…`). */
  sheet: '/sheet',
  /** Тот же лист в правке. Без `#d=…` — пустой бланк «с нуля». */
  sheetEdit: '/sheet/edit',
  seasons: '/seasons',
} as const

/**
 * Режим листа несёт путь, а не пометка в хэше: адрес правки можно сохранить,
 * переслать и перезагрузить. Тип берём голым union'ом — `model` не должен
 * зависеть от `state`, а `DocMode` объявлен там.
 */
export function modeFromPath(pathname: string = location.pathname): 'view' | 'edit' {
  // Хвостовой слэш Next убирает редиректом, но сравнение путей не должно от этого зависеть.
  return pathname.replace(/\/+$/, '') === ROUTES.sheetEdit ? 'edit' : 'view'
}

export function pathForMode(mode: 'view' | 'edit'): string {
  return mode === 'edit' ? ROUTES.sheetEdit : ROUTES.sheet
}

/**
 * Короткая ссылка на пример. Закодировать шаблон на сервере лендинг не может —
 * месяц в примере считается от «сегодня», — поэтому в адресе едет только id,
 * а лист достраивает бланк из реестра и сам канонизирует адрес в `#d=…&p=…&data=<id>`.
 *
 * Тему дописываем сразу, хотя лист взял бы её из реестра и сам: `p=` обязан быть
 * виден и правиться во всяком адресе просмотра, а не появляться задним числом
 * после открытия. Иначе скопированная с лендинга ссылка — единственная, в которой
 * темы нет.
 */
export function exampleHref(id: string, palette: PaletteId): string {
  return `${ROUTES.sheet}#data=${id}&p=${palette}`
}
