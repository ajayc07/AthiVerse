import type { SkillNode, SkillNodeId } from '@/types'

export interface MasteryUpdate {
  updatedNode: SkillNode
  shouldProgressToNext: boolean
  shouldRegress: boolean
  nextNodeId: SkillNodeId | null
}

/** PROGRESSION: 3 correct in a row → unlock next */
const PROGRESSION_STREAK = 3
/** REGRESSION: 2 incorrect → drop a tier */
const REGRESSION_STREAK = 2
/** Score increase per correct answer */
const CORRECT_DELTA = 10
/** Score decrease per wrong answer */
const WRONG_DELTA = 5
/** Extra penalty on regression */
const REGRESSION_PENALTY = 10
/** Mastery threshold to consider skill "complete" */
export const MASTERY_THRESHOLD = 80

export function computeMasteryUpdate(
  node: SkillNode,
  correct: boolean,
  allNodes: Record<SkillNodeId, SkillNode>
): MasteryUpdate {
  const updated = { ...node, attempts: node.attempts + 1, lastSeen: new Date().toISOString() }

  if (correct) {
    updated.correctStreak++
    updated.incorrectStreak = 0
    updated.masteryScore = Math.min(100, updated.masteryScore + CORRECT_DELTA)
  } else {
    updated.incorrectStreak++
    updated.correctStreak = 0
    updated.masteryScore = Math.max(0, updated.masteryScore - WRONG_DELTA)
  }

  const shouldProgressToNext = correct && updated.correctStreak >= PROGRESSION_STREAK
  const shouldRegress = !correct && updated.incorrectStreak >= REGRESSION_STREAK

  if (shouldRegress) {
    updated.masteryScore = Math.max(0, updated.masteryScore - REGRESSION_PENALTY)
  }

  // Find next node in the skill tree
  let nextNodeId: SkillNodeId | null = null
  if (shouldProgressToNext) {
    const nextNode = Object.values(allNodes).find(
      n => n.prerequisite === node.id && !n.unlocked
    )
    nextNodeId = (nextNode?.id as SkillNodeId) ?? null
  }

  return { updatedNode: updated, shouldProgressToNext, shouldRegress, nextNodeId }
}

/** Get active skill nodes for a pillar (unlocked, not yet mastered) */
export function getActiveSkillNodes(
  allNodes: Record<SkillNodeId, SkillNode>,
  pillar: string
): SkillNode[] {
  return Object.values(allNodes).filter(
    n => n.pillar === pillar && n.unlocked && n.masteryScore < MASTERY_THRESHOLD
  )
}

/** Suggest next skillNode to practice (spaced repetition: longest since seen) */
export function suggestSkillNode(
  allNodes: Record<SkillNodeId, SkillNode>,
  pillar?: string
): SkillNode | null {
  const candidates = Object.values(allNodes).filter(
    n => n.unlocked && n.masteryScore < MASTERY_THRESHOLD && (!pillar || n.pillar === pillar)
  )

  if (candidates.length === 0) return null

  // Sort by lastSeen ascending (null = never = highest priority)
  candidates.sort((a, b) => {
    if (!a.lastSeen) return -1
    if (!b.lastSeen) return 1
    return new Date(a.lastSeen).getTime() - new Date(b.lastSeen).getTime()
  })

  return candidates[0]
}
