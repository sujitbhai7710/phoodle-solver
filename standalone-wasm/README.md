# Phoodle Solver - WASM Source (Rust)

High-performance entropy-based solver compiled to WebAssembly.

## Features

- ~10x faster than JavaScript implementation
- 13,064 words embedded in binary
- Ngram frequency scores included
- Zero runtime dependencies

## Build Requirements

- Rust (1.70+)
- wasm-pack

```bash
# Install Rust
curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh

# Install wasm-pack
cargo install wasm-pack
```

## Build

```bash
wasm-pack build --target web --out-dir OUTPUT_DIR --release
```

## API

```javascript
import init, { PhoodleSolver } from './phoodle_solver.js';

await init();
const solver = new PhoodleSolver();

// Get starter words
const starters = solver.get_starters(10);

// Solve with guesses
const result = solver.solve([
  { word: 'salet', result: 'BGBYB' },  // B=black, Y=yellow, G=green
  { word: 'crane', result: 'BBGYG' }
]);

console.log(result.best_guesses);
console.log(result.remaining_count);
```

## Result Format

```typescript
{
  remaining_count: number,
  possible_answers: string[],
  best_guesses: {
    word: string,
    entropy: number,
    expected_remaining: number,
    is_possible_answer: boolean,
    freq_score: number
  }[],
  solve_time_ms: number
}
```

## Algorithm

1. Bit-packed pattern calculation (0-242 possible patterns)
2. Shannon entropy: `-Σ p * log2(p)`
3. Frequency tiebreaker when entropy within 0.1 bits
