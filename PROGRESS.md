# AthiVerse — Build Progress

**Status:** Foundation Complete — Ready for `npm install` + asset drop-in  
**Last updated:** 2026-06-14

---

## ✅ What's Built

### Project Config
- `package.json` — all dependencies declared (React, Vite, Tailwind, Framer Motion, Howler, Zustand, idb)
- `vite.config.ts` — PWA plugin wired, path aliases configured
- `tailwind.config.js` — custom animations (wiggle, pop-in, float), brand colors
- `tsconfig.json` + `tsconfig.node.json`
- `postcss.config.js`
- `index.html` — mobile viewport locked, no zoom

### Data Layer (src/data/)
- `characters.json` — **41 characters** fully populated with metadata (colors, powers, weapons, attributes, firstLetter, audio)
- `skillNodes.json` — 16 skill nodes across all 5 pillars, prerequisites wired
- `templates.json` — 10 question templates
- `achievements.json` — 11 achievements with unlock conditions
- `games.json` — 15 games (8 Tier 1 + 7 Tier 2) with metadata
- `contentPack.config.json` — active pack switcher

### Types (src/types/)
- `index.ts` — full TypeScript types for Character, Profile, Question, SkillNode, GameSession, NavState, etc.
- `howler.d.ts` — Howler.js type declarations (replaces @types/howler)

### Storage & State
- `src/utils/db.ts` — IndexedDB via `idb`, Profile + Session CRUD, export function
- `src/utils/helpers.ts` — shuffle, pickRandom, weightedPickCharacters (70/30 favorites), uid, colorToHex
- `src/utils/audio.ts` — Howler wrapper, silent fallback when files missing
- `src/store/profileStore.ts` — Zustand store: profile init, star tracking, skill progression/regression, achievements
- `src/store/gameStore.ts` — Navigation state, session lifecycle, pending stars

### Game Engine
- `src/engine/QuestionGenerator/index.ts` — Procedural question generation, 8 template builders, weighted character selection
- `src/engine/QuestionGenerator/validator.ts` — Pre-serve validation (unique answer, no ambiguity, retry logic)
- `src/engine/DifficultyEngine/masteryScore.ts` — Mastery scoring, progression (3 streak → unlock next), regression (2 wrong → drop tier), spaced repetition suggester
- `src/engine/RewardEngine/index.ts` — Milestone checks, bonus stars, celebration levels
- `src/engine/ProgressEngine/index.ts` — Daily mission generation, pillar progress, universe progress

### Components
- `CharacterCard` — Real image + colored placeholder fallback (gradient with first letter), correct/wrong states
- `StarCounter` — Animated star counter with delta pop-up
- `CelebrationOverlay` — Particle burst + big message animation
- `ProgressBar` — Animated fill bar
- `GameHeader` — Back button + progress bar + star counter

### Screens (all wired to nav state)
- `Splash` — Animated logo, auto-advances after 2.2s
- `Home` — Profile greeting, streak banner, play button, pillar progress grid, daily missions
- `UniverseSelection` — 5 universes + "All Heroes" option, lock state
- `GameSelection` — Tier 1/2 grid with pillar color coding
- `Gameplay` — Routes to game component, handles session start/end
- `Reward` — Stars earned, accuracy, milestone unlocks, confetti
- `ProgressSummary` — Full skill tree, achievements, pillar bars, JSON export
- `ParentSettings` — PIN-locked (1234), sound/difficulty/universe toggles, session limit slider

### Games — Tier 1 (all 8 complete)
| Game | File | Status |
|------|------|--------|
| Hero Counting | `src/games/numbers/HeroCounting.tsx` | ✅ |
| Missing Number | `src/games/numbers/MissingNumber.tsx` | ✅ |
| Letter Match | `src/games/alphabets/CapitalToSmallMatch.tsx` | ✅ |
| Color Sort | `src/games/colors/ColorSorting.tsx` | ✅ |
| Memory Flip | `src/games/memory/MemoryFlipCards.tsx` | ✅ |
| Who Am I? | `src/games/logic/WhoAmI.tsx` | ✅ |
| Odd One Out | `src/games/logic/FindTheOddOne.tsx` | ✅ |
| Hero Sort | `src/games/logic/SortByAttribute.tsx` | ✅ |

### Games — Tier 2 (scaffolded, shows "Coming Soon")
Tap & Count, Number Hunt, ABC Order, Remember Order, Who Vanished?, Pattern Builder, Compare & Choose

### PWA
- `public/manifest.json` — standalone display, portrait, themed
- `vite.config.ts` — vite-plugin-pwa wired with workbox offline caching

---

## 🔴 Your Action Items

### 1. Run `npm install` (First time only)
```bash
cd AthiVerse
npm install
npm run dev
```
App will open at `http://localhost:5173`

---

### 2. Character Images (Required for visuals)
**Without images:** App fully works — shows colored placeholder cards (character's first letter on gradient background).  
**With images:** Drop WebP files into `public/characters/private-pack/<universe>/`

Format requirements:
- WebP, transparent background, 512×512 px, ~50–80 KB
- Filename = character ID (lowercase, no spaces)

**File list to prepare:**

**Marvel** → `public/characters/private-pack/marvel/`
```
spiderman.webp    ironman.webp    captainamerica.webp
thor.webp         wolverine.webp  hulk.webp
blackpanther.webp deadpool.webp
```

**DC** → `public/characters/private-pack/dc/`
```
superman.webp     batman.webp      flash.webp
wonderwoman.webp  greenlantern.webp aquaman.webp
```

**Naruto** → `public/characters/private-pack/naruto/`
```
naruto.webp  sasuke.webp  kakashi.webp  minato.webp
```

**One Piece** → `public/characters/private-pack/onepiece/`
```
luffy.webp   zoro.webp   nami.webp    usopp.webp
sanji.webp   chopper.webp robin.webp  franky.webp
brook.webp   jinbe.webp
```

**Demon Slayer** → `public/characters/private-pack/demonslayer/`
```
tanjiro.webp  nezuko.webp   zenitsu.webp  inosuke.webp
giyu.webp     rengoku.webp  tengen.webp   muichiro.webp
mitsuri.webp  shinobu.webp  obanai.webp   gyomei.webp
sanemi.webp
```

---

### 3. Audio Files (Optional — app is silent but fully functional without them)

**Instructions** → `public/sounds/instructions/`
```
find.mp3   count.mp3  match.mp3
tap.mp3    sort.mp3   whoareyou.mp3
```

**Character names** → `public/sounds/names/`
One MP3 per character, named by ID (e.g. `spiderman.mp3`, `naruto.mp3`).  
41 files total.

**UI sounds** → `public/sounds/ui/`
```
correct.mp3   wrong.mp3   celebration.mp3   click.mp3
```

---

### 4. App Icons (Optional)
Replace placeholder icons at:
- `public/icons/icon-192.png` — 192×192 px
- `public/icons/icon-512.png` — 512×512 px

---

### 5. PWA Install (Android)
After `npm run build`:
```bash
npm run preview
```
Open in Chrome on Android → "Add to Home Screen" → installs as PWA.

For APK: Install Capacitor after assets are ready:
```bash
npm install @capacitor/core @capacitor/cli @capacitor/android
npx cap init AthiVerse com.athiverse.app
npx cap add android
npm run build
npx cap copy
npx cap open android
```

---

## 🚧 Remaining for Claude Code

### Tier 2 Games (7 games)
Files need to be created in:
- `src/games/numbers/TapAndCount.tsx`
- `src/games/numbers/NumberHunt.tsx`
- `src/games/alphabets/AlphabetSequence.tsx`
- `src/games/memory/RememberTheOrder.tsx`
- `src/games/memory/CharacterDisappears.tsx`
- `src/games/logic/PatternBuilder.tsx`
- `src/games/logic/CompareAndChoose.tsx`

Wire each into `src/games/index.tsx` (the switch statement already has placeholders).

### Daily Missions Auto-Generation
In `src/store/profileStore.ts`, call `refreshMissionsIfNeeded()` during `initProfiles()` and save updated missions. Currently missions array starts empty.

### Spaced Repetition in Question Generator
Use `suggestSkillNode()` from `src/engine/DifficultyEngine/masteryScore.ts` to bias which skill node gets practiced in each session.

### Universe Progress Tracking
Real progress per universe (currently uses total star proxy). Add per-universe session tracking if needed.

### Capacitor / Android Build
See Step 5 above. Requires real assets first.

---

## 📁 File Tree Summary

```
AthiVerse/
├── index.html
├── package.json
├── vite.config.ts
├── tailwind.config.js
├── tsconfig.json
├── PROGRESS.md
├── PRD.md
├── public/
│   ├── manifest.json
│   ├── icons/               ← Replace with real icons
│   └── characters/
│       └── private-pack/
│           ├── marvel/      ← Drop webp files here
│           ├── dc/
│           ├── naruto/
│           ├── onepiece/
│           └── demonslayer/
└── src/
    ├── main.tsx
    ├── App.tsx
    ├── index.css
    ├── types/
    │   ├── index.ts
    │   └── howler.d.ts
    ├── data/
    │   ├── characters.json
    │   ├── skillNodes.json
    │   ├── templates.json
    │   ├── achievements.json
    │   ├── games.json
    │   └── contentPack.config.json
    ├── utils/
    │   ├── db.ts
    │   ├── helpers.ts
    │   └── audio.ts
    ├── store/
    │   ├── profileStore.ts
    │   └── gameStore.ts
    ├── engine/
    │   ├── QuestionGenerator/
    │   │   ├── index.ts
    │   │   └── validator.ts
    │   ├── DifficultyEngine/
    │   │   └── masteryScore.ts
    │   ├── RewardEngine/
    │   │   └── index.ts
    │   └── ProgressEngine/
    │       └── index.ts
    ├── components/
    │   ├── CharacterCard/
    │   ├── StarCounter/
    │   ├── CelebrationOverlay/
    │   ├── ProgressBar/
    │   └── GameHeader/
    ├── hooks/
    │   └── useAudio.ts
    ├── games/
    │   ├── index.tsx          ← Game router
    │   ├── numbers/           ← HeroCounting, MissingNumber
    │   ├── alphabets/         ← CapitalToSmallMatch
    │   ├── colors/            ← ColorSorting
    │   ├── memory/            ← MemoryFlipCards
    │   └── logic/             ← WhoAmI, FindTheOddOne, SortByAttribute
    └── screens/
        ├── Splash/
        ├── Home/
        ├── UniverseSelection/
        ├── GameSelection/
        ├── Gameplay/
        ├── Reward/
        ├── ProgressSummary/
        └── ParentSettings/
```

---

## 🔑 Key Design Decisions (for Claude Code context)

- **No React Router** — navigation via Zustand `nav` state (`useGameStore`)
- **Placeholder images** — `CharacterCard` auto-falls back to gradient + letter when webp missing
- **Audio** — completely silent until you drop MP3 files in; no errors thrown
- **Parent PIN** — hardcoded `1234`, change in `ParentSettingsScreen`
- **Favorite characters** — default: `['zenitsu', 'spiderman', 'flash']`, 70/30 weighting in question gen
- **Offline** — IndexedDB via `idb`, all data is local, no network calls after build
- **PWA** — vite-plugin-pwa auto-generates service worker on `npm run build`
