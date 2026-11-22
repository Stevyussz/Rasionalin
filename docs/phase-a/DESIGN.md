# KejarSNBT Design System Contract (Warm Botanical Gamified Edition)

## 1. Visual Philosophy

KejarSNBT pairs a **warm, bright, gamified learning-path craft** with **clean flat-structured hierarchy** (zero nested rounded-box soup, zero blue/purple/neon AI clichés, zero gloomy dark screens).

Core principles:
1. **Consistent Phosphor Duotone Iconography:** All UI icons come exclusively from `@phosphor-icons/react` (`duotone` default, `bold`/`fill` for solid controls), standing cleanly alongside typography without decorative rounded icon-box wrappers.
2. **Playful, Non-Generic Gamified Typography:** `Fredoka Variable` for headings, unit banners, and focal scores paired with `Nunito Variable` (`tabular-nums`, unslashed zero) for all body copy, controls, and timers; `Source Serif 4 Variable` strictly for UTBK literacy reading passages.
3. **Zero Blue, Zero Purple, Zero Neon:** Strict 60-30-10 warm daylight palette with natural botanical & earthy semantic tones.
4. **Why Before How + Active Recall + FSRS:** Dedicated `/tutor` ("Tanya AI"), inline `/study` "Tanya AI" + "Penjelasan AI (Why Before How)" drawer, and interactive FSRS Active Recall flashcards in `/graveyard`.

---

## 2. 60-30-10 Warm Botanical Daylight Tokens

### Daylight Ivory (Default)
- **60% Main Surface:** Canvas `#FAF9F5`, Card `#FFFFFF`, Ink Primary `#1F2722`, Ink Secondary `#4F5B53`.
- **30% Structural Secondary:** Soft Sage Linen `#EEF1EA`, Hairline Border `#DCE2D7`, Tactile Bevel `#C6D0C0`, Interactive Border `#6C7870`.
- **10% Primary Accent:** Botanical Emerald `#16794B`, Hover `#11623C`, Bevel `#0D4E2F`, Tint `#E6F4EC`.
- **Earthy Functional Accents:**
  - Warm Ochre (`#A8620D` / tint `#FDF3E3` / ink `#7A4406`) for Kombo, Unit 2, Active Recall prompts, and Triage.
  - Warm Terracotta (`#BD3E26` / tint `#FDECE8` / ink `#992E1C`) for Mistakes, Recovery, and Unit 3 HOTS.
  - Deep Olive Forest (`#344E41` / tint `#EAF0EC` / ink `#253A2F`) for Tutor AI, Brain Vault, and strong secondary buttons.

### Warm Paper (Eye-Comfort Alternate)
- Canvas `#F6F0E4`, Elevated `#FFFDF8`, Secondary `#ECE4D4`, Ink `#25211B`.

---

## 3. Harmonized Math & Formula Rendering (`MathText`)

- Inline `\frac` automatically normalizes to proportional `\dfrac` with uniform vertical alignment (`vertical-align: middle`).
- Pure `\text{...}` segments unwrap to `Nunito` UI typography so full sentences never shift into Computer Modern serif.
- Plain-text arrows (`->`, `=>`, `<=`, `>=`) normalize cleanly to Unicode mathematical symbols (`→`, `⇒`, `≤`, `≥`).
- Both option stems and `distractorRationale` render through `<MathText />`.
