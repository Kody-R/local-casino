import {
  newBlackjackState,
  placeRoundBet,
  initialDeal,
  currentHand,
  hit,
  stand,
  doubleDown,
  split,
  canDouble,
  canSplit,
  advanceAfterHit,
} from "./allthebets.engine.js";
import { handValue } from "./allthebets.sidebets.js";
import { renderCards, renderCardBack } from "../../core/cards.js";
import { SIDE_BET_PAYTABLES } from "./allthebets.payouts.js";

let state;
let storeRef;

export function mountBlackjack(root, store) {
  storeRef = store;
  state = newBlackjackState();

  root.innerHTML = `
  <div class="bj-wrap">
    <div class="bj-topbar panel">
      <div>
        <h2>Blackjack Side Bet Edition</h2>
        <div id="bj-message" class="bj-message"></div>
      </div>
      <div class="bj-bank">
        <div id="bj-balance" class="stat-pill">Using global balance</div>
      </div>
    </div>

    <div class="bj-layout">
      <aside class="bj-sidebar panel">
        <h3>Main Bet</h3>
        <label class="bet-field">
          <span>Main Bet</span>
          <input id="bet-main" type="number" min="1" value="10">
        </label>

        <h3>Opening Side Bets</h3>
        <div class="bet-grid">
          <label class="bet-field"><span>Perfect Pairs</span><input id="sb-perfectPairs" type="number" min="0" value="0"></label>
          <label class="bet-field"><span>21+3</span><input id="sb-twentyOnePlusThree" type="number" min="0" value="0"></label>
          <label class="bet-field"><span>Lucky Ladies</span><input id="sb-luckyLadies" type="number" min="0" value="0"></label>
          <label class="bet-field"><span>Lucky Lucky</span><input id="sb-luckyLucky" type="number" min="0" value="0"></label>
          <label class="bet-field"><span>Over 13</span><input id="sb-over13" type="number" min="0" value="0"></label>
          <label class="bet-field"><span>Under 13</span><input id="sb-under13" type="number" min="0" value="0"></label>
          <label class="bet-field"><span>Match Dealer</span><input id="sb-matchDealer" type="number" min="0" value="0"></label>
          <label class="bet-field"><span>Royal Match</span><input id="sb-royalMatch" type="number" min="0" value="0"></label>
          <label class="bet-field"><span>Blazing 7s</span><input id="sb-blazing7s" type="number" min="0" value="0"></label>
        </div>

        <h3>Closing Side Bet</h3>
        <label class="bet-field">
          <span>Bust It</span>
          <input id="sb-bustIt" type="number" min="0" value="0">
        </label>

        <div class="bj-actions">
          <button id="bj-deal" class="primary">Deal</button>
          <button id="bj-hit">Hit</button>
          <button id="bj-stand">Stand</button>
          <button id="bj-double">Double</button>
          <button id="bj-split">Split</button>
        </div>
      </aside>

      <main class="bj-main">
        <section class="panel bj-table-panel">
          <div class="seat dealer-seat">
            <div class="seat-head">
              <h3>Dealer</h3>
              <div id="bj-dealer-total" class="seat-total"></div>
            </div>
            <div id="bj-dealer-cards" class="cards-row"></div>
          </div>

          <div class="felt-divider"></div>

          <div class="seat player-seat">
            <div class="seat-head">
              <h3>Player Hands</h3>
            </div>
            <div id="bj-player-hands" class="player-hands"></div>
          </div>
        </section>

        <section class="panel bj-side-results">
  <h3>Side Bet Results</h3>
  <div id="bj-side-results"></div>
</section>

<section class="panel bj-help-panel">
  <details class="bj-help" id="bj-help">
    <summary>Side Bet Help & Rules</summary>
    <div class="bj-help-content" id="bj-help-content">
      <div class="help-grid">
        <div class="help-card">
          <h4>Perfect Pairs</h4>
          <p>Your first two cards form a pair.</p>
          <ul>
            <li>Perfect Pair: same rank and same suit</li>
            <li>Colored Pair: same rank and same color</li>
            <li>Mixed Pair: same rank only</li>
          </ul>
        </div>

        <div class="help-card">
          <h4>21+3</h4>
          <p>Uses your first two cards plus the dealer upcard, poker-style.</p>
          <ul>
            <li>Flush</li>
            <li>Straight</li>
            <li>Three of a Kind</li>
            <li>Straight Flush</li>
            <li>Suited Trips</li>
          </ul>
        </div>

        <div class="help-card">
          <h4>Lucky Ladies</h4>
          <p>Your first two cards must total 20.</p>
          <ul>
            <li>Any 20</li>
            <li>Suited 20</li>
            <li>Matched 20</li>
            <li>Two Queen of Hearts</li>
            <li>Two Queen of Hearts + dealer blackjack</li>
          </ul>
        </div>

        <div class="help-card">
          <h4>Lucky Lucky</h4>
          <p>Uses your first two cards plus the dealer upcard.</p>
          <ul>
            <li>Total 19</li>
            <li>Total 20</li>
            <li>Total 21</li>
            <li>Suited 21</li>
            <li>6-7-8</li>
            <li>Suited 6-7-8</li>
            <li>7-7-7</li>
            <li>Suited 7-7-7</li>
          </ul>
        </div>

        <div class="help-card">
          <h4>Over 13 / Under 13</h4>
          <p>Based on your first two cards only.</p>
          <ul>
            <li>Over 13 wins if total is above 13</li>
            <li>Under 13 wins if total is below 13</li>
            <li>Exactly 13 follows the table rule configured for the game</li>
          </ul>
        </div>

        <div class="help-card">
          <h4>Bust It</h4>
          <p>Wins if the dealer busts.</p>
          <ul>
            <li>Payout usually increases based on how many cards the dealer used to bust</li>
          </ul>
        </div>

        <div class="help-card">
          <h4>Match the Dealer</h4>
          <p>Your first two cards are checked against the dealer upcard rank.</p>
          <ul>
            <li>Unsuited Match</li>
            <li>Suited Match</li>
            <li>Two matches may pay more</li>
          </ul>
        </div>

        <div class="help-card">
          <h4>Royal Match</h4>
          <p>Your first two cards only.</p>
          <ul>
            <li>Suited cards</li>
            <li>Suited King + Queen is the top result</li>
          </ul>
        </div>

        <div class="help-card">
          <h4>Blazing 7s</h4>
          <p>Based on sevens in your hand.</p>
          <ul>
            <li>Single 7</li>
            <li>Two 7s</li>
            <li>Suited 7s</li>
            <li>Three 7s</li>
            <li>Suited 7s may pay more</li>
          </ul>
        </div>
      </div>
    </div>
  </details>
</section>
<div class="bj-help-content" id="bj-help-content">
  ${helpMarkup()}
</div>
      </main>
    </div>
  </div>
  `;

  bindEvents(root);
  render(root);
}

function helpMarkup() {
  const pt = SIDE_BET_PAYTABLES;
  return `
    <div class="help-grid">
      <div class="help-card">
        <h4>Perfect Pairs</h4>
        <ul>
          <li>Perfect Pair: ${pt.perfectPairs.perfectPair}:1</li>
          <li>Colored Pair: ${pt.perfectPairs.coloredPair}:1</li>
          <li>Mixed Pair: ${pt.perfectPairs.mixedPair}:1</li>
        </ul>
      </div>
      <div class="help-card">
        <h4>21+3</h4>
        <ul>
          <li>Flush: ${pt.twentyOnePlusThree.flush}:1</li>
          <li>Straight: ${pt.twentyOnePlusThree.straight}:1</li>
          <li>Three of a Kind: ${pt.twentyOnePlusThree.threeOfKind}:1</li>
          <li>Straight Flush: ${pt.twentyOnePlusThree.straightFlush}:1</li>
          <li>Suited Trips: ${pt.twentyOnePlusThree.suitedTrips}:1</li>
        </ul>
      </div>
    </div>
  `;
}

function num(v, fallback = 0) {
  return Math.max(0, Math.floor(Number(v || fallback) || 0));
}

function readSideBets(root) {
  const get = (id) => num(root.querySelector(id)?.value, 0);
  return {
    perfectPairs: get("#sb-perfectPairs"),
    twentyOnePlusThree: get("#sb-twentyOnePlusThree"),
    luckyLadies: get("#sb-luckyLadies"),
    luckyLucky: get("#sb-luckyLucky"),
    over13: get("#sb-over13"),
    under13: get("#sb-under13"),
    bustIt: get("#sb-bustIt"),
    matchDealer: get("#sb-matchDealer"),
    royalMatch: get("#sb-royalMatch"),
    blazing7s: get("#sb-blazing7s"),
  };
}

function setBetInputsDisabled(root, disabled) {
  root.querySelectorAll(".bj-sidebar input").forEach((el) => {
    el.disabled = disabled;
  });
}

function bindEvents(root) {
  root.querySelector("#bj-deal").addEventListener("click", async () => {
    try {
      const mainBet = Math.max(
        1,
        num(root.querySelector("#bet-main").value, 0),
      );
      const sideBets = readSideBets(root);

      await placeRoundBet(storeRef, state, mainBet, sideBets);
      await initialDeal(storeRef, state);

      render(root);
      await storeRef.uiRefresh?.();
    } catch (err) {
      state.message = err.message || "Unable to deal.";
      render(root);
    }
  });

  root.querySelector("#bj-hit").addEventListener("click", async () => {
    if (state.phase !== "playerTurn") return;

    try {
      hit(state);
      await advanceAfterHit(storeRef, state);
      render(root);
    } catch (err) {
      state.message = err.message || "Unable to hit.";
      render(root);
    }
  });

  root.querySelector("#bj-stand").addEventListener("click", async () => {
    if (state.phase !== "playerTurn") return;

    try {
      await stand(storeRef, state);
      render(root);
      await storeRef.uiRefresh?.();
    } catch (err) {
      state.message = err.message || "Unable to stand.";
      render(root);
    }
  });

  root.querySelector("#bj-double").addEventListener("click", async () => {
    if (state.phase !== "playerTurn") return;

    try {
      await doubleDown(storeRef, state);
      render(root);
      await storeRef.uiRefresh?.();
    } catch (err) {
      state.message = err.message || "Unable to double.";
      render(root);
    }
  });

  root.querySelector("#bj-split").addEventListener("click", async () => {
    if (state.phase !== "playerTurn") return;

    try {
      await split(storeRef, state);
      render(root);
      await storeRef.uiRefresh?.();
    } catch (err) {
      state.message = err.message || "Unable to split.";
      render(root);
    }
  });
}

function render(root) {
  root.querySelector("#bj-balance").textContent = "Using global balance";
  root.querySelector("#bj-message").textContent = state.message || "";

  const bettingLocked = !["betting", "roundOver"].includes(state.phase);
  setBetInputsDisabled(root, bettingLocked);

  const dealerEl = root.querySelector("#bj-dealer-cards");
  dealerEl.innerHTML = "";
  dealerEl.classList.add("cards-row");

  if (
    !state.dealer.holeRevealed &&
    state.phase !== "roundOver" &&
    state.dealer.cards.length >= 2
  ) {
    renderCards(dealerEl, [state.dealer.cards[0]]);

    const backWrap = document.createElement("div");
    backWrap.className = "cards";
    renderCardBack(backWrap, 1);

    if (backWrap.firstElementChild) {
      dealerEl.appendChild(backWrap.firstElementChild);
    }
  } else {
    renderCards(dealerEl, state.dealer.cards);
  }

  const dealerTotal =
    state.dealer.holeRevealed || state.phase === "roundOver"
      ? handValue(state.dealer.cards)
      : "?";
  root.querySelector("#bj-dealer-total").textContent = `Total: ${dealerTotal}`;

  const handsEl = root.querySelector("#bj-player-hands");
  handsEl.innerHTML = "";

  state.playerHands.forEach((h, i) => {
    const active = i === state.activeHandIndex && state.phase === "playerTurn";

    const handBox = document.createElement("div");
    handBox.className = `hand${active ? " active" : ""}`;

    const outcomeText =
      state.phase === "roundOver" && state.lastRound?.hands?.[i]
        ? ` · ${String(state.lastRound.hands[i].outcome).toUpperCase()}`
        : "";

    handBox.innerHTML = `
      <div class="hand-top">
        <div class="hand-title">Hand ${i + 1}</div>
        <div class="hand-meta">Bet $${h.bet} · Total ${handValue(h.cards)}${outcomeText}</div>
      </div>
      <div class="cards hand-cards"></div>
    `;

    const cardsEl = handBox.querySelector(".hand-cards");
    renderCards(cardsEl, h.cards);

    handsEl.appendChild(handBox);
  });

  root.querySelector("#bj-side-results").innerHTML = state.sideBetResults.length
    ? state.sideBetResults
        .map(
          (r) => `
        <div class="side-result ${r.win ? "win" : "lose"}">
          <strong>${r.name}</strong>: ${r.win ? `${r.label} pays ${r.multiplier}:1` : "No win"}
          ${r.push ? " (Push)" : ""}
          ${r.payout ? ` — Win $${r.payout}` : ""}
        </div>
      `,
        )
        .join("")
    : `<div>No side bets resolved yet.</div>`;

  const hand = currentHand(state);

  root.querySelector("#bj-hit").disabled = state.phase !== "playerTurn";
  root.querySelector("#bj-stand").disabled = state.phase !== "playerTurn";
  root.querySelector("#bj-double").disabled =
    state.phase !== "playerTurn" || !hand || !canDouble(hand, state);
  root.querySelector("#bj-split").disabled =
    state.phase !== "playerTurn" || !hand || !canSplit(hand, state);
}
