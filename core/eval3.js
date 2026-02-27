// core/eval3.js
// 3-card hand evaluation + dealer qualification (Q-high or better)

const RANKS = ["2", "3", "4", "5", "6", "7", "8", "9", "T", "J", "Q", "K", "A"];
const RANK_VALUE = Object.fromEntries(RANKS.map((r, i) => [r, i + 2])); // 2..14

/**
 * 3-card hand ranks:
 * Straight Flush > Trips > Straight > Flush > Pair > High Card
 * Returns: { rankCode, rankValueArray }
 * rankValueArray starts with a category weight so simple lexicographic compare works.
 */
export function eval3(cards) {
  const valsDesc = cards.map((c) => RANK_VALUE[c.r]).sort((a, b) => b - a);
  const suits = cards.map((c) => c.s);
  const isFlush = suits.every((s) => s === suits[0]);

  // counts by rank value
  const counts = new Map();
  for (const v of valsDesc) counts.set(v, (counts.get(v) || 0) + 1);
  const distinctDesc = [...counts.keys()].sort((a, b) => b - a);

  // straight detection (A-2-3 special)
  const valsAsc = [...valsDesc].sort((a, b) => a - b);
  let isStraight = false;
  let straightHigh = Math.max(...valsDesc);

  // normal straight
  if (valsAsc[0] + 1 === valsAsc[1] && valsAsc[1] + 1 === valsAsc[2]) {
    isStraight = true;
    straightHigh = valsAsc[2];
  }
  // wheel A-2-3
  if (valsAsc[0] === 2 && valsAsc[1] === 3 && valsAsc[2] === 14) {
    isStraight = true;
    straightHigh = 3; // treat as 3-high straight
  }

  // trips
  if (counts.size === 1) {
    return { rankCode: "TK", rankValueArray: [6, distinctDesc[0]] };
  }

  // straight flush
  if (isStraight && isFlush) {
    return { rankCode: "SF", rankValueArray: [7, straightHigh] };
  }

  // straight
  if (isStraight) {
    return { rankCode: "ST", rankValueArray: [5, straightHigh] };
  }

  // flush
  if (isFlush) {
    return { rankCode: "FL", rankValueArray: [4, ...valsDesc] };
  }

  // pair
  if (counts.size === 2) {
    const pairRank = distinctDesc.find((v) => counts.get(v) === 2);
    const kicker = distinctDesc.find((v) => counts.get(v) === 1);
    return { rankCode: "PR", rankValueArray: [3, pairRank, kicker] };
  }

  // high card
  return { rankCode: "HI", rankValueArray: [2, ...valsDesc] };
}

export function compareEval3(a, b) {
  const A = a.rankValueArray;
  const B = b.rankValueArray;
  const len = Math.max(A.length, B.length);
  for (let i = 0; i < len; i++) {
    const av = A[i] ?? 0;
    const bv = B[i] ?? 0;
    if (av > bv) return 1;
    if (av < bv) return -1;
  }
  return 0;
}

export function dealerQualifies(evalDealer, dealerCards) {
  // Dealer qualifies with Queen-high or better.
  // Any Pair+ qualifies automatically.
  if (evalDealer.rankCode !== "HI") return true;
  const maxV = Math.max(...dealerCards.map((c) => RANK_VALUE[c.r]));
  return maxV >= RANK_VALUE["Q"];
}

export function handName3(code) {
  return (
    {
      SF: "Straight Flush",
      TK: "Three of a Kind",
      ST: "Straight",
      FL: "Flush",
      PR: "Pair",
      HI: "High Card",
    }[code] ?? code
  );
}
