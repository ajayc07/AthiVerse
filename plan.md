AthiVerse Full Enhancement Plan

Context

AthiVerse (offline-first React 18 + TS + Vite + Tailwind + Framer Motion + Zustand + IndexedDB PWA for Athiran, age 3) has 9 live Tier 1 games, 7 "Coming Soon" Tier 2 stubs, and several engine systems that were built but never wired in. The user wants the app fully effective and advanced for both parent and kid: error-free games, no boredom, richer interactivity, attractive UI/animations — then PROGRESS.md updated so work can resume later.

Exploration found: 7 concrete bugs in live games (including a numbers-progression dead-end and a blank-screen soft-lock), daily missions that always show empty, 6 of 11 achievements that can never unlock, no haptics, a playful display font configured but never applied, custom Tailwind keyframes defined but unused, and celebration sound never played anywhere.

Ordering keeps the app buildable/playable after every phase: bug fixes → state/engine wiring → shared UX foundation → 7 new games → docs.

---
Phase 1 — Bug fixes in the 9 live games

1. Numbers progression dead-end — src/games/numbers/HeroCounting.tsx and MissingNumber.tsx gate higher tiers on count_1_15 mastery but always record count_1_10. Fix: derive skill node per round from the number in play (>15 → count_1_20, >10 → count_1_15, else count_1_10) and use it in both recordAnswer and recordResult. Also reset HeroCounting's startTime per round (currently set once at mount → wrong timeMs).
2. WhoAmI drops clue #1 — src/games/logic/WhoAmI.tsx:133: change split regex /[.!]/ → /[.!?]/ so "Who am I?" separates from the first clue.
3. ColorSorting blank screen — src/games/colors/ColorSorting.tsx:54: initial round lacks the fallback advance() has. Fix: useState(() => buildRound(favorites, universe) ?? buildRound(favorites)).
4. MissingNumber distractors — MissingNumber.tsx:25-29: also exclude numbers already visible in the sequence.
5. Correct-answer reveal on wrong pick (HeroCounting, MissingNumber, CapitalToSmallMatch, ColorSorting): adopt the WhoAmI/FindTheOddOne pattern — after any selection, highlight the correct option green with a pulse; extend wrong-answer timeout to ~2000ms so the child sees it. ColorSorting: pass correct to the right CharacterCard.
6. FindTheOddOne badges spoil the answer — src/games/logic/FindTheOddOne.tsx:190-197: show universe badges only after a selection (teaching moment, not spoiler). Once logic_patterns_1 mastery ≥ 50, neutralize border color hints too.
7. Minor: SortByAttribute TOTAL_ROUNDS 4→5 and cycle a shuffled attribute list per game (sword covers 20/41 chars and otherwise dominates); TraceNumbers + CapitalToSmallMatch dedupe rounds (pre-shuffle 5 distinct digits/letters per game); CapitalToSmallMatch records small_letters once that node is unlocked (unblocks the alphabet chain); MemoryFlipCards logs mismatches via recordResult too and uses a unique attempt counter for questionId.

Phase 2 — Wire dormant systems (state layer)

Center of gravity: src/store/profileStore.ts.

1. Consolidate onto engines (removes drift-prone duplication):
  - recordAnswer → use computeMasteryUpdate from src/engine/DifficultyEngine/masteryScore.ts (identical behavior; removes the duplicated early-return branch at lines 134-155).
  - addStars → delete dead milestones/achievementMap arrays (186-187); use a new shared checkAchievements helper (below).
2. Profile schema + migration — add gamesCompleted: number and parentSettings.hapticsEnabled: boolean to Profile (src/types/index.ts). New migrateProfile() applied to every profile in initProfiles: spread-defaults for new fields, merge achievements/skillNodes by id preserving unlocked state, dailyMissions ?? []. Existing IndexedDB profiles upgrade in place; no DB version bump.
3. Daily missions —
  - Normalize MISSION_TEMPLATES in src/engine/ProgressEngine/index.ts to one semantic: N correct answers in pillar X (+ one "any pillar" template).
  - Call refreshMissionsIfNeeded in initProfiles and from a Home-screen effect (day rollover).
  - Increment mission progress inside recordAnswer on correct (map skillNode → pillar); mark complete at target; +2 bonus stars on mission completion.
  - Home UI (src/screens/Home/index.tsx:105-139) already renders missions — just add a completion pulse.
4. Achievements — full coverage — new checkAchievements(profile) in src/engine/RewardEngine/index.ts handling all 4 conditions (stars, streak, games, mastery ≥ MASTERY_THRESHOLD node count). Hooks: recordAnswer, addStars, and a new recordGameCompleted() action (increments gamesCompleted) called from src/screens/Gameplay/index.tsx after saveSession. Transient recentAchievements in the store, rendered by the Reward screen, cleared on unmount.
5. Spaced repetition (light touch) — suggestSkillNode from DifficultyEngine: Home gets a "Today's Hero Training" one-tap card (maps suggested node → an unlocked game, starts session directly); GameSelection shows a "⭐ Recommended" badge on matching games. No QuestionGenerator migration for existing games.
6. Perfect-round bonus — apply calculateBonusStars in GameplayScreen's completion handler so flawless games feel special.

Phase 3 — Shared UX foundation + UI/animation overhaul

1. Haptics — new src/utils/haptics.ts (tap/success/error/celebration via guarded navigator.vibrate). Wire centrally in src/hooks/useAudio.ts (playCorrect/playWrong/playCelebration) gated by hapticsEnabled (independent of sound), and haptics.tap() in playClick. Toggle row in ParentSettings. Every game inherits with zero per-game edits.
2. Shared Button — new src/components/Button/index.tsx (motion.button, tap-scale, auto click sound+haptic, variants primary/ghost/icon, ≥44px). Replace ad-hoc back buttons (GameHeader, GameSelection, UniverseSelection, ProgressSummary, ParentSettings), Home gear, Reward buttons, SortByAttribute "Check!", stub "Go Back".
3. Offline fonts + font-hero — replace the Google Fonts @import in src/index.css (an offline-first violation — why Fredoka One never renders offline) with @fontsource/fredoka-one + @fontsource/nunito npm packages imported in main.tsx. Apply font-hero to Splash title, Home greeting + Play button, GameHeader titles, Reward headline, game prompts, big number/letter options.
4. Idle/attract motion — use the already-defined-but-unused Tailwind keyframes: animate-float (Play button emoji, suggestion card), animate-bounce-slow (Splash 🦸), animate-wiggle (hint button, badges), animate-pop-in (mission rows, reward stats). New src/hooks/useIdleNudge.ts: after ~6s of no interaction in a round, wiggle the options row once — wired into the tap-to-answer games. All CSS transform-only (cheap on low-end Android).
5. Celebration richness — CelebrationOverlay: play celebration sound + haptic on show; regenerate particles per show (currently frozen after first burst). StarCounter: self-driven "+1 ⭐" float on count increase (the built-but-dead showDelta), add missing relative positioning. RewardScreen: celebration sound + haptic on mount, star count-up, favorite-character cameo ("Great job!"), render recentAchievements cards, confetti 20→30.
6. Per-screen transitions — src/App.tsx: variants map per screen (gameplay = zoom-in, reward = slide-up, home = fade, settings = slide-up; others keep x-slide). Still AnimatePresence mode="wait", 0.2–0.25s.

Phase 4 — Build all 7 Tier 2 games

Each: one new file + import/case in src/games/index.tsx. All follow the house pattern (TOTAL_ROUNDS=5, buildRound() with round dedup, GameHeader, CelebrationOverlay→advance, wrong-answer reveal, recordAnswer+recordResult, playChar on character taps, useIdleNudge, onComplete(stars)), with pool-size guards for small universes (Naruto = 4 chars). Extract HeroCounting's adjacent-distractor builder to buildAdjacentOptions(correct, max) in src/utils/helpers.ts and reuse.

1. numbers/TapAndCount.tsx 👆 — tap each scattered hero (greys out ✅, giant center number counts up with playChar), then pick the total from 3 options. N: 3–5 base → 6–9 (count_1_10≥80) → 10–12 (count_1_15≥80). Records tier node by N.
2. numbers/NumberHunt.tsx 🔭 — 3×3 grid of number badges, "Find number 7!"; wrong tiles shake, correct pulses. Range 1–10 → 1–15 → 1–20 with tricky distractors (12/21, neighbors) at top tier. Records tier node by target.
3. alphabets/AlphabetSequence.tsx 🔡 — MissingNumber layout with letters: A B ? D, 3 options, distractors near-but-not-visible. Base runs within A–F; anywhere in A–Z at alphabet_sequence mastery ≥ 40. Records alphabet_sequence.
4. memory/RememberTheOrder.tsx 📋 — Simon-style: cards light up in sequence (glow + playChar), child repeats the order. Length 2 → 3 → 4 by memory_sequence_* unlocks, capped by ageConfig.maxSequenceMemoryLength. Wrong: replay sequence as reveal. Records memory_sequence_{len}.
5. memory/CharacterDisappears.tsx 👻 — show 3–4 heroes ~3s with countdown ring, flip face-down, one vanishes, rest flip back; pick who vanished from 3 options. 4 shown at memory_sequence_3 ≥ 50; memorize time shrinks with mastery. Records memory_sequence_2/3.
6. logic/PatternBuilder.tsx 🔮 — character pattern row with pulsing ? slot (A B A B A ?), 2–3 options. AB patterns → logic_patterns_1; AAB/ABC → logic_patterns_2 once unlocked or logic_patterns_1 ≥ 80.
7. logic/CompareAndChoose.tsx ⚖️ — two XL character cards, data-driven question where the pair differs: "Who can fly?"/"Who uses a sword?"/"Who can swim?"; add "Who is faster?" (speed rank) at logic_deduction ≥ 40. Records logic_deduction. Reveal: correct card pulses green with attribute emoji.

Unlock: src/data/games.json → all 7 "locked": false, "minAge": 3 (each has an age-3 base tier). Critical: src/screens/GameSelection/index.tsx:68 hardcodes locked on every tier-2 card — change to locked={game.locked} and retitle the section "🌟 Tier 2 — New Adventures". Keep the Coming-Soon default branch in GameRouter as a safety net.

Phase 5 — Documentation refresh

- PROGRESS.md: new status (16 games all live: 9 Tier 1 + 7 Tier 2), per-game table, wired systems (missions, achievements, spaced repetition, haptics, Button, offline fonts, profile migration), Profile schema additions, remaining work (real character webp/audio assets, Capacitor APK, real per-universe progress, optional QuestionGenerator adoption).
- CLAUDE.md: fix stale counts (16 games / 9+7), replace "Remaining work" section, document migrateProfile requirement for Profile changes, achievement/mission hook locations, haptics + Button conventions, GameSelection now respecting games.json.locked.