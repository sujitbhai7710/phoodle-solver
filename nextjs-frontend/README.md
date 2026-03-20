# Phoodle Solver - Next.js Frontend

A beautiful, responsive web interface for the Phoodle solver.

## Features

- Entropy-based word suggestions
- Ngram frequency tiebreaker for similar entropy words
- Click letters to cycle colors (⬛ → 🟨 → 🟩)
- Shows remaining possible words
- Displays solve time in milliseconds

## Tech Stack

- Next.js 16
- React 19
- TypeScript
- Tailwind CSS
- shadcn/ui components

## Getting Started

```bash
# Install dependencies
npm install

# Run development server
npm run dev

# Build for production
npm run build
```

## How It Works

1. Load word list with Ngram frequency scores from `/word_scores.json`
2. User enters their guess and marks colors from Phoodle
3. Solver filters possible answers using bit-packed patterns
4. Calculates Shannon entropy for each candidate word
5. Ranks by entropy, uses frequency as tiebreaker
6. Displays top 10 suggestions

## Files

- `src/app/page.tsx` - Main solver UI
- `src/hooks/use-wasm-solver.ts` - Solver logic hook
- `public/word_scores.json` - 13,064 words with frequency scores
