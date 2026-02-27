// games/slots/slots.ui.js
import { THEMES, THEME_KEYS } from "./slots.themes.js";
import { spinSlots, startHoldSpin, holdSpinStep } from "./slots.engine.js";


const DEFAULT_ICONS = {
  W:"⭐", A:"A", K:"K", Q:"Q", J:"J", T:"10",
  S:"🟢", B:"🎁", C:"🪙",
  MJ:"🎟️", MR:"💠", MJ2:"👑"
};

function iconFor(theme, sym) {
  return (theme?.icons && theme.icons[sym]) ?? DEFAULT_ICONS[sym] ?? sym;
}



export function mountSlots(mountEl, store) {
  mountEl.innerHTML = `
    <h2>Slots</h2>
    <p class="help">3x5 slots with paylines, free spins (scatters), and pick bonus.</p>

    <div class="row" id="sl_jpbar" style="margin-top:8px;"></div>

    <div class="slotsTop row">
      <label class="muted">Lines
        <select id="sl_lines">
          ${[1,3,5,7,10].map(n => `<option value="${n}">${n}</option>`).join("")}
        </select>
      </label>

      <label class="muted">Bet/Line
        <select id="sl_bpl">
          ${[1,2,5,10,25].map(n => `<option value="${n}">${n}</option>`).join("")}
        </select>
      </label>

      <label class="muted">Machine
        <select id="sl_theme">
          ${THEME_KEYS.map(k => `<option value="${k}">${THEMES[k].name}</option>`).join("")}
        </select>
      </label>


      <button id="sl_spin" class="ok">SPIN</button>


      <div class="muted" id="sl_bank">—</div>
    </div>

    <div class="slotsStage">
      <div class="reel themeAccentBorder" data-reel="0"><div class="strip"></div></div>
      <div class="reel themeAccentBorder" data-reel="1"><div class="strip"></div></div>
      <div class="reel themeAccentBorder" data-reel="2"><div class="strip"></div></div>
      <div class="reel themeAccentBorder" data-reel="3"><div class="strip"></div></div>
      <div class="reel themeAccentBorder" data-reel="4"><div class="strip"></div></div>
      <div class="paylineGlow"></div>
    </div>

    <div class="card" style="margin-top:12px;">
      <div class="row" style="justify-content:space-between;">
        <div>
          <div class="label">Wins</div>
          <div id="sl_winSummary" class="muted">—</div>
        </div>
        <button id="sl_clearHL" class="ghost">Clear</button>
      </div>
      <div id="sl_winList" class="winList"></div>
    </div>


    <div class="resultBox">
      <div class="label">Result</div>
      <div id="sl_result" class="value">—</div>
      <div id="sl_detail" class="muted">—</div>
    </div>

   <details class="settings" open>
     <summary>Rules / Hints</summary>
     <div class="help" id="sl_rules"></div>
   </details>


    <div id="sl_overlay" class="slotOverlay hidden">
      <div class="overlayCard">
        <div id="sl_overlay_title" class="value">Bonus</div>
        <div id="sl_overlay_body" class="muted" style="margin-top:8px;"></div>
        <div id="sl_overlay_actions" class="row" style="margin-top:12px;"></div>
      </div>
    </div>
  `;

  const el = {
    lines: mountEl.querySelector("#sl_lines"),
    bpl: mountEl.querySelector("#sl_bpl"),
    spin: mountEl.querySelector("#sl_spin"),
    bank: mountEl.querySelector("#sl_bank"),
    result: mountEl.querySelector("#sl_result"),
    detail: mountEl.querySelector("#sl_detail"),
    reels: Array.from(mountEl.querySelectorAll(".slotsStage .reel")),
    overlay: mountEl.querySelector("#sl_overlay"),
    ovTitle: mountEl.querySelector("#sl_overlay_title"),
    ovBody: mountEl.querySelector("#sl_overlay_body"),
    ovActions: mountEl.querySelector("#sl_overlay_actions"),
    theme: mountEl.querySelector("#sl_theme"),
    jpbar: mountEl.querySelector("#sl_jpbar"),
    winSummary: mountEl.querySelector("#sl_winSummary"),
    winList: mountEl.querySelector("#sl_winList"),
    btnClearHL: mountEl.querySelector("#sl_clearHL"),
    rules: mountEl.querySelector("#sl_rules"),
  };

  
  let coinMeter = 0;
  el.theme.addEventListener("change", async () => {
  frozenState = null;
  const themeKey = el.theme.value;
  const theme = THEMES[themeKey];
  applyTheme(mountEl, theme);
  mountEl.classList.toggle("noLabels", theme.showLabels === false);
  renderStatic(el.reels, THEMES[el.theme.value]);
  clearHighlights(mountEl);
  renderRules(el, theme);
  rebuildLinesSelect(el.lines, theme);


  // refresh meters to the selected theme
  const progCfg = theme.bonus?.holdSpin?.progressive;
  if (progCfg) {
    const jp = await loadProgressives(store, themeKey, progCfg.seed);
    renderProgressives(el, jp);
  }
});

  el.btnClearHL.addEventListener("click", () => clearHighlights(mountEl));

  // medium realism: cascading reel stop delays
  const STOP_DELAYS = [0, 160, 320, 480, 640];

  let freeSpinsLeft = 0;
  let freeSpinTotal = 0;
  let lastBetSnapshot = null;
  let busy = false;
  let frozenState = null;   // Arctic Fortune persistent freeze

  // initial render
  renderStatic(el.reels, THEMES[el.theme.value]);
  renderRules(el, THEMES[el.theme.value]);
  rebuildLinesSelect(el.lines, THEMES[el.theme.value]);

  async function loadCoinMeter(store, themeKey) {
  return Number(await store.getSetting(`COIN_METER:${themeKey}`, 0)) || 0;
}

async function saveCoinMeter(store, themeKey, value) {
  await store.setSetting(`COIN_METER:${themeKey}`, value);
}


  async function refreshBank() {
    const pid = store.currentPlayerId;
    if (!pid) { el.bank.textContent = "Select player"; return; }
    const chips = await store.getChips(pid);
    el.bank.textContent = `Chips: ${chips}`;
  }

  function applyTheme(rootEl, theme) {
    rootEl.style.setProperty("--accent", theme.accent);
    rootEl.style.setProperty("--accent2", hexToRgba(theme.accent, 0.35));
  }
  
  function hexToRgba(hex, a) {
    const h = hex.replace("#", "").trim();
    const full = h.length === 3 ? h.split("").map(x => x + x).join("") : h;
    const n = parseInt(full, 16);
    const r = (n >> 16) & 255;
    const g = (n >> 8) & 255;
    const b = n & 255;
    return `rgba(${r},${g},${b},${a})`;
  }

  function clearHighlights(mountEl) {
  mountEl.querySelectorAll(".cell.winCell").forEach(x => x.classList.remove("winCell"));
  mountEl.querySelectorAll(".cell.scatterCell").forEach(x => x.classList.remove("scatterCell"));
  mountEl.querySelectorAll(".winBadge").forEach(x => x.remove());
}

function renderWinBreakdown(el, theme, res, bet) {
  const lines = bet.linesEnabled;
  const bpl = bet.betPerLine;


  const parts = [];
  if (res.lineWins.length) parts.push(`${res.lineWins.length} line win(s)`);
  if (res.scatterWin > 0) parts.push(`Scatter win ${res.scatterWin}`);
  if (res.triggers?.freeSpins) parts.push(`Free Spins x${res.triggers.freeSpinsAward}`);
  if (res.baseHoldTrig) parts.push(`Hold & Spin triggered`);

  el.winSummary.textContent = parts.length ? parts.join(" • ") : "No wins";

  el.winList.innerHTML = "";
  for (const w of res.lineWins) {
    const symName = theme.symbols[w.symbol]?.name ?? w.symbol;
    const div = document.createElement("div");
    div.className = "winRow";
    div.innerHTML = `
      <div class="mono">Line ${w.lineIndex + 1}</div>
      <div>${symName} ×${w.count}</div>
      <div class="mono">${w.win}</div>
    `;
    el.winList.appendChild(div);
  }

  if (res.scatterWin > 0) {
    const div = document.createElement("div");
    div.className = "winRow";
    div.innerHTML = `
      <div class="mono">Scatter</div>
      <div>${theme.symbols.S?.name ?? "Scatter"} ×${res.scatters}</div>
      <div class="mono">${res.scatterWin}</div>
    `;
    el.winList.appendChild(div);
  }
}

function renderRules(el, theme) {
  if (!el?.rules) return;

  const scatNeed = theme.bonus?.freeSpins?.scatterNeeded ?? 3;
  const fsAwards = theme.bonus?.freeSpins?.awards ?? {};
  const holdNeed = theme.bonus?.holdSpin?.triggerCoins ?? 6;

  // What counts as a "coin" for Hold&Spin
  const coinSyms = Object.keys(theme.symbols).filter(s =>
    theme.symbols[s]?.coin || theme.symbols[s]?.jackpot
  );

  const coinIcons = coinSyms.map(s => iconFor(theme, s)).join(" ");

  el.rules.innerHTML = `
    <div style="display:grid; gap:10px;">
      <div>
        <b>Free Spins:</b> land <b>${scatNeed}+</b> ${iconFor(theme, "S")} <i>Scatter</i> anywhere.
        ${Object.keys(fsAwards).length ? `Awards: ${Object.entries(fsAwards).map(([k,v])=>`${k}=${v}`).join(", ")}.` : ``}
      </div>

      <div>
        <b>Hold &amp; Spin:</b> land <b>${holdNeed}+</b> coin symbols anywhere:
        <span class="mono">${coinIcons}</span>
        (coins include jackpots).
      </div>

      <div class="muted">
        Tip: Higher lines/bet may slightly increase feature frequency depending on the machine settings.
      </div>
    </div>
  `;
}


function highlightWins(mountEl, theme, res) {
  clearHighlights(mountEl);

  // Line wins
  for (const w of res.lineWins) {
    const line = theme.paylines[w.lineIndex];
    for (let reel = 0; reel < w.count; reel++) {
      const row = line[reel];
      const cell = mountEl.querySelector(`.cell[data-row="${row}"][data-reel="${reel}"]`);
      if (cell) cell.classList.add("winCell");
    }

    if (res.frozenState?.mask[idx]) {
   cell.classList.add("frozenCell");
}

    // Badge on last contributing cell
    const lastReel = w.count - 1;
    const lastRow = line[lastReel];
    const anchor = mountEl.querySelector(`.cell[data-row="${lastRow}"][data-reel="${lastReel}"]`);
    if (anchor) {
      const badge = document.createElement("div");
      badge.className = "winBadge";
      badge.textContent = `Line ${w.lineIndex + 1}`;
      anchor.appendChild(badge);
    }
  }

const ROWS = theme.grid?.rows ?? theme.bonus?.holdSpin?.grid?.rows ?? res.grid.length;
const COLS = theme.grid?.cols ?? theme.bonus?.holdSpin?.grid?.cols ?? res.grid[0].length;

for (let r=0; r<ROWS; r++) for (let c=0; c<COLS; c++) {
  const sym = res.grid[r][c];
  if (theme.symbols[sym]?.scatter) {
    const cell = mountEl.querySelector(`.cell[data-row="${r}"][data-reel="${c}"]`);
    if (cell) cell.classList.add("scatterCell");
  }
}
}



  el.spin.addEventListener("click", async () => {
    if (busy) return;
    try {
      if (!store.currentPlayerId) throw new Error("Select a player first.");

      const linesEnabled = Number(el.lines.value);
      const betPerLine = Number(el.bpl.value);
      const totalBet = betPerLine * linesEnabled;
      const themeKey = el.theme.value;
      const theme = THEMES[themeKey];
      applyTheme(mountEl, theme);
      mountEl.classList.toggle("noLabels", theme.showLabels === false);

      // During free spins, we reuse the snapshot bet
      const useBet = freeSpinsLeft > 0 ? lastBetSnapshot : { linesEnabled, betPerLine };

      // 🔥 Effective bet (important for free spins)
      const effectiveTotalBet = useBet.betPerLine * useBet.linesEnabled;
          
      // Progressive bet scaling
      const progScaleCfg = theme.bonus?.holdSpin?.progressive?.betScale;
          
      let betMult = 1;
          
      if (progScaleCfg) {
        const base = progScaleCfg.baseTotalBet ?? 1;
        const max  = progScaleCfg.maxMult ?? 50;
      
        betMult = Math.max(1, Math.min(max, effectiveTotalBet / base));
      }

      // Load meters once per spin (simple + safe). You can cache later.
      const progCfg = theme.bonus?.holdSpin?.progressive;
      let jp = progCfg ? await loadProgressives(store, themeKey, progCfg.seed) : null;
      if (jp) renderProgressives(el, jp, betMult);



      if (jp && freeSpinsLeft === 0) {
        // add a % of totalBet into each pool
        jp.MINI  = Math.round(jp.MINI  + effectiveTotalBet * progCfg.rate.MINI);
        jp.MINOR = Math.round(jp.MINOR + effectiveTotalBet * progCfg.rate.MINOR);
        jp.MAJOR = Math.round(jp.MAJOR + effectiveTotalBet * progCfg.rate.MAJOR);
        await saveProgressives(store, themeKey, jp);
        renderProgressives(el, jp, betMult);
      }

      if (freeSpinsLeft === 0) {
        // store snapshot for free spins
        lastBetSnapshot = useBet;
      }

      // charge bet only if NOT a free spin
      const round = await store.startRound("SLOTS");
      if (freeSpinsLeft === 0) {
        await store.placeBet(round.id, `BET:${useBet.linesEnabled}L@${useBet.betPerLine}`, effectiveTotalBet);
      } else {
        await store.placeBet(round.id, `FREESPIN`, 0);
      }

      busy = true;
      el.spin.disabled = true;

      // spin result
      const res = spinSlots(theme, {
        ...useBet,
        prevFrozen: frozenState
      });
      frozenState = res.frozenState ?? null;
      const meterCfg = theme.bonus?.holdSpin?.meter;

      let holdSpinTriggered = false;
      
      if (meterCfg?.enabled) {
        coinMeter = await loadCoinMeter(store, themeKey);
        coinMeter += res.coinCount;
      
        if (coinMeter >= meterCfg.threshold) {
          holdSpinTriggered = true;
          coinMeter = 0; // reset meter
        }
      
        await saveCoinMeter(store, themeKey, coinMeter);
      }


      // animate reels to show res.grid
      await animateToGrid(el.reels, res.grid, STOP_DELAYS, theme);
      highlightWins(mountEl, theme, res);
      renderWinBreakdown(el, theme, res, useBet);



      // settle
      // totalWin is payout PROFIT; return stake concept handled via bet model. For slots we do profit-only.
      if (res.totalWin > 0) {
        await store.settle(round.id, "PAYOUT", "WIN", res.totalWin, 0);
      } else {
        await store.settle(round.id, "PAYOUT", "LOSE", 0, 0);
      }
      await store.closeRound(round.id);

      // UI result
      const bonusText =
        res.triggers?.holdSpin ? "Hold&Spin" :
        res.triggers?.pickBonus ? "Pick Bonus" :
        "—";

      const modeLabel = freeSpinsLeft > 0 ? `Free Spin (${freeSpinsLeft}/${freeSpinTotal})` : "Paid Spin";
      el.result.textContent = `${modeLabel} — Win: ${res.totalWin}`;
      el.detail.textContent =
        `${res.lineWins.length} line win(s), Scatters: ${res.scatters} (${res.scatterWin}). Bonus: ${bonusText}`;

      // handle triggers
      // handle triggers (support retrigger during free spins)
      if (res.triggers.freeSpins) {
  const add = res.triggers.freeSpinsAward || 0;
  if (add > 0) {
    if (freeSpinsLeft === 0) {
      freeSpinsLeft = add;
      freeSpinTotal = add;
    } else {
      freeSpinsLeft += add;
      freeSpinTotal += add;
    }

    const overlayOpen = !el.overlay.classList.contains("hidden");
    if (!overlayOpen) {
      showOverlay(el, "Free Spins Retrigger!", `+<b>${add}</b> free spins added.`, [
        { label: "OK", cls: "ok", onClick: () => hideOverlay(el) }
      ]);
    }
  }
}


      if (res.triggers.pickBonus) {
        // Run pick bonus (simple medium realism)
        await runPickBonus(el, store);
      }

      if (holdSpinTriggered || res.baseHoldTrig) {
        frozenState = null;  // bonus wipes frozen grid
        await runHoldSpinBonus(el, store, themeKey, theme, res.grid, betMult);
      }

      // decrement free spins after the spin resolves
      if (freeSpinsLeft > 0) {
        freeSpinsLeft--;
      
        if (freeSpinsLeft > 0) {
          const overlayOpen = !el.overlay.classList.contains("hidden");
          if (!overlayOpen) setTimeout(() => el.spin.click(), 650);
        } else {
        // ✅ reset session state so the next (non-consecutive) feature starts clean
        freeSpinTotal = 0;
        lastBetSnapshot = null;
              
        showOverlay(el, "Free Spins Complete", "Back to paid spins.", [
          { label:"OK", cls:"ok", onClick: () => hideOverlay(el) }
        ]);
      }
      }

      renderCoinMeter(el, coinMeter, meterCfg.threshold);
      await refreshBank();
    } catch (e) {
      alert(e.message);
    } finally {
      busy = false;
      el.spin.disabled = false;
    }
  });

  refreshBank();
}

async function runHoldSpinBonus(el, store, themeKey, theme, baseGrid, betMult = 1) {

  // Start bonus state
  let hs = startHoldSpin(theme, baseGrid);

  const progCfg = theme.bonus?.holdSpin?.progressive;
  let jp = progCfg ? await loadProgressives(store, themeKey, progCfg.seed) : null;
  if (jp) renderProgressives(el, jp, betMult);


  // Render loop with “medium realism” pacing
  const render = () => {
    const cells = [];
    for (let r=0;r<hs.rows;r++) {
      for (let c=0;c<hs.cols;c++) {
        const v = hs.board[r][c];
        const cls = v ? (v.kind === "JACKPOT" ? "hsJackpot" : "hsCoin") : "hsEmpty";
        const text = v
        ? (v.kind === "JACKPOT"
            ? v.label
            : Math.round((v.value ?? 0) * betMult))
        : "";
              cells.push(`<div class="hsCell ${cls}">${text}</div>`);
      }
    }

    el.ovTitle.textContent = "Hold & Spin";
    el.ovBody.innerHTML = `
      <div class="muted">Respins: <b>${hs.respinsLeft}</b> &nbsp; Locked: <b>${hs.locked}</b></div>
      <div class="hsGrid">${cells.join("")}</div>
      <div class="muted" style="margin-top:10px;">Collects when respins hit 0.</div>
    `;
    el.ovActions.innerHTML = "";
    el.overlay.classList.remove("hidden");
  };

  render();

  // Auto-advance steps until done
  while (!hs.done) {
    await sleep(750);
    hs = holdSpinStep(theme, hs);
    render();
  }

  let award = 0;
  let hit = { MINI:false, MINOR:false, MAJOR:false };
  
  for (let r=0;r<hs.rows;r++) for (let c=0;c<hs.cols;c++) {
    const v = hs.board[r][c];
    if (!v) continue;
  
   if (v.kind === "JACKPOT" && jp) {
    award += Math.round((jp[v.label] ?? 0) * betMult);
    hit[v.label] = true;
  } else {
    award += Math.round((v.value ?? 0) * betMult);
  }
  }

  if (jp && progCfg) {
    for (const k of ["MINI","MINOR","MAJOR"]) {
      if (hit[k]) {
        jp[k] = progCfg.seed[k];      // reset
        flashMeter(el, k);            // animate meter
      }
    }
    await saveProgressives(store, themeKey, jp);
    renderProgressives(el, jp, betMult);
  }

  el.ovBody.innerHTML += `<div class="value" style="margin-top:12px;">Bonus Win: ${award}</div>`;
  el.ovActions.innerHTML = "";

  const btn = document.createElement("button");
  btn.className = "ok";
  btn.textContent = "Collect";
  btn.addEventListener("click", async () => {
    const r = await store.startRound("SLOTS_HOLDSPIN");
    await store.placeBet(r.id, "HOLDSPIN", 0);
    await store.settle(r.id, "HOLDSPIN", "WIN", award, 0);
    await store.closeRound(r.id);
    await store.uiRefresh?.();
    el.overlay.classList.add("hidden");
  });
  el.ovActions.appendChild(btn);

  // Wait until overlay closes
  await waitOverlayClose(el.overlay);
}

function sleep(ms){ return new Promise(r => setTimeout(r, ms)); }
function waitOverlayClose(overlayEl) {
  return new Promise(resolve => {
    const t = setInterval(() => {
      if (overlayEl.classList.contains("hidden")) { clearInterval(t); resolve(); }
    }, 150);
  });
}

function rebuildLinesSelect(elLines, theme) {
  const max = theme.paylines?.length ?? 1;
  const current = Number(elLines.value || 1);

  elLines.innerHTML = "";
  for (let i = 1; i <= max; i++) {
    const opt = document.createElement("option");
    opt.value = String(i);
    opt.textContent = String(i);
    elLines.appendChild(opt);
  }

  elLines.value = String(Math.min(current, max));
}



/* ---------- visuals ---------- */

function renderStatic(reels, theme) {
  reels.forEach((reel, i) => {
    const strip = reel.querySelector(".strip");
    strip.innerHTML = makeStripHTML(["A","K","Q","J","T","S","B","W","A","K","Q"], theme, i);
    strip.style.transform = `translateY(-120px)`;
  });
}


function makeStripHTML(symbols, theme, reelIndex = null) {
  const ROWS = theme.grid?.rows ?? 3;

  return symbols.map((sym, idx) => {
    const meta = theme.symbols[sym] ?? { name: sym };
    const label = meta.jackpot ? meta.name : (meta.name ?? sym);

    const isFinalCell = (reelIndex !== null) && (idx >= symbols.length - ROWS);
    const row = isFinalCell ? (idx - (symbols.length - ROWS)) : null;

    const attrs = isFinalCell
      ? `data-row="${row}" data-reel="${reelIndex}" data-sym="${sym}"`
      : `data-sym="${sym}"`;

    return `
      <div class="cell" ${attrs}>
        <div class="symInner">${iconFor(theme, sym)}</div>
        ${theme.showLabels !== false ? `<div class="symName">${label}</div>` : ``}
      </div>
    `;
  }).join("");
}



async function animateToGrid(reels, grid, delays, theme) {
  const ROWS = theme.grid?.rows ?? 3;

  const stopPromises = reels.map((reel, r) => new Promise(resolve => {
    setTimeout(() => {
      const strip = reel.querySelector(".strip");

      const filler = [];
      const pool = Object.keys(theme.symbols).filter(s =>
        !theme.symbols[s]?.jackpot &&
        !theme.symbols[s]?.bonus
      );

      // spin filler
      for (let i = 0; i < 18; i++) {
        filler.push(pool[Math.floor(Math.random() * pool.length)]);
      }

      // 🔥 dynamically build final column
      const finalColumn = Array.from({ length: ROWS }, (_, row) => grid[row][r]);

      const finalSyms = filler.concat(finalColumn);

      strip.innerHTML = finalSyms.map((sym, idx) => {
        const isFinal = idx >= finalSyms.length - ROWS;
        const row = isFinal ? idx - (finalSyms.length - ROWS) : null;

        const attrs = isFinal
          ? `data-row="${row}" data-reel="${r}" data-sym="${sym}"`
          : `data-sym="${sym}"`;

        const meta = theme.symbols[sym] ?? { name: sym };
        const label = meta.jackpot ? meta.name : (meta.name ?? sym);

        return `
          <div class="cell" ${attrs}>
            <div class="symInner">${iconFor(theme, sym)}</div>
            ${theme.showLabels !== false ? `<div class="symName">${label}</div>` : ``}
          </div>
        `;
      }).join("");

      const symH = 60;
      const finalOffset = (finalSyms.length - ROWS) * symH;

      strip.style.transition = "none";
      strip.style.transform = "translateY(0px)";
      void strip.offsetWidth;

      strip.style.transition = "transform 1.25s cubic-bezier(.12,.8,.12,1)";
      strip.style.transform = `translateY(-${finalOffset}px)`;

      setTimeout(resolve, 1300);
    }, delays[r] ?? 0);
  }));

  await Promise.all(stopPromises);
}


/* ---------- overlays & bonus ---------- */

function showOverlay(el, title, bodyHTML, actions) {
  el.ovTitle.textContent = title;
  el.ovBody.innerHTML = bodyHTML;
  el.ovActions.innerHTML = "";
  actions.forEach(a => {
    const b = document.createElement("button");
    b.textContent = a.label;
    if (a.cls) b.className = a.cls;
    b.addEventListener("click", a.onClick);
    el.ovActions.appendChild(b);
  });
  el.overlay.classList.remove("hidden");
}

function hideOverlay(el) {
  el.overlay.classList.add("hidden");
}

async function runPickBonus(el, store) {
  // Medium realism pick bonus: 5 picks, reveal amounts, total added.
  const picks = 5;
  const pool = [5,10,15,20,25,30,40,50,75,100];
  let remaining = picks;
  let total = 0;

  const buttons = Array.from({length: 12}, () => pool[Math.floor(Math.random()*pool.length)]);
  let revealed = Array(12).fill(false);

  const render = () => {
    const grid = buttons.map((val, i) => {
      const label = revealed[i] ? `+${val}` : "PICK";
      return `<button class="pickTile ${revealed[i] ? "picked" : ""}" data-i="${i}" ${revealed[i] ? "disabled":""}>${label}</button>`;
    }).join("");

    showOverlay(el, "Pick Bonus", `Picks left: <b>${remaining}</b> &nbsp; Total: <b>${total}</b><div class="pickGrid">${grid}</div>`, [
      ...(remaining === 0 ? [{ label:"Collect", cls:"ok", onClick: async () => {
        // award to player via a roundless credit; simplest is start a mini round
        const r = await store.startRound("SLOTS_BONUS");
        await store.placeBet(r.id, "PICK_BONUS", 0);
        await store.settle(r.id, "PICK_BONUS", "WIN", total, 0);
        await store.closeRound(r.id);
        await store.uiRefresh?.();
        hideOverlay(el);
      }}] : [])
    ]);

    // wire picks
    el.overlay.querySelectorAll(".pickTile").forEach(btn => {
      btn.addEventListener("click", () => {
        const i = Number(btn.dataset.i);
        if (revealed[i] || remaining === 0) return;
        revealed[i] = true;
        remaining--;
        total += buttons[i];
        render();
      });
    });
  };

  render();

  // Wait until overlay closes by polling (simple)
  await new Promise(resolve => {
    const t = setInterval(() => {
      if (el.overlay.classList.contains("hidden")) { clearInterval(t); resolve(); }
    }, 200);
  });
}

async function loadProgressives(store, themeKey, seed) {
  const out = {};
  for (const k of ["MINI","MINOR","MAJOR"]) {
    const key = `JP:${themeKey}:${k}`;
    out[k] = Number(await store.getSetting(key, seed[k])) || seed[k];
  }
  return out;
}

async function saveProgressives(store, themeKey, jp) {
  for (const k of ["MINI","MINOR","MAJOR"]) {
    await store.setSetting(`JP:${themeKey}:${k}`, jp[k]);
  }
}

function renderProgressives(el, jp, mult = 1) {
  const fmt = (v) => Math.round(v * mult);

  el.jpbar.innerHTML = `
    <div class="jpMeter">
      <div class="jpPill" data-jp="MINI">MINI: ${fmt(jp.MINI)}</div>
      <div class="jpPill" data-jp="MINOR">MINOR: ${fmt(jp.MINOR)}</div>
      <div class="jpPill" data-jp="MAJOR">MAJOR: ${fmt(jp.MAJOR)}</div>
    </div>
  `;
}

function renderCoinMeter(el, value, threshold) {
  el.jpbar.innerHTML += `
    <div class="jpMeter">
      <div class="jpPill">Coin Meter: ${value} / ${threshold}</div>
    </div>
  `;
}


function flashMeter(el, which) {
  const pill = el.jpbar.querySelector(`.jpPill[data-jp="${which}"]`);
  if (!pill) return;
  pill.classList.remove("flash");
  void pill.offsetWidth;
  pill.classList.add("flash");
}

