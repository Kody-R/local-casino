// games/paigow/paigow.payouts.js

// Standard Fortune Pai Gow schedule commonly seen on casino rack cards.
// Note: Your game uses NO joker currently, so we omit “5 Aces” and “7-card SF with Joker”.
// Sources show the same ladder for: 7-card SF (no joker), Royal+RoyalMatch, RF, SF, 4K, FH, FL, 3K, ST. :contentReference[oaicite:1]{index=1}
export const PAIGOW_PAYOUTS = {
  MAIN: { pay: 1, commission: 0.0 }, // if you later want commission: 0.05

  // “to 1” payouts
  FORTUNE: [
    ["7SF", 5000],
    ["RFRM", 2000], // Royal Flush + Royal Match
    ["5A", 400],
    ["RF", 150],
    ["SF", 50],
    ["FK", 25],
    ["FH", 5],
    ["FL", 4],
    ["TK", 3],
    ["ST", 2],
  ],
};

export function lookupPay(table, key) {
  const row = table.find(([k]) => k === key);
  return row ? row[1] : 0;
}
