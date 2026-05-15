TFT Set 17 Theorycrafting Engine - AI Context Document🤖 System Prompt / Initialization ContextIf you are an AI reading this document, you are analyzing a React-based Teamfight Tactics (TFT) composition builder and theorycrafting engine. The current dataset is specifically configured for Set 17: Space Gods.Your goal when modifying this codebase is to maintain the mathematical rigor of the synergy calculations and preserve the modular, branching-path architecture.🏗️ Architecture & Tech StackFramework: React 18 (Functional components, Hooks)Build Tool: ViteStyling: Tailwind CSS (Utility-first, heavily relies on dynamic string interpolation for tier/cost colors).Icons: lucide-reactState Management: Local React state (useState, useMemo for heavy lifting). No Redux/Context used; state is lifted to App.jsx and passed down.🗄️ Data Schemas (Pseudo-TypeScript)To understand how data flows through the application, refer to these core interfaces:// 1. Champion Schema
interface Champion {
  id: string;
  name: string;
  cost: number; // 1 | 2 | 3 | 4 | 5
  traits: string[]; // e.g., ["Brawler", "Dark Star"]
  instanceId?: string; // Appended uniquely when added to a board to allow duplicates
}

// 2. Trait Schema
interface Trait {
  levels: number[]; // Activation breakpoints (e.g., [2, 4, 6] or [1, 3, 5, 7, 10])
}

// 3. Board State Schema (Lives in App.jsx)
interface Board {
  id: string;
  name: string;
  units: Champion[]; // Max 10 units
  strategy: 'standard' | 'fast9' | 'reroll3' | 'reroll2' | 'hyper1';
  emblems: string[]; // Array of trait strings acting as global spatulas
}
🧠 Core Engine Mechanics & AlgorithmsIf asked to modify the engine, you must understand how these core helper functions operate (located in src/utils/helpers.js):1. Synergy Calculation (getSynergies)Logic: Iterates over unique champion names on a board (TFT rules dictate duplicates do not grant trait +1). Counts occurrences, adds global emblems, and compares against the MOCK_TRAITS.levels array.Output Tiering: Returns an object mapping traits to a visual tier: bronze, silver, gold, or inactive.2. Suggestion Engine (getSuggestions)Goal: Recommends the optimal next units to add.Algorithm: Calculates the mathematical distance to the next trait breakpoint for every active trait on the board.+100 points: Unit exactly completes a trait breakpoint.+30 points: Unit progresses a trait but does not complete it.Weighting: Base score is adjusted by the board's strategy state (e.g., "fast9" artificially inflates the score of 4/5 cost units).3. Swapout Detection (Smart Badges in BoardPanel.jsx)Logic: Determines if a currently placed unit is "dead weight" or "overflowing" a trait.Method: Temporarily removes the unit, recalculates board synergies. If removing the unit does not lower the active tier of any active synergy, isSwapout evaluates to true.Visuals:[ N | ★ ] (Emerald) = Core Unit (provides required threshold).[ N | ♻ ] (Amber) = Flex Unit (provides overlapping traits, but is mathematically swappable).4. Auto-Fill Beam Search (handleAutoFill in App.jsx)Logic: A heuristic search algorithm. Instead of brute-forcing billions of board combinations, it maintains a "beam" of the top 25 highest-scoring compositions, adding 1 unit at a time until the target size is reached. It heavily weights the user's selected focusTrait.📁 File Structure Map/src
 ├── main.jsx                 # Mount point
 ├── App.jsx                  # Main wrapper, Board state array, Modals (Emblems, Fill Engine), Global Champ Pool
 ├── index.css                # Tailwind imports + Custom scrollbars
 ├── /components
 │    └── BoardPanel.jsx      # UI for a single board instance. Renders hex grid, synergy list, and optimal suggestions.
 ├── /utils
 │    └── helpers.js          # Pure functions for calculating traits, suggestions, and UI colors.
 └── /data
      └── tftData.js          # Hardcoded JSON of Set 17 Champions and Trait mappings.
🚀 Future Expansion Vectors (For AI Instructions)If instructed by the user to expand this app, prioritize these vectors:Items System: Update the Champion schema to include items: string[]. You will need to add an item database to tftData.js and build a drag-and-drop or modal UI in BoardPanel.jsx.Hex Grid Positioning: The current board is a flat array (flex/grid). To upgrade this to real TFT positioning, change units: Champion[] to a 2D array or map { [hexIndex: number]: Champion } representing a 4x7 grid.Live Data Fetching: Replace MOCK_CHAMPIONS with a useEffect fetch to Community Dragon (raw.communitydragon.org).