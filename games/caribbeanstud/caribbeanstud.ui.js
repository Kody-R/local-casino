// games/caribbeanstud/caribbeanstud.ui.js
import {
  newCaribbeanStudRound,
  settleCaribbeanStud,
  formatHandName,
} from "./caribbeanstud.engine.js";

import { renderCards, renderCardBack } from "../../core/cards.js";

export function mountCaribbeanStud(rootEl, store) {
  rootEl.innerHTML = `
    <div class="cs-wrap">
      <div class="cs-top">
        <div class="cs-controls">
          <label>Ante:
            <input id="csAnte" type="number" min="1" value="10" />
          </label>
          <button id="csDeal">Deal</button>
          <button id="csNew" disabled>New Hand</button>
        </div>
        <div id="csMsg" class="cs-msg"></div>
      </div>

      <div class="cs-table">
        <div class="cs-area">
          <div class="cs-title">Dealer</div>
          <div id="csDealer" class="cs-cards"></div>
          <div id="csDealerInfo" class="cs-info"></div>
        </div>

        <div class="cs-area">
          <div class="cs-title">Player</div>
          <div id="csPlayer" class="cs-cards"></div>
          <div id="csPlayerInfo" class="cs-info"></div>
        </div>

        <div class="cs-actions">
          <button id="csFold" disabled>Fold (lose ante)</button>
          <button id="csCall" disabled>Call (2× ante)</button>
        </div>

        <div id="csResult" class="cs-result"></div>
      </div>
    </div>
  `;

  const anteEl = rootEl.querySelector("#csAnte");
  const dealBtn = rootEl.querySelector("#csDeal");
  const newBtn = rootEl.querySelector("#csNew");
  const msgEl = rootEl.querySelector("#csMsg");

  const dealerEl = rootEl.querySelector("#csDealer");
  const playerEl = rootEl.querySelector("#csPlayer");
  const dealerInfoEl = rootEl.querySelector("#csDealerInfo");
  const playerInfoEl = rootEl.querySelector("#csPlayerInfo");
  const foldBtn = rootEl.querySelector("#csFold");
  const callBtn = rootEl.querySelector("#csCall");
  const resultEl = rootEl.querySelector("#csResult");

  let round = null;
  let ante = 0;

  function resetBoard() {
    dealerEl.innerHTML = "";
    playerEl.innerHTML = "";
    dealerInfoEl.textContent = "";
    playerInfoEl.textContent = "";
    resultEl.textContent = "";
  }

  function renderDealer(cards, { hideHole = true } = {}) {
    dealerEl.innerHTML = "";

    const row = document.createElement("div");
    row.className = "cs-cards";
    dealerEl.appendChild(row);

    if (hideHole) {
      const up = document.createElement("div");
      row.appendChild(up);
      renderCards(up, cards.slice(0, 1), false);

      const backs = document.createElement("div");
      backs.className = "cs-backs";
      row.appendChild(backs);
      renderCardBack(backs, 4);
    } else {
      renderCards(row, cards, false);
    }
  }

  function setDecisionEnabled(on) {
    foldBtn.disabled = !on;
    callBtn.disabled = !on;
  }

  function setHandButtons({ canDeal, canNew }) {
    dealBtn.disabled = !canDeal;
    newBtn.disabled = !canNew;
  }

  function onDeal() {
    ante = Math.floor(Number(anteEl.value || 0));
    if (ante < 1) {
      msgEl.textContent = "Ante must be at least 1.";
      return;
    }
    if (store.balance < ante) {
      msgEl.textContent = "Not enough balance.";
      return;
    }

    // take ante immediately
    store.balance -= ante;
    store.render?.();

    round = newCaribbeanStudRound();

    resetBoard();
    renderCards(playerEl, round.playerHand, false);
    // show ONE dealer card pre-decision (typical). Set showOne:false to hide all.
    renderDealer(round.dealerHand, { hideHole: true });

    msgEl.textContent = "Deal complete. Fold or Call?";
    setDecisionEnabled(true);
    setHandButtons({ canDeal: false, canNew: false });
  }

  function settle(action) {
    // If CALL, take call bet now (2× ante)
    if (action === "CALL") {
      const callBet = ante * 2;
      if (store.balance < callBet) {
        msgEl.textContent = "Not enough balance for Call (2× ante).";
        return;
      }
      store.balance -= callBet;
      store.render?.();
    }

    const s = settleCaribbeanStud({ round, action, ante });

    // Reveal dealer hand
    renderDealer(round.dealerHand, { hideHole: false });

    // Hand ranks
    playerInfoEl.textContent = `Player: ${formatHandName(s.playerEval.code)}`;
    dealerInfoEl.textContent = `Dealer: ${formatHandName(s.dealerEval.code)}${
      s.dealerQualified === false ? " (No Qualify)" : ""
    }`;

    // Apply settlement: add back winnings + pushes, etc.
    // NOTE: We already deducted ante (and call if CALL). Settlement 'net' is relative to initial bankroll BEFORE deductions,
    // so easiest is to credit back: (ante + callBet) + s.net, but we already removed them.
    // We removed ante always; removed callBet only if CALL.
    // Therefore, just credit back: (ante if pushed/won?) is already in s.net math.
    // Since s.net includes -ante / -callBet, we can safely just add back: (ante + callBet) + s.net? No.
    // Instead: credit back "returned stake + win amounts" based on outcome.

    // Compute credit from outcome explicitly:
    const callBet = action === "CALL" ? ante * 2 : 0;
    let credit = 0;

    if (action === "FOLD") {
      credit = 0;
    } else {
      // Start by returning stakes that push or are part of win conditions:
      // If player wins: they get ante stake back + ante win + call stake back + call win
      // If dealer no qualify: ante stake back + ante win + call stake back (push)
      // Push: return both stakes
      // Dealer win: return nothing
      if (s.outcome === "PLAYER_WIN") {
        credit = ante + ante + (callBet + s.callWin); // ante returned + ante win, call returned + call win
      } else if (s.outcome === "DEALER_NO_QUALIFY") {
        credit = ante + ante + callBet; // ante returned + ante win, call returned
      } else if (s.outcome === "PUSH") {
        credit = ante + callBet; // return stakes
      } else {
        credit = 0;
      }
    }

    store.balance += credit;
    store.render?.();

    // Result text
    if (s.outcome === "FOLD") {
      resultEl.textContent = `You folded. Lost ante $${ante}.`;
    } else if (s.outcome === "DEALER_NO_QUALIFY") {
      resultEl.textContent = `Dealer did not qualify. You win $${ante} on Ante. Call bet pushes.`;
    } else if (s.outcome === "PLAYER_WIN") {
      resultEl.textContent = `You win! Ante pays 1:1 (+$${ante}). Call pays ${s.callMultiplier}:1 (+$${s.callWin}).`;
    } else if (s.outcome === "DEALER_WIN") {
      resultEl.textContent = `Dealer wins. You lose Ante $${ante} and Call $${callBet}.`;
    } else {
      resultEl.textContent = `Push. Bets returned.`;
    }

    msgEl.textContent = "Hand complete.";
    setDecisionEnabled(false);
    setHandButtons({ canDeal: false, canNew: true });
  }

  function onNew() {
    round = null;
    ante = 0;
    resetBoard();
    msgEl.textContent = "Place an ante and Deal.";
    setDecisionEnabled(false);
    setHandButtons({ canDeal: true, canNew: false });
  }

  dealBtn.addEventListener("click", onDeal);
  newBtn.addEventListener("click", onNew);
  foldBtn.addEventListener("click", () => settle("FOLD"));
  callBtn.addEventListener("click", () => settle("CALL"));

  onNew();
}
