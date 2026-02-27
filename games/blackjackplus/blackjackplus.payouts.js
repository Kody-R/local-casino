// games/blackjackplus/blackjackplus.payouts.js
const DEFAULT = {
  blackjackPays: "3:2", // "3:2" or "6:5"
  dealerHitsSoft17: false, // false = stand on soft 17
  allowDoubleAfterSplit: true,

  // Poker side bet: Player(2) + Dealer upcard (3-card poker)
  side3: {
    enabled: true,
    paytable: { SF: 40, TK: 30, ST: 6, FL: 3, PR: 1 },
  },
};

export function payoutsTemplateHTML() {
  return `
    <div class="settingsGrid">
      <div class="settingsCol">
        <h4>Blackjack Rules</h4>
        <label>BJ Pays
          <select id="bj_pays">
            <option value="3:2">3:2</option>
            <option value="6:5">6:5</option>
          </select>
        </label>
        <label class="rowTight">
          <input id="bj_h17" type="checkbox" />
          Dealer hits soft 17
        </label>
        <label class="rowTight">
          <input id="bj_das" type="checkbox" />
          Double after split allowed
        </label>
      </div>

      <div class="settingsCol">
        <h4>Poker Side Bet (Your 2 + Dealer Up)</h4>

        <label class="rowTight">
          <input id="bj_side3_enabled" type="checkbox" />
          Enable side bet
        </label>

        <div id="bj_side3_block">
          <div class="muted">Paytable (mult : 1)</div>
          <label>Straight Flush <input id="bj_s3_sf" type="number" min="0"></label>
          <label>Trips <input id="bj_s3_tk" type="number" min="0"></label>
          <label>Straight <input id="bj_s3_st" type="number" min="0"></label>
          <label>Flush <input id="bj_s3_fl" type="number" min="0"></label>
          <label>Pair <input id="bj_s3_pr" type="number" min="0"></label>

          <div class="muted" style="margin-top:10px;">Preview</div>
          <div id="bj_side3_preview" class="payPreview"></div>
        </div>
      </div>
    </div>
  `;
}

export async function loadBJPayouts(store) {
  const key = "payouts_blackjackplus";
  const value = (await store.getSetting(key)) ?? DEFAULT;

  return {
    value,
    bindInputs(root) {
      root.querySelector("#bj_pays").value = value.blackjackPays ?? "3:2";
      root.querySelector("#bj_h17").checked = !!value.dealerHitsSoft17;
      root.querySelector("#bj_das").checked =
        value.allowDoubleAfterSplit !== false;

      const enabled = value.side3?.enabled !== false;
      root.querySelector("#bj_side3_enabled").checked = enabled;

      root.querySelector("#bj_s3_sf").value = value.side3?.paytable?.SF ?? 40;
      root.querySelector("#bj_s3_tk").value = value.side3?.paytable?.TK ?? 30;
      root.querySelector("#bj_s3_st").value = value.side3?.paytable?.ST ?? 6;
      root.querySelector("#bj_s3_fl").value = value.side3?.paytable?.FL ?? 3;
      root.querySelector("#bj_s3_pr").value = value.side3?.paytable?.PR ?? 1;

      syncSide3UI(root);
      renderSide3Preview(root);
      wireSide3Events(root);
    },
  };
}

export async function saveBJPayouts(store, root) {
  const key = "payouts_blackjackplus";
  const value = readBJPayoutsFromUI(root);

  await store.setSetting(key, value);
  return await loadBJPayouts(store);
}

/* ---------------- helpers ---------------- */

export function readBJPayoutsFromUI(root) {
  return {
    blackjackPays: root.querySelector("#bj_pays").value,
    dealerHitsSoft17: !!root.querySelector("#bj_h17").checked,
    allowDoubleAfterSplit: !!root.querySelector("#bj_das").checked,
    side3: {
      enabled: !!root.querySelector("#bj_side3_enabled").checked,
      paytable: {
        SF: num(root.querySelector("#bj_s3_sf").value),
        TK: num(root.querySelector("#bj_s3_tk").value),
        ST: num(root.querySelector("#bj_s3_st").value),
        FL: num(root.querySelector("#bj_s3_fl").value),
        PR: num(root.querySelector("#bj_s3_pr").value),
      },
    },
  };
}

function num(v) {
  const n = Math.floor(Number(v || 0));
  return Number.isFinite(n) ? Math.max(0, n) : 0;
}

function syncSide3UI(root) {
  const enabled = !!root.querySelector("#bj_side3_enabled").checked;
  const block = root.querySelector("#bj_side3_block");
  if (block) block.style.display = enabled ? "block" : "none";
}

function renderSide3Preview(root) {
  const preview = root.querySelector("#bj_side3_preview");
  if (!preview) return;

  const p = {
    SF: num(root.querySelector("#bj_s3_sf")?.value),
    TK: num(root.querySelector("#bj_s3_tk")?.value),
    ST: num(root.querySelector("#bj_s3_st")?.value),
    FL: num(root.querySelector("#bj_s3_fl")?.value),
    PR: num(root.querySelector("#bj_s3_pr")?.value),
  };

  preview.innerHTML = `
    <div class="payRow"><span>Straight Flush</span><span>${p.SF}:1</span></div>
    <div class="payRow"><span>Trips</span><span>${p.TK}:1</span></div>
    <div class="payRow"><span>Straight</span><span>${p.ST}:1</span></div>
    <div class="payRow"><span>Flush</span><span>${p.FL}:1</span></div>
    <div class="payRow"><span>Pair</span><span>${p.PR}:1</span></div>
  `;
}

function wireSide3Events(root) {
  // prevent duplicate listeners if bindInputs called again
  if (root.__bjSide3Wired) return;
  root.__bjSide3Wired = true;

  const onAnyChange = () => renderSide3Preview(root);
  const toggle = () => {
    syncSide3UI(root);
    renderSide3Preview(root);
  };

  root.querySelector("#bj_side3_enabled")?.addEventListener("change", toggle);

  ["#bj_s3_sf", "#bj_s3_tk", "#bj_s3_st", "#bj_s3_fl", "#bj_s3_pr"].forEach(
    (sel) => {
      root.querySelector(sel)?.addEventListener("input", onAnyChange);
    },
  );
}
