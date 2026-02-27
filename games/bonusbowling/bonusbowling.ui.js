// bonusbowling.ui.js
import {
  newBonusBowlingState,
  setBets,
  resolveFrame,
  BET_TYPES,
  PAYTABLE,
  setSession,
  startSession,
  applySessionTotals,
  advanceSessionFrame,
} from "./bonusbowling.engine.js";

function fmt(n) {
  return new Intl.NumberFormat().format(n);
}

const BET_LABEL = {
  RANGE_0_3: "0–3 Total",
  RANGE_4_6: "4–6 Total",
  RANGE_7_9: "7–9 Total",
  SPARE: "Spare",
  STRIKE: "Strike",
};

export function mountBonusBowling(rootEl, store) {
  let state = newBonusBowlingState();

  async function bal() {
    if (!store.currentPlayerId) return 0;
    return await store.balance(store.currentPlayerId);
  }

  async function paint() {
    const b = await bal();

    const isBetting = state.phase === "BETTING";
    const isResult = state.phase === "RESULT";
    const golden = state.frameNumber % 3 === 0;

    rootEl.innerHTML = `
      <div class="atw-wrap">
        <div class="atw-top">
          <div>
            <div class="atw-title">Bonus Bowling</div>
            <div class="atw-msg">${state.message}</div>
          </div>
          <div class="atw-balance">Balance: ${fmt(b)}</div>
        </div>

        <div class="atw-card">
          <div class="atw-meter">
            <div class="atw-badges">
              <div class="atw-badge">FRAME ${state.frameNumber}</div>
              <div class="atw-badge">${golden ? "GOLDEN FRAME (1/3)" : "NORMAL FRAME"}</div>
            </div>
          </div>

          <div style="margin-top:10px;" class="atw-reveal">
            <div><b>Rule:</b> if this is a Golden Frame and the bowler throws a STRIKE, bonus pays <b>10× total bet</b> (for-one), regardless of what you bet.</div>
          </div>
        </div>

        <div class="bb-session">
  <div class="bb-sessionRow">
    <label><input id="bbSessionOn" type="checkbox" ${state.sessionMode ? "checked" : ""}/> Session mode</label>
    <label class="mono">Frames:
      <input id="bbSessionFrames" type="number" min="1" max="100" value="${state.sessionFrames}" style="max-width:90px;">
    </label>
    <button id="bbStartSession" class="btnBig">Start Session</button>
  </div>

  <div class="bb-sessionStats mono">
    <div>Session Frame: ${state.sessionMode ? `${state.sessionFrameIndex}/${state.sessionFrames}` : "—"}</div>
    <div>Session Bet: ${fmt(state.sessionTotalBet)}</div>
    <div>Session Win: +${fmt(state.sessionTotalWin)}</div>
    <div>Session Net: ${fmt(state.sessionTotalWin - state.sessionTotalBet)}</div>
  </div>
</div>

        <div class="atw-grid">
          <div class="atw-card">
            <div class="atw-badge">PLACE BETS (for-one)</div>
            <div style="margin-top:10px; display:grid; gap:10px;">
              ${BET_TYPES.map(
                (t) => `
                <div style="display:flex; align-items:center; justify-content:space-between; gap:10px;">
                  <div style="font-weight:900;">${BET_LABEL[t]} <span style="opacity:.7; font-size:12px;">(${PAYTABLE[t]}:1)</span></div>
                  <input data-bet="${t}" type="number" min="0" value="${state.bets[t] || 0}" ${!isBetting ? "disabled" : ""} style="max-width:160px;">
                </div>
              `,
              ).join("")}
            </div>

            <div style="margin-top:12px;" class="atw-actions">
              <button id="btnRoll" class="btnBig" ${!isBetting ? "disabled" : ""}>Roll Frame</button>
              <button id="btnNext" class="btnBig" ${!isResult ? "disabled" : ""}>Next Frame</button>
            </div>

            <div class="bb-laneWrap">
  <div id="bbLane" class="bb-lane">
    <div id="bbBall" class="bb-ball"></div>
    <div id="bbPins" class="bb-pins">
      ${Array.from({ length: 10 })
        .map((_, i) => `<div class="bb-pin" data-pin="${i}"></div>`)
        .join("")}
    </div>
  </div>
  <div class="mono" style="opacity:.85;">Animation matches the frame outcome.</div>
</div>

            <div style="margin-top:10px;" class="atw-reveal">
              <div><b>Total Bet:</b> ${fmt(isResult ? state.totalBet : sumInputs(rootEl))}</div>
              <div><b>Total Win:</b> ${isResult ? `+${fmt(state.totalPayout)}` : "—"}</div>
              ${isResult && state.goldenBonus > 0 ? `<div><b>Golden Bonus:</b> +${fmt(state.goldenBonus)}</div>` : ""}
            </div>
          </div>

          <div class="atw-card">
            <div class="atw-badge">RESULT</div>
            ${isResult ? renderResult(state) : `<div style="opacity:.8; margin-top:10px;">Roll to see the bowler’s frame.</div>`}
          </div>
        </div>
      </div>

      <div class="bb-history mono">
  ${state.sessionLog
    .slice(-10)
    .map((x) => {
      const tag = x.isGolden ? "GOLD" : "NORM";
      const k = x.kind === "OPEN" ? `OPEN ${x.total}` : x.kind;
      return `<div>F${x.frame} [${tag}] ${k} | bet ${fmt(x.bet)} | win +${fmt(x.win)} ${x.goldenBonus ? `(bonus +${fmt(x.goldenBonus)})` : ""}</div>`;
    })
    .join("")}
</div>
    `;

    bind();
  }

  function sumInputs(container) {
    // during betting view, rootEl has inputs; sum quickly
    const inputs = container.querySelectorAll?.("input[data-bet]") || [];
    let s = 0;
    for (const i of inputs) s += Math.max(0, Math.floor(Number(i.value) || 0));
    return s;
  }

  function renderResult(s) {
    const r = s.roll;
    const kind =
      r.kind === "STRIKE"
        ? "STRIKE"
        : r.kind === "SPARE"
          ? "SPARE"
          : `OPEN (${r.total})`;
    const lines =
      s.settlements
        ?.map((x) => {
          const win = x.win ? `WIN +${fmt(x.payout)}` : "LOSE";
          return `<div class="mono">${BET_LABEL[x.betType]} — bet ${fmt(x.amount)} @ ${x.winMult}:1 → ${win}</div>`;
        })
        .join("") || "";

    return `
      <div style="margin-top:10px;">
        <div style="font-size:22px; font-weight:1000;">${kind}</div>
        <div class="mono" style="opacity:.85;">Pins: ${r.p1} + ${r.p2}</div>
      </div>
      <div style="margin-top:10px;" class="atw-log mono">${lines || "No bets placed."}</div>
    `;
  }

  function bind() {
    // live update bets
    rootEl.querySelectorAll("input[data-bet]")?.forEach((inp) => {
      inp.addEventListener("input", () => {
        const betType = inp.getAttribute("data-bet");
        const val = Math.max(0, Math.floor(Number(inp.value) || 0));
        state = setBets(state, { [betType]: val });
      });
    });

    rootEl.querySelector("#bbSessionOn")?.addEventListener("change", (e) => {
      state = setSession(state, {
        enabled: e.target.checked,
        frames: state.sessionFrames,
      });
      paint();
    });

    rootEl.querySelector("#bbSessionFrames")?.addEventListener("input", (e) => {
      state = setSession(state, {
        enabled: state.sessionMode,
        frames: e.target.value,
      });
    });

    rootEl
      .querySelector("#bbStartSession")
      ?.addEventListener("click", async () => {
        state = startSession(state);
        await paint();
      });

    rootEl.querySelector("#btnRoll")?.addEventListener("click", async () => {
      if (!store.currentPlayerId) return alert("Select a player first.");

      // finalize bets from inputs
      const bets = {};
      for (const t of BET_TYPES) {
        const v = Math.max(
          0,
          Math.floor(
            Number(rootEl.querySelector(`input[data-bet="${t}"]`)?.value || 0),
          ),
        );
        bets[t] = v;
      }
      state = setBets(state, bets);

      const total = Object.values(state.bets).reduce((a, x) => a + x, 0);
      if (total <= 0) return alert("Enter at least one bet amount.");

      // One frame = one round
      const round = await store.startRound("BONUSBOWL");

      // Place each non-zero bet as its own betType
      try {
        for (const [betType, amt] of Object.entries(state.bets)) {
          if (amt > 0) await store.placeBet(round.id, betType, amt);
        }
      } catch (e) {
        return alert(e.message);
      }

      // Resolve
      state = resolveFrame(state);
      state = applySessionTotals(state);

      // Settle each wager (for-one profit only, returnedStake=0)
      for (const s of state.settlements || []) {
        if (s.amount <= 0) continue;
        const outcome = s.win ? "WIN" : "LOSE";
        await store.settle(round.id, s.betType, outcome, s.payout, 0);
      }

      // Golden bonus (separate settlement line for clarity)
      if (state.goldenBonus > 0) {
        await store.settle(
          round.id,
          "GOLDEN_BONUS",
          "STRIKE_GOLDEN_BONUS",
          state.goldenBonus,
          0,
        );
      }

      await store.closeRound(round.id);
      await store.uiRefresh();
      await paint();
      requestAnimationFrame(() =>
        runBowlingAnimation(state.roll, state.isGolden),
      );
    });

    rootEl.querySelector("#btnNext")?.addEventListener("click", async () => {
      state = advanceSessionFrame(state);
      await paint();
    });
  }

  paint();

  function resetPins(pinsEl) {
    pinsEl.classList.remove("flash");
    pinsEl
      .querySelectorAll(".bb-pin")
      .forEach((p) => p.classList.remove("down"));
  }

  function knockPins(pinsEl, count) {
    // knock first N pins (simple + deterministic)
    const pins = Array.from(pinsEl.querySelectorAll(".bb-pin"));
    for (let i = 0; i < Math.min(count, pins.length); i++) {
      pins[i].classList.add("down");
    }
  }

  function runBowlingAnimation(roll, isGolden) {
    const lane = rootEl.querySelector("#bbLane");
    const ball = rootEl.querySelector("#bbBall");
    const pins = rootEl.querySelector("#bbPins");
    const laneRect = lane.getBoundingClientRect();
    const pinsRect = pins.getBoundingClientRect();

    // travel so the ball ends near the pins
    const travelX = Math.max(200, Math.floor(laneRect.width - 180));
    lane.style.setProperty("--bbTravelX", `${travelX}px`);

    if (!lane || !ball || !pins || !roll) return;

    // reset visuals
    lane.classList.remove("play", "gold");
    ball.classList.remove("roll");
    resetPins(pins);

    if (isGolden) lane.classList.add("gold");

    // start roll
    // trigger reflow so animation restarts reliably
    void ball.offsetWidth;
    ball.classList.add("roll");
    lane.classList.add("play");

    // decide pinfall after ball "arrives"
    const arriveMs = 900;

    setTimeout(() => {
      if (roll.kind === "STRIKE") {
        knockPins(pins, 10);
        pins.classList.add("flash");
        setTimeout(() => pins.classList.remove("flash"), 250);
        return;
      }

      if (roll.kind === "SPARE") {
        // first ball: leave 2 pins, second clears
        knockPins(pins, 8);
        setTimeout(() => knockPins(pins, 10), 400);
        return;
      }

      // OPEN: knock down roughly total pins (cap 9)
      const knocked = Math.max(0, Math.min(9, roll.total));
      knockPins(pins, knocked);
    }, arriveMs);
  }
}
