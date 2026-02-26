// aroundtheworld.engine.js

function clampInt(n, min, max) {
  n = Math.floor(Number(n));
  if (!Number.isFinite(n)) return min;
  return Math.max(min, Math.min(max, n));
}

function randInt(rng, a, b) { // inclusive
  return a + Math.floor(rng() * (b - a + 1));
}

function weightedPick(rng, items) {
  // items: [{type, weight, ...}]
  const total = items.reduce((s, x) => s + x.weight, 0);
  let r = rng() * total;
  for (const it of items) {
    r -= it.weight;
    if (r <= 0) return it;
  }
  return items[items.length - 1];
}

// payouts (FOR-ONE) based on "bet at beginning of level"
export const LEVEL_WIN_MULT = {
  1: 2.5,
  2: 3.0,
  3: 3.5,
  4: 4.0,
};

export function newATWState({ rng = Math.random } = {}) {
  return {
    game: "around-the-world",
    rng,

    phase: "BETTING", // BETTING -> PLAYING -> LEVEL_END -> GAME_OVER -> CASHED
    message: "Place your wager to start Around the World.",

    wager: 0,              // initial wager (level 1 bet)
    level: 1,              // 1..4
    step: 1,               // 1..7
    strikes: 0,            // strikes in current level (0..2)
    prevNumber: null,      // last number drawn (1..49)

    // the amount risked at the beginning of the CURRENT level
    levelBet: 0,

    // last outcome for UI
    lastGuess: null,       // "HIGHER"/"LOWER"/null
    lastDraw: null,        // { kind:"NUMBER", value:n } | { kind:"ADVANCE_ONE" } | ...
    lastWasCorrect: null,  // boolean|null

    // history
    log: [],
  };
}

export function startGame(state, wager) {
  wager = clampInt(wager, 1, 1_000_000_000);

  // Step 1 draw: uniform 1..49
  const first = randInt(state.rng, 1, 49);

  return {
    ...state,
    phase: "PLAYING",
    message: "Guess HIGHER or LOWER.",
    wager,
    level: 1,
    step: 1,
    strikes: 0,
    prevNumber: first,
    levelBet: wager,
    lastGuess: null,
    lastDraw: { kind: "NUMBER", value: first },
    lastWasCorrect: null,
    log: [{ t: "LEVEL_START", level: 1, number: first }],
  };
}

function buildOutcomeSpace(state) {
  // Only called when step > 1 in a level
  const items = [];

  // numbers: 1..49 except prevNumber
  for (let n = 1; n <= 49; n++) {
    if (n === state.prevNumber) continue;
    items.push({ kind: "NUMBER", value: n, weight: 2 });
  }

  // special outcomes:
  items.push({ kind: "ADVANCE_ONE", weight: 2 });      // normal weight
  items.push({ kind: "ADVANCE_END", weight: 1 });      // half probability
  if (state.strikes === 1) items.push({ kind: "STRIKE_REMOVED", weight: 1 }); // half probability

  return items;
}

function isGuessCorrect(prev, next, guess) {
  // tie never happens by rule
  if (guess === "HIGHER") return next > prev;
  if (guess === "LOWER") return next < prev;
  return false;
}

function advanceStep(state, toStep) {
  return { ...state, step: toStep };
}

function endLevelIfNeeded(state) {
  if (state.step < 7) return state;

  // End of level reached
  const strikes = state.strikes;

  // Level 1 special: if reach end w/ 1 strike -> push (wager back)
  // BUT your rules say wager is never returned globally, except this special push.
  // We'll represent push as: payout = levelBet (i.e., return that levelBet), not profit.
  // However: this conflicts with "for-one basis" statement; your rule explicitly says "effectively pushing".
  // We'll treat it as a special case: credit +levelBet and mark as PUSH.
  // If you'd rather treat it as 0 profit (no return), tell me and I’ll flip it.

  let outcome = { type: "LEVEL_END", level: state.level, strikes };
  return {
    ...state,
    phase: "LEVEL_END",
    message: `Level ${state.level} complete with ${strikes} strike(s). Cash out or continue.`,
    log: [...state.log, outcome],
  };
}

export function guessHigherLower(state, guess /* "HIGHER"|"LOWER" */) {
  if (state.phase !== "PLAYING") return state;
  if (state.step === 7) return state;

  const nextStep = state.step + 1;

  // step 1 of a level: the first number is already set; next turn is step 2 and includes specials
  const items = buildOutcomeSpace(state);
  const draw = weightedPick(state.rng, items);

  // resolve outcome
  let nextState = { ...state, lastGuess: guess, lastDraw: draw, lastWasCorrect: null };

  if (draw.kind === "NUMBER") {
    const correct = isGuessCorrect(state.prevNumber, draw.value, guess);
    nextState.lastWasCorrect = correct;

    const strikes = correct ? state.strikes : state.strikes + 1;
    nextState = {
      ...nextState,
      strikes,
      prevNumber: draw.value,
      step: nextStep,
      log: [...nextState.log, { t:"DRAW", step: nextStep, draw, guess, correct, strikes }],
    };

    if (strikes >= 2) {
      return {
        ...nextState,
        phase: "GAME_OVER",
        message: `Two strikes. Game over.`,
        log: [...nextState.log, { t:"GAME_OVER", reason:"TWO_STRIKES" }],
      };
    }

    return endLevelIfNeeded(nextState);
  }

  if (draw.kind === "ADVANCE_ONE") {
    // move to next step, number stays the same unless we reach step 7 (rule 9)
    const reachedEnd = nextStep === 7;
    nextState = {
      ...nextState,
      step: nextStep,
      log: [...nextState.log, { t:"SPECIAL", step: nextStep, draw }],
    };
    if (reachedEnd) {
      // at step 7 we don't care about preserving prevNumber anymore
      return endLevelIfNeeded(nextState);
    }
    return nextState;
  }

  if (draw.kind === "ADVANCE_END") {
    nextState = {
      ...nextState,
      step: 7,
      log: [...nextState.log, { t:"SPECIAL", step: 7, draw }],
    };
    return endLevelIfNeeded(nextState);
  }

  if (draw.kind === "STRIKE_REMOVED") {
    nextState = {
      ...nextState,
      strikes: 0,
      log: [...nextState.log, { t:"SPECIAL", step: state.step, draw }],
    };
    // does not advance step
    return nextState;
  }

  return nextState;
}

export function beginNextLevel(state, nextLevelBet) {
  // called from UI after player chooses "continue" and places bet in store
  if (state.phase !== "LEVEL_END") return state;
  if (state.level >= 4) return state;

  const level = state.level + 1;
  const first = randInt(state.rng, 1, 49);

  return {
    ...state,
    phase: "PLAYING",
    message: "Guess HIGHER or LOWER.",
    level,
    step: 1,
    strikes: 0,
    prevNumber: first,
    levelBet: nextLevelBet,
    lastGuess: null,
    lastDraw: { kind: "NUMBER", value: first },
    lastWasCorrect: null,
    log: [...state.log, { t:"LEVEL_START", level, number: first, levelBet: nextLevelBet }],
  };
}

export function cashOut(state) {
  if (state.phase !== "LEVEL_END") return state;
  return { ...state, phase: "CASHED", message: "Cashed out." };
}