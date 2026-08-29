/**
 * Короткий постоянный адрес строки: `/s/<code>`, `/season/<code>`.
 *
 * Код — **перестановка битов id**, а не случайная строка и не хэш с проверкой на
 * коллизии. Так он выходит бесплатно (никаких «сгенерировать и переспросить
 * базу»), никогда не повторяется — id не переиспользуются, — и выглядит
 * случайным: соседние строки получают ничем не похожие коды.
 *
 * Пространство — ровно 2^30 ≈ 1,07 млрд, то есть шесть знаков по 32 буквы.
 * Перестановка — сеть Фейстеля на двух половинах по 15 бит: она обратима по
 * построению, а значит взаимно однозначна, и двум строкам один код достаться
 * не может. Обратного преобразования здесь нет намеренно: код лежит в своей
 * колонке, и строка ищется по ней. Считать id из кода — значит поверить в то,
 * что перестановка никогда не менялась.
 *
 * Ключ у каждой таблицы свой: коды личных и публичных сезонов не должны
 * выглядеть родственными. Менять ключи нельзя — уже выданные коды постоянны.
 */

/** Алфавит Кроуфорда: без `i`, `l`, `o`, `u` — их путают при перепечатке. */
const ALPHABET = '0123456789abcdefghjkmnpqrstvwxyz'
const CODE_LENGTH = 6
/**
 * Длина приватного токена. Шестнадцать знаков по пять бит — восемьдесят бит
 * случайности: перебрать нельзя, а прочитать вслух ещё можно.
 */
const TOKEN_LENGTH = 16
const HALF_BITS = 15
const HALF = 1 << HALF_BITS
const ROUNDS = 4

/** Сколько строк вмещает шестизначный код: 32^6 = 2^30. */
const CODE_SPACE = HALF * HALF

const KEYS = {
  season: 0x5f3a91c7,
  public: 0xa17c4e2b,
} as const

export type CodeKind = keyof typeof KEYS

/**
 * Раундовая функция: из 15 бит делает 15 «перемешанных». Требование к ней одно —
 * быть функцией; обратимость даёт сама сеть Фейстеля. Три умножения со сдвигами
 * (приём из семейства xorshift-multiply) размазывают младшие биты по старшим,
 * иначе соседние id давали бы похожие коды — ровно то, чего мы избегаем.
 */
function mix(value: number, round: number, key: number): number {
  let x = (value ^ (key + round * 0x9e3779b1)) >>> 0
  x = Math.imul(x ^ (x >>> 15), 0x2c1b3c6d) >>> 0
  x = Math.imul(x ^ (x >>> 12), 0x297a2d39) >>> 0
  return (x ^ (x >>> 15)) & (HALF - 1)
}

/** Код строки. Больше миллиарда строк — это другая задача, и молчать о ней нельзя. */
export function shortCode(kind: CodeKind, id: number): string {
  if (!Number.isInteger(id) || id < 0 || id >= CODE_SPACE) {
    throw new RangeError(`id ${id} не укладывается в шестизначный код`)
  }

  let left = Math.floor(id / HALF)
  let right = id % HALF
  for (let round = 0; round < ROUNDS; round += 1) {
    const next = left ^ mix(right, round, KEYS[kind])
    left = right
    right = next
  }

  const value = left * HALF + right
  let code = ''
  for (let shift = (CODE_LENGTH - 1) * 5; shift >= 0; shift -= 5) {
    code += ALPHABET[(value >>> shift) & 31]
  }
  return code
}

/**
 * Код приходит из адресной строки, а оттуда приходит что угодно. До базы пускаем
 * только шесть знаков алфавита; регистр не важен — ссылку могли перепечатать.
 */
export function codeOrNull(value: unknown): string | null {
  if (typeof value !== 'string') return null
  const code = value.toLowerCase()
  if (code.length !== CODE_LENGTH) return null
  return [...code].every((char) => ALPHABET.includes(char)) ? code : null
}

/**
 * Токен приватной ссылки (`/p/<token>`).
 *
 * В отличие от кода строки он **случайный, а не выведенный из id**, и это не
 * прихоть: приватную ссылку отзывают и выдают заново, а перестановка битов
 * всегда дала бы тот же самый результат. Отсюда же и длина: код можно угадать
 * перебором, и ничего страшного — он и так публичный; токен угадывать нельзя.
 */
export function shareToken(): string {
  const bytes = crypto.getRandomValues(new Uint8Array(TOKEN_LENGTH))
  return Array.from(bytes, (byte) => ALPHABET[byte & 31]).join('')
}

/** Токен приходит из адресной строки: до базы пускаем только свой алфавит. */
export function tokenOrNull(value: unknown): string | null {
  if (typeof value !== 'string') return null
  const token = value.toLowerCase()
  if (token.length !== TOKEN_LENGTH) return null
  return [...token].every((char) => ALPHABET.includes(char)) ? token : null
}
