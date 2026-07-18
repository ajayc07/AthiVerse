import type { Character, SkillNodeId } from '@/types'

/** Shuffle an array (Fisher-Yates) */
export function shuffle<T>(arr: T[]): T[] {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

/** Pick n random items from array */
export function pickRandom<T>(arr: T[], n: number): T[] {
  return shuffle(arr).slice(0, n)
}

/** Pick one random item */
export function pickOne<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)]
}

/** Weighted pick: favorites get 70%, rest get 30% */
export function weightedPickCharacters(
  characters: Character[],
  favorites: string[],
  count: number
): Character[] {
  const favChars = characters.filter(c => favorites.includes(c.id))
  const restChars = characters.filter(c => !favorites.includes(c.id))

  const favCount = Math.round(count * 0.7)
  const restCount = count - favCount

  const picked = [
    ...pickRandom(favChars, Math.min(favCount, favChars.length)),
    ...pickRandom(restChars, Math.min(restCount, restChars.length))
  ]

  // If we didn't get enough, fill from the remaining pool
  if (picked.length < count) {
    const remaining = characters.filter(c => !picked.includes(c))
    picked.push(...pickRandom(remaining, count - picked.length))
  }

  return shuffle(picked).slice(0, count)
}

/** Shuffled number options: the correct answer + adjacent distractors so wrong options stay plausible */
export function buildAdjacentOptions(correct: number, max: number, count = 3): number[] {
  const wrong = new Set<number>()
  for (let delta = 1; wrong.size < count - 1 && delta <= max; delta++) {
    if (correct - delta >= 1) wrong.add(correct - delta)
    if (wrong.size < count - 1 && correct + delta <= max) wrong.add(correct + delta)
  }
  for (let n = 1; wrong.size < count - 1; n++) {
    if (n !== correct) wrong.add(n)
  }
  return shuffle([correct, ...Array.from(wrong).slice(0, count - 1)])
}

/** Counting skill node for the number actually in play, so higher tiers gain mastery */
export function countingNodeFor(n: number): SkillNodeId {
  return n > 15 ? 'count_1_20' : n > 10 ? 'count_1_15' : 'count_1_10'
}

/** Generate a unique ID */
export function uid(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`
}

/** Today's date as YYYY-MM-DD */
export function todayISO(): string {
  return new Date().toISOString().split('T')[0]
}

/** Format a number with leading zero */
export function pad(n: number): string {
  return n.toString().padStart(2, '0')
}

/** Clamp a number between min and max */
export function clamp(n: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, n))
}

/** Get primary color hex for a color name */
export const COLOR_MAP: Record<string, string> = {
  red:     '#ef4444',
  blue:    '#3b82f6',
  green:   '#22c55e',
  yellow:  '#eab308',
  orange:  '#f97316',
  purple:  '#a855f7',
  pink:    '#ec4899',
  black:   '#1e293b',
  white:   '#f8fafc',
  grey:    '#94a3b8',
  gray:    '#94a3b8',
  gold:    '#f59e0b',
  silver:  '#cbd5e1',
  teal:    '#14b8a6',
  brown:   '#92400e'
}

export function colorToHex(color: string): string {
  return COLOR_MAP[color.toLowerCase()] ?? '#6366f1'
}
