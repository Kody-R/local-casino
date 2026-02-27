// games/uth/uth.payouts.js
const DEFAULT = {
  // Blind pays ONLY when player wins AND has Straight+ (per PDF) :contentReference[oaicite:5]{index=5}
  // Multipliers are "to 1" (e.g., Straight = 1 means pays 1:1 plus returned stake handled by your settlement method)
  blind: { ST: 1, FL: 3, FH: 3, FK: 10, SF: 50, RF: 500 },

  // Trips is independent: based on player's final 7-card hand
  // Typical-style defaults (edit as you like)
  trips: { ST: 1, TK: 3, STFL: 0, FL: 4, FH: 8, FK: 30, SF: 40, RF: 50 },
};

// Normalize 5-card codes from eval5 into what we use for payouts
function norm(code) {
  // eval5 codes: RF, SF, FK, FH, FL, ST, TK, 2P, PR, HI
  return code;
}

export function payoutsTemplateHTML() {
  return `
    <div class="settingsGrid">
      <div class="settingsCol">
        <h4>Blind (only if you WIN + Straight+)</h4>
        <label>Straight <input id="uth_bl_st" type="number" min="0"></label>
        <label>Flush <input id="uth_bl_fl" type="number" min="0"></label>
        <label>Full House <input id="uth_bl_fh" type="number" min="0"></label>
        <label>Four of a Kind <input id="uth_bl_fk" type="number" min="0"></label>
        <label>Straight Flush <input id="uth_bl_sf" type="number" min="0"></label>
        <label>Royal Flush <input id="uth_bl_rf" type="number" min="0"></label>
      </div>

      <div class="settingsCol">
        <h4>Trips (independent)</h4>
        <label>Straight <input id="uth_tr_st" type="number" min="0"></label>
        <label>Three of a Kind <input id="uth_tr_tk" type="number" min="0"></label>
        <label>Flush <input id="uth_tr_fl" type="number" min="0"></label>
        <label>Full House <input id="uth_tr_fh" type="number" min="0"></label>
        <label>Four of a Kind <input id="uth_tr_fk" type="number" min="0"></label>
        <label>Straight Flush <input id="uth_tr_sf" type="number" min="0"></label>
        <label>Royal Flush <input id="uth_tr_rf" type="number" min="0"></label>
      </div>
    </div>
  `;
}

export async function loadUTHPayouts(store) {
  const key = "payouts_uth";
  const value = (await store.getSetting(key)) ?? DEFAULT;

  return {
    value,
    bindInputs(root) {
      root.querySelector("#uth_bl_st").value = value.blind.ST ?? 0;
      root.querySelector("#uth_bl_fl").value = value.blind.FL ?? 0;
      root.querySelector("#uth_bl_fh").value = value.blind.FH ?? 0;
      root.querySelector("#uth_bl_fk").value = value.blind.FK ?? 0;
      root.querySelector("#uth_bl_sf").value = value.blind.SF ?? 0;
      root.querySelector("#uth_bl_rf").value = value.blind.RF ?? 0;

      root.querySelector("#uth_tr_st").value = value.trips.ST ?? 0;
      root.querySelector("#uth_tr_tk").value = value.trips.TK ?? 0;
      root.querySelector("#uth_tr_fl").value = value.trips.FL ?? 0;
      root.querySelector("#uth_tr_fh").value = value.trips.FH ?? 0;
      root.querySelector("#uth_tr_fk").value = value.trips.FK ?? 0;
      root.querySelector("#uth_tr_sf").value = value.trips.SF ?? 0;
      root.querySelector("#uth_tr_rf").value = value.trips.RF ?? 0;
    },
  };
}

export async function saveUTHPayouts(store, root) {
  const key = "payouts_uth";
  const value = {
    blind: {
      ST: Number(root.querySelector("#uth_bl_st").value || 0),
      FL: Number(root.querySelector("#uth_bl_fl").value || 0),
      FH: Number(root.querySelector("#uth_bl_fh").value || 0),
      FK: Number(root.querySelector("#uth_bl_fk").value || 0),
      SF: Number(root.querySelector("#uth_bl_sf").value || 0),
      RF: Number(root.querySelector("#uth_bl_rf").value || 0),
    },
    trips: {
      ST: Number(root.querySelector("#uth_tr_st").value || 0),
      TK: Number(root.querySelector("#uth_tr_tk").value || 0),
      FL: Number(root.querySelector("#uth_tr_fl").value || 0),
      FH: Number(root.querySelector("#uth_tr_fh").value || 0),
      FK: Number(root.querySelector("#uth_tr_fk").value || 0),
      SF: Number(root.querySelector("#uth_tr_sf").value || 0),
      RF: Number(root.querySelector("#uth_tr_rf").value || 0),
    },
  };

  await store.setSetting(key, value);
  return await loadUTHPayouts(store);
}

export function blindMult(payouts, evalCode) {
  return payouts.blind[norm(evalCode)] ?? 0;
}

export function tripsMult(payouts, evalCode) {
  return payouts.trips[norm(evalCode)] ?? 0;
}
