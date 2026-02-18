// core/eval5_wild.js
import { eval5, compareEval } from "./eval5.js"; 
// compareEval(a,b) should return 1 if a>b, -1 if a<b, 0 tie.
// If you don't have compareEval, see below.

const RANKS = ["2","3","4","5","6","7","8","9","T","J","Q","K","A"];
const SUITS = ["s","h","d","c"];

function isWild(card, wild2s=true, wildJokers=true) {
  if (!card) return false;
  if (wildJokers && (card.r === "X" || card.r === "JOKER")) return true; // adjust if your joker encoding differs
  if (wild2s && card.r === "2") return true;
  return false;
}

// build a 52-card candidate pool, excluding cards already present (non-wild)
function buildPool(nonWildCards) {
  const used = new Set(nonWildCards.map(c => `${c.r}${c.s}`));
  const pool = [];
  for (const r of RANKS) {
    for (const s of SUITS) {
      const key = `${r}${s}`;
      if (!used.has(key)) pool.push({ r, s });
    }
  }
  return pool;
}

// generate all unique substitutions for wilds (no duplicate exact cards)
function* assignWilds(wildCount, pool, startIdx=0, picked=[]) {
  if (picked.length === wildCount) {
    yield picked.slice();
    return;
  }
  for (let i = startIdx; i < pool.length; i++) {
    picked.push(pool[i]);
    yield* assignWilds(wildCount, pool, i + 1, picked);
    picked.pop();
  }
}

export function eval5_djwild(cards5) {
  const wilds = cards5.filter(c => isWild(c, true, true));
  const nonWild = cards5.filter(c => !isWild(c, true, true));

  // No wilds -> normal eval
  if (wilds.length === 0) return eval5(cards5);

  const pool = buildPool(nonWild);
  let best = null;

  // Assign wilds to unique real cards, evaluate each complete 5-card hand
  for (const picked of assignWilds(wilds.length, pool)) {
    const hand = nonWild.concat(picked);
    const cur = eval5(hand);
    if (!best || compareEval(cur, best) > 0) best = cur;
  }

  return best;
}

// If you don't already have compareEval, add this simple one.
// It assumes eval5 returns { score: number, ... } where higher is better.
export function compareEval(a, b) {
  const as = a?.score ?? a?.v ?? a?.rank ?? 0;
  const bs = b?.score ?? b?.v ?? b?.rank ?? 0;
  return as === bs ? 0 : (as > bs ? 1 : -1);
}
