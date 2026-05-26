// games/huffnmorepuff/huffnmorepuff.ui.js
// Standalone Huff 'N More Puff style slot module.
// Separate from games/slots/* and wired through main.js as huffnmorepuff.

const ROWS = 3;
const COLS = 5;
const CELLS = ROWS * COLS;
const MAX_HOUSE_TIER = 3; // 0 empty, 1 straw, 2 stick, 3 mansion
const FEATURE_FREE_SPINS = 6;

// Bet values are stored as whole chips/cents so .20 = 20 and $100 = 10000.
const BET_OPTIONS = [20, 40, 60, 80, 100, 200, 400, 500, 1000, 2000, 5000, 10000];

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
  { WOLF: 2, HAT: 2.1, SAW: 1.0, TAPE: 7, HARDHAT: 8, HAMMER: 9, WOOD: 10, BRICK: 10, A: 13, K: 13, Q: 13 },
  { WOLF: 2, HAT: 2.3, SAW: 1.1, TAPE: 7, HARDHAT: 8, HAMMER: 9, WOOD: 10, BRICK: 10, A: 13, K: 13, Q: 13 },
  { WOLF: 2.2, HAT: 2.5, SAW: 1.25, TAPE: 7, HARDHAT: 8, HAMMER: 9, WOOD: 10, BRICK: 10, A: 13, K: 13, Q: 13 },
  { WOLF: 2, HAT: 2.3, SAW: 1.1, TAPE: 7, HARDHAT: 8, HAMMER: 9, WOOD: 10, BRICK: 10, A: 13, K: 13, Q: 13 },
  { WOLF: 1.8, HAT: 2.1, SAW: 1.0, TAPE: 7, HARDHAT: 8, HAMMER: 9, WOOD: 10, BRICK: 10, A: 13, K: 13, Q: 13 },
];

const FREE_WEIGHTS = BASE_WEIGHTS.map((w, i) => ({
  ...w,
  HAT: w.HAT + 1.8,
  SAW: w.SAW + (i === 2 ? 1.0 : 0.45),
  WOLF: w.WOLF + 0.35,
}));

const JACKPOTS = {
  MINI: 20,
  MINOR: 100,
  MAJOR: 500,
  GRAND: 5000,
};

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

function makeGrid(freeMode = false) {
  const weights = freeMode ? FREE_WEIGHTS : BASE_WEIGHTS;
  const grid = Array.from({ length: ROWS }, () => Array(COLS).fill("A"));
  for (let c = 0; c < COLS; c++) {
    for (let r = 0; r < ROWS; r++) grid[r][c] = pick(weights[c]);
  }
  return grid;
}

function posToRc(pos) {
  return [Math.floor(pos / COLS), pos % COLS];
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

function createFeatureState() {
  return {
    spinsLeft: 0,
    board: Array(CELLS).fill(0),
    totalWin: 0,
    active: false,
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

function jackpotAward(name, bet) {
  return credits(bet * JACKPOTS[name]);
}

function randomJackpotName() {
  const r = Math.random();
  if (r < 0.62) return "MINI";
  if (r < 0.88) return "MINOR";
  if (r < 0.985) return "MAJOR";
  return "GRAND";
}

function spinBuzzsawWheel(sawCount, bet) {
  const r = Math.random();
  if (r < 0.22) return { type: "JACKPOT", label: randomJackpotName() };
  if (r < 0.44) return { type: "MANSION", label: "Mansion Bonus" };
  if (r < 0.66) return { type: "BUZZSAW", label: "Buzzsaw Sweep" };
  if (r < 0.84) return { type: "MEGA_HAT", label: "Mega Hat Bonus" };
  return { type: "CREDIT", label: `${20 * sawCount}x Credit Award`, award: credits(bet * 20 * sawCount) };
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
  const rows = sawPositions.map((p) => posToRc(p)[0]);
  const alignedRow = rows.length >= 3 && rows.every((r) => r === rows[0]);

  for (const pos of sawPositions) {
    const [r, c] = posToRc(pos);
    for (let cc = 0; cc < COLS; cc++) affected.add(rcToPos(r, cc));
    for (let rr = 0; rr < ROWS; rr++) affected.add(rcToPos(rr, c));
  }

  for (const pos of affected) {
    const bump = alignedRow ? 2 : 1;
    feature.board[pos] = Math.min(MAX_HOUSE_TIER, feature.board[pos] + bump);
  }

  const mansions = mansionPayoutCount(feature.board);
  return {
    affected: [...affected],
    award: credits(bet * Math.max(1, mansions) * (alignedRow ? 12 : 6)),
    note: alignedRow ? "Three buzzsaws aligned in a row and upgraded structures harder." : "Buzzsaws swept paths into house upgrades.",
  };
}

function applyMegaHat(feature, bet) {
  const cover = Math.min(CELLS, 6 + Math.floor(Math.random() * 10)); // 6..15 spaces
  const positions = [...Array(CELLS).keys()].sort(() => Math.random() - 0.5).slice(0, cover);
  for (const pos of positions) buildWithHat(feature, pos);
  const mansions = mansionPayoutCount(feature.board);
  return { affected: positions, award: credits(bet * Math.max(cover, mansions * 8)), note: `Mega Hat covered ${cover} reel spaces.` };
}

function applyFreeSpinConstruction(feature, grid, bet) {
  const hatPositions = symbolPositions(grid, "HAT");
  const builds = [];
  let overflowMansions = 0;

  for (const pos of hatPositions) {
    const built = buildWithHat(feature, pos);
    builds.push(built);
    if (built.overflow) overflowMansions++;
  }

  const mansions = mansionPayoutCount(feature.board);
  const award = credits(bet * (mansions * 5 + overflowMansions * 25));
  return { builds, affected: builds.map((b) => b.pos).filter((p) => p != null), award, hatCount: hatPositions.length, mansions, overflowMansions };
}

function evaluatePaidSpin(bet) {
  const grid = makeGrid(false);
  const ways = waysWin(grid, bet);
  const hatCount = countSymbol(grid, "HAT");
  const sawCount = countSymbol(grid, "SAW");
  const sawPositions = symbolPositions(grid, "SAW");
  const featureTrigger = hatCount >= 6;
  const wheelTrigger = sawCount >= 3;

  return {
    grid,
    ways,
    hatCount,
    sawCount,
    sawPositions,
    featureTrigger,
    wheelTrigger,
    totalWin: ways.total,
  };
}

function evaluateFreeSpin(bet, feature) {
  const grid = makeGrid(true);
  const ways = waysWin(grid, bet);
  const sawCount = countSymbol(grid, "SAW");
  const sawPositions = symbolPositions(grid, "SAW");
  const construction = applyFreeSpinConstruction(feature, grid, bet);
  let wheel = null;
  let wheelAward = 0;
  let wheelAffected = [];

  if (sawCount >= 3) {
    wheel = spinBuzzsawWheel(sawCount, bet);
    if (wheel.type === "JACKPOT") wheelAward = jackpotAward(wheel.label, bet);
    if (wheel.type === "CREDIT") wheelAward = wheel.award;
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

  return { grid, ways, sawCount, sawPositions, construction, wheel, wheelAward, wheelAffected, totalWin };
}

function renderGrid(stage, grid) {
  stage.innerHTML = grid.map((row, r) => row.map((sym, c) => cellHtml(sym, r, c)).join("")).join("");
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
  el.board.innerHTML = feature.board.map((tier, pos) => `
    <div class="hmpBuildCell ${tier >= 3 ? "mansion" : tier === 2 ? "stick" : tier === 1 ? "straw" : ""} ${hi.has(pos) ? "hit" : ""}">
      <div>${tierIcon(tier)}</div>
      <small>${houseTierLabel(tier)}</small>
    </div>`).join("");
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

  if (result.featureTrigger) rows.push(`<div class="hmpWinRow hmpFeatureRow"><span>🪖 6+ Hard Hats triggered Free Games</span><b>6 spins</b></div>`);
  if (result.wheelTrigger) rows.push(`<div class="hmpWinRow hmpSawRow"><span>🪚 3+ Buzzsaws triggered Bonus Wheel</span><b>Ready</b></div>`);
  if (result.construction?.hatCount) rows.push(`<div class="hmpWinRow hmpFeatureRow"><span>🪖 Hats built houses — ${result.construction.mansions} mansion(s)</span><b>${money(result.construction.award)}</b></div>`);
  if (result.wheel) rows.push(`<div class="hmpWinRow hmpSawRow"><span>🪚 ${result.wheel.label}${result.wheel.note ? ` — ${result.wheel.note}` : ""}</span><b>${money(result.wheelAward)}</b></div>`);

  if (!rows.length) rows.push(`<div class="help">No win. 243 ways pay from the leftmost reel. Hard Hats and Buzzsaws can trigger features.</div>`);
  el.winList.innerHTML = rows.join("");
}

function renderMeters(el, result, feature) {
  el.lastWin.textContent = money(result.totalWin || 0);
  el.hats.textContent = String(result.hatCount ?? result.construction?.hatCount ?? countSymbol(result.grid, "HAT"));
  el.saws.textContent = String(result.sawCount ?? 0);
  el.mansions.textContent = String(mansionPayoutCount(feature.board));
}

async function animateSpin(el, finalGrid, freeMode = false) {
  for (let i = 0; i < 10; i++) {
    renderGrid(el.stage, makeGrid(freeMode));
    await sleep(45 + i * 16);
  }
  renderGrid(el.stage, finalGrid);
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
    .hmpGameGrid{display:grid;grid-template-columns:minmax(360px,640px) minmax(260px,1fr);gap:14px;align-items:start}.hmpStage{display:grid!important;grid-template-columns:repeat(5,minmax(68px,1fr))!important;grid-template-rows:repeat(3,92px)!important;gap:8px!important;padding:14px!important;border-radius:18px;border:1px solid rgba(249,115,22,.24);background:linear-gradient(180deg,rgba(255,255,255,.055),rgba(0,0,0,.12)),rgba(0,0,0,.2);box-shadow:inset 0 0 0 1px rgba(255,255,255,.04)}
    .hmpCell{display:grid!important;place-items:center!important;align-content:center!important;gap:3px;padding:8px 5px;border-radius:16px;border:1px solid rgba(255,255,255,.11);background:rgba(255,255,255,.055);position:relative;overflow:hidden;transition:transform .12s ease,border-color .12s ease,box-shadow .12s ease}.hmpCell::after{content:"";position:absolute;inset:0;background:radial-gradient(circle at 35% 12%,rgba(255,255,255,.18),transparent 36%);pointer-events:none}.hmpIcon{font-size:32px;line-height:1;font-weight:1000;z-index:1}.hmpLabel{font-size:11px;color:rgba(233,236,245,.76);text-align:center;z-index:1}.hmpCell[data-sym="A"] .hmpIcon,.hmpCell[data-sym="K"] .hmpIcon,.hmpCell[data-sym="Q"] .hmpIcon{font-size:28px;color:#fed7aa}.hmpWild{border-color:rgba(248,113,113,.52);background:rgba(127,29,29,.22)}.hmpHat{border-color:rgba(250,204,21,.55);background:rgba(250,204,21,.09)}.hmpSaw{border-color:rgba(96,165,250,.55);background:rgba(37,99,235,.12)}.hmpWin{transform:translateY(-2px);box-shadow:0 0 0 3px rgba(52,211,153,.16),0 0 20px rgba(52,211,153,.26)}
    .hmpBuildPanel,.hmpPanel{border-radius:16px;border:1px solid rgba(255,255,255,.1);background:rgba(255,255,255,.035);padding:12px}.hmpBuildPanel h3{margin:0 0 8px}.hmpBuildGrid{display:grid;grid-template-columns:repeat(5,1fr);gap:7px}.hmpBuildCell{height:66px;border-radius:13px;border:1px solid rgba(255,255,255,.1);background:rgba(0,0,0,.18);display:grid;place-items:center;align-content:center;font-weight:900}.hmpBuildCell small{font-size:10px;color:rgba(255,255,255,.65)}.hmpBuildCell.straw{background:rgba(217,119,6,.15);border-color:rgba(217,119,6,.4)}.hmpBuildCell.stick{background:rgba(120,53,15,.18);border-color:rgba(180,83,9,.5)}.hmpBuildCell.mansion{background:rgba(250,204,21,.15);border-color:rgba(250,204,21,.55)}.hmpBuildCell.hit{animation:hmpBuildHit .9s ease-out 1}@keyframes hmpBuildHit{0%{transform:scale(1)}35%{transform:scale(1.08)}100%{transform:scale(1)}}
    .hmpPanelHead{display:flex;justify-content:space-between;gap:12px;align-items:baseline;flex-wrap:wrap;margin-bottom:10px}.hmpWinList{display:grid;gap:8px}.hmpWinRow{display:flex;justify-content:space-between;gap:10px;padding:9px 10px;border-radius:12px;border:1px solid rgba(255,255,255,.1);background:rgba(255,255,255,.035)}.hmpFeatureRow{border-color:rgba(249,115,22,.28);background:rgba(249,115,22,.1)}.hmpSawRow{border-color:rgba(96,165,250,.35);background:rgba(37,99,235,.12)}.hmpRules{line-height:1.7}
    @media(max-width:920px){.hmpGameGrid{grid-template-columns:1fr}.hmpJackpots,.hmpMeters{grid-template-columns:repeat(2,1fr)}}@media(max-width:720px){.hmpHero{align-items:flex-start;flex-direction:column}.hmpHero h2{font-size:26px}.hmpStage{grid-template-columns:repeat(5,minmax(48px,1fr))!important;grid-template-rows:repeat(3,68px)!important;gap:6px!important;padding:8px!important}.hmpIcon{font-size:24px}.hmpLabel{display:none}.hmpJackpots,.hmpMeters{grid-template-columns:1fr}}
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
          <h2>Huff 'N More Puff</h2>
          <p class="help">5×3, 243 ways, Hard Hat free games, Buzzsaw wheel bonuses, jackpot scaling, and house construction from straw to stick to mansion.</p>
        </div>
        <div class="hmpBank" id="hmp_bank">—</div>
      </div>

      <div class="hmpControls">
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
        <div class="help hmpRules">
          <b>Bet Range:</b> ${money(BET_OPTIONS[0])} to ${money(BET_OPTIONS[BET_OPTIONS.length - 1])} per spin.<br>
          <b>243 Ways:</b> matching paying symbols win left-to-right across adjacent reels. Wolf is wild.<br>
          <b>Hard Hat Free Games:</b> 6+ Hard Hats trigger ${FEATURE_FREE_SPINS} free games. Hats build Straw, then Stick, then Mansion. Hats on full Mansion spaces help unfinished spaces instead.<br>
          <b>Buzzsaw Wheel:</b> 3+ Buzzsaws trigger a wheel: credits, Mini/Minor/Major/Grand jackpots, Mansion Bonus, Buzzsaw Sweep, or Mega Hat Bonus.<br>
          <b>Jackpots:</b> scale with bet. Grand pays 5,000× bet.
        </div>
      </details>
    </div>
  `;

  const el = {
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

  function renderJackpots() {
    const bet = Number(el.bet.value);
    el.jackpots.innerHTML = Object.entries(JACKPOTS).map(([name, mult]) => `
      <div><small>${name} ${mult.toLocaleString()}×</small><b>${money(jackpotAward(name, bet))}</b></div>
    `).join("");
  }

  function refreshFreeLabel() {
    el.free.textContent = feature.spinsLeft > 0 ? `Free Games: ${feature.spinsLeft} @ ${money(featureBet)}` : "Free Games: 0";
  }

  renderGrid(el.stage, makeGrid(false));
  renderFeatureBoard(el, feature);
  renderJackpots();
  refreshFreeLabel();
  safeRefreshBank(el, store);
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
    if (wheel.type === "MANSION") {
      const m = applyMansionBonus(feature, result.sawPositions, bet);
      wheelAward = m.award;
      wheelAffected = m.affected;
      wheel.note = m.note;
    }
    if (wheel.type === "BUZZSAW") {
      const b = applyBuzzsawSweep(feature, result.sawPositions, bet);
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

      await animateSpin(el, result.grid, !paidSpin);
      markCells(mountEl, result);

      if (paidSpin) result = await runBuzzsawWheelIfNeeded(result, bet);

      if (paidSpin && result.featureTrigger) {
        feature.active = true;
        feature.spinsLeft = FEATURE_FREE_SPINS;
        featureBet = bet;
        // Initial six hats seed the construction board using the actual hat positions first.
        for (const pos of symbolPositions(result.grid, "HAT")) buildWithHat(feature, pos);
      } else if (!paidSpin) {
        feature.spinsLeft = Math.max(0, feature.spinsLeft - 1);
      }

      renderFeatureBoard(el, feature, result.wheelAffected ?? result.construction?.affected ?? []);
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
        el.status.textContent = `Free Games triggered with ${FEATURE_FREE_SPINS} spins.`;
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
