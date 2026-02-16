// games/blackjackplus/blackjackplus.ui.js
import { renderCards, renderCardBack } from "../../core/cards.js";
import { dealBJRound, hit, stand, dealerPlay, settleBJ, canDouble, doubleDown, handTotals } from "./blackjackplus.engine.js";
import { loadBJPayouts, saveBJPayouts, payoutsTemplateHTML } from "./blackjackplus.payouts.js";

export function mountBlackjackPlus(mountEl, store) {
  mountEl.innerHTML = `
    <h2>Blackjack Plus</h2>
    <p class="help">Standard Blackjack with optional 3-card side bet (your two cards + dealer upcard).</p>

    <div class="row">
      <input id="bj_wager" type="number" min="1" step="1" placeholder="Main wager" />
      <input id="bj_side3" type="number" min="0" step="1" placeholder="3-card side bet (optional)" />
      <button id="bj_deal">Deal</button>
    </div>

    <div class="table">
      <div class="hand">
        <div class="handTitle">Player</div>
        <div id="bj_player" class="cards"></div>
        <div id="bj_ptotal" class="muted">—</div>
        <div id="bj_side3_result" class="muted">Side bet: —</div>
      </div>

      <div class="hand">
        <div class="handTitle">Dealer</div>
        <div id="bj_dealer" class="cards"></div>
        <div id="bj_dtotal" class="muted">—</div>
      </div>
    </div>


    <div class="row" id="bj_actions"></div>

    <div class="resultBox">
      <div class="label">Result</div>
      <div id="bj_result" class="value">—</div>
      <div id="bj_detail" class="muted">—</div>
    </div>

    <details class="settings">
      <summary>Rules / Payout Settings</summary>
      ${payoutsTemplateHTML()}
      <button id="bj_savePayouts">Save Settings</button>
    </details>
  `;

  const el = {
    wager: mountEl.querySelector("#bj_wager"),
    side3: mountEl.querySelector("#bj_side3"),
    deal: mountEl.querySelector("#bj_deal"),
    actions: mountEl.querySelector("#bj_actions"),
    side3Result: mountEl.querySelector("#bj_side3_result"),

    p: mountEl.querySelector("#bj_player"),
    d: mountEl.querySelector("#bj_dealer"),
    ptotal: mountEl.querySelector("#bj_ptotal"),
    dtotal: mountEl.querySelector("#bj_dtotal"),

    result: mountEl.querySelector("#bj_result"),
    detail: mountEl.querySelector("#bj_detail"),

    savePayouts: mountEl.querySelector("#bj_savePayouts"),
  };

  for (const [k,v] of Object.entries(el)) {
  if (!v) console.error("Missing element:", k);
  }

  let state = { roundId: null, live: null, payouts: null };

  const num = (v) => Math.floor(Number(v || 0));

  function setActions(btns) {
    el.actions.innerHTML = "";
    for (const b of btns) {
      const btn = document.createElement("button");
      btn.textContent = b.label;
      if (b.kind) btn.className = b.kind;
      btn.disabled = !!b.disabled;
      btn.addEventListener("click", b.onClick);
      el.actions.appendChild(btn);
    }
  }

  function render() {
    if (!state.live) {
      renderCards(el.p, [], false);
      renderCards(el.d, [], false);
      el.ptotal.textContent = "—";
      el.dtotal.textContent = "—";
      return;
    }

    renderCards(el.p, state.live.player, false);

    const dealerFaceDown = state.live.status !== "DONE";

    if (dealerFaceDown) {
      // show upcard face-up + one facedown card
      el.d.innerHTML = "";
      const upWrap = document.createElement("div");
      const holeWrap = document.createElement("div");
    
      renderCards(upWrap, [state.live.dealer[0]], false);
      renderCardBack(holeWrap, 1);
    
      // renderCards writes innerHTML, so use wrappers and then append their children
      el.d.append(...upWrap.childNodes);
      el.d.append(...holeWrap.childNodes);
    } else {
      renderCards(el.d, state.live.dealer, false);
    }


    const pt = handTotals(state.live.player);
    el.ptotal.textContent = `Total: ${pt.best}${pt.isSoft ? " (soft)" : ""}${pt.isBlackjack ? " (BJ)" : ""}`;

    if (dealerFaceDown) {
      const up = handTotals([state.live.dealer[0]]);
      el.dtotal.textContent = `Upcard value: ${up.best}`;
    } else {
      const dt = handTotals(state.live.dealer);
      el.dtotal.textContent = `Total: ${dt.best}${dt.isSoft ? " (soft)" : ""}${dt.isBlackjack ? " (BJ)" : ""}`;
    }
  }

  async function loadSettingsIntoUI() {
    state.payouts = await loadBJPayouts(store);
    state.payouts.bindInputs(mountEl);
  }

  el.savePayouts.addEventListener("click", async () => {
    state.payouts = await saveBJPayouts(store, mountEl);
    alert("Saved settings.");
  });

  (async () => {
    await loadSettingsIntoUI();
    setActions([]);
    render();
  })();

  el.deal.addEventListener("click", async () => {
    try {
      if (!store.currentPlayerId) throw new Error("Select a player first.");
      const wager = num(el.wager.value);
      const side3 = num(el.side3.value);
      if (wager <= 0) throw new Error("Enter a wager > 0.");

      const { readBJPayoutsFromUI } = await import("./blackjackplus.payouts.js");
      const payouts = readBJPayoutsFromUI(mountEl);
      await store.setSetting("payouts_blackjackplus", payouts);


      const { roundId, live } = await dealBJRound(store, { wager, side3, payouts });
      state.roundId = roundId;
      state.live = live;
      // show side bet hand + what it WOULD pay (actual settlement happens in engine settle)
      const pset = (await loadBJPayouts(store)).value; // current settings
      if (pset.side3?.enabled && (num(el.side3.value) > 0)) {
        const { eval3, handName3 } = await import("../../core/eval3.js");
        const three = [live.player[0], live.player[1], live.dealer[0]];
        const e = eval3(three);
        const mult = pset.side3.paytable[e.rankCode] ?? 0;
        el.side3Result.textContent = mult > 0
          ? `Side bet: ${handName3(e.rankCode)} (${mult}:1)`
          : `Side bet: ${handName3(e.rankCode)} (no pay)`;
      } else {
        el.side3Result.textContent = "Side bet: —";
      }


      el.result.textContent = "Your move";
      el.detail.textContent = "Hit, Stand, or Double.";
      setActions(makePlayerActions());

      // Auto-resolve immediate BJ
      const pt = handTotals(live.player);
      if (pt.isBlackjack) {
        live.status = "DEALER_TURN";
        dealerPlay(live);
        live.status = "DONE";
        renderCards(el.d, live.dealer, false);
        const out = await settleBJ(store, roundId, live);
        el.result.textContent = out.title;
        el.detail.textContent = out.detail;
        setActions([]);
        state.roundId = null; state.live = null;
        await store.uiRefresh?.();
      }

      render();
      await store.uiRefresh?.();
    } catch (e) { alert(e.message); }
  });

  function makePlayerActions() {
    return [
      { label: "Hit", onClick: async () => {
        try {
          hit(state.live);
          const pt = handTotals(state.live.player);
          if (pt.isBust) {
            // end immediately
            state.live.status = "DONE";
            dealerPlay(state.live); // optional; dealer not needed but fine
            const out = await settleBJ(store, state.roundId, state.live);
            el.result.textContent = out.title;
            el.detail.textContent = out.detail;
            setActions([]);
            state.roundId = null; state.live = null;
            await store.uiRefresh?.();
          }
          render();
        } catch (e) { alert(e.message); }
      }},
      { label: "Stand", onClick: async () => {
        try {
          stand(state.live);
          dealerPlay(state.live);
          const out = await settleBJ(store, state.roundId, state.live);
          renderCards(el.d, state.live.dealer, false);
          render();
          el.result.textContent = out.title;
          el.detail.textContent = out.detail;
          setActions([]);
          state.roundId = null; state.live = null;
          await store.uiRefresh?.();
        } catch (e) { alert(e.message); }
      }},
      { label: "Double", kind: "ok", disabled: !canDouble(state.live), onClick: async () => {
        try {
          await doubleDown(store, state.roundId, state.live);
          dealerPlay(state.live);
          const out = await settleBJ(store, state.roundId, state.live);
          renderCards(el.d, state.live.dealer, false);
          render();
          el.result.textContent = out.title;
          el.detail.textContent = out.detail;
          setActions([]);
          state.roundId = null; state.live = null;
          await store.uiRefresh?.();
        } catch (e) { alert(e.message); }
      }},
    ];
  }
}
