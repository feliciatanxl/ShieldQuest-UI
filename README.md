# ShieldQuest-UI

**Choose Right. Protect Together.**  
*A cosy 2D Habbo-style isometric neighbourhood adventure set in the Singapore heartlands.*

ShieldQuest is an interactive, scenario-based youth crime-prevention game designed to help young people recognise social manipulation, navigate high-pressure dilemmas, and practise stepping in safely when a peer is at risk.

Developed by **Team SecurePi** from **Nanyang Polytechnic**, **ShieldQuest-UI** delivers the browser-first 2D isometric Singapore heartland experience—combining a cosy neighbourhood life-sim aesthetic with the **S.H.I.E.L.D. Behavioural Framework** and the **The Lookout Dilemma** shop-theft prevention mission.

> [!NOTE]
> **Project Notice**  
> ShieldQuest is an independent student project created by Team SecurePi. It is not an official product or service of the Singapore Police Force (SPF), the National Crime Prevention Council (NCPC), the National Youth Council (NYC), or any Government agency. All characters, landmarks, businesses, phone numbers, and scenarios featured in the game are fictionalised for educational gameplay.

---

## Contents

- [Quick Start](#quick-start)
- [Game Experience & Layout](#game-experience--layout)
- [Singapore Heartland & Fictionalised Skyline](#singapore-heartland--fictionalised-skyline)
- [Playable Quests & Controls](#playable-quests--controls)
- [The S.H.I.E.L.D. Framework](#the-shield-framework)
- [The Six Guardians](#the-six-guardians)
- [Core Principles & Privacy](#core-principles--privacy)
- [Repository Structure](#repository-structure)
- [Prototypes and References](#prototypes-and-references)
- [Contributing, Security and Licence](#contributing-security-and-licence)

---

## Quick Start

### Prerequisites

- **Node.js:** `>= 20.0.0` (tested on Node.js v24)
- **npm:** `>= 10.0.0`

### Run Locally

```bash
npm install
npm run dev
```

Open the local URL printed by Vite (e.g. `http://localhost:5173`). The public website is at `/` and the game is at `/play/`.

### Build & Preview

```bash
# Type-check with TypeScript (tsc -b) and build production bundle into dist/
npm run build

# Preview the production bundle locally
npm run preview
```

---

## Game Experience & Layout

### 1. Landing & Start Screen
- **Live Animated Heartland Backdrop:** Previews Blk 260 Shield View and the Singapore bay skyline in real time with dynamic **Afternoon (`17:30`)** and **Evening (`19:15`)** atmosphere switching.
- **Pseudonymous Character Setup:** Enter a non-identifying nickname (defaults to `Player`), customise hair style (`short`, `spiky`, `bob`, `ponytail`), skin tone, hair colour, and outfit tee with an instant circular portrait preview.
- **Optional Workshop Squad Code:** Click **JOIN SQUAD** to enter a temporary workshop code (e.g. `NYP-04`) without collecting personal identifiers.
- **S.H.I.E.L.D. Brief:** Review all six behavioural competencies directly from the title screen before clicking **START GAME**.

### 2. Exact 4-Corner Isometric HUD
Designed for uncluttered exploration across desktop and mobile viewports:

| Corner | HUD Component | Functionality |
|---|---|---|
| **Top-Left** | Portrait Medallion, Name, Status Bars & Shield Crest | Live avatar portrait (opens Wardrobe), display name, confidence/energy bars, silver Shield crest & Guardian badge slot (opens S.H.I.E.L.D. tracker). |
| **Top-Right** | Time & Weather Pill (`17:30` / `19:15`) | Click to toggle between sunny late afternoon (`17:30`) and cosy evening twilight (`19:15`) with lit HDB windows, walkway fairy lights & bay glow. |
| **Bottom-Left** | `Current Quest:` Tracker | Displays active objective (`Find Uncle's EZ-Link` / `The Lookout Dilemma`); click to view quest progress and jump straight to active steps. |
| **Bottom-Right** | 4 Wooden Action Buttons | **Backpack** (items & clues), **Wardrobe** (live avatar & shield customisation), **Map** (illustrated Singapore vista & fast-walk), and **Menu** (atmosphere, Web Audio SFX, controls & title screen). |

---

## Singapore Heartland & Fictionalised Skyline

To keep the world playful and safe for educational use, real-world Singapore landmarks are represented with original **in-game fictionalised names**, alongside authentic heartland architecture:

### Playable Heartland — Blk 260 Shield View
- **Elevated MRT Viaduct & Shield Line Train:** Diagonal concrete viaduct with an animated 3-car white/red-striped MRT train running above the park & skyline.
- **Kopi Corner, Sengkang Satay & Park Fitness Corner:** Open-air hawker stalls with illuminated `KOPI` and `SATAY` fascia signs, Kopi Uncle, seated heartland diners, drink vending machine, fairy-lit linkway, and an HDB outdoor Fitness Corner (pull-up bars, stepper, wooden bench).
- **HDB Block 260 Facade:** Multi-storey cream, terracotta, and slate-blue block featuring exposed grey vertical riser pipes, the **`260`** wall stencil, **`BLK 260`** pillar plaque, corridor window grilles, **bamboo laundry poles**, exterior **air-con compressor units**, and warm evening window lighting.
- **Void Deck & Sheltered Walkway:** Signature mosaic-tiled pillars, stainless steel letterbox bank with parcel box, **`RC NOTICE`** cork noticeboard with flyers, **stone Xiangqi (chess) table** with stools and a **"chope" tissue packet**, green recycling bins, community cats (grey tabby & ginger), and curved sheltered walkway with fairy lights.
- **Left-Hand Streetscape & Transit (`Stop 26019` — `ShieldBus 88`):** Asphalt road with white zebra crossing, yellow dashed `BUS` bay with parked **ShieldBus 88**, cruising **Micro EV**, pedestrian metal railing, storm drain grate, yellow tactile paving, and heritage streetlamps.
- **Sunshine Minimart & Realistic SG Characters/Items:** Open cutaway sundry shop with yellow signboard, No Smoking plaques, drink crates, illuminated beverage chiller fridge, snack shelves, and `SNACKS` rack — populated by **Uncle Tan**, **Auntie Mei** pushing her silver **FairMart shopping trolley**, **Kopi Uncle**, **Jun**, and collectible SG items (**SimplyGo EZ-Link Card**, **Pocket Tissue ("Chope" Pack)**, **Kopi-O Dabao Packet**, **Field Observation Pad**, **Sunshine Minimart Receipt**).

### Fictionalised Singapore Bay Skyline & Districts
Visible along the upper-left park horizon and in the interactive **Map** drawer:

| In-Game Landmark Name | Inspiration / Role in ShieldQuest |
|---|---|
| **Baycrest SkyDeck Towers** | Three waterfront towers crowned by a cantilevered boat-shaped skybridge across the bay vista. |
| **Lion City Observation Wheel** | Slowly turning giant waterfront wheel overlooking the heartland horizon. |
| **GlowTree Supertree Grove** | Glowing twilight botanical supertree canopies nestled beside Baycrest SkyDeck. |
| **Durian Dome Arts** | Twin spiky waterfront concert domes along the bayfront skyline. |
| **Blk 260 Shield View & Sunshine Minimart** | Active evaluated shop-theft prevention pilot zone. |
| **Emerald Dragon Playground & Shiok Hawker** | Planned Stage 2 heartland community district shown on the world map. |

---

## Playable Quests & Controls

### Controls
- **Click / Tap:** Click any walkable tile on the footpath, sheltered walkway, void deck, or Sunshine Minimart to walk there. Click NPCs (`Uncle Tan`, `Auntie Mei`), the `BUS 88` pole, or the void-deck stone table to interact.
- **Keyboard:** Move with `WASD` or `Arrow Keys`, and hold `Shift` to run.
- **Audio:** Lightweight Web Audio synthesizer (`src/utils/sound.ts`) for optional chiptune button and quest chimes (toggleable in **Menu**).

### Quests
1. **Find Uncle's EZ-Link:** Speak with **Uncle Tan** beside the green recycling bin (`"Eh boy, did you see my bus card?"`), spot the glowing teal EZ-Link card near the void-deck stone Xiangqi table, pick it up into your Backpack, and return it to Uncle Tan.
2. **The Lookout Dilemma (Sunshine Minimart):** Walk into or click **Sunshine Minimart** to face the anchor shop-theft peer-pressure scenario with **Jun** and practise all six S.H.I.E.L.D. competencies independently.

---

## The S.H.I.E.L.D. Framework

Each letter of **S.H.I.E.L.D.** is assessed as a distinct, non-overlapping competency inside **The Lookout Dilemma**:

| Letter | Skill | Competency Assessed | In-Game Assessment |
|---|---|---|---|
| **S** | **Spot the Risk** | Situational awareness & factual observation | Select strictly observable facts while avoiding unsupported assumptions. |
| **H** | **Hold Before Acting** | Self-control & safe boundary setting | Refuse risky lookout requests calmly without confrontation or vigilantism. |
| **I** | **Identify the Influence** | Recognising peer pressure | Identify both the persuasion tactic and the requested role. |
| **E** | **Evaluate Consequences** | Delayed consequence awareness | Match actions to plausible short-term and delayed outcomes before reveal. |
| **L** | **Lead the Right Choice** | Positive peer influence | Choose a respectful message redirecting a peer towards a safer option. |
| **D** | **Defend Your Community** | Responsible help-seeking | Choose an appropriate trusted adult / minimart cashier and objective observations to share. |

---

## The Six Guardians

Players unlock Guardians by demonstrating S.H.I.E.L.D. skills—never via randomised loot boxes:

| Guardian | Paired Skill | Role Represented |
|---|---|---|
| **Cluepaw** | **S** — Spot the Risk | Situational awareness & overlooked factual cues |
| **Shieldfin** | **H** — Hold Before Acting | Calm refusal skills & boundary protection |
| **ByteBuddy** | **I** — Identify the Influence | Spotting manipulation tactics & unsafe requests |
| **VeriFox** | **E** — Evaluate Consequences | Verification & foresight before acting |
| **Echo** | **L** — Lead the Right Choice | Respectful consultation & peer redirection |
| **Beacon** | **D** — Defend Your Community | Safe reporting channels & proportionate escalation |

---

## Core Principles & Privacy

- **Experience the Consequence, Not Passive Quizzes:** Decisions lead to reflection on both immediate temptation and delayed social/trust ripples without preaching or victim-blaming.
- **No Vigilantism or Confrontation:** Scenarios explicitly model safe refusal, factual observation, and staff/adult help-seeking rather than chasing, grabbing, filming-to-shame, or public accusations.
- **Privacy by Default (PDPA-Aligned):** Uses pseudonymous display names and optional temporary workshop squad codes; no NRIC, phone numbers, emails, banking info, or Singpass credentials are ever requested.

---

## Repository Structure

```text
ShieldQuest-UI/
├── public/
│   ├── assets/
│   │   ├── chars/                       # PixelLab character sprite sheets (PNG + row-map JSON)
│   │   ├── guardians/                   # PixelLab S.H.I.E.L.D. Guardian portraits (64x64)
│   │   └── scenes/                      # PixelLab street scene (day/night) & town overview, 640x360 shown at 2x
│   ├── favicon.svg                      # Pixel Shield icon
│   └── manifest.webmanifest             # PWA manifest metadata
├── src/
│   ├── components/
│   │   ├── GameDrawers.tsx              # Backpack, Wardrobe, Singapore Map, Quests, S.H.I.E.L.D. & Menu modals
│   │   ├── GameHUD.tsx                  # Exact 4-corner isometric game HUD overlay
│   │   ├── GameWorld.tsx                # 60fps simulation, controls, collision bounds & quest triggers
│   │   ├── TitleScreen.tsx              # Title screen: Start New Game / Continue (saved progress)
│   │   ├── LandingScreen.tsx            # New-game hero creator with animated sprite preview
│   │   ├── LookoutDilemmaModal.tsx      # 6-step non-overlapping S.H.I.E.L.D. anchor mission UI
│   │   └── PixelIcons.tsx               # Sprite-based portraits, HUD button icons, badges & weather icons
│   ├── data/
│   │   └── gameData.ts                  # Avatar palettes, inventory items, S.H.I.E.L.D. skills & SG landmarks
│   ├── game/
│   │   ├── sceneRenderer.ts             # Street scene: background art, walkable map, depth-sorted sprites, bubbles
│   │   └── sprites.ts                   # Sprite sheet loader, walk-cycle drawing & avatar recolouring
│   ├── styles/
│   │   ├── pixel-ui.css                 # Theme variables, HUD pixel frames, landing & layout
│   │   └── pixel-panels.css             # Pixel wood/parchment in-game panels & title screen
│   ├── types/
│   │   └── game.ts                      # TypeScript interfaces for avatar, NPCs, quests & S.H.I.E.L.D. state
│   ├── utils/
│   │   ├── save.ts                      # Browser save/load (localStorage, validated on read)
│   │   ├── sgClock.ts                   # Live Singapore time → day/night
│   │   └── sound.ts                     # Zero-dependency Web Audio retro SFX helper
│   ├── App.tsx                          # Top-level Landing <-> Game state orchestrator
│   └── main.tsx                         # React entry point
├── CODE_OF_CONDUCT.md
├── CONTRIBUTING.md
├── LICENSE
├── README.md
├── SECURITY.md
├── index.html                           # Public website (/), styles in src/site/site.css
├── play/index.html                      # Game entry (/play/)
├── package.json
├── tsconfig.json
└── vite.config.ts
```

---

## Prototypes and References

Earlier iterations and design references developed during the concept phase:

- **Competition Prototype:** [feliciatanxl/SecurePi_SPF](https://github.com/feliciatanxl/SecurePi_SPF)
- **Prototype V1:** [feliciatanxl/ShieldQuest-V1](https://github.com/feliciatanxl/ShieldQuest-V1)
- **Prototype V2:** [feliciatanxl/ShieldQuest-V2](https://github.com/feliciatanxl/ShieldQuest-V2)
- **Web Concept Reference:** [shieldquest-sigma.vercel.app](https://shieldquest-sigma.vercel.app/)

---

## Contributing, Security and Licence

- **[CONTRIBUTING.md](CONTRIBUTING.md)** — Contribution workflow, safeguarding checks, fictionalised naming rules, and build verification.
- **[SECURITY.md](SECURITY.md)** — Security policies, vulnerability reporting channels, and privacy-first architecture.
- **[CODE_OF_CONDUCT.md](CODE_OF_CONDUCT.md)** — Standards for respectful, youth-safe project collaboration.
- **[LICENSE](LICENSE)** — Proprietary licence terms; all rights reserved by Team SecurePi.

*ShieldQuest is developed by Team SecurePi (Nanyang Polytechnic, Singapore). Copyright © 2026 Team SecurePi. All rights reserved.*
