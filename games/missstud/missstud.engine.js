// games/missstud/missstud.engine.js
import { makeDeck, shuffle } from "../../core/cards.js";

export function newMissStudState() {
  return {
    phase: "BETTING", // BETTING -> STREET3 -> STREET4 -> STREET5 -> RESOLVED
    deck: [],
    hole: [], // 2 cards
    community: [], // 3 face-down then revealed 1 by 1
    revealed: 0, // 0..3
    ante: 0,
    street3: 0,
    street4: 0,
    street5: 0,
    bonus3: 0, // optional 3-card bonus wager
    folded: false,
    result: null, // final settlement object
  };
}

export function startHand(state, { ante, bonus3 = 0 }) {
  const deck = shuffle(makeDeck());
  state.deck = deck;

  state.hole = [deck.pop(), deck.pop()];
  state.community = [deck.pop(), deck.pop(), deck.pop()];
  state.revealed = 0;

  state.ante = ante;
  state.street3 = 0;
  state.street4 = 0;
  state.street5 = 0;
  state.bonus3 = bonus3;

  state.folded = false;
  state.phase = "STREET3";
  state.result = null;

  return state;
}

export function canBetStreet(state) {
  if (state.folded) return { ok: false, min: 0, max: 0 };
  if (
    state.phase === "STREET3" ||
    state.phase === "STREET4" ||
    state.phase === "STREET5"
  ) {
    return { ok: true, min: 1, max: 3 }; // per rules: each street bet is 1x to 3x Ante
  }
  return { ok: false, min: 0, max: 0 };
}

export function revealNext(state) {
  if (state.revealed >= 3) return state;
  state.revealed += 1;

  if (state.revealed === 1) state.phase = "STREET4";
  else if (state.revealed === 2) state.phase = "STREET5";
  else if (state.revealed === 3) state.phase = "SHOWDOWN";

  return state;
}

export function placeStreetBet(state, street, mult) {
  const m = Number(mult);
  if (![1, 2, 3].includes(m))
    throw new Error("Street bet must be 1x, 2x, or 3x ante.");

  const amt = state.ante * m;

  if (street === 3 && state.phase === "STREET3") state.street3 = amt;
  else if (street === 4 && state.phase === "STREET4") state.street4 = amt;
  else if (street === 5 && state.phase === "STREET5") state.street5 = amt;
  else throw new Error("Wrong street / phase.");

  // after betting, reveal the next community card
  revealNext(state);
  return state;
}

export function fold(state) {
  state.folded = true;
  state.phase = "RESOLVED";
  state.result = {
    outcome: "FOLD",
    payoutMain: 0,
    payoutBonus: 0,
    detail: "Folded. All bets lose.",
  };
  return state;
}

// Evaluate the main hand vs paytable (not vs dealer).
// Win condition: Pair of Jacks or better; pairs of 6-10 push.
export function settle(state, paytable, bonus3table) {
  if (state.folded) return state;

  // ensure all community revealed
  while (state.revealed < 3) revealNext(state);

  const hand5 = [...state.hole, ...state.community]; // 5 cards
  // evaluateMissStud5 should return { rankKey, handName }
  const best = evaluateMissStud5(hand5);

  const main = scoreMain(best, paytable);
  const bonus = score3CardBonus(state.community, bonus3table);

  const totalMainBets =
    state.ante + state.street3 + state.street4 + state.street5;

  // “It pays on all bets” (main paytable multiplier applies to ante + all street bets).
  const payoutMain = main.type === "LOSE" ? 0 : main.mult * totalMainBets;

  // Push = return stake (no profit). We handle that in UI/store settlement as returnedStake.
  // Here we just report outcomes.
  state.phase = "RESOLVED";
  state.result = {
    best,
    main,
    bonus,
    totalMainBets,
    payoutMain, // profit if WIN; 0 if PUSH/LOSE (we’ll use returnedStake for PUSH)
    payoutBonus: bonus.win ? bonus.mult * state.bonus3 : 0,
  };

  return state;
}

function scoreMain(best, paytable) {
  // paytable keys should include:
  // ROYAL_FLUSH, STRAIGHT_FLUSH, FOUR_KIND, FULL_HOUSE, FLUSH, STRAIGHT, THREE_KIND, TWO_PAIR,
  // PAIR_JACKS_PLUS, PAIR_6_TO_10_PUSH, OTHER
  const k = best.rankKey;
  if (k === "PAIR_6_TO_10")
    return { type: "PUSH", mult: 0, label: "Pair (6–10) Push" };
  if (k === "PAIR_JACKS_PLUS")
    return { type: "WIN", mult: 1, label: "Pair (Jacks+) 1:1" };

  const mult = paytable[k] ?? 0;
  if (mult > 0)
    return { type: "WIN", mult, label: `${best.handName} ${mult}:1` };

  return { type: "LOSE", mult: 0, label: "No qualifying hand" };
}

function score3CardBonus(community3, bonus3table) {
  // Expect cards in format like:
  // { rank: "A", suit: "H" }
  // OR string like "AH"

  const ranks = community3
    .map((c) => {
      const r = c.r ?? c.rank ?? c[0];
      if (r === "A") return 14;
      if (r === "K") return 13;
      if (r === "Q") return 12;
      if (r === "J") return 11;
      if (r === "T") return 10;
      return Number(r);
    })
    .sort((a, b) => a - b);

  const suits = community3.map((c) => c.s ?? c.suit ?? c[1]);

  const isFlush = suits.every((s) => s === suits[0]);

  const counts = {};
  ranks.forEach((r) => (counts[r] = (counts[r] || 0) + 1));

  const isTrips = Object.values(counts).includes(3);
  const isPair = Object.values(counts).includes(2);

  const isStraight = (() => {
    if (ranks[0] === 2 && ranks[1] === 3 && ranks[2] === 14) return true; // A-2-3
    return ranks[0] + 1 === ranks[1] && ranks[1] + 1 === ranks[2];
  })();

  let key = null;

  if (isStraight && isFlush) key = "STRAIGHT_FLUSH";
  else if (isTrips) key = "THREE_KIND";
  else if (isStraight) key = "STRAIGHT";
  else if (isFlush) key = "FLUSH";
  else if (isPair) key = "PAIR";

  if (!key) return { win: false, mult: 0, label: "No bonus win" };

  const mult = bonus3table[key] ?? 0;
  return { win: mult > 0, mult, label: `${key.replace("_", " ")} ${mult}:1` };
}

function evaluateMissStud5(cards5) {
  // cards are in your core shape: { r:"A", s:"H" }  (as used by renderCards)
  const ranks = cards5.map((c) => rankNum(c.r)).sort((a, b) => a - b);
  const suits = cards5.map((c) => c.s);

  const isFlush = suits.every((s) => s === suits[0]);

  // Straight (including wheel A-2-3-4-5)
  const uniq = [...new Set(ranks)].sort((a, b) => a - b);
  const isStraight = (() => {
    if (uniq.length !== 5) return false;
    // wheel
    if (
      uniq[0] === 2 &&
      uniq[1] === 3 &&
      uniq[2] === 4 &&
      uniq[3] === 5 &&
      uniq[4] === 14
    )
      return true;
    return (
      uniq[0] + 1 === uniq[1] &&
      uniq[1] + 1 === uniq[2] &&
      uniq[2] + 1 === uniq[3] &&
      uniq[3] + 1 === uniq[4]
    );
  })();

  const counts = countRanks(ranks);
  const freq = Object.values(counts).sort((a, b) => b - a); // e.g. [4,1], [3,2], [3,1,1], [2,2,1], [2,1,1,1]

  const has4 = freq[0] === 4;
  const has3 = freq[0] === 3;
  const has2 = freq[0] === 2;
  const pairCount = freq.filter((x) => x === 2).length;

  // Identify royal flush (A,K,Q,J,10)
  const isRoyal =
    isFlush &&
    isStraight &&
    uniq.includes(14) &&
    uniq.includes(13) &&
    uniq.includes(12) &&
    uniq.includes(11) &&
    uniq.includes(10);

  let rankKey = "OTHER";
  let handName = "High Card";

  if (isFlush && isStraight && isRoyal) {
    rankKey = "ROYAL_FLUSH";
    handName = "Royal Flush";
  } else if (isFlush && isStraight) {
    rankKey = "STRAIGHT_FLUSH";
    handName = "Straight Flush";
  } else if (has4) {
    rankKey = "FOUR_KIND";
    handName = "Four of a Kind";
  } else if (has3 && freq[1] === 2) {
    rankKey = "FULL_HOUSE";
    handName = "Full House";
  } else if (isFlush) {
    rankKey = "FLUSH";
    handName = "Flush";
  } else if (isStraight) {
    rankKey = "STRAIGHT";
    handName = "Straight";
  } else if (has3) {
    rankKey = "THREE_KIND";
    handName = "Three of a Kind";
  } else if (pairCount === 2) {
    rankKey = "TWO_PAIR";
    handName = "Two Pair";
  } else if (has2) {
    const pairRank = Number(Object.keys(counts).find((k) => counts[k] === 2));
    if (pairRank >= 6 && pairRank <= 10) {
      rankKey = "PAIR_6_TO_10";
      handName = "Pair (6–10)";
    } else if (
      pairRank === 11 ||
      pairRank === 12 ||
      pairRank === 13 ||
      pairRank === 14
    ) {
      rankKey = "PAIR_JACKS_PLUS";
      handName = "Pair (Jacks+)";
    } else {
      rankKey = "OTHER";
      handName = "Low Pair";
    }
  }

  return { rankKey, handName };
}

function rankNum(r) {
  if (r === "A") return 14;
  if (r === "K") return 13;
  if (r === "Q") return 12;
  if (r === "J") return 11;
  if (r === "T") return 10;
  return Number(r);
}

function countRanks(ranks) {
  const m = {};
  for (const r of ranks) m[r] = (m[r] || 0) + 1;
  return m;
}
