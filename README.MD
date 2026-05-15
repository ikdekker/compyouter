# TFT Theorycrafting Engine

A modular, high-performance team builder and theorycrafting engine for Teamfight Tactics (TFT). This tool allows players to build compositions, branch out different tactical paths, and receive intelligent unit suggestions based on active synergies and roll strategies.

![License](https://img.shields.io/github/license/ikdekker/compyouter)
![Vite](https://img.shields.io/badge/vite-%23646CFF.svg?style=flat&logo=vite&logoColor=white)
![React](https://img.shields.io/badge/react-%2320232b.svg?style=flat&logo=react&logoColor=%2361DAFB)
![TailwindCSS](https://img.shields.io/badge/tailwindcss-%2338B2AC.svg?style=flat&logo=tailwind-css&logoColor=white)

## ✨ Features

- **Multi-Path Branching**: Create multiple "what-if" scenarios from a base composition to explore different late-game transitions.
- **Intelligent Engine Analysis**: Real-time suggestions for the most optimal units to add based on your current board.
- **Specialized Unit Treatment**: Unique handling for complex units like Miss Fortune, allowing you to select specific augments/traits directly on the board.
- **Roll Strategy Optimization**: Tailor suggestions based on your economy strategy (Standard, Fast 9, Reroll, etc.).
- **Trait Intelligence**: Distinguishes between unique (1-unit) and non-unique traits, with visual indicators for "core" vs "swapout" units.
- **Export & Share**: Generate encoded team codes to share your theorycrafted boards with others.

## 🚀 Getting Started

### Prerequisites

- [Node.js](https://nodejs.org/) (v18.0.0 or higher)
- npm or yarn

### Installation

1. **Clone the repository**
   ```bash
   git clone git@github.com:ikdekker/compyouter.git
   cd compyouter
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Start the development server**
   ```bash
   npm run dev
   ```

4. **Build for production**
   ```bash
   npm run build
   ```

## 🛠️ Tech Stack

- **Frontend**: React 18 with Vite
- **Styling**: Tailwind CSS
- **Icons**: Lucide React
- **Logic**: Custom Beam Search algorithm for unit auto-fill and suggestions.

## 📖 Usage

1. **Adding Units**: Click on champions in the pool at the bottom to add them to your active board.
2. **Special Traits**: For units like Miss Fortune, hover over the unit card on the board to toggle between selectable traits.
3. **Branching**: Click the branch icon to clone your current board into a new tab for alternative path exploration.
4. **Auto-Fill**: Use the magic wand icon to let the engine automatically complete your team based on a target size or focus trait.
5. **Sharing**: Use the share icon to copy a board code to your clipboard.

## 📄 License

Distributed under the MIT License. See `LICENSE` for more information.

---
Created by [Nick Dekker](https://github.com/ikdekker).
