// games/missstud/missstud.payouts.js

// Common default Mississippi Stud paytable (EDITABLE).
// PDF confirms Royal=500:1 and win/push thresholds, but not all rows.
export const DEFAULT_MAIN_PAYTABLE = {
  ROYAL_FLUSH: 500,
  STRAIGHT_FLUSH: 100,
  FOUR_KIND: 40,
  FULL_HOUSE: 10,
  FLUSH: 6,
  STRAIGHT: 4,
  THREE_KIND: 3,
  TWO_PAIR: 2,
  // handled specially:
  // PAIR_JACKS_PLUS => 1:1
  // PAIR_6_TO_10 => PUSH
};

// PDF-provided 3-card bonus paytable
export const DEFAULT_3CARD_BONUS = {
  STRAIGHT_FLUSH: 40,
  THREE_KIND: 30,
  STRAIGHT: 6,
  FLUSH: 3,
  PAIR: 1,
};

// --- Best-5-from-7 helper using your eval5 module ---
export function best5From7(cards7, eval5Fn) {
  // returns { cards5, score, category, handName, rankKey }
  let best = null;

  for (let a = 0; a < 7; a++)
    for (let b = a + 1; b < 7; b++) {
      const five = [];
      for (let i = 0; i < 7; i++) if (i !== a && i !== b) five.push(cards7[i]);

      const e = eval5Fn(five); // assume returns object or numeric; we normalize
      const norm = normalizeEval(e, five);

      if (!best || norm.score > best.score) best = norm;
    }

  // Map to payout keys:
  best.rankKey = mapToPayKey(best);
  return best;
}

function normalizeEval(e, cards5) {
  // If your eval5 returns numeric “strength”, keep it.
  // If it returns { score, name, category }, support that too.
  if (typeof e === "number") {
    return { cards5, score: e, category: null, handName: "—" };
  }
  return {
    cards5,
    score: e.score ?? 0,
    category: e.category ?? null,
    handName: e.name ?? e.handName ?? "—",
    // include any other fields you may already compute
    ...e,
  };
}

function mapToPayKey(best) {
  // If your eval returns a category string, use it.
  const c = (best.category || "").toUpperCase();

  if (c.includes("ROYAL")) return "ROYAL_FLUSH";
  if (c.includes("STRAIGHT_FLUSH")) return "STRAIGHT_FLUSH";
  if (c.includes("FOUR")) return "FOUR_KIND";
  if (c.includes("FULL")) return "FULL_HOUSE";
  if (c.includes("FLUSH")) return "FLUSH";
  if (c.includes("STRAIGHT")) return "STRAIGHT";
  if (c.includes("THREE")) return "THREE_KIND";
  if (c.includes("TWO_PAIR")) return "TWO_PAIR";

  // If your eval exposes pair ranks, use that; otherwise we do a basic check here:
  const ranks = best.cards5.map((c) => rankNum(c)).sort((a, b) => a - b);
  const counts = countRanks(ranks);
  const hasPair = Object.values(counts).some((v) => v === 2);

  if (hasPair) {
    const pairRank = Number(Object.keys(counts).find((k) => counts[k] === 2));
    // 6-10 push, J-A win
    if (pairRank >= 6 && pairRank <= 10) return "PAIR_6_TO_10";
    if (pairRank >= 11 || pairRank === 14) return "PAIR_JACKS_PLUS";
  }

  return "OTHER";
}

function rankNum(card) {
  // Expect cards like {rank:"A", suit:"S"} or "AS"
  // Prefer importing cardToRank from core if your card format differs.
  const r = card.rank ?? card[0];
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
