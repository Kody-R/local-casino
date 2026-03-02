import { tickets } from "./scratch.tickets.js";
import { generateTicket, buildSymbolMultFromTheme } from "./scratch.engine.js";
import { THEMES } from "../slots/slots.themes.js"; // adjust path if needed

function getScratchPercent(ctx, w, h) {
  const step = 6;
  const img = ctx.getImageData(0, 0, w, h).data;
  let total = 0;
  let cleared = 0;

  for (let y = 0; y < h; y += step) {
    for (let x = 0; x < w; x += step) {
      const idx = (y * w + x) * 4 + 3;
      total++;
      if (img[idx] === 0) cleared++;
    }
  }
  return total ? cleared / total : 0;
}

export function mountScratch(container, store) {
  container.innerHTML = `
    <div class="scratch-wrap">
      <div class="scratch-top">
        <div>
          <h2>Scratch-Offs</h2>
          <div class="scratch-subtitle" id="scratchSub">Pick a ticket.</div>
        </div>
        <div class="rowTight">
          <select id="scratchTicket"></select>
          <button id="buyTicket">Buy</button>
          <button id="revealTicket" class="ok" disabled>Reveal</button>
        </div>
      </div>

      <div class="scratch-board" id="scratchBoard">
  <div class="scratch-head">
    <div class="scratch-theme" id="scratchTheme">🎟️ Ticket</div>
    <div class="scratch-hint" id="scratchHint">Scratch to reveal</div>
  </div>

  <div class="scratch-surface" id="scratchSurface">
    <div id="scratchBody"></div>
    <canvas class="scratch-canvas" id="scratchCanvas"></canvas>
  </div>
</div>

      <div class="scratch-msg" id="scratchMsg"></div>
    </div>
  `;

  const sel = container.querySelector("#scratchTicket");
  const btnBuy = container.querySelector("#buyTicket");
  const btnReveal = container.querySelector("#revealTicket");
  const boardEl = container.querySelector("#scratchBoard");
  const surfaceEl = container.querySelector("#scratchSurface");
  const themeEl = container.querySelector("#scratchTheme");
  const subEl = container.querySelector("#scratchSub");
  const bodyEl = container.querySelector("#scratchBody");
  const msgEl = container.querySelector("#scratchMsg");
  const canvas = container.querySelector("#scratchCanvas");
  const ctx = canvas.getContext("2d");

  for (const t of tickets) {
    const opt = document.createElement("option");
    opt.value = t.id;
    opt.textContent = `${t.themeLabel} — ${t.name} (${t.price})`;
    sel.appendChild(opt);
  }

  let active = null; // { roundId, ticketDef, gen, settled }

  function setTheme(ticketDef) {
    themeEl.textContent = ticketDef.themeLabel ?? "🎟️ Ticket";
    boardEl.dataset.theme = ticketDef.themeKey || "";
    subEl.textContent = ticketDef.subtitle || "";

    const theme = THEMES[ticketDef.slotThemeKey];
    const accent = theme?.accent || "#cfa04a";

    // Apply CSS variable
    boardEl.style.setProperty("--scratch-accent", accent);
  }

  function renderMatch3Legend(ticketDef) {
    const wild = ticketDef.wildIcon || "🃏";
    const jp = ticketDef.jackpotIcon || "🏆";

    // Build the same multiplier map used by the engine
    const multMap = buildSymbolMultFromTheme(
      ticketDef.slotThemeKey || ticketDef.themeKey,
    );

    // Pull the icon pool so we only show relevant symbols
    // (engine also uses iconPoolForTicket, but UI can just use multMap keys)
    const entries = Object.entries(multMap)
      .map(([icon, mult]) => ({ icon, mult: Number(mult) || 1 }))
      .filter((x) => x.mult > 1)
      .sort((a, b) => b.mult - a.mult)
      .slice(0, 5); // show top 5 boosted symbols

    const pills = entries.length
      ? entries
          .map(
            (e) => `
        <span class="scratch-legendPill">
          <span class="scratch-legendIcon">${e.icon}</span>
          <span class="scratch-legendText">×${e.mult}</span>
        </span>
      `,
          )
          .join("")
      : `<span class="scratch-legendPill dim">No symbol boosts</span>`;

    return `
    <div class="scratch-legend">
      <div class="scratch-legendLeft">
        ${pills}
      </div>
      <div class="scratch-legendRight">
        <span class="scratch-legendPill special"><span class="scratch-legendIcon">${wild}</span><span class="scratch-legendText">WILD</span></span>
        <span class="scratch-legendPill special"><span class="scratch-legendIcon">${jp}</span><span class="scratch-legendText">JACKPOT</span></span>
      </div>
    </div>
  `;
  }

  function resizeCanvasAndCover() {
    const rect = surfaceEl.getBoundingClientRect();
    const dpr = Math.max(1, window.devicePixelRatio || 1);

    canvas.width = Math.floor(rect.width * dpr);
    canvas.height = Math.floor(rect.height * dpr);
    canvas.style.width = `${rect.width}px`;
    canvas.style.height = `${rect.height}px`;

    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    const w = rect.width;
    const h = rect.height;

    ctx.globalCompositeOperation = "source-over";

    // darker cleaner scratch surface
    ctx.fillStyle = "rgba(130,130,130,0.94)";
    ctx.fillRect(0, 0, w, h);

    // light texture
    ctx.fillStyle = "rgba(255,255,255,0.06)";
    for (let i = 0; i < 700; i++) {
      ctx.fillRect(Math.random() * w, Math.random() * h, 1, 1);
    }

    canvas.style.opacity = "1";
    canvas.style.pointerEvents = "auto";
  }

  function setBoardState(kind) {
    boardEl.classList.remove("win", "lose");
    if (kind) boardEl.classList.add(kind);
  }

  function setScratchingEnabled(on) {
    canvas.style.pointerEvents = on ? "auto" : "none";
  }

  function revealAll() {
    ctx.globalCompositeOperation = "destination-out";
    const rect = surfaceEl.getBoundingClientRect();
    ctx.globalCompositeOperation = "destination-out";
    ctx.fillRect(0, 0, rect.width, rect.height);

    canvas.style.transition = "opacity 180ms ease";
    canvas.style.opacity = "0";

    setTimeout(() => {
      canvas.style.pointerEvents = "none";
    }, 180);
  }

  function highlightMatch3Wins() {
    if (!active || active.gen?.kind !== "match3") return;

    // clear old
    bodyEl
      .querySelectorAll(".scratch-cell.match-win")
      .forEach((el) => el.classList.remove("match-win"));

    const sets = active.gen.winSets || [];
    sets.flat().forEach((i) => {
      const el = bodyEl.querySelector(`.scratch-cell[data-i="${i}"]`);
      if (el) el.classList.add("match-win");
    });
  }

  function renderTicketBody(ticketDef, gen) {
    boardEl.classList.remove("lucky-ticket");
    // Match-3: 3×3 board of amounts
    if (gen.kind === "match3") {
      const wild = ticketDef.wildIcon || "🃏";
      const jp = ticketDef.jackpotIcon || "🏆";

      bodyEl.innerHTML = `
      ${renderMatch3Legend(ticketDef)}
      <div class="scratch-grid">
        ${gen.boardIcons
          .map(
            (icon, i) => `
              <div class="scratch-cell scratch-iconCell" data-i="${i}">
                <div class="scratch-icon ${icon === wild ? "wild" : ""} ${icon === jp ? "jackpot" : ""}">${icon}</div>
              </div>
            `,
          )
          .join("")}
      </div>
    `;
      return;
    }

    // Lucky numbers: Winning strip + Your Numbers strip
    if (gen.kind === "lucky") {
      boardEl.classList.add("lucky-ticket");
      const win = gen.winning
        .map((n) => `<div class="scratch-num">${n}</div>`)
        .join("");
      const your = gen.your
        .map(
          (n, i) =>
            `<div class="scratch-num ${gen.hitIdxs.includes(i) ? "hit" : ""}">${n}</div>`,
        )
        .join("");

      bodyEl.innerHTML = `
        <div class="scratch-luckyGrid">
          <div class="scratch-strip">
            <div class="scratch-stripTitle">Winning Numbers</div>
            <div class="scratch-numRow">${win}</div>
          </div>
          <div class="scratch-strip">
            <div class="scratch-stripTitle">Your Numbers</div>
            <div class="scratch-numRow">${your}</div>
          </div>
        </div>
      `;
      return;
    }

    bodyEl.innerHTML = `<div class="help">Unknown ticket kind.</div>`;
  }

  async function settleOnce() {
    if (!active || active.settled) return;
    active.settled = true;

    const { roundId, ticketDef, gen } = active;

    setBoardState(gen.winAmount > 0 ? "win" : "lose");
    highlightMatch3Wins();

    const fmt = new Intl.NumberFormat().format(gen.winAmount);

    if (gen.kind === "lucky") {
      msgEl.textContent =
        gen.winAmount > 0
          ? `WIN! ${gen.matches} match(es) — pays ${fmt}.`
          : "No matches this time.";
    } else if (gen.kind === "match3") {
      if (gen.isJackpot) {
        msgEl.textContent = `🏆 JACKPOT! Pays ${fmt}.`;
      } else if (gen.winAmount > 0) {
        msgEl.textContent =
          gen.match3Mode === "perSet"
            ? `WIN! ${gen.setCount} set(s) pays ${fmt}.`
            : `WIN! Match-3 pays ${fmt}.`;
      } else {
        msgEl.textContent = "No match-3 this time.";
      }
    }

    await store.settle(
      roundId,
      ticketDef.id,
      gen.winAmount > 0 ? "WIN" : "LOSE",
      gen.winAmount,
      0,
    );
    await store.closeRound(roundId);
    await store.uiRefresh();

    btnReveal.disabled = true;
    setScratchingEnabled(false);
  }

  // Scratch interaction
  let isDown = false;

  function scratchAt(clientX, clientY) {
    if (!active || active.settled) return;

    const rect = canvas.getBoundingClientRect();
    const x = clientX - rect.left;
    const y = clientY - rect.top;

    ctx.globalCompositeOperation = "destination-out";
    ctx.beginPath();
    ctx.arc(x, y, 20, 0, Math.PI * 2);
    ctx.fill();

    const pct = getScratchPercent(ctx, canvas.width, canvas.height);
    if (pct >= 0.6) {
      revealAll();
      settleOnce();
    }
  }

  canvas.addEventListener("mousedown", (e) => {
    isDown = true;
    scratchAt(e.clientX, e.clientY);
  });
  window.addEventListener("mouseup", () => (isDown = false));
  canvas.addEventListener("mousemove", (e) => {
    if (!isDown) return;
    scratchAt(e.clientX, e.clientY);
  });

  canvas.addEventListener(
    "touchstart",
    (e) => {
      isDown = true;
      const t = e.touches[0];
      scratchAt(t.clientX, t.clientY);
      e.preventDefault();
    },
    { passive: false },
  );
  canvas.addEventListener(
    "touchmove",
    (e) => {
      if (!isDown) return;
      const t = e.touches[0];
      scratchAt(t.clientX, t.clientY);
      e.preventDefault();
    },
    { passive: false },
  );
  window.addEventListener("touchend", () => (isDown = false));

  btnReveal.addEventListener("click", async () => {
    if (!active || active.settled) return;
    revealAll();
    await settleOnce();
  });

  // Ticket selection preview (theme/subtitle)
  function previewSelected() {
    if (!ticketDef) return;
    setTheme(ticketDef);
  }
  sel.addEventListener("change", previewSelected);
  previewSelected();

  // Buy ticket
  btnBuy.addEventListener("click", async () => {
    try {
      const ticketDef = tickets.find((t) => t.id === sel.value);

      const round = await store.startRound("SCRATCH");
      await store.placeBet(round.id, ticketDef.id, ticketDef.price);

      const gen = generateTicket(ticketDef);
      active = { roundId: round.id, ticketDef, gen, settled: false };

      setTheme(ticketDef);
      renderTicketBody(ticketDef, gen);

      msgEl.textContent = "Scratch to reveal — auto-reveals at ~60% scratched.";
      setBoardState(null);
      btnReveal.disabled = false;

      resizeCanvasAndCover();
      setScratchingEnabled(true);
    } catch (e) {
      alert(e.message);
    }
  });

  // Start state
  msgEl.textContent = "Buy a ticket to start.";
  setScratchingEnabled(false);

  window.addEventListener("resize", () => {
    if (active && !active.settled) resizeCanvasAndCover();
  });
}
