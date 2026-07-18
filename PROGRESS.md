# AthiVerse — Build Progress

**Status:** All 16 games live (9 Tier 1 + 7 Tier 2), engine systems fully wired  
**Last updated:** 2026-07-18

---

## ✅ What's Built

### Games — all 16 live

| Game | File | Tier | Pillar |
|------|------|------|--------|
| Hero Counting | `src/games/numbers/HeroCounting.tsx` | 1 | numbers |
| Missing Number | `src/games/numbers/MissingNumber.tsx` | 1 | numbers |
| Trace Numbers | `src/games/numbers/TraceNumbers.tsx` | 1 | numbers |
| Letter Match | `src/games/alphabets/CapitalToSmallMatch.tsx` | 1 | alphabets |
| Color Sort | `src/games/colors/ColorSorting.tsx` | 1 | colors |
| Memory Flip | `src/games/memory/MemoryFlipCards.tsx` | 1 | memory |
| Who Am I? | `src/games/logic/WhoAmI.tsx` | 1 | logic |
| Odd One Out | `src/games/logic/FindTheOddOne.tsx` | 1 | logic |
| Hero Sort | `src/games/logic/SortByAttribute.tsx` | 1 | logic |
| Tap & Count | `src/games/numbers/TapAndCount.tsx` | 2 | numbers |
| Number Hunt | `src/games/numbers/NumberHunt.tsx` | 2 | numbers |
| ABC Order | `src/games/alphabets/AlphabetSequence.tsx` | 2 | alphabets |
| Remember Order | `src/games/memory/RememberTheOrder.tsx` | 2 | memory |
| Who Vanished? | `src/games/memory/CharacterDisappears.tsx` | 2 | memory |
| Pattern Builder | `src/games/logic/PatternBuilder.tsx` | 2 | logic |
| Compare & Choose | `src/games/logic/CompareAndChoose.tsx` | 2 | logic |

All games follow the house pattern: `TOTAL_ROUNDS = 5`, `buildRound()` with round dedup, `GameHeader`, `CelebrationOverlay → advance`, correct-answer reveal on wrong picks (~2s), `recordAnswer` + `recordResult`, `playChar` on character taps, `useIdleNudge` wiggle after ~6s idle, `onComplete(stars)`. Difficulty tiers derive the skill node from the content in play (e.g. counting past 15 records `count_1_20`).

### Wired engine systems

- **Daily missions** — `refreshMissionsIfNeeded` runs in `initProfiles` and on Home-screen day rollover; templates are all "N correct answers in pillar X" (+ one any-pillar); progress increments inside `recordAnswer`; completion pays +2 bonus stars and pulses on Home.
- **Achievements (full coverage)** — `checkAchievements(profile)` in `src/engine/RewardEngine/index.ts` handles all 4 condition types (stars, streak, games, mastered-node count). Hooked into `recordAnswer`, `addStars`, and `recordGameCompleted` (called from `GameplayScreen` after `saveSession`). Newly unlocked achievements land in transient `recentAchievements`, rendered on the Reward screen.
- **Spaced repetition** — `suggestSkillNode` drives the "Today's Hero Training" one-tap card on Home and the "⭐ Recommended" badge in GameSelection.
- **Perfect-round bonus** — `calculateBonusStars` applied in `GameplayScreen`'s completion handler.
- **Mastery consolidation** — `recordAnswer` delegates to `computeMasteryUpdate` from `DifficultyEngine` (no duplicated logic in the store).

### Profile schema & migration

`Profile` gained `gamesCompleted: number` and `parentSettings.hapticsEnabled: boolean`. `migrateProfile()` in `src/store/profileStore.ts` upgrades every stored profile on `initProfiles` (spread-defaults new fields, merges achievements/skillNodes by id preserving unlocked state). **Any future `Profile` field must be added to `migrateProfile` too** — existing IndexedDB profiles upgrade in place, no DB version bump.

### Shared UX foundation

- **Haptics** — `src/utils/haptics.ts` (guarded `navigator.vibrate`), wired centrally through `useAudio` (`playCorrect`/`playWrong`/`playCelebration`/`playClick`), gated by `parentSettings.hapticsEnabled`, toggle in ParentSettings. Games inherit it for free.
- **Shared Button** — `src/components/Button/index.tsx` (tap-scale, auto click sound + haptic, `primary`/`ghost`/`icon` variants, ≥44px targets). Used for all back buttons, Home gear, Reward buttons, etc.
- **Offline fonts** — `@fontsource/fredoka-one` + `@fontsource/nunito` imported in `main.tsx` (no Google Fonts CDN); `font-hero` applied to titles, prompts, and big options.
- **Idle nudge** — `src/hooks/useIdleNudge.ts`: wiggles the options row after ~6s of inactivity.
- **Celebrations** — CelebrationOverlay plays sound + haptic and regenerates particles per show; StarCounter floats "+1 ⭐" on increase; Reward screen has star count-up, character cameo, achievement cards.
- **Per-screen transitions** — `App.tsx` variants map (gameplay zoom, reward/settings slide-up, home fade).

### Everything from the foundation build

Data layer (41 characters, 16 skill nodes, 10 templates, 11 achievements, 16 games in `games.json` — all `"locked": false`), QuestionGenerator + validator, DifficultyEngine, IndexedDB storage, PWA service worker. `GameSelection` now respects `games.json` `locked` per game (no hardcoded Tier 2 lock).

---

## 🔴 Remaining Action Items (assets)

### Character images — 27 of 41 present
`public/characters/private-pack/` has all Marvel (8), DC (6), and Demon Slayer (13) webps.
**Missing:** all Naruto (`naruto`, `sasuke`, `kakashi`, `minato`) and all One Piece (`luffy`, `zoro`, `nami`, `usopp`, `sanji`, `chopper`, `robin`, `franky`, `brook`, `jinbe`). Those universes render gradient placeholders — Odd One Out and Pattern Builder look much better with real images.
Format: WebP, transparent background, 512×512, ~50–80 KB, filename = character id.

### Audio files (optional — app is silent but fully functional without)
- `public/sounds/ui/` — `correct.mp3`, `wrong.mp3`, `celebration.mp3`, `click.mp3`
- `public/sounds/names/<characterId>.mp3` — 41 files
- `public/sounds/instructions/` — `find.mp3`, `count.mp3`, `match.mp3`, `tap.mp3`, `sort.mp3`, `whoareyou.mp3`

### App icons (optional)
Replace placeholders at `public/icons/icon-192.png` and `icon-512.png`.

---

## 🚧 Remaining Development Work

- **Real per-universe progress** — `UniverseSelection` still uses a total-star proxy; add per-universe session tracking if wanted.
- **Capacitor / Android APK** — after real assets:
  ```bash
  npm install @capacitor/core @capacitor/cli @capacitor/android
  npx cap init AthiVerse com.athiverse.app
  npx cap add android
  npm run build && npx cap copy && npx cap open android
  ```
- **Optional QuestionGenerator adoption** — games build their own rounds; migrating them onto `QuestionGenerator` templates would centralize generation but isn't required.

---

## 🔑 Key Design Decisions

- **No React Router** — navigation via Zustand `nav` state (`useGameStore`)
- **Placeholder images** — `CharacterCard` falls back to gradient + letter when a webp is missing; failure is tracked per image URL so reused card instances retry when the character changes
- **Audio & haptics** — silent/no-op until assets exist or device supports vibration; independently toggleable in ParentSettings
- **Parent PIN** — hardcoded `1234` in `ParentSettingsScreen`
- **Favorite characters** — default `['zenitsu', 'spiderman', 'flash']`, 70/30 weighting via `weightedPickCharacters`
- **Offline-first** — IndexedDB via `idb`, bundled fonts, no network calls after build; PWA service worker generated on `npm run build`
- **Profile migrations** — schema changes go through `migrateProfile` in `profileStore.ts`, never a DB version bump
