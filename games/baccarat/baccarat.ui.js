// games/baccarat/baccarat.ui.js
import { renderCards } from "../../core/cards.js";
import { BAC_PAYOUTS } from "./baccarat.payouts.js";
import { newBaccaratShoe, dealBaccaratRound } from "./baccarat.engine.js";

function fmt(n){ return new Intl.NumberFormat().format(n); }

const BEAD_ROWS = 6;
const MAX_BEAD = 6 * 20; // 20 cols visible
const MAX_BIG  = 6 * 20;

function beadKey(w) {
  return w === "PLAYER" ? "P" : w === "BANKER" ? "B" : "T";
}

function loadJSON(s, fallback) {
  try { return JSON.parse(s); } catch { return fallback; }
}

// Big Road: streak columns; ties add a marker on last cell.
function bigRoadAdd(big, winner) {
  if (!big.length) big.push({ col:0, row:0, w:winner, ties:0 });
  const last = big[big.length - 1];

  if (winner === "TIE") {
    last.ties = (last.ties || 0) + 1;
    return;
  }

  if (last.w === winner) {
    // try to go down
    const nextRow = last.row + 1;
    const exists = big.some(x => x.col === last.col && x.row === nextRow);
    if (!exists && nextRow < BEAD_ROWS) {
      big.push({ col:last.col, row:nextRow, w:winner, ties:0 });
    } else {
      big.push({ col:last.col + 1, row:last.row, w:winner, ties:0 });
    }
  } else {
    // new column
    big.push({ col:last.col + 1, row:0, w:winner, ties:0 });
  }
}

export function mountBaccarat(mountEl, store) {
  mountEl.innerHTML = `
    <h2>Baccarat</h2>
    <p class="help">Player / Banker / Tie. Banker wins pay 1:1 minus commission. Includes Pairs, Panda 8, Dragon 7.</p>

    <div class="row">
      <input id="bac_p" type="number" min="0" step="1" placeholder="Player bet" />
      <input id="bac_b" type="number" min="0" step="1" placeholder="Banker bet" />
      <input id="bac_t" type="number" min="0" step="1" placeholder="Tie bet" />
      <button id="bac_deal" class="primary">Deal</button>
    </div>

    <div class="row">
      <input id="bac_pp" type="number" min="0" step="1" placeholder="Player Pair (opt)" />
      <input id="bac_bp" type="number" min="0" step="1" placeholder="Banker Pair (opt)" />
      <input id="bac_p8" type="number" min="0" step="1" placeholder="Panda 8 (opt)" />
      <input id="bac_d7" type="number" min="0" step="1" placeholder="Dragon 7 (opt)" />
    </div>

    <div class="row">
      <div class="pill">Shoe: <span id="bac_rem">—</span> cards</div>
      <div class="pill" id="bac_shuffle" style="display:none;">Shuffle on next hand</div>
      <details class="settings">
        <summary>Rules / Payouts</summary>
        <div class="mono" style="white-space:pre-wrap;margin-top:8px;">
MAIN:
Player: 1:1
Banker: 1:1 less ${(BAC_PAYOUTS.BANKER.commission*100).toFixed(0)}% commission
Tie: ${BAC_PAYOUTS.TIE.pay}:1

SIDES:
Player Pair: ${BAC_PAYOUTS.PLAYER_PAIR.pay}:1
Banker Pair: ${BAC_PAYOUTS.BANKER_PAIR.pay}:1
Panda 8: ${BAC_PAYOUTS.PANDA_8.pay}:1
Dragon 7: ${BAC_PAYOUTS.DRAGON_7.pay}:1
        </div>
      </details>
    </div>

    <div class="table">
      <div class="hand">
        <div class="handTitle">Player</div>
        <div id="bac_player_cards" class="cards"></div>
        <div class="muted" id="bac_ptotal">—</div>
      </div>
      <div class="hand">
        <div class="handTitle">Banker</div>
        <div id="bac_banker_cards" class="cards"></div>
        <div class="muted" id="bac_btotal">—</div>
      </div>
    </div>

    <div class="resultBox">
      <div class="label">Result</div>
      <div id="bac_result" class="value">—</div>
      <div id="bac_detail" class="muted">—</div>
    </div>

    <div class="row" style="gap:16px; align-items:flex-start;">
      <div class="card" style="flex:1;">
        <h3 style="margin:0 0 8px 0;">Bead Plate</h3>
        <div id="bac_bead" class="roadGrid"></div>
      </div>
      <div class="card" style="flex:1;">
        <h3 style="margin:0 0 8px 0;">Big Road</h3>
        <div id="bac_big" class="roadGrid"></div>
      </div>
    </div>
  `;

  const el = {
    p: mountEl.querySelector("#bac_p"),
    b: mountEl.querySelector("#bac_b"),
    t: mountEl.querySelector("#bac_t"),
    pp: mountEl.querySelector("#bac_pp"),
    bp: mountEl.querySelector("#bac_bp"),
    p8: mountEl.querySelector("#bac_p8"),
    d7: mountEl.querySelector("#bac_d7"),
    deal: mountEl.querySelector("#bac_deal"),

    pCards: mountEl.querySelector("#bac_player_cards"),
    bCards: mountEl.querySelector("#bac_banker_cards"),
    pTotal: mountEl.querySelector("#bac_ptotal"),
    bTotal: mountEl.querySelector("#bac_btotal"),

    rem: mountEl.querySelector("#bac_rem"),
    shuf: mountEl.querySelector("#bac_shuffle"),

    result: mountEl.querySelector("#bac_result"),
    detail: mountEl.querySelector("#bac_detail"),

    bead: mountEl.querySelector("#bac_bead"),
    big: mountEl.querySelector("#bac_big"),
  };

  // Persistent shoe (kept for session)
  let shoe = newBaccaratShoe({ decks: 8, cutCards: 52 });

  // Persist roads in settings if available
  let bead = [];
  let big = [];

  async function loadRoads() {
    try {
      const b1 = await store.getSetting?.("BAC_BEAD");
      const b2 = await store.getSetting?.("BAC_BIG");
      bead = b1 ? loadJSON(b1, []) : [];
      big  = b2 ? loadJSON(b2, []) : [];
    } catch {
      bead = []; big = [];
    }
  }

  async function saveRoads() {
    try {
      await store.setSetting?.("BAC_BEAD", JSON.stringify(bead.slice(-MAX_BEAD)));
      await store.setSetting?.("BAC_BIG", JSON.stringify(big.slice(-MAX_BIG)));
    } catch {}
  }

  function renderRoads() {
    // bead plate: chronological into 6 rows
    const cells = bead.slice(-MAX_BEAD);
    el.bead.innerHTML = "";
    const cols = Math.ceil(cells.length / BEAD_ROWS) || 1;
    el.bead.style.gridTemplateColumns = `repeat(${cols}, 22px)`;
    el.bead.style.gridTemplateRows = `repeat(${BEAD_ROWS}, 22px)`;

    for (let i=0;i<cols*BEAD_ROWS;i++){
      const div = document.createElement("div");
      div.className = "roadCell";
      const v = cells[i];
      if (v) div.classList.add(v === "P" ? "roadP" : v === "B" ? "roadB" : "roadT");
      el.bead.appendChild(div);
    }

    // big road
    el.big.innerHTML = "";
    const maxCol = big.reduce((m,x)=>Math.max(m,x.col),0);
    const bigCols = Math.max(1, Math.min(20, maxCol+1));
    el.big.style.gridTemplateColumns = `repeat(${bigCols}, 22px)`;
    el.big.style.gridTemplateRows = `repeat(${BEAD_ROWS}, 22px)`;

    // map for quick access
    const map = new Map(big.map(x => [`${x.col},${x.row}`, x]));
    for (let c=0;c<bigCols;c++){
      for (let r=0;r<BEAD_ROWS;r++){
        const div = document.createElement("div");
        div.className = "roadCell";
        const node = map.get(`${c},${r}`);
        if (node){
          div.classList.add(node.w === "PLAYER" ? "roadP" : "roadB");
          if (node.ties){
            div.innerHTML = `<span class="tieMark">${node.ties}</span>`;
          }
        }
        el.big.appendChild(div);
      }
    }
  }

  function updateShoeUI(outcome=null){
    el.rem.textContent = String(shoe.cards.length);
    el.shuf.style.display = shoe.needsShuffle ? "inline-flex" : "none";
  }

  function intVal(input) {
    const v = Math.floor(Number(input.value || 0));
    return Number.isFinite(v) && v > 0 ? v : 0;
  }

  async function placeOptional(roundId, betType, amt) {
    if (amt > 0) await store.placeBet(roundId, betType, amt);
  }

  function profitBanker(bet) {
    const net = bet * (1 - BAC_PAYOUTS.BANKER.commission);
    return Math.floor(net); // keep chips integer
  }

  async function onDeal() {
    try {
      if (!store.currentPlayerId) throw new Error("Select a player first.");

      const betP  = intVal(el.p);
      const betB  = intVal(el.b);
      const betT  = intVal(el.t);
      const betPP = intVal(el.pp);
      const betBP = intVal(el.bp);
      const betP8 = intVal(el.p8);
      const betD7 = intVal(el.d7);

      if ((betP + betB + betT + betPP + betBP + betP8 + betD7) <= 0) {
        throw new Error("Enter at least one bet.");
      }

      const round = await store.startRound("BACCARAT");

      // main
      await placeOptional(round.id, "PLAYER", betP);
      await placeOptional(round.id, "BANKER", betB);
      await placeOptional(round.id, "TIE", betT);

      // sides
      await placeOptional(round.id, "PLAYER_PAIR", betPP);
      await placeOptional(round.id, "BANKER_PAIR", betBP);
      await placeOptional(round.id, "PANDA_8", betP8);
      await placeOptional(round.id, "DRAGON_7", betD7);

      const out = dealBaccaratRound(shoe);

      // render cards
      el.pCards.innerHTML = "";
      el.bCards.innerHTML = "";
      renderCards(el.pCards, out.player, false);
      renderCards(el.bCards, out.banker, false);
      el.pTotal.textContent = `Total: ${out.pTotal}${out.natural ? " (Natural)" : ""}`;
      el.bTotal.textContent = `Total: ${out.bTotal}${out.natural ? " (Natural)" : ""}`;

      // roads
      bead.push(beadKey(out.winner));
      bigRoadAdd(big, out.winner);
      await saveRoads();
      renderRoads();

      // settle bets
      // Main rules:
      // - If winner PLAYER: PLAYER wins, BANKER loses, TIE loses
      // - If winner BANKER: BANKER wins (commission), PLAYER loses, TIE loses
      // - If winner TIE: TIE wins, PLAYER/BANKER push
      if (betP > 0) {
        if (out.winner === "PLAYER") await store.settle(round.id, "PLAYER", "WIN", betP * BAC_PAYOUTS.PLAYER.pay, 0);
        else if (out.winner === "TIE") await store.settle(round.id, "PLAYER", "PUSH", 0, betP);
        else await store.settle(round.id, "PLAYER", "LOSE", 0, 0);
      }

      if (betB > 0) {
        if (out.winner === "BANKER") await store.settle(round.id, "BANKER", "WIN", profitBanker(betB), 0);
        else if (out.winner === "TIE") await store.settle(round.id, "BANKER", "PUSH", 0, betB);
        else await store.settle(round.id, "BANKER", "LOSE", 0, 0);
      }

      if (betT > 0) {
        if (out.winner === "TIE") await store.settle(round.id, "TIE", "WIN", betT * BAC_PAYOUTS.TIE.pay, 0);
        else await store.settle(round.id, "TIE", "LOSE", 0, 0);
      }

      // Side bets:
      if (betPP > 0) {
        if (out.playerPair) await store.settle(round.id, "PLAYER_PAIR", "WIN", betPP * BAC_PAYOUTS.PLAYER_PAIR.pay, 0);
        else await store.settle(round.id, "PLAYER_PAIR", "LOSE", 0, 0);
      }
      if (betBP > 0) {
        if (out.bankerPair) await store.settle(round.id, "BANKER_PAIR", "WIN", betBP * BAC_PAYOUTS.BANKER_PAIR.pay, 0);
        else await store.settle(round.id, "BANKER_PAIR", "LOSE", 0, 0);
      }
      if (betP8 > 0) {
        if (out.panda8) await store.settle(round.id, "PANDA_8", "WIN", betP8 * BAC_PAYOUTS.PANDA_8.pay, 0);
        else await store.settle(round.id, "PANDA_8", "LOSE", 0, 0);
      }
      if (betD7 > 0) {
        if (out.dragon7) await store.settle(round.id, "DRAGON_7", "WIN", betD7 * BAC_PAYOUTS.DRAGON_7.pay, 0);
        else await store.settle(round.id, "DRAGON_7", "LOSE", 0, 0);
      }

      await store.closeRound(round.id);
      await store.uiRefresh?.();

      // result line
      const pieces = [];
      pieces.push(`Winner: ${out.winner}`);
      if (out.winner === "BANKER" && betB > 0) pieces.push(`Banker commission ${(BAC_PAYOUTS.BANKER.commission*100).toFixed(0)}%`);
      if (out.playerPair) pieces.push("Player Pair");
      if (out.bankerPair) pieces.push("Banker Pair");
      if (out.panda8) pieces.push("Panda 8");
      if (out.dragon7) pieces.push("Dragon 7");

      el.result.textContent = out.winner;
      el.detail.textContent = pieces.join(" • ");

      updateShoeUI(out);

    } catch (e) {
      alert(e.message);
    }
  }

  el.deal.addEventListener("click", onDeal);

  // init
  (async () => {
    await loadRoads();
    renderRoads();
    updateShoeUI();
  })();
}
