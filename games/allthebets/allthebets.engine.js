import { BLACKJACK_RULES } from "./allthebets.payouts.js";
import { evaluateOpeningSideBets, evaluateClosingSideBets, handValue } from "./allthebets.sidebets.js";

const SUITS = ["hearts", "diamonds", "clubs", "spades"];
const RANKS = ["2", "3", "4", "5", "6", "7", "8", "9", "10", "J", "Q", "K", "A"];

export function makeShoe(decks = BLACKJACK_RULES.decks) {
  const shoe = [];
  for (let d = 0; d < decks; d++) {
    for (const suit of SUITS) {
      for (const rank of RANKS) {
        shoe.push({ rank, suit, id: `${rank}-${suit}-${d}-${shoe.length}` });
      }
    }
  }
  shuffle(shoe);
  return shoe;
}

export function shuffle(arr) {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

function draw(shoe) {
  return shoe.pop();
}

export function newBlackjackState(balance = 1000) {
  return {
    balance,
    shoe: makeShoe(),
    dealer: { cards: [], holeRevealed: false },
    playerHands: [],
    activeHandIndex: 0,
    phase: "betting",
    message: "Place your bets",
    sideBetResults: [],
    lastRound: null,
  };
}

export function placeRoundBet(state, mainBet, sideBets) {
  const totalSide = Object.values(sideBets).reduce((a, b) => a + (Number(b) || 0), 0);
  const total = mainBet + totalSide;
  if (total <= 0) throw new Error("Bet must be greater than 0");
  if (state.balance < total) throw new Error("Insufficient balance");

  state.balance -= total;
  state.playerHands = [{
    cards: [],
    bet: mainBet,
    finished: false,
    busted: false,
    stood: false,
    doubled: false,
    blackjack: false,
    settled: false,
    originalCards: [],
    sideBets: { ...sideBets },
  }];
  state.dealer = { cards: [], holeRevealed: false };
  state.activeHandIndex = 0;
  state.phase = "dealing";
  state.sideBetResults = [];
  state.lastRound = null;
  return state;
}

export function initialDeal(state) {
  const hand = state.playerHands[0];
  hand.cards.push(draw(state.shoe));
  state.dealer.cards.push(draw(state.shoe));
  hand.cards.push(draw(state.shoe));
  state.dealer.cards.push(draw(state.shoe));
  hand.originalCards = [...hand.cards];
  hand.blackjack = handValue(hand.cards) === 21;

  const opening = evaluateOpeningSideBets({
    playerCards: hand.originalCards,
    dealerUpcard: state.dealer.cards[0],
    dealerCards: state.dealer.cards,
    sideBets: hand.sideBets,
  });

  state.sideBetResults = opening;
  for (const r of opening) {
    if (r.push) state.balance += r.wager;
    else if (r.payout > 0) state.balance += r.wager + r.payout;
  }

  state.phase = hand.blackjack ? "dealerCheck" : "playerTurn";
  state.message = "Choose hit, stand, double, or split";
  return state;
}

export function currentHand(state) {
  return state.playerHands[state.activeHandIndex];
}

export function canDouble(hand, state) {
  return hand.cards.length === 2 && state.balance >= hand.bet;
}

export function canSplit(hand, state) {
  return hand.cards.length === 2 && hand.cards[0].rank === hand.cards[1].rank && state.playerHands.length < BLACKJACK_RULES.maxHands && state.balance >= hand.bet;
}

export function hit(state) {
  const hand = currentHand(state);
  if (!hand || hand.finished) return state;
  hand.cards.push(draw(state.shoe));
  const total = handValue(hand.cards);
  if (total > 21) {
    hand.busted = true;
    hand.finished = true;
    advanceHand(state);
  }
  return state;
}

export function stand(state) {
  const hand = currentHand(state);
  if (!hand || hand.finished) return state;
  hand.stood = true;
  hand.finished = true;
  advanceHand(state);
  return state;
}

export function doubleDown(state) {
  const hand = currentHand(state);
  if (!canDouble(hand, state)) return state;
  state.balance -= hand.bet;
  hand.bet *= 2;
  hand.doubled = true;
  hand.cards.push(draw(state.shoe));
  const total = handValue(hand.cards);
  if (total > 21) hand.busted = true;
  hand.finished = true;
  advanceHand(state);
  return state;
}

export function split(state) {
  const hand = currentHand(state);
  if (!canSplit(hand, state)) return state;

  state.balance -= hand.bet;
  const [c1, c2] = hand.cards;
  const newHandA = {
    ...structuredCloneHand(hand),
    cards: [c1, draw(state.shoe)],
    bet: hand.bet,
    finished: false,
    busted: false,
    stood: false,
    doubled: false,
    blackjack: false,
    settled: false,
  };
  const newHandB = {
    ...structuredCloneHand(hand),
    cards: [c2, draw(state.shoe)],
    bet: hand.bet,
    finished: false,
    busted: false,
    stood: false,
    doubled: false,
    blackjack: false,
    settled: false,
  };

  state.playerHands.splice(state.activeHandIndex, 1, newHandA, newHandB);
  return state;
}

function structuredCloneHand(hand) {
  return {
    cards: [],
    bet: hand.bet,
    originalCards: [...hand.originalCards],
    sideBets: { ...hand.sideBets },
  };
}

function advanceHand(state) {
  const next = state.playerHands.findIndex((h, i) => i > state.activeHandIndex && !h.finished);
  if (next >= 0) {
    state.activeHandIndex = next;
    state.phase = "playerTurn";
    return;
  }
  state.phase = "dealerTurn";
  dealerPlay(state);
  settleHands(state);
}

function isSoft17(cards) {
  let total = 0;
  let aces = 0;
  for (const c of cards) {
    if (c.rank === "A") {
      total += 11;
      aces++;
    } else if (["K", "Q", "J"].includes(c.rank)) {
      total += 10;
    } else {
      total += Number(c.rank);
    }
  }
  while (total > 21 && aces > 0) {
    total -= 10;
    aces--;
  }
  return total === 17 && aces > 0;
}

export function dealerPlay(state) {
  state.dealer.holeRevealed = true;
  while (true) {
    const total = handValue(state.dealer.cards);
    if (total < 17) {
      state.dealer.cards.push(draw(state.shoe));
      continue;
    }
    if (total === 17 && BLACKJACK_RULES.dealerHitsSoft17 && isSoft17(state.dealer.cards)) {
      state.dealer.cards.push(draw(state.shoe));
      continue;
    }
    break;
  }
  return state;
}

export function settleHands(state) {
  const dealerTotal = handValue(state.dealer.cards);
  const dealerBJ = dealerTotal === 21 && state.dealer.cards.length === 2;
  const closing = evaluateClosingSideBets({
    dealerCards: state.dealer.cards,
    sideBets: state.playerHands[0].sideBets,
  });

  for (const r of closing) {
    if (r.payout > 0) state.balance += r.wager + r.payout;
  }
  state.sideBetResults = [...state.sideBetResults, ...closing];

  const summaries = [];

  for (const hand of state.playerHands) {
    const total = handValue(hand.cards);
    let outcome = "lose";
    let paid = 0;

    if (hand.busted) {
      outcome = "bust";
    } else if (hand.blackjack && !dealerBJ) {
      outcome = "blackjack";
      paid = hand.bet + hand.bet * BLACKJACK_RULES.blackjackPays;
      state.balance += paid;
    } else if (dealerBJ && !hand.blackjack) {
      outcome = "lose";
    } else if (dealerTotal > 21) {
      outcome = "win";
      paid = hand.bet * 2;
      state.balance += paid;
    } else if (total > dealerTotal) {
      outcome = "win";
      paid = hand.bet * 2;
      state.balance += paid;
    } else if (total === dealerTotal) {
      outcome = "push";
      paid = hand.bet;
      state.balance += paid;
    }

    summaries.push({ cards: [...hand.cards], total, bet: hand.bet, outcome, paid });
  }

  state.phase = "roundOver";
  state.lastRound = {
    dealerCards: [...state.dealer.cards],
    dealerTotal,
    hands: summaries,
    sideBetResults: [...state.sideBetResults],
  };
  state.message = "Round complete. Press Deal for next hand.";
  return state;
}