// games/ilovesuits/ilovesuits.payouts.js
const DEFAULT = {
  flushRush: {
    4: 1,
    5: 10,
    6: 100,
    7: 300,
  },
  superFlushRush: {
    3: 7,
    4: 60,
    5: 100,
    6: 1000,
    7: 8000,
  },
};

export function payoutsTemplateHTML() {
  return `
    <div class="settingsGrid">
      <div class="settingsCol">
        <h4>Flush Rush (by flush length)</h4>
        <label>4-card <input id="ils_fr_4" type="number" min="0"></label>
        <label>5-card <input id="ils_fr_5" type="number" min="0"></label>
        <label>6-card <input id="ils_fr_6" type="number" min="0"></label>
        <label>7-card <input id="ils_fr_7" type="number" min="0"></label>
      </div>

      <div class="settingsCol">
        <h4>Super Flush Rush (by straight-flush length)</h4>
        <label>3-card <input id="ils_sfr_3" type="number" min="0"></label>
        <label>4-card <input id="ils_sfr_4" type="number" min="0"></label>
        <label>5-card <input id="ils_sfr_5" type="number" min="0"></label>
        <label>6-card <input id="ils_sfr_6" type="number" min="0"></label>
        <label>7-card <input id="ils_sfr_7" type="number" min="0"></label>
      </div>
    </div>
  `;
}

export async function loadILSPayouts(store) {
  const key = "payouts_ilovesuits";
  const value = (await store.getSetting(key)) ?? DEFAULT;

  return {
    value,
    bindInputs(root) {
      root.querySelector("#ils_fr_4").value = value.flushRush?.[4] ?? 0;
      root.querySelector("#ils_fr_5").value = value.flushRush?.[5] ?? 0;
      root.querySelector("#ils_fr_6").value = value.flushRush?.[6] ?? 0;
      root.querySelector("#ils_fr_7").value = value.flushRush?.[7] ?? 0;

      root.querySelector("#ils_sfr_3").value = value.superFlushRush?.[3] ?? 0;
      root.querySelector("#ils_sfr_4").value = value.superFlushRush?.[4] ?? 0;
      root.querySelector("#ils_sfr_5").value = value.superFlushRush?.[5] ?? 0;
      root.querySelector("#ils_sfr_6").value = value.superFlushRush?.[6] ?? 0;
      root.querySelector("#ils_sfr_7").value = value.superFlushRush?.[7] ?? 0;
    },
  };
}

export async function saveILSPayouts(store, root) {
  const key = "payouts_ilovesuits";
  const value = {
    flushRush: {
      4: num(root.querySelector("#ils_fr_4").value),
      5: num(root.querySelector("#ils_fr_5").value),
      6: num(root.querySelector("#ils_fr_6").value),
      7: num(root.querySelector("#ils_fr_7").value),
    },
    superFlushRush: {
      3: num(root.querySelector("#ils_sfr_3").value),
      4: num(root.querySelector("#ils_sfr_4").value),
      5: num(root.querySelector("#ils_sfr_5").value),
      6: num(root.querySelector("#ils_sfr_6").value),
      7: num(root.querySelector("#ils_sfr_7").value),
    },
  };

  await store.setSetting(key, value);
  return await loadILSPayouts(store);
}

function num(v) {
  const n = Math.floor(Number(v || 0));
  return Number.isFinite(n) ? Math.max(0, n) : 0;
}
