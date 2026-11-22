# ROLE & OBJECTIVE
Act as a Principal EdTech Product Architect, Cognitive Learning Scientist, Staff Full-Stack AI Engineer, and Principal Product Designer. Design a **production-grade, uncompromised Web Application** engineered to take a student with a **severe foundational deficit** (high math anxiety, weak arithmetic/algebraic intuition, struggles with abstract concepts, freezes on word problems) to a **top-tier 800+ UTBK-SNBT score** (top 0.5% national IRT percentile).

**Core Design Mandate ("Lean Scope, Extreme Depth, Zero AI Slop"):**
Do NOT cut architectural corners for arbitrary deadlines, and do NOT bloat the app with vanity features (social feeds, gimmicky mascots, generic video libraries). Every pedagogical mechanic, backend verifier, and UI interaction must be engineered to maximum craft and reliability.

---

# CORE USER PERSONA & PSYCHOLOGICAL ALIGNMENT
- **Academic Starting Point:** Fractured foundation ("fondasi hancur") in math and logic, easily overwhelmed by dense narrative word problems (*soal cerita* in PU, PK, PM), and vulnerable to subtle logical traps in reading comprehension (LBI, LBE, PBM, PPU).
- **Cognitive Style:** Learns fastest through **first-principles breakdowns, sharp everyday analogies, direct pragmatic feedback, and active Socratic scaffolding**. Rejects passive lectures, robotic encouragement, and bloated textbook prose.
- **AI Infrastructure:** Powered by **9router** for intelligent multi-model routing (ultra-fast models for hints and classification, vision models for clean document ingestion, heavy reasoning models for diagnostics and code-verified problem generation).
- **Custom Knowledge Base ("My Brain Vault"):** Allows uploading personal Indonesian *bank soal* PDFs (including complex LaTeX equations, fractions, tables, and diagrams), tryout archives, cheat sheets, and *rumus cepat*. The AI MUST prioritize and ground explanations strictly in the user's uploaded methods first.

---

# NON-NEGOTIABLE COGNITIVE & ENGINEERING FRAMEWORKS
1. **Adaptive Mastery Learning & Soft-Gating (Bloom + Vygotsky's ZPD):**
   - Decompose every SNBT topic into micro-tiers: **Tier 0 (Foundation Repair: basic arithmetic, fractions, algebra manipulation, basic logic) -> Tier 1 (Core Concept) -> Tier 2 (Standard SNBT) -> Tier 3 (HOTS / 800+ Timed)**.
   - Require 80-90% mastery to fully conquer a node, with **Soft-Gating** (allowing lateral movement at 75% while automatically interleaving unresolved weak concepts into future drills) to prevent anxiety spirals.
2. **Dual-Track Pedagogy (Quantitative vs. Literacy):**
   - **Quantitative Track (PU, PK, PM):** Embed **Faded Worked Examples** (full worked solution -> missing final step -> missing multiple steps -> independent execution) and **Schema-Based Instruction (SBI) + Polya's Method** for word-problem deconstruction before calculation.
   - **Literacy Track (LBI, LBE, PBM, PPU):** Embed **Evidence-First Highlighting** (user must highlight the exact proving sentence in the passage before unlocking multiple-choice options) and **Distractor Anatomy** (identifying classic SNBT traps: *overgeneralization, scope shift, unsupported inference, causal reversal*).
3. **Neuro-Symbolic Math Verification (Zero-Hallucination Engine):**
   - NEVER trust raw LLM text generation to calculate math answers or create numeric variations (*isomorphic questions*).
   - Implement a **sandboxed, code-verified pipeline**: the LLM generates a structured problem template paired with deterministic verification code (isolated Python/SymPy or sandboxed JS/Math.js with strict CPU/memory timeouts and zero network/filesystem access) that computes exact ground-truth answers, validates geometric/mathematical feasibility, and generates realistic distractors from common calculation mistakes before serving.
4. **FSRS (Free Spaced Repetition Scheduler):**
   - Use **FSRS** (`ts-fsrs`) instead of rigid day intervals to calculate per-concept memory *stability* and *difficulty*, scheduling revival drills right before forgetting occurs.
5. **Root-Cause Error Taxonomy & IRT Time Calibration:**
   - Diagnose every mistake into one of four root causes: **Foundational Gap**, **Formula/Rule Amnesia**, **Word-Problem Translation Error**, or **Careless / Time-Panic Error**.
   - Track exact **Time-to-Solve** per item to build **Exam Triage** intuition (deciding within 15-20 seconds whether to execute or skip/flag under IRT pressure).

---

# UI/UX & NON-GENERIC GAMIFICATION DESIGN CONTRACT (STRICT ANTI-SLOP)

## 1. Visual Identity & Creative Direction ("Tactile Mastery Instrument")
- **Identity:** Combine the calm precision of a high-craft editorial workbook with the crisp responsiveness of a minimalist tactical strategy UI.
- **Anti-Cloning Rule:** Do NOT clone Duolingo's childish cartoon aesthetic, and do NOT lazily imitate generic Linear/Vercel/Notion templates. The app must hold its own distinct visual character even if the logo is removed.
- **Explicit Design Dials:** `ENERGY 2 (Balanced-Sharp)` / `RHYTHM 2 (Structured hierarchy with intentional layout breaks)` / `MOTION 2 (Purposeful tactile micro-transitions only; zero decorative bounce or floating)`.

## 2. The 3-Color Principle (Strict 60-30-10 Palette Discipline)
Ship a fully functional **Light & Dark Theme Toggle** (both modes must pass WCAG AA contrast: minimum 4.5:1 for normal text, 3:1 for large text):
- **60% Dominant Surface (Canvas):**
  - *Light ("Editorial Paper"):* Warm Alabaster `#F7F6F2` with Deep Ink text `#141518`.
  - *Dark ("Obsidian Studio"):* Deep Charcoal `#111214` with Ivory text `#EDECE8`.
- **30% Structural Secondary (Containers, Nodes, Dividers):**
  - *Light:* Warm Stone `#EAE7DF` with crisp 1px borders `#D8D4C8`.
  - *Dark:* Deep Slate `#1B1D21` with crisp 1px borders `#2B2F36`.
- **10% Deliberate Primary Accent (Focal Points & Active Mastery):**
  - *Light:* Signal Vermilion `#C83E21` (with `#FFFFFF` label text).
  - *Dark:* Luminous Ember `#EC6242`.
  - Used strictly for primary actions, active Skill Tree nodes, evidence highlights, and the 800+ Readiness Gauge.
- **Semantic Boundary:** Feedback greens/reds appear ONLY inside answer validation states, never as page decoration.

## 3. Non-Generic Gamification Mechanics
- **Tactical Mastery Topology (Skill Tree):** Node-graph progression resembling a clean transit/constellation map rather than cartoon bubbles. Visual states clearly distinguish Locked, Foundation Fracture (pulsing hairline border), In-Progress, and Solid Mastered (showing FSRS stability ring).
- **Fracture-to-Healed Mistake Graveyard:** Failed questions appear as logged "concept fractures" that visually mend when the user solves a verified isomorphic revival under FSRS.
- **Anxiety-Free Momentum:** NO punitive mobile-game "hearts/lives" that lock the user out. Reward **Precision Combos** (Accuracy x Triage Speed) and provide **Tier-0 Recovery Shields** to encourage fearless practice on weak fundamentals.
- **Focus Tunnel Study Mode:** Entering any drill collapses navigation chrome so there is **strictly one focal point per screen**: the problem, interactive deconstruction/scratchpad controls, and the on-demand Socratic drawer.

## 4. Study-Flow Ergonomics & Accessibility
- **Built-in Lightweight Scratchpad:** Toggleable translucent/side canvas for quick math scribbling or highlighting without leaving the screen.
- **Keyboard-First Velocity:** Full keyboard operation (`1-5` for options A-E, `H` for next Socratic Hint, `S` for Scratchpad toggle, `F` for Flag/Triage, `Enter` to submit, `Esc` to close drawers) with visible custom focus rings.
- **Mobile-First Resilience:** Zero horizontal overflow, crisp KaTeX formula wrapping, minimum 44px tap targets, and complete Empty / Loading / Error states for every data view.

## 5. Hard Anti-Slop Prohibitions
- FORBIDDEN: Blue-to-purple or neon gradients, excessive glassmorphism, glow on multiple elements, generic AI icons (sparkles, robots, magic wands, lightning bolts), uniform bento-grid templates, pill-shaped styling on every element, fake statistics, generic CTAs ("Get Started", "Learn More"), AI marketing buzzwords, and em dashes (`—`) in UI copy.
- Every visual decision (color, typography pairing, spacing, elevation, animation) must have a written one-line UX justification.

---

# CORE ARCHITECTURAL PILLARS (6 HIGH-ROI MODULES)
1. **Diagnostic Placement & Adaptive "Zero-to-800" Skill Tree:** Detects hidden elementary/middle-school gaps and injects Foundation Repair Nodes across all 7 SNBT subtests (PU, PPU, PBM, PK, LBI, LBE, PM), paired with a data-driven **IRT Readiness Trajectory**.
2. **9router Socratic & First-Principles Tutor:** Progressive anti-spoonfeeding hints (*Level 1: Personal Brain Vault Note Nudge -> Level 2: Problem Translation Prompt -> Level 3: Guided First Step -> Level 4: First-Principles Analogy Breakdown*).
3. **Vision-First "My Brain Vault" + Human-in-the-Loop QC Gate:** Vision-LLM converts uploaded PDFs/screenshots into structured JSON (`question_latex`, `options`, `official_solution`, `subtest`, `concept_tag`, `difficulty_tier`, `diagram_asset_url`), routes through a fast **5-second User Verification/Edit Preview** before committing to PostgreSQL + `pgvector` Hybrid Search.
4. **Dual-Track Interactive Trainers:** "Bedah Soal Cerita" (variable tagging + schema matching for Quant) and "Bedah Teks & Jebakan" (evidence highlighting + distractor classification for Literacy).
5. **Mistake Graveyard + FSRS Isomorphic Revival Engine:** Logs root causes and serves sandbox-verified isomorphic variations scheduled by FSRS.
6. **Realistic SNBT Stamina & Triage Simulator:** Official-style timed subtest lockouts feeding accuracy and Time-to-Solve telemetry directly back into the Skill Tree and Graveyard.

---

# ARCHITECTURAL EXECUTION PROTOCOL (MODULAR DEPTH)
Execute this blueprint in **3 production-grade phases**. Deliver **Phase A completely now**, then pause for review before Phase B and Phase C:

- **PHASE A (Deliver Now — System Blueprint, Data Foundation & Design Tokens):**
  1. **Production Tech Stack & System Architecture:** Next.js App Router (TypeScript), PostgreSQL + `pgvector`, `ts-fsrs`, KaTeX, **9router** orchestration layer, and isolated deterministic math verification sandbox (including timeout and security boundaries).
  2. **Complete Relational + Vector Database Schema:** Production SQL DDL covering Users, Skill Graph & Prerequisite Edges, Structured Question Bank (with QC status, LaTeX, diagrams), Brain Vault Notes/Embeddings, FSRS Card States, Attempt Telemetry (Time-to-Solve + Root Cause), and Simulation Sessions.
  3. **9router Multi-Model Routing Matrix:** Exact task-to-model tier mapping (Vision Parsing, Socratic Hints, Root-Cause Classification, Neuro-Symbolic Variation Generation), JSON schema enforcement, fallback rules, and cost/latency budgets.
  4. **Data Flow Specifications:** Concrete specs for (a) Vision-First Ingestion + Human QC Gate into Hybrid RAG, and (b) Neuro-Symbolic Sandboxed Verification Pipeline.
  5. **Design System Token Specification (`DESIGN.md` Foundation):** Complete CSS custom properties for Light/Dark 60-30-10 palettes, typography scale (including math readability pairing), spacing/radius scale, motion tokens, and component states.

- *(Hold for Phase B upon approval: Core Backend Services — 9router client & prompt contracts, Hybrid Retrieval engine, Sandboxed Neuro-Symbolic verifier, FSRS scheduler, and Mastery/Soft-Gating state machine.)*
- *(Hold for Phase C upon approval: High-Craft Frontend Implementation — Focus Tunnel Study Loop, Tactical Skill Topology map, KaTeX + Scratchpad canvas, Socratic Hint drawer, Bedah Soal Cerita / Evidence Highlighter trainers, and full keyboard accessibility + Anti-Slop Delivery Gate verification.)*
