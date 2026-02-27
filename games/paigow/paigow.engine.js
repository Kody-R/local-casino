// games/paigow/paigow.engine.js
import { makeDeckPaiGow, shuffle } from "../../core/cards.js";
import { eval5, compareEval5 } from "../../core/eval5.js";
import { PAIGOW_PAYOUTS, lookupPay } from "./paigow.payouts.js";

function eval5PaiGow(cards) {
  const hasJoker = cards.some((c) => c.paiGowJoker);

  if (!hasJoker) return eval5(cards);

  const nonJoker = cards.filter((c) => !c.paiGowJoker);

  // Try best straight or flush completion first
  const bestStraightFlush = tryCompleteStraightFlush(nonJoker);
  if (bestStraightFlush) return bestStraightFlush;

  // Otherwise joker acts as Ace
  const replaced = [...nonJoker, { r: "A", s: nonJoker[0].s }];
  return eval5(replaced);
}

function tryCompleteStraightFlush(nonJoker) {
  // If 4 cards same suit and near straight, attempt completion
  // Simple approach: brute force replacement over all ranks/suits

  const possible = [];
  const ranks = [
    "2",
    "3",
    "4",
    "5",
    "6",
    "7",
    "8",
    "9",
    "T",
    "J",
    "Q",
    "K",
    "A",
  ];
  const suits = ["S", "H", "D", "C"];

  for (const r of ranks) {
    for (const s of suits) {
      const candidate = [...nonJoker, { r, s }];
      const e = eval5(candidate);
      if (e.code === "SF" || e.code === "RF") {
        possible.push(e);
      }
    }
  }

  if (possible.length === 0) return null;

  return possible.sort((a, b) => compareEval5(b, a))[0];
}

function hasFiveAces(cards7) {
  const aces = cards7.filter((c) => c.r === "A").length;
  const joker = cards7.some((c) => c.paiGowJoker);
  return joker && aces === 4;
}

function freshShoe(decks = 1) {
  const shoe = [];
  for (let d = 0; d < decks; d++) shoe.push(...makeDeckPaiGow());
  return shuffle(shoe);
}

function draw(shoe) {
  return shoe.pop();
}

function rankVal(r) {
  if (r === "A") return 14;
  if (r === "K") return 13;
  if (r === "Q") return 12;
  if (r === "J") return 11;
  if (r === "T") return 10;
  return Number(r);
}

// Map a 2-card Pai Gow LOW hand into the SAME eval vector space as eval5().
// eval5 category weights: HI=1, PR=2, 2P=3, TK=4, ST=5, FL=6, FH=7, FK=8, SF=9, RF=10
function evalLowAsEval5Vec(cards2) {
  const a = rankVal(cards2[0].r);
  const b = rankVal(cards2[1].r);
  const hi = Math.max(a, b);
  const lo = Math.min(a, b);

  if (a === b) {
    // Pair (PR): vec [2, pairRank, kickers...]
    // Low has no kickers, so pad with zeros.
    return { code: "PR", vec: [2, hi, 0, 0, 0, 0] };
  }
  // High card (HI): vec [1, ranks...]
  return { code: "HI", vec: [1, hi, lo, 0, 0, 0] };
}

function lowName(cards2) {
  if (cards2[0].r === cards2[1].r) return `Pair of ${cards2[0].r}s`;
  const a = cards2[0].r === "T" ? "10" : cards2[0].r;
  const b = cards2[1].r === "T" ? "10" : cards2[1].r;
  return `${a}${b} High`;
}

// LEGALITY (airtight):
// A split is legal iff evalHigh >= evalLow (using compareEval5 on the vectors).
function isLegalSplit(high5, low2) {
  const hiEval = eval5PaiGow(high5);
  const loEval = evalLowAsEval5Vec(low2);
  return compareEval5(hiEval, loEval) >= 0;
}

// Choose best split for “House Way” (deterministic):
// Primary: maximize LOW hand
// Secondary: maximize HIGH hand
export function chooseHouseWaySplit(cards7) {
  let best = null;

  for (let i = 0; i < 7; i++) {
    for (let j = i + 1; j < 7; j++) {
      const low = [cards7[i], cards7[j]];
      const high = cards7.filter((_, idx) => idx !== i && idx !== j);

      if (!isLegalSplit(high, low)) continue;

      const hiEval = eval5PaiGow(high);
      const loEval = evalLowAsEval5Vec(low);

      const cand = { high, low, hiEval, loEval };

      if (!best) {
        best = cand;
        continue;
      }

      const loCmp = compareEval5(cand.loEval, best.loEval);
      if (loCmp > 0) {
        best = cand;
        continue;
      }
      if (loCmp < 0) continue;

      const hiCmp = compareEval5(cand.hiEval, best.hiEval);
      if (hiCmp > 0) best = cand;
    }
  }

  // In practice there is always at least one legal split.
  // As a fallback, do naive split.
  if (!best) {
    const low = cards7.slice(5, 7);
    const high = cards7.slice(0, 5);
    best = {
      high,
      low,
      hiEval: eval5PaiGow(high),
      loEval: evalLowAsEval5Vec(low),
    };
  }

  return best;
}

// Fortune evaluation uses the player’s SEVEN cards regardless of how they set.
// We implement the standard ladder that applies without joker. :contentReference[oaicite:2]{index=2}
function is7CardFlush(cards7) {
  return cards7.every((c) => c.s === cards7[0].s);
}

function is7CardStraight(cards7) {
  const uniq = [...new Set(cards7.map((c) => rankVal(c.r)))].sort(
    (a, b) => a - b,
  );
  if (uniq.length !== 7) return false;

  // normal 7-run
  if (uniq[0] + 6 === uniq[6]) return true;

  // allow A as 1 for wheel-ish runs (A234567)
  // map A(14)->1 and test again
  const mapped = uniq.map((v) => (v === 14 ? 1 : v)).sort((a, b) => a - b);
  return mapped[0] + 6 === mapped[6];
}

function is7CardStraightFlush(cards7) {
  return is7CardFlush(cards7) && is7CardStraight(cards7);
}

// Royal + Royal Match:
// Best 5 is a Royal Flush, AND the two leftover cards are suited K & Q in the SAME suit.
function isRoyalPlusRoyalMatch(cards7) {
  // Find suit that can form royal: need T,J,Q,K,A same suit
  const bySuit = new Map();
  for (const c of cards7) {
    if (!bySuit.has(c.s)) bySuit.set(c.s, []);
    bySuit.get(c.s).push(c.r);
  }
  for (const [s, ranks] of bySuit.entries()) {
    const set = new Set(ranks);
    const hasRoyal = ["T", "J", "Q", "K", "A"].every((r) => set.has(r));
    if (!hasRoyal) continue;

    // “Royal match” extra KQ same suit beyond the royal’s KQ
    // With 7 cards, this means the 7 cards include BOTH an extra K and an extra Q of that suit.
    // Since there is only one K and one Q per suit in a single deck, in a NO-JOKER single deck game
    // this condition is IMPOSSIBLE.
    //
    // However, some Fortune rules allow “Royal Match” to mean the remaining two cards are suited K and Q
    // (not necessarily duplicates), i.e., the *other two* cards (not in the royal) are K+Q same suit.
    // That is possible if your royal is built from 5 cards and the remaining two happen to be K/Q suited
    // BUT again duplicates conflict.
    //
    // So: we implement a practical version:
    // remaining two cards (not necessarily excluding the royal) contain a suited K and Q of the royal suit
    // IN ADDITION to the royal existing.
    //
    // This will always be true for a royal itself, so we must avoid that: require at least 7 cards all same suit
    // and include an extra K/Q? Not possible.
    //
    // Therefore: we keep the key but it will never hit in a standard 52-card no-joker setup.
    // If you later add a joker or use multiple decks, this becomes relevant.
    return false;
  }
  return false;
}

export function fortuneKey(cards7) {
  if (hasFiveAces(cards7)) return "5A";
  if (is7CardStraightFlush(cards7)) return "7SF";
  if (isRoyalPlusRoyalMatch(cards7)) return "RFRM";

  // Otherwise pay based on best 5-card category within the 7 cards:
  // brute 7 choose 5 = 21 combos
  let best = null;
  for (let a = 0; a < 7; a++) {
    for (let b = a + 1; b < 7; b++) {
      const hand5 = cards7.filter((_, idx) => idx !== a && idx !== b);
      const e = eval5PaiGow(hand5);
      if (!best || compareEval5(e, best) > 0) best = e;
    }
  }

  // Map eval5 code to Fortune keys
  if (!best) return null;
  if (best.code === "RF") return "RF";
  if (best.code === "SF") return "SF";
  if (best.code === "FK") return "FK";
  if (best.code === "FH") return "FH";
  if (best.code === "FL") return "FL";
  if (best.code === "TK") return "TK";
  if (best.code === "ST") return "ST";
  return null;
}

export function newPaiGowState() {
  return {
    shoe: freshShoe(1),
    player7: [],
    dealer7: [],

    // indices into player7
    playerHighIdx: new Set(),
    playerLowIdx: new Set(),

    // dealer set
    dealerHigh: [],
    dealerLow: [],
    dealerHiEval: null,
    dealerLoEval: null,

    phase: "BETTING", // BETTING -> SETTING -> DONE
    result: null,

    // wagers snapshot (engine-side)
    betMain: 0,
    betFortune: 0,
  };
}

export function dealPaiGow(state, betMain = 0, betFortune = 0) {
  state.betMain = betMain;
  state.betFortune = betFortune;

  state.player7 = [];
  state.dealer7 = [];
  state.playerHighIdx = new Set();
  state.playerLowIdx = new Set();
  state.result = null;

  for (let i = 0; i < 7; i++) state.player7.push(draw(state.shoe));
  for (let i = 0; i < 7; i++) state.dealer7.push(draw(state.shoe));

  // Dealer sets by House Way
  const d = chooseHouseWaySplit(state.dealer7);
  state.dealerHigh = d.high;
  state.dealerLow = d.low;
  state.dealerHiEval = d.hiEval;
  state.dealerLoEval = d.loEval;

  state.phase = "SETTING";
}

export function canSetHands(state) {
  return state.playerHighIdx.size === 5 && state.playerLowIdx.size === 2;
}

export function buildPlayerHands(state) {
  const hi = [...state.playerHighIdx].map((i) => state.player7[i]);
  const lo = [...state.playerLowIdx].map((i) => state.player7[i]);
  return { hi, lo };
}

export function validatePlayerHands(state) {
  if (!canSetHands(state))
    return { ok: false, msg: "Select 5 cards for High and 2 for Low." };

  const { hi, lo } = buildPlayerHands(state);
  const hiEval = eval5PaiGow(hi);
  const loEval = evalLowAsEval5Vec(lo);

  if (compareEval5(hiEval, loEval) < 0) {
    return {
      ok: false,
      msg: `Illegal set: Low (${lowName(lo)}) outranks High.`,
    };
  }
  return { ok: true, msg: "OK" };
}

// Used by Auto-Set button
export function autoSetPlayerHouseWay(state) {
  const best = chooseHouseWaySplit(state.player7);

  // translate chosen cards to indices into player7
  const idxMap = new Map();
  state.player7.forEach((c, i) => idxMap.set(c, i)); // works because cards are object refs

  state.playerHighIdx = new Set(best.high.map((c) => idxMap.get(c)));
  state.playerLowIdx = new Set(best.low.map((c) => idxMap.get(c)));
}

function sideCompareWithTieToDealer(cmp) {
  // cmp: 1 player win, 0 tie, -1 lose
  // ties go to dealer => player only “wins” on cmp===1
  return cmp === 1 ? 1 : -1;
}

export function settlePaiGow(state) {
  const v = validatePlayerHands(state);
  if (!v.ok) throw new Error(v.msg);

  const { hi: pHigh, lo: pLow } = buildPlayerHands(state);

  const pHighEval = eval5PaiGow(pHigh);
  const dHighEval = state.dealerHiEval ?? eval5PaiGow(state.dealerHigh);

  const pLowEval = evalLowAsEval5Vec(pLow);
  const dLowEval = state.dealerLoEval ?? evalLowAsEval5Vec(state.dealerLow);

  const hiCmpRaw = compareEval5(pHighEval, dHighEval);
  const loCmpRaw = compareEval5(pLowEval, dLowEval);

  const hiSide = sideCompareWithTieToDealer(hiCmpRaw); // 1 or -1
  const loSide = sideCompareWithTieToDealer(loCmpRaw);

  let outcome = "PUSH";
  if (hiSide === 1 && loSide === 1) outcome = "WIN";
  else if (hiSide === -1 && loSide === -1) outcome = "LOSE";

  const fk = state.betFortune > 0 ? fortuneKey(state.player7) : null;
  const fortunePays = fk ? lookupPay(PAIGOW_PAYOUTS.FORTUNE, fk) : 0;

  state.result = {
    outcome,
    pHigh,
    pLow,
    pHighEval,
    dHighEval,
    pLowEval,
    dLowEval,
    hiCmpRaw,
    loCmpRaw,
    fortune: { key: fk, pays: fortunePays },
  };

  state.phase = "DONE";
  return state.result;
}
