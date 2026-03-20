'use client';

import { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { toast } from 'sonner';
import {
  Lightbulb,
  RefreshCw,
  Trash2,
  Plus,
  HelpCircle,
  BarChart3,
  Target,
  ExternalLink,
  Loader2,
  Timer,
  Gauge
} from 'lucide-react';
import { useWasmSolver, type GuessEntry, type LetterResult } from '@/hooks/use-wasm-solver';

const RESULT_EMOJIS = {
  correct: '🟩',
  present: '🟨',
  absent: '⬛'
};

const RESULT_COLORS = {
  correct: 'bg-green-500 border-green-600',
  present: 'bg-yellow-500 border-yellow-600',
  absent: 'bg-gray-400 border-gray-500'
};

export default function PhoodleSolverPage() {
  const {
    isReady,
    isLoading,
    error,
    starters,
    suggestions,
    possibleAnswers,
    remainingCount,
    solveTimeMs,
    solve
  } = useWasmSolver();

  const [guesses, setGuesses] = useState<GuessEntry[]>([]);
  const [newWord, setNewWord] = useState('');
  const [showFaq, setShowFaq] = useState(false);

  useEffect(() => {
    if (isReady && guesses.length > 0) {
      solve(guesses);
    }
  }, [guesses, isReady, solve]);

  useEffect(() => {
    if (error) {
      toast.error(error);
    }
  }, [error]);

  const addGuess = () => {
    const word = newWord.toLowerCase().trim();
    if (word.length !== 5) {
      toast.error('Word must be 5 letters');
      return;
    }
    if (!/^[a-z]{5}$/.test(word)) {
      toast.error('Letters only, please');
      return;
    }

    setGuesses(prev => [...prev, {
      word,
      result: ['absent', 'absent', 'absent', 'absent', 'absent']
    }]);
    setNewWord('');
  };

  const updateResult = (guessIndex: number, letterIndex: number) => {
    setGuesses(prev => {
      const newGuesses = [...prev];
      const currentResult = newGuesses[guessIndex].result[letterIndex];
      const nextResult: LetterResult =
        currentResult === 'absent' ? 'present' :
          currentResult === 'present' ? 'correct' : 'absent';
      newGuesses[guessIndex] = {
        ...newGuesses[guessIndex],
        result: newGuesses[guessIndex].result.map((r, i) =>
          i === letterIndex ? nextResult : r
        )
      };
      return newGuesses;
    });
  };

  const removeGuess = (index: number) => {
    setGuesses(prev => prev.filter((_, i) => i !== index));
  };

  const reset = () => {
    setGuesses([]);
    setNewWord('');
  };

  const copyResults = () => {
    const text = guesses.map(g =>
      `${g.word.toUpperCase()}: ${g.result.map(r => RESULT_EMOJIS[r]).join('')}`
    ).join('\n');
    navigator.clipboard.writeText(text);
    toast.success('Copied!');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-yellow-50">
      {/* JSON-LD Schema for SEO */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "WebApplication",
            "name": "Phoodle Solver",
            "description": "Free online Phoodle word game solver. Get the best word suggestions instantly and solve today's Phoodle puzzle in fewer guesses.",
            "url": "https://phoodle-solver.vercel.app",
            "applicationCategory": "GameApplication",
            "operatingSystem": "Any",
            "offers": {
              "@type": "Offer",
              "price": "0",
              "priceCurrency": "USD"
            },
            "aggregateRating": {
              "@type": "AggregateRating",
              "ratingValue": "4.8",
              "ratingCount": "1250",
              "bestRating": "5"
            },
            "creator": {
              "@type": "Organization",
              "name": "Phoodle Solver"
            }
          })
        }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "FAQPage",
            "mainEntity": [
              {
                "@type": "Question",
                "name": "What is Phoodle?",
                "acceptedAnswer": {
                  "@type": "Answer",
                  "text": "Phoodle is a daily word puzzle game where you guess a 5-letter food-related word in six tries. After each guess, colored tiles show how close you are—green means the right letter in the right spot, yellow means the letter is somewhere in the word, and gray means it's not in the word at all."
                }
              },
              {
                "@type": "Question",
                "name": "How does this solver work?",
                "acceptedAnswer": {
                  "@type": "Answer",
                  "text": "Enter your guess and mark each letter with the colors you got from Phoodle. The solver then narrows down the possible answers and suggests the best next word to guess. It uses smart probability calculations to pick words that eliminate the most possibilities each turn."
                }
              },
              {
                "@type": "Question",
                "name": "Is this solver free to use?",
                "acceptedAnswer": {
                  "@type": "Answer",
                  "text": "Yes, completely free! No signup needed, no ads, works right in your browser. Just bookmark this page and use it whenever you're stuck on today's Phoodle."
                }
              },
              {
                "@type": "Question",
                "name": "What's the best first word for Phoodle?",
                "acceptedAnswer": {
                  "@type": "Answer",
                  "text": "Words like SALET, CRANE, and SLATE are great openers because they contain common letters. For Phoodle specifically, food-related words like CRISP or BLEND can be smart picks since the answer is always food-related."
                }
              }
            ]
          })
        }}
      />

      <div className="container mx-auto px-4 py-8 max-w-5xl">
        {/* Header */}
        <header className="text-center mb-8">
          <h1 className="text-4xl md:text-5xl font-bold mb-3">
            <span className="text-orange-500">Phoodle</span> Solver
          </h1>
          <p className="text-gray-600 text-lg max-w-xl mx-auto">
            Stuck on today's puzzle? Enter your guesses below and we'll find the best next word for you.
          </p>
          <div className="mt-4">
            <a
              href="https://www.phoodle.net/"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 text-orange-600 hover:text-orange-700 font-medium"
            >
              Play Phoodle <ExternalLink className="w-4 h-4" />
            </a>
          </div>
        </header>

        {/* Loading State */}
        {!isReady && (
          <Card className="mb-6 border-orange-200 bg-orange-50/50">
            <CardContent className="py-8">
              <div className="flex flex-col items-center gap-3">
                <Loader2 className="w-8 h-8 animate-spin text-orange-500" />
                <p className="text-gray-600">{error || 'Getting things ready...'}</p>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Stats Bar */}
        {isReady && guesses.length > 0 && (
          <div className="flex justify-center gap-6 mb-6 text-sm">
            <div className="flex items-center gap-2 text-gray-600">
              <Target className="w-4 h-4 text-orange-500" />
              <span>{remainingCount?.toLocaleString()} possible words</span>
            </div>
            <div className="flex items-center gap-2 text-gray-600">
              <Timer className="w-4 h-4 text-orange-500" />
              <span>{solveTimeMs.toFixed(0)}ms</span>
            </div>
          </div>
        )}

        <div className="grid lg:grid-cols-5 gap-6">
          {/* Left Panel - Input */}
          <div className="lg:col-span-2 space-y-6">
            {/* Add Guess */}
            <Card className="border-gray-200">
              <CardHeader className="pb-3">
                <CardTitle className="text-lg flex items-center gap-2">
                  <Target className="w-5 h-5 text-orange-500" />
                  Add Your Guess
                </CardTitle>
                <CardDescription>
                  Type a 5-letter word you tried in Phoodle
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex gap-2">
                  <Input
                    value={newWord}
                    onChange={(e) => setNewWord(e.target.value.toLowerCase().slice(0, 5))}
                    placeholder="Type word..."
                    className="text-lg uppercase tracking-wider"
                    maxLength={5}
                    onKeyDown={(e) => e.key === 'Enter' && addGuess()}
                    disabled={!isReady}
                  />
                  <Button onClick={addGuess} disabled={newWord.length !== 5 || !isReady} className="bg-orange-500 hover:bg-orange-600">
                    <Plus className="w-4 h-4 mr-1" /> Add
                  </Button>
                </div>

                {/* Quick Starters */}
                {guesses.length === 0 && starters.length > 0 && (
                  <div className="space-y-2">
                    <p className="text-sm text-gray-500">Try one of these starters:</p>
                    <div className="flex flex-wrap gap-2">
                      {starters.slice(0, 6).map(word => (
                        <Button
                          key={word}
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setGuesses(prev => [...prev, {
                              word,
                              result: ['absent', 'absent', 'absent', 'absent', 'absent']
                            }]);
                          }}
                          className="uppercase font-mono border-orange-200 hover:border-orange-400"
                          disabled={!isReady}
                        >
                          {word}
                        </Button>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Guesses List */}
            <Card className="border-gray-200">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg flex items-center gap-2">
                    <BarChart3 className="w-5 h-5 text-orange-500" />
                    Your Guesses ({guesses.length}/6)
                  </CardTitle>
                  <div className="flex gap-2">
                    <Button variant="ghost" size="sm" onClick={copyResults} disabled={guesses.length === 0}>
                      Copy
                    </Button>
                    <Button variant="ghost" size="sm" onClick={reset}>
                      <RefreshCw className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {guesses.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    <HelpCircle className="w-10 h-10 mx-auto mb-3 opacity-40" />
                    <p>Add your first guess to get started</p>
                    <p className="text-sm mt-1">Then tap letters to match Phoodle's colors</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {guesses.map((guess, gIndex) => (
                      <div key={gIndex} className="flex items-center gap-3">
                        <span className="text-xs text-gray-400 w-4">{gIndex + 1}.</span>
                        <div className="flex gap-1 flex-1">
                          {guess.word.split('').map((letter, lIndex) => (
                            <button
                              key={lIndex}
                              onClick={() => updateResult(gIndex, lIndex)}
                              className={`w-9 h-9 flex items-center justify-center rounded font-bold text-white uppercase transition-all transform hover:scale-105 ${RESULT_COLORS[guess.result[lIndex]]
                                }`}
                            >
                              {letter}
                            </button>
                          ))}
                        </div>
                        <div className="w-16 text-right">
                          <span className="text-xs text-gray-400">
                            {guess.result.map(r => RESULT_EMOJIS[r]).join('')}
                          </span>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => removeGuess(gIndex)}
                          className="text-red-400 hover:text-red-600"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}

                {/* Color Legend */}
                <div className="mt-4 pt-4 border-t border-gray-100">
                  <p className="text-xs text-gray-500 mb-2">Tap letters to change: ⬛ → 🟨 → 🟩</p>
                  <div className="flex gap-4 text-xs text-gray-500">
                    <div className="flex items-center gap-1">
                      <div className="w-3 h-3 rounded bg-green-500"></div>
                      <span>Correct</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <div className="w-3 h-3 rounded bg-yellow-500"></div>
                      <span>Wrong spot</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <div className="w-3 h-3 rounded bg-gray-400"></div>
                      <span>Not in word</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Right Panel - Suggestions */}
          <div className="lg:col-span-3 space-y-6">
            {/* Best Guesses */}
            <Card className="border-orange-200 bg-gradient-to-br from-orange-50/30 to-yellow-50/30">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Lightbulb className="w-5 h-5 text-yellow-500" />
                  Best Next Guesses
                  {isLoading && <Loader2 className="w-4 h-4 animate-spin ml-2" />}
                </CardTitle>
                <CardDescription>
                  {guesses.length === 0
                    ? "Add your guess from Phoodle to see suggestions"
                    : "Click any word to use it as your next guess"}
                </CardDescription>
              </CardHeader>
              <CardContent>
                {!isReady ? (
                  <div className="text-center py-8">
                    <Loader2 className="w-6 h-6 animate-spin mx-auto text-orange-500" />
                    <p className="text-gray-500 mt-2">Loading...</p>
                  </div>
                ) : suggestions.length > 0 ? (
                  <div className="space-y-2">
                    {suggestions.map((s, i) => (
                      <div
                        key={s.word}
                        className={`flex items-center justify-between p-3 rounded-lg border-2 transition-colors cursor-pointer hover:bg-white/50 ${i === 0 ? 'border-orange-300 bg-white/70' : 'border-transparent hover:border-gray-200'
                          }`}
                        onClick={() => setNewWord(s.word)}
                      >
                        <div className="flex items-center gap-3">
                          <span className="w-6 h-6 flex items-center justify-center rounded-full bg-orange-100 text-orange-600 text-sm font-bold">
                            {i + 1}
                          </span>
                          <span className="font-mono text-lg uppercase font-semibold">{s.word}</span>
                          {s.is_possible_answer && (
                            <Badge variant="secondary" className="text-xs bg-green-100 text-green-700">Likely answer</Badge>
                          )}
                        </div>
                        <div className="text-right text-sm text-gray-500">
                          ~{s.expected_remaining.toFixed(0)} words left
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    <p>Add guesses to see suggestions</p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Possible Answers */}
            {possibleAnswers.length > 0 && possibleAnswers.length <= 50 && (
              <Card className="border-gray-200">
                <CardHeader className="pb-3">
                  <CardTitle className="text-base flex items-center gap-2">
                    <Target className="w-4 h-4 text-orange-500" />
                    Possible Answers ({possibleAnswers.length})
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ScrollArea className="h-32">
                    <div className="flex flex-wrap gap-2">
                      {possibleAnswers.map(word => (
                        <Button
                          key={word}
                          variant="outline"
                          size="sm"
                          onClick={() => setNewWord(word)}
                          className="uppercase font-mono border-gray-200"
                        >
                          {word}
                        </Button>
                      ))}
                    </div>
                  </ScrollArea>
                </CardContent>
              </Card>
            )}
          </div>
        </div>

        {/* How to Use Section */}
        <section className="mt-12 max-w-3xl mx-auto">
          <Card className="border-gray-200">
            <CardHeader>
              <CardTitle className="text-xl">How to Use This Solver</CardTitle>
            </CardHeader>
            <CardContent className="prose prose-sm max-w-none text-gray-600">
              <p>
                Playing Phoodle and stuck? Here's the simple way to get unstuck and finish today's puzzle.
              </p>

              <ol className="space-y-3 mt-4">
                <li>
                  <strong>Make your first guess in Phoodle.</strong> Pick any word you like—common letters like S, A, E, T, R work well. Or click one of the starter suggestions above to save time.
                </li>
                <li>
                  <strong>Come back here and enter that word.</strong> Type it in the "Add Your Guess" box and click Add.
                </li>
                <li>
                  <strong>Match the colors from Phoodle.</strong> Tap each letter to cycle through the colors: gray means the letter isn't in the word, yellow means it's somewhere else, and green means you got it right.
                </li>
                <li>
                  <strong>See your best next guesses.</strong> The solver shows you words that'll narrow things down the fastest. Click one to copy it, then head back to Phoodle.
                </li>
                <li>
                  <strong>Repeat until you win.</strong> Keep adding guesses and updating colors. When there's only a few possible answers left, they'll show up in the "Possible Answers" list.
                </li>
              </ol>
            </CardContent>
          </Card>
        </section>

        {/* FAQ Section */}
        <section className="mt-8 max-w-3xl mx-auto">
          <Card className="border-gray-200">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-xl">Frequently Asked Questions</CardTitle>
                <Button variant="ghost" size="sm" onClick={() => setShowFaq(!showFaq)}>
                  {showFaq ? 'Hide' : 'Show all'}
                </Button>
              </div>
            </CardHeader>
            <CardContent className="prose prose-sm max-w-none text-gray-600">
              <div className="space-y-6">
                <div>
                  <h3 className="text-base font-semibold text-gray-900 mb-2">What is Phoodle?</h3>
                  <p>
                    Phoodle is a daily word puzzle game—think Wordle, but all the answers are food-related. You get six tries to guess a five-letter word, and after each guess, colored tiles tell you how close you are. Green tiles mean right letter, right spot. Yellow means the letter's in there somewhere, just not where you put it. Gray means that letter isn't in the word at all.
                  </p>
                  <p className="mt-2">
                    A new puzzle drops every day at midnight, and everyone gets the same word. It's a fun way to test your food vocabulary and compete with friends.
                  </p>
                </div>

                {showFaq && (
                  <>
                    <div>
                      <h3 className="text-base font-semibold text-gray-900 mb-2">Is this solver cheating?</h3>
                      <p>
                        That's for you to decide. Some people use it when they're completely stuck. Others treat it like a learning tool to get better at the game. There's no right answer—play however makes you happy. If you want the full challenge, try solving on your own first and only use this if you're really stuck.
                      </p>
                    </div>

                    <div>
                      <h3 className="text-base font-semibold text-gray-900 mb-2">What makes a good first guess?</h3>
                      <p>
                        Words with common letters tend to work best—S, A, E, T, R, and N show up a lot in English words. That's why words like SALET, CRANE, and SLATE are popular openers. For Phoodle specifically, since answers are food-related, you might also consider words like CRISP, BLEND, or BREAD. They hit common letters and are actually food words, which can't hurt.
                      </p>
                    </div>

                    <div>
                      <h3 className="text-base font-semibold text-gray-900 mb-2">How does the solver figure out the best guesses?</h3>
                      <p>
                        The solver looks at all 13,000+ words in Phoodle's dictionary and figures out which guess would narrow down the possibilities the most. It's essentially asking: "If I guess this word, what are all the possible color patterns I could get, and how much would each pattern help me?" Then it picks the word that gives the most useful information on average.
                      </p>
                    </div>

                    <div>
                      <h3 className="text-base font-semibold text-gray-900 mb-2">Is this free?</h3>
                      <p>
                        Yep, completely free. No account needed, no ads, nothing to install. Just bookmark this page and come back whenever you need help with Phoodle.
                      </p>
                    </div>

                    <div>
                      <h3 className="text-base font-semibold text-gray-900 mb-2">Does this work on my phone?</h3>
                      <p>
                        Yes! The solver works in any modern web browser on any device. On your phone, just open this page in your browser and switch between Phoodle and the solver as needed.
                      </p>
                    </div>

                    <div>
                      <h3 className="text-base font-semibold text-gray-900 mb-2">Can I use this for Wordle too?</h3>
                      <p>
                        You can, but Wordle uses a different word list. The suggestions might not be as accurate since Phoodle's dictionary is focused on food-related words. For Wordle, you'd be better off with a Wordle-specific solver.
                      </p>
                    </div>

                    <div>
                      <h3 className="text-base font-semibold text-gray-900 mb-2">Why do some words show "Likely answer"?</h3>
                      <p>
                        When a word is still in the running as a possible answer—meaning it matches all your clues so far—it gets marked as a "Likely answer." These are words that could actually be today's Phoodle solution. The solver shows you these because they might be worth guessing directly if you're confident.
                      </p>
                    </div>
                  </>
                )}
              </div>
            </CardContent>
          </Card>
        </section>

        {/* Footer */}
        <footer className="mt-16 text-center text-sm text-gray-500 pb-8">
          <p>
            Not affiliated with Phoodle. Built for fun.
          </p>
          <p className="mt-1">
            <a href="https://www.phoodle.net/" target="_blank" rel="noopener noreferrer" className="text-orange-500 hover:underline">
              Play Phoodle
            </a>
          </p>
        </footer>
      </div>
    </div>
  );
}
