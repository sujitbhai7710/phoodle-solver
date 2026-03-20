use wasm_bindgen::prelude::*;
use serde::{Serialize, Deserialize};

mod words;

// Embedded word data
const WORD_COUNT: usize = words::WORD_COUNT;
const WORD_DATA: &[u8] = words::WORD_DATA;
const FREQ_SCORES: &[u8] = words::FREQ_SCORES;

/// Get a word at a specific index
#[inline]
fn get_word(index: usize) -> &'static [u8; 5] {
    let start = index * 5;
    WORD_DATA[start..start + 5].try_into().unwrap()
}

/// Get frequency score for a word (0-255, higher = more common)
#[inline]
fn get_freq_score(index: usize) -> u8 {
    FREQ_SCORES[index]
}

/// Convert word bytes to lowercase string
fn word_to_string(word: &[u8; 5]) -> String {
    std::str::from_utf8(word).unwrap().to_string()
}

/// Calculate pattern as bit-packed integer (0-242)
#[inline]
fn calculate_pattern_bitpacked(guess: &[u8; 5], answer: &[u8; 5]) -> u8 {
    let mut result = [0u8; 5];
    let mut answer_chars = answer.clone();
    let mut guess_chars = guess.clone();
    
    // First pass: find correct positions (green = 2)
    for i in 0..5 {
        if guess_chars[i] == answer_chars[i] {
            result[i] = 2;
            answer_chars[i] = 0;
            guess_chars[i] = 1;
        }
    }
    
    // Second pass: find present letters (yellow = 1)
    for i in 0..5 {
        if guess_chars[i] == 1 {
            continue;
        }
        
        for j in 0..5 {
            if guess_chars[i] == answer_chars[j] {
                result[i] = 1;
                answer_chars[j] = 0;
                break;
            }
        }
    }
    
    // Pack into single integer (base-3)
    let mut packed: u8 = 0;
    for i in 0..5 {
        packed = packed * 3 + result[i];
    }
    
    packed
}

/// Parse result string to bit-packed integer
fn parse_result(input: &str) -> i16 {
    let cleaned = input.trim();
    let mut values: [u8; 5] = [0; 5];
    let mut idx = 0;
    
    for c in cleaned.chars() {
        if idx >= 5 {
            break;
        }
        
        let val = match c {
            '🟩' | '💚' => 2,
            '🟨' | '💛' => 1,
            '⬛' | '⬜' | '🖤' | '🤍' => 0,
            'G' | 'g' | '2' => 2,
            'Y' | 'y' | '1' => 1,
            'B' | 'b' | 'X' | 'x' | '0' => 0,
            _ => continue,
        };
        
        values[idx] = val;
        idx += 1;
    }
    
    if idx != 5 {
        return -1;
    }
    
    let mut packed: u8 = 0;
    for i in 0..5 {
        packed = packed * 3 + values[i];
    }
    
    packed as i16
}

/// Filter possible answers based on guesses
fn filter_answers(guesses: &[(String, u8)]) -> Vec<usize> {
    let mut possible: Vec<usize> = (0..WORD_COUNT).collect();
    
    for (guess_word, target_pattern) in guesses {
        let guess_bytes: [u8; 5] = guess_word.as_bytes().try_into().unwrap_or([0; 5]);
        
        possible.retain(|&idx| {
            let answer = get_word(idx);
            let pattern = calculate_pattern_bitpacked(&guess_bytes, answer);
            pattern == *target_pattern
        });
    }
    
    possible
}

/// Calculate entropy for a guess
fn calculate_entropy(guess: &[u8; 5], possible_indices: &[usize]) -> f64 {
    if possible_indices.len() <= 1 {
        return 0.0;
    }
    
    let mut pattern_counts = [0u32; 243];
    
    for &idx in possible_indices {
        let answer = get_word(idx);
        let pattern = calculate_pattern_bitpacked(guess, answer) as usize;
        pattern_counts[pattern] += 1;
    }
    
    let total = possible_indices.len() as f64;
    let mut entropy = 0.0;
    
    for &count in &pattern_counts {
        if count > 0 {
            let probability = count as f64 / total;
            entropy -= probability * probability.log2();
        }
    }
    
    entropy
}

/// Calculate expected remaining words
fn calculate_expected_remaining(guess: &[u8; 5], possible_indices: &[usize]) -> f64 {
    if possible_indices.len() <= 1 {
        return 0.0;
    }
    
    let mut pattern_counts = [0u32; 243];
    
    for &idx in possible_indices {
        let answer = get_word(idx);
        let pattern = calculate_pattern_bitpacked(guess, answer) as usize;
        pattern_counts[pattern] += 1;
    }
    
    let total = possible_indices.len() as f64;
    let mut expected = 0.0;
    
    for &count in &pattern_counts {
        if count > 0 {
            let probability = count as f64 / total;
            expected += probability * count as f64;
        }
    }
    
    expected
}

/// Combined score for sorting: entropy + frequency tiebreaker
/// When entropy is similar (within 0.1), prefer more common words
fn combined_sort_key(entropy: f64, freq_score: u8, is_possible: bool, remaining: usize) -> (i64, u8, bool) {
    // Scale entropy to integer for stable sorting (multiply by 1000)
    // When remaining words <= 20, we weight frequency more heavily
    let entropy_weight = if remaining <= 20 {
        // For small sets, use coarser entropy grouping (within 0.5 treated as equal)
        (entropy * 20.0) as i64
    } else {
        // For larger sets, use finer entropy grouping
        (entropy * 100.0) as i64
    };
    
    (entropy_weight, freq_score, is_possible)
}

/// Browser-safe timestamp for measuring solve duration in WASM.
#[inline]
fn now_ms() -> f64 {
    js_sys::Date::now()
}

// ============================================
// JavaScript Interface Types
// ============================================

#[derive(Serialize, Deserialize)]
pub struct Suggestion {
    pub word: String,
    pub entropy: f64,
    pub expected_remaining: f64,
    pub is_possible_answer: bool,
    pub freq_score: u8,
}

#[derive(Serialize, Deserialize)]
pub struct SolveResult {
    pub remaining_count: usize,
    pub possible_answers: Vec<String>,
    pub best_guesses: Vec<Suggestion>,
    pub solve_time_ms: f64,
}

// ============================================
// WASM Exports
// ============================================

#[wasm_bindgen]
pub struct PhoodleSolver {
    initialized: bool,
}

#[wasm_bindgen]
impl PhoodleSolver {
    #[wasm_bindgen(constructor)]
    pub fn new() -> Self {
        PhoodleSolver { initialized: true }
    }
    
    /// Get best starter words
    #[wasm_bindgen]
    pub fn get_starters(&self, count: usize) -> JsValue {
        // SALET is mathematically optimal (highest entropy ~4.2 bits)
        let optimal_starters = ["salet", "crane", "trace", "slate", "crate", "stare", "prate", "carle"];
        
        let mut starters: Vec<String> = optimal_starters
            .iter()
            .filter(|w| {
                (0..WORD_COUNT).any(|i| get_word(i) == w.as_bytes())
            })
            .map(|s| s.to_string())
            .collect();
        
        // If we need more, add high-frequency words
        if starters.len() < count {
            let mut scored: Vec<_> = (0..WORD_COUNT)
                .map(|i| (i, get_freq_score(i)))
                .collect();
            
            scored.sort_by(|a, b| b.1.cmp(&a.1));
            
            for (idx, _) in scored {
                let word_str = word_to_string(get_word(idx));
                if !starters.contains(&word_str) {
                    starters.push(word_str);
                }
                if starters.len() >= count {
                    break;
                }
            }
        }
        
        serde_wasm_bindgen::to_value(&starters).unwrap()
    }
    
    /// Solve and get best guesses
    #[wasm_bindgen]
    pub fn solve(&self, guesses: JsValue) -> JsValue {
        let start_ms = now_ms();
        
        // Parse guesses from JS
        let guesses_js: Vec<JsGuess> = match serde_wasm_bindgen::from_value(guesses) {
            Ok(g) => g,
            Err(_) => {
                return serde_wasm_bindgen::to_value(&SolveResult {
                    remaining_count: WORD_COUNT,
                    possible_answers: vec![],
                    best_guesses: vec![],
                    solve_time_ms: 0.0,
                }).unwrap();
            }
        };
        
        // Convert to internal format
        let parsed_guesses: Vec<(String, u8)> = guesses_js
            .iter()
            .filter_map(|g| {
                let pattern = parse_result(&g.result);
                if pattern >= 0 {
                    Some((g.word.to_lowercase(), pattern as u8))
                } else {
                    None
                }
            })
            .collect();
        
        // Filter possible answers
        let possible_indices = filter_answers(&parsed_guesses);
        let remaining_count = possible_indices.len();
        
        // Get possible answer strings
        let possible_answers: Vec<String> = possible_indices
            .iter()
            .take(50)
            .map(|&i| word_to_string(get_word(i)))
            .collect();
        
        // Find best guesses
        let best_guesses = if possible_indices.is_empty() {
            vec![]
        } else if possible_indices.len() == 1 {
            vec![Suggestion {
                word: word_to_string(get_word(possible_indices[0])),
                entropy: 0.0,
                expected_remaining: 0.0,
                is_possible_answer: true,
                freq_score: get_freq_score(possible_indices[0]),
            }]
        } else if possible_indices.len() <= 20 {
            // For small sets, prioritize common words when entropy is similar
            let mut results: Vec<Suggestion> = possible_indices
                .iter()
                .map(|&idx| {
                    let word = get_word(idx);
                    Suggestion {
                        word: word_to_string(word),
                        entropy: calculate_entropy(word, &possible_indices),
                        expected_remaining: calculate_expected_remaining(word, &possible_indices),
                        is_possible_answer: true,
                        freq_score: get_freq_score(idx),
                    }
                })
                .collect();
            
            // Sort by entropy, then by frequency as tiebreaker
            // For small sets, common words are prioritized more
            results.sort_by(|a, b| {
                let key_a = combined_sort_key(a.entropy, a.freq_score, a.is_possible_answer, remaining_count);
                let key_b = combined_sort_key(b.entropy, b.freq_score, b.is_possible_answer, remaining_count);
                key_b.cmp(&key_a)
            });
            
            results
        } else {
            // For larger sets, use hybrid approach
            let mut answer_scores: Vec<Suggestion> = possible_indices
                .iter()
                .map(|&idx| {
                    let word = get_word(idx);
                    Suggestion {
                        word: word_to_string(word),
                        entropy: calculate_entropy(word, &possible_indices),
                        expected_remaining: calculate_expected_remaining(word, &possible_indices),
                        is_possible_answer: true,
                        freq_score: get_freq_score(idx),
                    }
                })
                .collect();
            
            // Add exploration words
            let exploration_limit = std::cmp::min(500, WORD_COUNT);
            let possible_set: std::collections::HashSet<usize> = possible_indices.iter().cloned().collect();
            
            for i in 0..exploration_limit {
                if !possible_set.contains(&i) {
                    let word = get_word(i);
                    answer_scores.push(Suggestion {
                        word: word_to_string(word),
                        entropy: calculate_entropy(word, &possible_indices),
                        expected_remaining: calculate_expected_remaining(word, &possible_indices),
                        is_possible_answer: false,
                        freq_score: get_freq_score(i),
                    });
                }
            }
            
            // Sort by entropy with frequency tiebreaker
            answer_scores.sort_by(|a, b| {
                let key_a = combined_sort_key(a.entropy, a.freq_score, a.is_possible_answer, remaining_count);
                let key_b = combined_sort_key(b.entropy, b.freq_score, b.is_possible_answer, remaining_count);
                key_b.cmp(&key_a)
            });
            
            answer_scores.into_iter().take(10).collect()
        };
        
        let elapsed = now_ms() - start_ms;
        
        serde_wasm_bindgen::to_value(&SolveResult {
            remaining_count,
            possible_answers,
            best_guesses,
            solve_time_ms: elapsed,
        }).unwrap()
    }
    
    /// Get total word count
    #[wasm_bindgen]
    pub fn word_count(&self) -> usize {
        WORD_COUNT
    }
}

#[derive(Deserialize)]
struct JsGuess {
    word: String,
    result: String,
}

// Initialize the WASM module
#[wasm_bindgen(start)]
pub fn init() {
    // Always enable panic hook for better error messages
    console_error_panic_hook::set_once();
}
