// core/store.js
import { openDB, uuid, getAll, get, put, queryIndex, withTx } from "./db.js";

const ids = {
  newName: "#newName",
  btnCreate: "#btnCreate",
  playerSelect: "#playerSelect",
  btnSelect: "#btnSelect",
  selectedName: "#selectedName",
  chipBalance: "#chipBalance",
  grantAmount: "#grantAmount",
  btnGrant: "#btnGrant",
  ledgerList: "#ledgerList",
  statHands: "#statHands",
  statNet: "#statNet",
};

export async function initStore() {
  const db = await openDB();
  const store = {
    db,
    currentPlayerId: null,

    async listPlayers() {
      return getAll(db, "players");
    },
    async createPlayer(name) {
      const player = { id: uuid(), name, createdAt: Date.now() };
      await put(db, "players", player);
      return player;
    },
    async selectPlayer(playerId) {
      store.currentPlayerId = playerId;
    },

    async ledgerRows(playerId) {
      return queryIndex(db, "ledger", "by_player", playerId);
    },

    async balance(playerId) {
      const rows = await store.ledgerRows(playerId);
      return rows.reduce((s, r) => s + r.amount, 0);
    },

    async getChips(playerId) {
      const rows = await store.ledgerRows(playerId);
      return rows.reduce((s, r) => s + r.amount, 0);
    },

    async addLedger(reason, amount, roundId = null) {
      if (!store.currentPlayerId) throw new Error("No player selected.");
      await put(db, "ledger", {
        id: uuid(),
        playerId: store.currentPlayerId,
        roundId,
        reason,
        amount,
        ts: Date.now(),
      });
    },

    async startRound(gameCode) {
      if (!store.currentPlayerId) throw new Error("No player selected.");
      const round = {
        id: uuid(),
        playerId: store.currentPlayerId,
        gameCode,
        startedAt: Date.now(),
        endedAt: null,
        status: "IN_PROGRESS",
      };
      await put(db, "rounds", round);
      return round;
    },

    async placeBet(roundId, betType, amount) {
      if (!store.currentPlayerId) throw new Error("No player selected.");
      const bal = await store.getChips(store.currentPlayerId);
      if (amount < 0) throw new Error("Bet must be >= 0.");
      if (amount === 0) {
        // record bet with 0 amount but no ledger change
        await put(db, "bets", { id: uuid(), roundId, betType, amount: 0 });
        return;
      }

      if (bal < amount) throw new Error("Not enough chips.");

      await withTx(db, ["bets", "ledger"], "readwrite", (s) => {
        s.bets.put({ id: uuid(), roundId, betType, amount });
        s.ledger.put({
          id: uuid(),
          playerId: store.currentPlayerId,
          roundId,
          reason: `BET:${betType}`,
          amount: -amount,
          ts: Date.now(),
        });
      });
    },

    async settle(roundId, betType, outcome, payoutAmount, returnedStake) {
      await put(db, "settlements", {
        id: uuid(),
        roundId,
        betType,
        outcome,
        payoutAmount,
        returnedStake,
        ts: Date.now(),
      });

      if (payoutAmount > 0)
        await store.addLedger(`PAYOUT:${betType}`, payoutAmount, roundId);
      if (returnedStake > 0)
        await store.addLedger(`RETURN:${betType}`, returnedStake, roundId);
    },

    async closeRound(roundId) {
      const r = await get(db, "rounds", roundId);
      r.status = "SETTLED";
      r.endedAt = Date.now();
      await put(db, "rounds", r);
    },

    async getSetting(key) {
      return (await get(db, "settings", key))?.value;
    },
    async setSetting(key, value) {
      await put(db, "settings", { key, value });
    },
  };

  return store;
}

function fmt(n) {
  return new Intl.NumberFormat().format(n);
}

export async function renderPlayerPanel(store) {
  const $ = (sel) => document.querySelector(sel);
  const el = {
    newName: $(ids.newName),
    btnCreate: $(ids.btnCreate),
    playerSelect: $(ids.playerSelect),
    btnSelect: $(ids.btnSelect),
    selectedName: $(ids.selectedName),
    chipBalance: $(ids.chipBalance),
    grantAmount: $(ids.grantAmount),
    btnGrant: $(ids.btnGrant),
    ledgerList: $(ids.ledgerList),
    statHands: $(ids.statHands),
    statNet: $(ids.statNet),
  };

  async function refreshPlayers() {
    const players = await store.listPlayers();
    players.sort((a, b) => a.name.localeCompare(b.name));
    el.playerSelect.innerHTML = "";
    for (const p of players) {
      const opt = document.createElement("option");
      opt.value = p.id;
      opt.textContent = p.name;
      el.playerSelect.appendChild(opt);
    }
  }

  async function refreshLedger() {
    if (!store.currentPlayerId) {
      el.ledgerList.innerHTML = "";
      return;
    }
    const rows = await store.ledgerRows(store.currentPlayerId);
    rows.sort((a, b) => b.ts - a.ts);
    const latest = rows.slice(0, 20);
    el.ledgerList.innerHTML = "";

    for (const r of latest) {
      const div = document.createElement("div");
      div.className = "item";
      const when = new Date(r.ts).toLocaleTimeString();
      const reason = document.createElement("div");
      reason.innerHTML = `<div class="mono">${when}</div><div class="reason">${r.reason}</div>`;
      const meta = document.createElement("div");
      meta.className = "mono";
      meta.textContent = r.roundId ? r.roundId.slice(0, 8) : "";
      const amt = document.createElement("div");
      amt.className = `amt ${r.amount >= 0 ? "pos" : "neg"}`;
      amt.textContent = (r.amount >= 0 ? "+" : "") + fmt(r.amount);

      div.appendChild(reason);
      div.appendChild(meta);
      div.appendChild(amt);
      el.ledgerList.appendChild(div);
    }
  }

  async function refreshHeader() {
    if (!store.currentPlayerId) {
      el.selectedName.textContent = "—";
      el.chipBalance.textContent = "—";
      el.statHands.textContent = "—";
      el.statNet.textContent = "—";
      return;
    }
    const players = await store.listPlayers();
    const p = players.find((x) => x.id === store.currentPlayerId);
    el.selectedName.textContent = p?.name ?? "—";
    const bal = await store.balance(store.currentPlayerId);
    el.chipBalance.textContent = fmt(bal);
    el.statNet.textContent = fmt(bal);

    const rounds = await queryIndex(
      store.db,
      "rounds",
      "by_player",
      store.currentPlayerId,
    );
    el.statHands.textContent = fmt(
      rounds.filter((r) => r.status === "SETTLED").length,
    );
  }

  el.btnCreate.addEventListener("click", async () => {
    const name = el.newName.value.trim();
    if (!name) return;
    try {
      await store.createPlayer(name);
      el.newName.value = "";
      await refreshPlayers();
    } catch {
      alert("Name already exists.");
    }
  });

  el.btnSelect.addEventListener("click", async () => {
    const id = el.playerSelect.value;
    if (!id) return;
    await store.selectPlayer(id);
    await refreshHeader();
    await refreshLedger();
  });

  el.btnGrant.addEventListener("click", async () => {
    try {
      const amt = Math.floor(Number(el.grantAmount.value));
      if (!Number.isFinite(amt) || amt <= 0)
        throw new Error("Enter a positive number.");
      await store.addLedger("GRANT", amt, null);
      el.grantAmount.value = "";
      await refreshHeader();
      await refreshLedger();
    } catch (e) {
      alert(e.message);
    }
  });

  await refreshPlayers();
  await refreshHeader();
  await refreshLedger();

  // expose refresh hooks so games can update UI after settlements
  store.uiRefresh = async () => {
    await refreshHeader();
    await refreshLedger();
  };
}
