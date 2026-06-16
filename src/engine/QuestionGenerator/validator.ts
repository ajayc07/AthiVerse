import type { Question, AnswerOption } from '@/types'

export interface ValidationResult {
  valid: boolean
  reason?: string
}

/** Validate a generated question before serving it to the child */
export function validateQuestion(question: Question): ValidationResult {
  // Must have a prompt
  if (!question.prompt || question.prompt.trim() === '') {
    return { valid: false, reason: 'Empty prompt' }
  }

  // Must have options
  if (!question.options || question.options.length < 2) {
    return { valid: false, reason: 'Not enough options' }
  }

  // Must have exactly one correct answer
  const correct = question.options.filter(o => o.isCorrect)
  if (correct.length !== 1) {
    return { valid: false, reason: `Expected 1 correct answer, got ${correct.length}` }
  }

  // All options must have unique values
  const values = question.options.map(o => o.value)
  if (new Set(values).size !== values.length) {
    return { valid: false, reason: 'Duplicate option values' }
  }

  // All options must have labels
  if (question.options.some(o => !o.label)) {
    return { valid: false, reason: 'Option missing label' }
  }

  // Correct answer must be in options
  const correctInOptions = question.options.some(o => o.value === question.correctAnswer && o.isCorrect)
  if (!correctInOptions) {
    return { valid: false, reason: 'Correct answer not in options' }
  }

  return { valid: true }
}

/** Remove ambiguous options (options that could also be considered correct) */
export function removeAmbiguousOptions(
  question: Question,
  ambiguousIds: string[]
): Question {
  if (ambiguousIds.length === 0) return question

  const filtered = question.options.filter(
    o => !ambiguousIds.includes(o.value) || o.isCorrect
  )

  return { ...question, options: filtered }
}
