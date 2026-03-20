/**
 * WASM Loader for Phoodle Solver
 * Handles dynamic loading and initialization of the WASM module
 */

// Types for WASM solver
export interface WasmSuggestion {
  word: string;
  entropy: number;
  expected_remaining: number;
  is_possible_answer: boolean;
  freq_score: number;
}

export interface WasmSolveResult {
  remaining_count: number;
  possible_answers: string[];
  best_guesses: WasmSuggestion[];
  solve_time_ms: number;
}

export interface WasmSolver {
  get_starters(count: number): string[];
  solve(guesses: Array<{ word: string; result: string }>): WasmSolveResult;
  word_count(): number;
  free(): void;
}

interface WasmModule {
  PhoodleSolver: new () => WasmSolver;
  init(): void;
}

// Singleton instances
let wasmModule: WasmModule | null = null;
let loadingPromise: Promise<WasmModule> | null = null;

/**
 * Load and initialize the WASM module
 * This uses fetch to load the WASM binary directly
 */
export async function loadWasm(): Promise<WasmModule> {
  if (wasmModule) return wasmModule;
  if (loadingPromise) return loadingPromise;

  loadingPromise = (async () => {
    console.log('Loading WASM solver...');
    
    // Fetch the WASM binary
    const wasmResponse = await fetch('/wasm/phoodle_solver_bg.wasm');
    if (!wasmResponse.ok) {
      throw new Error(`Failed to fetch WASM: ${wasmResponse.status}`);
    }
    const wasmBytes = await wasmResponse.arrayBuffer();

    // Fetch the JS glue code
    const jsResponse = await fetch('/wasm/phoodle_solver.js');
    if (!jsResponse.ok) {
      throw new Error(`Failed to fetch WASM JS: ${jsResponse.status}`);
    }
    const jsCode = await jsResponse.text();

    // Create a blob URL for the JS module
    const blob = new Blob([jsCode], { type: 'application/javascript' });
    const blobUrl = URL.createObjectURL(blob);

    // Import the module
    const moduleImport = await import(/* @vite-ignore */ blobUrl);
    
    // Initialize with our WASM bytes
    await moduleImport.default({ module_or_path: wasmBytes });

    wasmModule = moduleImport as WasmModule;
    console.log('WASM loaded and initialized!');
    
    // Clean up blob URL
    URL.revokeObjectURL(blobUrl);
    
    return wasmModule;
  })();

  return loadingPromise;
}

/**
 * Create a new solver instance
 */
export async function createSolver(): Promise<WasmSolver> {
  const module = await loadWasm();
  return new module.PhoodleSolver();
}
