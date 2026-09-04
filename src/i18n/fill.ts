/**
 * Значения словаря — строки, а не функции: словарь едет в клиентские компоненты
 * внутри RSC-нагрузки, а функции не сериализуются. Отсюда пометки `{n}`.
 *
 * Пропущенный ключ оставляем как есть: дырка заметна, а «Больше  сезонов»
 * читается как опечатка и живёт годами.
 */
export function fill(text: string, vars: Record<string, string | number>): string {
  return text.replace(/\{(\w+)\}/g, (whole, key) => (key in vars ? String(vars[key]) : whole))
}

/**
 * Разбор `**жирного**`. Нужен ровно одной странице — политике приватности, где
 * смысл держится на выделенных словах. Разметки богаче этой в текстах нет и
 * заводить её не надо.
 */
export function marked(text: string): { text: string; bold: boolean }[] {
  return text
    .split(/\*\*/)
    .map((piece, index) => ({ text: piece, bold: index % 2 === 1 }))
    .filter((piece) => piece.text !== '')
}
