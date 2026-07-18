# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm install       # first-time setup
npm run dev       # dev server at http://localhost:5173
npm run build     # tsc + vite build (outputs to dist/)
npm run preview   # serve the built PWA locally
```

No test runner is configured. Verify changes by running `npm run dev` and exercising the feature in the browser.

---

## Architecture

AthiVerse is an offline-first educational game engine for a 3-year-old. The tech stack is React 18 + TypeScript + Vite + TailwindCSS + Framer Motion + Howler.js + Zustand + IndexedDB.

### Navigation — no React Router

All screen transitions go through Zustand's `useGameStore` (`src/store/gameStore.ts`). The `nav` state object holds the current `Screen` name plus optional params (`universe`, `gameId`, `sessionId`). `App.tsx` renders a static map of screen components keyed by `nav.screen`. Use `navigate()` and `goBack()` from the store; never use URL routing.

### Two Zustand stores

- **`gameStore`** (`src/store/gameStore.ts`) — navigation state, current session lifecycle (`startSession`, `recordResult`, `endSession`), and `pendingStars` for the reward screen.
- **`profileStore`** (`src/store/profileStore.ts`) — persisted profile data: total stars, streak, skill node mastery, achievements, settings. Reads/writes to IndexedDB on every change.

### Engine pipeline

```
QuestionGenerator  →  validator  →  Game component
      ↑                                    ↓
DifficultyEngine           GameStore.recordResult()
      ↓                                    ↓
MasteryScore                     profileStore (persist)
      ↓                                    ↓
ProgressEngine              RewardEngine (milestone check)
```

- `src/engine/QuestionGenerator/index.ts` — procedurally generates `Question` objects from templates + character metadata. No hardcoded questions.
- `src/engine/QuestionGenerator/validator.ts` — validates each question before serving (unique answer, no ambiguous options, retry on failure).
- `src/engine/DifficultyEngine/masteryScore.ts` — tracks mastery per skill node; 3 correct streak unlocks the next node, 2 wrong streak drops a tier.
- `src/engine/RewardEngine/index.ts` — milestone checks (5/20/50/100 stars → sticker/background/celebration/certificate).
- `src/engine/ProgressEngine/index.ts` — daily mission generation, pillar progress, universe progress.

### Data layer — everything is JSON

`src/data/` is the single source of truth:

| File | Contents |
|------|----------|
| `characters.json` | 41 characters with metadata (colors, powers, weapons, `firstLetter`, `countables`, audio) |
| `templates.json` | 10 question templates mapped to pillars and skill nodes |
| `skillNodes.json` | 16 skill nodes across 5 pillars with prerequisite chains |
| `achievements.json` | 11 achievements with unlock conditions |
| `games.json` | 16 games (9 Tier 1 + 7 Tier 2, all live) with tier, pillar, and `locked` metadata |
| `contentPack.config.json` | `activeContentPack` switcher — change pack without touching code |

`GameSelection` respects each game's `locked` flag from `games.json` — there is no hardcoded tier lock.

### Adding a new game

1. Create `src/games/<pillar>/<GameName>.tsx` — export a component that accepts `{ universe?: string, onComplete: (stars: number) => void }`.
2. Add the import and a `case` to the switch in `src/games/index.tsx` (`GameRouter`), and an entry in `games.json`.
3. No other wiring needed — `GameplayScreen` routes through `GameRouter`.

Follow the house pattern used by every live game: `TOTAL_ROUNDS = 5`, a `buildRound()` that dedupes across the game's rounds, `GameHeader`, `CelebrationOverlay` whose `onDone` advances, correct-answer reveal (~2s) on wrong picks, `recordAnswer` + `recordResult` per answer, `playChar` on character taps, `useIdleNudge` on the options row, and `onComplete(stars)` when done. Guard small pools (Naruto has only 4 characters) by falling back to the full character list.

### Asset conventions

- Character images: `public/characters/private-pack/<universe>/<characterId>.webp` (512×512, transparent background, ~50–80 KB). Filename must match `character.id` exactly.
- Audio instructions: `public/sounds/instructions/<key>.mp3`
- Audio character names: `public/sounds/names/<characterId>.mp3`
- UI sounds: `public/sounds/ui/correct.mp3`, `wrong.mp3`, `celebration.mp3`, `click.mp3`
- All audio is optional — the `useAudio` hook falls back silently when files are absent.
- `CharacterCard` falls back to a gradient + first letter when the webp is missing.

### Storage & profile migration

`src/utils/db.ts` wraps IndexedDB via the `idb` library. The `Profile` object (defined in `src/types/index.ts`) is the root of all persisted state. `ProgressSummaryScreen` has a JSON export button for debugging.

**Any new `Profile` field must also be handled in `migrateProfile()` in `src/store/profileStore.ts`** — it upgrades existing IndexedDB profiles in place on `initProfiles` (spread-defaults for new fields, merges achievements/skillNodes by id). Never bump the DB version.

### Missions, achievements, and reward hooks

- **Daily missions** — `refreshMissionsIfNeeded` (ProgressEngine) runs in `initProfiles` and on a Home-screen day-rollover effect. All mission templates mean "N correct answers in pillar X". Progress increments inside `profileStore.recordAnswer`; completing a mission pays +2 stars.
- **Achievements** — `checkAchievements(profile)` (RewardEngine) covers all 4 condition types (stars, streak, games, mastered nodes). It is called from `recordAnswer`, `addStars`, and `recordGameCompleted` (invoked by `GameplayScreen` after `saveSession`). New unlocks land in transient `recentAchievements`, shown on the Reward screen.
- **Bonus stars** — `calculateBonusStars` is applied in `GameplayScreen`'s completion handler for perfect rounds.
- **Spaced repetition** — `suggestSkillNode` (DifficultyEngine) drives Home's "Today's Hero Training" card and GameSelection's "⭐ Recommended" badge.

### UX conventions

- **Buttons** — use the shared `Button` (`src/components/Button/index.tsx`): variants `primary`/`ghost`/`icon`, auto click-sound + haptic, ≥44px targets. Don't hand-roll `motion.button` for UI chrome.
- **Haptics** — `src/utils/haptics.ts`; wired centrally through `useAudio` (`playCorrect`/`playWrong`/`playCelebration`/`playClick`), gated by `parentSettings.hapticsEnabled`. Games get haptics for free by using `useAudio` — never call `navigator.vibrate` directly.
- **Fonts are bundled** — `@fontsource/fredoka-one` and `@fontsource/nunito` are imported in `main.tsx`. Never add a Google Fonts CDN import (offline-first violation). Use the `font-hero` class for playful headings.
- **Idle nudge** — `src/hooks/useIdleNudge.ts` wiggles options after ~6s of inactivity; wire it in tap-to-answer games.

### PWA

`vite-plugin-pwa` generates the service worker on `npm run build`. `public/manifest.json` is the PWA manifest. For Android APK generation, see the Capacitor steps in `PROGRESS.md`.

---

## Key design decisions

- **Parent PIN** is hardcoded as `1234` in `ParentSettingsScreen`.
- **Favorite characters** default to `['zenitsu', 'spiderman', 'flash']`; question generation weights them 70% favorites / 30% others via `weightedPickCharacters()` in `src/utils/helpers.ts`.
- **TypeScript path alias** `@/` resolves to `src/` (configured in `tsconfig.json` and `vite.config.ts`).

---

## Remaining work

All 16 games are live and the engine systems (missions, achievements, spaced repetition, haptics) are wired. What's left:

- **Assets** — Naruto and One Piece character webps are missing entirely (those universes show gradient placeholders); all audio files are optional and absent. See `PROGRESS.md` for exact file lists.
- **Real per-universe progress** — `UniverseSelection` uses a total-star proxy.
- **Capacitor Android APK** — steps in `PROGRESS.md`, blocked on real assets.
- **Optional** — migrate games onto `QuestionGenerator` templates (games currently build their own rounds).
