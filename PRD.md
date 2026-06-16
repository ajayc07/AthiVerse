# AthiVerse
### Athiran's Hero Learning Universe
#### Product Requirements Document (PRD) – Version 3.0

---

# Project Information

**Project Name:** AthiVerse
**Subtitle:** Athiran's Hero Learning Universe
**Project Type:** Private, Offline-First Educational Game Engine
**Primary User:** Athiran (3 Years Old)
**Long-Term Vision:** Transform into a reusable educational platform with original characters and public release capability.

---

# Vision Statement

AthiVerse is an educational game engine that uses a child's existing interests in superheroes and anime characters to accelerate learning through play, curiosity, repetition, and rewards.

The application should:
- Feel like a game, never like school.
- Encourage curiosity and exploration.
- Adapt to the child's learning pace.
- Generate endless content without repetitive questions.
- Work completely offline.
- Be reusable with different character packs.

---

# Core Principles

## Learning Through Interests

Children naturally pay attention to subjects they love.

AthiVerse uses:
- Superheroes
- Anime characters
- Stories
- Visual associations
- Rewards

to teach:
- Numbers
- Alphabets
- Colors
- Memory
- Logic

---

## Design Principles

- Offline First
- Data Driven
- Modular
- Reusable
- Procedurally Generated
- No Hardcoded Questions
- No Hardcoded Characters
- Single Source of Truth
- Child-Friendly UX
- Scalable Architecture

---

# Child Profile

**Name:** Athiran
**Age:** 3 Years

---

# Current Skill Assessment

## Numbers

Current:
- Counts comfortably till 10
- Can verbally say till 12

Goals:
- Count till 20
- Recognize numbers till 20
- Quantity understanding
- Missing number understanding
- Greater than / Less than
- Number sequencing

---

## Alphabets

Current:
- Recognizes Capital Letters (A-Z)

Goals:
- Recognize Small Letters (a-z)
- Match capital and small letters
- Letter sequencing
- Letter identification
- Letter association

---

## Colors

Current:
- Good color recognition

Goals:
- Reinforce colors
- Categorization
- Identify multiple objects with same color
- Differentiate shades later
- Color memory

---

## Logic

Current:
- Early stage

Goals:
- Pattern recognition
- Classification
- Cause and effect
- Sequencing
- Comparisons
- Deduction
- Problem solving

---

## Memory

Goals:
- Visual memory
- Working memory
- Sequential memory
- Attention span
- Recall speed
- Concentration

---

# Learning Pillars

1. Numbers
2. Alphabets
3. Colors
4. Memory
5. Logic

---

# Technology Stack

## Frontend
- React
- TypeScript
- Vite
- TailwindCSS

## Mobile Strategy
- PWA (Primary)
- Capacitor
- Android APK Generation

Single Codebase:
```
React App → PWA → Android APK
```

## Storage
- IndexedDB

## Animations
- Framer Motion

## Audio
- Howler.js

## State Management
- Preferred: Zustand
- Alternative: Context API

---

# Architecture

```
React UI
    ↓
Game Engine
    ↓
Question Generator
    ↓
Question Validator
    ↓
Character Database
    ↓
Difficulty Engine
    ↓
Mastery Score System
    ↓
Reward Engine
    ↓
Progress Engine
    ↓
IndexedDB
    ↓
Profile Layer
```

---

# Folder Structure

```
src/
assets/
    characters/
        private-pack/
            marvel/
            dc/
            naruto/
            onepiece/
            demonslayer/
        public-pack/
    sounds/
        instructions/
        names/
    backgrounds/
    rewards/
    animations/
data/
    characters.json
    templates.json
    skillNodes.json
    achievements.json
    contentPack.config.json
engine/
    QuestionGenerator/
        validator.ts
    DifficultyEngine/
        masteryScore.ts
    RewardEngine/
    ProgressEngine/
        profileManager.ts
games/
    numbers/
    alphabets/
    colors/
    memory/
    logic/
screens/
    Home/
    UniverseSelection/
    GameSelection/
    ProgressSummary/
    Rewards/
    ParentSettings/
components/
hooks/
utils/
```

---

# Character Universes

## Demon Slayer

### Main
- Tanjiro
- Nezuko
- Zenitsu
- Inosuke

### Hashira
- Giyu Tomioka
- Kyojuro Rengoku
- Tengen Uzui
- Muichiro Tokito
- Mitsuri Kanroji
- Shinobu Kocho
- Obanai Iguro
- Gyomei Himejima
- Sanemi Shinazugawa

## Naruto
- Naruto
- Sasuke
- Kakashi
- Minato

## One Piece (Straw Hats)
- Luffy
- Zoro
- Nami
- Usopp
- Sanji
- Chopper
- Robin
- Franky
- Brook
- Jinbe

## DC
- Superman
- Batman
- Flash
- Wonder Woman
- Green Lantern
- Aquaman

## Marvel
- Spider-Man
- Iron Man
- Captain America
- Thor
- Wolverine
- Hulk
- Black Panther
- Deadpool

---

# Character Metadata Schema

```json
{
  "id": "",
  "name": "",
  "universe": "",
  "image": "",
  "colors": [],
  "powers": [],
  "weapons": [],
  "speed": "",
  "canFly": false,
  "canSwim": false,
  "canUseSword": false,
  "countables": [],
  "tags": [],
  "audio": {
    "name": ""
  }
}
```

Rules:
- No hardcoded character logic.
- Games consume metadata only.
- Character IDs drive all rendering.

---

# Content Pack Strategy

## Private Pack
Contains: Marvel, DC, Naruto, Demon Slayer, One Piece
Purpose: Athiran's personal learning environment.

## Public Pack
Contains: Original characters, original artwork
Purpose: Future public release.

## Active Pack Config

```json
{
  "activeContentPack": "private-pack"
}
```

Changing packs should not require code changes.

---

# Asset Strategy

## Character Images
- Format: WebP
- Background: Transparent
- Size: 512×512 px
- Quality: ~80%
- Target File Size: 50–80 KB

## Icons
- 128×128 px

## Backgrounds
- 1920×1080 px

## Naming Convention
```
spiderman.webp
batman.webp
naruto.webp
zenitsu.webp
rengoku.webp
luffy.webp
```
Rules: lowercase, no spaces, use IDs only.

---

# Audio Strategy

## Instruction Layer
Examples: Find, Count, Match, Tap, Sort
Path: `assets/sounds/instructions/`

## Character Name Layer
Examples: `spiderman.mp3`, `naruto.mp3`, `zenitsu.mp3`
Path: `assets/sounds/names/`

## Playback Composition
```
instruction.mp3 + character.mp3
```
Examples: "Find" + "Spider-Man" / "Count" + "Swords"

---

# Learning Skill Tree

```
count_1_10
count_1_15
count_1_20
capital_letters
small_letters
alphabet_sequence
color_primary
color_groups
color_shades
memory_sequence_2
memory_sequence_3
memory_sequence_4
logic_patterns_1
logic_patterns_2
logic_classification
logic_deduction
```

---

# Mastery Score System

```json
{
  "skillNode": {
    "id": "",
    "masteryScore": 0,
    "attempts": 0,
    "correctStreak": 0,
    "incorrectStreak": 0,
    "lastSeen": ""
  }
}
```

### Progression
3 correct answers in a row: `count_1_10 → count_1_15 → count_1_20`

### Regression
2 incorrect answers: drop one tier, increase repetition frequency.

---

# Question Validator

Before serving questions:
1. Verify metadata availability.
2. Ensure one unique answer.
3. Remove ambiguous options.
4. Retry generation if validation fails.
5. Fallback to next template.

---

# Age Configuration

```json
{
  "ageConfig": {
    "maxOptionsPerQuestion": 3,
    "sessionLengthMinutes": 5,
    "minTouchTargetPx": 80,
    "maxSequenceMemoryLength": 3,
    "autoNarrateInstructions": true,
    "showTextWithAudio": true,
    "celebrationEvery": 3,
    "mistakeTolerance": 2
  }
}
```

---

# Parent Settings

```json
{
  "parentSettings": {
    "maxSessionMinutes": 10,
    "soundEnabled": true,
    "difficultyMode": "adaptive",
    "unlockAllUniverses": false,
    "allowFreePlay": true
  }
}
```

---

# Favorite Characters

```json
{
  "favoriteCharacters": ["zenitsu", "spiderman", "flash"]
}
```

Question distribution: 70% favorite characters, 30% new characters.
Purpose: Reduce boredom and increase engagement.

---

# Daily Missions

Examples:
- Count till 15
- Match 5 letters
- Solve 3 memory games
- Find 5 red characters

Purpose: Build routine, encourage repetition, provide short-term goals.

---

# Games

## Tier 1
1. Hero Counting
2. Capital to Small Match
3. Color Sorting
4. Memory Flip Cards
5. Missing Number
6. Find the Odd One
7. Sort by Attribute
8. Who Am I?

## Tier 2
9. Tap and Count
10. Number Hunt
11. Alphabet Sequence
12. Remember the Order
13. Character Disappears
14. Pattern Builder
15. Compare and Choose

---

# Procedural Question Templates

1. Find Character
2. Find Character by Color
3. Find Character by Power
4. Find Character by Weapon
5. Find Character by Universe
6. Find Character by First Letter
7. Find Character by Attribute
8. Who Am I?
9. Count Objects
10. Sort Objects

Questions must never repeat in the same form.

---

# Anti-Boredom System

- Procedural generation
- Randomized options
- Multiple templates
- Random backgrounds
- Character celebrations
- Audio feedback
- Unlockables
- Spaced repetition
- Favorite character prioritization
- Daily missions

---

# Reward System

Every correct answer: Sound feedback, Animation, Stars, Stickers, Character celebration.

## Milestones

| Stars | Reward |
|-------|--------|
| 5 | Sticker |
| 20 | New Background |
| 50 | Character Celebration |
| 100 | Hero Certificate |

---

# Universe Progress

```
Demon Slayer   ██████░░░░ 60%
Marvel         ████████░░ 80%
Naruto         ███░░░░░░░ 30%
```

Purpose: Encourage completion.

---

# Screen Flow

```
Splash
    ↓
Profile (Athiran)
    ↓
Home
    ↓
Universe Selection
    ↓
Mission Selection
    ↓
Game Selection
    ↓
Gameplay
    ↓
Reward Screen
    ↓
Progress Summary
    ↓
Home
```

---

# Multi-Profile Architecture

```
profiles/
    athiran/
        progress/
        achievements/
        ageConfig/
    profile2/
        ...
```

Current: Single Profile (Athiran)
Future: Unlimited profiles without migration.

---

# Offline Requirements

Everything must work offline. Store locally:
- Characters, Images, Audio
- Progress, Achievements, Mastery Scores
- Statistics, Settings, Profiles

No APIs. No servers. No internet dependency.

---

# Testing & Iteration Loop

Weekly:
1. Export IndexedDB as JSON.
2. Review weak skill nodes.
3. Adjust difficulty curves.
4. Tune templates.
5. Tune age configuration.

No telemetry infrastructure required.

---

# Long-Term Vision

```
Character Pack + Question Templates + Game Engine
```

Supports: Pokemon, Dinosaurs, Cars, Original Characters, Public Release — without changing engine code.

Only `contentPack.config.json`, assets, and metadata need to change.

---

# Final Mission Statement

AthiVerse is not an educational app.

It is an offline-first, procedurally generated, reusable educational game engine that transforms a child's love for superheroes and anime into curiosity-driven learning adventures, helping Athiran develop numbers, alphabets, colors, memory, and logical thinking through play, exploration, and hero-based missions.
