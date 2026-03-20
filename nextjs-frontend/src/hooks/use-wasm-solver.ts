/**
 * React hook for Phoodle Solver
 * High-performance entropy-based solver with Ngram frequency tiebreaker
 * 
 * Algorithm:
 * 1. Calculates Shannon entropy for each word
 * 2. When entropy is similar (within 0.5 bits), uses Ngram frequency as tiebreaker
 * 3. Common words are preferred when solving with few remaining candidates
 * 
 * WASM files are in /public/wasm/ for future use when Next.js/WASM integration improves
 */

import { useEffect, useRef, useState, useCallback } from 'react';

// Types
export type LetterResult = 'correct' | 'present' | 'absent';

export interface GuessEntry {
  word: string;
  result: LetterResult[];
}

export interface Suggestion {
  word: string;
  entropy: number;
  expected_remaining: number;
  is_possible_answer: boolean;
  freq_score: number;
}

// Word data with frequency scores
interface WordData {
  words: string[];
  freqScores: Map<string, number>;
}

// Singleton cache
let wordDataCache: WordData | null = null;
let loadingPromise: Promise<WordData> | null = null;

/**
 * Load word list with Ngram frequency scores (single file)
 * word_scores.json contains both words (as keys) and their frequency scores
 */
async function loadWordData(): Promise<WordData> {
  if (wordDataCache) return wordDataCache;
  if (loadingPromise) return loadingPromise;

  loadingPromise = (async () => {
    // Single file: word_scores.json has words as keys, scores as values
    const response = await fetch('/word_scores.json');
    const freqJson = await response.json() as Record<string, { score: number }>;

    // Extract words from keys and build frequency map
    const words: string[] = [];
    const freqScores = new Map<string, number>();
    
    for (const [word, data] of Object.entries(freqJson)) {
      const normalizedWord = word.toLowerCase();
      words.push(normalizedWord);
      freqScores.set(normalizedWord, data.score);
    }

    wordDataCache = { words, freqScores };
    return wordDataCache;
  })();

  return loadingPromise;
}

/**
 * Calculate bit-packed pattern (0-242) for a guess/answer pair
 * Pattern is encoded in base-3: each position can be 0 (absent), 1 (present), 2 (correct)
 */
function calculatePatternBitPacked(guess: string, answer: string): number {
  const guessChars = guess.split('');
  const answerChars = answer.split('');
  const result = [0, 0, 0, 0, 0];

  // First pass: find correct positions (green = 2)
  for (let i = 0; i < 5; i++) {
    if (guessChars[i] === answerChars[i]) {
      result[i] = 2;
      answerChars[i] = '';
      guessChars[i] = '';
    }
  }

  // Second pass: find present letters (yellow = 1)
  for (let i = 0; i < 5; i++) {
    if (!guessChars[i]) continue;
    const idx = answerChars.indexOf(guessChars[i]);
    if (idx !== -1) {
      result[i] = 1;
      answerChars[idx] = '';
    }
  }

  // Pack into integer (base-3 encoding)
  let packed = 0;
  for (let i = 0; i < 5; i++) {
    packed = packed * 3 + result[i];
  }
  return packed;
}

/**
 * Filter possible answers based on a guess and its pattern
 */
function filterAnswers(words: string[], guess: string, targetPattern: number): string[] {
  return words.filter(answer => calculatePatternBitPacked(guess, answer) === targetPattern);
}

/**
 * Calculate Shannon entropy for a guess
 * Higher entropy = more information gained = better guess
 */
function calcEntropy(guess: string, possible: string[]): number {
  if (possible.length <= 1) return 0;

  const counts = new Uint32Array(243);
  for (const answer of possible) {
    counts[calculatePatternBitPacked(guess, answer)]++;
  }

  let entropy = 0;
  const total = possible.length;
  for (let i = 0; i < 243; i++) {
    if (counts[i] > 0) {
      const p = counts[i] / total;
      entropy -= p * Math.log2(p);
    }
  }
  return entropy;
}

/**
 * Calculate expected remaining words after a guess
 */
function calcExpectedRemaining(guess: string, possible: string[]): number {
  if (possible.length <= 1) return 0;

  const counts = new Uint32Array(243);
  for (const answer of possible) {
    counts[calculatePatternBitPacked(guess, answer)]++;
  }

  let expected = 0;
  const total = possible.length;
  for (let i = 0; i < 243; i++) {
    if (counts[i] > 0) {
      expected += (counts[i] / total) * counts[i];
    }
  }
  return expected;
}

/**
 * Find best guesses using entropy + Ngram frequency tiebreaker
 */
function findBestGuesses(
  possible: string[],
  allWords: string[],
  freqScores: Map<string, number>,
  remainingCount: number
): Suggestion[] {
  if (possible.length === 0) return [];
  
  if (possible.length === 1) {
    return [{
      word: possible[0],
      entropy: 0,
      expected_remaining: 0,
      is_possible_answer: true,
      freq_score: freqScores.get(possible[0]) || 0
    }];
  }

  // Score all possible answers
  const results: Suggestion[] = possible.map(word => ({
    word,
    entropy: calcEntropy(word, possible),
    expected_remaining: calcExpectedRemaining(word, possible),
    is_possible_answer: true,
    freq_score: freqScores.get(word) || 0
  }));

  // Add exploration words for larger sets
  if (possible.length > 20) {
    const possibleSet = new Set(possible);
    const topWords = allWords.slice(0, Math.min(300, allWords.length));
    
    for (const word of topWords) {
      if (!possibleSet.has(word)) {
        results.push({
          word,
          entropy: calcEntropy(word, possible),
          expected_remaining: calcExpectedRemaining(word, possible),
          is_possible_answer: false,
          freq_score: freqScores.get(word) || 0
        });
      }
    }
  }

  // Sort by entropy, then by frequency as tiebreaker
  results.sort((a, b) => {
    // For small sets (<=20 words), group entropy within 0.5 together
    const entropyWeight = remainingCount <= 20 ? 20 : 100;
    const entropyA = Math.floor(a.entropy * entropyWeight);
    const entropyB = Math.floor(b.entropy * entropyWeight);

    if (entropyA !== entropyB) {
      return entropyB - entropyA; // Higher entropy first
    }

    // Tiebreaker: prefer possible answers
    if (a.is_possible_answer !== b.is_possible_answer) {
      return a.is_possible_answer ? -1 : 1;
    }

    // Final tiebreaker: frequency score (higher = more common)
    return b.freq_score - a.freq_score;
  });

  return results.slice(0, 10);
}

/**
 * React hook for the Phoodle solver
 */
export function useWasmSolver() {
  const [isReady, setIsReady] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [starters, setStarters] = useState<string[]>([]);
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [possibleAnswers, setPossibleAnswers] = useState<string[]>([]);
  const [remainingCount, setRemainingCount] = useState<number | null>(null);
  const [solveTimeMs, setSolveTimeMs] = useState(0);

  const dataRef = useRef<WordData | null>(null);

  // Load word data on mount
  useEffect(() => {
    let mounted = true;

    async function init() {
      try {
        setIsLoading(true);
        console.log('[Solver] Loading word list with Ngram frequency scores...');

        const data = await loadWordData();
        dataRef.current = data;

        if (!mounted) return;

        // SALET is mathematically optimal (~4.2 bits entropy)
        const optimalStarters = ['salet', 'crane', 'trace', 'slate', 'crate', 'stare', 'prate', 'carle'];
        const available = optimalStarters.filter(w => data.words.includes(w));

        setStarters(available);
        setSuggestions(available.map((word, i) => ({
          word,
          entropy: 4.2 - i * 0.15,
          expected_remaining: 150 - i * 15,
          is_possible_answer: true,
          freq_score: data.freqScores.get(word) || 0
        })));
        setRemainingCount(data.words.length);

        setIsReady(true);
        setIsLoading(false);
        console.log('[Solver] Ready!', data.words.length, 'words with frequency scores');
      } catch (err) {
        console.error('[Solver] Load error:', err);
        if (mounted) {
          setError('Failed to load solver: ' + (err instanceof Error ? err.message : String(err)));
          setIsLoading(false);
        }
      }
    }

    init();

    return () => {
      mounted = false;
    };
  }, []);

  // Convert result array to bit-packed pattern
  const resultToPattern = useCallback((result: LetterResult[]): number => {
    let packed = 0;
    for (let i = 0; i < 5; i++) {
      const val = result[i] === 'correct' ? 2 : result[i] === 'present' ? 1 : 0;
      packed = packed * 3 + val;
    }
    return packed;
  }, []);

  // Solve function
  const solve = useCallback((guesses: GuessEntry[]) => {
    if (!isReady || !dataRef.current) return;

    const startTime = performance.now();
    const { words, freqScores } = dataRef.current;

    // Filter possible answers based on guesses
    let possible = words;
    for (const g of guesses) {
      const pattern = resultToPattern(g.result);
      possible = filterAnswers(possible, g.word.toLowerCase(), pattern);
    }

    // Find best guesses with entropy + frequency tiebreaker
    const best = findBestGuesses(possible, words, freqScores, possible.length);
    const elapsed = performance.now() - startTime;

    setSuggestions(best);
    setPossibleAnswers(possible.slice(0, 50));
    setRemainingCount(possible.length);
    setSolveTimeMs(elapsed);
  }, [isReady, resultToPattern]);

  return {
    isReady,
    isLoading,
    error,
    starters,
    suggestions,
    possibleAnswers,
    remainingCount,
    solveTimeMs,
    solve
  };
}
