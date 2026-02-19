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

        <label>Race Duration (sec):
         <input id="raceDur" type="number" min="4" max="30" value="8" />
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
  const raceDurEl = rootEl.querySelector("#raceDur");


  let race = null;

function renderRace() {
  const horseCount = Number(fieldSizeEl.value);
  const durationMs = Math.max(4000, Math.min(30000, Number(raceDurEl.value || 8) * 1000));

  race = makeRace({ horseCount, durationMs });

  horsePickEl.innerHTML = race.horses
    .map(h => `<option value="${h.id}">${h.name} (${h.oddsStr})</option>`)
    .join("");

  boardEl.innerHTML = `
    <div class="hr-board-title">Odds Board (${race.horseCount} horses)</div>
    <div class="hr-board-grid">
      ${race.horses
        .slice()
        .sort((a, b) => a.frac - b.frac)  // smaller "to-1" is favorite
        .map(h => `
          <div class="hr-card">
            <div class="hr-name">${h.name}</div>
            <div class="hr-odds">${h.oddsStr}</div>
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

    await animateRace(trackEl, race, { durationMs: race.durationMs });


    const winner = race.finishOrder[0];
    highlightWinner(trackEl, race.winnerId);
    msgEl.textContent = `🏁 Winner: ${winner.name} (${winner.oddsStr})`;


    const finish = race.finishOrder.map((h, i) => `${i + 1}. ${h.name}`).join("  •  ");
    const settled = settleWinBet({ horseId: pickedHorseId, amount }, race);

    if (settled.result === "win") {
      store.balance += settled.payout;
      msgEl.textContent = `WIN! Payout $${settled.payout} (at ${settled.oddsStr})`;
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

  raceDurEl.addEventListener("change", renderRace);
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
function animateRace(trackEl, race, { durationMs = 8000 } = {}) {
  const horses = Array.from(trackEl.querySelectorAll(".hr-horse"));
  const byId = Object.fromEntries(horses.map(el => [el.dataset.id, el]));

  const rank = {};
  race.finishOrder.forEach((h, i) => (rank[h.id] = i));

  const laneRun = trackEl.querySelector(".hr-lane-run");
  const finishEl = trackEl.querySelector(".hr-finish");
  const finishX = finishEl.getBoundingClientRect().left - laneRun.getBoundingClientRect().left;
  const maxX = Math.max(0, finishX - 28);

  const prog = {};
  horses.forEach(el => (prog[el.dataset.id] = 0));

  const n = race.horses.length;
  const biasOf = (id) => {
    const r = rank[id] ?? (n - 1);
    const t = (n - 1 - r) / (n - 1);
    return 0.70 + t * 0.60; // units: "progress per second" bias
  };

  const stride = {};
  race.horses.forEach(h => {
    const strength = 1 / (h.frac + 1); // rough; favorites slightly smoother
    stride[h.id] = {
      base: 0.85 + strength * 0.90,       // pace scalar
      wobble: 0.6 + Math.random() * 0.6,
      phase: Math.random() * Math.PI * 2,
    };
  });

  return new Promise((resolve) => {
    const start = performance.now();
    let last = start;

    function frame(now) {
      const t = (now - start) / durationMs;   // 0..1
      const done = t >= 1;

      const dtMs = Math.max(0, now - last);
      last = now;

      // Convert dt into seconds for rate-based integration
      const dt = dtMs / 1000;

      race.horses.forEach(h => {
        const id = h.id;
        const s = stride[id];

        // cadence-based stride (visual flavor)
        const cadence = Math.sin((t * 10.0) + s.phase) * 0.5 + 0.5; // 0..1
        const noise = (Math.random() - 0.5) * 0.02 * s.wobble;      // small per-second noise

        // Late kick
        const kick = t > 0.70 ? (1 + (1 - ((rank[id] ?? (n - 1)) / (n - 1))) * 0.25) : 1;

        // Base rate: tuned so average horse finishes around 1.0 by end
        const rate = (0.95 * s.base + 0.18 * biasOf(id)) * kick;

        // integrate
        prog[id] = clamp(prog[id] + (rate + noise) * dt * 0.18, 0, 1.3);

        // Add small cadence bump
        prog[id] = clamp(prog[id] + cadence * dt * 0.01, 0, 1.3);
      });

      if (t > 0.85) {
        const targets = makeFinishTargets(race.finishOrder);
        race.finishOrder.forEach((h, i) => {
          const id = h.id;
          prog[id] = lerp(prog[id], targets[i], 0.12);
        });
      }

      horses.forEach(el => {
        const id = el.dataset.id;
        const x = clamp01(prog[id]) * maxX;
        el.style.transform = `translateX(${x}px)`;
      });

      if (!done) {
        requestAnimationFrame(frame);
      } else {
        const finalTargets = makeFinishTargets(race.finishOrder);
        race.finishOrder.forEach((h, i) => {
          const el = byId[h.id];
          if (!el) return;
          el.style.transform = `translateX(${finalTargets[i] * maxX}px)`;
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
