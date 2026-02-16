// games/crazy4/crazy4.ui.js
import { dealCrazy4Round, foldCrazy4, playCrazy4 } from "./crazy4.engine.js";
import { loadCrazy4Payouts } from "./crazy4.payouts.js";
import { renderCards } from "../../core/cards.js";
import { best4of5 } from "./crazy4.engine.js";

export function mountCrazy4(mountEl, store) {
  mountEl.innerHTML = `
    <h2>Crazy 4 Poker</h2>

    <div class="row">
      <input id="c4_ante" type="number" placeholder="Ante">
      <input id="c4_sb" type="number" placeholder="Super Bonus">
      <input id="c4_qu" type="number" placeholder="Queens Up">
      <button id="c4_deal">Deal</button>
    </div>

    <div class="table">
      <div class="hand">
        <div class="handTitle">Player</div>
        <div id="c4_playerCards" class="cards"></div>
        <div id="c4_best4" class="muted">Best 4-card: —</div>
      </div>
      <div class="hand">
        <div class="handTitle">Dealer</div>
        <div id="c4_dealerCards" class="cards"></div>
        <div id="c4_dealerBest4" class="muted">Dealer best 4-card: —</div>
      </div>
    </div>

    <div class="row">
      <button id="c4_fold" disabled>Fold</button>
      <button id="c4_play" disabled>Play</button>
    </div>

    <div id="c4_result" class="value">—</div>
  `;

  const el = {
    ante: mountEl.querySelector("#c4_ante"),
    sb: mountEl.querySelector("#c4_sb"),
    qu: mountEl.querySelector("#c4_qu"),
    deal: mountEl.querySelector("#c4_deal"),
    fold: mountEl.querySelector("#c4_fold"),
    play: mountEl.querySelector("#c4_play"),
    pCards: mountEl.querySelector("#c4_playerCards"),
    dCards: mountEl.querySelector("#c4_dealerCards"),
    result: mountEl.querySelector("#c4_result"),
    best4: mountEl.querySelector("#c4_best4"),
    dealerBest4: mountEl.querySelector("#c4_dealerBest4")
  };

  let state = { roundId: null, live: null };

  el.deal.addEventListener("click", async () => {
    const payouts = (await loadCrazy4Payouts(store)).value;

    const ante = Number(el.ante.value || 0);
    const superBonus = Number(el.sb.value || 0);
    const queensUp = Number(el.qu.value || 0);

    const { roundId, live } =
      await dealCrazy4Round(store, { ante, superBonus, queensUp, payouts });

    state.roundId = roundId;
    state.live = live;

    const b4 = best4of5(live.player);
    el.best4.textContent = `Best 4-card: ${b4.name}`;
    renderCards(el.pCards, live.player, false, { highlightIdx: b4.idxSet, dimOthers: true });
    renderCards(el.dCards, live.dealer, true);
    el.dealerBest4.textContent = "Dealer best 4-card: —";

    el.fold.disabled = false;
    el.play.disabled = false;
  });

  el.fold.addEventListener("click", async () => {
    const out = await foldCrazy4(store, state.roundId, state.live);

    const d4 = best4of5(state.live.dealer);
    el.dealerBest4.textContent = `Dealer best 4-card: ${d4.name}`;
    renderCards(el.dCards, state.live.dealer, false, { highlightIdx: d4.idxSet, dimOthers: true });


    el.result.textContent = out.detail;
    el.fold.disabled = true;
    el.play.disabled = true;
    await store.uiRefresh();
  });

  el.play.addEventListener("click", async () => {
    const out = await playCrazy4(store, state.roundId, state.live);

    const d4 = best4of5(state.live.dealer);
    el.dealerBest4.textContent = `Dealer best 4-card: ${d4.name}`;
    renderCards(el.dCards, state.live.dealer, false, { highlightIdx: d4.idxSet, dimOthers: true });

    el.result.textContent = out.title;
    el.fold.disabled = true;
    el.play.disabled = true;
    await store.uiRefresh();
  });
}
