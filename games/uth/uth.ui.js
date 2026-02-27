// games/uth/uth.ui.js
import { renderCards } from "../../core/cards.js";
import {
  dealUTHRound,
  betPreflop,
  checkPreflop,
  betFlop,
  checkFlop,
  betRiver,
  foldRiver,
  resolveUTH,
} from "./uth.engine.js";
import {
  loadUTHPayouts,
  saveUTHPayouts,
  payoutsTemplateHTML,
} from "./uth.payouts.js";

export function mountUTH(mountEl, store) {
  mountEl.innerHTML = `
    <h2>Ultimate Texas Hold’em</h2>
    <p class="help">
      Ante + Blind equal. Optional Trips.
      Preflop: check or bet 3x/4x. Flop: check or bet 2x. River: fold or bet 1x. :contentReference[oaicite:16]{index=16}
    </p>

    <div class="row">
      <input id="uth_ante" type="number" min="1" step="1" placeholder="Ante (also Blind)" />
      <input id="uth_trips" type="number" min="0" step="1" placeholder="Trips (optional)" />
      <button id="uth_deal">Deal</button>
    </div>

    <div class="table">
      <div class="hand">
        <div class="handTitle">Player (hole)</div>
        <div id="uth_player" class="cards"></div>
      </div>

      <div class="hand">
        <div class="handTitle">Dealer (hole)</div>
        <div id="uth_dealer" class="cards"></div>
      </div>

      <div class="hand">
        <div class="handTitle">Board</div>
        <div id="uth_board" class="cards"></div>
      </div>
    </div>

    <div class="row" id="uth_actions"></div>

    <div class="resultBox">
      <div class="label">Result</div>
      <div id="uth_result" class="value">—</div>
      <div id="uth_detail" class="muted">—</div>
    </div>

    <details class="settings">
      <summary>Payout Settings (stored locally)</summary>
      ${payoutsTemplateHTML()}
      <button id="uth_savePayouts">Save Payouts</button>
    </details>
  `;

  const el = {
    ante: mountEl.querySelector("#uth_ante"),
    trips: mountEl.querySelector("#uth_trips"),
    deal: mountEl.querySelector("#uth_deal"),
    actions: mountEl.querySelector("#uth_actions"),

    p: mountEl.querySelector("#uth_player"),
    d: mountEl.querySelector("#uth_dealer"),
    b: mountEl.querySelector("#uth_board"),

    result: mountEl.querySelector("#uth_result"),
    detail: mountEl.querySelector("#uth_detail"),

    savePayouts: mountEl.querySelector("#uth_savePayouts"),
  };

  let state = { roundId: null, live: null, payouts: null };

  const num = (v) => Math.floor(Number(v || 0));

  function setActions(buttons) {
    el.actions.innerHTML = "";
    for (const b of buttons) {
      const btn = document.createElement("button");
      btn.textContent = b.label;
      if (b.kind) btn.className = b.kind; // optional styling hooks
      btn.disabled = !!b.disabled;
      btn.addEventListener("click", b.onClick);
      el.actions.appendChild(btn);
    }
  }

  function render() {
    if (!state.live) {
      renderCards(el.p, [], false);
      renderCards(el.d, [], false);
      renderCards(el.b, [], false);
      return;
    }

    renderCards(el.p, state.live.player, false);

    // Dealer cards: hidden until resolve, but can choose to show after river
    const dealerFaceDown = state.live.street !== "DONE";
    renderCards(el.d, state.live.dealer, dealerFaceDown);

    const boardCards = [];
    if (state.live.flopRevealed)
      boardCards.push(...state.live.board.slice(0, 3));
    if (state.live.riverRevealed)
      boardCards.push(...state.live.board.slice(3, 5));
    renderCards(el.b, boardCards, false);
  }

  async function loadPayoutsIntoUI() {
    state.payouts = await loadUTHPayouts(store);
    state.payouts.bindInputs(mountEl);
  }

  el.savePayouts.addEventListener("click", async () => {
    state.payouts = await saveUTHPayouts(store, mountEl);
    alert("Saved payouts locally.");
  });

  (async () => {
    await loadPayoutsIntoUI();
    setActions([]);
    render();
  })();

  el.deal.addEventListener("click", async () => {
    try {
      if (!store.currentPlayerId) throw new Error("Select a player first.");
      const ante = num(el.ante.value);
      const trips = num(el.trips.value);
      if (ante <= 0) throw new Error("Enter an Ante > 0.");

      const payouts = (await loadUTHPayouts(store)).value;

      const { roundId, live } = await dealUTHRound(store, {
        ante,
        trips,
        payouts,
      });
      state.roundId = roundId;
      state.live = live;

      el.result.textContent = "Preflop decision";
      el.detail.textContent = "Check or bet 3x/4x.";
      setActions([
        { label: "Check", onClick: () => onPreflopCheck() },
        { label: "Bet 3x", kind: "ok", onClick: () => onPreflopBet(3) },
        { label: "Bet 4x", kind: "ok", onClick: () => onPreflopBet(4) },
      ]);

      render();
      await store.uiRefresh?.();
    } catch (e) {
      alert(e.message);
    }
  });

  async function onPreflopBet(mult) {
    try {
      await betPreflop(store, state.roundId, state.live, mult);
      render();
      await doResolve();
    } catch (e) {
      alert(e.message);
    }
  }

  function onPreflopCheck() {
    try {
      checkPreflop(state.live); // reveal flop
      el.result.textContent = "Flop decision";
      el.detail.textContent = "Check or bet 2x.";
      setActions([
        { label: "Check", onClick: () => onFlopCheck() },
        { label: "Bet 2x", kind: "ok", onClick: () => onFlopBet() },
      ]);
      render();
    } catch (e) {
      alert(e.message);
    }
  }

  async function onFlopBet() {
    try {
      await betFlop(store, state.roundId, state.live);
      render();
      await doResolve();
    } catch (e) {
      alert(e.message);
    }
  }

  function onFlopCheck() {
    try {
      checkFlop(state.live); // reveal turn+river
      el.result.textContent = "River decision";
      el.detail.textContent = "Fold or bet 1x.";
      setActions([
        { label: "Fold", kind: "danger", onClick: () => onRiverFold() },
        { label: "Bet 1x", kind: "ok", onClick: () => onRiverBet() },
      ]);
      render();
    } catch (e) {
      alert(e.message);
    }
  }

  async function onRiverBet() {
    try {
      await betRiver(store, state.roundId, state.live);
      render();
      await doResolve();
    } catch (e) {
      alert(e.message);
    }
  }

  async function onRiverFold() {
    try {
      const out = await foldRiver(store, state.roundId, state.live);
      // reveal everything after fold
      state.live.street = "DONE";
      state.live.flopRevealed = true;
      state.live.riverRevealed = true;
      renderCards(el.d, state.live.dealer, false);
      render();

      el.result.textContent = out.title;
      el.detail.textContent = out.detail;
      setActions([]);

      state.roundId = null;
      state.live = null;
      await store.uiRefresh?.();
    } catch (e) {
      alert(e.message);
    }
  }

  async function doResolve() {
    // Make sure board is revealed and dealer is face-up
    state.live.street = "DONE";
    state.live.flopRevealed = true;
    state.live.riverRevealed = true;

    const out = await resolveUTH(store, state.roundId, state.live);
    renderCards(el.d, state.live.dealer, false);
    render();

    el.result.textContent = out.title;
    el.detail.textContent = out.detail;
    setActions([]);

    state.roundId = null;
    state.live = null;

    await store.uiRefresh?.();
  }
}
