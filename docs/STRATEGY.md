# TFT Set 17 Strategic Roadmap (Into the Arcane)

This document outlines the core transition theory for Set 17 to inform the TFT Engine's optimization logic.

## 1. Leveling Milestones (Tempo)
*   **Stage 2-1:** Level 4 (Start of game stabilization)
*   **Stage 2-5:** Level 5 (The "Matching Comp" spike)
*   **Stage 3-2:** Level 6 (Stabilizing mid-game)
*   **Stage 4-2:** Level 8 (The "Final Comp" roll-down)

## 2. Early Game Openers (Levels 4 & 5)

### Win-Streak Lines
*   **Vanguard + Shepherd:** Nasus & Leona (Frontline) + Teemo (AP Carry). Teemo holds AP items for Aurelion Sol/Karma.
*   **Rogue:** Talon & Briar. High early burst, Talon holds AD items for Corki/Master Yi.
*   **Stargazer:** TF & Caitlyn. High variance based on the game's Constellation (Mountain/Altar are best for streaking).

### Economy/Loss-Streak Lines
*   **Timebreaker:** Cho'Gath & Ezreal. Grants free rerolls on losses to build gold.
*   **Primordian:** Random unit generation for gold farming.

## 3. The Mid-Game Bridge (Level 6 & 7)
The goal is to replace 1-cost holders with 3-cost stabilizers:
*   **AP Line:** Use **Viktor** to hold items for LeBlanc/Asol.
*   **AD Line:** Use **Kai'Sa** to hold items for Jhin/Corki.
*   **Frontline:** **Illaoi** is the premier mid-game tank for almost any comp.

## 4. Meta End-Game Caps (Level 8 & 9)
*   **Meeple Corki/Riven:** Transition from Vanguard/Rogue.
*   **6 Dark Star (Asol):** Requires a "Massive" Aurelion Sol.
*   **Brawler Master Yi:** Needs Edge of Night survival.
*   **6 Mecha:** Requires hitting the "Mighty Mech" unit at Level 8.

## 5. In-Game Assistant Logic

### Level-Aware Optimization
The assistant must respect **Shop Odds** for the current player level:
*   **Hard Filter:** If a unit's cost has a 0% hit rate at the current level, it **must not** appear in "Optimal Additions" or "Auto-Fill" results.
*   **Weighting:** Units should be prioritized based on their actual hit probability to reflect realistic rolling scenarios.

### Playstyle Detection & Strategy
The tool should dynamically propose strategies based on the board's cost structure:

#### **Reroll Strategy (1/2-Cost Core)**
*   **Detection:** Proposed if the board has 3+ units that are "Core" and cost $1 or $2.
*   **Logic:** Prioritize hitting gold-tier synergies with low-cost units. Focus on "widening" the board with units that have a high hit rate at Levels 4-6.
*   **Interest Optimization:** Suggest staying at the "Sweet Spot" level (e.g., Level 4 for 1-costs, Level 6 for 2-costs).

#### **Standard Strategy (Fast 8/9)**
*   **Detection:** Proposed if the board has 4-cost core units or high average board cost.
*   **Logic:** Prioritize high-value 4 and 5-cost units. Use the "Mid-Game Bridge" to maintain health while leveling.

### Tool Controls
*   **Global Level:** A central player level control (1-10) that drives all hit-rate calculations.
*   **Level Up/Down:** Rapid adjustment buttons to simulate the "Next Stage" or correct mistakes.
*   **Transition Branching:** Quick-shifting must automatically set the target level and re-run the engine using the filtered pool.
