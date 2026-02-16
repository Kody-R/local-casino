// games/slots/slots.engine.js
export function spinSlots(theme, { betPerLine, linesEnabled }) {
  const { symbols, paylines, weights, bonus, biasPolicy } = theme;

  const totalBet = betPerLine * linesEnabled;

  // Compute small feature bias (0..1 range-ish), then apply caps
  const bias = computeBias(totalBet, linesEnabled, biasPolicy);

  // Roll each reel’s 3-symbol window from weights (+bias applied)
  const reels = Array.from({ length: 5 }, (_, reelIndex) =>
    rollReelWindow(theme, reelIndex, bias)
  );

  // Convert to [row][reel] grid
  const grid = [
    reels.map(r => r[0]),
    reels.map(r => r[1]),
    reels.map(r => r[2]),
  ];

  // ---- the rest of your existing win logic can remain the same ----
  const activeLines = paylines.slice(0, linesEnabled);

  let lineWins = [];
  let totalLinePay = 0;

  activeLines.forEach((line, idx) => {
    const syms = line.map((row, reel) => grid[row][reel]);
    const w = bestLineWin(syms, symbols);
    if (w.pay > 0) {
      const win = w.pay * betPerLine;
      totalLinePay += win;
      lineWins.push({ lineIndex: idx, symbol: w.sym, count: w.count, payMult: w.pay, win });
    }
  });

  const scat = countWhere(grid, s => symbols[s]?.scatter);
  let scatterWin = 0;
  if (scat >= 3) {
    const mult = symbols["S"]?.payout?.[scat] ?? 0;
    scatterWin = mult * betPerLine;
  }

  const coinCount = countWhere(grid, s => symbols[s]?.coin || symbols[s]?.jackpot);
  const holdTrig = coinCount >= (bonus?.holdSpin?.triggerCoins ?? 999);

  const freeSpinTrig = scat >= (bonus?.freeSpins?.scatterNeeded ?? 999);
  const freeSpinsAward = freeSpinTrig ? (bonus.freeSpins.awards[scat] ?? 0) : 0;

  return {
    grid,
    lineWins,
    totalLinePay,
    scatters: scat,
    scatterWin,
    coinCount,
    triggers: { freeSpins: freeSpinTrig, freeSpinsAward, holdSpin: holdTrig },
    totalWin: totalLinePay + scatterWin,
  };
}

function computeBias(totalBet, linesEnabled, policy) {
  if (!policy) return { s:0, b:0, c:0 };

  // gentle ramp: 0..~1
  const betFactor = Math.min(1, totalBet / (policy.betScale ?? 50));
  const lineFactor = Math.min(1, (linesEnabled - 1) / 4); // 1,3,5 -> 0..1

  // combine (still capped later)
  const t = Math.min(1, 0.6 * betFactor + 0.4 * lineFactor);

  return {
    s: t * (policy.maxScatterBoost ?? 0),
    b: t * (policy.maxBonusBoost ?? 0),
    c: t * (policy.maxCoinBoost ?? 0),
  };
}

function rollReelWindow(theme, reelIndex, bias) {
  const base = theme.weights[reelIndex];
  const w0 = applyBiasToWeights(base, bias);

  const top = weightedPick(w0);

  // Clamp: avoid duplicate S/B in same reel window (simple realism)
  const w1 = { ...w0 };
  if (top === "S") w1.S = 0;
  if (top === "B") w1.B = 0;

  const mid = weightedPick(w1);

  const w2 = { ...w1 };
  if (mid === "S") w2.S = 0;
  if (mid === "B") w2.B = 0;

  const bot = weightedPick(w2);

  return [top, mid, bot];
}


function applyBiasToWeights(weights, bias) {
  const out = { ...weights };

  // add a *little* extra weight to feature symbols if present
  if ("S" in out) out.S += bias.s;
  if ("B" in out) out.B += bias.b;
  if ("C" in out) out.C += bias.c;

  // also allow jackpot tags if your theme uses MJ/MR/MJ2 in base game weights
  if ("MJ" in out) out.MJ += bias.c * 0.2;
  if ("MR" in out) out.MR += bias.c * 0.1;
  if ("MJ2" in out) out.MJ2 += bias.c * 0.05;

  return out;
}

function weightedPick(weightMap) {
  let sum = 0;
  for (const k in weightMap) sum += weightMap[k];

  let r = Math.random() * sum;
  for (const k in weightMap) {
    r -= weightMap[k];
    if (r <= 0) return k;
  }
  // fallback
  return Object.keys(weightMap)[0];
}


export function startHoldSpin(theme, baseGrid) {
  const { symbols, bonus } = theme;
  const cfg = bonus.holdSpin;

  const rows = cfg.grid.rows, cols = cfg.grid.cols;
  const board = Array.from({ length: rows }, () => Array(cols).fill(null));

  // Seed existing coins/jackpots from base grid (3x5)
  let locked = 0;
  for (let r=0;r<rows;r++) for (let c=0;c<cols;c++) {
    const s = baseGrid[r][c];
    if (symbols[s]?.coin || symbols[s]?.jackpot) {
      board[r][c] = makeHoldValue(theme, s);
      locked++;
    }
  }

  return {
    rows, cols,
    respinsLeft: cfg.respins,
    board,  // each cell null or { kind:"COIN"/"JACKPOT", label, value }
    locked,
    totalAward: 0,
    done: false
  };
}

export function holdSpinStep(theme, state) {
  if (state.done) return state;

  const { bonus } = theme;
  const cfg = bonus.holdSpin;

  // chance to land new coins decreases as board fills
  const empties = [];
  for (let r=0;r<state.rows;r++) for (let c=0;c<state.cols;c++) {
    if (!state.board[r][c]) empties.push([r,c]);
  }

  let landedAny = false;

  // “Medium realism” landing logic: attempt a few drops each respin
  // You can tune these numbers per theme.
  const attempts = Math.max(1, Math.round(2 + (empties.length / 8)));

  for (let i=0;i<attempts;i++) {
    if (empties.length === 0) break;

    const p = Math.random();
    // base hit chance ~30%, slightly lower when board gets full
    const hitChance = 0.30 * (empties.length / (state.rows*state.cols));
    if (p > hitChance) continue;

    const idx = Math.floor(Math.random() * empties.length);
    const [r,c] = empties.splice(idx,1)[0];

    // mostly coins, rare jackpots
    const sym = rollHoldSymbol(theme);
    state.board[r][c] = makeHoldValue(theme, sym);
    state.locked++;
    landedAny = true;
  }

  if (landedAny) state.respinsLeft = cfg.respins;
  else state.respinsLeft--;

  if (state.respinsLeft <= 0 || state.locked === state.rows*state.cols) {
    // finalize
    let total = 0;
    for (let r=0;r<state.rows;r++) for (let c=0;c<state.cols;c++) {
      if (state.board[r][c]) total += state.board[r][c].value;
    }
    state.totalAward = total;
    state.done = true;
  }

  return state;
}

/* ---------------- helpers ---------------- */

function countWhere(grid, pred) {
  let c = 0;
  for (let r=0;r<grid.length;r++) for (let k=0;k<grid[0].length;k++) if (pred(grid[r][k])) c++;
  return c;
}

function bestLineWin(lineSyms, symbols) {
  const isWild = (s) => !!symbols[s]?.wild;
  const isLineEligible = (s) => !symbols[s]?.scatter && !symbols[s]?.bonus && !symbols[s]?.coin && !symbols[s]?.jackpot;

  const bases = new Set(lineSyms.filter(s => isLineEligible(s) && !isWild(s)));
  if (bases.size === 0) bases.add("W");

  let best = { pay: 0, sym: null, count: 0 };
  for (const base of bases) {
    let count = 0;
    for (let i=0;i<5;i++) {
      const s = lineSyms[i];
      if (s === base || (isWild(s) && isLineEligible(base))) count++;
      else break;
    }
    if (count >= 3) {
      const pay = symbols[base]?.payout?.[count] ?? 0;
      if (pay > best.pay) best = { pay, sym: base, count };
    }
  }
  return best;
}

function rollHoldSymbol(theme) {
  // mostly coin C, rare jackpots
  const p = Math.random();
  if (p < 0.92) return "C";
  if (p < 0.97) return "MJ";   // MINI
  if (p < 0.995) return "MR";  // MINOR
  return "MJ2";                // MAJOR
}

function makeHoldValue(theme, sym) {
  const { symbols, bonus } = theme;
  const cfg = bonus.holdSpin;

  if (symbols[sym]?.jackpot) {
    const j = symbols[sym].jackpot;
    const val = cfg.jackpots[j] ?? 0;
    return { kind: "JACKPOT", label: j, value: val };
  }

  // Coin value: weighted feel (many small, few big)
  const roll = Math.random();
  let val = 5;
  if (roll < 0.55) val = 5;
  else if (roll < 0.80) val = 10;
  else if (roll < 0.92) val = 20;
  else if (roll < 0.98) val = 50;
  else val = 100;

  return { kind: "COIN", label: String(val), value: val };
}

