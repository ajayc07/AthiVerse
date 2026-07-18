/**
 * Memory Flip Cards
 * Classic pairs memory game with character cards.
 */

import { useState, useCallback, useEffect, useRef } from 'react'
import { motion } from 'framer-motion'
import { CharacterCard } from '@/components/CharacterCard'
import { CelebrationOverlay } from '@/components/CelebrationOverlay'
import { GameHeader } from '@/components/GameHeader'
import { useProfileStore } from '@/store/profileStore'
import { useGameStore } from '@/store/gameStore'
import { useAudio } from '@/hooks/useAudio'
import { shuffle, pickRandom } from '@/utils/helpers'
import type { Character } from '@/types'
import allCharacters from '@/data/characters.json'

interface CardState {
  id: string      // unique card instance id
  charId: string
  char: Character
  flipped: boolean
  matched: boolean
}

function buildGrid(pairsCount: number, universe?: string): CardState[] {
  const pool = universe
    ? (allCharacters as Character[]).filter(c => c.universe === universe)
    : (allCharacters as Character[])

  const selected = pickRandom(pool, pairsCount)
  const pairs = shuffle([...selected, ...selected])

  return pairs.map((char, i) => ({
    id: `${char.id}-${i}`,
    charId: char.id,
    char,
    flipped: false,
    matched: false
  }))
}

interface Props {
  universe?: string
  onComplete: (stars: number) => void
}

export function MemoryFlipCards({ universe, onComplete }: Props) {
  const profile = useProfileStore(s => s.activeProfile)
  const recordAnswer = useProfileStore(s => s.recordAnswer)
  const recordResult = useGameStore(s => s.recordResult)
  const { playCorrect, playWrong, playChar } = useAudio()

  const pairs = profile?.skillNodes.memory_sequence_3?.unlocked ? 4 : 3
  const [cards, setCards] = useState<CardState[]>(() => buildGrid(pairs, universe))
  const [flippedIds, setFlippedIds] = useState<string[]>([])
  const [matchCount, setMatchCount] = useState(0)
  const [locked, setLocked] = useState(false)
  const [celebrate, setCelebrate] = useState(false)
  const [stars, setStars] = useState(0)
  const [done, setDone] = useState(false)
  const attemptRef = useRef(0)

  const totalPairs = pairs

  const handleFlip = useCallback(async (cardId: string) => {
    if (locked) return
    const card = cards.find(c => c.id === cardId)
    if (!card || card.flipped || card.matched) return

    // Flip the card and say its name
    setCards(prev => prev.map(c => c.id === cardId ? { ...c, flipped: true } : c))
    playChar(card.char.id).catch(() => {})
    const newFlipped = [...flippedIds, cardId]
    setFlippedIds(newFlipped)

    if (newFlipped.length === 2) {
      setLocked(true)
      const [firstId, secondId] = newFlipped
      const first = cards.find(c => c.id === firstId)!
      const second = cards.find(c => c.id === secondId)!

      attemptRef.current += 1
      if (first.charId === second.charId) {
        // Match!
        await playCorrect()
        setCards(prev => prev.map(c =>
          c.id === firstId || c.id === secondId ? { ...c, matched: true } : c
        ))
        setMatchCount(m => m + 1)
        setStars(s => s + 1)
        setCelebrate(true)
        await recordAnswer('memory_sequence_2', true)
        recordResult({
          questionId: `memory-attempt-${attemptRef.current}`,
          templateId: 'find_character',
          skillNode: 'memory_sequence_2',
          correct: true,
          timeMs: 0,
          answeredAt: new Date().toISOString()
        })
        // Game end waits for the celebration so the last one isn't cut off
      } else {
        // No match
        await playWrong()
        await recordAnswer('memory_sequence_2', false)
        recordResult({
          questionId: `memory-attempt-${attemptRef.current}`,
          templateId: 'find_character',
          skillNode: 'memory_sequence_2',
          correct: false,
          timeMs: 0,
          answeredAt: new Date().toISOString()
        })
        setTimeout(() => {
          setCards(prev => prev.map(c =>
            c.id === firstId || c.id === secondId ? { ...c, flipped: false } : c
          ))
        }, 1000)
      }

      setTimeout(() => {
        setFlippedIds([])
        setLocked(false)
      }, 1200)
    }
  }, [cards, flippedIds, locked, matchCount, totalPairs])

  const handleCelebrationDone = useCallback(() => {
    setCelebrate(false)
    if (matchCount === totalPairs) setDone(true)
  }, [matchCount, totalPairs])

  useEffect(() => { if (done) onComplete(stars) }, [done, stars, onComplete])

  const gridClass = pairs === 4
    ? 'grid grid-cols-4 gap-3'
    : 'grid grid-cols-3 gap-3'

  return (
    <div className="flex flex-col h-full">
      <GameHeader
        title="Memory Flip 🧠"
        current={matchCount}
        total={totalPairs}
        stars={stars}
      />

      <div className="flex-1 flex flex-col items-center justify-center gap-4 px-4">
        <p className="text-white text-xl font-bold text-center">
          Find the matching pairs! 🧠
        </p>

        <div className={gridClass}>
          {cards.map(card => (
            <motion.div
              key={card.id}
              className="cursor-pointer"
              whileHover={!locked && !card.matched ? { scale: 1.05 } : {}}
              whileTap={!locked && !card.matched ? { scale: 0.95 } : {}}
              onClick={() => handleFlip(card.id)}
            >
              {card.flipped || card.matched ? (
                <motion.div
                  initial={{ rotateY: 90 }}
                  animate={{ rotateY: 0 }}
                  transition={{ duration: 0.2 }}
                >
                  <CharacterCard
                    character={card.char}
                    size="md"
                    correct={card.matched || undefined}
                    animate={false}
                  />
                </motion.div>
              ) : (
                <div className="w-24 h-24 rounded-2xl bg-indigo-600/60 border-2 border-indigo-400/40 flex items-center justify-center">
                  <span className="text-4xl">🦸</span>
                </div>
              )}
            </motion.div>
          ))}
        </div>

        <p className="text-white/60 text-sm">
          {matchCount} / {totalPairs} pairs found
        </p>
      </div>

      <CelebrationOverlay show={celebrate} onDone={handleCelebrationDone} />
    </div>
  )
}
