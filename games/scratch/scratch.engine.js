import { THEMES } from "../slots/slots.themes.js"; // adjust path to match your project

function buildSymbolMultFromTheme(
  slotThemeKey,
  { minMult = 1, maxMult = 5 } = {},
) {
  const theme = THEMES[slotThemeKey];
  if (!theme) return {};

  // Score each symbol by its 3-of-kind pay if present; otherwise by role.
  // (Most themes have a payout table on A/K/Q/J/T/W, and flags for S/B/C/MJ/MR/MJ2.) :contentReference[oaicite:3]{index=3}
  const entries = Object.entries(theme.symbols || {}).map(([code, s]) => {
    let score = 0;

    const p3 = s?.payout?.[3];
    if (typeof p3 === "number" && isFinite(p3) && p3 > 0) {
      score = p3;
    } else {
      // Fallback “importance” for non-line-pay symbols
      if (s?.jackpot)
        score = 999; // MJ/MR/MJ2
      else if (s?.wild)
        score = 120; // W
      else if (s?.bonus)
        score = 80; // B
      else if (s?.scatter)
        score = 60; // S
      else if (s?.coin)
        score = 40; // C
      else score = 10;
    }

    const icon = theme.icons?.[code] ?? code;
    return { code, icon, score };
  });

  // Filter down to icons you actually allow in Match-3.
  // Typically you’ll include the “main” symbols + maybe coin/bonus/scatter, but NOT slot jackpots.
  const filtered = entries.filter((e) => {
    const s = theme.symbols?.[e.code];
    if (!s) return false;
    if (s.jackpot) return false; // exclude MJ/MR/MJ2 from Match-3 by default
    if (e.icon == null || e.icon === "") return false;
    return true;
  });

  // Rank by score, then compress into [minMult..maxMult]
  filtered.sort((a, b) => a.score - b.score);

  const uniqueScores = [...new Set(filtered.map((x) => x.score))];
  const span = Math.max(1, uniqueScores.length - 1);

  const out = {};
  for (const item of filtered) {
    const idx = uniqueScores.indexOf(item.score); // 0..span
    const t = idx / span; // 0..1
    const mult = Math.round(minMult + t * (maxMult - minMult));
    out[item.icon] = Math.max(minMult, Math.min(maxMult, mult));
  }

  return out;
}

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

function chance(p) {
  return Math.random() < p;
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
  const baseTierPayout = tier.mult * ticketDef.price;

  const icons = iconPoolForTicket(ticketDef); // uses slots.themes.js unless icons override
  const mode = ticketDef.match3Mode || "single";

  const wildIcon = ticketDef.wildIcon || "🃏";
  const jackpotIcon = ticketDef.jackpotIcon || "🏆";
  const jackpotMult = Number(ticketDef.jackpotMult || 0);

  const wildChance =
    typeof ticketDef.wildChance === "number" ? ticketDef.wildChance : 0.25;
  const jackpotChance =
    typeof ticketDef.jackpotChance === "number" ? ticketDef.jackpotChance : 0.0;
  const doubleSetChance =
    typeof ticketDef.doubleSetChance === "number"
      ? ticketDef.doubleSetChance
      : 0.15;

  // Decide whether this ticket is a "win" at all (tier.mult > 0 means win)
  const isWinTier = baseTierPayout > 0;

  // Decide number of paying sets we want (only if win tier)
  let wantSets = 0;
  if (isWinTier) {
    wantSets = mode === "perSet" ? (chance(doubleSetChance) ? 2 : 1) : 1;
  }

  // Board setup
  const board = new Array(9).fill(null);

  // If losing ticket: prevent any triples at all
  if (wantSets === 0) {
    const counts = new Map();
    for (let i = 0; i < 9; i++) {
      let tries = 0;
      while (tries++ < 400) {
        const ic = icons[randInt(icons.length)];
        const c = counts.get(ic) ?? 0;
        if (c >= 2) continue; // no triples
        board[i] = ic;
        counts.set(ic, c + 1);
        break;
      }
      if (!board[i]) board[i] = icons[0];
    }

    return {
      kind: "match3",
      tierLabel: tier.label,
      baseTierPayout,
      winAmount: 0,
      boardIcons: board,
      winSets: [],
      setCount: 0,
      match3Mode: mode,
      isJackpot: false,
    };
  }

  // Winning ticket: build paying sets intentionally
  const payingSets = []; // each { idxs:[...], targetIcon, isJackpot }
  const usedIdx = shuffle([0, 1, 2, 3, 4, 5, 6, 7, 8]);

  // Jackpot override: if triggered, we force exactly ONE jackpot set (3🏆)
  const doJackpot = jackpotMult > 0 && chance(jackpotChance);

  if (doJackpot) {
    const idxs = usedIdx.slice(0, 3);
    idxs.forEach((i) => (board[i] = jackpotIcon));
    payingSets.push({ idxs, targetIcon: jackpotIcon, isJackpot: true });
  } else {
    // Create 1 or 2 paying sets with target symbols (+ optional wild)
    for (let s = 0; s < wantSets; s++) {
      const idxs = usedIdx.slice(s * 3, s * 3 + 3);

      // Choose a target symbol from theme pool
      const target = icons[randInt(icons.length)];

      // Place target in all 3
      idxs.forEach((i) => (board[i] = target));

      // Optionally swap one spot for wild
      if (chance(wildChance)) {
        const j = idxs[randInt(idxs.length)];
        board[j] = wildIcon;
      }

      payingSets.push({ idxs, targetIcon: target, isJackpot: false });
    }
  }

  // Fill the remaining cells:
  // - In SINGLE mode: prevent ANY other triple from appearing (keeps "single prize" visually honest)
  // - In PERSET mode: allow duplicates, but still avoid creating a 3rd paying set accidentally
  const counts = new Map();
  for (const ic of board) {
    if (!ic) continue;
    counts.set(ic, (counts.get(ic) ?? 0) + 1);
  }

  for (let i = 0; i < 9; i++) {
    if (board[i]) continue;

    let tries = 0;
    while (tries++ < 400) {
      const ic = icons[randInt(icons.length)];
      const c = counts.get(ic) ?? 0;

      if (mode === "single") {
        // do not allow any icon to reach 3
        if (c >= 2) continue;
      } else {
        // perSet: avoid creating 3rd triple by accident (cap at 2 for all *non-target* icons)
        if (c >= 2) continue;
      }

      board[i] = ic;
      counts.set(ic, c + 1);
      break;
    }

    if (!board[i]) board[i] = icons[0];
  }

  // Compute payout
  let winAmount = 0;
  let isJackpotFinal = false;

  if (doJackpot) {
    winAmount = ticketDef.price * jackpotMult;
    isJackpotFinal = true;
  } else {
    const symbolMult =
      ticketDef.symbolMult ||
      buildSymbolMultFromTheme(ticketDef.slotThemeKey || ticketDef.themeKey);
    const setPays = payingSets.map((ps) => {
      const mult = Number(symbolMult[ps.targetIcon] || 1);
      return baseTierPayout * mult;
    });

    winAmount =
      mode === "perSet" ? setPays.reduce((a, b) => a + b, 0) : setPays[0];
  }

  return {
    kind: "match3",
    tierLabel: tier.label,
    baseTierPayout,
    winAmount,
    boardIcons: board,
    winSets: payingSets.map((ps) => ps.idxs),
    setCount: payingSets.length,
    match3Mode: mode,
    isJackpot: isJackpotFinal,
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
