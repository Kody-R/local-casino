function pickWeighted(table) {
  const total = table.reduce((s, t) => s + t.weight, 0);
  let r = Math.random() * total;
  for (const t of table) {
    if (r < t.weight) return t;
    r -= t.weight;
  }
  return table[0];
}

function randInt(n) {
  return Math.floor(Math.random() * n);
}

function shuffle(a) {
  for (let i = a.length - 1; i > 0; i--) {
    const j = randInt(i + 1);
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function fmtAmount(n) {
  return new Intl.NumberFormat().format(n);
}

// ---------------------------
// Match-3 amounts generator
// ---------------------------
function generateMatch3(ticketDef) {
  const tier = pickWeighted(ticketDef.tiers);
  const winAmount = tier.mult * ticketDef.price;

  let amounts = new Array(9).fill(0);

  if (winAmount > 0) {
    const idxs = shuffle([0, 1, 2, 3, 4, 5, 6, 7, 8]).slice(0, 3);
    for (const i of idxs) amounts[i] = winAmount;

    const usedCounts = new Map([[winAmount, 3]]);
    for (let i = 0; i < 9; i++) {
      if (amounts[i] !== 0) continue;

      let tries = 0;
      while (tries++ < 200) {
        const mult = ticketDef.decoys[randInt(ticketDef.decoys.length)];
        const amt = mult * ticketDef.price;
        const cur = usedCounts.get(amt) ?? 0;
        if (amt !== winAmount && cur >= 2) continue;
        amounts[i] = amt;
        usedCounts.set(amt, cur + 1);
        break;
      }
      if (amounts[i] === 0) amounts[i] = ticketDef.price;
    }
  } else {
    const usedCounts = new Map();
    for (let i = 0; i < 9; i++) {
      let tries = 0;
      while (tries++ < 300) {
        const mult = ticketDef.decoys[randInt(ticketDef.decoys.length)];
        const amt = mult * ticketDef.price;
        const cur = usedCounts.get(amt) ?? 0;
        if (cur >= 2) continue;
        amounts[i] = amt;
        usedCounts.set(amt, cur + 1);
        break;
      }
      if (amounts[i] === 0) amounts[i] = ticketDef.price;
    }
  }

  return {
    kind: "match3",
    tierLabel: tier.label,
    winAmount,
    board: amounts,
    boardText: amounts.map((x) => `$${fmtAmount(x)}`),
  };
}

// ---------------------------
// Lucky Numbers generator
// ---------------------------
function uniqueNumbers(count, min, max) {
  const set = new Set();
  while (set.size < count) {
    set.add(min + randInt(max - min + 1));
  }
  return [...set];
}

function generateLucky(ticketDef) {
  // Choose #matches (predetermined)
  const mPick = pickWeighted(ticketDef.matchChance);
  const matches = Math.min(mPick.matches, ticketDef.winNumsCount);

  // Build winning numbers
  const winning = uniqueNumbers(ticketDef.winNumsCount, 1, 60);

  // Decide payout if matches>0
  let winAmount = 0;
  let tierLabel = "LOSE";
  if (matches > 0) {
    const tier = pickWeighted(ticketDef.prizeTiers);
    tierLabel = tier.label;
    winAmount = tier.mult * ticketDef.price;
  }

  // Build your numbers:
  // - Ensure exactly `matches` numbers are shared with winning numbers
  // - Rest are unique and not in winning
  const your = [];
  const winningShuffled = shuffle([...winning]);
  const matchSet = new Set(winningShuffled.slice(0, matches));

  for (const n of matchSet) your.push(n);

  while (your.length < ticketDef.yourNumsCount) {
    const n = 1 + randInt(60);
    if (matchSet.has(n)) continue;
    if (winning.includes(n)) continue;
    if (your.includes(n)) continue;
    your.push(n);
  }

  shuffle(your);

  // Marks for UI highlight after reveal
  const winSet = new Set(winning);
  const hitIdxs = [];
  your.forEach((n, i) => {
    if (winSet.has(n)) hitIdxs.push(i);
  });

  return {
    kind: "lucky",
    tierLabel,
    matches,
    winAmount,
    winning,
    your,
    hitIdxs,
  };
}

// ---------------------------
// Public: generate by ticket type
// ---------------------------
export function generateTicket(ticketDef) {
  if (ticketDef.type === "match3") return generateMatch3(ticketDef);
  if (ticketDef.type === "lucky") return generateLucky(ticketDef);
  throw new Error(`Unknown scratch ticket type: ${ticketDef.type}`);
}