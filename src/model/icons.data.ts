/* Built by tools/icons/build.mjs (npm run icons) from tools/icons/source.json. */

import type { IconName } from '../components/doodles/icons.generated'

export const ICON_SLOTS = ['mark', 'love', 'voice', 'spark', 'path', 'goal', 'care', 'idea'] as const

export const ICON_SETS = [
  ['classic', { ru: 'Классика', en: 'Classic', pl: 'Klasyka' }, { mark: 'family-three', love: 'heart', voice: 'megaphone', spark: 'star', path: 'rocket', goal: 'target', care: 'heart', idea: 'star' }],
  ['home', { ru: 'Дом', en: 'Home', pl: 'Dom' }, { mark: 'house-heart', love: 'hug', voice: 'letter', spark: 'sparkle', path: 'compass', goal: 'key', care: 'cup', idea: 'bulb' }],
  ['travel', { ru: 'Путешествие', en: 'Travel', pl: 'Podróż' }, { mark: 'family-pair', love: 'balloon', voice: 'flag', spark: 'sparkle', path: 'paper-plane', goal: 'mountain', care: 'cup', idea: 'map' }],
  ['garden', { ru: 'Сад', en: 'Garden', pl: 'Ogród' }, { mark: 'tree-family', love: 'sun-smile', voice: 'letter', spark: 'leaf', path: 'bicycle', goal: 'flag-peak', care: 'flower', idea: 'seed' }],
  ['winter', { ru: 'Зима', en: 'Winter', pl: 'Zima' }, { mark: 'house-heart', love: 'hug', voice: 'bell', spark: 'snowflake', path: 'sailboat', goal: 'mountain', care: 'cup', idea: 'gift' }],
  ['sport', { ru: 'Спорт', en: 'Sport', pl: 'Sport' }, { mark: 'family-pair', love: 'sun-smile', voice: 'flag', spark: 'sparkle', path: 'bicycle', goal: 'trophy', care: 'clover', idea: 'star' }],
  ['tale', { ru: 'Сказка', en: 'Fairy Tale', pl: 'Bajka' }, { mark: 'family-three', love: 'balloon', voice: 'letter', spark: 'moon', path: 'sailboat', goal: 'key', care: 'flower', idea: 'note' }],
  ['sea', { ru: 'Море', en: 'Sea', pl: 'Morze' }, { mark: 'family-pair', love: 'sun-smile', voice: 'flag', spark: 'bubble', path: 'sailboat', goal: 'flag-peak', care: 'paw', idea: 'map' }],
  ['kitchen', { ru: 'Кухня', en: 'Kitchen', pl: 'Kuchnia' }, { mark: 'house-heart', love: 'heart', voice: 'bell', spark: 'sparkle', path: 'compass', goal: 'trophy', care: 'cup', idea: 'gift' }],
  ['space', { ru: 'Космос', en: 'Space', pl: 'Kosmos' }, { mark: 'family-three', love: 'balloon', voice: 'radio', spark: 'star', path: 'rocket', goal: 'target', care: 'heart', idea: 'bulb' }],
  ['forest', { ru: 'Лес', en: 'Forest', pl: 'Las' }, { mark: 'tree-family', love: 'hug', voice: 'flag', spark: 'leaf', path: 'compass', goal: 'mountain', care: 'paw', idea: 'seed' }],
  ['holiday', { ru: 'Праздник', en: 'Holiday', pl: 'Święto' }, { mark: 'family-three', love: 'balloon', voice: 'bell', spark: 'sparkle', path: 'paper-plane', goal: 'trophy', care: 'cup', idea: 'gift' }],
  ['craft', { ru: 'Ремесло', en: 'Craft', pl: 'Rzemiosło' }, { mark: 'house-heart', love: 'heart-hands', voice: 'letter', spark: 'sparkle', path: 'compass', goal: 'key', care: 'clover', idea: 'bulb' }],
  ['music', { ru: 'Музыка', en: 'Music', pl: 'Muzyka' }, { mark: 'family-pair', love: 'sun-smile', voice: 'radio', spark: 'star', path: 'bicycle', goal: 'trophy', care: 'heart', idea: 'note' }],
  ['pets', { ru: 'Питомцы', en: 'Pets', pl: 'Zwierzaki' }, { mark: 'cat-dog', love: 'heart', voice: 'bell', spark: 'sparkle', path: 'bicycle', goal: 'target', care: 'paw', idea: 'gift' }],
  ['city', { ru: 'Городские будни', en: 'City Days', pl: 'Miejska codzienność' }, { mark: 'family-pair', love: 'balloon', voice: 'radio', spark: 'sparkle', path: 'bicycle', goal: 'flag-peak', care: 'cup', idea: 'map' }],
  ['picnic', { ru: 'Пикник', en: 'Picnic', pl: 'Piknik' }, { mark: 'tree-family', love: 'sun-smile', voice: 'letter', spark: 'leaf', path: 'bicycle', goal: 'target', care: 'flower', idea: 'gift' }],
  ['hygge', { ru: 'Уют', en: 'Comfort', pl: 'Przytulność' }, { mark: 'house-heart', love: 'hug', voice: 'bell', spark: 'moon', path: 'sailboat', goal: 'key', care: 'cup', idea: 'note' }],
  ['discovery', { ru: 'Открытие', en: 'Discovery', pl: 'Odkrycie' }, { mark: 'family-three', love: 'heart-hands', voice: 'radio', spark: 'sparkle', path: 'compass', goal: 'mountain', care: 'clover', idea: 'map' }],
  ['summer', { ru: 'Лето', en: 'Summer', pl: 'Lato' }, { mark: 'cat-dog', love: 'sun-smile', voice: 'flag', spark: 'bubble', path: 'sailboat', goal: 'flag-peak', care: 'flower', idea: 'seed' }],
] as const satisfies readonly (readonly [
  id: string,
  label: Readonly<Record<'ru' | 'en' | 'pl', string>>,
  slots: Readonly<Record<(typeof ICON_SLOTS)[number], IconName>>,
])[]
