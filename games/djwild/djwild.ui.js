// games/djwild/djwild.ui.js
import { renderCards, renderCardBack } from "../../core/cards.js";
import { evalDJWild5 } from "./djwild.eval.js";
import {
  BLIND_PAYTABLE,
  TRIPS_PAYTABLE,
  BAD_BEAT_PAYTABLE,
  lookup,
} from "./djwild.payouts.js";
import { newDJState, dealDJ, foldDJ, playDJ } from "./djwild.engine.js";

function fmt(n) {
  return new Intl.NumberFormat().format(n);
}

export function mountDJWild(mountEl, store) {
  mountEl.innerHTML = `
    <h2>DJ Wild</h2>
    <p class="help">Beat the dealer with a higher 5-card hand. Deuces + Joker are wild.</p>

    <div class="row">
      <input id="dj_ante" type="number" min="1" step="1" placeholder="Ante" />
      <input id="dj_trips" type="number" min="0" step="1" placeholder="Trips (optional)" />
      <input id="dj_bb" type="number" min="0" step="1" placeholder="Bad Beat (optional)" />
      <button id="dj_deal" class="primary">Deal</button>
    </div>

    <div class="table">
      <div class="hand">
        <div class="handTitle">Player</div>
        <div id="dj_player" class="cards"></div>
      </div>

      <div class="hand">
        <div class="handTitle">Dealer</div>
        <div id="dj_dealer" class="cards"></div>
      </div>
    </div>

    <div class="row" id="dj_actions"></div>

    <div class="resultBox">
      <div class="label">Result</div>
      <div id="dj_result" class="value">—</div>
      <div id="dj_detail" class="muted">—</div>
    </div>

    <details class="settings">
      <summary>Paytables</summary>
      <div class="mono" style="white-space:pre-wrap;margin-top:8px;">
BLIND (when Player wins; otherwise PUSH):
${BLIND_PAYTABLE.map(([k, p]) => `${k.padEnd(16)} ${p ? `${p}:1` : "PUSH"}`).join("\n")}

TRIPS (Wild vs Natural):
${TRIPS_PAYTABLE.map(([k, o]) => `${k.padEnd(16)} Wild ${String(o.wild).padStart(4)}:1   Natural ${String(o.natural).padStart(4)}:1`).join("\n")}

TWO-WAY BAD BEAT (Trips+ loses):
${BAD_BEAT_PAYTABLE.map(([k, p]) => `${k.padEnd(16)} ${p}:1`).join("\n")}
      </div>
    </details>
  `;

  const el = {
    ante: mountEl.querySelector("#dj_ante"),
    trips: mountEl.querySelector("#dj_trips"),
    bb: mountEl.querySelector("#dj_bb"),
    deal: mountEl.querySelector("#dj_deal"),
    player: mountEl.querySelector("#dj_player"),
    dealer: mountEl.querySelector("#dj_dealer"),
    actions: mountEl.querySelector("#dj_actions"),
    result: mountEl.querySelector("#dj_result"),
    detail: mountEl.querySelector("#dj_detail"),
  };

  let state = newDJState();
  let round = null;

  function setActions(btns) {
    el.actions.innerHTML = "";
    for (const b of btns) {
      const btn = document.createElement("button");
      btn.textContent = b.label;
      btn.className = b.cls || "";
      btn.disabled = !!b.disabled;
      btn.addEventListener("click", b.onClick);
      el.actions.appendChild(btn);
    }
  }

  function render() {
    // player always face up after deal
    el.player.innerHTML = "";
    if (state.player.length) renderCards(el.player, state.player, false);

    // dealer: face down until SHOW
    el.dealer.innerHTML = "";
    if (!state.dealer.length) {
      el.dealer.textContent = "";
    } else if (state.phase === "SHOW" || state.phase === "DONE") {
      renderCards(el.dealer, state.dealer, false);
    } else {
      renderCardBack(el.dealer, 5);
    }

    if (state.phase === "DECISION") {
      setActions([
        { label: "Fold", cls: "danger", onClick: onFold },
        { label: "Play (2x Ante)", cls: "primary", onClick: onPlay },
      ]);
    } else {
      setActions([]);
    }
  }

  async function onDeal() {
    try {
      if (!store.currentPlayerId) throw new Error("Select a player first.");

      const ante = Math.floor(Number(el.ante.value));
      const trips = Math.floor(Number(el.trips.value || 0));
      const bb = Math.floor(Number(el.bb.value || 0));

      if (!Number.isFinite(ante) || ante <= 0)
        throw new Error("Enter a valid Ante.");
      if (!Number.isFinite(trips) || trips < 0)
        throw new Error("Trips must be 0 or more.");
      if (!Number.isFinite(bb) || bb < 0)
        throw new Error("Bad Beat must be 0 or more.");

      round = await store.startRound("DJWILD");

      // Ante + Blind are required and equal (PDF)
      await store.placeBet(round.id, "ANTE", ante);
      await store.placeBet(round.id, "BLIND", ante);

      // optional side bets
      if (trips > 0) await store.placeBet(round.id, "TRIPS", trips);
      if (bb > 0) await store.placeBet(round.id, "BADBEAT", bb);

      dealDJ(state, ante, trips, bb);

      el.result.textContent = "Your decision";
      el.detail.textContent = "Fold or Play (2× Ante).";
      render();
    } catch (e) {
      alert(e.message);
    }
  }

  function compareHands(p, d) {
    if (p.score > d.score) return 1;
    if (p.score < d.score) return -1;
    return 0;
  }

  async function settleTrips(playerEval) {
    if (!state.trips || state.trips <= 0)
      return { didPay: false, msg: "Trips: —" };

    // Trips wins if Three-of-a-kind or better
    const qualifying = [
      "THREE_KIND",
      "STRAIGHT",
      "FLUSH",
      "FULL_HOUSE",
      "FOUR_KIND",
      "STRAIGHT_FLUSH",
      "FIVE_OF_KIND",
      "ROYAL_FLUSH",
      "FIVE_WILDS",
    ];
    if (!qualifying.includes(playerEval.key)) {
      await store.settle(round.id, "TRIPS", "LOSE", 0, 0);
      return { didPay: false, msg: "Trips: No pay" };
    }

    const row = TRIPS_PAYTABLE.find(([k]) => k === playerEval.key);
    const pays = row
      ? playerEval.isNaturalForTrips
        ? row[1].natural
        : row[1].wild
      : 0;

    if (pays > 0) {
      await store.settle(round.id, "TRIPS", "WIN", state.trips * pays, 0);
      return {
        didPay: true,
        msg: `Trips: ${playerEval.isNaturalForTrips ? "Natural" : "Wild"} ${pays}:1`,
      };
    }

    await store.settle(round.id, "TRIPS", "LOSE", 0, 0);
    return { didPay: false, msg: "Trips: No pay" };
  }

  async function settleBadBeat(playerEval, cmp) {
    if (!state.badbeat || state.badbeat <= 0)
      return { didPay: false, msg: "Bad Beat: —" };

    // Pays only if Trips+ LOSES to dealer (cmp === -1)
    const qualifying = [
      "THREE_KIND",
      "STRAIGHT",
      "FLUSH",
      "FULL_HOUSE",
      "FOUR_KIND",
      "STRAIGHT_FLUSH",
      "FIVE_OF_KIND",
      "ROYAL_FLUSH",
      "FIVE_WILDS",
    ];
    if (!(cmp === -1 && qualifying.includes(playerEval.key))) {
      await store.settle(round.id, "BADBEAT", "LOSE", 0, 0);
      return { didPay: false, msg: "Bad Beat: No pay" };
    }

    const pays = lookup(BAD_BEAT_PAYTABLE, playerEval.key);
    if (pays > 0) {
      await store.settle(round.id, "BADBEAT", "WIN", state.badbeat * pays, 0);
      return { didPay: true, msg: `Bad Beat: ${pays}:1` };
    }

    await store.settle(round.id, "BADBEAT", "LOSE", 0, 0);
    return { didPay: false, msg: "Bad Beat: No pay" };
  }

  async function onFold() {
    try {
      if (!round) return;

      // Folding ends the main wagers as losses
      foldDJ(state);

      // Evaluate player for side bets (Trips still based on player hand)
      const pEval = evalDJWild5(state.player);

      // Main game: lose ante + blind, no play
      await store.settle(round.id, "ANTE", "LOSE", 0, 0);
      await store.settle(round.id, "BLIND", "LOSE", 0, 0);

      // Trips resolves; BadBeat loses (no “losing to dealer” comparison)
      const tripsMsg = await settleTrips(pEval);
      if (state.badbeat > 0) {
        await store.settle(round.id, "BADBEAT", "LOSE", 0, 0);
      }

      await store.closeRound(round.id);
      await store.uiRefresh?.();

      el.result.textContent = "FOLD";
      el.detail.textContent = `Player: ${pEval.name}. ${tripsMsg.msg}.`;

      round = null;
      state.phase = "DONE";
      render();
    } catch (e) {
      alert(e.message);
    }
  }

  async function onPlay() {
    try {
      if (!round) return;

      // Take Play bet = 2x Ante
      playDJ(state);
      await store.placeBet(round.id, "PLAY", state.play);

      // Evaluate hands
      const pEval = evalDJWild5(state.player);
      const dEval = evalDJWild5(state.dealer);
      const wildInfo =
        `${pEval.wildNote ? ` | ${pEval.wildNote}` : ""}` +
        `${dEval.wildNote ? ` | Dealer ${dEval.wildNote}` : ""}`;

      const cmp = compareHands(pEval, dEval);

      // Side bets settle first (independent)
      const tripsRes = await settleTrips(pEval);

      // Main game settle
      if (cmp === 1) {
        // Player wins: Ante and Play pay 1:1; Blind pays paytable or PUSH
        await store.settle(round.id, "ANTE", "WIN", state.ante, 0);
        await store.settle(round.id, "PLAY", "WIN", state.play, 0);

        const blindPays = lookup(BLIND_PAYTABLE, pEval.key);
        if (blindPays > 0) {
          await store.settle(
            round.id,
            "BLIND",
            "WIN",
            state.blind * blindPays,
            0,
          );
        } else {
          await store.settle(round.id, "BLIND", "PUSH", 0, state.blind); // return stake
        }

        // Bad beat loses if player wins
        if (state.badbeat > 0)
          await store.settle(round.id, "BADBEAT", "LOSE", 0, 0);

        el.result.textContent = "PLAYER WINS";
        el.detail.textContent =
          `Player: ${pEval.name} vs Dealer: ${dEval.name}. ` +
          `Blind ${blindPays > 0 ? `${blindPays}:1` : "PUSH"}. ${tripsRes.msg}.` +
          (wildInfo ? ` ${wildInfo}` : "");
      } else if (cmp === 0) {
        // Push: return Ante, Blind, Play
        await store.settle(round.id, "ANTE", "PUSH", 0, state.ante);
        await store.settle(round.id, "BLIND", "PUSH", 0, state.blind);
        await store.settle(round.id, "PLAY", "PUSH", 0, state.play);

        // Bad beat loses on tie
        if (state.badbeat > 0)
          await store.settle(round.id, "BADBEAT", "LOSE", 0, 0);

        el.result.textContent = "PUSH";
        el.detail.textContent =
          `Player: ${pEval.name} ties Dealer: ${dEval.name}. ${tripsRes.msg}.` +
          (wildInfo ? ` ${wildInfo}` : "");
      } else {
        // Dealer wins: Ante, Blind, Play lose
        await store.settle(round.id, "ANTE", "LOSE", 0, 0);
        await store.settle(round.id, "BLIND", "LOSE", 0, 0);
        await store.settle(round.id, "PLAY", "LOSE", 0, 0);

        // Bad beat may pay if Trips+ loses
        const bbRes = await settleBadBeat(pEval, cmp);

        el.result.textContent = "DEALER WINS";
        el.detail.textContent =
          `Player: ${pEval.name} loses to Dealer: ${dEval.name}. ` +
          `${tripsRes.msg}. ${bbRes.msg}.` +
          (wildInfo ? ` ${wildInfo}` : "");
      }

      await store.closeRound(round.id);
      await store.uiRefresh?.();

      round = null;
      state.phase = "DONE";
      render();
    } catch (e) {
      alert(e.message);
    }
  }

  el.deal.addEventListener("click", onDeal);

  // initial view
  render();
}
