// horserace.engine.js
export function makeRace({ horseCount = 8, takeout = 0.15, rng = Math.random } = {}) {
  if (![4, 6, 8].includes(horseCount)) horseCount = 8;

  // Wider base range for larger fields (more separation)
  const ranges = {
    4: [0.70, 0.95],
    6: [0.62, 0.94],
    8: [0.55, 0.93],
  };
  const [minB, maxB] = ranges[horseCount];

  const horses = Array.from({ length: horseCount }, (_, i) => {
    const base = minB + rng() * (maxB - minB);
    return { id: `H${i + 1}`, name: defaultHorseName(i), base };
  });

  // Convert bases to probabilities
  const sum = horses.reduce((a, h) => a + h.base, 0);
  horses.forEach(h => (h.p = h.base / sum));

  // Convert p -> decimal odds, then adjust by field size
  // Bigger field: slightly longer odds on average
  const fieldMultiplier = { 4: 0.92, 6: 1.00, 8: 1.08 }[horseCount];

  horses.forEach(h => {
    const raw = (1 / h.p) * fieldMultiplier;

    // Clamp to keep things reasonable
    h.odds = round2(clamp(raw, 1.2, 20));
  });

  // Pick winner by weighted probability
  const winner = weightedPick(horses, rng);

  // For UI: produce finish order (winner first, rest randomized weighted)
  const finishOrder = [winner, ...weightedOrder(horses.filter(x => x.id !== winner.id), rng)];

  return { horseCount, horses, winnerId: winner.id, finishOrder, takeout };
}

export function settleWinBet({ horseId, amount }, race) {
  const horse = race.horses.find(h => h.id === horseId);
  if (!horse) return { result: "invalid", payout: 0, net: -amount };

  const won = horseId === race.winnerId;
  if (!won) return { result: "lose", payout: 0, net: -amount };

  // Payout includes returning stake (typical casino display)
  const payout = Math.floor(amount * horse.odds * (1 - race.takeout));
  return { result: "win", payout, net: payout - amount, odds: horse.odds };
}

// ---------- helpers ----------
function weightedPick(items, rng) {
  const total = items.reduce((a, x) => a + x.p, 0);
  let r = rng() * total;
  for (const it of items) {
    r -= it.p;
    if (r <= 0) return it;
  }
  return items[items.length - 1];
}

function weightedOrder(items, rng) {
  const pool = items.map(x => ({ ...x }));
  const out = [];
  while (pool.length) {
    const picked = weightedPick(pool, rng);
    out.push(picked);
    pool.splice(pool.findIndex(x => x.id === picked.id), 1);
    // re-normalize p for remaining pool
    const sum = pool.reduce((a, x) => a + x.p, 0);
    if (sum > 0) pool.forEach(x => (x.p = x.p / sum));
  }
  return out;
}

function defaultHorseName(i) {
  const a = ["Midnight", "Solar", "Crimson", "Neon", "Silver", "Thunder", "Velvet", "Rapid"];
  const b = ["Circuit", "Comet", "Dash", "Arrow", "Mirage", "Runner", "Stride", "Storm"];
  return `${a[i % a.length]} ${b[(i * 3) % b.length]}`;
}

function clamp(x, a, b) { return Math.max(a, Math.min(b, x)); }
function round2(x) { return Math.round(x * 100) / 100; }
