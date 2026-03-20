/* tslint:disable */
/* eslint-disable */

export class PhoodleSolver {
    free(): void;
    [Symbol.dispose](): void;
    /**
     * Get best starter words
     */
    get_starters(count: number): any;
    constructor();
    /**
     * Solve and get best guesses
     */
    solve(guesses: any): any;
    /**
     * Get total word count
     */
    word_count(): number;
}

export function init(): void;

export type InitInput = RequestInfo | URL | Response | BufferSource | WebAssembly.Module;

export interface InitOutput {
    readonly memory: WebAssembly.Memory;
    readonly __wbg_phoodlesolver_free: (a: number, b: number) => void;
    readonly init: () => void;
    readonly phoodlesolver_get_starters: (a: number, b: number) => number;
    readonly phoodlesolver_new: () => number;
    readonly phoodlesolver_solve: (a: number, b: number) => number;
    readonly phoodlesolver_word_count: (a: number) => number;
    readonly __wbindgen_export: (a: number, b: number) => number;
    readonly __wbindgen_export2: (a: number, b: number, c: number, d: number) => number;
    readonly __wbindgen_export3: (a: number) => void;
    readonly __wbindgen_start: () => void;
}

export type SyncInitInput = BufferSource | WebAssembly.Module;

/**
 * Instantiates the given `module`, which can either be bytes or
 * a precompiled `WebAssembly.Module`.
 *
 * @param {{ module: SyncInitInput }} module - Passing `SyncInitInput` directly is deprecated.
 *
 * @returns {InitOutput}
 */
export function initSync(module: { module: SyncInitInput } | SyncInitInput): InitOutput;

/**
 * If `module_or_path` is {RequestInfo} or {URL}, makes a request and
 * for everything else, calls `WebAssembly.instantiate` directly.
 *
 * @param {{ module_or_path: InitInput | Promise<InitInput> }} module_or_path - Passing `InitInput` directly is deprecated.
 *
 * @returns {Promise<InitOutput>}
 */
export default function __wbg_init (module_or_path?: { module_or_path: InitInput | Promise<InitInput> } | InitInput | Promise<InitInput>): Promise<InitOutput>;
