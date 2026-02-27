// horserace.engine.js
export function makeRace({
  horseCount = 8,
  takeout = 0.15,
  rng = Math.random,
  durationMs = 8000,
} = {}) {
  if (![4, 6, 8].includes(horseCount)) horseCount = 8;

  // Volatility controls how "spread out" the odds feel.
  // Smaller fields tend to have a shorter-priced favorite.
  const sigmaByField = { 4: 0.65, 6: 0.85, 8: 1.0 };
  const sigma = sigmaByField[horseCount];

  // Common fractional odds "to-1" ladder (you can tweak this list)
  const ladders = {
    4: [1, 2, 3, 4, 5, 6, 7, 8, 10, 12, 15],
    6: [1, 2, 3, 4, 5, 6, 7, 8, 10, 12, 15, 20],
    8: [1, 2, 3, 4, 5, 6, 7, 8, 10, 12, 15, 20, 30],
  };
  const ladder = ladders[horseCount];

  // Generate lognormal-ish strengths -> probabilities
  const usedNames = new Set();

  const horses = Array.from({ length: horseCount }, (_, i) => {
    const z = (rng() * 2 - 1) * sigma;
    const strength = Math.exp(z);
    return {
      id: `H${i + 1}`,
      name: defaultHorseName(i, usedNames, rng),
      strength,
    };
  });

  const sum = horses.reduce((a, h) => a + h.strength, 0);
  horses.forEach((h) => (h.p = h.strength / sum));

  // Convert probability -> fair fractional odds: (1/p) - 1, then quantize to a ladder
  horses.forEach((h) => {
    const fairFrac = 1 / h.p - 1; // profit per 1
    const frac = quantizeToLadder(fairFrac, ladder);
    h.frac = frac; // e.g., 10 means "10-1"
    h.dec = frac + 1; // decimal return multiplier incl stake
    h.oddsStr = `${frac}-1`;
  });

  // Pick winner by weighted probability
  const winner = weightedPick(horses, rng);

  // Finish order: winner first; rest weighted
  const finishOrder = [
    winner,
    ...weightedOrder(
      horses.filter((x) => x.id !== winner.id),
      rng,
    ),
  ];

  return {
    horseCount,
    horses,
    winnerId: winner.id,
    finishOrder,
    takeout,
    durationMs,
  };
}

export function settleWinBet({ horseId, amount }, race) {
  const horse = race.horses.find((h) => h.id === horseId);
  if (!horse) return { result: "invalid", payout: 0, net: -amount };

  const won = horseId === race.winnerId;
  if (!won) return { result: "lose", payout: 0, net: -amount };

  // Return includes stake, reduced by takeout (simple "house cut" model)
  const payout = Math.floor(amount * horse.dec * (1 - race.takeout));
  return {
    result: "win",
    payout,
    net: payout - amount,
    oddsStr: horse.oddsStr,
    dec: horse.dec,
  };
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
  const pool = items.map((x) => ({ ...x }));
  const out = [];
  while (pool.length) {
    const picked = weightedPick(pool, rng);
    out.push(picked);
    pool.splice(
      pool.findIndex((x) => x.id === picked.id),
      1,
    );
    const sum = pool.reduce((a, x) => a + x.p, 0);
    if (sum > 0) pool.forEach((x) => (x.p = x.p / sum));
  }
  return out;
}

function quantizeToLadder(x, ladder) {
  // Clamp to ladder range then choose nearest step
  const min = ladder[0];
  const max = ladder[ladder.length - 1];
  const v = clamp(x, min, max);

  let best = ladder[0];
  let bestD = Math.abs(v - best);
  for (const step of ladder) {
    const d = Math.abs(v - step);
    if (d < bestD) {
      bestD = d;
      best = step;
    }
  }
  return best;
}

function defaultHorseName(i, used = new Set(), rng = Math.random) {
  const A = [
    "Midnight",
    "Solar",
    "Crimson",
    "Neon",
    "Silver",
    "Thunder",
    "Velvet",
    "Rapid",
    "Blazing",
    "Iron",
    "Phantom",
    "Quantum",
    "Electric",
    "Scarlet",
    "Golden",
    "Shadow",
    "Blitz",
    "Frost",
    "Obsidian",
    "Turbo",
    "Mystic",
    "Royal",
    "Inferno",
    "Stealth",
    "Cosmic",
    "Titan",
    "Vortex",
    "Emerald",
    "Onyx",
    "Starlight",
    "Lunar",
    "Atomic",
    "Chrome",
    "Hyper",
    "Velocity",
    "Majestic",
    "Radiant",
    "Eclipse",
    "Cobalt",
    "Sapphire",
  ];

  const B = [
    "Circuit",
    "Comet",
    "Dash",
    "Arrow",
    "Mirage",
    "Runner",
    "Stride",
    "Storm",
    "Blaze",
    "Rocket",
    "Falcon",
    "Rider",
    "Flash",
    "Tempest",
    "Bolt",
    "Nova",
    "Drift",
    "Charge",
    "Fury",
    "Horizon",
    "Breaker",
    "Surge",
    "Glide",
    "Whisper",
    "Clash",
    "Strike",
    "Trail",
    "Derby",
    "Sprint",
    "Streak",
    "Charger",
  ];

  const ROMAN = ["II", "III", "IV", "V"];

  // tune these to taste
  const THE_CHANCE = 0.15; // 15% chance: "The ..."
  const ROMAN_CHANCE = 0.2; // 20% chance: "... II/III/IV/V"

  let tries = 0;
  while (tries++ < 80) {
    const a = A[Math.floor(rng() * A.length)];
    const b = B[Math.floor(rng() * B.length)];
    if (a === b) continue;

    let name = `${a} ${b}`;

    // optional "The" prefix
    if (rng() < THE_CHANCE) name = `The ${name}`;

    // optional roman numeral suffix
    if (rng() < ROMAN_CHANCE) {
      const numeral = ROMAN[Math.floor(rng() * ROMAN.length)];
      name = `${name} ${numeral}`;
    }

    if (!used.has(name)) {
      used.add(name);
      return name;
    }
  }

  // fallback (should be rare)
  return `Horse ${i + 1}`;
}

function clamp(x, a, b) {
  return Math.max(a, Math.min(b, x));
}
