const DEFAULT = {
  superBonus: { RF:1000, SF:200, FK:50, FH:25, FL:15, ST:10, TK:5 },
  queensUp: { RF:100, SF:40, FK:30, FH:9, FL:6, ST:4, TK:3, PR:1 }
};

export async function loadCrazy4Payouts(store) {
  const key = "payouts_crazy4";
  const value = (await store.getSetting(key)) ?? DEFAULT;
  return { value };
}

export async function saveCrazy4Payouts(store, value) {
  await store.setSetting("payouts_crazy4", value);
}
