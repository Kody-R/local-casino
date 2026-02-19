// games/spanish21/spanish21.ui.js
import {
  newSpanish21State,
  startRound,
  availableActions,
  step,
  handValue,
  cardToString
} from "./spanish21.engine.js";

import { renderCards, renderCardBack } from "../../core/cards.js";


export function mountSpanish21(rootEl, store) {
  rootEl.innerHTML = `
    <div class="s21-wrap">
      <div class="s21-top">
        <div class="s21-controls">
          <label>Bet:
            <input id="s21Bet" type="number" min="1" value="10" />
          </label>
          <button id="s21Deal">Deal</button>
          <button id="s21New">New Shoe</button>
        </div>
        <div id="s21Msg" class="s21-msg"></div>
      </div>

      <div class="s21-area">
        <div class="s21-title">Dealer</div>
        <div id="s21Dealer" class="s21-cards"></div>
        <div id="s21DealerInfo" class="s21-info"></div>
      </div>

      <div class="s21-area">
        <div class="s21-title">Player</div>
        <div id="s21Player" class="s21-hands"></div>
      </div>

      <div class="s21-actions">
        <button id="aHit">Hit</button>
        <button id="aStand">Stand</button>
        <button id="aDouble">Double</button>
        <button id="aSplit">Split</button>
      </div>

      <div id="s21Result" class="s21-result"></div>
    </div>
  `;

  const betEl = rootEl.querySelector("#s21Bet");
  const dealBtn = rootEl.querySelector("#s21Deal");
  const newBtn = rootEl.querySelector("#s21New");
  const msgEl = rootEl.querySelector("#s21Msg");

  const dealerEl = rootEl.querySelector("#s21Dealer");
  const dealerInfoEl = rootEl.querySelector("#s21DealerInfo");
  const playerEl = rootEl.querySelector("#s21Player");
  const resultEl = rootEl.querySelector("#s21Result");

  const btnHit = rootEl.querySelector("#aHit");
  const btnStand = rootEl.querySelector("#aStand");
  const btnDouble = rootEl.querySelector("#aDouble");
  const btnSplit = rootEl.querySelector("#aSplit");

  let state = newSpanish21State({ decks: 6, dealerHitsSoft17: true });

  function setActionEnabled(map) {
    btnHit.disabled = !map.HIT;
    btnStand.disabled = !map.STAND;
    btnDouble.disabled = !map.DOUBLE;
    btnSplit.disabled = !map.SPLIT;
  }

  function renderDealer() {
  if (!state.dealer.length) {
    dealerEl.innerHTML = "";
    dealerInfoEl.textContent = "";
    return;
  }

  if (state.stage === "PLAYER") {
    // Show first card face up, second card face down
    const row = document.createElement("div");
    row.className = "s21-cards";
    dealerEl.innerHTML = "";
    dealerEl.appendChild(row);

    // up card
    const up = document.createElement("div");
    row.appendChild(up);
    renderCards(up, [state.dealer[0]], false);

    // down card
    const down = document.createElement("div");
    row.appendChild(down);
    renderCardBack(down, 1);

    dealerInfoEl.textContent = `Showing: ${handValue([state.dealer[0]]).total}`;
  } else {
    renderCards(dealerEl, state.dealer, false);
    const dv = handValue(state.dealer);
    dealerInfoEl.textContent = `Total: ${dv.total}${dv.isSoft ? " (soft)" : ""}`;
  }
}


  function render() {
    // Dealer view: hide hole card during PLAYER stage
    renderDealer();

    // Player hands
    playerEl.innerHTML = "";

state.hands.forEach((hand, idx) => {
  const v = handValue(hand);
  const active = (state.stage === "PLAYER" && idx === state.active);

  const wrap = document.createElement("div");
  wrap.className = `s21-hand ${active ? "is-active" : ""}`;
  wrap.innerHTML = `
    <div class="s21-hand-head">
      <div>Hand ${idx + 1} — Bet $${state.bets[idx] ?? 0}</div>
      <div>Total: ${v.total}${v.isSoft ? " (soft)" : ""}</div>
    </div>
  `;

  const cardsRow = document.createElement("div");
  cardsRow.className = "s21-cards";
  wrap.appendChild(cardsRow);

  renderCards(cardsRow, hand, false);

  playerEl.appendChild(wrap);
});


    // Actions
    const acts = availableActions(state);
    const actMap = { HIT:false, STAND:false, DOUBLE:false, SPLIT:false };
    acts.forEach(a => (actMap[a] = true));

    // If not in player stage, disable all
    if (state.stage !== "PLAYER") {
      setActionEnabled({ HIT:false, STAND:false, DOUBLE:false, SPLIT:false });
    } else {
      // Disable DOUBLE/SPLIT if user can't afford required extra bet
      // DOUBLE requires +current bet; SPLIT requires +current bet
      const curBet = state.bets[state.active] ?? 0;

      const canAffordDouble = store.balance >= curBet;
      const canAffordSplit = store.balance >= curBet;

      if (actMap.DOUBLE && !canAffordDouble) actMap.DOUBLE = false;
      if (actMap.SPLIT && !canAffordSplit) actMap.SPLIT = false;

      setActionEnabled(actMap);
    }
  }

  function renderResults() {
    if (state.stage !== "SETTLE") return;

    // Apply settlement net to balance (net is winnings/losses relative to bet already deducted)
    // We deducted bets up front, so:
    // - WIN net: +bet (or +1.5*bet for BJ) means add back bet + winnings? No — engine returns net winnings only.
    // We handle by returning stake(s) and adding winnings here:
    //
    // Simplify: At deal time, we deduct initial bet(s) as placed.
    // For settlement:
    // - PUSH: return bet
    // - WIN net=bet: return bet + bet
    // - BJ net=1.5*bet: return bet + 1.5*bet
    // - LOSE: return 0
    //
    // Engine net values are: -bet, 0, +bet, +1.5*bet
    // So credit = bet + net when net >= 0 else 0.
    let credit = 0;
    state.results.forEach(r => {
      const bet = state.bets[r.idx];
      if (r.net >= 0) credit += (bet + r.net);
    });
    store.balance += credit;
    store.render?.();

    const lines = state.results.map(r => {
      const bet = state.bets[r.idx];
      const label = r.outcome === "WIN" ? `WIN +$${r.net}` :
                    r.outcome === "PUSH" ? `PUSH (return $${bet})` :
                    `LOSE -$${bet}`;
      return `Hand ${r.idx + 1}: ${label} — ${r.reason}`;
    });

    resultEl.textContent = lines.join(" | ");
    msgEl.textContent = "Round complete. Place a bet and Deal again.";
  }

  function onDeal() {
    if (state.stage !== "BET") return;

    const bet = Math.floor(Number(betEl.value || 0));
    if (bet < 1) { msgEl.textContent = "Bet must be at least 1."; return; }
    if (store.balance < bet) { msgEl.textContent = "Not enough balance."; return; }

    // Deduct initial bet
    store.balance -= bet;
    store.render?.();

    startRound(state, bet);

    // If engine immediately settled (player blackjack), we need to reveal dealer and pay
    if (state.stage === "SETTLE") {
      // Reveal dealer now
      renderDealer();
      render();
      renderResults();
      return;
    }

    msgEl.textContent = "Your turn.";
    resultEl.textContent = "";
    render();
  }

  function onNewShoe() {
    state = newSpanish21State({ decks: 6, dealerHitsSoft17: true });
    msgEl.textContent = "New shoe. Place a bet and Deal.";
    resultEl.textContent = "";
    render();
  }

  function doAction(action) {
    if (state.stage !== "PLAYER") return;

    const curBet = state.bets[state.active] ?? 0;

    // Handle extra wagers for DOUBLE/SPLIT up front
    if (action === "DOUBLE") {
      if (store.balance < curBet) { msgEl.textContent = "Not enough balance to Double."; return; }
      store.balance -= curBet;
      store.render?.();
    }
    if (action === "SPLIT") {
      if (store.balance < curBet) { msgEl.textContent = "Not enough balance to Split."; return; }
      store.balance -= curBet;
      store.render?.();
    }

    step(state, action);
    render();

    if (state.stage === "DEALER") {
      msgEl.textContent = "Dealer’s turn…";
      render();
    }
    if (state.stage === "SETTLE") {
      // Reveal dealer + settle payouts
      render();
      renderResults();
    }
  }

  dealBtn.addEventListener("click", onDeal);
  newBtn.addEventListener("click", onNewShoe);

  btnHit.addEventListener("click", () => doAction("HIT"));
  btnStand.addEventListener("click", () => doAction("STAND"));
  btnDouble.addEventListener("click", () => doAction("DOUBLE"));
  btnSplit.addEventListener("click", () => doAction("SPLIT"));

  msgEl.textContent = "Place a bet and Deal.";
  render();
}
