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
import { TraceNumbers } from './numbers/TraceNumbers'
import { TapAndCount } from './numbers/TapAndCount'
import { NumberHunt } from './numbers/NumberHunt'
import { AlphabetSequence } from './alphabets/AlphabetSequence'
import { RememberTheOrder } from './memory/RememberTheOrder'
import { CharacterDisappears } from './memory/CharacterDisappears'
import { PatternBuilder } from './logic/PatternBuilder'
import { CompareAndChoose } from './logic/CompareAndChoose'
import { Button } from '@/components/Button'

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
    case 'trace_numbers':     return <TraceNumbers {...props} />

    // Tier 2
    case 'tap_and_count':        return <TapAndCount {...props} />
    case 'number_hunt':          return <NumberHunt {...props} />
    case 'alphabet_sequence':    return <AlphabetSequence onComplete={onComplete} />
    case 'remember_order':       return <RememberTheOrder {...props} />
    case 'character_disappears': return <CharacterDisappears {...props} />
    case 'pattern_builder':      return <PatternBuilder {...props} />
    case 'compare_and_choose':   return <CompareAndChoose {...props} />

    // Safety net for unknown game ids
    default:
      return (
        <div className="flex-1 flex items-center justify-center text-white text-center p-8">
          <div>
            <p className="text-4xl mb-4">🚧</p>
            <p className="text-xl font-bold">Coming Soon!</p>
            <p className="text-white/60 mt-2">This game is being built</p>
            <Button variant="ghost" className="mt-6" onClick={() => onComplete(0)}>
              Go Back
            </Button>
          </div>
        </div>
      )
  }
}
