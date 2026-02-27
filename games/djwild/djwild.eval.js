// games/djwild/djwild.eval.js
// Airtight DJ Wild evaluator via FULL SUBSTITUTION (combinations with repetition).
// Wilds: all 2's + Joker. Allows 5-of-a-kind.
// Returns: { key, name, score, isNaturalForTrips }

const SUITS = ["S", "H", "D", "C"];
const RANKS = ["2", "3", "4", "5", "6", "7", "8", "9", "T", "J", "Q", "K", "A"];
const RV = {
  2: 2,
  3: 3,
  4: 4,
  5: 5,
  6: 6,
  7: 7,
  8: 8,
  9: 9,
  T: 10,
  J: 11,
  Q: 12,
  K: 13,
  A: 14,
};

// Category strength order (higher is better)
const CAT = {
  HIGH_CARD: 1,
  PAIR: 2,
  TWO_PAIR: 3,
  THREE_KIND: 4,
  STRAIGHT: 5,
  FLUSH: 6,
  FULL_HOUSE: 7,
  FOUR_KIND: 8,
  STRAIGHT_FLUSH: 9,
  FIVE_OF_KIND: 10,
  ROYAL_FLUSH: 11,
  FIVE_WILDS: 12,
};

function isJoker(c) {
  return c?.joker === true || c?.r === "JOKER";
}
function isDeuce(c) {
  return c?.r === "2";
}
function isWild(c) {
  return isJoker(c) || isDeuce(c);
}
function cardStr(c) {
  return `${c.r}${c.s}`;
} // e.g. "AS"
function prettyCard(c) {
  const suit = c.s === "S" ? "♠" : c.s === "H" ? "♥" : c.s === "D" ? "♦" : "♣";
  const rank = c.r === "T" ? "10" : c.r;
  return `${rank}${suit}`;
}

// Physical "Five Wilds" is strictly Joker + four 2s
export function isFiveWildsPhysical(cards) {
  if (cards.length !== 5) return false;
  const jok = cards.filter(isJoker).length;
  const deu = cards.filter(isDeuce).length;
  return jok === 1 && deu === 4;
}

// Prebuild 52 card-types (rank+suit). Wilds can duplicate any of these.
const CARD_TYPES = (() => {
  const out = [];
  for (const s of SUITS) for (const r of RANKS) out.push({ r, s });
  return out;
})();

function encodeScore(cat, tiebreakers) {
  // Cat dominates. Add tiebreakers lexicographically using diminishing weights.
  // Ensure strictly comparable numeric score.
  let score = cat * 1e12;
  let mul = 1e10;
  for (const v of tiebreakers) {
    score += v * mul;
    mul = Math.floor(mul / 100);
  }
  return score;
}

function countsByRank(vals) {
  const m = new Map();
  for (const v of vals) m.set(v, (m.get(v) || 0) + 1);
  // sort by (count desc, rank desc)
  return [...m.entries()].sort((a, b) => b[1] - a[1] || b[0] - a[0]);
}

function isFlush(hand) {
  const s = hand[0].s;
  return hand.every((c) => c.s === s);
}

function straightHigh(vals) {
  // vals: ranks numeric, may contain duplicates
  const uniq = [...new Set(vals)].sort((a, b) => a - b);
  if (uniq.length !== 5) return null;

  // wheel A2345
  const wheel = [2, 3, 4, 5, 14];
  const isWheel = wheel.every((v) => uniq.includes(v));
  if (isWheel) return 5;

  for (let i = 0; i < 4; i++) if (uniq[i] + 1 !== uniq[i + 1]) return null;
  return uniq[4];
}

function evaluateNoWild5(hand) {
  // hand: 5 cards, may contain duplicate exact cards due to wild mimic (that's ok)
  const vals = hand.map((c) => RV[c.r]).sort((a, b) => b - a);
  const flush = isFlush(hand);
  const sHi = straightHigh(vals);

  // rank counts
  const cnt = countsByRank(vals);
  const freqs = cnt.map((x) => x[1]); // like [3,2] etc

  // ROYAL FLUSH
  if (flush && sHi === 14) {
    const need = new Set([10, 11, 12, 13, 14]);
    const uniq = new Set(vals);
    if (need.size === uniq.size && [...need].every((v) => uniq.has(v))) {
      return {
        key: "ROYAL_FLUSH",
        name: "Royal Flush",
        cat: CAT.ROYAL_FLUSH,
        t: [14],
      };
    }
  }

  // STRAIGHT FLUSH
  if (flush && sHi) {
    return {
      key: "STRAIGHT_FLUSH",
      name: "Straight Flush",
      cat: CAT.STRAIGHT_FLUSH,
      t: [sHi],
    };
  }

  // FIVE OF A KIND
  if (freqs[0] === 5) {
    return {
      key: "FIVE_OF_KIND",
      name: "Five of a Kind",
      cat: CAT.FIVE_OF_KIND,
      t: [cnt[0][0]],
    };
  }

  // FOUR OF A KIND
  if (freqs[0] === 4) {
    const quad = cnt[0][0];
    const kicker = cnt[1][0];
    return {
      key: "FOUR_KIND",
      name: "Four of a Kind",
      cat: CAT.FOUR_KIND,
      t: [quad, kicker],
    };
  }

  // FULL HOUSE
  if (freqs[0] === 3 && freqs[1] === 2) {
    const trip = cnt[0][0];
    const pair = cnt[1][0];
    return {
      key: "FULL_HOUSE",
      name: "Full House",
      cat: CAT.FULL_HOUSE,
      t: [trip, pair],
    };
  }

  // FLUSH
  if (flush) {
    // tie by sorted ranks
    const uniq = vals.slice().sort((a, b) => b - a);
    return { key: "FLUSH", name: "Flush", cat: CAT.FLUSH, t: uniq };
  }

  // STRAIGHT
  if (sHi) {
    return { key: "STRAIGHT", name: "Straight", cat: CAT.STRAIGHT, t: [sHi] };
  }

  // THREE OF A KIND
  if (freqs[0] === 3) {
    const trip = cnt[0][0];
    const kickers = cnt
      .slice(1)
      .map((x) => x[0])
      .sort((a, b) => b - a);
    return {
      key: "THREE_KIND",
      name: "Three of a Kind",
      cat: CAT.THREE_KIND,
      t: [trip, ...kickers],
    };
  }

  // TWO PAIR
  if (freqs[0] === 2 && freqs[1] === 2) {
    const p1 = Math.max(cnt[0][0], cnt[1][0]);
    const p2 = Math.min(cnt[0][0], cnt[1][0]);
    const kicker = cnt[2][0];
    return {
      key: "TWO_PAIR",
      name: "Two Pair",
      cat: CAT.TWO_PAIR,
      t: [p1, p2, kicker],
    };
  }

  // PAIR
  if (freqs[0] === 2) {
    const pair = cnt[0][0];
    const kickers = cnt
      .slice(1)
      .map((x) => x[0])
      .sort((a, b) => b - a);
    return { key: "PAIR", name: "Pair", cat: CAT.PAIR, t: [pair, ...kickers] };
  }

  // HIGH CARD
  return {
    key: "HIGH_CARD",
    name: "High Card",
    cat: CAT.HIGH_CARD,
    t: vals.slice(),
  };
}

// Generate all multisets (combinations with repetition) of size k from CARD_TYPES indices [0..51].
// This is C(52+k-1, k). For k=5: 3,819,816 combos (ok for occasional hand eval).
function* combosWithRepetition(k, startIdx = 0, picked = []) {
  if (picked.length === k) {
    yield picked.slice();
    return;
  }
  for (let i = startIdx; i < CARD_TYPES.length; i++) {
    picked.push(i);
    yield* combosWithRepetition(k, i, picked);
    picked.pop();
  }
}

function bestWithWilds(cards5, treatDeucesWild = true) {
  const wilds = cards5.filter(
    (c) => isJoker(c) || (treatDeucesWild && isDeuce(c)),
  );
  const fixed = cards5.filter(
    (c) => !isJoker(c) && !(treatDeucesWild && isDeuce(c)),
  );

  const k = wilds.length;
  if (k === 0) {
    const e = evaluateNoWild5(fixed);
    e.score = encodeScore(e.cat, e.t);
    e.bestHand = fixed;
    e.wildNote = "";
    return e;
  }

  let best = null;

  for (const idxs of combosWithRepetition(k)) {
    const repl = idxs.map((i) => CARD_TYPES[i]);
    const hand = fixed.concat(repl);

    const e = evaluateNoWild5(hand);
    const score = encodeScore(e.cat, e.t);

    if (!best || score > best.score) {
      best = { ...e, score, bestHand: hand, repl };
    }
  }

  // build a user-facing "wild resolved as ..." note
  let wildNote = "";
  if (best && k > 0) {
    const parts = [];
    for (let i = 0; i < k; i++) {
      const orig = wilds[i];
      const as = best.repl[i];
      const origLabel = isJoker(orig) ? "Joker" : prettyCard(orig);
      parts.push(`${origLabel} → ${prettyCard(as)}`);
    }
    wildNote = parts.length ? `Wilds: ${parts.join(", ")}` : "";
  }

  best.wildNote = wildNote;
  return best;
}

export function evalDJWild5(cards) {
  // Physical Five Wilds overrides everything
  if (isFiveWildsPhysical(cards)) {
    return {
      key: "FIVE_WILDS",
      name: "Five Wilds",
      score: encodeScore(CAT.FIVE_WILDS, [0]),
      isNaturalForTrips: false,
    };
  }

  const hasJ = cards.some(isJoker);

  // Best hand using DJ rules (deuces + joker wild)
  const bestWild = bestWithWilds(cards, true);

  // Natural-for-trips (airtight interpretation):
  // If no joker, compute best where deuces are NOT wild. If it matches bestWild exactly, call it natural.
  let isNaturalForTrips = false;
  if (!hasJ) {
    const bestNoDeuceWild = bestWithWilds(cards, false);
    isNaturalForTrips = bestNoDeuceWild.score === bestWild.score;
  }

  return {
    key: bestWild.key,
    name: bestWild.name,
    score: bestWild.score,
    isNaturalForTrips,
    wildNote: bestWild.wildNote || "",
    bestHand: bestWild.bestHand || null,
  };
}
