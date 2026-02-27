// games/threecard/threecard.ui.js
import {
  dealThreeCardRound,
  foldThreeCard,
  playThreeCard,
} from "./threecard.engine.js";
import {
  loadThreeCardPayouts,
  saveThreeCardPayouts,
  payoutsTemplateHTML,
} from "./threecard.payouts.js";
import { renderCards } from "../../core/cards.js";

export function mountThreeCard(mountEl, store) {
  mountEl.innerHTML = `
    <h2>3 Card Poker</h2>
    <p class="help">Place Ante (+ optional bonuses) → Deal → Fold or Play.</p>

    <div class="row">
      <input id="tc_ante" type="number" min="1" step="1" placeholder="Ante" />
      <input id="tc_pp" type="number" min="0" step="1" placeholder="Pair Plus (optional)" />
    </div>
    <div class="row">
      <input id="tc_sc" type="number" min="0" step="1" placeholder="6 Card Bonus (optional)" />
      <button id="tc_deal">Deal</button>
    </div>

    <div class="table">
      <div class="hand">
        <div class="handTitle">Player</div>
        <div id="tc_playerCards" class="cards"></div>
      </div>
      <div class="hand">
        <div class="handTitle">Dealer</div>
        <div id="tc_dealerCards" class="cards"></div>
      </div>
    </div>

    <div class="row">
      <button id="tc_fold" class="danger" disabled>Fold</button>
      <button id="tc_play" class="ok" disabled>Play (= Ante)</button>
    </div>

    <div class="resultBox">
      <div class="label">Result</div>
      <div id="tc_result" class="value">—</div>
      <div id="tc_detail" class="muted">—</div>
    </div>

    <details class="settings">
      <summary>Payout Settings (stored locally)</summary>
      ${payoutsTemplateHTML()}
      <button id="tc_savePayouts">Save Payouts</button>
    </details>
  `;

  const el = {
    ante: mountEl.querySelector("#tc_ante"),
    pp: mountEl.querySelector("#tc_pp"),
    sc: mountEl.querySelector("#tc_sc"),
    deal: mountEl.querySelector("#tc_deal"),
    fold: mountEl.querySelector("#tc_fold"),
    play: mountEl.querySelector("#tc_play"),
    pCards: mountEl.querySelector("#tc_playerCards"),
    dCards: mountEl.querySelector("#tc_dealerCards"),
    result: mountEl.querySelector("#tc_result"),
    detail: mountEl.querySelector("#tc_detail"),
    savePayouts: mountEl.querySelector("#tc_savePayouts"),
  };

  let state = { roundId: null, live: null, payouts: null };

  function setButtons(canDeal, canAction) {
    el.deal.disabled = !canDeal;
    el.fold.disabled = !canAction;
    el.play.disabled = !canAction;
  }

  function parseAmt(v) {
    const n = Number(v);
    if (!Number.isFinite(n)) return 0;
    return Math.floor(n);
  }

  (async () => {
    state.payouts = await loadThreeCardPayouts(store);
    // fill settings inputs
    state.payouts.bindInputs(mountEl);
    setButtons(true, false);
  })();

  el.savePayouts.addEventListener("click", async () => {
    state.payouts = await saveThreeCardPayouts(store, mountEl);
    alert("Saved payouts locally.");
  });

  el.deal.addEventListener("click", async () => {
    try {
      if (!store.currentPlayerId) throw new Error("Select a player first.");
      const ante = parseAmt(el.ante.value);
      const pp = parseAmt(el.pp.value);
      const sc = parseAmt(el.sc.value);
      if (ante <= 0) throw new Error("Enter an Ante > 0.");

      const payouts = await loadThreeCardPayouts(store);
      state.payouts = payouts;

      const { roundId, live } = await dealThreeCardRound(store, {
        ante,
        pairPlus: pp,
        sixCard: sc,
        payouts: payouts.value,
      });
      state.roundId = roundId;
      state.live = live;

      renderCards(el.pCards, live.player, false);
      renderCards(el.dCards, live.dealer, true);

      el.result.textContent = "Decide: Fold or Play";
      el.detail.textContent = "Play wager will be equal to Ante.";
      setButtons(false, true);

      await store.uiRefresh?.();
    } catch (e) {
      alert(e.message);
    }
  });

  el.fold.addEventListener("click", async () => {
    try {
      const out = await foldThreeCard(store, state.roundId, state.live);
      renderCards(el.dCards, state.live.dealer, false);
      el.result.textContent = "FOLD";
      el.detail.textContent = out.detail;
      state.roundId = null;
      state.live = null;
      setButtons(true, false);
      await store.uiRefresh?.();
    } catch (e) {
      alert(e.message);
    }
  });

  el.play.addEventListener("click", async () => {
    try {
      const out = await playThreeCard(store, state.roundId, state.live);
      renderCards(el.dCards, state.live.dealer, false);
      el.result.textContent = out.title;
      el.detail.textContent = out.detail;
      state.roundId = null;
      state.live = null;
      setButtons(true, false);
      await store.uiRefresh?.();
    } catch (e) {
      alert(e.message);
    }
  });
}
