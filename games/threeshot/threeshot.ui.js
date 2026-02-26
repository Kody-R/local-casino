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
  let revealStep = 0; // 0=none, 1=shot1, 2=shot2, 3=shot3, 4=five, 5=summary
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
        <button id="btnReveal" ${state.phase !== "RESULT" ? "disabled" : ""}>Show Winnings</button>
        <button id="btnNext" ${state.phase !== "RESULT" ? "disabled" : ""}>Next Round</button>
      </div>

      <div id="tsResult" class="ts-result"></div>
    `;

    const holeEl = rootEl.querySelector("#tsHole");
const commEl = rootEl.querySelector("#tsComm");
const resEl  = rootEl.querySelector("#tsResult");

// Face-down rules
const holeDown = (state.phase === "BETTING");
const commDown = (state.phase !== "RESULT");

// Default: no highlight
let holeHi = null;
let commHi = null;

if (state.phase === "RESULT" && state.results) {
  // Highlight logic: hole indices are 0,1. community indices are 0,1,2
  if (revealStep === 1) { holeHi = new Set([0,1]); commHi = new Set([0]); }
  if (revealStep === 2) { holeHi = new Set([0,1]); commHi = new Set([1]); }
  if (revealStep === 3) { holeHi = new Set([0,1]); commHi = new Set([2]); }
  if (revealStep === 4) { holeHi = new Set([0,1]); commHi = new Set([0,1,2]); }
}

renderCards(holeEl, state.hole, holeDown, { highlightIdx: holeHi, dimOthers: true });
renderCards(commEl, state.community, commDown, { highlightIdx: commHi, dimOthers: true });

// Results text
resEl.innerHTML = "";
if (state.phase === "RESULT" && state.results) {
  const r = state.results;

  const shotLine = (i) => {
    const s = r.shots[i];
    if (!s.bet) return `<div class="mono">${s.label}: no bet</div>`;
    const profit = (s.win > 0) ? (s.win - s.bet) : 0;
    return `<div class="mono">${s.label}: ${s.eval.name} • bet ${s.bet} • pays ${s.mult}:1 • profit ${profit}</div>`;
  };

  const five = r.five;
  const fiveLine = () => {
    if (!five.bet) return `<div class="mono">5 Shot: no bet</div>`;
    const profit = (five.win > 0) ? (five.win - five.bet) : 0;
    return `<div class="mono">5 Shot: ${five.eval.name} • bet ${five.bet} • pays ${five.mult}:1 • profit ${profit}</div>`;
  };

  if (revealStep === 0) {
    resEl.innerHTML = `<div class="mono">Click “Show Winnings” to step through results.</div>`;
  } else if (revealStep === 1) {
    resEl.innerHTML = shotLine(0);
  } else if (revealStep === 2) {
    resEl.innerHTML = shotLine(1);
  } else if (revealStep === 3) {
    resEl.innerHTML = shotLine(2);
  } else if (revealStep === 4) {
    resEl.innerHTML = fiveLine();
  } else {
    resEl.innerHTML = `
      ${shotLine(0)}
      ${shotLine(1)}
      ${shotLine(2)}
      ${fiveLine()}
      <div style="margin-top:8px;"><b>Net:</b> ${r.lastNet}</div>
    `;
  }
}
    
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
      revealStep = 0;
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
      revealStep = 0;
      await settleAllBets();
      await paint();
    });

    rootEl.querySelector("#btnNext")?.addEventListener("click", async () => {
      state = nextRound(state);
      round = null;
      await paint();
    });

    rootEl.querySelector("#btnReveal")?.addEventListener("click", async () => {
  if (state.phase !== "RESULT") return;
  revealStep = Math.min(revealStep + 1, 5);
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