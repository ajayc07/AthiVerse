// ─── Character ──────────────────────────────────────────────────────────────

export interface CharacterAudio {
  name: string // filename without extension: "spiderman"
}

export interface Character {
  id: string
  name: string
  universe: Universe
  image: string            // path relative to assets/characters/
  colors: string[]         // primary colors of the character
  powers: string[]
  weapons: string[]
  speed: 'slow' | 'medium' | 'fast' | 'ultra'
  canFly: boolean
  canSwim: boolean
  canUseSword: boolean
  countables: string[]     // things you can count: ["swords", "webs"]
  tags: string[]
  firstLetter: string      // first letter of character name
  audio: CharacterAudio
}

// ─── Universe ────────────────────────────────────────────────────────────────

export type Universe =
  | 'marvel'
  | 'dc'
  | 'naruto'
  | 'onepiece'
  | 'demonslayer'

export interface UniverseMeta {
  id: Universe
  label: string
  color: string       // tailwind bg color class
  accentColor: string // tailwind text/border color
  emoji: string
  locked: boolean
}

// ─── Learning ────────────────────────────────────────────────────────────────

export type SkillNodeId =
  | 'count_1_10'
  | 'count_1_15'
  | 'count_1_20'
  | 'capital_letters'
  | 'small_letters'
  | 'alphabet_sequence'
  | 'color_primary'
  | 'color_groups'
  | 'color_shades'
  | 'memory_sequence_2'
  | 'memory_sequence_3'
  | 'memory_sequence_4'
  | 'logic_patterns_1'
  | 'logic_patterns_2'
  | 'logic_classification'
  | 'logic_deduction'

export interface SkillNode {
  id: SkillNodeId
  label: string
  pillar: Pillar
  masteryScore: number      // 0-100
  attempts: number
  correctStreak: number
  incorrectStreak: number
  lastSeen: string | null   // ISO date
  unlocked: boolean
  prerequisite: SkillNodeId | null
}

export type Pillar = 'numbers' | 'alphabets' | 'colors' | 'memory' | 'logic'

// ─── Questions ───────────────────────────────────────────────────────────────

export type TemplateId =
  | 'find_character'
  | 'find_by_color'
  | 'find_by_power'
  | 'find_by_weapon'
  | 'find_by_universe'
  | 'find_by_first_letter'
  | 'find_by_attribute'
  | 'who_am_i'
  | 'count_objects'
  | 'sort_objects'

export interface QuestionTemplate {
  id: TemplateId
  label: string
  pillar: Pillar
  skillNodes: SkillNodeId[]
  minAge: number
}

export interface Question {
  id: string
  templateId: TemplateId
  pillar: Pillar
  skillNode: SkillNodeId
  prompt: string               // "Find the character who uses lightning!"
  correctAnswer: string        // character id or value
  options: AnswerOption[]
  hint?: string
  audioInstruction?: string    // instruction audio key
  audioCharacter?: string      // character audio key for correct answer
}

export interface AnswerOption {
  id: string
  value: string               // character id or raw value
  label: string               // display label
  isCorrect: boolean
}

// ─── Rewards ─────────────────────────────────────────────────────────────────

export interface Achievement {
  id: string
  label: string
  description: string
  icon: string
  condition: 'stars' | 'streak' | 'games' | 'mastery'
  threshold: number
  unlocked: boolean
  unlockedAt: string | null
}

export type RewardType = 'star' | 'sticker' | 'background' | 'celebration' | 'certificate'

export interface MilestoneReward {
  stars: number
  type: RewardType
  label: string
}

// ─── Profile ─────────────────────────────────────────────────────────────────

export interface AgeConfig {
  maxOptionsPerQuestion: number
  sessionLengthMinutes: number
  minTouchTargetPx: number
  maxSequenceMemoryLength: number
  autoNarrateInstructions: boolean
  showTextWithAudio: boolean
  celebrationEvery: number
  mistakeTolerance: number
}

export interface ParentSettings {
  maxSessionMinutes: number
  soundEnabled: boolean
  difficultyMode: 'adaptive' | 'easy' | 'hard'
  unlockAllUniverses: boolean
  allowFreePlay: boolean
}

export interface Profile {
  id: string
  name: string
  avatar: string
  createdAt: string
  totalStars: number
  totalCorrect: number
  totalAttempts: number
  currentStreak: number
  favoriteCharacters: string[]
  unlockedUniverses: Universe[]
  unlockedBackgrounds: string[]
  unlockedStickers: string[]
  achievements: Achievement[]
  skillNodes: Record<SkillNodeId, SkillNode>
  ageConfig: AgeConfig
  parentSettings: ParentSettings
  dailyMissions: DailyMission[]
  lastSession: string | null
}

// ─── Daily Missions ──────────────────────────────────────────────────────────

export interface DailyMission {
  id: string
  label: string
  description: string
  pillar: Pillar
  target: number
  progress: number
  completed: boolean
  date: string // ISO date YYYY-MM-DD
}

// ─── Game Session ────────────────────────────────────────────────────────────

export type GameId =
  | 'hero_counting'
  | 'capital_to_small'
  | 'color_sorting'
  | 'memory_flip'
  | 'missing_number'
  | 'find_odd_one'
  | 'sort_by_attribute'
  | 'who_am_i'
  | 'trace_numbers'
  | 'tap_and_count'
  | 'number_hunt'
  | 'alphabet_sequence'
  | 'remember_order'
  | 'character_disappears'
  | 'pattern_builder'
  | 'compare_and_choose'

export interface GameMeta {
  id: GameId
  label: string
  description: string
  pillar: Pillar
  tier: 1 | 2
  skillNodes: SkillNodeId[]
  emoji: string
  minAge: number
  locked: boolean
}

export interface GameSession {
  id: string
  gameId: GameId
  universe: Universe | null
  profileId: string
  startedAt: string
  endedAt: string | null
  questions: QuestionResult[]
  starsEarned: number
  completed: boolean
}

export interface QuestionResult {
  questionId: string
  templateId: TemplateId
  skillNode: SkillNodeId
  correct: boolean
  timeMs: number
  answeredAt: string
}

// ─── Navigation ──────────────────────────────────────────────────────────────

export type Screen =
  | 'splash'
  | 'home'
  | 'universe_selection'
  | 'game_selection'
  | 'gameplay'
  | 'reward'
  | 'progress_summary'
  | 'parent_settings'

export interface NavState {
  screen: Screen
  universe?: Universe
  gameId?: GameId
  sessionId?: string
}

// ─── Content Pack ────────────────────────────────────────────────────────────

export type ContentPack = 'private-pack' | 'public-pack'

export interface ContentPackConfig {
  activeContentPack: ContentPack
  packs: Record<ContentPack, { label: string; universes: Universe[] }>
}
