// games/freebetbj/freebetbj.ui.js
import { renderCards, renderCardBack } from "../../core/cards.js";
import {
  dealFreeBetBJRound,
  handTotals,
  getActiveHand,
  canHit,
  canStand,
  canDoublePaid,
  canDoubleFree,
  canSplitPaid,
  canSplitFree,
  hit,
  stand,
  doublePaid,
  doubleFree,
  splitPaid,
  splitFree,
  dealerPlay,
  settleFreeBetBJ,
} from "./freebetbj.engine.js";

import {
  loadFreeBetPayouts,
  saveFreeBetPayouts,
  payoutsTemplateHTML,
} from "./freebetbj.payouts.js";

export function mountFreeBetBJ(mountEl, store) {
  mountEl.innerHTML = `
    <h2>Free Bet Blackjack</h2>
    <p class="help">
      6D • H17 • BJ 3:2 • DAS • Re-split to 4 hands • No surrender • Dealer pushes on 22.
      Free Double: hard 9/10/11. Free Split: any pair except 10-value.
    </p>

    <div class="s21-wrap">
      <div class="s21-top">
        <div class="s21-controls">
          <input id="fb_wager" type="number" min="1" step="1" placeholder="Main wager" />
          <input id="fb_pog" type="number" min="0" step="1" placeholder="Pot of Gold (optional)" />
          <button id="fb_deal">Deal</button>
        </div>
        <div class="s21-msg">
          <div class="muted" id="fb_msg">—</div>
        </div>
      </div>

      <div class="s21-area">
        <div class="s21-title">Dealer</div>
        <div id="fb_dealer" class="s21-cards"></div>
        <div id="fb_dtotal" class="muted">—</div>
      </div>

      <div class="s21-area">
        <div class="s21-title">Player Hands</div>
        <div id="fb_hands" class="s21-hands"></div>
      </div>

      <div class="row" id="fb_actions"></div>

      <div class="resultBox">
        <div class="label">Result</div>
        <div id="fb_result" class="value">—</div>
        <div id="fb_detail" class="muted">—</div>
      </div>

      <details class="settings">
        <summary>Rules / Payout Settings</summary>
        ${payoutsTemplateHTML()}
        <button id="fb_savePayouts">Save Settings</button>
      </details>
    </div>
  `;

  const el = {
    wager: mountEl.querySelector("#fb_wager"),
    pog: mountEl.querySelector("#fb_pog"),
    deal: mountEl.querySelector("#fb_deal"),

    dealer: mountEl.querySelector("#fb_dealer"),
    dtotal: mountEl.querySelector("#fb_dtotal"),

    hands: mountEl.querySelector("#fb_hands"),
    actions: mountEl.querySelector("#fb_actions"),

    msg: mountEl.querySelector("#fb_msg"),
    result: mountEl.querySelector("#fb_result"),
    detail: mountEl.querySelector("#fb_detail"),

    savePayouts: mountEl.querySelector("#fb_savePayouts"),

    h17: mountEl.querySelector("#fb_h17"),
    pogEnabled: mountEl.querySelector("#fb_pog_enabled"),
    pog7: mountEl.querySelector("#fb_pog_7"),
    pog6: mountEl.querySelector("#fb_pog_6"),
    pog5: mountEl.querySelector("#fb_pog_5"),
    pog4: mountEl.querySelector("#fb_pog_4"),
    pog3: mountEl.querySelector("#fb_pog_3"),
    pog2: mountEl.querySelector("#fb_pog_2"),
    pog1: mountEl.querySelector("#fb_pog_1"),
  };

  let state = {
    roundId: null,
    live: null,
    payouts: null,
    roundComplete: false,
  };

  const num = (v) => Math.floor(Number(v || 0));

  function setActions(btns) {
    el.actions.innerHTML = "";
    for (const b of btns) {
      const btn = document.createElement("button");
      btn.textContent = b.label;
      if (b.kind) btn.className = b.kind;
      btn.disabled = !!b.disabled;
      btn.addEventListener("click", b.onClick);
      el.actions.appendChild(btn);
    }
  }

  function finishBlackjackHandIfNeeded(live) {
    if (!live || live.status !== "PLAYER_TURN") return false;
    const h = getActiveHand(live);
    if (!h || h.finished) return false;

    const t = handTotals(h.cards);
    if (!(t.isBlackjack && h.cards.length === 2)) return false;

    h.finished = true;
    h.outcome = "BJ";

    const next = live.hands.findIndex((hh) => !hh.finished);
    if (next >= 0) {
      live.active = next;
    } else {
      live.status = "DEALER_TURN";
    }
    return true;
  }

  // AUTO-APPLY FREE SPLITS / FREE DOUBLES
  function autoApplyFreeActions() {
    const live = state.live;
    if (!live) return false;

    let changed = false;
    let safety = 0;

    while (live.status === "PLAYER_TURN" && safety < 50) {
      safety++;

      // Auto-finish natural blackjacks first
      if (finishBlackjackHandIfNeeded(live)) {
        changed = true;
        continue;
      }

      // Priority 1: free split first
      if (canSplitFree(live)) {
        splitFree(live);
        changed = true;
        continue;
      }

      // Priority 2: free double
      if (canDoubleFree(live)) {
        doubleFree(live);
        changed = true;
        continue;
      }

      break;
    }

    return changed;
  }

  function renderDealer() {
    if (!state.live) {
      el.dealer.innerHTML = "";
      el.dtotal.textContent = "—";
      return;
    }
    const live = state.live;
    const faceDown = live.status !== "DONE";
    if (faceDown) {
      el.dealer.innerHTML = "";
      const up = document.createElement("div");
      const hole = document.createElement("div");
      renderCards(up, [live.dealer[0]], false);
      renderCardBack(hole, 1);
      el.dealer.appendChild(up);
      el.dealer.appendChild(hole);
      el.dtotal.textContent = "Upcard shown";
    } else {
      renderCards(el.dealer, live.dealer, false);
      const dt = handTotals(live.dealer);
      el.dtotal.textContent = dt.isBlackjack ? "BJ" : String(dt.best);
    }
  }

  function makeTokenBadge(text) {
    const badge = document.createElement("span");
    badge.className = "chip";
    badge.style.display = "inline-block";
    badge.style.marginLeft = "6px";
    badge.style.padding = "2px 8px";
    badge.style.border = "1px solid #d4af37";
    badge.style.borderRadius = "999px";
    badge.style.fontSize = "12px";
    badge.style.fontWeight = "700";
    badge.style.background = "rgba(212,175,55,.15)";
    badge.style.color = "#d4af37";
    badge.textContent = text;
    return badge;
  }

  function renderHands() {
    el.hands.innerHTML = "";
    if (!state.live) return;

    const live = state.live;

    for (let i = 0; i < live.hands.length; i++) {
      const h = live.hands[i];
      const wrap = document.createElement("div");
      wrap.className = "s21-hand" + (i === live.active ? " is-active" : "");

      const t = handTotals(h.cards);

      const title = document.createElement("div");
      title.className = "muted";

      const titleText = document.createElement("span");
      titleText.textContent =
        `Hand ${h.id}` +
        (h.finished ? ` • ${h.outcome || ""}` : "") +
        ` • Total: ${t.isBlackjack ? "BJ" : t.best}`;

      title.appendChild(titleText);

      // Token / marker badges by hand
      if (!h.stakePaid) {
        title.appendChild(makeTokenBadge("FREE SPLIT TOKEN"));
      }
      if (h.freeDouble) {
        title.appendChild(makeTokenBadge("FREE DOUBLE TOKEN"));
      }
      if (h.paidDouble) {
        title.appendChild(makeTokenBadge("PAID DOUBLE"));
      }

      const cards = document.createElement("div");
      cards.className = "s21-cards";
      renderCards(cards, h.cards, false);

      wrap.appendChild(title);
      wrap.appendChild(cards);

      if (live.status === "PLAYER_TURN" && !h.finished) {
        wrap.style.cursor = "pointer";
        wrap.addEventListener("click", async () => {
          live.active = i;
          autoApplyFreeActions();
          await maybeResolveRound();
          render();
        });
      }

      el.hands.appendChild(wrap);
    }

    el.msg.textContent = `Tokens used: ${live.tokensUsed} (Pot of Gold uses this count)`;
  }

  function render() {
    renderDealer();
    renderHands();

    if (state.roundComplete) {
      setActions([
        {
          label: "Press Deal to start next round",
          disabled: true,
          onClick: () => {},
        },
      ]);
      return;
    }

    if (!state.live) {
      el.result.textContent = "—";
      el.detail.textContent = "—";
      setActions([]);
      return;
    }

    const live = state.live;

    if (live.status !== "PLAYER_TURN") {
      setActions([]);
      return;
    }

    const h = getActiveHand(live);
    const t = handTotals(h.cards);

    if (h.finished) {
      setActions([]);
      return;
    }

    const btns = [
      {
        label: "Hit",
        onClick: async () => {
          try {
            hit(live);
            autoApplyFreeActions();
            await maybeResolveRound();
            render();
          } catch (e) {
            alert(e.message);
          }
        },
      },
      {
        label: "Stand",
        onClick: async () => {
          try {
            stand(live);
            autoApplyFreeActions();
            await maybeResolveRound();
            render();
          } catch (e) {
            alert(e.message);
          }
        },
      },
      {
        label: "Double (Paid)",
        kind: "ok",
        disabled: !canDoublePaid(live),
        onClick: async () => {
          try {
            await doublePaid(store, state.roundId, live);
            autoApplyFreeActions();
            await maybeResolveRound();
            render();
          } catch (e) {
            alert(e.message);
          }
        },
      },
      {
        label: "Split (Paid)",
        disabled: !canSplitPaid(live),
        onClick: async () => {
          try {
            await splitPaid(store, state.roundId, live);
            autoApplyFreeActions();
            await maybeResolveRound();
            render();
          } catch (e) {
            alert(e.message);
          }
        },
      },
    ];

    el.result.textContent = "Your move";
    el.detail.textContent = t.isBlackjack
      ? "Blackjack checking..."
      : "Free splits/doubles will trigger automatically when available.";

    setActions(btns);
  }

  async function maybeResolveRound() {
    const live = state.live;
    if (!live) return;

    if (live.status === "DEALER_TURN") {
      dealerPlay(live);
      renderDealer();

      const out = await settleFreeBetBJ(store, state.roundId, live);
      el.result.textContent = out.title;
      el.detail.textContent = out.detail;

      setActions([
        {
          label: "Round Complete — Press Deal for Next Hand",
          disabled: true,
          onClick: () => {},
        },
      ]);

      state.roundComplete = true;
      state.roundId = null;
      live.status = "DONE";

      await store.uiRefresh?.();
    }
  }

  async function loadSettingsIntoUI() {
    const p = await loadFreeBetPayouts(store);
    state.payouts = p;

    el.h17.checked = !!p.dealerHitsSoft17;
    el.pogEnabled.checked = !!p.potGold?.enabled;

    const pt = p.potGold?.paytable || {};
    el.pog7.value = pt["7"] ?? 100;
    el.pog6.value = pt["6"] ?? 100;
    el.pog5.value = pt["5"] ?? 100;
    el.pog4.value = pt["4"] ?? 50;
    el.pog3.value = pt["3"] ?? 30;
    el.pog2.value = pt["2"] ?? 12;
    el.pog1.value = pt["1"] ?? 3;
  }

  el.savePayouts.addEventListener("click", async () => {
    try {
      const p = state.payouts || {};
      p.dealerHitsSoft17 = !!el.h17.checked;
      p.blackjackPays = "3:2";
      p.potGold = p.potGold || { enabled: true, paytable: {} };
      p.potGold.enabled = !!el.pogEnabled.checked;
      p.potGold.paytable = {
        0: 0,
        1: num(el.pog1.value),
        2: num(el.pog2.value),
        3: num(el.pog3.value),
        4: num(el.pog4.value),
        5: num(el.pog5.value),
        6: num(el.pog6.value),
        7: num(el.pog7.value),
      };
      await saveFreeBetPayouts(store, p);
      state.payouts = p;
      alert("Saved.");
    } catch (e) {
      alert(e.message);
    }
  });

  el.deal.addEventListener("click", async () => {
    try {
      const wager = num(el.wager.value);
      const potGold = num(el.pog.value);

      if (wager < 1) throw new Error("Enter a main wager >= 1.");

      const payouts = state.payouts || (await loadFreeBetPayouts(store));
      state.payouts = payouts;

      state.roundComplete = false;
      el.result.textContent = "—";
      el.detail.textContent = "—";

      const { roundId, live } = await dealFreeBetBJRound(store, {
        wager,
        potGold,
        payouts,
      });

      state.roundId = roundId;
      state.live = live;

      // AUTO-APPLY FREE ACTIONS IMMEDIATELY AFTER DEAL
      autoApplyFreeActions();
      await maybeResolveRound();

      el.result.textContent = "Dealt";
      el.detail.textContent = "Play your hand(s).";

      render();
      await store.uiRefresh?.();
    } catch (e) {
      alert(e.message);
    }
  });

  loadSettingsIntoUI().then(() => render());
}