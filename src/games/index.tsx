/**
 * Game router — maps GameId to the correct game component
 */

import type { GameId } from '@/types'
import { HeroCounting } from './numbers/HeroCounting'
import { MissingNumber } from './numbers/MissingNumber'
import { CapitalToSmallMatch } from './alphabets/CapitalToSmallMatch'
import { ColorSorting } from './colors/ColorSorting'
import { MemoryFlipCards } from './memory/MemoryFlipCards'
import { WhoAmI } from './logic/WhoAmI'
import { FindTheOddOne } from './logic/FindTheOddOne'
import { SortByAttribute } from './logic/SortByAttribute'

interface GameRouterProps {
  gameId: GameId
  universe?: string
  onComplete: (stars: number) => void
}

export function GameRouter({ gameId, universe, onComplete }: GameRouterProps) {
  const props = { universe, onComplete }

  switch (gameId) {
    case 'hero_counting':     return <HeroCounting {...props} />
    case 'missing_number':    return <MissingNumber {...props} />
    case 'capital_to_small':  return <CapitalToSmallMatch onComplete={onComplete} />
    case 'color_sorting':     return <ColorSorting {...props} />
    case 'memory_flip':       return <MemoryFlipCards {...props} />
    case 'who_am_i':          return <WhoAmI {...props} />
    case 'find_odd_one':      return <FindTheOddOne onComplete={onComplete} />
    case 'sort_by_attribute': return <SortByAttribute onComplete={onComplete} />

    // Tier 2 — coming soon
    default:
      return (
        <div className="flex-1 flex items-center justify-center text-white text-center p-8">
          <div>
            <p className="text-4xl mb-4">🚧</p>
            <p className="text-xl font-bold">Coming Soon!</p>
            <p className="text-white/60 mt-2">This game is being built</p>
            <button
              onClick={() => onComplete(0)}
              className="mt-6 bg-white/20 text-white px-6 py-2 rounded-xl"
            >
              Go Back
            </button>
          </div>
        </div>
      )
  }
}
