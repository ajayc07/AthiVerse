/**
 * Remember Order
 * Simon-style: hero cards light up one at a time, then the child taps
 * them back in the same order. Wrong tap replays the sequence as a reveal.
 */

import { useState, useCallback, useEffect, useRef } from 'react'
import { motion } from 'framer-motion'
import { CharacterCard } from '@/components/CharacterCard'
import { CelebrationOverlay } from '@/components/CelebrationOverlay'
import { GameHeader } from '@/components/GameHeader'
import { useProfileStore } from '@/store/profileStore'
import { useGameStore } from '@/store/gameStore'
import { useAudio } from '@/hooks/useAudio'
import { weightedPickCharacters, shuffle, clamp } from '@/utils/helpers'
import type { Character, SkillNodeId } from '@/types'
import allCharacters from '@/data/characters.json'

const TOTAL_ROUNDS = 5
const SHOW_MS = 750

type Phase = 'showing' | 'input' | 'reveal'

interface Round {
  chars: Character[]
  order: number[]  // indices into chars, the sequence to reproduce
}

function buildRound(len: number, favorites: string[], universe?: string): Round {
  const all = allCharacters as Character[]
  let pool = universe ? all.filter(c => c.universe === universe) : all
  if (pool.length < len) pool = all
  const chars = weightedPickCharacters(pool, favorites, len)
  const order = shuffle(chars.map((_, i) => i))
  return { chars, order }
}

interface Props {
  universe?: string
  onComplete: (stars: number) => void
}

export function RememberTheOrder({ universe, onComplete }: Props) {
  const profile = useProfileStore(s => s.activeProfile)
  const recordAnswer = useProfileStore(s => s.recordAnswer)
  const recordResult = useGameStore(s => s.recordResult)
  const { playCorrect, playWrong, playChar } = useAudio()
  const favorites = profile?.favoriteCharacters ?? []

  // Sequence length grows with unlocked memory nodes, capped by age config
  const unlockedLen = profile?.skillNodes.memory_sequence_4?.unlocked ? 4
    : profile?.skillNodes.memory_sequence_3?.unlocked ? 3 : 2
  const seqLen = clamp(unlockedLen, 2, profile?.ageConfig.maxSequenceMemoryLength ?? 3)
  const skillNode = `memory_sequence_${seqLen}` as SkillNodeId

  const [round, setRound] = useState<Round>(() => buildRound(seqLen, favorites, universe))
  const [questionNum, setQuestionNum] = useState(1)
  const [phase, setPhase] = useState<Phase>('showing')
  const [highlight, setHighlight] = useState<number | null>(null)
  const [inputPos, setInputPos] = useState(0)
  const [tappedOk, setTappedOk] = useState<Set<number>>(new Set())
  const [celebrate, setCelebrate] = useState(false)
  const [stars, setStars] = useState(0)
  const [done, setDone] = useState(false)
  const timeouts = useRef<number[]>([])

  const clearTimeouts = () => {
    timeouts.current.forEach(t => clearTimeout(t))
    timeouts.current = []
  }

  // Play the sequence: light each card in order, then hand over to the child
  const playSequence = useCallback((r: Round, after: Phase) => {
    clearTimeouts()
    setPhase('showing')
    setHighlight(null)
    r.order.forEach((cardIdx, step) => {
      timeouts.current.push(window.setTimeout(() => {
        setHighlight(cardIdx)
        playChar(r.chars[cardIdx].id).catch(() => {})
      }, step * SHOW_MS))
      timeouts.current.push(window.setTimeout(() => setHighlight(null), step * SHOW_MS + SHOW_MS - 150))
    })
    timeouts.current.push(window.setTimeout(() => {
      setHighlight(null)
      setPhase(after)
    }, r.order.length * SHOW_MS + 200))
  }, [playChar])

  useEffect(() => {
    playSequence(round, 'input')
    return clearTimeouts
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [questionNum])

  const advance = useCallback(() => {
    setCelebrate(false)
    setInputPos(0)
    setTappedOk(new Set())
    if (questionNum >= TOTAL_ROUNDS) { setDone(true); return }
    setQuestionNum(q => q + 1)
    setRound(buildRound(seqLen, favorites, universe))
  }, [questionNum, seqLen, favorites, universe])

  const finishRound = useCallback(async (correct: boolean) => {
    await recordAnswer(skillNode, correct)
    recordResult({
      questionId: `order-${questionNum}`,
      templateId: 'find_character',
      skillNode,
      correct,
      timeMs: 0,
      answeredAt: new Date().toISOString()
    })
  }, [skillNode, questionNum, recordAnswer, recordResult])

  const handleTap = useCallback(async (cardIdx: number) => {
    if (phase !== 'input') return

    if (cardIdx === round.order[inputPos]) {
      playChar(round.chars[cardIdx].id).catch(() => {})
      const nextPos = inputPos + 1
      setTappedOk(prev => new Set(prev).add(cardIdx))
      setInputPos(nextPos)

      if (nextPos === round.order.length) {
        setPhase('reveal')
        await playCorrect()
        await finishRound(true)
        setStars(s => s + 1)
        setCelebrate(true)
      }
    } else {
      setPhase('reveal')
      await playWrong()
      await finishRound(false)
      // Teach: replay the right order once, then move on
      playSequence(round, 'reveal')
      setTimeout(advance, round.order.length * SHOW_MS + 900)
    }
  }, [phase, round, inputPos, playChar, playCorrect, playWrong, finishRound, playSequence, advance])

  useEffect(() => { if (done) onComplete(stars) }, [done, stars, onComplete])

  return (
    <div className="flex flex-col h-full">
      <GameHeader title="Remember Order 📋" current={questionNum - 1} total={TOTAL_ROUNDS} stars={stars} />

      <div className="flex-1 flex flex-col items-center justify-center gap-8 px-4">
        <motion.p
          key={`${questionNum}-${phase}`}
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-white text-2xl font-hero text-center"
        >
          {phase === 'showing' ? 'Watch closely! 👀' : phase === 'input' ? 'Your turn — same order! 👆' : 'Like this! ✨'}
        </motion.p>

        <div className="flex gap-4 justify-center flex-wrap">
          {round.chars.map((char, i) => {
            const isLit = highlight === i
            const isDone = tappedOk.has(i)
            return (
              <motion.div
                key={char.id}
                animate={isLit ? { scale: 1.18, y: -8 } : { scale: 1, y: 0 }}
                transition={{ duration: 0.2 }}
                onClick={() => handleTap(i)}
                className="cursor-pointer rounded-2xl"
                style={{
                  boxShadow: isLit ? '0 0 26px #facc15' : isDone ? '0 0 16px #4ade80' : 'none',
                  transition: 'box-shadow 0.2s'
                }}
              >
                <CharacterCard
                  character={char}
                  size="lg"
                  selected={isLit || undefined}
                  correct={isDone || undefined}
                  showName
                  animate={false}
                />
              </motion.div>
            )
          })}
        </div>

        {phase === 'input' && (
          <div className="flex gap-2">
            {round.order.map((_, i) => (
              <div
                key={i}
                className={`w-3 h-3 rounded-full ${i < inputPos ? 'bg-green-400' : 'bg-white/25'}`}
              />
            ))}
          </div>
        )}
      </div>

      <CelebrationOverlay show={celebrate} onDone={advance} />
    </div>
  )
}
