// core/db.js
const DB_NAME = "local-casino";
const DB_VERSION = 3; // bumped to force upgrade

function reqToPromise(req) {
  return new Promise((resolve, reject) => {
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

export async function openDB() {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION);

    req.onupgradeneeded = () => {
      const db = req.result;

      // players: {id, name, createdAt}
      if (!db.objectStoreNames.contains("players")) {
        const players = db.createObjectStore("players", { keyPath: "id" });
        players.createIndex("by_name", "name", { unique: true });
      }

      // wallets: {playerId, chips}
      if (!db.objectStoreNames.contains("wallets")) {
        db.createObjectStore("wallets", { keyPath: "playerId" });
      }

      // rounds: {id, playerId, gameCode, startedAt, endedAt, status}
      if (!db.objectStoreNames.contains("rounds")) {
        const rounds = db.createObjectStore("rounds", { keyPath: "id" });
        rounds.createIndex("by_player", "playerId", { unique: false });
      }

      // bets: {id, roundId, betType, amount}
      if (!db.objectStoreNames.contains("bets")) {
        const bets = db.createObjectStore("bets", { keyPath: "id" });
        bets.createIndex("by_round", "roundId", { unique: false });
      }

      // settlements
      if (!db.objectStoreNames.contains("settlements")) {
        db.createObjectStore("settlements", { keyPath: "id" });
      }

      // ledger
      if (!db.objectStoreNames.contains("ledger")) {
        const ledger = db.createObjectStore("ledger", { keyPath: "id" });
        ledger.createIndex("by_player", "playerId", { unique: false });
        ledger.createIndex("by_round", "roundId", { unique: false });
        ledger.createIndex("by_ts", "ts", { unique: false });
      }

      // ✅ settings (needed by payouts)
      if (!db.objectStoreNames.contains("settings")) {
        db.createObjectStore("settings", { keyPath: "key" });
      }
    };

    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

export async function withTx(db, storeNames, mode, fn) {
  return new Promise((resolve, reject) => {
    const tx = db.transaction(storeNames, mode);
    const stores = Object.fromEntries(
      storeNames.map((n) => [n, tx.objectStore(n)]),
    );
    let out;

    tx.oncomplete = () => resolve(out);
    tx.onerror = () => reject(tx.error);
    tx.onabort = () => reject(tx.error);

    out = fn(stores);
  });
}

export function uuid() {
  return crypto.randomUUID();
}

export async function getAll(db, storeName) {
  return withTx(db, [storeName], "readonly", (s) =>
    reqToPromise(s[storeName].getAll()),
  );
}

export async function put(db, storeName, value) {
  return withTx(db, [storeName], "readwrite", (s) =>
    reqToPromise(s[storeName].put(value)),
  );
}

export async function get(db, storeName, key) {
  return withTx(db, [storeName], "readonly", (s) =>
    reqToPromise(s[storeName].get(key)),
  );
}

export async function del(db, storeName, key) {
  return withTx(db, [storeName], "readwrite", (s) =>
    reqToPromise(s[storeName].delete(key)),
  );
}

export async function queryIndex(db, storeName, indexName, key) {
  return withTx(db, [storeName], "readonly", (s) =>
    reqToPromise(s[storeName].index(indexName).getAll(key)),
  );
}
