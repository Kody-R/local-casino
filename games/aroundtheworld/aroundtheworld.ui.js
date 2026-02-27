// aroundtheworld.ui.js
import {
  newATWState,
  startGame,
  guessHigherLower,
  beginNextLevel,
  cashOut,
  LEVEL_WIN_MULT,
} from "./aroundtheworld.engine.js";

function fmt(n) {
  return new Intl.NumberFormat().format(n);
}

export function mountAroundTheWorld(rootEl, store) {
  let state = newATWState();
  let round = null;

  async function bal() {
    if (!store.currentPlayerId) return 0;
    return await store.balance(store.currentPlayerId);
  }

  function canShowDecision() {
    // Rule 16: after reaching end of levels 1-3 with 0 or 1 strikes, can cash out or continue
    return (
      state.phase === "LEVEL_END" &&
      state.level >= 1 &&
      state.level <= 3 &&
      state.strikes <= 1
    );
  }

  function isOver() {
    return (
      state.phase === "GAME_OVER" ||
      state.phase === "CASHED" ||
      (state.phase === "LEVEL_END" && state.level === 4)
    );
  }

  function describeDraw(d) {
    if (!d) return "—";
    if (d.kind === "NUMBER") return `Number ${d.value}`;
    if (d.kind === "ADVANCE_ONE") return `Advance 1 step (free)`;
    if (d.kind === "ADVANCE_END") return `Advance to end of level`;
    if (d.kind === "STRIKE_REMOVED") return `Strike removed`;
    return d.kind;
  }

  function stepNodes() {
    const nodes = [];
    for (let i = 1; i <= 7; i++) {
      let cls = "atw-step";
      if (i < state.step) cls += " done";
      if (i === state.step) cls += " cur";
      nodes.push(`<div class="${cls}">${i}</div>`);
    }
    return nodes.join("");
  }

  function strikeLights() {
    const a = state.strikes >= 1 ? "on" : "";
    const b = state.strikes >= 2 ? "on" : "";
    return `
      <div class="atw-strikes" title="Strikes">
        <div class="atw-light ${a}"></div>
        <div class="atw-light ${b}"></div>
      </div>
    `;
  }

  function revealText() {
    if (state.phase === "BETTING") return "Start a level to begin.";
    if (state.phase === "PLAYING" && state.step === 1)
      return "First number drawn. Guess Higher or Lower.";
    if (state.lastDraw?.kind === "NUMBER" && state.lastWasCorrect === true)
      return `Correct — you advance.`;
    if (state.lastDraw?.kind === "NUMBER" && state.lastWasCorrect === false)
      return `Wrong — you advance but take a strike.`;
    if (state.lastDraw?.kind === "ADVANCE_ONE")
      return `Free advance one step (number stays the same).`;
    if (state.lastDraw?.kind === "ADVANCE_END")
      return `Jumped to step 7 (end of level).`;
    if (state.lastDraw?.kind === "STRIKE_REMOVED")
      return `Your strike was removed (no step advance).`;
    if (state.phase === "LEVEL_END") return `Level complete.`;
    if (state.phase === "GAME_OVER") return `Two strikes — game over.`;
    if (state.phase === "CASHED") return `Cashed out.`;
    return "—";
  }

  function levelEndPayoutPreview() {
    if (state.phase !== "LEVEL_END") return "—";
    const lvl = state.level;
    const strikes = state.strikes;

    if (lvl === 1 && strikes === 1)
      return `Push: +${fmt(state.levelBet)} (special Level 1 rule)`;
    if (strikes === 0)
      return `Win: +${fmt(Math.floor(LEVEL_WIN_MULT[lvl] * state.levelBet))} (${LEVEL_WIN_MULT[lvl]}x for-one)`;
    return `No win (keeps your balance as-is).`;
  }

  function renderLog(log) {
    return log
      .slice(-30)
      .map((x) => JSON.stringify(x))
      .join("\n");
  }

  async function paint() {
    const b = await bal();

    const isBetting = state.phase === "BETTING";
    const isPlaying = state.phase === "PLAYING";

    rootEl.innerHTML = `
      <div class="atw-wrap">
        <div class="atw-top">
          <div>
            <div class="atw-title">Around the World</div>
            <div class="atw-msg">${state.message}</div>
          </div>
          <div class="atw-balance">Balance: ${fmt(b)}</div>
        </div>

        <div class="atw-card">
          <div class="atw-meter">
            <div class="atw-badges">
              <div class="atw-badge">LEVEL ${state.level} / 4</div>
              <div class="atw-badge">STEP ${state.step} / 7</div>
              <div class="atw-badge">LEVEL BET: ${fmt(state.levelBet || 0)}</div>
            </div>
            ${strikeLights()}
          </div>

          <div style="margin-top:10px;" class="atw-steps">
            ${stepNodes()}
          </div>

          <div style="margin-top:12px;" class="atw-numberBox">
            <div>
              <div class="atw-sub">Current number</div>
              <div class="atw-number">${state.prevNumber ?? "—"}</div>
            </div>
            <div class="atw-reveal">
              <div><b>Last:</b> ${describeDraw(state.lastDraw)}</div>
              <div><b>Guess:</b> ${state.lastGuess ?? "—"} ${state.lastWasCorrect === true ? "✅" : state.lastWasCorrect === false ? "❌" : ""}</div>
              <div><b>Result:</b> ${revealText()}</div>
            </div>
          </div>
        </div>

        <div class="atw-grid">
          <div class="atw-card">
            <div class="atw-actions">
              <label class="atw-badge">WAGER</label>
              <input id="wager" type="number" min="1" value="${state.wager || 10}" ${!isBetting ? "disabled" : ""} style="max-width:140px;">
              <button id="btnStart" class="btnBig" ${!isBetting ? "disabled" : ""}>Start</button>

              <button id="btnHi" class="btnBig" ${!isPlaying ? "disabled" : ""}>Higher</button>
              <button id="btnLo" class="btnBig" ${!isPlaying ? "disabled" : ""}>Lower</button>
            </div>

            <div style="margin-top:10px;" class="atw-reveal">
              <div><b>Level outcome:</b> ${levelEndPayoutPreview()}</div>
            </div>

            <div style="margin-top:10px;" class="atw-actions">
              <button id="btnCash" class="btnBig" ${!canShowDecision() ? "disabled" : ""}>Cash Out</button>
              <button id="btnCont" class="btnBig" ${!canShowDecision() ? "disabled" : ""}>Continue (Bet Balance)</button>
            </div>

            <div style="margin-top:10px;" class="atw-sub">
              Note: all pays are <b>for-one</b> (wager not returned), except Level 1 “push” rule.
            </div>
          </div>

          <div class="atw-card">
            <div class="atw-badge">HISTORY</div>
            <pre class="atw-log mono">${renderLog(state.log)}</pre>
          </div>
        </div>
      </div>
    `;

    bind();
  }

  function bind() {
    rootEl.querySelector("#btnStart")?.addEventListener("click", async () => {
      if (!store.currentPlayerId) return alert("Select a player first.");

      const w = Math.floor(Number(rootEl.querySelector("#wager")?.value || 0));
      if (!Number.isFinite(w) || w <= 0)
        return alert("Enter a positive wager.");

      round = await store.startRound("ATW");

      try {
        await store.placeBet(round.id, "ATW_L1", w);
      } catch (e) {
        return alert(e.message);
      }

      state = startGame(state, w);
      await store.uiRefresh();
      await paint();
    });

    rootEl.querySelector("#btnHi")?.addEventListener("click", async () => {
      state = guessHigherLower(state, "HIGHER");
      await handleTerminalIfNeeded();
      await paint();
    });

    rootEl.querySelector("#btnLo")?.addEventListener("click", async () => {
      state = guessHigherLower(state, "LOWER");
      await handleTerminalIfNeeded();
      await paint();
    });

    rootEl.querySelector("#btnCash")?.addEventListener("click", async () => {
      if (!canShowDecision()) return;

      state = cashOut(state);
      await store.closeRound(round.id);
      await store.uiRefresh();
      await paint();
    });

    rootEl.querySelector("#btnCont")?.addEventListener("click", async () => {
      if (!canShowDecision()) return;

      const current = await bal();
      if (current <= 0) return alert("No balance to continue with.");

      try {
        await store.placeBet(round.id, `ATW_L${state.level + 1}`, current);
      } catch (e) {
        return alert(e.message);
      }

      state = beginNextLevel(state, current);
      await store.uiRefresh();
      await paint();
    });
  }

  async function handleTerminalIfNeeded() {
    if (!round) return;

    if (state.phase === "GAME_OVER") {
      await store.closeRound(round.id);
      await store.uiRefresh();
      return;
    }

    if (state.phase === "LEVEL_END") {
      const strikes = state.strikes;
      const lvl = state.level;

      let payout = 0;
      let outcome = "";

      // Level 1 special push with 1 strike
      if (lvl === 1 && strikes === 1) {
        payout = state.levelBet;
        outcome = "LEVEL1_PUSH_1_STRIKE";
      } else if (strikes === 0) {
        payout = Math.floor(LEVEL_WIN_MULT[lvl] * state.levelBet);
        outcome = `LEVEL${lvl}_WIN_${LEVEL_WIN_MULT[lvl]}x_FOR_ONE`;
      } else {
        outcome = `LEVEL${lvl}_END_${strikes}_STRIKE`;
      }

      if (payout > 0) {
        await store.settle(round.id, `ATW_L${lvl}`, outcome, payout, 0);
        await store.uiRefresh();
      }

      // if level 4 ends, round is over (no continue)
      if (lvl === 4) {
        await store.closeRound(round.id);
        await store.uiRefresh();
      }
    }
  }

  paint();
}
