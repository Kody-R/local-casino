// games/roulette/roulette.ui.js
import { EURO_WHEEL, spinWheel, evaluateBet } from "./roulette.engine.js";

const REDS = new Set([
  1, 3, 5, 7, 9, 12, 14, 16, 18, 19, 21, 23, 25, 27, 30, 32, 34, 36,
]);

const OUTSIDE = [
  { key: "LOW", label: "1–18" },
  { key: "EVEN", label: "EVEN" },
  { key: "RED", label: "RED" },
  { key: "BLACK", label: "BLACK" },
  { key: "ODD", label: "ODD" },
  { key: "HIGH", label: "19–36" },
];

const DOZENS = [
  { key: "DOZEN1", label: "1st 12" },
  { key: "DOZEN2", label: "2nd 12" },
  { key: "DOZEN3", label: "3rd 12" },
];

const CHIP_DENOMS = [1, 5, 25, 100, 500];

export function mountRoulette(mountEl, store) {
  mountEl.innerHTML = `
    <h2>European Roulette</h2>
    <p class="help">Place chips on bets. Spin when ready. (European wheel: single 0)</p>

    <div class="rouletteLayout">
      <div class="rouletteLeft">
        <div class="wheelShell">
          <div id="rou_wheel" class="wheel"></div>
          <div class="wheelRim"></div>
          <div id="rou_ball" class="ball"></div>
          <div class="pointer"></div>
        </div>

        <div class="historyBar">
          <div class="label">Last</div>
          <div id="rou_history" class="historyStrip"></div>
        </div>

        <div class="row">
          <button id="rou_spin" class="spinBtn">SPIN</button>
          <button id="rou_rebet">Rebet</button>
          <button id="rou_undo">Undo</button>
          <button id="rou_clear" class="danger">Clear</button>
        </div>

        <div class="resultBox">
          <div class="label">Result</div>
          <div id="rou_outcome" class="value">—</div>
          <div id="rou_pnl" class="muted">—</div>
        </div>
      </div>

      <div class="rouletteRight">
        <div class="chipsRow">
          <div class="label">Chips</div>
          <div id="rou_chips" class="chipRack"></div>
          <div class="muted" id="rou_chipSel">Selected: —</div>
        </div>

        <div class="betsPanel">
          <div class="betSectionTitle">Number Grid (Straight-up)</div>
          <div id="rou_grid" class="numGrid"></div>

          <div class="betSectionTitle">Dozens</div>
          <div id="rou_dozens" class="dozenRow"></div>

          <div class="betSectionTitle">Outside</div>
          <div id="rou_outside" class="outsideRow"></div>

          <div class="betTotals">
            <div class="label">Total Bet</div>
            <div id="rou_total" class="value">0</div>
          </div>
        </div>
      </div>
    </div>
  `;

  const el = {
    wheel: mountEl.querySelector("#rou_wheel"),
    ball: mountEl.querySelector("#rou_ball"),
    spin: mountEl.querySelector("#rou_spin"),
    rebet: mountEl.querySelector("#rou_rebet"),
    undo: mountEl.querySelector("#rou_undo"),
    clear: mountEl.querySelector("#rou_clear"),
    outcome: mountEl.querySelector("#rou_outcome"),
    pnl: mountEl.querySelector("#rou_pnl"),
    chips: mountEl.querySelector("#rou_chips"),
    chipSel: mountEl.querySelector("#rou_chipSel"),
    grid: mountEl.querySelector("#rou_grid"),
    dozens: mountEl.querySelector("#rou_dozens"),
    outside: mountEl.querySelector("#rou_outside"),
    total: mountEl.querySelector("#rou_total"),
    history: mountEl.querySelector("#rou_history"),
  };

  // ---------- state ----------
  let selectedChip = 5;
  let isSpinning = false;

  // bets: Map<betKey, amount>
  // betKey examples: "STRAIGHT:17", "RED", "DOZEN2"
  let bets = new Map();
  let betStack = []; // for undo: [{key, amt}]
  let lastBets = null; // for rebet
  let history = []; // recent outcomes

  // ---------- wheel build ----------
  buildWheel(el.wheel);

  // ---------- chips ----------
  renderChips();
  function renderChips() {
    el.chips.innerHTML = "";
    for (const d of CHIP_DENOMS) {
      const b = document.createElement("button");
      b.className = "chipBtn" + (d === selectedChip ? " activeChip" : "");
      b.textContent = `$${d}`;
      b.addEventListener("click", () => {
        selectedChip = d;
        renderChips();
        el.chipSel.textContent = `Selected: $${selectedChip}`;
      });
      el.chips.appendChild(b);
    }
    el.chipSel.textContent = `Selected: $${selectedChip}`;
  }

  // ---------- bet UI ----------
  renderGrid();
  renderDozens();
  renderOutside();
  refreshTotals();

  function renderGrid() {
    // 0 + 1..36 in table-ish order (simple)
    // We’ll do 0 at top, then 1–36 in rows of 12 for now (medium realism)
    // If you want true roulette layout (3 columns), we can do next.
    el.grid.innerHTML = "";

    const zero = makeBetCell("0", "STRAIGHT:0", "green");
    el.grid.appendChild(zero);

    for (let n = 1; n <= 36; n++) {
      const color = REDS.has(n) ? "red" : "black";
      const cell = makeBetCell(String(n), `STRAIGHT:${n}`, color);
      el.grid.appendChild(cell);
    }
  }

  function renderDozens() {
    el.dozens.innerHTML = "";
    for (const d of DOZENS) {
      const cell = makeBetCell(d.label, d.key, "neutral");
      cell.classList.add("wideBet");
      el.dozens.appendChild(cell);
    }
  }

  function renderOutside() {
    el.outside.innerHTML = "";
    for (const o of OUTSIDE) {
      const color =
        o.key === "RED" ? "red" : o.key === "BLACK" ? "black" : "neutral";
      const cell = makeBetCell(o.label, o.key, color);
      cell.classList.add("wideBet");
      el.outside.appendChild(cell);
    }
  }

  function makeBetCell(label, key, colorClass) {
    const div = document.createElement("div");
    div.className = `betCell ${colorClass}`;
    div.dataset.key = key;
    div.innerHTML = `
      <div class="betLabel">${label}</div>
      <div class="betAmt" data-amt>—</div>
    `;

    div.addEventListener("click", () => {
      if (isSpinning) return;
      addChip(key, selectedChip);
      paintBetCell(div, key);
      refreshTotals();
    });

    paintBetCell(div, key);
    return div;
  }

  function paintAllBetCells() {
    mountEl.querySelectorAll(".betCell").forEach((cell) => {
      paintBetCell(cell, cell.dataset.key);
    });
  }

  function paintBetCell(cell, key) {
    const amt = bets.get(key) ?? 0;
    const amtEl = cell.querySelector("[data-amt]");
    amtEl.textContent = amt > 0 ? `$${amt}` : "—";
    cell.classList.toggle("hasBet", amt > 0);
  }

  function addChip(key, amt) {
    const cur = bets.get(key) ?? 0;
    bets.set(key, cur + amt);
    betStack.push({ key, amt });
  }

  function refreshTotals() {
    let total = 0;
    for (const v of bets.values()) total += v;
    el.total.textContent = `$${total}`;
  }

  // ---------- actions ----------
  el.undo.addEventListener("click", () => {
    if (isSpinning) return;
    const last = betStack.pop();
    if (!last) return;
    const cur = bets.get(last.key) ?? 0;
    const next = Math.max(0, cur - last.amt);
    if (next === 0) bets.delete(last.key);
    else bets.set(last.key, next);
    paintAllBetCells();
    refreshTotals();
  });

  el.clear.addEventListener("click", () => {
    if (isSpinning) return;
    bets.clear();
    betStack = [];
    paintAllBetCells();
    refreshTotals();
  });

  el.rebet.addEventListener("click", () => {
    if (isSpinning) return;
    if (!lastBets) return;
    bets = new Map(lastBets);
    betStack = []; // rebet resets undo stack
    paintAllBetCells();
    refreshTotals();
  });

  el.spin.addEventListener("click", async () => {
    try {
      if (isSpinning) return;
      if (!store.currentPlayerId) throw new Error("Select a player first.");
      if (bets.size === 0) throw new Error("Place at least one bet.");

      // snapshot for rebet
      lastBets = new Map(bets);

      // start round
      const round = await store.startRound("ROULETTE");

      // place each bet
      // Use betType as key (e.g., "STRAIGHT:17") so we can settle individually
      for (const [key, amt] of bets.entries()) {
        await store.placeBet(round.id, key, amt);
      }

      // decide result up-front, then animate to it
      const result = spinWheel(); // {index, number}

      isSpinning = true;
      lockUI(true);

      el.outcome.textContent = "Spinning…";
      el.pnl.textContent = "—";

      await animateSpin(el.wheel, el.ball, result.index);

      // settlement
      let netProfit = 0;
      const landed = result.number;

      for (const [key, amt] of bets.entries()) {
        const bet = parseBetKey(key);
        const mult = evaluateBet(bet, landed);
        if (mult >= 0) {
          const profit = amt * mult;
          netProfit += profit;
          await store.settle(round.id, key, "WIN", profit, amt);
        } else {
          netProfit -= amt;
          await store.settle(round.id, key, "LOSE", 0, 0);
        }
      }

      await store.closeRound(round.id);
      await store.uiRefresh?.();

      // UI updates
      el.outcome.textContent = `Landed on ${landed}`;
      el.pnl.textContent =
        netProfit >= 0
          ? `Net: +$${netProfit}`
          : `Net: -$${Math.abs(netProfit)}`;

      history.unshift(landed);
      history = history.slice(0, 12);
      renderHistory();

      // highlight landed number on grid briefly
      flashWinningCell(landed);

      // after spin: keep bets (casino tables keep chips unless cleared) —
      // but many apps clear by default. I recommend KEEP for realism.
      // If you prefer clear, call clear() here.
    } catch (e) {
      alert(e.message);
    } finally {
      isSpinning = false;
      lockUI(false);
    }
  });

  function lockUI(lock) {
    el.spin.disabled = lock;
    el.rebet.disabled = lock;
    el.undo.disabled = lock;
    el.clear.disabled = lock;
    mountEl
      .querySelectorAll(".betCell")
      .forEach((x) => x.classList.toggle("locked", lock));
  }

  function renderHistory() {
    el.history.innerHTML = "";
    for (const n of history) {
      const tag = document.createElement("div");
      const cls = n === 0 ? "hGreen" : REDS.has(n) ? "hRed" : "hBlack";
      tag.className = `histNum ${cls}`;
      tag.textContent = String(n);
      el.history.appendChild(tag);
    }
  }

  function flashWinningCell(n) {
    const key = `STRAIGHT:${n}`;
    const cell = mountEl.querySelector(`.betCell[data-key="${key}"]`);
    if (!cell) return;
    cell.classList.add("winFlash");
    setTimeout(() => cell.classList.remove("winFlash"), 900);
  }
}

// ---------- helpers ----------

function parseBetKey(key) {
  if (key.startsWith("STRAIGHT:")) {
    return { type: "STRAIGHT", value: Number(key.split(":")[1]) };
  }
  return { type: key };
}

function buildWheel(el) {
  const slots = EURO_WHEEL.length; // 37
  const degPer = 360 / slots;

  // Make index 0 start at 12 o'clock, and make indices advance counterclockwise
  // so that rotating the wheel clockwise by +index*degPer brings that index to the pointer.
  el.innerHTML = EURO_WHEEL.map((num, i) => {
    const angle = -90 - i * degPer;

    const color =
      num === 0
        ? "green"
        : [
              1, 3, 5, 7, 9, 12, 14, 16, 18, 19, 21, 23, 25, 27, 30, 32, 34, 36,
            ].includes(num)
          ? "red"
          : "black";

    return `<div class="slot ${color}" style="transform:rotate(${angle}deg)">${num}</div>`;
  }).join("");
}

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

async function animateSpin(wheelEl, ballEl, index) {
  const slots = 37;
  const degPer = 360 / slots;

  const extraTurns = 6 + Math.floor(Math.random() * 3); // 6–8
  const jitter = (Math.random() * 0.6 - 0.3) * degPer; // smaller jitter

  const current = Number(wheelEl.dataset.rot || 0);
  const target = current + extraTurns * 360 + index * degPer + jitter;

  wheelEl.dataset.rot = String(target);

  wheelEl.style.transition = "transform 4.6s cubic-bezier(.12,.75,.18,1)";
  wheelEl.style.transform = `rotate(${target}deg)`;

  ballEl.classList.remove("ballSpin", "ballDrop");
  void ballEl.offsetWidth;
  ballEl.classList.add("ballSpin");

  await sleep(3400);
  ballEl.classList.add("ballDrop");
  await sleep(1400);

  ballEl.classList.remove("ballSpin");
}
