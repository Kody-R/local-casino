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
} from "./allthebets.engine.js";

import { handValue } from "./allthebets.sidebets.js";

let state;

export function mountBlackjack(root) {
  state = newBlackjackState(1000);
  root.innerHTML = `
    <div class="bj-wrap">
      <div class="bj-header">
        <h2>Blackjack Side Bet Edition</h2>
        <div id="bj-balance"></div>
        <div id="bj-message"></div>
      </div>

      <div class="bj-bets">
        <label>Main Bet <input id="bet-main" type="number" min="1" value="10"></label>
        <label>Perfect Pairs <input id="sb-perfectPairs" type="number" min="0" value="0"></label>
        <label>21+3 <input id="sb-twentyOnePlusThree" type="number" min="0" value="0"></label>
        <label>Lucky Ladies <input id="sb-luckyLadies" type="number" min="0" value="0"></label>
        <label>Lucky Lucky <input id="sb-luckyLucky" type="number" min="0" value="0"></label>
        <label>Over 13 <input id="sb-over13" type="number" min="0" value="0"></label>
        <label>Under 13 <input id="sb-under13" type="number" min="0" value="0"></label>
        <label>Bust It <input id="sb-bustIt" type="number" min="0" value="0"></label>
        <label>Match Dealer <input id="sb-matchDealer" type="number" min="0" value="0"></label>
        <label>Royal Match <input id="sb-royalMatch" type="number" min="0" value="0"></label>
        <label>Blazing 7s <input id="sb-blazing7s" type="number" min="0" value="0"></label>
      </div>

      <div class="bj-actions">
        <button id="bj-deal">Deal</button>
        <button id="bj-hit">Hit</button>
        <button id="bj-stand">Stand</button>
        <button id="bj-double">Double</button>
        <button id="bj-split">Split</button>
      </div>

      <div class="bj-table">
        <div class="bj-dealer">
          <h3>Dealer</h3>
          <div id="bj-dealer-cards" class="cards"></div>
          <div id="bj-dealer-total"></div>
        </div>
        <div class="bj-player">
          <h3>Player Hands</h3>
          <div id="bj-player-hands"></div>
        </div>
      </div>

      <div class="bj-side-results">
        <h3>Side Bet Results</h3>
        <div id="bj-side-results"></div>
      </div>
    </div>
  `;

  bindEvents(root);
  render(root);
}

function readSideBets(root) {
  const get = id => Math.max(0, Number(root.querySelector(id).value) || 0);
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

function bindEvents(root) {
  root.querySelector("#bj-deal").addEventListener("click", () => {
    try {
      const mainBet = Math.max(1, Number(root.querySelector("#bet-main").value) || 0);
      const sideBets = readSideBets(root);
      placeRoundBet(state, mainBet, sideBets);
      initialDeal(state);
      render(root);
    } catch (err) {
      state.message = err.message;
      render(root);
    }
  });

  root.querySelector("#bj-hit").addEventListener("click", () => {
    if (state.phase !== "playerTurn") return;
    hit(state);
    render(root);
  });

  root.querySelector("#bj-stand").addEventListener("click", () => {
    if (state.phase !== "playerTurn") return;
    stand(state);
    render(root);
  });

  root.querySelector("#bj-double").addEventListener("click", () => {
    if (state.phase !== "playerTurn") return;
    doubleDown(state);
    render(root);
  });

  root.querySelector("#bj-split").addEventListener("click", () => {
    if (state.phase !== "playerTurn") return;
    split(state);
    render(root);
  });
}

function cardHTML(c) {
  return `<span class="card">${c.rank}${suitSymbol(c.suit)}</span>`;
}

function suitSymbol(suit) {
  return ({ hearts: "♥", diamonds: "♦", clubs: "♣", spades: "♠" })[suit] || suit;
}

function render(root) {
  root.querySelector("#bj-balance").textContent = `Balance: $${state.balance}`;
  root.querySelector("#bj-message").textContent = state.message || "";

  const dealerCards = state.dealer.cards.map((c, i) => {
    if (!state.dealer.holeRevealed && state.phase !== "roundOver" && i === 1) return `<span class="card back">🂠</span>`;
    return cardHTML(c);
  }).join("");
  root.querySelector("#bj-dealer-cards").innerHTML = dealerCards;

  const dealerTotal = state.dealer.holeRevealed || state.phase === "roundOver"
    ? handValue(state.dealer.cards)
    : "?";
  root.querySelector("#bj-dealer-total").textContent = `Total: ${dealerTotal}`;

  root.querySelector("#bj-player-hands").innerHTML = state.playerHands.map((h, i) => {
    const active = i === state.activeHandIndex && state.phase === "playerTurn" ? " active" : "";
    return `
      <div class="hand${active}">
        <div>Hand ${i + 1} — Bet $${h.bet}</div>
        <div class="cards">${h.cards.map(cardHTML).join("")}</div>
        <div>Total: ${handValue(h.cards)}</div>
      </div>
    `;
  }).join("");

  root.querySelector("#bj-side-results").innerHTML = state.sideBetResults.length
    ? state.sideBetResults.map(r => `
        <div class="side-result ${r.win ? "win" : "lose"}">
          <strong>${r.name}</strong>: ${r.win ? `${r.label} pays ${r.multiplier}:1` : "No win"}
          ${r.push ? " (Push)" : ""}
          ${r.payout ? ` — Win $${r.payout}` : ""}
        </div>
      `).join("")
    : `<div>No side bets resolved yet.</div>`;

  const hand = currentHand(state);
  root.querySelector("#bj-hit").disabled = state.phase !== "playerTurn";
  root.querySelector("#bj-stand").disabled = state.phase !== "playerTurn";
  root.querySelector("#bj-double").disabled = state.phase !== "playerTurn" || !hand || !canDouble(hand, state);
  root.querySelector("#bj-split").disabled = state.phase !== "playerTurn" || !hand || !canSplit(hand, state);
}