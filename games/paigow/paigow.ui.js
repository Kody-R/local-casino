// games/paigow/paigow.ui.js
import { renderCards } from "../../core/cards.js";
import {
  newPaiGowState,
  dealPaiGow,
  settlePaiGow,
  canSetHands,
  validatePlayerHands,
  buildPlayerHands,
  autoSetPlayerHouseWay,
} from "./paigow.engine.js";
import { PAIGOW_PAYOUTS } from "./paigow.payouts.js";

function fmt(n) {
  return new Intl.NumberFormat().format(n);
}

export function mountPaiGow(mountEl, store) {
  mountEl.innerHTML = `
    <h2>Pai Gow Poker</h2>
    <p class="help">Set 7 cards into HIGH (5) and LOW (2). Win both to win; lose both to lose; otherwise push. Ties go to dealer.</p>

    <div class="row">
      <input id="pg_main" type="number" min="1" step="1" placeholder="Main bet" />
      <input id="pg_fortune" type="number" min="0" step="1" placeholder="Fortune (optional)" />
      <button id="pg_deal" class="primary">Deal</button>
      <button id="pg_autoset" disabled>Auto-Set</button>
      <button id="pg_settle" disabled>Settle</button>
      <button id="pg_clear" disabled>Clear</button>
      <button id="pg_mode" disabled>Mode: HIGH</button>
    </div>

    <details class="settings">
      <summary>Fortune Paytable</summary>
      <div class="mono" style="white-space:pre-wrap;margin-top:8px;">
${PAIGOW_PAYOUTS.FORTUNE.map(([k, p]) => `${k.padEnd(6)}  ${p}:1`).join("\n")}
      </div>
    </details>

    <div class="table">
      <div class="hand">
        <div class="handTitle">Your 7 Cards (click to assign)</div>
        <div id="pg_player7" class="cards"></div>
        <div class="muted" id="pg_hint">—</div>
      </div>

      <div class="hand">
        <div class="handTitle">Dealer 7 (house way)</div>
        <div class="pgSplitWrap">
          <div id="pg_dealer7" class="cards"></div>
          <div id="pg_splitOverlay" class="pgSplitOverlay"></div>
        </div>
        <div class="muted" id="pg_dset">—</div>
      </div>
    </div>

    <div class="table">
      <div class="hand">
        <div class="handTitle">Your HIGH (5)</div>
        <div id="pg_ph" class="cards"></div>
      </div>
      <div class="hand">
        <div class="handTitle">Your LOW (2)</div>
        <div id="pg_pl" class="cards"></div>
      </div>
      <div class="hand">
        <div class="handTitle">Dealer HIGH / LOW</div>
        <div class="muted">HIGH</div>
        <div id="pg_dh" class="cards"></div>
        <div class="muted" style="margin-top:6px;">LOW</div>
        <div id="pg_dl" class="cards"></div>
      </div>
    </div>

    <div class="resultBox">
      <div class="label">Result</div>
      <div id="pg_result" class="value">—</div>
      <div id="pg_detail" class="muted">—</div>
    </div>
  `;

  const el = {
    main: mountEl.querySelector("#pg_main"),
    fortune: mountEl.querySelector("#pg_fortune"),
    deal: mountEl.querySelector("#pg_deal"),
    autoset: mountEl.querySelector("#pg_autoset"),
    settle: mountEl.querySelector("#pg_settle"),
    clear: mountEl.querySelector("#pg_clear"),
    modeBtn: mountEl.querySelector("#pg_mode"),

    player7: mountEl.querySelector("#pg_player7"),
    dealer7: mountEl.querySelector("#pg_dealer7"),
    dset: mountEl.querySelector("#pg_dset"),
    ph: mountEl.querySelector("#pg_ph"),
    pl: mountEl.querySelector("#pg_pl"),
    dh: mountEl.querySelector("#pg_dh"),
    dl: mountEl.querySelector("#pg_dl"),

    hint: mountEl.querySelector("#pg_hint"),
    result: mountEl.querySelector("#pg_result"),
    detail: mountEl.querySelector("#pg_detail"),

    splitOverlay: mountEl.querySelector("#pg_splitOverlay"),
  };

  let state = newPaiGowState();
  let round = null;
  let betMain = 0;
  let betFortune = 0;
  let mode = "HIGH";

  function setButtons() {
    const setting = state.phase === "SETTING";
    el.modeBtn.disabled = !setting;
    el.clear.disabled = !setting;
    el.autoset.disabled = !setting;

    el.settle.disabled = !(
      setting &&
      canSetHands(state) &&
      validatePlayerHands(state).ok
    );

    el.modeBtn.textContent = `Mode: ${mode}`;
  }

  function renderHands() {
    const { hi, lo } = buildPlayerHands(state);
    el.ph.innerHTML = "";
    el.pl.innerHTML = "";
    if (hi.length) renderCards(el.ph, hi, false);
    if (lo.length) renderCards(el.pl, lo, false);

    // dealer view
    el.dh.innerHTML = "";
    el.dl.innerHTML = "";
    if (state.dealerHigh.length) renderCards(el.dh, state.dealerHigh, false);
    if (state.dealerLow.length) renderCards(el.dl, state.dealerLow, false);
  }

  async function animateDealerSplit() {
    // Need dealer7 rendered already + dealerHigh/dealerLow determined
    if (
      !state.dealer7?.length ||
      !state.dealerHigh?.length ||
      !state.dealerLow?.length
    )
      return;

    const srcWrap = el.dealer7.closest(".pgSplitWrap");
    const overlay = el.splitOverlay;
    if (!srcWrap || !overlay) return;

    // ensure dealer high/low are rendered (targets exist)
    renderHands();

    // source card nodes (the .pokerCard divs rendered inside pg_dealer7)
    const srcCards = Array.from(el.dealer7.querySelectorAll(".pokerCard"));
    if (srcCards.length !== 7) return;

    // Build a map from dealer7 card object -> index in dealer7
    // dealerHigh/dealerLow contain the same object refs from dealer7 (engine-side)
    const idxMap = new Map();
    state.dealer7.forEach((c, i) => idxMap.set(c, i));

    const hiIdx = new Set(state.dealerHigh.map((c) => idxMap.get(c)));
    const loIdx = new Set(state.dealerLow.map((c) => idxMap.get(c)));

    // target stacks: positions of "slots" where cards should land
    const dhCards = Array.from(el.dh.querySelectorAll(".pokerCard"));
    const dlCards = Array.from(el.dl.querySelectorAll(".pokerCard"));

    // If you render dealerHigh/dealerLow with renderCards, you’ll get correct counts:
    if (dhCards.length !== 5 || dlCards.length !== 2) return;

    const srcWrapRect = srcWrap.getBoundingClientRect();
    overlay.innerHTML = ""; // clear old ghosts

    // Create ghost clones positioned over the source cards
    const ghosts = srcCards.map((node, i) => {
      const r = node.getBoundingClientRect();
      const ghost = document.createElement("div");
      ghost.className = "pgGhostCard";
      ghost.style.left = `${r.left - srcWrapRect.left}px`;
      ghost.style.top = `${r.top - srcWrapRect.top}px`;
      ghost.style.width = `${r.width}px`;
      ghost.style.height = `${r.height}px`;

      // clone the card element
      const clone = node.cloneNode(true);
      ghost.appendChild(clone);
      overlay.appendChild(ghost);
      return { ghost, i, startRect: r };
    });

    // hide original dealer7 cards during animation (we’ll reveal split hands at end)
    el.dealer7.style.visibility = "hidden";
    el.dh.style.visibility = "hidden";
    el.dl.style.visibility = "hidden";

    // Compute destination rect for each card (to DH or DL)
    // Preserve hand order as currently rendered in DH/DL
    const hiOrder = state.dealerHigh.map((c) => idxMap.get(c));
    const loOrder = state.dealerLow.map((c) => idxMap.get(c));

    function destRectFor(idx) {
      const where = hiIdx.has(idx) ? "HI" : "LO";
      if (where === "HI") {
        const pos = hiOrder.indexOf(idx);
        return dhCards[pos].getBoundingClientRect();
      } else {
        const pos = loOrder.indexOf(idx);
        return dlCards[pos].getBoundingClientRect();
      }
    }

    const animations = ghosts.map(({ ghost, i, startRect }) => {
      const endRect = destRectFor(i);
      const dx = endRect.left - startRect.left;
      const dy = endRect.top - startRect.top;

      const isHigh = hiIdx.has(i);

      return ghost.animate(
        [
          { transform: "translate3d(0px, 0px, 0px)", opacity: 1 },
          {
            transform: `translate3d(${dx}px, ${dy}px, 0px) rotate(${isHigh ? -2 : 2}deg)`,
            opacity: 1,
          },
        ],
        {
          duration: 700,
          easing: "cubic-bezier(.12,.8,.12,1)",
          fill: "forwards",
          delay: i * 35,
        },
      ).finished;
    });

    await Promise.allSettled(animations);

    // reveal the final split hands, remove ghosts
    overlay.innerHTML = "";
    el.dh.style.visibility = "visible";
    el.dl.style.visibility = "visible";
    // optionally reveal dealer7 again; but most tables keep split view, so keep hidden:
    // el.dealer7.style.visibility = "visible";
  }

  function renderPlayer7() {
    el.player7.innerHTML = "";

    state.player7.forEach((c, idx) => {
      const wrap = document.createElement("div");
      wrap.style.display = "inline-block";

      const tmp = document.createElement("div");
      renderCards(tmp, [c], false);
      const cardEl = tmp.firstChild;

      // High selection = .hi ; Low selection = .dim (you already have these styles)
      if (state.playerHighIdx.has(idx)) cardEl.classList.add("hi");
      if (state.playerLowIdx.has(idx)) cardEl.classList.add("dim");

      cardEl.addEventListener("click", () => {
        if (state.phase !== "SETTING") return;

        const hi = state.playerHighIdx;
        const lo = state.playerLowIdx;

        // toggle off
        if (hi.has(idx)) hi.delete(idx);
        else if (lo.has(idx)) lo.delete(idx);
        else {
          if (mode === "HIGH" && hi.size < 5) hi.add(idx);
          else if (mode === "LOW" && lo.size < 2) lo.add(idx);
          else if (hi.size < 5) hi.add(idx);
          else if (lo.size < 2) lo.add(idx);
        }

        // auto mode switch
        if (hi.size === 5 && lo.size < 2) mode = "LOW";
        if (lo.size === 2 && hi.size < 5) mode = "HIGH";

        updateUI();
      });

      wrap.appendChild(cardEl);
      el.player7.appendChild(wrap);
    });
  }

  function updateHint() {
    const v = validatePlayerHands(state);
    el.hint.textContent = `High ${state.playerHighIdx.size}/5 • Low ${state.playerLowIdx.size}/2 • ${v.ok ? "OK" : v.msg}`;
  }

  function updateDealerPanel() {
    el.dealer7.innerHTML = "";
    if (state.dealer7.length) renderCards(el.dealer7, state.dealer7, false);
    el.dset.textContent = state.dealerHigh.length
      ? `Dealer set: HIGH(5) + LOW(2) using House Way`
      : "—";
  }

  function updateUI() {
    renderPlayer7();
    renderHands();
    updateHint();
    setButtons();
    updateDealerPanel();
  }

  async function onDeal() {
    try {
      if (!store.currentPlayerId) throw new Error("Select a player first.");

      betMain = Math.floor(Number(el.main.value));
      betFortune = Math.floor(Number(el.fortune.value || 0));

      if (!Number.isFinite(betMain) || betMain <= 0)
        throw new Error("Enter a valid Main bet.");
      if (!Number.isFinite(betFortune) || betFortune < 0)
        throw new Error("Fortune must be 0 or more.");

      round = await store.startRound("PAIGOW");
      await store.placeBet(round.id, "MAIN", betMain);
      if (betFortune > 0) await store.placeBet(round.id, "FORTUNE", betFortune);

      state = newPaiGowState();
      dealPaiGow(state, betMain, betFortune);

      mode = "HIGH";
      el.result.textContent = "SET YOUR HANDS";
      el.detail.textContent =
        "Click cards to assign 5 HIGH and 2 LOW (or press Auto-Set).";

      updateUI();
      await animateDealerSplit();
    } catch (e) {
      alert(e.message);
    }
  }

  function onAutoSet() {
    if (state.phase !== "SETTING") return;
    autoSetPlayerHouseWay(state);
    mode = "HIGH";
    updateUI();
  }

  function onClear() {
    if (state.phase !== "SETTING") return;
    state.playerHighIdx.clear();
    state.playerLowIdx.clear();
    mode = "HIGH";
    updateUI();
  }

  async function onSettle() {
    try {
      if (!round) return;

      const res = settlePaiGow(state);

      // MAIN settlement
      if (res.outcome === "WIN") {
        const profit = Math.floor(
          betMain * (1 - (PAIGOW_PAYOUTS.MAIN.commission || 0)),
        );
        await store.settle(round.id, "MAIN", "WIN", profit, 0);
      } else if (res.outcome === "LOSE") {
        await store.settle(round.id, "MAIN", "LOSE", 0, 0);
      } else {
        await store.settle(round.id, "MAIN", "PUSH", 0, betMain);
      }

      // FORTUNE settlement (independent)
      if (betFortune > 0) {
        const pays = res.fortune?.pays || 0;
        if (pays > 0)
          await store.settle(round.id, "FORTUNE", "WIN", betFortune * pays, 0);
        else await store.settle(round.id, "FORTUNE", "LOSE", 0, 0);
      }

      await store.closeRound(round.id);
      await store.uiRefresh?.();

      // UI summary
      const hiText = res.hiCmpRaw === 1 ? "WIN" : "LOSE/TIE";
      const loText = res.loCmpRaw === 1 ? "WIN" : "LOSE/TIE";
      const fText =
        betFortune > 0
          ? res.fortune?.pays
            ? `Fortune ${res.fortune.key} ${res.fortune.pays}:1`
            : "Fortune: No pay"
          : "Fortune: —";

      el.result.textContent = res.outcome;
      el.detail.textContent = `High: ${hiText} • Low: ${loText} (ties go to dealer). ${fText}.`;

      round = null;
      state.phase = "DONE";
      setButtons();
    } catch (e) {
      alert(e.message);
    }
  }

  el.deal.addEventListener("click", onDeal);
  el.autoset.addEventListener("click", onAutoSet);
  el.clear.addEventListener("click", onClear);
  el.settle.addEventListener("click", onSettle);
  el.modeBtn.addEventListener("click", () => {
    mode = mode === "HIGH" ? "LOW" : "HIGH";
    setButtons();
  });

  setButtons();
}
