import { type ReactElement } from 'react'
import { useGameStore } from '@/store/gameStore'
import { SplashScreen } from '@/screens/Splash'
import { HomeScreen } from '@/screens/Home'
import { UniverseSelectionScreen } from '@/screens/UniverseSelection'
import { GameSelectionScreen } from '@/screens/GameSelection'
import { GameplayScreen } from '@/screens/Gameplay'
import { RewardScreen } from '@/screens/Reward'
import { ProgressSummaryScreen } from '@/screens/ProgressSummary'
import { ParentSettingsScreen } from '@/screens/ParentSettings'
import { AnimatePresence, motion } from 'framer-motion'

export default function App() {
  const screen = useGameStore(s => s.nav.screen)

  const screens: Record<string, ReactElement> = {
    splash:             <SplashScreen />,
    home:               <HomeScreen />,
    universe_selection: <UniverseSelectionScreen />,
    game_selection:     <GameSelectionScreen />,
    gameplay:           <GameplayScreen />,
    reward:             <RewardScreen />,
    progress_summary:   <ProgressSummaryScreen />,
    parent_settings:    <ParentSettingsScreen />
  }

  return (
    <div className="w-screen h-screen overflow-hidden bg-slate-900 select-none">
      <AnimatePresence mode="wait">
        <motion.div
          key={screen}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -20 }}
          transition={{ duration: 0.2 }}
          className="w-full h-full"
        >
          {screens[screen] ?? <HomeScreen />}
        </motion.div>
      </AnimatePresence>
    </div>
  )
}
