# Phoodle Solver

A high-performance Phoodle (Wordle-like food word game) solver using entropy-based algorithm with Ngram frequency tiebreaker.

## Project Structure

This repository contains three components:

### 1. [nextjs-frontend](./nextjs-frontend/)
React/Next.js web application with a beautiful UI for solving Phoodle puzzles.

- Pure JavaScript entropy solver
- Ngram frequency tiebreaker
- Responsive design with Tailwind CSS

### 2. [wasm-source](./wasm-source/)
Rust source code for the WebAssembly solver.

- Shannon entropy calculation
- 13,064 food words embedded
- Ngram frequency scores included
- ~10x faster than JavaScript

### 3. [standalone-wasm](./standalone-wasm/)
Standalone HTML page with WASM - no build required!

- Single HTML file
- Compiled WASM binary included
- Just serve and use

## Algorithm

1. **Shannon Entropy**: Calculates which guess gives maximum information
2. **Ngram Frequency Tiebreaker**: When entropy is similar, prefers common words
3. **Bit-packed Patterns**: Efficient pattern matching (0-242 possible patterns)

## Best Starter Words

SALET, CRANE, TRACE, SLATE, CRATE - these have ~4.2 bits of entropy!

## Development

```bash
# Next.js frontend
cd nextjs-frontend
npm install
npm run dev

# Build WASM (requires Rust + wasm-pack)
cd wasm-source
wasm-pack build --target web --out-dir ../standalone-wasm --release
```

## License

MIT
