// games/threecard/threecard.payouts.js
const DEFAULT = {
  pairPlus: { SF: 40, TK: 30, ST: 6, FL: 3, PR: 1 },
  sixCard:  { RF: 1000, SF: 200, FK: 50, FH: 25, FL: 15, ST: 10, TK: 7 },
};

export function payoutsTemplateHTML() {
  return `
    <div class="settingsGrid">
      <div class="settingsCol">
        <h4>Pair Plus (mult : 1)</h4>
        <label>Straight Flush <input id="pp_sf" type="number" min="0"></label>
        <label>Three of a Kind <input id="pp_tk" type="number" min="0"></label>
        <label>Straight <input id="pp_st" type="number" min="0"></label>
        <label>Flush <input id="pp_fl" type="number" min="0"></label>
        <label>Pair <input id="pp_pr" type="number" min="0"></label>
      </div>
      <div class="settingsCol">
        <h4>6 Card Bonus (mult : 1)</h4>
        <label>Royal Flush <input id="sc_rf" type="number" min="0"></label>
        <label>Straight Flush <input id="sc_sf" type="number" min="0"></label>
        <label>Four of a Kind <input id="sc_fk" type="number" min="0"></label>
        <label>Full House <input id="sc_fh" type="number" min="0"></label>
        <label>Flush <input id="sc_fl" type="number" min="0"></label>
        <label>Straight <input id="sc_st" type="number" min="0"></label>
        <label>Three of a Kind <input id="sc_tk" type="number" min="0"></label>
      </div>
    </div>
  `;
}

export async function loadThreeCardPayouts(store) {
  const key = "payouts_threecard";
  const value = (await store.getSetting(key)) ?? DEFAULT;

  return {
    value,
    bindInputs(root) {
      root.querySelector("#pp_sf").value = value.pairPlus.SF;
      root.querySelector("#pp_tk").value = value.pairPlus.TK;
      root.querySelector("#pp_st").value = value.pairPlus.ST;
      root.querySelector("#pp_fl").value = value.pairPlus.FL;
      root.querySelector("#pp_pr").value = value.pairPlus.PR;

      root.querySelector("#sc_rf").value = value.sixCard.RF;
      root.querySelector("#sc_sf").value = value.sixCard.SF;
      root.querySelector("#sc_fk").value = value.sixCard.FK;
      root.querySelector("#sc_fh").value = value.sixCard.FH;
      root.querySelector("#sc_fl").value = value.sixCard.FL;
      root.querySelector("#sc_st").value = value.sixCard.ST;
      root.querySelector("#sc_tk").value = value.sixCard.TK;
    }
  };
}

export async function saveThreeCardPayouts(store, root) {
  const key = "payouts_threecard";
  const value = {
    pairPlus: {
      SF: Number(root.querySelector("#pp_sf").value || 0),
      TK: Number(root.querySelector("#pp_tk").value || 0),
      ST: Number(root.querySelector("#pp_st").value || 0),
      FL: Number(root.querySelector("#pp_fl").value || 0),
      PR: Number(root.querySelector("#pp_pr").value || 0),
    },
    sixCard: {
      RF: Number(root.querySelector("#sc_rf").value || 0),
      SF: Number(root.querySelector("#sc_sf").value || 0),
      FK: Number(root.querySelector("#sc_fk").value || 0),
      FH: Number(root.querySelector("#sc_fh").value || 0),
      FL: Number(root.querySelector("#sc_fl").value || 0),
      ST: Number(root.querySelector("#sc_st").value || 0),
      TK: Number(root.querySelector("#sc_tk").value || 0),
    }
  };

  await store.setSetting(key, value);
  return await loadThreeCardPayouts(store);
}
