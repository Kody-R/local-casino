// core/eval5.js
// 5-card evaluator + best 5-of-6 evaluator (for 6 Card Bonus, later UTH/Crazy4 helpers)

const RANKS = ["2","3","4","5","6","7","8","9","T","J","Q","K","A"];
const RANK_VALUE = Object.fromEntries(RANKS.map((r,i)=>[r,i+2])); // 2..14

function combinations6Choose5(cards6) {
  // 6 combos by dropping each index once
  const out = [];
  for (let i = 0; i < 6; i++) out.push(cards6.filter((_, idx) => idx !== i));
  return out;
}

/**
 * Evaluate a 5-card poker hand.
 * Returns: { code, vec }
 *
 * code: RF, SF, FK, FH, FL, ST, TK, 2P, PR, HI
 * vec: lexicographic vector, first element is category weight
 */
export function eval5(cards) {
  const valsDesc = cards.map(c => RANK_VALUE[c.r]).sort((a,b)=>b-a);
  const suits = cards.map(c => c.s);
  const isFlush = suits.every(s => s === suits[0]);

  // counts
  const counts = new Map();
  for (const v of valsDesc) counts.set(v, (counts.get(v) || 0) + 1);

  // groups sorted by count desc then rank desc
  const groups = [...counts.entries()].sort((a,b)=> b[1]-a[1] || b[0]-a[0]);
  const distinctDesc = [...counts.keys()].sort((a,b)=>b-a);

  // straight detection (A-5 wheel)
  const uniqAsc = [...new Set(valsDesc)].sort((a,b)=>a-b);
  let isStraight = false;
  let straightHigh = 0;

  if (uniqAsc.length === 5 && uniqAsc[0] + 4 === uniqAsc[4]) {
    isStraight = true;
    straightHigh = uniqAsc[4];
  }
  // wheel: A,2,3,4,5
  if (uniqAsc.length === 5 && JSON.stringify(uniqAsc) === JSON.stringify([2,3,4,5,14])) {
    isStraight = true;
    straightHigh = 5;
  }

  if (isStraight && isFlush) {
    // Royal if 10-J-Q-K-A straight flush
    const isRoyal = straightHigh === 14 && uniqAsc[0] === 10;
    if (isRoyal) return { code: "RF", vec: [10, 14] };
    return { code: "SF", vec: [9, straightHigh] };
  }

  // four of a kind
  if (groups[0][1] === 4) {
    const quad = groups[0][0];
    const kicker = groups[1][0];
    return { code: "FK", vec: [8, quad, kicker] };
  }

  // full house
  if (groups[0][1] === 3 && groups[1][1] === 2) {
    return { code: "FH", vec: [7, groups[0][0], groups[1][0]] };
  }

  if (isFlush) return { code: "FL", vec: [6, ...valsDesc] };
  if (isStraight) return { code: "ST", vec: [5, straightHigh] };

  // trips
  if (groups[0][1] === 3) {
    const trips = groups[0][0];
    const kickers = distinctDesc.filter(v => v !== trips);
    return { code: "TK", vec: [4, trips, ...kickers] };
  }

  // two pair
  if (groups[0][1] === 2 && groups[1][1] === 2) {
    const pair1 = Math.max(groups[0][0], groups[1][0]);
    const pair2 = Math.min(groups[0][0], groups[1][0]);
    const kicker = groups[2][0];
    return { code: "2P", vec: [3, pair1, pair2, kicker] };
  }

  // one pair
  if (groups[0][1] === 2) {
    const pair = groups[0][0];
    const kickers = distinctDesc.filter(v => v !== pair);
    return { code: "PR", vec: [2, pair, ...kickers] };
  }

  // high card
  return { code: "HI", vec: [1, ...valsDesc] };
}

export function compareEval5(a, b) {
  const A = a.vec, B = b.vec;
  const len = Math.max(A.length, B.length);
  for (let i = 0; i < len; i++) {
    const av = A[i] ?? 0;
    const bv = B[i] ?? 0;
    if (av > bv) return 1;
    if (av < bv) return -1;
  }
  return 0;
}

/**
 * Best 5-card hand from 6 cards (for 6 Card Bonus).
 * Returns the best eval5 result.
 */
export function evalBest5of6(cards6) {
  const combos = combinations6Choose5(cards6);
  let best = null;
  for (const c of combos) {
    const e = eval5(c);
    if (!best || compareEval5(e, best) > 0) best = e;
  }
  return best;
}

// core/eval5.js  (ADD THIS)
export function evalBest5of7(cards7) {
  if (!cards7 || cards7.length !== 7) throw new Error("evalBest5of7 expects 7 cards");
  let best = null;

  // 7 choose 5 = 21 combos (drop i and j)
  for (let i = 0; i < 7; i++) {
    for (let j = i + 1; j < 7; j++) {
      const hand5 = cards7.filter((_, idx) => idx !== i && idx !== j);
      const e = eval5(hand5);
      if (!best || compareEval5(e, best) > 0) best = e;
    }
  }
  return best;
}
