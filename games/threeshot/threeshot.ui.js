// threeshot.ui.js (STORE-COMPATIBLE VERSION)
import {
  newThreeShotState,
  startRound,
  playerRaise,
  playerFold,
  nextRound,
} from "./threeshot.engine.js";

import { renderCards, renderCardBack } from "../../core/cards.js";

export function mountThreeShot(rootEl, store) {
  let state = newThreeShotState({ balance: 0 });
  let round = null;

  async function refreshBalance() {
    if (!store.currentPlayerId) return 0;
    return await store.getChips(store.currentPlayerId);
  }

  async function paint() {
    const bal = await refreshBalance();

    rootEl.innerHTML = `
      <div class="game-header">
        <h2>3 Shot Poker</h2>
        <div>Balance: ${bal}</div>
      </div>

      <div>${state.message}</div>

      <div class="bet-panel">
        <input id="bet1" type="number" min="1" value="10">
        <input id="bet5" type="number" min="0" value="0">
        <button id="btnDeal" ${state.phase !== "BETTING" ? "disabled" : ""}>Deal</button>
      </div>

      <div class="ts-area">
       <div class="ts-title">Hole</div>
       <div id="tsHole" class="ts-cards"></div>
     
       <div class="ts-title" style="margin-top:10px;">Community</div>
       <div id="tsComm" class="ts-cards"></div>
     </div>

      <div class="controls">
        <button id="btnRaise" ${state.phase !== "DECISION" ? "disabled" : ""}>Raise</button>
        <button id="btnFold" ${state.phase !== "DECISION" ? "disabled" : ""}>Fold</button>
        <button id="btnNext" ${state.phase !== "RESULT" ? "disabled" : ""}>Next Round</button>
      </div>
    `;

    // Render cards using core/cards.js
    const holeEl = rootEl.querySelector("#tsHole");
    const commEl = rootEl.querySelector("#tsComm");
    
    const holeFaceDown = (state.phase === "BETTING");
    const commFaceDown = (state.phase !== "RESULT");
    
    renderCards(holeEl, state.hole, holeFaceDown);
    renderCards(commEl, state.community, commFaceDown);
    
    bindEvents();
  }

  function bindEvents() {
    const bet1El = rootEl.querySelector("#bet1");
    const bet5El = rootEl.querySelector("#bet5");

    rootEl.querySelector("#btnDeal")?.addEventListener("click", async () => {
      const bet1 = Number(bet1El.value);
      const bet5 = Number(bet5El.value);

      if (!store.currentPlayerId) {
        alert("Select a player first.");
        return;
      }

      round = await store.startRound("THREESHOT");

      try {
        await store.placeBet(round.id, "SHOT1", bet1);
        if (bet5 > 0) await store.placeBet(round.id, "FIVESHOT", bet5);
      } catch (e) {
        alert(e.message);
        return;
      }

      state = startRound(state, { bet1, bet5 });
      await store.uiRefresh();
      await paint();
    });

    rootEl.querySelector("#btnRaise")?.addEventListener("click", async () => {
      try {
        await store.placeBet(round.id, "SHOT2", state.bet1);
        await store.placeBet(round.id, "SHOT3", state.bet1);
      } catch (e) {
        alert(e.message);
        return;
      }

      state = playerRaise(state);

      await settleAllBets();
      await paint();
    });

    rootEl.querySelector("#btnFold")?.addEventListener("click", async () => {
      state = playerFold(state);
      await settleAllBets();
      await paint();
    });

    rootEl.querySelector("#btnNext")?.addEventListener("click", async () => {
      state = nextRound(state);
      round = null;
      await paint();
    });
  }

  async function settleAllBets() {
    const r = state.results;

    for (const shot of r.shots) {
      if (!shot.bet) continue;

      const payout = shot.win - shot.bet; // profit
      const returned = shot.mult > 0 ? shot.bet : 0;

      await store.settle(
        round.id,
        shot.label.replace(" ", "").toUpperCase(),
        shot.eval.name,
        payout,
        returned
      );
    }

    if (r.five.bet) {
      const payout = r.five.win - r.five.bet;
      const returned = r.five.mult > 0 ? r.five.bet : 0;

      await store.settle(
        round.id,
        "FIVESHOT",
        r.five.eval.name,
        payout,
        returned
      );
    }

    await store.closeRound(round.id);
    await store.uiRefresh();
  }

  paint();
}