/**
 * Реестр наборов рисунков. Файл собирается: tools/icons/build.mjs (npm run icons),
 * руками его не правят — правят tools/icons/source.json и пересобирают.
 *
 * Здесь id, подписи и раздача рисунков по слотам; сама геометрия —
 * в src/components/doodles/icons.generated.ts, а логика выбора — в src/model/icons.ts.
 */

import type { IconName } from '../components/doodles/icons.generated'

/** Места в макете постера. Порядок — порядок слотов в source.json. */
export const ICON_SLOTS = ['mark', 'love', 'voice', 'spark', 'path', 'goal', 'care', 'idea'] as const

export const ICON_SETS = [
  ['classic', 'Классика', { mark: 'family-three', love: 'heart', voice: 'megaphone', spark: 'star', path: 'rocket', goal: 'target', care: 'heart', idea: 'star' }],
  ['home', 'Дом', { mark: 'house-heart', love: 'hug', voice: 'letter', spark: 'sparkle', path: 'compass', goal: 'key', care: 'cup', idea: 'bulb' }],
  ['travel', 'Путешествие', { mark: 'family-pair', love: 'balloon', voice: 'flag', spark: 'sparkle', path: 'paper-plane', goal: 'mountain', care: 'cup', idea: 'map' }],
  ['garden', 'Сад', { mark: 'tree-family', love: 'sun-smile', voice: 'letter', spark: 'leaf', path: 'bicycle', goal: 'flag-peak', care: 'flower', idea: 'seed' }],
  ['winter', 'Зима', { mark: 'house-heart', love: 'hug', voice: 'bell', spark: 'snowflake', path: 'sailboat', goal: 'mountain', care: 'cup', idea: 'gift' }],
  ['sport', 'Спорт', { mark: 'family-pair', love: 'sun-smile', voice: 'flag', spark: 'sparkle', path: 'bicycle', goal: 'trophy', care: 'clover', idea: 'star' }],
  ['tale', 'Сказка', { mark: 'family-three', love: 'balloon', voice: 'letter', spark: 'moon', path: 'sailboat', goal: 'key', care: 'flower', idea: 'note' }],
  ['sea', 'Море', { mark: 'family-pair', love: 'sun-smile', voice: 'flag', spark: 'bubble', path: 'sailboat', goal: 'flag-peak', care: 'paw', idea: 'map' }],
  ['kitchen', 'Кухня', { mark: 'house-heart', love: 'heart', voice: 'bell', spark: 'sparkle', path: 'compass', goal: 'trophy', care: 'cup', idea: 'gift' }],
  ['space', 'Космос', { mark: 'family-three', love: 'balloon', voice: 'radio', spark: 'star', path: 'rocket', goal: 'target', care: 'heart', idea: 'bulb' }],
  ['forest', 'Лес', { mark: 'tree-family', love: 'hug', voice: 'flag', spark: 'leaf', path: 'compass', goal: 'mountain', care: 'paw', idea: 'seed' }],
  ['holiday', 'Праздник', { mark: 'family-three', love: 'balloon', voice: 'bell', spark: 'sparkle', path: 'paper-plane', goal: 'trophy', care: 'cup', idea: 'gift' }],
  ['craft', 'Ремесло', { mark: 'house-heart', love: 'heart-hands', voice: 'letter', spark: 'sparkle', path: 'compass', goal: 'key', care: 'clover', idea: 'bulb' }],
  ['music', 'Музыка', { mark: 'family-pair', love: 'sun-smile', voice: 'radio', spark: 'star', path: 'bicycle', goal: 'trophy', care: 'heart', idea: 'note' }],
  ['pets', 'Питомцы', { mark: 'cat-dog', love: 'heart', voice: 'bell', spark: 'sparkle', path: 'bicycle', goal: 'target', care: 'paw', idea: 'gift' }],
  ['city', 'Городские будни', { mark: 'family-pair', love: 'balloon', voice: 'radio', spark: 'sparkle', path: 'bicycle', goal: 'flag-peak', care: 'cup', idea: 'map' }],
  ['picnic', 'Пикник', { mark: 'tree-family', love: 'sun-smile', voice: 'letter', spark: 'leaf', path: 'bicycle', goal: 'target', care: 'flower', idea: 'gift' }],
  ['hygge', 'Уют', { mark: 'house-heart', love: 'hug', voice: 'bell', spark: 'moon', path: 'sailboat', goal: 'key', care: 'cup', idea: 'note' }],
  ['discovery', 'Открытие', { mark: 'family-three', love: 'heart-hands', voice: 'radio', spark: 'sparkle', path: 'compass', goal: 'mountain', care: 'clover', idea: 'map' }],
  ['summer', 'Лето', { mark: 'cat-dog', love: 'sun-smile', voice: 'flag', spark: 'bubble', path: 'sailboat', goal: 'flag-peak', care: 'flower', idea: 'seed' }],
] as const satisfies readonly (readonly [
  id: string,
  label: string,
  slots: Readonly<Record<(typeof ICON_SLOTS)[number], IconName>>,
])[]
