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

interface ScreenTransition {
  initial: Record<string, number>
  animate: Record<string, number>
  exit: Record<string, number>
}

const SLIDE: ScreenTransition = {
  initial: { opacity: 0, x: 20 },
  animate: { opacity: 1, x: 0 },
  exit:    { opacity: 0, x: -20 }
}

// Distinct feel per destination: zoom into gameplay, slide rewards/settings up, fade home
const TRANSITIONS: Record<string, ScreenTransition> = {
  home:            { initial: { opacity: 0 }, animate: { opacity: 1 }, exit: { opacity: 0 } },
  gameplay:        { initial: { opacity: 0, scale: 0.92 }, animate: { opacity: 1, scale: 1 }, exit: { opacity: 0, scale: 1.05 } },
  reward:          { initial: { opacity: 0, y: 40 }, animate: { opacity: 1, y: 0 }, exit: { opacity: 0, y: -30 } },
  parent_settings: { initial: { opacity: 0, y: 40 }, animate: { opacity: 1, y: 0 }, exit: { opacity: 0, y: 40 } }
}

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

  const transition = TRANSITIONS[screen] ?? SLIDE

  return (
    <div className="w-screen h-screen overflow-hidden bg-slate-900 select-none">
      <AnimatePresence mode="wait">
        <motion.div
          key={screen}
          initial={transition.initial}
          animate={transition.animate}
          exit={transition.exit}
          transition={{ duration: 0.22 }}
          className="w-full h-full"
        >
          {screens[screen] ?? <HomeScreen />}
        </motion.div>
      </AnimatePresence>
    </div>
  )
}
