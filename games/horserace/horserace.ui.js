// horserace.ui.js
import { makeRace, settleWinBet } from "./horserace.engine.js";

export function mountHorseRacing(rootEl, store) {
  rootEl.innerHTML = `
    <div class="hr-wrap">
      <div class="hr-controls">
        <label>Horses:
          <select id="fieldSize">
            <option value="4">4</option>
            <option value="6">6</option>
            <option value="8" selected>8</option>
          </select>
        </label>

        <label>Pick Winner:
          <select id="horsePick"></select>
        </label>

        <label>Bet:
          <input id="betAmt" type="number" min="1" value="10" />
        </label>

        <button id="btnNew">New Race</button>
        <button id="btnRun">Run Race</button>

        <div id="msg" class="hr-msg"></div>
      </div>

      <div id="board" class="hr-board"></div>
      <div id="track" class="hr-track"></div>
      <div id="results" class="hr-results"></div>
    </div>
  `;

  const fieldSizeEl = rootEl.querySelector("#fieldSize");
  const horsePickEl = rootEl.querySelector("#horsePick");
  const betAmtEl = rootEl.querySelector("#betAmt");
  const btnNew = rootEl.querySelector("#btnNew");
  const btnRun = rootEl.querySelector("#btnRun");
  const msgEl = rootEl.querySelector("#msg");
  const boardEl = rootEl.querySelector("#board");
  const trackEl = rootEl.querySelector("#track");
  const resultsEl = rootEl.querySelector("#results");

  let race = null;

  function renderRace() {
    const horseCount = Number(fieldSizeEl.value);
    race = makeRace({ horseCount });

    horsePickEl.innerHTML = race.horses
      .map(h => `<option value="${h.id}">${h.name} (${h.odds}x)</option>`)
      .join("");

    boardEl.innerHTML = `
      <div class="hr-board-title">Odds Board (${race.horseCount} horses)</div>
      <div class="hr-board-grid">
        ${race.horses
          .slice()
          .sort((a, b) => a.odds - b.odds)
          .map(h => `
            <div class="hr-card">
              <div class="hr-name">${h.name}</div>
              <div class="hr-odds">${h.odds}x</div>
            </div>
          `)
          .join("")}
      </div>
    `;

    renderTrack(trackEl, race);

    resultsEl.textContent = "";
    msgEl.textContent = "Pick a winner, set your bet, and run the race.";
  }

  async function runRace() {
    const amount = Math.floor(Number(betAmtEl.value || 0));
    if (amount < 1) { msgEl.textContent = "Bet must be at least 1."; return; }
    if (store.balance < amount) { msgEl.textContent = "Not enough balance."; return; }

    store.balance -= amount;
    store.render?.();

    btnRun.disabled = true;
    btnNew.disabled = true;
    fieldSizeEl.disabled = true;
    horsePickEl.disabled = true;
    betAmtEl.disabled = true;

    msgEl.textContent = "And they're off!";

    const pickedHorseId = horsePickEl.value;

    // Animate ~8 seconds; guaranteed finish order = race.finishOrder
    await animateRace(trackEl, race, { durationMs: 5000 });

    const winner = race.finishOrder[0];
    highlightWinner(trackEl, race.winnerId);
    msgEl.textContent = `🏁 Winner: ${winner.name} (${winner.odds}x)`;


    const finish = race.finishOrder.map((h, i) => `${i + 1}. ${h.name}`).join("  •  ");
    const settled = settleWinBet({ horseId: pickedHorseId, amount }, race);

    if (settled.result === "win") {
      store.balance += settled.payout;
      msgEl.textContent = `WIN! Payout $${settled.payout} (at ${settled.odds}x)`;
    } else {
      msgEl.textContent = `Lost. Winner was: ${race.finishOrder[0].name}`;
    }
    store.render?.();

    resultsEl.textContent = `Finish: ${finish}`;

    btnRun.disabled = false;
    btnNew.disabled = false;
    fieldSizeEl.disabled = false;
    horsePickEl.disabled = false;
    betAmtEl.disabled = false;

    // New lineup after each race
    msgEl.textContent += " — Click New Race to set up the next race.";

  }

  fieldSizeEl.addEventListener("change", renderRace);
  btnNew.addEventListener("click", renderRace);
  btnRun.addEventListener("click", runRace);

  renderRace();
}

/** Track DOM */
function renderTrack(trackEl, race) {
  // We render lanes in the same order as horses array (not finish order)
  trackEl.innerHTML = `
    <div class="hr-track-inner">
      ${race.horses.map((h, idx) => `
        <div class="hr-lane" data-lane="${idx}">
          <div class="hr-lane-label">${idx + 1}. ${h.name}</div>
          <div class="hr-lane-run">
            <div class="hr-horse" data-id="${h.id}" style="transform: translateX(0px);">🏇</div>
            <div class="hr-finish">🏁</div>
          </div>
        </div>
      `).join("")}
    </div>
  `;
}

function highlightWinner(trackEl, winnerId) {
  trackEl.querySelectorAll(".hr-horse").forEach(el => {
    el.classList.toggle("hr-winner", el.dataset.id === winnerId);
  });
}


/**
 * Simple race animation (~durationMs) that ALWAYS ends in race.finishOrder.
 * Implementation: each horse accumulates progress with random “stride” noise + rank bias,
 * then we normalize at the end so 1st > 2nd > ... exactly.
 */
function animateRace(trackEl, race, { durationMs = 5000 } = {}) {
  const horses = Array.from(trackEl.querySelectorAll(".hr-horse"));
  const byId = Object.fromEntries(horses.map(el => [el.dataset.id, el]));

  // Map finish rank (0 = winner)
  const rank = {};
  race.finishOrder.forEach((h, i) => (rank[h.id] = i));

  // Determine track width in pixels to move across
  const laneRun = trackEl.querySelector(".hr-lane-run");
  const finishEl = trackEl.querySelector(".hr-finish");
  const laneWidth = laneRun.getBoundingClientRect().width;
  const finishX = finishEl.getBoundingClientRect().left - laneRun.getBoundingClientRect().left;
  const maxX = Math.max(0, finishX - 28); // keep emoji from overlapping flag

  // Progress state (0..1-ish)
  const prog = {};
  horses.forEach(el => (prog[el.dataset.id] = 0));

  // Bias: winner gets a small edge; last gets slight penalty.
  // Keep it subtle so it looks like “a race,” not rails.
  const n = race.horses.length;
  const biasOf = (id) => {
    const r = rank[id] ?? (n - 1);
    const t = (n - 1 - r) / (n - 1); // winner ~1, last ~0
    return 0.010 + t * 0.010;       // 0.010..0.020 per frame-ish (scaled below)
  };

  // Per-horse “stride personality”
  const stride = {};
  race.horses.forEach(h => {
    // Slightly favor stronger (lower odds) horses in the *look* too
    const strength = 1 / h.odds; // rough
    stride[h.id] = {
      base: 0.9 + strength * 0.8,          // base pace
      wobble: 0.6 + Math.random() * 0.6,   // how swingy their strides are
      phase: Math.random() * Math.PI * 2,  // unique cadence
    };
  });

  return new Promise((resolve) => {
    const start = performance.now();

    function frame(now) {
      const t = (now - start) / durationMs; // 0..1
      const done = t >= 1;

      // Each frame: add a small delta to each horse
      race.horses.forEach(h => {
        const id = h.id;
        const s = stride[id];

        // cadence-based stride + random jitter
        const cadence = Math.sin((t * 10.0) + s.phase) * 0.5 + 0.5; // 0..1
        const noise = (Math.random() - 0.5) * 0.003 * s.wobble;

        // Late-race “kick” makes finishes dramatic, but still respects ranking
        const kick = t > 0.70 ? (1 + (1 - (rank[id] / (n - 1))) * 0.25) : 1;

        // delta progress
        const delta = (0.008 * s.base + biasOf(id)) * kick + noise;

        prog[id] = clamp(prog[id] + delta, 0, 1.3);
      });

      // To guarantee finish order, we “steer” the last ~15% toward target spacing
      if (t > 0.85) {
        const targets = makeFinishTargets(race.finishOrder);
        race.finishOrder.forEach((h, i) => {
          const id = h.id;
          prog[id] = lerp(prog[id], targets[i], 0.12);
        });
      }

      // Render: convert progress -> pixel x
      horses.forEach(el => {
        const id = el.dataset.id;
        const x = clamp01(prog[id]) * maxX;
        el.style.transform = `translateX(${x}px)`;
      });

      if (!done) {
        requestAnimationFrame(frame);
      } else {
        // Snap to final finish order positions (winner closest to finish)
        const finalTargets = makeFinishTargets(race.finishOrder);
        race.finishOrder.forEach((h, i) => {
          const el = byId[h.id];
          if (!el) return;
          const x = finalTargets[i] * maxX;
          el.style.transform = `translateX(${x}px)`;
        });
        resolve();
      }
    }

    requestAnimationFrame(frame);
  });
}

// Winner ~1.00, second ~0.985, ... last a bit behind
function makeFinishTargets(finishOrder) {
  const n = finishOrder.length;
  const gap = n <= 4 ? 0.012 : n <= 6 ? 0.010 : 0.009;
  return finishOrder.map((_, i) => clamp(1.0 - i * gap, 0.88, 1.0));
}

function clamp(x, a, b) { return Math.max(a, Math.min(b, x)); }
function clamp01(x) { return Math.max(0, Math.min(1, x)); }
function lerp(a, b, t) { return a + (b - a) * t; }
