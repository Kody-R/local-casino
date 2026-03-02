import { THEMES } from "../slots/slots.themes.js";

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

function iconPoolForTicket(ticketDef) {
  // Allow explicit override
  if (ticketDef.icons?.length) return ticketDef.icons;

  const t = THEMES[ticketDef.slotThemeKey];
  if (!t?.icons)
    throw new Error(`Unknown slotThemeKey: ${ticketDef.slotThemeKey}`);

  // Pull theme icon values, filter out "A,K,Q,J,10" style entries
  const vals = Object.values(t.icons).filter(Boolean);
  const pool = [...new Set(vals)].filter((v) => !/^[A-Z0-9]+$/.test(v)); // removes A,K,Q,J,10
  if (pool.length < 4)
    throw new Error(`Theme ${ticketDef.slotThemeKey} icon pool too small`);
  return pool;
}

function findTripleSets(boardIcons) {
  const byIcon = new Map();
  boardIcons.forEach((ic, i) => {
    if (!byIcon.has(ic)) byIcon.set(ic, []);
    byIcon.get(ic).push(i);
  });

  const sets = [];
  for (const [ic, idxs] of byIcon.entries()) {
    if (idxs.length >= 3) {
      // if 6 of same icon appear, this makes 2 sets (0-2, 3-5)
      for (let k = 0; k + 2 < idxs.length; k += 3) {
        sets.push({ icon: ic, idxs: idxs.slice(k, k + 3) });
      }
    }
  }
  return sets;
}

function fmtAmount(n) {
  return new Intl.NumberFormat().format(n);
}

function buildMatch3Board(ticketDef, wantSets) {
  const icons = ticketDef.icons;
  const board = new Array(9).fill(null);
  const counts = new Map();

  // pick the winning icon and assign 3*wantSets positions
  const winIcon = icons[randInt(icons.length)];
  const allIdx = shuffle([0, 1, 2, 3, 4, 5, 6, 7, 8]);
  const used = allIdx.slice(0, 3 * wantSets);

  used.forEach((i) => {
    board[i] = winIcon;
  });
  counts.set(winIcon, 3 * wantSets);

  // fill remaining cells
  for (let i = 0; i < 9; i++) {
    if (board[i]) continue;

    let tries = 0;
    while (tries++ < 300) {
      const ic = icons[randInt(icons.length)];
      const c = counts.get(ic) ?? 0;

      if (ticketDef.match3Mode === "single") {
        // In single mode, do NOT allow any other icon to reach 3
        if (ic !== winIcon && c >= 2) continue;
        // also keep winIcon from reaching >3
        if (ic === winIcon) continue;
      } else {
        // perSet: keep things reasonable (optional), but don't block triples
        // you can still prevent 9-of-a-kind if you want
      }

      board[i] = ic;
      counts.set(ic, c + 1);
      break;
    }

    if (!board[i]) board[i] = icons[0];
  }

  return { boardIcons: board, winIcon };
}

// ---------------------------
// Match-3 amounts generator
// ---------------------------
function generateMatch3(ticketDef) {
  const tier = pickWeighted(ticketDef.tiers);
  const baseWinAmount = tier.mult * ticketDef.price;

  const icons = ticketDef.icons;
  const mode = ticketDef.match3Mode || "single";

  // Determine desired number of winning sets
  let wantSets = 0;
  if (baseWinAmount > 0) {
    if (mode === "perSet") {
      const p2 = 0.15; // 15% chance of double set
      wantSets = Math.random() < p2 ? 2 : 1;
    } else {
      wantSets = 1;
    }
  }

  const board = new Array(9).fill(null);
  const counts = new Map();
  let winIcon = null;

  if (wantSets > 0) {
    winIcon = icons[Math.floor(Math.random() * icons.length)];

    // Place 3 * wantSets winning icons
    const idxs = shuffle([0, 1, 2, 3, 4, 5, 6, 7, 8]).slice(0, 3 * wantSets);
    idxs.forEach((i) => {
      board[i] = winIcon;
    });

    counts.set(winIcon, 3 * wantSets);

    // Fill remaining cells
    for (let i = 0; i < 9; i++) {
      if (board[i]) continue;

      let tries = 0;
      while (tries++ < 300) {
        const ic = icons[Math.floor(Math.random() * icons.length)];
        const c = counts.get(ic) ?? 0;

        if (mode === "single") {
          if (ic === winIcon) continue; // no extra win icons
          if (c >= 2) continue; // no other triple
        } else {
          if (ic === winIcon && c >= 3 * wantSets) continue;
        }

        board[i] = ic;
        counts.set(ic, c + 1);
        break;
      }

      if (!board[i]) board[i] = icons[0];
    }
  } else {
    // Losing board — no triples allowed
    for (let i = 0; i < 9; i++) {
      let tries = 0;
      while (tries++ < 300) {
        const ic = icons[Math.floor(Math.random() * icons.length)];
        const c = counts.get(ic) ?? 0;
        if (c >= 2) continue;
        board[i] = ic;
        counts.set(ic, c + 1);
        break;
      }
    }
  }

  // Determine actual triple sets
  const sets = findTripleSets(board);
  const payingSets = winIcon ? sets.filter((s) => s.icon === winIcon) : [];

  const setCount = payingSets.length;

  const winAmount =
    mode === "perSet"
      ? baseWinAmount * setCount
      : setCount > 0
        ? baseWinAmount
        : 0;

  return {
    kind: "match3",
    tierLabel: tier.label,
    baseWinAmount,
    winAmount,
    boardIcons: board,
    winIcon,
    winSets: payingSets.map((s) => s.idxs),
    setCount,
    match3Mode: mode,
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
