// games/ilovesuits/ilovesuits.engine.js
import { makeDeck, shuffle } from "../../core/cards.js";

const RANK_VALUE = { "2":2,"3":3,"4":4,"5":5,"6":6,"7":7,"8":8,"9":9,"T":10,"J":11,"Q":12,"K":13,"A":14 };

function sortDesc(vals) { return vals.slice().sort((a,b)=>b-a); }

function bestFlushInfo(cards7) {
  // returns { suit, len, valsDesc, idxSorted }
  const bySuit = new Map(); // suit -> [{idx, val}]
  for (let i = 0; i < cards7.length; i++) {
    const c = cards7[i];
    const arr = bySuit.get(c.s) ?? [];
    arr.push({ idx: i, val: RANK_VALUE[c.r] });
    bySuit.set(c.s, arr);
  }

  let best = { suit: null, len: 0, valsDesc: [], idxSorted: [] };

  for (const [suit, list] of bySuit.entries()) {
    const sorted = list.slice().sort((a,b)=>b.val-a.val);
    const valsDesc = sorted.map(x => x.val);
    const idxSorted = sorted.map(x => x.idx);

    const cand = { suit, len: list.length, valsDesc, idxSorted };

    if (cand.len > best.len) best = cand;
    else if (cand.len === best.len && cand.len > 0) {
      // tie-break lexicographically by highest cards in the flush
      const L = Math.max(cand.valsDesc.length, best.valsDesc.length);
      let better = false;
      for (let i = 0; i < L; i++) {
        const a = cand.valsDesc[i] ?? 0;
        const b = best.valsDesc[i] ?? 0;
        if (a > b) { better = true; break; }
        if (a < b) break;
      }
      if (better) best = cand;
    }
  }

  return best;
}


function longestStraightLen(values) {
  // values: array of rank values (may contain duplicates)
  // returns length of longest consecutive run; supports wheel A2345 via Ace low (treat 14 as 1)
  const set = new Set(values);
  if (set.has(14)) set.add(1);

  const uniq = Array.from(set).sort((a,b)=>a-b);

  let best = 0;
  let run = 1;

  for (let i = 1; i < uniq.length; i++) {
    if (uniq[i] === uniq[i-1] + 1) {
      run++;
    } else {
      best = Math.max(best, run);
      run = 1;
    }
  }
  best = Math.max(best, run);
  return best;
}

function longestStraightFlushLen(cards7) {
  // compute straight run length per suit, return max
  const suits = ["S","H","D","C"];
  let best = 0;

  for (const s of suits) {
    const vals = cards7.filter(c => c.s === s).map(c => RANK_VALUE[c.r]);
    if (vals.length < 3) continue;
    best = Math.max(best, longestStraightLen(vals));
  }
  return best;
}

function dealerQualifies(dealerFlush) {
  // must contain a 3-card 9-high flush or better to qualify
  // i.e., has flush len >= 3 and highest card in that flush >= 9
  return dealerFlush.len >= 3 && (dealerFlush.valsDesc[0] ?? 0) >= 9;
}

export async function dealILSRound(store, { ante, flushRush, superFlushRush, payouts }) {
  const round = await store.startRound("ILOVESUITS");

  await store.placeBet(round.id, "ANTE", ante);
  if (flushRush > 0) await store.placeBet(round.id, "FLUSH_RUSH", flushRush);
  if (superFlushRush > 0) await store.placeBet(round.id, "SUPER_FLUSH_RUSH", superFlushRush);

  // 1 deck
  const deck = shuffle(makeDeck());
  const player = deck.splice(0, 7);
  const dealer = deck.splice(0, 7);

  const pFlush = bestFlushInfo(player);
  const dFlush = bestFlushInfo(dealer);

  const pSF = longestStraightFlushLen(player);
  const dQual = dealerQualifies(dFlush);

  return {
    roundId: round.id,
    live: {
      ante,
      flushRush,
      superFlushRush,
      payouts,
      player,
      dealer,
      pFlush,
      dFlush,
      pStraightFlushLen: pSF,
      dealerQualifies: dQual
    }
  };
}

export function allowedPlayMultipliers(pFlushLen) {
  // Based on rules
  if (pFlushLen >= 6) return [1,2,3];
  if (pFlushLen === 5) return [1,2];
  if (pFlushLen === 3 || pFlushLen === 4) return [1];
  return []; // no 3-card flush => cannot play (must fold)
}

export async function foldILS(store, roundId, live) {
  await store.settle(roundId, "ANTE", "LOSE", 0, 0);
  if (live.flushRush > 0) await store.settle(roundId, "FLUSH_RUSH", "LOSE", 0, 0);
  if (live.superFlushRush > 0) await store.settle(roundId, "SUPER_FLUSH_RUSH", "LOSE", 0, 0);

  await store.closeRound(roundId);
  return { title: "FOLD", detail: "All wagers lost." };
}

export async function playILS(store, roundId, live, mult) {
  const allowed = allowedPlayMultipliers(live.pFlush.len);
  if (!allowed.includes(mult)) throw new Error("Invalid Play multiplier for your flush.");

  const playAmt = live.ante * mult;
  await store.placeBet(roundId, "PLAY", playAmt);

  // Side bets first (independent)
  if (live.flushRush > 0) {
    const m = live.payouts.flushRush?.[live.pFlush.len] ?? 0;
    if (live.pFlush.len >= 4 && m > 0) await store.settle(roundId, "FLUSH_RUSH", "WIN", m * live.flushRush, live.flushRush);
    else await store.settle(roundId, "FLUSH_RUSH", "LOSE", 0, 0);
  }

  if (live.superFlushRush > 0) {
    const sflen = live.pStraightFlushLen;
    const m = live.payouts.superFlushRush?.[Math.min(7, sflen)] ?? 0;
    if (sflen >= 3 && m > 0) await store.settle(roundId, "SUPER_FLUSH_RUSH", "WIN", m * live.superFlushRush, live.superFlushRush);
    else await store.settle(roundId, "SUPER_FLUSH_RUSH", "LOSE", 0, 0);
  }

  // Main comparison is “flush with more cards than dealer”
  // If dealer not qualified: Play returned, Ante wins 1:1
  if (!live.dealerQualifies) {
    await store.settle(roundId, "ANTE", "WIN", live.ante, live.ante);
    await store.settle(roundId, "PLAY", "PUSH", 0, playAmt);
    await store.closeRound(roundId);
    return { title: "DEALER NO QUALIFY", detail: "Ante wins 1:1; Play returned." };
  }

// Compare flush lengths first
const pLen = live.pFlush.len;
const dLen = live.dFlush.len;

if (pLen > dLen) {
  return win();
}
if (pLen < dLen) {
  return lose();
}

// Same flush length → compare highest kicker card (lexicographically)
for (let i = 0; i < pLen; i++) {
  const pCard = live.pFlush.valsDesc[i] ?? 0;
  const dCard = live.dFlush.valsDesc[i] ?? 0;

  if (pCard > dCard) return win();
  if (pCard < dCard) return lose();
}

// Identical hands → push
await store.settle(roundId, "ANTE", "PUSH", 0, live.ante);
await store.settle(roundId, "PLAY", "PUSH", 0, playAmt);
await store.closeRound(roundId);
return { title: "PUSH", detail: "Identical flush hands." };

async function win() {
  await store.settle(roundId, "ANTE", "WIN", live.ante, live.ante);
  await store.settle(roundId, "PLAY", "WIN", playAmt, playAmt);
  await store.closeRound(roundId);
  return { title: "WIN", detail: "Your flush beats dealer." };
}

async function lose() {
  await store.settle(roundId, "ANTE", "LOSE", 0, 0);
  await store.settle(roundId, "PLAY", "LOSE", 0, 0);
  await store.closeRound(roundId);
  return { title: "LOSE", detail: "Dealer flush beats yours." };
}
}
