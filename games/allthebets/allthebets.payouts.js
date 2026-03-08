export const BLACKJACK_RULES = {
  decks: 6,
  dealerHitsSoft17: true,
  blackjackPays: 1.5,
  doubleAfterSplit: true,
  resplitAces: true,
  maxHands: 4,
  allowSurrender: false,
  sideBetsOnOriginalHandOnly: true,
};

export const SIDE_BET_LIMITS = {
  perfectPairs: { min: 1, max: 25 },
  twentyOnePlusThree: { min: 1, max: 25 },
  luckyLadies: { min: 1, max: 25 },
  luckyLucky: { min: 1, max: 25 },
  over13: { min: 1, max: 25 },
  under13: { min: 1, max: 25 },
  bustIt: { min: 1, max: 25 },
  matchDealer: { min: 1, max: 25 },
  royalMatch: { min: 1, max: 25 },
  blazing7s: { min: 1, max: 25 },
};

export const SIDE_BET_PAYTABLES = {
  perfectPairs: {
    mixedPair: 5,
    coloredPair: 10,
    perfectPair: 30,
  },
  twentyOnePlusThree: {
    flush: 5,
    straight: 10,
    threeOfKind: 30,
    straightFlush: 40,
    suitedTrips: 100,
  },
  luckyLadies: {
    any20: 4,
    suited20: 10,
    matched20: 25,
    queenHeartsPair: 200,
    queenHeartsPairDealerBlackjack: 1000,
  },
  luckyLucky: {
    total19: 2,
    total20: 2,
    total21: 3,
    suited21: 10,
    straight678: 30,
    suited678: 100,
    triple7: 50,
    suited777: 200,
  },
  overUnder13: {
    under: 1,
    over: 1,
    exactly13: 0,
    exactly13Mode: "push", // push | lose | win
  },
  bustIt: {
    bust3: 1,
    bust4: 2,
    bust5: 9,
    bust6: 50,
    bust7Plus: 250,
  },
  matchDealer: {
    unsuited: 4,
    suited: 9,
  },
  royalMatch: {
    suited: 5,
    kingQueenSuited: 25,
  },
  blazing7s: {
    single7: 3,
    two7s: 25,
    suitedTwo7s: 100,
    three7s: 500,
    suitedThree7s: 1000,
  },
};