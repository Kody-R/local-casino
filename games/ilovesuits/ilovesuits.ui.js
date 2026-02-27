// games/ilovesuits/ilovesuits.ui.js
import { renderCards } from "../../core/cards.js";
import {
  dealILSRound,
  allowedPlayMultipliers,
  foldILS,
  playILS,
} from "./ilovesuits.engine.js";
import {
  loadILSPayouts,
  saveILSPayouts,
  payoutsTemplateHTML,
} from "./ilovesuits.payouts.js";

const SUIT_SYMBOL = { S: "♠", H: "♥", D: "♦", C: "♣" };
const VAL_TO_RANK = {
  14: "A",
  13: "K",
  12: "Q",
  11: "J",
  10: "10",
  9: "9",
  8: "8",
  7: "7",
  6: "6",
  5: "5",
  4: "4",
  3: "3",
  2: "2",
};

function formatFlushText(cards7, flushInfo) {
  if (!flushInfo || flushInfo.len === 0 || !flushInfo.suit) return "—";
  const suitSym = SUIT_SYMBOL[flushInfo.suit] ?? flushInfo.suit;

  // show up to 7 cards in that suit, high to low
  const ranks = flushInfo.idxSorted
    .map((idx) => cards7[idx])
    .map((c) => (c.r === "T" ? "10" : c.r));

  return `${suitSym} ${ranks.join("-")}`;
}

export function mountILoveSuits(mountEl, store) {
  mountEl.innerHTML = `
    <h2>I Luv Suits Poker</h2>
    <p class="help">
      Goal: make a flush with more cards than the dealer.
      Dealer qualifies with 3-card 9-high flush or better.
    </p>

    <div class="row">
      <input id="ils_ante" type="number" min="1" step="1" placeholder="Ante" />
      <input id="ils_fr" type="number" min="0" step="1" placeholder="Flush Rush (opt)" />
      <input id="ils_sfr" type="number" min="0" step="1" placeholder="Super Flush Rush (opt)" />
      <button id="ils_deal">Deal</button>
    </div>

    <div class="table">
      <div class="hand">
        <div class="handTitle">Player (7 cards)</div>
        <div id="ils_player" class="cards"></div>
        <div id="ils_info" class="muted">—</div>
      </div>

      <div class="hand">
        <div class="handTitle">Dealer (7 cards)</div>
        <div id="ils_dealer" class="cards"></div>
        <div id="ils_dinfo" class="muted">—</div>
      </div>
    </div>

    <div class="row" id="ils_actions"></div>

    <div class="resultBox">
      <div class="label">Result</div>
      <div id="ils_result" class="value">—</div>
      <div id="ils_detail" class="muted">—</div>
    </div>

    <details class="settings">
      <summary>Paytables (stored locally)</summary>
      ${payoutsTemplateHTML()}
      <button id="ils_savePayouts">Save Paytables</button>
    </details>
  `;

  const el = {
    ante: mountEl.querySelector("#ils_ante"),
    fr: mountEl.querySelector("#ils_fr"),
    sfr: mountEl.querySelector("#ils_sfr"),
    deal: mountEl.querySelector("#ils_deal"),

    p: mountEl.querySelector("#ils_player"),
    d: mountEl.querySelector("#ils_dealer"),
    info: mountEl.querySelector("#ils_info"),
    dinfo: mountEl.querySelector("#ils_dinfo"),

    actions: mountEl.querySelector("#ils_actions"),
    result: mountEl.querySelector("#ils_result"),
    detail: mountEl.querySelector("#ils_detail"),

    savePayouts: mountEl.querySelector("#ils_savePayouts"),
  };

  let state = { roundId: null, live: null };

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

  async function loadPayoutsIntoUI() {
    const p = await loadILSPayouts(store);
    p.bindInputs(mountEl);
  }

  el.savePayouts.addEventListener("click", async () => {
    await saveILSPayouts(store, mountEl);
    alert("Saved paytables.");
  });

  (async () => {
    await loadPayoutsIntoUI();
    renderCards(el.p, [], false);
    renderCards(el.d, [], false);
    setActions([]);
  })();

  el.deal.addEventListener("click", async () => {
    try {
      if (!store.currentPlayerId) throw new Error("Select a player first.");

      const ante = num(el.ante.value);
      const flushRush = num(el.fr.value);
      const superFlushRush = num(el.sfr.value);
      if (ante <= 0) throw new Error("Enter an Ante > 0.");

      const payouts = (await loadILSPayouts(store)).value;

      const { roundId, live } = await dealILSRound(store, {
        ante,
        flushRush,
        superFlushRush,
        payouts,
      });
      state.roundId = roundId;
      state.live = live;

      const hiP = new Set(live.pFlush.idxSorted); // highlight all suited cards
      renderCards(el.p, live.player, false, {
        highlightIdx: hiP,
        dimOthers: true,
      });
      renderCards(el.d, live.dealer, true); // hide dealer until finish

      const allowed = allowedPlayMultipliers(live.pFlush.len);

      el.info.textContent =
        `Best Flush: ${formatFlushText(live.player, live.pFlush)}  ` +
        `(${live.pFlush.len}-card).  Straight-flush run: ${live.pStraightFlushLen}.`;

      el.dinfo.textContent = `Dealer shown after resolution.`;

      if (allowed.length === 0) {
        el.result.textContent = "No 3-card flush";
        el.detail.textContent = "You must fold.";
        setActions([
          { label: "Fold", kind: "danger", onClick: async () => finishFold() },
        ]);
      } else {
        el.result.textContent = "Choose Play or Fold";
        el.detail.textContent = `Allowed Play: ${allowed.map((x) => `${x}x`).join(", ")}.`;
        setActions([
          { label: "Fold", kind: "danger", onClick: async () => finishFold() },
          ...allowed.map((mult) => ({
            label: `Play ${mult}x`,
            kind: "ok",
            onClick: async () => finishPlay(mult),
          })),
        ]);
      }

      await store.uiRefresh?.();
    } catch (e) {
      alert(e.message);
    }
  });

  async function finishFold() {
    const out = await foldILS(store, state.roundId, state.live);
    const hiD = new Set(state.live.dFlush.idxSorted);
    renderCards(el.d, state.live.dealer, false, {
      highlightIdx: hiD,
      dimOthers: true,
    });

    el.dinfo.textContent =
      `Dealer Flush: ${formatFlushText(state.live.dealer, state.live.dFlush)}  ` +
      `(${state.live.dFlush.len}-card).  Qualifies: ${state.live.dealerQualifies ? "Yes" : "No"}.`;

    el.result.textContent = out.title;
    el.detail.textContent = out.detail;
    setActions([]);
    state.roundId = null;
    state.live = null;
    await store.uiRefresh?.();
  }

  async function finishPlay(mult) {
    try {
      const out = await playILS(store, state.roundId, state.live, mult);
      const hiD = new Set(state.live.dFlush.idxSorted);
      renderCards(el.d, state.live.dealer, false, {
        highlightIdx: hiD,
        dimOthers: true,
      });

      el.dinfo.textContent =
        `Dealer Flush: ${formatFlushText(state.live.dealer, state.live.dFlush)}  ` +
        `(${state.live.dFlush.len}-card).  Qualifies: ${state.live.dealerQualifies ? "Yes" : "No"}.`;

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
}
