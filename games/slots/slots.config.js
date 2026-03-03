// games/slots/slots.config.js

export const SYMBOLS = {
  W: { name: "Wild", payout: { 3: 50, 4: 200, 5: 1000 }, wild: true },
  A: { name: "Ace", payout: { 3: 10, 4: 30, 5: 120 } },
  K: { name: "King", payout: { 3: 8, 4: 25, 5: 100 } },
  Q: { name: "Queen", payout: { 3: 6, 4: 20, 5: 80 } },
  J: { name: "Jack", payout: { 3: 5, 4: 15, 5: 60 } },
  T: { name: "Ten", payout: { 3: 4, 4: 12, 5: 50 } },
  B: { name: "Bonus", payout: {}, bonus: true },
  S: { name: "Scatter", payout: { 3: 2, 4: 10, 5: 50 }, scatter: true },
};

// Simple payline definitions for 3 rows x 5 reels.
// Row indices: 0=top 1=mid 2=bot
export const PAYLINES = [
  [1, 1, 1, 1, 1], // mid
  [0, 0, 0, 0, 0], // top
  [2, 2, 2, 2, 2], // bot
  [0, 1, 2, 1, 0], // V
  [2, 1, 0, 1, 2], // ^
];

// Reel strips (arrays of symbol codes).
// More occurrences => higher frequency => more realistic feel.
// You can tune these later.
export const REEL_STRIPS = [
  "A K Q J T A K Q J T A K Q J T W A K Q J T S B".split(" "),
  "A K Q J T A K Q J T A K Q J T W A K Q J T S B".split(" "),
  "A K Q J T A K Q J T A K Q J T W A K Q J T S B".split(" "),
  "A K Q J T A K Q J T A K Q J T W A K Q J T S B".split(" "),
  "A K Q J T A K Q J T A K Q J T W A K Q J T S B".split(" "),
];

// Bonus rules
export const BONUS_RULES = {
  freeSpins: { scatterNeeded: 3, awards: { 3: 8, 4: 12, 5: 20 } },
  pickBonus: { bonusNeeded: 3 }, // 3+ B triggers pick bonus
};

export function generatePaylines(rows, cols, { maxLines = 25, maxStep = 1 } = {}) {
  rows = Math.max(1, rows | 0);
  cols = Math.max(1, cols | 0);

  if (cols === 1) {
    return Array.from({ length: Math.min(rows, maxLines) }, (_, r) => [r]);
  }

  const lines = [];
  const seen = new Set();

  const scoreLine = (line) => {
    let w = 0;
    for (let i = 1; i < line.length; i++) w += Math.abs(line[i] - line[i - 1]);
    return w;
  };

  const addLine = (line) => {
    const key = line.join(",");
    if (seen.has(key)) return;
    seen.add(key);
    lines.push({ line, wiggle: scoreLine(line) });
  };

  // horizontals first
  for (let r = 0; r < rows; r++) addLine(Array(cols).fill(r));

  const steps = [];
  for (let d = -maxStep; d <= maxStep; d++) steps.push(d);

  const dfs = (col, cur) => {
    if (lines.length > maxLines * 8) return; // guard
    if (col === cols) {
      addLine(cur);
      return;
    }
    const prev = cur[col - 1];
    for (const d of steps) {
      const nr = prev + d;
      if (nr < 0 || nr >= rows) continue;
      cur[col] = nr;
      dfs(col + 1, cur);
    }
  };

  for (let start = 0; start < rows; start++) {
    const cur = Array(cols).fill(0);
    cur[0] = start;
    dfs(1, cur);
  }

  lines.sort((a, b) => {
    if (a.wiggle !== b.wiggle) return a.wiggle - b.wiggle;
    const ak = a.line.join(",");
    const bk = b.line.join(",");
    return ak < bk ? -1 : ak > bk ? 1 : 0;
  });

  return lines.slice(0, maxLines).map((x) => x.line);
}

export function resolvePaylines(theme, rows, cols) {
  const wantedCols = cols ?? theme?.grid?.cols ?? 5;
  const wantedRows = rows ?? theme?.grid?.rows ?? 3;

  const pl = theme?.paylines;
  const ok =
    Array.isArray(pl) &&
    pl.length > 0 &&
    pl.every(
      (line) =>
        Array.isArray(line) &&
        line.length === wantedCols &&
        line.every((r) => Number.isInteger(r) && r >= 0 && r < wantedRows),
    );

  if (ok) return pl;

  const genCfg = theme?.paylineGen ?? {};
  return generatePaylines(wantedRows, wantedCols, {
    maxLines:
      genCfg.maxLines ??
      Math.min(50, wantedRows * 3 ** Math.min(6, wantedCols - 1)),
    maxStep: genCfg.maxStep ?? 1,
  });
}

export function resolveBetPerLineOptions(theme, linesEnabled) {
  const betCfg = theme?.bet ?? {};
  if (Array.isArray(betCfg.perLineOptions) && betCfg.perLineOptions.length) {
    return betCfg.perLineOptions.map((n) => Number(n)).filter((n) => n > 0);
  }

  const base = [1, 2, 5, 10, 25, 50, 100, 250, 500, 1000];
  const capTotal = Number.isFinite(betCfg.maxTotalBet) ? betCfg.maxTotalBet : 500;
  const denom = Math.max(1, Number(linesEnabled) || 1);
  const capPerLine = Math.max(1, Math.floor(capTotal / denom));

  const out = base.filter((n) => n <= capPerLine);
  return out.length ? out : [1];
}