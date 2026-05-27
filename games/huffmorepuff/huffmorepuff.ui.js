// games/huffmorepuff/huffmorepuff.ui.js
// Standalone Huff More Puff style slot module.
// Separate from games/slots/* and wired through main.js as huffmorepuff.

let ROWS = 3;
let COLS = 5;
let CELLS = ROWS * COLS;
const MAX_HOUSE_TIER = 3; // 0 empty, 1 straw, 2 stick, 3 mansion
const FEATURE_FREE_SPINS = 6;
const HARD_HAT_TRIGGER = 3;

// Bet values are stored as whole chips/cents so .20 = 20 and $100 = 10000.
const BET_OPTIONS = [20, 40, 60, 80, 100, 200, 400, 500, 1000, 2000, 5000, 10000];

const VARIANTS = {
  original: {
    name: "Huff N’ Puff",
    year: "2019",
    subtitle: "Original-style 3×5 house-building bonus",
    cols: 5,
    hardHatTrigger: 6,
    freeSpins: 6,
    retriggerHats: 3,
    retriggerSpins: 3,
    allowConstructionRetriggers: false,
    enableBuzzsaw: false,
    enableUpgradeWheel: false,
    enableSuper: false,
    extraWheelFromHats: false,
    powerGrids: 1,
    hatWeightMult: 1.15,
    sawWeightMult: 0,
    jackpotMult: { MINI: 20, MINOR: 100, MAJOR: 500, GRAND: 5000 },
    note: "Six Hard Hats start six free games. During free games, hats only build or upgrade houses; they do not retrigger the construction bonus."
  },
  more: {
    name: "Huff N’ More Puff",
    year: "2022",
    subtitle: "Buzzsaw wheel, Mansion, Buzzsaw Sweep, and Mega Hat bonuses",
    cols: 5,
    hardHatTrigger: 3,
    freeSpins: 6,
    retriggerHats: 3,
    retriggerSpins: 3,
    allowConstructionRetriggers: false,
    enableBuzzsaw: true,
    enableUpgradeWheel: false,
    enableSuper: false,
    extraWheelFromHats: false,
    powerGrids: 1,
    hatWeightMult: 1.35,
    sawWeightMult: 1.15,
    jackpotMult: { MINI: 20, MINOR: 100, MAJOR: 500, GRAND: 5000 },
    note: "Three Hard Hats are tuned to start free games in this version. During free games, hats only build or upgrade houses; no retriggers are awarded."
  },
  evenMore: {
    name: "Huff N’ Even More Puff",
    year: "2024",
    subtitle: "Upgrade wheel with Grand/Super chase",
    cols: 5,
    hardHatTrigger: 3,
    freeSpins: 6,
    retriggerHats: 3,
    retriggerSpins: 3,
    allowConstructionRetriggers: false,
    enableBuzzsaw: true,
    enableUpgradeWheel: true,
    enableSuper: true,
    extraWheelFromHats: false,
    powerGrids: 1,
    hatWeightMult: 1.3,
    sawWeightMult: 1.35,
    jackpotMult: { MINI: 25, MINOR: 125, MAJOR: 750, GRAND: 5000, SUPER: 15000 },
    note: "The wheel can land Upgrade, opening a second chance at Grand or Super. Construction free games do not retrigger."
  },
  power4: {
    name: "Huff N’ More Puff Power 4",
    year: "2024",
    subtitle: "Four-grid high-volatility mode",
    cols: 5,
    hardHatTrigger: 12,
    authenticHatTarget: 24,
    freeSpins: 6,
    retriggerHats: 6,
    retriggerSpins: 3,
    allowConstructionRetriggers: false,
    enableBuzzsaw: true,
    enableUpgradeWheel: false,
    enableSuper: false,
    extraWheelFromHats: false,
    powerGrids: 4,
    hatWeightMult: 1.45,
    sawWeightMult: 1.25,
    jackpotMult: { MINI: 40, MINOR: 200, MAJOR: 1000, GRAND: 7500 },
    note: "Emulates four 3×5 grids. The authentic target is 24 hats; this local build uses 12 for playability. Construction free games do not retrigger."
  },
  extra: {
    name: "Huff N’ Extra Puff",
    year: "2024",
    subtitle: "Three-reel throwback with Big Bad Wolf wheel feature",
    cols: 3,
    hardHatTrigger: 3,
    freeSpins: 6,
    retriggerHats: 3,
    retriggerSpins: 3,
    allowConstructionRetriggers: false,
    enableBuzzsaw: true,
    enableUpgradeWheel: false,
    enableSuper: false,
    extraWheelFromHats: true,
    powerGrids: 1,
    hatWeightMult: 1.65,
    sawWeightMult: 1.55,
    jackpotMult: { MINI: 20, MINOR: 125, MAJOR: 800, GRAND: 5000 },
    note: "Three hats or three buzzsaws spin the wheel; Big Bad Wolf can upgrade houses to mansions. Construction free games do not retrigger."
  }
};

let currentVariantKey = "more";
function currentVariant() { return VARIANTS[currentVariantKey] ?? VARIANTS.more; }
function setVariantDimensions(variant) {
  ROWS = 3;
  COLS = variant.cols ?? 5;
  CELLS = ROWS * COLS;
}
setVariantDimensions(currentVariant());


const SYMBOLS = {
  WOLF: { label: "Wolf Wild", icon: "🐺", wild: true },
  HAT: { label: "Hard Hat", icon: "🪖", scatter: true },
  SAW: { label: "Buzzsaw", icon: "🪚", bonus: true },
  TAPE: { label: "Tape Measure", icon: "📏", pay: { 3: 1.0, 4: 2.5, 5: 8 } },
  HARDHAT: { label: "Toolbox", icon: "🧰", pay: { 3: 0.8, 4: 2.0, 5: 6 } },
  HAMMER: { label: "Hammer", icon: "🔨", pay: { 3: 0.6, 4: 1.5, 5: 5 } },
  WOOD: { label: "Lumber", icon: "🪵", pay: { 3: 0.5, 4: 1.2, 5: 4 } },
  BRICK: { label: "Brick", icon: "🧱", pay: { 3: 0.45, 4: 1.0, 5: 3 } },
  A: { label: "A", icon: "A", pay: { 3: 0.35, 4: 0.8, 5: 2.4 } },
  K: { label: "K", icon: "K", pay: { 3: 0.3, 4: 0.7, 5: 2.0 } },
  Q: { label: "Q", icon: "Q", pay: { 3: 0.25, 4: 0.6, 5: 1.6 } },
};

const BASE_WEIGHTS = [
  { WOLF: 2, HAT: 4.2, SAW: 1.0, TAPE: 7, HARDHAT: 8, HAMMER: 9, WOOD: 10, BRICK: 10, A: 12, K: 12, Q: 12 },
  { WOLF: 2, HAT: 4.5, SAW: 1.1, TAPE: 7, HARDHAT: 8, HAMMER: 9, WOOD: 10, BRICK: 10, A: 12, K: 12, Q: 12 },
  { WOLF: 2.2, HAT: 5.0, SAW: 1.25, TAPE: 7, HARDHAT: 8, HAMMER: 9, WOOD: 10, BRICK: 10, A: 12, K: 12, Q: 12 },
  { WOLF: 2, HAT: 4.5, SAW: 1.1, TAPE: 7, HARDHAT: 8, HAMMER: 9, WOOD: 10, BRICK: 10, A: 12, K: 12, Q: 12 },
  { WOLF: 1.8, HAT: 4.2, SAW: 1.0, TAPE: 7, HARDHAT: 8, HAMMER: 9, WOOD: 10, BRICK: 10, A: 12, K: 12, Q: 12 },
];

const FREE_WEIGHTS = BASE_WEIGHTS.map((w, i) => ({
  ...w,
  HAT: w.HAT + 2.8,
  SAW: w.SAW + (i === 2 ? 1.0 : 0.45),
  WOLF: w.WOLF + 0.35,
}));

function betBoostFactor(bet) {
  const min = BET_OPTIONS[0];
  const max = BET_OPTIONS[BET_OPTIONS.length - 1];
  const safeBet = Math.max(min, Math.min(max, Number(bet) || min));
  // Log curve: low bets stay close to base; high bets get a meaningful but capped feature boost.
  const t = Math.log(safeBet / min) / Math.log(max / min);
  return Math.max(0, Math.min(1, t));
}

function featureWeightsForBet(baseWeights, bet, freeMode = false) {
  const boost = betBoostFactor(bet);
  const variant = currentVariant();
  return baseWeights.slice(0, COLS).map((w, reelIndex) => {
    const centerReel = reelIndex === Math.floor(COLS / 2) ? 1.12 : 1;
    const hatMult = variant.hatWeightMult ?? 1;
    const sawMult = variant.enableBuzzsaw ? (variant.sawWeightMult ?? 1) : 0;
    return {
      ...w,
      HAT: w.HAT * hatMult * (1 + boost * (freeMode ? 1.35 : 1.15) * centerReel),
      SAW: w.SAW * sawMult * (1 + boost * (freeMode ? 1.45 : 1.25) * centerReel),
      WOLF: w.WOLF * (1 + boost * 0.35),
      A: w.A * (1 - boost * 0.08),
      K: w.K * (1 - boost * 0.08),
      Q: w.Q * (1 - boost * 0.08),
    };
  });
}

function jackpotWheelChance(bet) {
  const boost = betBoostFactor(bet);
  return 0.22 + boost * 0.18; // 22% at min bet, 40% at max bet
}

const JACKPOTS = { MINI: 20, MINOR: 100, MAJOR: 500, GRAND: 5000, SUPER: 15000 };

function activeJackpots() {
  return currentVariant().jackpotMult ?? JACKPOTS;
}

function money(chips) {
  return `$${(Number(chips || 0) / 100).toFixed(2)}`;
}

function credits(chips) {
  return Math.round(Number(chips || 0));
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function pick(weightMap) {
  const entries = Object.entries(weightMap).filter(([, v]) => v > 0);
  const total = entries.reduce((sum, [, v]) => sum + v, 0);
  let r = Math.random() * total;
  for (const [key, weight] of entries) {
    r -= weight;
    if (r <= 0) return key;
  }
  return entries[0][0];
}

function makeGrid(freeMode = false, bet = BET_OPTIONS[0]) {
  const base = freeMode ? FREE_WEIGHTS : BASE_WEIGHTS;
  const weights = featureWeightsForBet(base, bet, freeMode);
  const grid = Array.from({ length: ROWS }, () => Array(COLS).fill("A"));
  for (let c = 0; c < COLS; c++) {
    for (let r = 0; r < ROWS; r++) grid[r][c] = pick(weights[c]);
  }
  return grid;
}

function posToRc(pos) {
  const lp = localPos(pos);
  return [Math.floor(lp / COLS), lp % COLS];
}

function rcToPos(r, c) {
  return r * COLS + c;
}

function countSymbol(grid, symbol) {
  let n = 0;
  for (const row of grid) for (const s of row) if (s === symbol) n++;
  return n;
}

function symbolPositions(grid, symbol) {
  const out = [];
  for (let r = 0; r < ROWS; r++) for (let c = 0; c < COLS; c++) if (grid[r][c] === symbol) out.push(rcToPos(r, c));
  return out;
}

function randomPositions(n) {
  return [...Array(CELLS).keys()].sort(() => Math.random() - 0.5).slice(0, Math.max(0, Math.min(CELLS, n)));
}

function allSymbolsForPays() {
  return Object.keys(SYMBOLS).filter((s) => SYMBOLS[s].pay);
}

function waysWin(grid, bet) {
  const wins = [];
  let total = 0;

  for (const sym of allSymbolsForPays()) {
    const counts = [];
    const cellsByReel = [];

    for (let c = 0; c < COLS; c++) {
      const cells = [];
      for (let r = 0; r < ROWS; r++) {
        const s = grid[r][c];
        if (s === sym || SYMBOLS[s]?.wild) cells.push([r, c]);
      }
      if (!cells.length) break;
      counts.push(cells.length);
      cellsByReel.push(cells);
    }

    if (counts.length >= 3) {
      const ways = counts.reduce((a, b) => a * b, 1);
      const mult = SYMBOLS[sym].pay[counts.length] ?? 0;
      const win = credits(bet * mult * ways);
      if (win > 0) {
        total += win;
        wins.push({ symbol: sym, reels: counts.length, ways, win, cells: cellsByReel.flat() });
      }
    }
  }

  return { wins, total };
}

function featureGridCount() {
  return Math.max(1, currentVariant().powerGrids || 1);
}

function featureCellCount() {
  return CELLS * featureGridCount();
}

function localPos(pos) {
  return ((pos % CELLS) + CELLS) % CELLS;
}

function gridOffset(gridIndex) {
  return Math.max(0, gridIndex | 0) * CELLS;
}

function createFeatureState() {
  const gridCount = featureGridCount();
  return {
    spinsLeft: 0,
    gridCount,
    board: Array(CELLS * gridCount).fill(0),
    totalWin: 0,
    active: false,
    resolvedPrizes: null,
  };
}

function buildWithHat(feature, preferredPos = null) {
  const board = feature.board;
  let pos = preferredPos;

  if (pos == null || board[pos] >= MAX_HOUSE_TIER) {
    const unfinished = board.map((tier, idx) => ({ tier, idx })).filter((x) => x.tier < MAX_HOUSE_TIER);
    if (!unfinished.length) return { pos: null, previous: 3, next: 3, overflow: true };
    unfinished.sort((a, b) => b.tier - a.tier || Math.random() - 0.5);
    pos = unfinished[0].idx;
  }

  const previous = board[pos];
  board[pos] = Math.min(MAX_HOUSE_TIER, previous + 1);
  return { pos, previous, next: board[pos], overflow: false };
}

function mansionPayoutCount(board) {
  return board.filter((tier) => tier >= MAX_HOUSE_TIER).length;
}

function houseTierLabel(tier) {
  if (tier >= 3) return "Mansion";
  if (tier === 2) return "Stick";
  if (tier === 1) return "Straw";
  return "Empty";
}

function tierIcon(tier) {
  if (tier >= 3) return "🏰";
  if (tier === 2) return "🏠";
  if (tier === 1) return "🛖";
  return "";
}

function weightedChoice(items) {
  const total = items.reduce((sum, item) => sum + item.weight, 0);
  let r = Math.random() * total;
  for (const item of items) {
    r -= item.weight;
    if (r <= 0) return item.value;
  }
  return items[0]?.value;
}

function randInt(min, max) {
  return Math.floor(min + Math.random() * (max - min + 1));
}

function jackpotAward(name, bet) {
  return credits(bet * (activeJackpots()[name] ?? JACKPOTS[name] ?? 0));
}

function randomHouseWordBonus(tier, bet) {
  const variant = currentVariant();
  const boost = betBoostFactor(bet);

  if (tier <= 1) {
    return weightedChoice([
      { value: "MINI", weight: 96 - boost * 10 },
      { value: "MINOR", weight: 4 + boost * 10 },
    ]);
  }

  if (tier === 2) {
    return weightedChoice([
      { value: "MINI", weight: 82 - boost * 14 },
      { value: "MINOR", weight: 16 + boost * 10 },
      { value: "MAJOR", weight: 2 + boost * 4 },
    ]);
  }

  const choices = [
    { value: "MINI", weight: 62 - boost * 18 },
    { value: "MINOR", weight: 25 + boost * 6 },
    { value: "MAJOR", weight: 10 + boost * 7 },
    { value: "GRAND", weight: 3 + boost * 4 },
  ];
  if (variant.enableSuper) choices.push({ value: "SUPER", weight: 0.8 + boost * 2.5 });
  return weightedChoice(choices);
}

function rollHousePrize(tier, bet) {
  const boost = betBoostFactor(bet);
  const safeTier = Math.max(1, Math.min(MAX_HOUSE_TIER, tier | 0));

  // Every house pays something. Better houses have larger credit ranges and a higher
  // chance to reveal jackpot/word bonuses.
  const wordChanceByTier = {
    1: 0.025 + boost * 0.015,
    2: 0.09 + boost * 0.05,
    3: 0.38 + boost * 0.17,
  };

  if (Math.random() < wordChanceByTier[safeTier]) {
    const word = randomHouseWordBonus(safeTier, bet);
    return {
      type: "WORD",
      word,
      label: word,
      value: jackpotAward(word, bet),
    };
  }

  const mult =
    safeTier === 1
      ? randInt(1, 4)
      : safeTier === 2
        ? randInt(4, 12)
        : randInt(10, 35);

  return {
    type: "CREDIT",
    word: null,
    label: `${mult}×`,
    value: credits(bet * mult),
  };
}

function resolveConstructionBonus(feature, bet) {
  const prizes = feature.board.map((tier, pos) => {
    if (tier <= 0) return null;
    const prize = rollHousePrize(tier, bet);
    return { pos, tier, ...prize };
  });

  const active = prizes.filter(Boolean);
  const total = active.reduce((sum, prize) => sum + prize.value, 0);
  const wordCounts = active.reduce((acc, prize) => {
    if (prize.type === "WORD") acc[prize.word] = (acc[prize.word] || 0) + 1;
    return acc;
  }, {});
  const tierCounts = active.reduce((acc, prize) => {
    const label = houseTierLabel(prize.tier);
    acc[label] = (acc[label] || 0) + 1;
    return acc;
  }, {});

  feature.resolvedPrizes = prizes;

  return {
    prizes: active,
    affected: active.map((p) => p.pos),
    total,
    wordCounts,
    tierCounts,
  };
}

function randomJackpotName(bet) {
  const boost = betBoostFactor(bet);
  const r = Math.random();
  const variant = currentVariant();

  if (variant.enableSuper) {
    const miniCut = 0.55 - boost * 0.18;
    const minorCut = 0.82 - boost * 0.10;
    const majorCut = 0.95 - boost * 0.05;
    const grandCut = 0.992 - boost * 0.035;
    if (r < miniCut) return "MINI";
    if (r < minorCut) return "MINOR";
    if (r < majorCut) return "MAJOR";
    if (r < grandCut) return "GRAND";
    return "SUPER";
  }

  const miniCut = 0.62 - boost * 0.20;
  const minorCut = 0.88 - boost * 0.10;
  const majorCut = 0.985 - boost * 0.035;

  if (r < miniCut) return "MINI";
  if (r < minorCut) return "MINOR";
  if (r < majorCut) return "MAJOR";
  return "GRAND";
}

function spinBuzzsawWheel(sawCount, bet) {
  const variant = currentVariant();
  const r = Math.random();
  const jackpotCut = jackpotWheelChance(bet);
  const remaining = 1 - jackpotCut;

  if (variant.enableUpgradeWheel && r < 0.18 + betBoostFactor(bet) * 0.10) {
    return { type: "UPGRADE", label: "Upgrade Wheel" };
  }
  if (variant.extraWheelFromHats && r < 0.34) return { type: "BIG_BAD_WOLF", label: "Big Bad Wolf" };
  if (r < jackpotCut) return { type: "JACKPOT", label: randomJackpotName(bet) };
  if (r < jackpotCut + remaining * 0.28) return { type: "MANSION", label: "Mansion Bonus" };
  if (r < jackpotCut + remaining * 0.56) return { type: "BUZZSAW", label: "Buzzsaw Sweep" };
  if (r < jackpotCut + remaining * 0.78) return { type: "MEGA_HAT", label: "Mega Hat Bonus" };
  return { type: "CREDIT", label: `${20 * Math.max(1, sawCount)}x Credit Award`, award: credits(bet * 20 * Math.max(1, sawCount)) };
}

function applyMansionBonus(feature, sawPositions, bet) {
  const affected = [];
  for (const pos of sawPositions) {
    feature.board[pos] = MAX_HOUSE_TIER;
    affected.push(pos);
  }
  const mansions = mansionPayoutCount(feature.board);
  return { affected, award: credits(bet * Math.max(1, mansions) * 10), note: `${affected.length} buzzsaw spaces became mansions.` };
}

function applyBuzzsawSweep(feature, sawPositions, bet) {
  const affected = new Set();
  const normalized = (sawPositions || []).map((p) => Math.max(0, Math.min(feature.board.length - 1, p | 0)));
  const rowKeys = normalized.map((p) => `${Math.floor(p / CELLS)}:${posToRc(p)[0]}`);
  const alignedRow = rowKeys.length >= 3 && rowKeys.every((r) => r === rowKeys[0]);

  for (const pos of normalized) {
    const base = Math.floor(pos / CELLS) * CELLS;
    const [r, c] = posToRc(pos);
    for (let cc = 0; cc < COLS; cc++) affected.add(base + rcToPos(r, cc));
    for (let rr = 0; rr < ROWS; rr++) affected.add(base + rcToPos(rr, c));
  }

  for (const pos of affected) {
    const bump = alignedRow ? 2 : 1;
    feature.board[pos] = Math.min(MAX_HOUSE_TIER, feature.board[pos] + bump);
  }

  const mansions = mansionPayoutCount(feature.board);
  return {
    affected: [...affected],
    award: credits(bet * Math.max(1, mansions) * (alignedRow ? 12 : 6)),
    note: alignedRow ? "Three buzzsaws aligned on one Power grid row and upgraded structures harder." : "Buzzsaws swept paths into house upgrades.",
  };
}

function applyMegaHat(feature, bet) {
  const maxCover = Math.min(feature.board.length, featureGridCount() > 1 ? 24 : 15);
  const cover = Math.min(maxCover, 6 + Math.floor(Math.random() * (maxCover - 5)));
  const positions = [...Array(feature.board.length).keys()].sort(() => Math.random() - 0.5).slice(0, cover);
  for (const pos of positions) buildWithHat(feature, pos);
  const mansions = mansionPayoutCount(feature.board);
  return { affected: positions, award: credits(bet * Math.max(cover, mansions * 8)), note: `Mega Hat covered ${cover} reel spaces.` };
}

function applyFreeSpinConstruction(feature, grid, bet, gridIndex = 0) {
  const offset = gridOffset(gridIndex);
  const hatPositions = symbolPositions(grid, "HAT").map((p) => p + offset);
  const builds = [];
  let overflowMansions = 0;

  for (const pos of hatPositions) {
    const built = buildWithHat(feature, pos);
    builds.push(built);
    if (built.overflow) overflowMansions++;
  }

  const mansions = mansionPayoutCount(feature.board);
  // House values are resolved at the end of the construction bonus so each
  // built house pays once: Straw, Stick, and Mansion all reveal prizes.
  const award = 0;
  return { builds, affected: builds.map((b) => b.pos).filter((p) => p != null), award, hatCount: hatPositions.length, mansions, overflowMansions };
}

function evaluatePaidSpin(bet) {
  const variant = currentVariant();
  const gridCount = Math.max(1, variant.powerGrids || 1);
  const grids = Array.from({ length: gridCount }, () => makeGrid(false, bet));
  const grid = grids[0];

  let ways = { wins: [], total: 0 };
  let hatCount = 0;
  let sawCount = 0;
  let sawPositions = [];
  let hatPositions = [];

  grids.forEach((g, gridIndex) => {
    const w = waysWin(g, bet);
    ways.total += w.total;
    if (gridIndex === 0) ways.wins.push(...w.wins);
    hatCount += countSymbol(g, "HAT");
    sawCount += countSymbol(g, "SAW");

    const offset = gridOffset(gridIndex);
    hatPositions.push(...symbolPositions(g, "HAT").map((p) => p + offset));
    sawPositions.push(...symbolPositions(g, "SAW").map((p) => p + offset));
  });

  const featureTrigger = hatCount >= (variant.hardHatTrigger ?? HARD_HAT_TRIGGER);
  const wheelTrigger = variant.enableBuzzsaw && (sawCount >= 3 || (variant.extraWheelFromHats && hatCount >= 3));

  return {
    grid, grids, gridCount, ways, hatCount, sawCount, sawPositions, hatPositions, featureTrigger, wheelTrigger, totalWin: ways.total,
  };
}

function evaluateFreeSpin(bet, feature) {
  const gridCount = Math.max(1, currentVariant().powerGrids || 1);
  const grids = Array.from({ length: gridCount }, () => makeGrid(true, bet));
  const grid = grids[0];
  const ways = { wins: [], total: 0 };
  let sawCount = 0;
  let sawPositions = [];
  let construction = { builds: [], affected: [], award: 0, hatCount: 0, mansions: 0, overflowMansions: 0 };

  grids.forEach((g, gridIndex) => {
    const w = waysWin(g, bet);
    ways.total += w.total;
    if (gridIndex === 0) ways.wins.push(...w.wins);
    sawCount += countSymbol(g, "SAW");
    sawPositions.push(...symbolPositions(g, "SAW").map((p) => p + gridOffset(gridIndex)));

    const built = applyFreeSpinConstruction(feature, g, bet, gridIndex);
    construction.builds.push(...built.builds);
    construction.affected.push(...built.affected);
    construction.hatCount += built.hatCount;
    construction.overflowMansions += built.overflowMansions;
  });
  construction.mansions = mansionPayoutCount(feature.board);

  let wheel = null;
  let wheelAward = 0;
  let wheelAffected = [];

  if (sawCount >= 3) {
    wheel = spinBuzzsawWheel(sawCount, bet);
    if (wheel.type === "JACKPOT") wheelAward = jackpotAward(wheel.label, bet);
    if (wheel.type === "CREDIT") wheelAward = wheel.award;
    if (wheel.type === "UPGRADE") {
      wheel.label = `Upgrade Wheel → ${randomJackpotName(bet)}`;
      const jpName = wheel.label.split("→ ")[1];
      wheelAward = jackpotAward(jpName, bet);
    }
    if (wheel.type === "BIG_BAD_WOLF") {
      const b = applyBuzzsawSweep(feature, sawPositions.length ? sawPositions : randomPositions(3), bet);
      wheelAward = b.award;
      wheelAffected = b.affected;
      wheel.note = "Big Bad Wolf upgraded houses toward mansions.";
    }
    if (wheel.type === "MANSION") {
      const m = applyMansionBonus(feature, sawPositions, bet);
      wheelAward = m.award;
      wheelAffected = m.affected;
      wheel.note = m.note;
    }
    if (wheel.type === "BUZZSAW") {
      const b = applyBuzzsawSweep(feature, sawPositions, bet);
      wheelAward = b.award;
      wheelAffected = b.affected;
      wheel.note = b.note;
    }
    if (wheel.type === "MEGA_HAT") {
      const m = applyMegaHat(feature, bet);
      wheelAward = m.award;
      wheelAffected = m.affected;
      wheel.note = m.note;
    }
  }

  const totalWin = ways.total + construction.award + wheelAward;
  feature.totalWin += totalWin;

  return { grid, grids, gridCount, ways, sawCount, sawPositions, construction, wheel, wheelAward, wheelAffected, totalWin };
}

function renderGrid(stage, grid) {
  stage.style.setProperty("--hmp-cols", COLS);
  stage.style.setProperty("--hmp-rows", ROWS);
  stage.innerHTML = grid.map((row, r) => row.map((sym, c) => cellHtml(sym, r, c)).join("")).join("");
}


function renderAllGrids(stage, grids) {
  const gridList = Array.isArray(grids) && grids.length ? grids : [makeGrid(false, Number(document.querySelector("#hmp_bet")?.value || BET_OPTIONS[0]))];
  const multi = gridList.length > 1;
  stage.classList.toggle("hmpStageMulti", multi);
  stage.style.removeProperty("--hmp-cols");
  stage.style.removeProperty("--hmp-rows");
  if (!multi) {
    renderGrid(stage, gridList[0]);
    return;
  }
  stage.innerHTML = gridList.map((grid, idx) => `
    <div class="hmpPowerGrid">
      <div class="hmpPowerTitle">Grid ${idx + 1}</div>
      <div class="hmpStage hmpMiniStage" style="--hmp-cols:${COLS};--hmp-rows:${ROWS}">
        ${grid.map((row, r) => row.map((sym, c) => cellHtml(sym, r, c)).join("")).join("")}
      </div>
    </div>`).join("");
}

function cellHtml(sym, r, c) {
  const meta = SYMBOLS[sym] ?? { label: sym, icon: sym };
  return `<div class="hmpCell" data-row="${r}" data-col="${c}" data-pos="${rcToPos(r, c)}" data-sym="${sym}">
    <div class="hmpIcon">${meta.icon}</div>
    <div class="hmpLabel">${meta.label}</div>
  </div>`;
}

function renderFeatureBoard(el, feature, highlight = []) {
  const hi = new Set(highlight);
  const gridCount = Math.max(1, feature.gridCount || featureGridCount());

  const buildCell = (tier, pos) => {
    const prize = feature.resolvedPrizes?.[pos] ?? null;
    const prizeText = prize ? (prize.type === "WORD" ? prize.label : money(prize.value)) : houseTierLabel(tier);
    return `
    <div class="hmpBuildCell ${tier >= 3 ? "mansion" : tier === 2 ? "stick" : tier === 1 ? "straw" : ""} ${hi.has(pos) ? "hit" : ""} ${prize?.type === "WORD" ? "wordPrize" : prize ? "creditPrize" : ""}">
      <div>${tierIcon(tier)}</div>
      <small>${prizeText}</small>
    </div>`;
  };

  if (gridCount <= 1) {
    el.board.classList.remove("hmpBuildPower4");
    el.board.innerHTML = feature.board.map((tier, pos) => buildCell(tier, pos)).join("");
    return;
  }

  el.board.classList.add("hmpBuildPower4");
  el.board.innerHTML = Array.from({ length: gridCount }, (_, gridIndex) => {
    const start = gridOffset(gridIndex);
    const cells = feature.board.slice(start, start + CELLS).map((tier, local) => buildCell(tier, start + local)).join("");
    return `<div class="hmpBuildGridPanel"><div class="hmpPowerTitle">Grid ${gridIndex + 1} Construction</div><div class="hmpBuildGrid hmpBuildMiniGrid">${cells}</div></div>`;
  }).join("");
}

function clearCellMarks(root) {
  root.querySelectorAll(".hmpCell").forEach((x) => x.classList.remove("hmpWin", "hmpHat", "hmpSaw", "hmpWild"));
}

function markCells(root, result) {
  clearCellMarks(root);
  root.querySelectorAll('.hmpCell[data-sym="WOLF"]').forEach((x) => x.classList.add("hmpWild"));
  root.querySelectorAll('.hmpCell[data-sym="HAT"]').forEach((x) => x.classList.add("hmpHat"));
  root.querySelectorAll('.hmpCell[data-sym="SAW"]').forEach((x) => x.classList.add("hmpSaw"));
  for (const w of result.ways?.wins ?? []) {
    for (const [r, c] of w.cells) {
      const cell = root.querySelector(`.hmpCell[data-row="${r}"][data-col="${c}"]`);
      if (cell) cell.classList.add("hmpWin");
    }
  }
}

function renderWins(el, result, feature = null) {
  const rows = [];
  for (const w of result.ways?.wins ?? []) {
    const meta = SYMBOLS[w.symbol];
    rows.push(`<div class="hmpWinRow"><span>${meta.icon} ${meta.label} — ${w.ways} ways × ${w.reels} reels</span><b>${money(w.win)}</b></div>`);
  }

  if (result.featureTrigger) rows.push(`<div class="hmpWinRow hmpFeatureRow"><span>🪖 ${currentVariant().hardHatTrigger ?? HARD_HAT_TRIGGER}+ Hard Hats triggered Free Games</span><b>6 spins</b></div>`);
  if (result.wheelTrigger) rows.push(`<div class="hmpWinRow hmpSawRow"><span>🪚 3+ Buzzsaws triggered Bonus Wheel</span><b>Ready</b></div>`);
  if (result.construction?.hatCount) rows.push(`<div class="hmpWinRow hmpFeatureRow"><span>🪖 Hats built houses — ${result.construction.mansions} mansion(s)</span><b>Built</b></div>`);
  if (result.finalConstruction) {
    const words = Object.entries(result.finalConstruction.wordCounts || {}).map(([k, v]) => `${v}× ${k}`).join(", ");
    const tiers = Object.entries(result.finalConstruction.tierCounts || {}).map(([k, v]) => `${v} ${k}`).join(", ");
    rows.push(`<div class="hmpWinRow hmpFeatureRow"><span>🐺 Construction payout — ${tiers}${words ? ` — Word bonuses: ${words}` : ""}</span><b>${money(result.finalConstruction.total)}</b></div>`);
  }
  if (result.wheel) rows.push(`<div class="hmpWinRow hmpSawRow"><span>🪚 ${result.wheel.label}${result.wheel.note ? ` — ${result.wheel.note}` : ""}</span><b>${money(result.wheelAward)}</b></div>`);
  if (result.retrigger) rows.push(`<div class="hmpWinRow hmpFeatureRow"><span>🪖 Retrigger: ${result.retrigger.hats} hats</span><b>+${result.retrigger.spins} spins</b></div>`);

  if (!rows.length) rows.push(`<div class="help">No win. 243 ways pay from the leftmost reel. Hard Hats and Buzzsaws can trigger features.</div>`);
  el.winList.innerHTML = rows.join("");
}

function renderMeters(el, result, feature) {
  el.lastWin.textContent = money(result.totalWin || 0);
  el.hats.textContent = String(result.hatCount ?? result.construction?.hatCount ?? countSymbol(result.grid, "HAT"));
  el.saws.textContent = String(result.sawCount ?? 0);
  el.mansions.textContent = String(mansionPayoutCount(feature.board));
}

async function animateSpin(el, resultOrGrid, freeMode = false) {
  const finalGrids = Array.isArray(resultOrGrid?.grids) ? resultOrGrid.grids : [resultOrGrid];
  const count = finalGrids.length || featureGridCount();
  for (let i = 0; i < 10; i++) {
    renderAllGrids(el.stage, Array.from({ length: count }, () => makeGrid(freeMode, Number(el.bet?.value || BET_OPTIONS[0]))));
    await sleep(45 + i * 16);
  }
  renderAllGrids(el.stage, finalGrids);
}

async function safeRefreshBank(el, store) {
  if (!store.currentPlayerId) {
    el.bank.textContent = "Select player";
    return;
  }
  const chips = await store.getChips(store.currentPlayerId);
  el.bank.textContent = `Chips: ${Number(chips || 0).toLocaleString()} (${money(chips)})`;
}

function ensureHmpStyles() {
  if (document.getElementById("hmp_inline_styles_v2")) return;
  const style = document.createElement("style");
  style.id = "hmp_inline_styles_v2";
  style.textContent = `
    .hmpWrap{display:grid;gap:14px;--hmpAccent:#f97316;--hmpAccent2:rgba(249,115,22,.32)}
    .hmpHero{display:flex;justify-content:space-between;align-items:flex-end;gap:16px;padding:16px;border-radius:18px;border:1px solid rgba(249,115,22,.28);background:radial-gradient(circle at 20% 10%,rgba(249,115,22,.26),transparent 36%),radial-gradient(circle at 90% 0%,rgba(220,38,38,.22),transparent 32%),rgba(255,255,255,.04)}
    .hmpHero h2{margin:0;font-size:34px;letter-spacing:.3px}.hmpEyebrow{color:#fed7aa;font-weight:900;text-transform:uppercase;letter-spacing:1.5px;font-size:12px}.hmpHero p{max-width:850px}
    .hmpBank,.hmpFree{padding:8px 12px;border-radius:999px;border:1px solid rgba(255,255,255,.14);background:rgba(0,0,0,.25);font-weight:900;white-space:nowrap}
    .hmpControls{display:flex;align-items:end;flex-wrap:wrap;gap:10px}.hmpControls label{display:grid;gap:5px;color:var(--muted,#aab3d3);font-size:12px}.hmpControls select{min-width:130px}
    .hmpJackpots{display:grid;grid-template-columns:repeat(4,minmax(105px,1fr));gap:8px}.hmpJackpots div{padding:9px 10px;border-radius:14px;border:1px solid rgba(250,204,21,.22);background:rgba(250,204,21,.08)}.hmpJackpots small{display:block;color:rgba(255,255,255,.7)}.hmpJackpots b{font-size:18px}
    .hmpMeters{display:grid;grid-template-columns:repeat(4,minmax(110px,1fr));gap:10px}.hmpMeters>div{display:grid;gap:4px;padding:12px;border-radius:14px;border:1px solid rgba(255,255,255,.1);background:rgba(255,255,255,.035)}.hmpMeters strong{font-size:22px}
    .hmpGameGrid{display:grid;grid-template-columns:minmax(360px,640px) minmax(260px,1fr);gap:14px;align-items:start}.hmpStage{display:grid!important;grid-template-columns:repeat(var(--hmp-cols,5),minmax(68px,1fr))!important;grid-template-rows:repeat(var(--hmp-rows,3),92px)!important;gap:8px!important;padding:14px!important;border-radius:18px;border:1px solid rgba(249,115,22,.24);background:linear-gradient(180deg,rgba(255,255,255,.055),rgba(0,0,0,.12)),rgba(0,0,0,.2);box-shadow:inset 0 0 0 1px rgba(255,255,255,.04)}.hmpStage.hmpStageMulti{grid-template-columns:repeat(2,minmax(230px,1fr))!important;grid-template-rows:auto!important;align-items:start}.hmpPowerGrid{display:grid;gap:6px}.hmpPowerTitle{font-size:12px;text-transform:uppercase;letter-spacing:.8px;color:#fed7aa;font-weight:900}.hmpMiniStage{grid-template-columns:repeat(var(--hmp-cols,5),minmax(42px,1fr))!important;grid-template-rows:repeat(var(--hmp-rows,3),58px)!important;padding:8px!important;gap:5px!important}.hmpMiniStage .hmpCell{border-radius:11px;padding:4px 2px}.hmpMiniStage .hmpIcon{font-size:22px}.hmpMiniStage .hmpLabel{display:none}
    .hmpCell{display:grid!important;place-items:center!important;align-content:center!important;gap:3px;padding:8px 5px;border-radius:16px;border:1px solid rgba(255,255,255,.11);background:rgba(255,255,255,.055);position:relative;overflow:hidden;transition:transform .12s ease,border-color .12s ease,box-shadow .12s ease}.hmpCell::after{content:"";position:absolute;inset:0;background:radial-gradient(circle at 35% 12%,rgba(255,255,255,.18),transparent 36%);pointer-events:none}.hmpIcon{font-size:32px;line-height:1;font-weight:1000;z-index:1}.hmpLabel{font-size:11px;color:rgba(233,236,245,.76);text-align:center;z-index:1}.hmpCell[data-sym="A"] .hmpIcon,.hmpCell[data-sym="K"] .hmpIcon,.hmpCell[data-sym="Q"] .hmpIcon{font-size:28px;color:#fed7aa}.hmpWild{border-color:rgba(248,113,113,.52);background:rgba(127,29,29,.22)}.hmpHat{border-color:rgba(250,204,21,.55);background:rgba(250,204,21,.09)}.hmpSaw{border-color:rgba(96,165,250,.55);background:rgba(37,99,235,.12)}.hmpWin{transform:translateY(-2px);box-shadow:0 0 0 3px rgba(52,211,153,.16),0 0 20px rgba(52,211,153,.26)}
    .hmpBuildPanel,.hmpPanel{border-radius:16px;border:1px solid rgba(255,255,255,.1);background:rgba(255,255,255,.035);padding:12px}.hmpBuildPanel h3{margin:0 0 8px}.hmpBuildGrid{display:grid;grid-template-columns:repeat(5,1fr);gap:7px}.hmpBuildPower4{display:grid;grid-template-columns:repeat(2,1fr);gap:10px}.hmpBuildGridPanel{display:grid;gap:5px}.hmpBuildMiniGrid .hmpBuildCell{height:44px;border-radius:10px}.hmpBuildMiniGrid .hmpBuildCell small{font-size:9px}.hmpBuildCell{height:66px;border-radius:13px;border:1px solid rgba(255,255,255,.1);background:rgba(0,0,0,.18);display:grid;place-items:center;align-content:center;font-weight:900}.hmpBuildCell small{font-size:10px;color:rgba(255,255,255,.65)}.hmpBuildCell.straw{background:rgba(217,119,6,.15);border-color:rgba(217,119,6,.4)}.hmpBuildCell.stick{background:rgba(120,53,15,.18);border-color:rgba(180,83,9,.5)}.hmpBuildCell.mansion{background:rgba(250,204,21,.15);border-color:rgba(250,204,21,.55)}.hmpBuildCell.wordPrize{box-shadow:0 0 18px rgba(250,204,21,.35);border-color:rgba(250,204,21,.85)}.hmpBuildCell.creditPrize{box-shadow:0 0 14px rgba(52,211,153,.22);border-color:rgba(52,211,153,.55)}.hmpBuildCell.hit{animation:hmpBuildHit .9s ease-out 1}@keyframes hmpBuildHit{0%{transform:scale(1)}35%{transform:scale(1.08)}100%{transform:scale(1)}}
    .hmpPanelHead{display:flex;justify-content:space-between;gap:12px;align-items:baseline;flex-wrap:wrap;margin-bottom:10px}.hmpWinList{display:grid;gap:8px}.hmpWinRow{display:flex;justify-content:space-between;gap:10px;padding:9px 10px;border-radius:12px;border:1px solid rgba(255,255,255,.1);background:rgba(255,255,255,.035)}.hmpFeatureRow{border-color:rgba(249,115,22,.28);background:rgba(249,115,22,.1)}.hmpSawRow{border-color:rgba(96,165,250,.35);background:rgba(37,99,235,.12)}.hmpRules{line-height:1.7}
    @media(max-width:920px){.hmpGameGrid{grid-template-columns:1fr}.hmpJackpots,.hmpMeters{grid-template-columns:repeat(2,1fr)}}@media(max-width:720px){.hmpStage.hmpStageMulti,.hmpBuildPower4{grid-template-columns:1fr!important}.hmpHero{align-items:flex-start;flex-direction:column}.hmpHero h2{font-size:26px}.hmpStage{grid-template-columns:repeat(var(--hmp-cols,5),minmax(48px,1fr))!important;grid-template-rows:repeat(var(--hmp-rows,3),68px)!important;gap:6px!important;padding:8px!important}.hmpIcon{font-size:24px}.hmpLabel{display:none}.hmpJackpots,.hmpMeters{grid-template-columns:1fr}}
  `;
  document.head.appendChild(style);
}

export function mountHuffMorePuff(mountEl, store) {
  ensureHmpStyles();
  mountEl.innerHTML = `
    <div class="hmpWrap">
      <div class="hmpHero">
        <div>
          <div class="hmpEyebrow">Standalone Slot</div>
          <h2 id="hmp_title">Huff More Puff</h2>
          <p class="help" id="hmp_subtitle">5×3, 243 ways, Hard Hat free games, Buzzsaw wheel bonuses, jackpot scaling, and house construction from straw to stick to mansion.</p>
        </div>
        <div class="hmpBank" id="hmp_bank">—</div>
      </div>

      <div class="hmpControls">
        <label>Game Version
          <select id="hmp_variant">
            ${Object.entries(VARIANTS).map(([k, v]) => `<option value="${k}" ${k === currentVariantKey ? "selected" : ""}>${v.name} (${v.year})</option>`).join("")}
          </select>
        </label>
        <label>Bet Size
          <select id="hmp_bet">
            ${BET_OPTIONS.map((b) => `<option value="${b}" ${b === 100 ? "selected" : ""}>${money(b)}</option>`).join("")}
          </select>
        </label>
        <button id="hmp_spin" class="ok">SPIN</button>
        <button id="hmp_demo" class="ghost">Demo Spin</button>
        <div class="hmpFree" id="hmp_free">Free Games: 0</div>
      </div>

      <div class="hmpJackpots" id="hmp_jackpots"></div>

      <div class="hmpMeters">
        <div><span class="label">Last Win</span><strong id="hmp_lastWin">—</strong></div>
        <div><span class="label">Hard Hats</span><strong id="hmp_hats">—</strong></div>
        <div><span class="label">Buzzsaws</span><strong id="hmp_saws">—</strong></div>
        <div><span class="label">Mansions</span><strong id="hmp_mansions">—</strong></div>
      </div>

      <div class="hmpGameGrid">
        <div class="hmpStage" id="hmp_stage"></div>
        <div class="hmpBuildPanel">
          <h3>Construction Board</h3>
          <p class="help">Hard Hats build each reel space: Straw → Stick → Mansion. Mansion spaces produce the strongest free game awards.</p>
          <div class="hmpBuildGrid" id="hmp_board"></div>
        </div>
      </div>

      <div class="hmpPanel">
        <div class="hmpPanelHead">
          <strong>Win Breakdown</strong>
          <span id="hmp_status" class="help">Ready.</span>
        </div>
        <div id="hmp_winList" class="hmpWinList"></div>
      </div>

      <details class="settings" open>
        <summary>Rules</summary>
        <div class="help hmpRules" id="hmp_rules">
          <b>Bet Range:</b> ${money(BET_OPTIONS[0])} to ${money(BET_OPTIONS[BET_OPTIONS.length - 1])} per spin.<br>
          <b>243 Ways:</b> matching paying symbols win left-to-right across adjacent reels. Wolf is wild.<br>
          <b>Hard Hat Free Games:</b> ${HARD_HAT_TRIGGER}+ Hard Hats trigger ${currentVariant().freeSpins ?? FEATURE_FREE_SPINS} free games. Hats build Straw, then Stick, then Mansion. During free games, hats do <b>not</b> retrigger more spins. At the end, every built house pays; Mansions have the best chance to reveal Mini/Minor/Major/Grand word bonuses. Hats on full Mansion spaces help unfinished spaces instead.<br>
          <b>Buzzsaw Wheel:</b> 3+ Buzzsaws trigger a wheel: credits, Mini/Minor/Major/Grand jackpots, Mansion Bonus, Buzzsaw Sweep, or Mega Hat Bonus.<br>
          <b>Bet Scaling:</b> higher bet sizes increase Hard Hat, Buzzsaw, Buzzsaw Wheel, and higher jackpot-tier chances.
          <br><b>Jackpots:</b> scale with bet. Grand pays 5,000× bet.
        </div>
      </details>
    </div>
  `;

  const el = {
    variant: mountEl.querySelector("#hmp_variant"),
    title: mountEl.querySelector("#hmp_title"),
    subtitle: mountEl.querySelector("#hmp_subtitle"),
    rules: mountEl.querySelector("#hmp_rules"),
    bet: mountEl.querySelector("#hmp_bet"),
    spin: mountEl.querySelector("#hmp_spin"),
    demo: mountEl.querySelector("#hmp_demo"),
    bank: mountEl.querySelector("#hmp_bank"),
    stage: mountEl.querySelector("#hmp_stage"),
    board: mountEl.querySelector("#hmp_board"),
    jackpots: mountEl.querySelector("#hmp_jackpots"),
    lastWin: mountEl.querySelector("#hmp_lastWin"),
    hats: mountEl.querySelector("#hmp_hats"),
    saws: mountEl.querySelector("#hmp_saws"),
    mansions: mountEl.querySelector("#hmp_mansions"),
    status: mountEl.querySelector("#hmp_status"),
    winList: mountEl.querySelector("#hmp_winList"),
    free: mountEl.querySelector("#hmp_free"),
  };

  let busy = false;
  let feature = createFeatureState();
  let featureBet = 0;

  function renderVariantInfo() {
    const v = currentVariant();
    el.title.textContent = v.name;
    el.subtitle.textContent = `${v.subtitle}. ${COLS}×${ROWS}, ${COLS === 5 ? "243 ways" : "27 ways"}. ${v.note}`;
    el.rules.innerHTML = `
      <b>Bet Range:</b> ${money(BET_OPTIONS[0])} to ${money(BET_OPTIONS[BET_OPTIONS.length - 1])} per spin.<br>
      <b>${COLS === 5 ? "243 Ways" : "27 Ways"}:</b> matching paying symbols win left-to-right across adjacent reels. Wolf is wild.<br>
      <b>Hard Hat Free Games:</b> ${v.hardHatTrigger}+ Hard Hats trigger ${v.freeSpins} free games. During free games, Hard Hats only build or upgrade houses and do <b>not</b> retrigger more free games. Every Straw, Stick, and Mansion house pays at the end; Mansions are weighted toward Mini/Minor/Major/Grand word bonuses.<br>
      ${v.enableBuzzsaw ? `<b>Buzzsaw Wheel:</b> 3+ Buzzsaws${v.extraWheelFromHats ? " or 3+ Hats" : ""} trigger a wheel with credits, jackpots, and feature bonuses.<br>` : `<b>Original Mode:</b> no Buzzsaw wheel; the wolf resolves the house board after free games.<br>`}
      ${v.enableUpgradeWheel ? `<b>Upgrade Wheel:</b> can unlock a second-level Grand/Super chase.<br>` : ""}
      ${v.powerGrids > 1 ? `<b>Power 4:</b> this mode displays and rolls four 3×5 grids. Paid spins aggregate all four grids for ways pays and feature triggers; construction free games also roll all four grids and build four construction boards.<br>` : ""}
      <b>Jackpots:</b> scale with bet. ${v.enableSuper ? "Super is above Grand." : "Grand is the top prize."}
    `;
  }

  function resetVariant() {
    setVariantDimensions(currentVariant());
    feature = createFeatureState();
    featureBet = 0;
    renderAllGrids(el.stage, Array.from({ length: featureGridCount() }, () => makeGrid(false, Number(el.bet?.value || BET_OPTIONS[0]))));
    renderFeatureBoard(el, feature);
    renderJackpots();
    renderVariantInfo();
    refreshFreeLabel();
    el.status.textContent = `Loaded ${currentVariant().name}.`;
  }

  function renderJackpots() {
    const bet = Number(el.bet.value);
    el.jackpots.innerHTML = Object.entries(activeJackpots()).map(([name, mult]) => `
      <div><small>${name} ${mult.toLocaleString()}×</small><b>${money(jackpotAward(name, bet))}</b></div>
    `).join("");
  }

  function refreshFreeLabel() {
    el.free.textContent = feature.spinsLeft > 0 ? `Free Games: ${feature.spinsLeft} @ ${money(featureBet)}` : "Free Games: 0";
  }

  renderAllGrids(el.stage, Array.from({ length: featureGridCount() }, () => makeGrid(false, Number(el.bet?.value || BET_OPTIONS[0]))));
  renderFeatureBoard(el, feature);
  renderJackpots();
  renderVariantInfo();
  refreshFreeLabel();
  safeRefreshBank(el, store);
  el.variant.addEventListener("change", () => { currentVariantKey = el.variant.value; resetVariant(); });
  el.bet.addEventListener("change", renderJackpots);

  async function runBuzzsawWheelIfNeeded(result, bet) {
    if (!result.wheelTrigger) return result;

    el.status.textContent = "Buzzsaw wheel spinning...";
    await sleep(500);
    const wheel = spinBuzzsawWheel(result.sawCount, bet);
    let wheelAward = 0;
    let wheelAffected = [];

    if (wheel.type === "JACKPOT") wheelAward = jackpotAward(wheel.label, bet);
    if (wheel.type === "CREDIT") wheelAward = wheel.award;
    if (wheel.type === "UPGRADE") {
      wheel.label = `Upgrade Wheel → ${randomJackpotName(bet)}`;
      const jpName = wheel.label.split("→ ")[1];
      wheelAward = jackpotAward(jpName, bet);
    }
    if (wheel.type === "BIG_BAD_WOLF") {
      const b = applyBuzzsawSweep(feature, result.sawPositions?.length ? result.sawPositions : randomPositions(3), bet);
      wheelAward = b.award;
      wheelAffected = b.affected;
      wheel.note = "Big Bad Wolf upgraded houses toward mansions.";
    }
    if (wheel.type === "MANSION") {
      const m = applyMansionBonus(feature, result.sawPositions?.length ? result.sawPositions : randomPositions(3), bet);
      wheelAward = m.award;
      wheelAffected = m.affected;
      wheel.note = m.note;
    }
    if (wheel.type === "BUZZSAW") {
      const b = applyBuzzsawSweep(feature, result.sawPositions?.length ? result.sawPositions : randomPositions(3), bet);
      wheelAward = b.award;
      wheelAffected = b.affected;
      wheel.note = b.note;
    }
    if (wheel.type === "MEGA_HAT") {
      const m = applyMegaHat(feature, bet);
      wheelAward = m.award;
      wheelAffected = m.affected;
      wheel.note = m.note;
    }

    result.wheel = wheel;
    result.wheelAward = wheelAward;
    result.wheelAffected = wheelAffected;
    result.totalWin += wheelAward;
    return result;
  }

  async function doSpin({ demo = false } = {}) {
    if (busy) return;
    if (!demo && !store.currentPlayerId) {
      alert("Select a player first.");
      return;
    }

    const paidSpin = feature.spinsLeft <= 0;
    const bet = paidSpin ? Number(el.bet.value) : featureBet;
    let round = null;

    try {
      busy = true;
      el.spin.disabled = true;
      el.demo.disabled = true;
      el.status.textContent = paidSpin ? "Spinning paid 243-ways round..." : `Free game running (${feature.spinsLeft} left)...`;

      if (!demo) {
        round = await store.startRound("HUFF_MORE_PUFF");
        await store.placeBet(round.id, paidSpin ? `BET:${money(bet)}` : "FREE_GAME", paidSpin ? bet : 0);
      }

      let result;
      if (paidSpin) {
        feature = createFeatureState();
        result = evaluatePaidSpin(bet);
      } else {
        result = evaluateFreeSpin(bet, feature);
      }

      await animateSpin(el, result, !paidSpin);
      markCells(mountEl, result);

      if (paidSpin) result = await runBuzzsawWheelIfNeeded(result, bet);

      if (paidSpin && result.featureTrigger) {
        feature.active = true;
        feature.spinsLeft = currentVariant().freeSpins ?? FEATURE_FREE_SPINS;
        featureBet = bet;
        // Triggering hats seed the construction board using the actual hat positions first.
        for (const pos of (result.hatPositions?.length ? result.hatPositions : symbolPositions(result.grid, "HAT"))) buildWithHat(feature, pos);
      } else if (!paidSpin) {
        const v = currentVariant();
        // Construction bonus retriggers are intentionally disabled.
        // Hats during free games only build/upgrade the construction board.
        if (v.allowConstructionRetriggers === true && (result.construction?.hatCount || 0) >= (v.retriggerHats ?? 999)) {
          feature.spinsLeft += v.retriggerSpins ?? 0;
          result.retrigger = { hats: result.construction.hatCount, spins: v.retriggerSpins ?? 0 };
        }
        feature.spinsLeft = Math.max(0, feature.spinsLeft - 1);
      }

      if (!paidSpin && feature.spinsLeft === 0 && feature.board.some((tier) => tier > 0) && !feature.resolvedPrizes) {
        const finalConstruction = resolveConstructionBonus(feature, bet);
        result.finalConstruction = finalConstruction;
        result.totalWin += finalConstruction.total;
        feature.totalWin += finalConstruction.total;
      }

      const boardHighlight = result.finalConstruction?.affected ?? result.wheelAffected ?? result.construction?.affected ?? [];
      renderFeatureBoard(el, feature, boardHighlight);
      renderWins(el, result, feature);
      renderMeters(el, result, feature);
      refreshFreeLabel();

      if (!demo) {
        if (result.totalWin > 0) await store.settle(round.id, "PAYOUT", "WIN", result.totalWin, 0);
        else await store.settle(round.id, "PAYOUT", "LOSE", 0, 0);
        await store.closeRound(round.id);
      }

      if (!paidSpin && feature.spinsLeft === 0) {
        el.status.textContent = `Free Games complete. Feature total: ${money(feature.totalWin)}.`;
        featureBet = 0;
      } else if (result.totalWin > 0) {
        el.status.textContent = `Won ${money(result.totalWin)}.`;
      } else if (result.featureTrigger) {
        el.status.textContent = `Free Games triggered with ${currentVariant().freeSpins ?? FEATURE_FREE_SPINS} spins.`;
      } else if (result.wheelTrigger) {
        el.status.textContent = `Buzzsaw Wheel awarded ${money(result.wheelAward || 0)}.`;
      } else {
        el.status.textContent = "No win this spin.";
      }

      await safeRefreshBank(el, store);

      if (!demo && feature.spinsLeft > 0) {
        await sleep(800);
        doSpin();
      }
    } catch (err) {
      console.error(err);
      alert(err.message || String(err));
    } finally {
      busy = false;
      el.spin.disabled = false;
      el.demo.disabled = false;
    }
  }

  el.spin.addEventListener("click", () => doSpin());
  el.demo.addEventListener("click", () => doSpin({ demo: true }));
}
