/**
 * Question Generator
 *
 * Generates procedural questions from character metadata + templates.
 * No question is hardcoded. All logic is driven by data.
 */

import type {
  Question, AnswerOption, Character, TemplateId,
  SkillNodeId, Pillar, Universe
} from '@/types'
import { shuffle, pickRandom, pickOne, weightedPickCharacters, uid } from '@/utils/helpers'
import { validateQuestion } from './validator'
import allCharacters from '@/data/characters.json'

const MAX_RETRIES = 5

export interface GenerateOptions {
  templateId?: TemplateId
  universe?: Universe
  skillNode?: SkillNodeId
  maxOptions?: number              // from ageConfig
  favoriteCharacters?: string[]
  excludeQuestionIds?: string[]    // recent question IDs to avoid repeats
}

// ─── Main entry ──────────────────────────────────────────────────────────────

export function generateQuestion(opts: GenerateOptions = {}): Question | null {
  const {
    templateId,
    universe,
    skillNode,
    maxOptions = 3,
    favoriteCharacters = [],
    excludeQuestionIds = []
  } = opts

  // Filter characters by universe if provided
  const pool = universe
    ? (allCharacters as Character[]).filter(c => c.universe === universe)
    : (allCharacters as Character[])

  if (pool.length < 3) return null

  // Pick a template
  const template = templateId ?? pickRandomTemplate(pool, skillNode)
  if (!template) return null

  // Try generating up to MAX_RETRIES times
  for (let i = 0; i < MAX_RETRIES; i++) {
    const question = buildQuestion(template, pool, maxOptions, favoriteCharacters, skillNode)
    if (!question) continue

    const { valid } = validateQuestion(question)
    if (valid) return question
  }

  return null
}

// ─── Template picker ─────────────────────────────────────────────────────────

const TEMPLATES: TemplateId[] = [
  'find_character',
  'find_by_color',
  'find_by_power',
  'find_by_universe',
  'find_by_first_letter',
  'find_by_attribute',
  'who_am_i'
]

function pickRandomTemplate(pool: Character[], skillNode?: SkillNodeId): TemplateId {
  // Bias by skillNode pillar
  if (skillNode?.startsWith('count')) return 'find_character'
  if (skillNode?.startsWith('color')) return 'find_by_color'
  if (skillNode?.startsWith('capital') || skillNode?.startsWith('small') || skillNode?.startsWith('alphabet'))
    return 'find_by_first_letter'
  return pickOne(TEMPLATES)
}

// ─── Question builders ────────────────────────────────────────────────────────

function buildQuestion(
  templateId: TemplateId,
  pool: Character[],
  maxOptions: number,
  favorites: string[],
  skillNode?: SkillNodeId
): Question | null {
  switch (templateId) {
    case 'find_character':       return buildFindCharacter(pool, maxOptions, favorites, skillNode)
    case 'find_by_color':        return buildFindByColor(pool, maxOptions, favorites, skillNode)
    case 'find_by_power':        return buildFindByPower(pool, maxOptions, favorites, skillNode)
    case 'find_by_weapon':       return buildFindByWeapon(pool, maxOptions, favorites, skillNode)
    case 'find_by_universe':     return buildFindByUniverse(pool, maxOptions, favorites, skillNode)
    case 'find_by_first_letter': return buildFindByFirstLetter(pool, maxOptions, favorites, skillNode)
    case 'find_by_attribute':    return buildFindByAttribute(pool, maxOptions, favorites, skillNode)
    case 'who_am_i':             return buildWhoAmI(pool, maxOptions, favorites, skillNode)
    default:                     return buildFindCharacter(pool, maxOptions, favorites, skillNode)
  }
}

// ─── Individual builders ──────────────────────────────────────────────────────

function buildFindCharacter(
  pool: Character[], maxOptions: number, favorites: string[], skillNode?: SkillNodeId
): Question | null {
  const chars = weightedPickCharacters(pool, favorites, maxOptions)
  if (chars.length < 2) return null

  const correct = chars[0]
  const options = buildOptions(chars, correct.id, c => c.name)

  return {
    id: uid(),
    templateId: 'find_character',
    pillar: 'logic',
    skillNode: skillNode ?? 'logic_classification',
    prompt: `Find ${correct.name}! 🦸`,
    correctAnswer: correct.id,
    options,
    audioInstruction: 'find',
    audioCharacter: correct.id
  }
}

function buildFindByColor(
  pool: Character[], maxOptions: number, favorites: string[], skillNode?: SkillNodeId
): Question | null {
  // Pick a character with at least one color
  const withColors = pool.filter(c => c.colors.length > 0)
  if (withColors.length < 2) return null

  const correct = pickOne(weightedPickCharacters(withColors, favorites, 5))
  const color = pickOne(correct.colors)

  // Find characters that DON'T have this color as a distractor
  const distractors = pool
    .filter(c => c.id !== correct.id && !c.colors.includes(color))
    .slice(0, maxOptions - 1)

  if (distractors.length < 1) return null

  const chars = shuffle([correct, ...pickRandom(distractors, maxOptions - 1)])
  const options = buildOptions(chars, correct.id, c => c.name)

  return {
    id: uid(),
    templateId: 'find_by_color',
    pillar: 'colors',
    skillNode: skillNode ?? 'color_primary',
    prompt: `Find the ${color} hero! 🎨`,
    correctAnswer: correct.id,
    options,
    audioInstruction: 'find',
    audioCharacter: correct.id
  }
}

function buildFindByPower(
  pool: Character[], maxOptions: number, favorites: string[], skillNode?: SkillNodeId
): Question | null {
  const withPowers = pool.filter(c => c.powers.length > 0)
  if (withPowers.length < 2) return null

  const correct = pickOne(weightedPickCharacters(withPowers, favorites, 5))
  const power = pickOne(correct.powers).replace(/-/g, ' ')

  // Distractors don't share the same power
  const distractors = pool.filter(c =>
    c.id !== correct.id && !c.powers.some(p => p === pickOne(correct.powers))
  )
  if (distractors.length < 1) return null

  const chars = shuffle([correct, ...pickRandom(distractors, maxOptions - 1)])
  const options = buildOptions(chars, correct.id, c => c.name)

  return {
    id: uid(),
    templateId: 'find_by_power',
    pillar: 'logic',
    skillNode: skillNode ?? 'logic_classification',
    prompt: `Who has the power of ${power}? ⚡`,
    correctAnswer: correct.id,
    options,
    audioInstruction: 'find'
  }
}

function buildFindByWeapon(
  pool: Character[], maxOptions: number, favorites: string[], skillNode?: SkillNodeId
): Question | null {
  const withWeapons = pool.filter(c => c.weapons.length > 0)
  if (withWeapons.length < 2) return null

  const correct = pickOne(weightedPickCharacters(withWeapons, favorites, 5))
  const weapon = pickOne(correct.weapons).replace(/-/g, ' ')

  const distractors = pool.filter(c =>
    c.id !== correct.id && !c.weapons.includes(pickOne(correct.weapons))
  )
  if (distractors.length < 1) return null

  const chars = shuffle([correct, ...pickRandom(distractors, maxOptions - 1)])
  const options = buildOptions(chars, correct.id, c => c.name)

  return {
    id: uid(),
    templateId: 'find_by_weapon',
    pillar: 'logic',
    skillNode: skillNode ?? 'logic_classification',
    prompt: `Who uses a ${weapon}? ⚔️`,
    correctAnswer: correct.id,
    options,
    audioInstruction: 'find'
  }
}

function buildFindByUniverse(
  pool: Character[], maxOptions: number, favorites: string[], skillNode?: SkillNodeId
): Question | null {
  const universeLabels: Record<string, string> = {
    marvel: 'Marvel', dc: 'DC', naruto: 'Naruto', onepiece: 'One Piece', demonslayer: 'Demon Slayer'
  }

  const correct = pickOne(weightedPickCharacters(pool, favorites, 5))
  const universe = correct.universe
  const label = universeLabels[universe] ?? universe

  const distractors = pool.filter(c => c.id !== correct.id && c.universe !== universe)
  if (distractors.length < 1) return null

  const chars = shuffle([correct, ...pickRandom(distractors, maxOptions - 1)])
  const options = buildOptions(chars, correct.id, c => c.name)

  return {
    id: uid(),
    templateId: 'find_by_universe',
    pillar: 'logic',
    skillNode: skillNode ?? 'logic_classification',
    prompt: `Find a hero from ${label}! 🌍`,
    correctAnswer: correct.id,
    options,
    audioInstruction: 'find'
  }
}

function buildFindByFirstLetter(
  pool: Character[], maxOptions: number, favorites: string[], skillNode?: SkillNodeId
): Question | null {
  const correct = pickOne(weightedPickCharacters(pool, favorites, 5))
  const letter = correct.name[0].toUpperCase()

  const distractors = pool.filter(c =>
    c.id !== correct.id && c.name[0].toUpperCase() !== letter
  )
  if (distractors.length < 1) return null

  const chars = shuffle([correct, ...pickRandom(distractors, maxOptions - 1)])
  const options = buildOptions(chars, correct.id, c => c.name)

  const isCapital = skillNode === 'capital_letters' || !skillNode
  const displayLetter = isCapital ? letter : letter.toLowerCase()

  return {
    id: uid(),
    templateId: 'find_by_first_letter',
    pillar: 'alphabets',
    skillNode: skillNode ?? 'capital_letters',
    prompt: `Find the hero whose name starts with "${displayLetter}"! 🔤`,
    correctAnswer: correct.id,
    options,
    hint: `The letter is "${displayLetter}"`,
    audioInstruction: 'find'
  }
}

function buildFindByAttribute(
  pool: Character[], maxOptions: number, favorites: string[], skillNode?: SkillNodeId
): Question | null {
  const attributes = [
    { key: 'canFly' as const,     label: 'can fly',   emoji: '🦅' },
    { key: 'canSwim' as const,    label: 'can swim',  emoji: '🌊' },
    { key: 'canUseSword' as const,label: 'uses a sword', emoji: '⚔️' }
  ]

  const attr = pickOne(attributes)
  const withAttr = pool.filter(c => c[attr.key] === true)
  if (withAttr.length < 1) return null

  const correct = pickOne(weightedPickCharacters(withAttr, favorites, 5))
  const distractors = pool.filter(c => c.id !== correct.id && c[attr.key] === false)
  if (distractors.length < 1) return null

  const chars = shuffle([correct, ...pickRandom(distractors, maxOptions - 1)])
  const options = buildOptions(chars, correct.id, c => c.name)

  return {
    id: uid(),
    templateId: 'find_by_attribute',
    pillar: 'logic',
    skillNode: skillNode ?? 'logic_deduction',
    prompt: `Find the hero who ${attr.label}! ${attr.emoji}`,
    correctAnswer: correct.id,
    options,
    audioInstruction: 'find'
  }
}

function buildWhoAmI(
  pool: Character[], maxOptions: number, favorites: string[], skillNode?: SkillNodeId
): Question | null {
  const correct = pickOne(weightedPickCharacters(pool, favorites, 5))

  // Build clue list
  const clues: string[] = []
  if (correct.colors.length > 0) clues.push(`I am ${correct.colors[0]}`)
  if (correct.powers.length > 0) clues.push(`I can ${correct.powers[0].replace(/-/g, ' ')}`)
  if (correct.canFly) clues.push('I can fly')
  if (correct.canUseSword) clues.push('I use a sword')

  if (clues.length === 0) return null

  const selectedClues = pickRandom(clues, Math.min(2, clues.length))

  const distractors = pool.filter(c => c.id !== correct.id)
  const chars = shuffle([correct, ...pickRandom(distractors, maxOptions - 1)])
  const options = buildOptions(chars, correct.id, c => c.name)

  return {
    id: uid(),
    templateId: 'who_am_i',
    pillar: 'logic',
    skillNode: skillNode ?? 'logic_deduction',
    prompt: `Who am I? ${selectedClues.join('. ')}! 🦸`,
    correctAnswer: correct.id,
    options,
    audioInstruction: 'whoareyou'
  }
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function buildOptions(
  chars: Character[],
  correctId: string,
  labelFn: (c: Character) => string
): AnswerOption[] {
  return chars.map(c => ({
    id: uid(),
    value: c.id,
    label: labelFn(c),
    isCorrect: c.id === correctId
  }))
}
