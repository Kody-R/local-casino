// games/freebetbj/freebetbj.engine.js
import { makeDeck, shuffle } from "../../core/cards.js";

// ---------- Hand math ----------
function cardBJValue(card) {
  if (card.r === "A") return 11;
  if (["K", "Q", "J", "T"].includes(card.r)) return 10;
  return Number(card.r);
}

export function handTotals(cards) {
  // returns { best, isSoft, isBlackjack, isBust }
  let total = 0;
  let aces = 0;
  for (const c of cards) {
    total += cardBJValue(c);
    if (c.r === "A") aces++;
  }
  while (total > 21 && aces > 0) {
    total -= 10;
    aces--;
  }
  const raw = cards.reduce((s, c) => s + cardBJValue(c), 0);
  const isSoft = cards.some((c) => c.r === "A") && total <= 21 && raw !== total;
  const isBJ = cards.length === 2 && total === 21;
  return { best: total, isSoft, isBlackjack: isBJ, isBust: total > 21 };
}

function needsDealerHit(dealerCards, dealerHitsSoft17) {
  const t = handTotals(dealerCards);
  if (t.best < 17) return true;
  if (t.best > 17) return false;
  return dealerHitsSoft17 && t.isSoft; // hit soft 17 if enabled
}

function bjProfitMultiplier(blackjackPays) {
  // 3:2 => 1.5
  return blackjackPays === "3:2" ? 1.5 : 1.5;
}

function isTenValueRank(r) {
  return ["T", "J", "Q", "K"].includes(r);
}

// ---------- Round lifecycle ----------
export async function dealFreeBetBJRound(store, { wager, potGold, payouts }) {
  const round = await store.startRound("FREEBETBJ");

  // MAIN wager (real chips)
  await store.placeBet(round.id, "MAIN", wager);

  // Pot of Gold side bet (optional)
  if (potGold > 0 && payouts.potGold?.enabled) {
    await store.placeBet(round.id, "POTGOLD", potGold);
  }

  // 6-deck shoe
  const shoe = [];
  for (let d = 0; d < 6; d++) shoe.push(...makeDeck());
  shuffle(shoe);

  const dealer = [shoe.pop(), shoe.pop()];

  // Start with one hand
  const hands = [
    {
      id: 0,
      betKey: "MAIN", // settlement key in ledger
      baseBet: wager, // the “unit” bet for this hand
      stakePaid: true, // false for free-split hands (no chips were placed)
      cards: [shoe.pop(), shoe.pop()],
      // action flags
      paidDouble: false,
      freeDouble: false,
      finished: false,
      outcome: null, // "WIN" | "LOSE" | "PUSH" | "BJ" | "BUST"
    },
  ];

  return {
    roundId: round.id,
    live: {
      wager,
      potGold,
      payouts,

      shoe,
      dealer,

      hands,
      active: 0, // index into hands

      // token tracking (counts free splits + free doubles taken)
      tokensUsed: 0,

      status: "PLAYER_TURN", // PLAYER_TURN -> DEALER_TURN -> DONE
      settled: false,
    },
  };
}

// ---------- Player action eligibility ----------
export function getActiveHand(live) {
  return live.hands[live.active];
}

export function canHit(live) {
  return live.status === "PLAYER_TURN" && !getActiveHand(live).finished;
}

export function canStand(live) {
  return live.status === "PLAYER_TURN" && !getActiveHand(live).finished;
}

export function canDoublePaid(live) {
  const h = getActiveHand(live);
  return (
    live.status === "PLAYER_TURN" &&
    !h.finished &&
    h.cards.length === 2 &&
    !h.paidDouble &&
    !h.freeDouble
  );
}

// “Free Doubles” on HARD 9/10/11 (two cards only)
export function canDoubleFree(live) {
  const h = getActiveHand(live);
  if (
    live.status !== "PLAYER_TURN" ||
    h.finished ||
    h.cards.length !== 2 ||
    h.paidDouble ||
    h.freeDouble
  )
    return false;
  const t = handTotals(h.cards);
  return !t.isSoft && [9, 10, 11].includes(t.best);
}

// splitting allowed up to 4 total hands, incl. aces
export function canSplitPaid(live) {
  const h = getActiveHand(live);
  if (live.status !== "PLAYER_TURN" || h.finished) return false;
  if (h.cards.length !== 2) return false;
  if (live.hands.length >= 4) return false;
  return h.cards[0].r === h.cards[1].r;
}

// “Free Splits” on all pairs except 10’s (T/J/Q/K)
export function canSplitFree(live) {
  const h = getActiveHand(live);
  if (!canSplitPaid(live)) return false;
  const r = h.cards[0].r;
  return !isTenValueRank(r); // excludes T/J/Q/K
}

// ---------- Actions ----------
export function hit(live) {
  if (!canHit(live)) throw new Error("Cannot hit now.");
  const h = getActiveHand(live);
  h.cards.push(live.shoe.pop());
  const t = handTotals(h.cards);
  if (t.isBust) {
    h.finished = true;
    h.outcome = "BUST";
    advanceHandOrDealer(live);
  }
  return live;
}

export function stand(live) {
  if (!canStand(live)) throw new Error("Cannot stand now.");
  const h = getActiveHand(live);
  h.finished = true;
  advanceHandOrDealer(live);
  return live;
}

export async function doublePaid(store, roundId, live) {
  if (!canDoublePaid(live)) throw new Error("Cannot double now.");
  const h = getActiveHand(live);

  // You can only do a PAID double if you can actually post chips.
  // We let UI guard balance; engine just posts the bet.
  const key = `DOUBLE_H${h.id}`;
  await store.placeBet(roundId, key, h.baseBet);

  h.paidDouble = true;
  h.cards.push(live.shoe.pop());
  h.finished = true;

  const t = handTotals(h.cards);
  if (t.isBust) h.outcome = "BUST";

  advanceHandOrDealer(live);
  return live;
}

export function doubleFree(live) {
  if (!canDoubleFree(live)) throw new Error("Cannot free-double now.");
  const h = getActiveHand(live);

  live.tokensUsed += 1;
  h.freeDouble = true;

  h.cards.push(live.shoe.pop());
  h.finished = true;

  const t = handTotals(h.cards);
  if (t.isBust) h.outcome = "BUST";

  advanceHandOrDealer(live);
  return live;
}

// Paid split: costs another wager (real chips) on new hand
export async function splitPaid(store, roundId, live) {
  if (!canSplitPaid(live)) throw new Error("Cannot split now.");

  const h = getActiveHand(live);
  const cardA = h.cards[0];
  const cardB = h.cards[1];

  // create new paid hand
  const newId = nextHandId(live);
  const betKey = `SPLIT${newId}`;
  await store.placeBet(roundId, betKey, h.baseBet);

  // transform current hand + add new hand
  h.cards = [cardA, live.shoe.pop()];
  h.paidDouble = false;
  h.freeDouble = false;
  h.finished = false;
  h.outcome = null;

  live.hands.push({
    id: newId,
    betKey,
    baseBet: h.baseBet,
    stakePaid: true,
    cards: [cardB, live.shoe.pop()],
    paidDouble: false,
    freeDouble: false,
    finished: false,
    outcome: null,
  });

  return live;
}

// Free split: second hand is a free-bet button (no chips posted)
export function splitFree(live) {
  if (!canSplitFree(live)) throw new Error("Cannot free-split now.");

  live.tokensUsed += 1;

  const h = getActiveHand(live);
  const cardA = h.cards[0];
  const cardB = h.cards[1];

  const newId = nextHandId(live);
  const betKey = `FREE${newId}`; // settle against a 0-stake placeholder

  // Current hand keeps the real bet (no changes to its betKey)
  h.cards = [cardA, live.shoe.pop()];
  h.paidDouble = false;
  h.freeDouble = false;
  h.finished = false;
  h.outcome = null;

  // Add “free” hand (stakePaid=false)
  live.hands.push({
    id: newId,
    betKey,
    baseBet: h.baseBet,
    stakePaid: false,
    cards: [cardB, live.shoe.pop()],
    paidDouble: false,
    freeDouble: false,
    finished: false,
    outcome: null,
  });

  return live;
}

function nextHandId(live) {
  return live.hands.reduce((m, h) => Math.max(m, h.id), 0) + 1;
}

function advanceHandOrDealer(live) {
  // move to next unfinished hand; else dealer turn
  const next = live.hands.findIndex((hh) => !hh.finished);
  if (next >= 0) {
    live.active = next;
    return;
  }
  live.status = "DEALER_TURN";
}

// ---------- Dealer + settlement ----------
export function dealerPlay(live) {
  if (live.status !== "DEALER_TURN") throw new Error("Dealer not active.");
  while (needsDealerHit(live.dealer, live.payouts.dealerHitsSoft17)) {
    live.dealer.push(live.shoe.pop());
  }
  live.status = "DONE";
  return live;
}

export async function settleFreeBetBJ(store, roundId, live) {
  if (live.settled) throw new Error("Already settled.");
  live.settled = true;

  // Ensure all hands are finished
  for (const h of live.hands) {
    if (!h.finished) throw new Error("Cannot settle: hand still active.");
  }

  const d = handTotals(live.dealer);

  // IMPORTANT RULE: Dealer pushes on 22
  const dealerPush22 = !d.isBlackjack && d.best === 22;

  // If you used a free-split hand, we need a 0-stake placeholder bet in the ledger
  // so settlement can still credit winnings without debiting chips.
  // (If your store forbids 0, we’ll adjust later.)
  for (const h of live.hands) {
    if (!h.stakePaid) {
      await store.placeBet(roundId, h.betKey, 0);
    }
  }

  let netMainProfit = 0; // for Pot of Gold trigger

  // Helper to settle a single hand’s “base” betKey and optional paid double
  async function settleOneHand(h) {
    const p = handTotals(h.cards);

    // Bust loses (unless it’s a free hand, then just 0 outcome)
    if (p.isBust) {
      await store.settle(roundId, h.betKey, "LOSE", 0, 0);
      if (h.paidDouble)
        await store.settle(roundId, `DOUBLE_H${h.id}`, "LOSE", 0, 0);
      h.outcome = "BUST";
      return;
    }

    // Dealer blackjack handling (standard)
    if (d.isBlackjack) {
      if (p.isBlackjack) {
        await store.settle(
          roundId,
          h.betKey,
          "PUSH",
          0,
          h.stakePaid ? h.baseBet : 0,
        );
        if (h.paidDouble)
          await store.settle(roundId, `DOUBLE_H${h.id}`, "PUSH", 0, h.baseBet);
        h.outcome = "PUSH";
      } else {
        await store.settle(roundId, h.betKey, "LOSE", 0, 0);
        if (h.paidDouble)
          await store.settle(roundId, `DOUBLE_H${h.id}`, "LOSE", 0, 0);
        h.outcome = "LOSE";
      }
      return;
    }

    // Player blackjack (3:2)
    if (p.isBlackjack) {
      const mult = bjProfitMultiplier(live.payouts.blackjackPays); // 1.5
      // free hands: return=0 because no chips were posted, but profit+“replacement chips”
      // are still paid by using profit + return fields.
      const ret = h.stakePaid ? h.baseBet : 0;
      const profit = h.baseBet * mult;
      await store.settle(roundId, h.betKey, "WIN", profit, ret);
      netMainProfit += profit;
      h.outcome = "BJ";
      return;
    }

    // Dealer bust (not 22): player wins
    if (d.isBust && !dealerPush22) {
      await settleWinPushLose(h, "WIN");
      return;
    }

    // Dealer push on 22: all <=21 push (even if dealer “busts”)
    if (dealerPush22) {
      await settleWinPushLose(h, "PUSH");
      return;
    }

    // Compare totals
    if (p.best > d.best) {
      await settleWinPushLose(h, "WIN");
    } else if (p.best < d.best) {
      await settleWinPushLose(h, "LOSE");
    } else {
      await settleWinPushLose(h, "PUSH");
    }
  }

  async function settleWinPushLose(h, res) {
    // PAID double: base bet settles normal, DOUBLE_H settles normal
    if (h.paidDouble) {
      if (res === "WIN") {
        await store.settle(
          roundId,
          h.betKey,
          "WIN",
          h.baseBet,
          h.stakePaid ? h.baseBet : 0,
        );
        await store.settle(
          roundId,
          `DOUBLE_H${h.id}`,
          "WIN",
          h.baseBet,
          h.baseBet,
        );
        netMainProfit += h.baseBet + h.baseBet;
      } else if (res === "PUSH") {
        await store.settle(
          roundId,
          h.betKey,
          "PUSH",
          0,
          h.stakePaid ? h.baseBet : 0,
        );
        await store.settle(roundId, `DOUBLE_H${h.id}`, "PUSH", 0, h.baseBet);
      } else {
        await store.settle(roundId, h.betKey, "LOSE", 0, 0);
        await store.settle(roundId, `DOUBLE_H${h.id}`, "LOSE", 0, 0);
      }
      h.outcome = res;
      return;
    }

    // FREE double: player only risks original wager, but wins “double wager” on success
    if (h.freeDouble) {
      if (res === "WIN") {
        // Rule: winnings equal to double that wager; plus original returned (if any)
        // credit via profit=2*base, return=stakePaid?base:0
        await store.settle(
          roundId,
          h.betKey,
          "WIN",
          2 * h.baseBet,
          h.stakePaid ? h.baseBet : 0,
        );
        netMainProfit += 2 * h.baseBet;
      } else if (res === "PUSH") {
        await store.settle(
          roundId,
          h.betKey,
          "PUSH",
          0,
          h.stakePaid ? h.baseBet : 0,
        );
      } else {
        await store.settle(roundId, h.betKey, "LOSE", 0, 0);
      }
      h.outcome = res;
      return;
    }

    // Normal single-bet hand
    if (res === "WIN") {
      await store.settle(
        roundId,
        h.betKey,
        "WIN",
        h.baseBet,
        h.stakePaid ? h.baseBet : 0,
      );
      netMainProfit += h.baseBet;
    } else if (res === "PUSH") {
      await store.settle(
        roundId,
        h.betKey,
        "PUSH",
        0,
        h.stakePaid ? h.baseBet : 0,
      );
    } else {
      await store.settle(roundId, h.betKey, "LOSE", 0, 0);
    }
    h.outcome = res;
  }

  // Settle all hands
  for (const h of live.hands) {
    await settleOneHand(h);
  }

  // Pot of Gold: pays based on tokensUsed regardless of blackjack outcome.
  if (live.potGold > 0 && live.payouts.potGold?.enabled) {
    const tokens = Math.max(0, Math.min(7, live.tokensUsed));
    const mult = Number(live.payouts.potGold.paytable?.[String(tokens)] ?? 0);

    if (mult > 0) {
      // WIN: profit = mult * sidebet, return = original sidebet
      await store.settle(
        roundId,
        "POTGOLD",
        "WIN",
        mult * live.potGold,
        live.potGold,
      );
    } else {
      // If 0 tokens (or undefined) => loses side bet
      await store.settle(roundId, "POTGOLD", "LOSE", 0, 0);
    }
  }

  await store.closeRound(roundId);

  // Build a nice summary
  const outcomes = live.hands.map((h) => `H${h.id}:${h.outcome}`).join(" ");
  const dStr = d.isBlackjack ? "BJ" : d.best;
  const push22Note = dealerPush22 ? " (Push-22)" : "";
  return {
    title: "DONE",
    detail: `Dealer ${dStr}${push22Note} | ${outcomes} | Tokens: ${live.tokensUsed}`,
  };
}
