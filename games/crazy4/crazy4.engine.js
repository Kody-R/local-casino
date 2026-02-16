// games/crazy4/crazy4.engine.js
import { makeDeck, shuffle } from "../../core/cards.js";
import { eval5, compareEval5 } from "../../core/eval5.js";

const RV = { "2":2,"3":3,"4":4,"5":5,"6":6,"7":7,"8":8,"9":9,"T":10,"J":11,"Q":12,"K":13,"A":14 };

function rankName4(code) {
  switch (code) {
    case "4K": return "Four of a Kind";
    case "FH": return "Full House";
    case "3K": return "Three of a Kind";
    case "2P": return "Two Pair";
    case "PR": return "Pair";
    case "HI": return "High Card";
    default: return code;
  }
}

// Evaluate a 4-card hand type (no straights/flushes for 4-card ranking display)
function eval4Type(cards4) {
  const counts = new Map();
  for (const c of cards4) counts.set(c.r, (counts.get(c.r) ?? 0) + 1);

  const groups = Array.from(counts.entries())
    .map(([r, n]) => ({ r, n, v: RV[r] }))
    .sort((a,b) => (b.n - a.n) || (b.v - a.v));

  const pattern = groups.map(g => g.n).sort((a,b)=>b-a).join(",");

  // Determine type and build a vector for tie-breaking
  // vector is compared lexicographically
  let code = "HI";
  let vec = [];

  if (pattern === "4") { // 4 of kind
    code = "4K";
    const quad = groups.find(g=>g.n===4);
    vec = [7, quad.v]; // 7 highest rank bucket
  } else if (pattern === "3,1") {
    code = "3K";
    const trip = groups.find(g=>g.n===3);
    const kicker = groups.find(g=>g.n===1);
    vec = [4, trip.v, kicker.v];
  } else if (pattern === "2,2") {
    code = "2P";
    const pairs = groups.filter(g=>g.n===2).map(g=>g.v).sort((a,b)=>b-a);
    vec = [3, pairs[0], pairs[1]];
  } else if (pattern === "2,1,1") {
    code = "PR";
    const pair = groups.find(g=>g.n===2);
    const kickers = groups.filter(g=>g.n===1).map(g=>g.v).sort((a,b)=>b-a);
    vec = [2, pair.v, ...kickers];
  } else {
    code = "HI";
    const highs = groups.map(g=>g.v).sort((a,b)=>b-a);
    vec = [1, ...highs];
  }

  return { code, vec };
}

function cmpVec(a, b) {
  const L = Math.max(a.length, b.length);
  for (let i = 0; i < L; i++) {
    const x = a[i] ?? 0;
    const y = b[i] ?? 0;
    if (x > y) return 1;
    if (x < y) return -1;
  }
  return 0;
}

export function best4of5(cards5) {
  // returns { code, name, idxSet } where idxSet highlights 4 chosen cards
  let best = null;

  for (let drop = 0; drop < 5; drop++) {
    const hand4 = cards5.filter((_, i) => i !== drop);
    const e = eval4Type(hand4);

    const score = e.vec; // lexicographic

    if (!best || cmpVec(score, best.score) > 0) {
      best = {
        code: e.code,
        name: rankName4(e.code),
        score,
        idxSet: new Set([0,1,2,3,4].filter(i => i !== drop))
      };
    }
  }

  return { code: best.code, name: best.name, idxSet: best.idxSet };
}


function dealerQualifies(evalDealer) {
  // Standard rule: Pair of 4s or better
  if (evalDealer.code !== "PR") return true;
  const pairRank = evalDealer.vec[1];
  return pairRank >= 4; // 4 = value of "4"
}

export async function dealCrazy4Round(store, { ante, superBonus, queensUp, payouts }) {
  const round = await store.startRound("CRAZY4");

  await store.placeBet(round.id, "ANTE", ante);
  if (superBonus > 0) await store.placeBet(round.id, "SUPER_BONUS", superBonus);
  if (queensUp > 0) await store.placeBet(round.id, "QUEENS_UP", queensUp);

  const deck = shuffle(makeDeck());
  const player = deck.splice(0, 5);
  const dealer = deck.splice(0, 5);

  return {
    roundId: round.id,
    live: { ante, superBonus, queensUp, payouts, player, dealer }
  };
}

export async function foldCrazy4(store, roundId, live) {
  await store.settle(roundId, "ANTE", "LOSE", 0, 0);
  if (live.superBonus > 0) await store.settle(roundId, "SUPER_BONUS", "LOSE", 0, 0);
  if (live.queensUp > 0) await store.settle(roundId, "QUEENS_UP", "LOSE", 0, 0);

  await store.closeRound(roundId);
  return { detail: "Ante and bonuses lost." };
}

export async function playCrazy4(store, roundId, live) {
  await store.placeBet(roundId, "PLAY", live.ante);

  const pEval = eval5(live.player);
  const dEval = eval5(live.dealer);
  const qualifies = dealerQualifies(dEval);

  // Super Bonus (independent)
  if (live.superBonus > 0) {
    const mult = live.payouts.superBonus[pEval.code] ?? 0;
    if (mult > 0)
      await store.settle(roundId, "SUPER_BONUS", "WIN", mult * live.superBonus, live.superBonus);
    else
      await store.settle(roundId, "SUPER_BONUS", "LOSE", 0, 0);
  }

  // Queens Up (independent)
  if (live.queensUp > 0) {
    const mult = live.payouts.queensUp[pEval.code] ?? 0;
    if (mult > 0)
      await store.settle(roundId, "QUEENS_UP", "WIN", mult * live.queensUp, live.queensUp);
    else
      await store.settle(roundId, "QUEENS_UP", "LOSE", 0, 0);
  }

  let title = "";
  let detail = `Player: ${pEval.code} | Dealer: ${dEval.code}. `;

  if (!qualifies) {
    await store.settle(roundId, "ANTE", "WIN", live.ante, live.ante);
    await store.settle(roundId, "PLAY", "PUSH", 0, live.ante);
    title = "Dealer did NOT qualify";
    detail += "Ante wins; Play returned.";
  } else {
    const cmp = compareEval5(pEval, dEval);
    if (cmp > 0) {
      await store.settle(roundId, "ANTE", "WIN", live.ante, live.ante);
      await store.settle(roundId, "PLAY", "WIN", live.ante, live.ante);
      title = "PLAYER WINS";
    } else if (cmp < 0) {
      await store.settle(roundId, "ANTE", "LOSE", 0, 0);
      await store.settle(roundId, "PLAY", "LOSE", 0, 0);
      title = "DEALER WINS";
    } else {
      await store.settle(roundId, "ANTE", "PUSH", 0, live.ante);
      await store.settle(roundId, "PLAY", "PUSH", 0, live.ante);
      title = "TIE / PUSH";
    }
  }

  await store.closeRound(roundId);
  return { title, detail };
}
