const ALPHABET = '0123456789abcdefghjkmnpqrstvwxyz'
const CODE_LENGTH = 6
const TOKEN_LENGTH = 16
const HALF_BITS = 15
const HALF = 1 << HALF_BITS
const ROUNDS = 4

const CODE_SPACE = HALF * HALF

const KEYS = {
  season: 0x5f3a91c7,
  public: 0xa17c4e2b,
} as const

export type CodeKind = keyof typeof KEYS

function mix(value: number, round: number, key: number): number {
  let x = (value ^ (key + round * 0x9e3779b1)) >>> 0
  x = Math.imul(x ^ (x >>> 15), 0x2c1b3c6d) >>> 0
  x = Math.imul(x ^ (x >>> 12), 0x297a2d39) >>> 0
  return (x ^ (x >>> 15)) & (HALF - 1)
}

export function shortCode(kind: CodeKind, id: number): string {
  if (!Number.isInteger(id) || id < 0 || id >= CODE_SPACE) {
    throw new RangeError(`id ${id} does not fit into a six-character code`)
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

export function codeOrNull(value: unknown): string | null {
  if (typeof value !== 'string') return null
  const code = value.toLowerCase()
  if (code.length !== CODE_LENGTH) return null
  return [...code].every((char) => ALPHABET.includes(char)) ? code : null
}

export function shareToken(): string {
  const bytes = crypto.getRandomValues(new Uint8Array(TOKEN_LENGTH))
  return Array.from(bytes, (byte) => ALPHABET[byte & 31]).join('')
}

export function tokenOrNull(value: unknown): string | null {
  if (typeof value !== 'string') return null
  const token = value.toLowerCase()
  if (token.length !== TOKEN_LENGTH) return null
  return [...token].every((char) => ALPHABET.includes(char)) ? token : null
}
