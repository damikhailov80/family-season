export const FIELD_LIMITS: Record<string, number> = {
  'header.title': 20,
  'header.ribbon': 64,
  'theme.subtitle': 26,
  'theme.question': 90,
  weeksNote: 48,
  projectsNote: 48,
  'weeks.*.title': 18,
  'weeks.*.text': 48,
  goal: 88,
  'people.*.name': 12,
  'people.*.project': 22,
  'people.*.description': 68,
  'people.*.goal': 52,
}

const DEFAULT_LIMIT = 48

export function limitFor(path: string): number {
  return FIELD_LIMITS[path.replace(/\.\d+\./g, '.*.')] ?? DEFAULT_LIMIT
}
