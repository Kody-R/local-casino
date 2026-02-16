// games/slots/slots.config.js

export const SYMBOLS = {
  W: { name: "Wild",  payout: {3: 50, 4: 200, 5: 1000}, wild: true },
  A: { name: "Ace",   payout: {3: 10, 4: 30,  5: 120} },
  K: { name: "King",  payout: {3: 8,  4: 25,  5: 100} },
  Q: { name: "Queen", payout: {3: 6,  4: 20,  5: 80} },
  J: { name: "Jack",  payout: {3: 5,  4: 15,  5: 60} },
  T: { name: "Ten",   payout: {3: 4,  4: 12,  5: 50} },
  B: { name: "Bonus", payout: {}, bonus: true },
  S: { name: "Scatter", payout: {3: 2, 4: 10, 5: 50}, scatter: true },
};

// Simple payline definitions for 3 rows x 5 reels.
// Row indices: 0=top 1=mid 2=bot
export const PAYLINES = [
  [1,1,1,1,1], // mid
  [0,0,0,0,0], // top
  [2,2,2,2,2], // bot
  [0,1,2,1,0], // V
  [2,1,0,1,2], // ^
];

// Reel strips (arrays of symbol codes).
// More occurrences => higher frequency => more realistic feel.
// You can tune these later.
export const REEL_STRIPS = [
  "A K Q J T A K Q J T A K Q J T W A K Q J T S B".split(" "),
  "A K Q J T A K Q J T A K Q J T W A K Q J T S B".split(" "),
  "A K Q J T A K Q J T A K Q J T W A K Q J T S B".split(" "),
  "A K Q J T A K Q J T A K Q J T W A K Q J T S B".split(" "),
  "A K Q J T A K Q J T A K Q J T W A K Q J T S B".split(" "),
];

// Bonus rules
export const BONUS_RULES = {
  freeSpins: { scatterNeeded: 3, awards: {3: 8, 4: 12, 5: 20} },
  pickBonus: { bonusNeeded: 3 }, // 3+ B triggers pick bonus
};
