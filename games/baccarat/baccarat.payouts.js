// games/baccarat/baccarat.payouts.js

export const BAC_PAYOUTS = {
  // main bets
  PLAYER: { pay: 1 },
  BANKER: { pay: 1, commission: 0.05 }, // 5% commission on banker wins
  TIE:    { pay: 8 },

  // common side bets (standard-ish defaults; adjust anytime)
  PLAYER_PAIR: { pay: 11 },
  BANKER_PAIR: { pay: 11 },

  // “EZ Baccarat”-style bonuses (common defaults)
  PANDA_8:  { pay: 25 }, // Player wins with 3 cards total 8
  DRAGON_7: { pay: 40 }, // Banker wins with 3 cards total 7
};
