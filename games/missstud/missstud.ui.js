// games/missstud/missstud.ui.js
import { renderCards, renderCardBack } from "../../core/cards.js";
import { DEFAULT_MAIN_PAYTABLE, DEFAULT_3CARD_BONUS } from "./missstud.payouts.js";
import { newMissStudState, startHand, placeStreetBet, fold, settle } from "./missstud.engine.js";

export function mountMissStud(mountEl, store) {
  mountEl.innerHTML = `
    <h2>Mississippi Stud</h2>
    <p class="help">
      You’re playing against the paytable (not the dealer). Win with a pair of Jacks+; pairs of 6–10 push. 
      Each street bet is 1x–3x your ante. 
    </p>

    <div class="row">
      <input id="ms_ante" type="number" min="1" step="1" placeholder="Ante" />
      <input id="ms_bonus3" type="number" min="0" step="1" placeholder="3-Card Bonus (optional)" />
      <button id="ms_deal">Deal</button>
    </div>

    <div class="table">
      <div class="hand">
        <div class="handTitle">Player</div>
        <div id="ms_player" class="cards"></div>
      </div>
      <div class="hand">
        <div class="handTitle">Community</div>
        <div id="ms_comm" class="cards"></div>
      </div>
    </div>

    <div class="row" id="ms_actions"></div>

    <div class="resultBox">
      <div class="label">Result</div>
      <div id="ms_result" class="value">—</div>
      <div id="ms_detail" class="muted">—</div>
    </div>

    <details class="settings">
      <summary>3-Card Bonus Paytable</summary>
      <div class="muted">Based only on the 3 community cards. </div>
      <pre class="mono" style="white-space:pre-wrap;margin-top:8px;">
Straight Flush 40:1
Three of a Kind 30:1
Straight 6:1
Flush 3:1
Pair 1:1
      </pre>
    </details>
  `;

  const el = {
    ante: mountEl.querySelector("#ms_ante"),
    bonus3: mountEl.querySelector("#ms_bonus3"),
    deal: mountEl.querySelector("#ms_deal"),
    player: mountEl.querySelector("#ms_player"),
    comm: mountEl.querySelector("#ms_comm"),
    actions: mountEl.querySelector("#ms_actions"),
    result: mountEl.querySelector("#ms_result"),
    detail: mountEl.querySelector("#ms_detail"),
  };

  let state = newMissStudState();
  let currentRound = null;

  const paytable = DEFAULT_MAIN_PAYTABLE;
  const bonus3table = DEFAULT_3CARD_BONUS;

  function phaseStreet(phase) {
      if (phase === "STREET3") return 3;
      if (phase === "STREET4") return 4;
      if (phase === "STREET5") return 5;
      return null;
    }

    function streetLabel() {
      const s = phaseStreet(state.phase);
      return s ? `Street ${s}` : state.phase;
    }


  function render() {
    // player cards always shown once dealt
    el.player.innerHTML = "";
    if (state.hole.length) renderCards(el.player, state.hole);

    // community: show face-down placeholders for unrevealed
    // community: show revealed face-up + unrevealed as true card backs
    el.comm.innerHTML = "";

    const revealedCards = state.community.slice(0, state.revealed);
    if (revealedCards.length) {
      renderCards(el.comm, revealedCards);
    }

    const remaining = 3 - state.revealed;
    if (remaining > 0) {
      const backWrap = document.createElement("div");
      renderCardBack(backWrap, remaining);
      el.comm.append(...backWrap.childNodes);
    }


    renderActions();
  }

    function renderActions() {
      el.actions.innerHTML = "";

      // No actions unless we're on a betting street
      const s = phaseStreet(state.phase);
      if (!s) return;

      const makeBtn = (label, cls, onClick) => {
        const b = document.createElement("button");
        b.textContent = label;
        b.className = cls || "";
        b.addEventListener("click", onClick);
        return b;
      };

      el.actions.appendChild(makeBtn("Fold", "danger", async () => {
        fold(state);
        await finishHand();
      }));

      [1,2,3].forEach(m => {
        el.actions.appendChild(makeBtn(`Bet ${m}x`, "ok", async () => {
          await doStreetBet(s, m); // s is locked to current phase
        }));
      });

      // helpful hint
      el.detail.textContent = `Choose Fold or Bet (${streetLabel()}).`;
    }


    async function doStreetBet(street, mult) {
      if (!currentRound) throw new Error("No active round. Click Deal.");

      // Validate the phase BEFORE charging any chips
      const expected = phaseStreet(state.phase);
      if (expected !== street) {
        throw new Error(`Wrong phase. Expected Street ${expected}, got Street ${street}.`);
      }

      const amt = state.ante * Number(mult);

      // Charge only after validation
      await store.placeBet(currentRound.id, `MISSSTUD:STREET${street}`, amt);

      // Advance game state (reveals next card / updates phase)
      placeStreetBet(state, street, mult);
      render();

      // If we reached showdown, settle immediately
      if (state.phase === "SHOWDOWN") {
        settle(state, paytable, bonus3table);
        await finishHand();
      }
    }


 async function finishHand() {
  if (!currentRound) return;

  try {
    if (state.result?.outcome === "FOLD") {
      el.result.textContent = "Fold";
      el.detail.textContent = "All wagers lose.";
      await store.closeRound(currentRound.id);
      await store.uiRefresh?.();
      return;
    }

    const r = state.result;
    if (!r) return;

    if (r.main.type === "WIN") {
      await store.settle(currentRound.id, "MISSSTUD:MAIN", "WIN", r.payoutMain, 0);
    } else if (r.main.type === "PUSH") {
      await store.settle(currentRound.id, "MISSSTUD:MAIN", "PUSH", 0, r.totalMainBets);
    } else {
      await store.settle(currentRound.id, "MISSSTUD:MAIN", "LOSE", 0, 0);
    }

    if (state.bonus3 > 0) {
      if (r.bonus.win) {
        await store.settle(currentRound.id, "MISSSTUD:BONUS3", "WIN", r.payoutBonus, 0);
      } else {
        await store.settle(currentRound.id, "MISSSTUD:BONUS3", "LOSE", 0, 0);
      }
    }

    await store.closeRound(currentRound.id);
    await store.uiRefresh?.();

    el.result.textContent = `${r.main.label}`;
    el.detail.textContent = `Best 5-card hand: ${r.best.handName}. Bonus: ${state.bonus3>0 ? r.bonus.label : "—"}`;
  } finally {
    // HARD END OF HAND
    state.phase = "RESOLVED";
    currentRound = null;
    render();
  }
}


  el.deal.addEventListener("click", async () => {
    try {
      if (!store.currentPlayerId) throw new Error("Select a player first.");

      const ante = Math.floor(Number(el.ante.value));
      const bonus3 = Math.floor(Number(el.bonus3.value || 0));

      if (!Number.isFinite(ante) || ante <= 0) throw new Error("Enter a valid Ante.");
      if (!Number.isFinite(bonus3) || bonus3 < 0) throw new Error("Enter a valid Bonus wager.");

      currentRound = await store.startRound("MISSSTUD");

      // bets: ante always, optional bonus
      await store.placeBet(currentRound.id, "MISSSTUD:ANTE", ante);
      if (bonus3 > 0) await store.placeBet(currentRound.id, "MISSSTUD:BONUS3", bonus3);

      startHand(state, { ante, bonus3 });
      render();

      el.result.textContent = "—";
      el.detail.textContent = "Choose Fold or Bet (Street 3).";
    } catch (e) {
      alert(e.message);
    }
  });

  render();
}
