// games/caribbeanstud/caribbeanstud.engine.js
import { eval5, compareEval5 } from "../../core/eval5.js";

const SUITS = ["S", "H", "D", "C"];
const RANKS = ["2", "3", "4", "5", "6", "7", "8", "9", "T", "J", "Q", "K", "A"];

// Caribbean Stud Call payout table (multiplier on CALL bet only)
export const CALL_PAY_TABLE = {
  RF: 100, // Royal Flush
  SF: 50, // Straight Flush
  FK: 20, // Four of a Kind
  FH: 7, // Full House
  FL: 5, // Flush
  ST: 4, // Straight
  TK: 3, // Three of a Kind
  "2P": 2, // Two Pair
  PR: 1, // One Pair
  HI: 1, // High Card (only if player wins)
};

// Dealer qualifies with Ace-King high or better
export function dealerQualifies(dealerHand) {
  const e = eval5(dealerHand);

  // Any pair or better qualifies
  if (e.code !== "HI") return true;

  // High-card qualifies if >= A-K
  // In eval5: HI vec is [1, v1, v2, v3, v4, v5] descending ranks
  // Need top card Ace (14) and second card King (13) or better
  const v = e.vec;
  const top = v[1] ?? 0;
  const second = v[2] ?? 0;
  return top === 14 && second >= 13;
}

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

export function deal(deck, n) {
  return deck.splice(0, n);
}

export function newCaribbeanStudRound({ rng = Math.random } = {}) {
  const deck = shuffle(makeDeck(), rng);
  const playerHand = deal(deck, 5);
  const dealerHand = deal(deck, 5);

  return {
    deck, // remaining if you want; not required for single-hand game
    playerHand,
    dealerHand,
    stage: "DECISION", // DECISION -> REVEAL
  };
}

/**
 * action: "FOLD" | "CALL"
 * ante: integer
 * returns settlement object with balance delta (net)
 */
export function settleCaribbeanStud({ round, action, ante }) {
  const callBet = action === "CALL" ? ante * 2 : 0;

  const playerEval = eval5(round.playerHand);
  const dealerEval = eval5(round.dealerHand);

  if (action === "FOLD") {
    return {
      outcome: "FOLD",
      dealerQualified: null,
      playerEval,
      dealerEval,
      anteWin: -ante,
      callWin: 0,
      net: -ante,
    };
  }

  const qualified = dealerQualifies(round.dealerHand);

  // If dealer does not qualify: ante wins 1:1, call pushes
  if (!qualified) {
    return {
      outcome: "DEALER_NO_QUALIFY",
      dealerQualified: false,
      playerEval,
      dealerEval,
      anteWin: +ante, // win 1:1 on ante
      callWin: 0, // call pushes (returned)
      net: +ante,
    };
  }

  // Dealer qualifies: compare hands
  const cmp = compareEval5(playerEval, dealerEval);

  if (cmp > 0) {
    // player wins
    const mult = CALL_PAY_TABLE[playerEval.code] ?? 1;
    const callWin = callBet * mult; // win amount on CALL bet
    return {
      outcome: "PLAYER_WIN",
      dealerQualified: true,
      playerEval,
      dealerEval,
      callMultiplier: mult,
      anteWin: +ante,
      callWin: +callWin,
      net: ante + callWin,
    };
  }

  if (cmp < 0) {
    // dealer wins: lose both
    return {
      outcome: "DEALER_WIN",
      dealerQualified: true,
      playerEval,
      dealerEval,
      anteWin: -ante,
      callWin: -callBet,
      net: -(ante + callBet),
    };
  }

  // tie: push both
  return {
    outcome: "PUSH",
    dealerQualified: true,
    playerEval,
    dealerEval,
    anteWin: 0,
    callWin: 0,
    net: 0,
  };
}

export function formatHandName(code) {
  const names = {
    RF: "Royal Flush",
    SF: "Straight Flush",
    FK: "Four of a Kind",
    FH: "Full House",
    FL: "Flush",
    ST: "Straight",
    TK: "Three of a Kind",
    "2P": "Two Pair",
    PR: "One Pair",
    HI: "High Card",
  };
  return names[code] ?? code;
}
