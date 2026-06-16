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
| `games.json` | 15 games (8 Tier 1 live, 7 Tier 2 stubs) with tier and pillar metadata |
| `contentPack.config.json` | `activeContentPack` switcher — change pack without touching code |

### Adding a new Tier 2 game

1. Create `src/games/<pillar>/<GameName>.tsx` — export a component that accepts `{ universe?: string, onComplete: (stars: number) => void }`.
2. Add the import and a `case` to the switch in `src/games/index.tsx` (`GameRouter`).
3. No other wiring needed — `GameplayScreen` routes through `GameRouter`.

### Asset conventions

- Character images: `public/characters/private-pack/<universe>/<characterId>.webp` (512×512, transparent background, ~50–80 KB). Filename must match `character.id` exactly.
- Audio instructions: `public/sounds/instructions/<key>.mp3`
- Audio character names: `public/sounds/names/<characterId>.mp3`
- UI sounds: `public/sounds/ui/correct.mp3`, `wrong.mp3`, `celebration.mp3`, `click.mp3`
- All audio is optional — the `useAudio` hook falls back silently when files are absent.
- `CharacterCard` falls back to a gradient + first letter when the webp is missing.

### Storage

`src/utils/db.ts` wraps IndexedDB via the `idb` library. The `Profile` object (defined in `src/types/index.ts`) is the root of all persisted state. `ProgressSummaryScreen` has a JSON export button for debugging.

### PWA

`vite-plugin-pwa` generates the service worker on `npm run build`. `public/manifest.json` is the PWA manifest. For Android APK generation, see the Capacitor steps in `PROGRESS.md`.

---

## Key design decisions

- **Parent PIN** is hardcoded as `1234` in `ParentSettingsScreen`.
- **Favorite characters** default to `['zenitsu', 'spiderman', 'flash']`; question generation weights them 70% favorites / 30% others via `weightedPickCharacters()` in `src/utils/helpers.ts`.
- **TypeScript path alias** `@/` resolves to `src/` (configured in `tsconfig.json` and `vite.config.ts`).

---

## Remaining work (Tier 2 games)

Files to create — wire each into `src/games/index.tsx`:

- `src/games/numbers/TapAndCount.tsx`
- `src/games/numbers/NumberHunt.tsx`
- `src/games/alphabets/AlphabetSequence.tsx`
- `src/games/memory/RememberTheOrder.tsx`
- `src/games/memory/CharacterDisappears.tsx`
- `src/games/logic/PatternBuilder.tsx`
- `src/games/logic/CompareAndChoose.tsx`

Daily missions auto-generation (`refreshMissionsIfNeeded`) and spaced repetition integration (`suggestSkillNode` from `DifficultyEngine`) are also pending — see `PROGRESS.md` for details.
