// threeShot.engine.js
// 3 Shot Poker (engine) - ES module

// -----------------------------
// Pay Tables (configurable)
// -----------------------------
// Shots: Pay Table 2 (Grand Sierra per your note)
export const SHOT_PAY_TABLE_2 = {
  MINI_ROYAL: 50,
  STRAIGHT_FLUSH: 30,
  TRIPS: 20,
  STRAIGHT: 4,
  FLUSH: 2,
  PAIR: 1,
  LOSS: 0,
};

// 5 Shot: Pay Table 1 (Grand Sierra per your note)
export const FIVE_SHOT_PAY_TABLE_1 = {
  ROYAL_FLUSH: 500,
  STRAIGHT_FLUSH: 200,
  QUADS: 50,
  FULL_HOUSE: 40,
  FLUSH: 30,
  STRAIGHT: 20,
  TRIPS: 10,
  TWO_PAIR: 2,
  TENS_OR_BETTER: 1,
  LOSS: 0,
};

const SUITS = ["S", "H", "D", "C"];
const RANKS = ["2", "3", "4", "5", "6", "7", "8", "9", "T", "J", "Q", "K", "A"];
const RANK_VALUE = Object.fromEntries(RANKS.map((r, i) => [r, i + 2])); // 2..14

export function makeDeck() {
  const deck = [];
  for (const s of SUITS) for (const r of RANKS) deck.push({ r, s });
  return deck;
}

export function shuffle(deck, rng = Math.random) {
  for (let i = deck.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [deck[i], deck[j]] = [deck[j], deck[i]];
  }
  return deck;
}

export function cardToString(c) {
  return `${c.r}${c.s}`; // e.g. "AS", "TD"
}

// -----------------------------
// Hand evaluation helpers
// -----------------------------
function isFlush(cards) {
  return cards.every((c) => c.s === cards[0].s);
}

function rankCounts(cards) {
  const m = new Map();
  for (const c of cards) m.set(c.r, (m.get(c.r) || 0) + 1);
  return [...m.entries()].sort(
    (a, b) => b[1] - a[1] || RANK_VALUE[b[0]] - RANK_VALUE[a[0]],
  );
}

function sortedValues(cards) {
  return cards.map((c) => RANK_VALUE[c.r]).sort((a, b) => a - b);
}

function isStraightFromValues(vals) {
  // vals sorted asc
  // A-2-3-4-5 special case
  const wheel = [2, 3, 4, 5, 14];
  const isWheel = vals.length === 5 && vals.every((v, i) => v === wheel[i]);
  if (isWheel) return true;

  // generic consecutive
  for (let i = 1; i < vals.length; i++) {
    if (vals[i] !== vals[i - 1] + 1) return false;
  }
  return true;
}

function isStraight3(vals) {
  // vals sorted asc length=3
  // A-2-3 special case
  const a23 = [2, 3, 14];
  const isA23 = vals.every((v, i) => v === a23[i]);
  if (isA23) return true;

  return vals[1] === vals[0] + 1 && vals[2] === vals[1] + 1;
}

// -----------------------------
// 3-card evaluator (for shots)
// Categories needed:
// Mini royal (A K Q suited)
// Straight flush
// Trips
// Straight
// Flush
// Pair
// else loss
// -----------------------------
export function eval3ShotHand(cards3) {
  // cards3 length=3
  const flush = isFlush(cards3);
  const vals = sortedValues(cards3);
  const counts = rankCounts(cards3);
  const unique = counts.length;

  const ranksSet = new Set(cards3.map((c) => c.r));
  const isMiniRoyal =
    flush && ranksSet.has("A") && ranksSet.has("K") && ranksSet.has("Q");

  if (isMiniRoyal) return { name: "Mini royal", key: "MINI_ROYAL" };

  const straight = isStraight3(vals);
  if (straight && flush)
    return { name: "Straight flush", key: "STRAIGHT_FLUSH" };
  if (unique === 1) return { name: "Three of a kind", key: "TRIPS" };
  if (straight) return { name: "Straight", key: "STRAIGHT" };
  if (flush) return { name: "Flush", key: "FLUSH" };
  if (unique === 2) return { name: "Pair", key: "PAIR" };

  return { name: "No win", key: "LOSS" };
}

// -----------------------------
// 5-card evaluator (for 5 Shot)
// Categories needed:
// Royal flush
// Straight flush
// Quads
// Full house
// Flush
// Straight
// Trips
// Two pair
// Tens or better (one pair J/Q/K/A/T)
// else loss
// -----------------------------
export function eval5Hand(cards5) {
  const flush = isFlush(cards5);
  const vals = sortedValues(cards5);
  const straight = isStraightFromValues(vals);
  const counts = rankCounts(cards5); // [ [rank, count], ...] sorted

  // Royal flush: A K Q J T straight + flush
  const ranksSet = new Set(cards5.map((c) => c.r));
  const isRoyal =
    flush && ["A", "K", "Q", "J", "T"].every((r) => ranksSet.has(r));

  if (isRoyal) return { name: "Royal flush", key: "ROYAL_FLUSH" };
  if (straight && flush)
    return { name: "Straight flush", key: "STRAIGHT_FLUSH" };

  const pattern = counts
    .map((x) => x[1])
    .sort((a, b) => b - a)
    .join(",");
  if (pattern === "4,1") return { name: "Four of a kind", key: "QUADS" };
  if (pattern === "3,2") return { name: "Full house", key: "FULL_HOUSE" };
  if (flush) return { name: "Flush", key: "FLUSH" };
  if (straight) return { name: "Straight", key: "STRAIGHT" };
  if (pattern === "3,1,1") return { name: "Three of a kind", key: "TRIPS" };
  if (pattern === "2,2,1") return { name: "Two pair", key: "TWO_PAIR" };

  if (pattern === "2,1,1,1") {
    const pairRank = counts.find((x) => x[1] === 2)?.[0];
    const v = RANK_VALUE[pairRank];
    if (v >= 10) return { name: "Tens or better", key: "TENS_OR_BETTER" };
  }

  return { name: "No win", key: "LOSS" };
}

function clampInt(n, min, max) {
  n = Math.floor(Number(n));
  if (!Number.isFinite(n)) return min;
  return Math.max(min, Math.min(max, n));
}

// -----------------------------
// Game state + transitions
// -----------------------------
export function newThreeShotState({ balance = 1000, rng = Math.random } = {}) {
  return {
    game: "three-shot-poker",
    balance,
    rng,

    // bets
    bet1: 0,
    bet5: 0,
    bet2: 0,
    bet3: 0,

    // cards
    deck: [],
    hole: [],
    community: [],

    // phase
    phase: "BETTING", // BETTING -> DECISION -> REVEAL -> RESULT

    // results
    results: null,
    lastNet: 0,
    message: "Place your 1st Shot bet (and optional 5 Shot).",
  };
}

export function canBet(state) {
  return state.phase === "BETTING";
}

export function canDecide(state) {
  return state.phase === "DECISION";
}

export function canNewRound(state) {
  return state.phase === "RESULT";
}

export function startRound(state, { bet1, bet5 = 0 } = {}) {
  const deck = shuffle(makeDeck(), state.rng);
  const hole = [deck.pop(), deck.pop()];
  const community = [deck.pop(), deck.pop(), deck.pop()];

  return {
    ...state,
    bet1,
    bet5,
    bet2: 0,
    bet3: 0,
    deck,
    hole,
    community,
    phase: "DECISION",
    results: null,
    lastNet: 0,
    message: "Raise (adds 2nd + 3rd) or Fold.",
  };
}

export function playerFold(state) {
  if (!canDecide(state)) return state;

  // Folding forfeits 1st Shot wager already deducted; 5 Shot remains live
  return revealAndSettle(state, { raised: false });
}

export function playerRaise(state) {
  if (!canDecide(state)) return state;

  const needed = state.bet1 * 2; // bet2 + bet3 equal to bet1

  return revealAndSettle(
    {
      ...state,
      bet2: state.bet1,
      bet3: state.bet1,
    },
    { raised: true },
  );
}

function payoutToOne(bet, mult) {
  // “to one” basis: profit = bet*mult; total return = bet + profit
  if (mult <= 0) return 0;
  return bet * mult + bet;
}

function settleShots({ bet1, bet2, bet3, hole, community }) {
  const hands = [
    { label: "1st Shot", bet: bet1, cards: [hole[0], hole[1], community[0]] },
    { label: "2nd Shot", bet: bet2, cards: [hole[0], hole[1], community[1]] },
    { label: "3rd Shot", bet: bet3, cards: [hole[0], hole[1], community[2]] },
  ];

  const shotOutcomes = hands.map((h) => {
    if (!h.bet) {
      return { ...h, eval: { name: "No bet", key: "LOSS" }, mult: 0, win: 0 };
    }
    const ev = eval3ShotHand(h.cards);
    const mult = SHOT_PAY_TABLE_2[ev.key] ?? 0;
    const win = payoutToOne(h.bet, mult);
    return { ...h, eval: ev, mult, win };
  });

  return shotOutcomes;
}

function settleFiveShot({ bet5, hole, community }) {
  if (!bet5) {
    return { bet: 0, eval: { name: "No bet", key: "LOSS" }, mult: 0, win: 0 };
  }
  const cards5 = [hole[0], hole[1], community[0], community[1], community[2]];
  const ev = eval5Hand(cards5);
  const mult = FIVE_SHOT_PAY_TABLE_1[ev.key] ?? 0;
  const win = payoutToOne(bet5, mult);
  return { bet: bet5, cards: cards5, eval: ev, mult, win };
}

function revealAndSettle(state, { raised }) {
  const shots = settleShots(state);
  const five = settleFiveShot(state);

  const totalReturn = shots.reduce((a, x) => a + x.win, 0) + five.win;
  const totalWagered = state.bet1 + state.bet2 + state.bet3 + state.bet5;

  // Net change relative to *start of round* is (totalReturn - totalWagered),
  // but we already deducted wagers from balance, so we just add returns now:

  const lastNet = totalReturn - totalWagered;

  const results = {
    raised,
    shots,
    five,
    totalWagered,
    totalReturn,
    lastNet,
  };

  return {
    ...state,
    phase: "RESULT",
    results,
    lastNet,
    message:
      lastNet >= 0 ? `You won ${lastNet}.` : `You lost ${Math.abs(lastNet)}.`,
  };
}

export function nextRound(state) {
  if (!canNewRound(state)) return state;
  return {
    ...state,
    bet1: 0,
    bet2: 0,
    bet3: 0,
    bet5: 0,
    deck: [],
    hole: [],
    community: [],
    phase: "BETTING",
    results: null,
    lastNet: 0,
    message: "Place your 1st Shot bet (and optional 5 Shot).",
  };
}
