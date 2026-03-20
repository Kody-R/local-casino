import { BLACKJACK_RULES } from "./allthebets.payouts.js";
import {
  evaluateOpeningSideBets,
  evaluateClosingSideBets,
  handValue,
} from "./allthebets.sidebets.js";
import { freshShoe, draw } from "../../core/cards.js";

export function makeShoe(decks = BLACKJACK_RULES.decks) {
  return freshShoe(decks);
}

export function newBlackjackState() {
  return {
    shoe: makeShoe(),
    dealer: { cards: [], holeRevealed: false },
    playerHands: [],
    activeHandIndex: 0,
    phase: "betting",
    message: "Place your bets",
    sideBetResults: [],
    lastRound: null,
    roundId: null,
  };
}

export function currentHand(state) {
  return state.playerHands[state.activeHandIndex];
}

export function canDouble(hand, state) {
  return !!hand && hand.cards.length === 2 && state.phase === "playerTurn";
}

export function canSplit(hand, state) {
  return (
    !!hand &&
    hand.cards.length === 2 &&
    hand.cards[0]?.r === hand.cards[1]?.r &&
    state.playerHands.length < BLACKJACK_RULES.maxHands &&
    state.phase === "playerTurn"
  );
}

function structuredCloneHand(hand) {
  return {
    cards: [],
    bet: hand.bet,
    originalCards: [...(hand.originalCards || [])],
    sideBets: { ...(hand.sideBets || {}) },
    finished: false,
    busted: false,
    stood: false,
    doubled: false,
    blackjack: false,
    settled: false,
  };
}

function betCodeMap(resultName) {
  return {
    "Perfect Pairs": "PERFECT_PAIRS",
    "21+3": "TWENTYONEPLUS3",
    "Lucky Ladies": "LUCKY_LADIES",
    "Lucky Lucky": "LUCKY_LUCKY",
    "Over 13": "OVER13",
    "Under 13": "UNDER13",
    "Bust It": "BUST_IT",
    "Match the Dealer": "MATCH_DEALER",
    "Royal Match": "ROYAL_MATCH",
    "Blazing 7s": "BLAZING7S",
  }[resultName];
}

async function settleResolvedBet(store, roundId, code, result) {
  if (!code || !result || !roundId) return;

  if (result.push) {
    await store.settle(roundId, code, "PUSH", 0, result.wager);
    return;
  }

  if (result.win) {
    await store.settle(
      roundId,
      code,
      "WIN",
      result.wager * result.multiplier,
      result.wager,
    );
    return;
  }

  await store.settle(roundId, code, "LOSE", 0, 0);
}

export async function placeRoundBet(store, state, mainBet, sideBets) {
  const totalSide = Object.values(sideBets).reduce(
    (a, b) => a + (Number(b) || 0),
    0,
  );
  const total = mainBet + totalSide;

  if (total <= 0) throw new Error("Bet must be greater than 0");
  if (!store.currentPlayerId) throw new Error("Select a player first.");

  const round = await store.startRound("ALLTHEBETS");
  state.roundId = round.id;

  await store.placeBet(round.id, "MAIN", mainBet);

  if (sideBets.perfectPairs > 0) {
    await store.placeBet(round.id, "PERFECT_PAIRS", sideBets.perfectPairs);
  }
  if (sideBets.twentyOnePlusThree > 0) {
    await store.placeBet(
      round.id,
      "TWENTYONEPLUS3",
      sideBets.twentyOnePlusThree,
    );
  }
  if (sideBets.luckyLadies > 0) {
    await store.placeBet(round.id, "LUCKY_LADIES", sideBets.luckyLadies);
  }
  if (sideBets.luckyLucky > 0) {
    await store.placeBet(round.id, "LUCKY_LUCKY", sideBets.luckyLucky);
  }
  if (sideBets.over13 > 0) {
    await store.placeBet(round.id, "OVER13", sideBets.over13);
  }
  if (sideBets.under13 > 0) {
    await store.placeBet(round.id, "UNDER13", sideBets.under13);
  }
  if (sideBets.bustIt > 0) {
    await store.placeBet(round.id, "BUST_IT", sideBets.bustIt);
  }
  if (sideBets.matchDealer > 0) {
    await store.placeBet(round.id, "MATCH_DEALER", sideBets.matchDealer);
  }
  if (sideBets.royalMatch > 0) {
    await store.placeBet(round.id, "ROYAL_MATCH", sideBets.royalMatch);
  }
  if (sideBets.blazing7s > 0) {
    await store.placeBet(round.id, "BLAZING7S", sideBets.blazing7s);
  }

  state.playerHands = [
    {
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
    },
  ];
  state.dealer = { cards: [], holeRevealed: false };
  state.activeHandIndex = 0;
  state.phase = "dealing";
  state.sideBetResults = [];
  state.lastRound = null;
  state.message = "Dealing...";
  return state;
}

export async function initialDeal(store, state) {
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
    await settleResolvedBet(store, state.roundId, betCodeMap(r.name), r);
  }

  if (hand.blackjack) {
    state.phase = "dealerTurn";
    state.message = "Checking dealer hand...";
    dealerPlay(state);
    await settleHands(store, state);
  } else {
    state.phase = "playerTurn";
    state.message = "Choose hit, stand, double, or split";
  }

  return state;
}

export function hit(state) {
  const hand = currentHand(state);
  if (!hand || hand.finished) return state;

  hand.cards.push(draw(state.shoe));
  const total = handValue(hand.cards);

  if (total > 21) {
    hand.busted = true;
    hand.finished = true;
  }

  return state;
}

export async function stand(store, state) {
  const hand = currentHand(state);
  if (!hand || hand.finished) return state;

  hand.stood = true;
  hand.finished = true;
  await advanceHand(store, state);
  return state;
}

export async function doubleDown(store, state) {
  const hand = currentHand(state);
  if (!canDouble(hand, state)) return state;

  await store.placeBet(state.roundId, `DOUBLE_${state.activeHandIndex}`, hand.bet);

  hand.bet *= 2;
  hand.doubled = true;
  hand.cards.push(draw(state.shoe));

  const total = handValue(hand.cards);
  if (total > 21) {
    hand.busted = true;
  }

  hand.finished = true;
  await advanceHand(store, state);
  return state;
}

export async function split(store, state) {
  const hand = currentHand(state);
  if (!canSplit(hand, state)) return state;

  await store.placeBet(state.roundId, `SPLIT_${state.activeHandIndex}`, hand.bet);

  const [c1, c2] = hand.cards;

  const newHandA = {
    ...structuredCloneHand(hand),
    cards: [c1, draw(state.shoe)],
  };
  const newHandB = {
    ...structuredCloneHand(hand),
    cards: [c2, draw(state.shoe)],
  };

  newHandA.blackjack = handValue(newHandA.cards) === 21;
  newHandB.blackjack = handValue(newHandB.cards) === 21;

  state.playerHands.splice(state.activeHandIndex, 1, newHandA, newHandB);
  state.message = "Hand split.";
  return state;
}

export async function advanceAfterHit(store, state) {
  const hand = currentHand(state);
  if (!hand) return state;

  if (hand.busted) {
    await advanceHand(store, state);
  }
  return state;
}

async function advanceHand(store, state) {
  const next = state.playerHands.findIndex(
    (h, i) => i > state.activeHandIndex && !h.finished,
  );

  if (next >= 0) {
    state.activeHandIndex = next;
    state.phase = "playerTurn";
    state.message = `Playing hand ${next + 1}`;
    return;
  }

  state.phase = "dealerTurn";
  state.message = "Dealer's turn";
  dealerPlay(state);
  await settleHands(store, state);
}

function isSoft17(cards) {
  let total = 0;
  let aces = 0;

  for (const c of cards) {
    if (c.r === "A") {
      total += 11;
      aces++;
    } else if (["K", "Q", "J", "T"].includes(c.r)) {
      total += 10;
    } else {
      total += Number(c.r);
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

    if (
      total === 17 &&
      BLACKJACK_RULES.dealerHitsSoft17 &&
      isSoft17(state.dealer.cards)
    ) {
      state.dealer.cards.push(draw(state.shoe));
      continue;
    }

    break;
  }

  return state;
}

export async function settleHands(store, state) {
  const dealerTotal = handValue(state.dealer.cards);
  const dealerBJ = dealerTotal === 21 && state.dealer.cards.length === 2;

  const closing = evaluateClosingSideBets({
    dealerCards: state.dealer.cards,
    sideBets: state.playerHands[0]?.sideBets || {},
  });

  for (const r of closing) {
    await settleResolvedBet(store, state.roundId, betCodeMap(r.name), r);
  }

  state.sideBetResults = [...state.sideBetResults, ...closing];

  const summaries = [];

  for (let i = 0; i < state.playerHands.length; i++) {
    const hand = state.playerHands[i];
    const total = handValue(hand.cards);
    let outcome = "lose";
    let paid = 0;

    const mainCode = i === 0 ? "MAIN" : `SPLIT_${i - 1}`;
    const extraDoubleCode = hand.doubled ? `DOUBLE_${i}` : null;
    const baseStake = hand.doubled ? hand.bet / 2 : hand.bet;
    const extraStake = hand.doubled ? hand.bet / 2 : 0;

    if (hand.busted) {
      outcome = "bust";
      await store.settle(state.roundId, mainCode, "LOSE", 0, 0);
      if (extraDoubleCode) {
        await store.settle(state.roundId, extraDoubleCode, "LOSE", 0, 0);
      }
    } else if (hand.blackjack && !dealerBJ) {
      outcome = "blackjack";
      paid = hand.bet * BLACKJACK_RULES.blackjackPays;

      await store.settle(
        state.roundId,
        mainCode,
        "WIN",
        baseStake * BLACKJACK_RULES.blackjackPays,
        baseStake,
      );

      if (extraDoubleCode) {
        await store.settle(
          state.roundId,
          extraDoubleCode,
          "WIN",
          extraStake,
          extraStake,
        );
      }
    } else if (dealerBJ && !hand.blackjack) {
      outcome = "lose";
      await store.settle(state.roundId, mainCode, "LOSE", 0, 0);
      if (extraDoubleCode) {
        await store.settle(state.roundId, extraDoubleCode, "LOSE", 0, 0);
      }
    } else if (dealerTotal > 21 || total > dealerTotal) {
      outcome = "win";
      paid = hand.bet;

      await store.settle(state.roundId, mainCode, "WIN", baseStake, baseStake);
      if (extraDoubleCode) {
        await store.settle(
          state.roundId,
          extraDoubleCode,
          "WIN",
          extraStake,
          extraStake,
        );
      }
    } else if (total === dealerTotal) {
      outcome = "push";

      await store.settle(state.roundId, mainCode, "PUSH", 0, baseStake);
      if (extraDoubleCode) {
        await store.settle(state.roundId, extraDoubleCode, "PUSH", 0, extraStake);
      }
    } else {
      outcome = "lose";
      await store.settle(state.roundId, mainCode, "LOSE", 0, 0);
      if (extraDoubleCode) {
        await store.settle(state.roundId, extraDoubleCode, "LOSE", 0, 0);
      }
    }

    summaries.push({
      cards: [...hand.cards],
      total,
      bet: hand.bet,
      outcome,
      paid,
    });
  }

  await store.closeRound(state.roundId);

  state.phase = "roundOver";
  state.lastRound = {
    dealerCards: [...state.dealer.cards],
    dealerTotal,
    hands: summaries,
    sideBetResults: [...state.sideBetResults],
  };
  state.message = "Round complete. Press Deal for next hand.";
  state.roundId = null;
  return state;
}