// games/freebetbj/freebetbj.payouts.js

const KEY = "payouts.freebetbj";

export function defaultFreeBetPayouts() {
  return {
    dealerHitsSoft17: true,
    blackjackPays: "3:2",

    potGold: {
      enabled: true,
      // Tokens -> Pays (mult : 1)
      // 7=100,6=100,5=100,4=50,3=30,2=12,1=3
      paytable: {
        "0": 0,
        "1": 3,
        "2": 12,
        "3": 30,
        "4": 50,
        "5": 100,
        "6": 100,
        "7": 100,
      },
    },
  };
}

export function payoutsTemplateHTML() {
  return `
    <div class="settingsGrid">
      <div class="settingsCol">
        <h4>Rules</h4>
        <label class="rowTight">
          <input id="fb_h17" type="checkbox" />
          Dealer hits soft 17 (H17)
        </label>
        <label class="rowTight">
          <span class="muted">Blackjack pays fixed at 3:2</span>
        </label>
        <label class="rowTight">
          <span class="muted">Dealer Push on 22 is ON</span>
        </label>
        <label class="rowTight">
          <span class="muted">Free Double: hard 9/10/11 only</span>
        </label>
        <label class="rowTight">
          <span class="muted">Free Split: any pair except 10-value</span>
        </label>
      </div>

      <div class="settingsCol">
        <h4>Pot of Gold</h4>
        <label class="rowTight">
          <input id="fb_pog_enabled" type="checkbox" />
          Enable Pot of Gold side bet
        </label>

        <div class="muted">Paytable (mult : 1)</div>
        <label>7 tokens <input id="fb_pog_7" type="number" min="0"></label>
        <label>6 tokens <input id="fb_pog_6" type="number" min="0"></label>
        <label>5 tokens <input id="fb_pog_5" type="number" min="0"></label>
        <label>4 tokens <input id="fb_pog_4" type="number" min="0"></label>
        <label>3 tokens <input id="fb_pog_3" type="number" min="0"></label>
        <label>2 tokens <input id="fb_pog_2" type="number" min="0"></label>
        <label>1 token  <input id="fb_pog_1" type="number" min="0"></label>
      </div>
    </div>
  `;
}

export async function loadFreeBetPayouts(store) {
  const saved = await store.getSetting?.(KEY);
  const p = saved ? JSON.parse(saved) : defaultFreeBetPayouts();
  return p;
}

export async function saveFreeBetPayouts(store, payouts) {
  await store.setSetting?.(KEY, JSON.stringify(payouts));
}