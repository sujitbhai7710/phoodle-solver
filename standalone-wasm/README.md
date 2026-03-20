# Phoodle Solver - Standalone WASM

Single HTML file with embedded WASM - no build step required!

## Usage

Simply serve these files with any HTTP server:

```bash
# Python
python3 -m http.server 3000

# Node.js
npx serve .

# Then open http://localhost:3000
```

## Files

- `index.html` - Complete solver UI
- `phoodle_solver.js` - WASM JavaScript bindings
- `phoodle_solver_bg.js` - WASM bootstrap
- `phoodle_solver_bg.wasm` - Compiled WASM binary (~200KB)

## Features

- WASM-powered solver (fast!)
- 13,064 food words embedded
- Entropy algorithm + Ngram frequency
- Mobile responsive
- No external dependencies

## How It Works

1. Loads WASM binary on page load
2. User enters guess from Phoodle
3. Click letters to cycle: ⬛ → 🟨 → 🟩
4. WASM calculates best next guesses
5. Shows remaining possible words

## Self-Hosting

Just copy all files to your web server. No npm, no build, no backend needed!
