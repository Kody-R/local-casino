// games/blackjackplus/blackjackplus.engine.js
import { makeDeck, shuffle } from "../../core/cards.js";
import { eval3 } from "../../core/eval3.js";

function cardBJValue(card) {
  if (card.r === "A") return 11;
  if (["K","Q","J","T"].includes(card.r)) return 10;
  return Number(card.r);
}

export function handTotals(cards) {
  // returns { best, isSoft, isBlackjack, isBust }
  let total = 0;
  let aces = 0;
  for (const c of cards) {
    const v = cardBJValue(c);
    total += v;
    if (c.r === "A") aces++;
  }

  // reduce A from 11 -> 1 until total <= 21 or no aces
  let soft = false;
  while (total > 21 && aces > 0) {
    total -= 10;
    aces--;
  }
  // If we still have an ace counted as 11, it's soft
  // (i.e., at least one ace where we didn't reduce)
  soft = cards.some(c => c.r === "A") && (total <= 21) && (cards.reduce((s,c)=>s+cardBJValue(c),0) !== total);

  const isBJ = cards.length === 2 && total === 21;
  return { best: total, isSoft: soft, isBlackjack: isBJ, isBust: total > 21 };
}

function needsDealerHit(dealerCards, dealerHitsSoft17) {
  const t = handTotals(dealerCards);
  if (t.best < 17) return true;
  if (t.best > 17) return false;
  // t.best == 17
  return dealerHitsSoft17 && t.isSoft; // hit soft 17 if rule enabled
}

function bjPayoutMultiplier(blackjackPays) {
  // returns multiplier on the wager for BJ profit
  // 3:2 => 1.5 ; 6:5 => 1.2
  return blackjackPays === "6:5" ? 1.2 : 1.5;
}

export async function dealBJRound(store, { wager, side3, payouts }) {
  const round = await store.startRound("BLACKJACKPLUS");

  await store.placeBet(round.id, "MAIN", wager);
  if (side3 > 0 && payouts.side3?.enabled) {
    await store.placeBet(round.id, "SIDE3", side3);
  }

  // 6-deck shoe for now
  const shoe = [];
  for (let d = 0; d < 6; d++) shoe.push(...makeDeck());
  shuffle(shoe);

  const player = [shoe.pop(), shoe.pop()];
  const dealer = [shoe.pop(), shoe.pop()]; // dealer[0] upcard, dealer[1] hole

  return {
    roundId: round.id,
    live: {
      wager,
      side3,
      payouts,
      shoe,
      player,
      dealer,
      status: "PLAYER_TURN", // PLAYER_TURN -> DEALER_TURN -> DONE
      doubled: false,
      settled: false
    }
  };
}

export function canDouble(live) {
  return live.status === "PLAYER_TURN" && live.player.length === 2 && !live.doubled;
}

export function hit(live) {
  if (live.status !== "PLAYER_TURN") throw new Error("Not your turn.");
  live.player.push(live.shoe.pop());
  return live;
}

export function stand(live) {
  if (live.status !== "PLAYER_TURN") throw new Error("Not your turn.");
  live.status = "DEALER_TURN";
  return live;
}

export async function doubleDown(store, roundId, live) {
  if (!canDouble(live)) throw new Error("Cannot double now.");
  await store.placeBet(roundId, "DOUBLE", live.wager);
  live.doubled = true;
  live.wager += live.wager; // track total exposure for settlement convenience
  // One card then stand
  live.player.push(live.shoe.pop());
  live.status = "DEALER_TURN";
  return live;
}

export function dealerPlay(live) {
  if (live.status !== "DEALER_TURN") throw new Error("Dealer not active.");
  while (needsDealerHit(live.dealer, live.payouts.dealerHitsSoft17)) {
    live.dealer.push(live.shoe.pop());
  }
  live.status = "DONE";
  return live;
}

export async function settleBJ(store, roundId, live) {
  if (live.settled) throw new Error("Already settled.");
  live.settled = true;

  // Side3 settlement (Player 2 + Dealer upcard)
  if (live.side3 > 0 && live.payouts.side3?.enabled) {
    const three = [live.player[0], live.player[1], live.dealer[0]];
    const e3 = eval3(three);
    const mult = live.payouts.side3.paytable[e3.rankCode] ?? 0;
    if (mult > 0) {
      await store.settle(roundId, "SIDE3", "WIN", mult * live.side3, live.side3);
    } else {
      await store.settle(roundId, "SIDE3", "LOSE", 0, 0);
    }
  }

  const p = handTotals(live.player);
  const d = handTotals(live.dealer);

  // Main wager amount:
  // In ledger: "MAIN" is original stake; "DOUBLE" is extra stake if doubled.
  const mainStake = live.wager; // total (includes double if doubled)

  // If player busts => lose main
  if (p.isBust) {
    await store.settle(roundId, "MAIN", "LOSE", 0, 0);
    if (live.doubled) await store.settle(roundId, "DOUBLE", "LOSE", 0, 0);
    await store.closeRound(roundId);
    return { title: "BUST", detail: `Player busts (${p.best}).` };
  }

  // Dealer busts => player wins even money
  if (d.isBust) {
    // Win even money on each stake component
    await store.settle(roundId, "MAIN", "WIN", (mainStake/ (live.doubled?2:1)) , (mainStake/ (live.doubled?2:1)));
    if (live.doubled) await store.settle(roundId, "DOUBLE", "WIN", (mainStake/2), (mainStake/2));
    await store.closeRound(roundId);
    return { title: "DEALER BUSTS", detail: `Dealer busts (${d.best}).` };
  }

  // Blackjack handling (player BJ vs dealer BJ)
  if (p.isBlackjack && d.isBlackjack) {
    await store.settle(roundId, "MAIN", "PUSH", 0, (mainStake/ (live.doubled?2:1)));
    if (live.doubled) await store.settle(roundId, "DOUBLE", "PUSH", 0, (mainStake/2));
    await store.closeRound(roundId);
    return { title: "PUSH", detail: "Both have Blackjack." };
  }
  if (p.isBlackjack && !d.isBlackjack) {
    const mult = bjPayoutMultiplier(live.payouts.blackjackPays);
    // Profit = stake * mult ; stake returned
    const baseStake = (mainStake/ (live.doubled?2:1));
    await store.settle(roundId, "MAIN", "WIN", baseStake * mult, baseStake);
    // If doubled, blackjack can't happen (double only on 2 cards, but BJ resolves immediately before actions in UI)
    if (live.doubled) await store.settle(roundId, "DOUBLE", "WIN", (mainStake/2) * 1, (mainStake/2));
    await store.closeRound(roundId);
    return { title: "BLACKJACK!", detail: `Pays ${live.payouts.blackjackPays}.` };
  }
  if (!p.isBlackjack && d.isBlackjack) {
    await store.settle(roundId, "MAIN", "LOSE", 0, 0);
    if (live.doubled) await store.settle(roundId, "DOUBLE", "LOSE", 0, 0);
    await store.closeRound(roundId);
    return { title: "DEALER BLACKJACK", detail: "You lose." };
  }

  // Compare totals
  if (p.best > d.best) {
    const baseStake = (mainStake/ (live.doubled?2:1));
    await store.settle(roundId, "MAIN", "WIN", baseStake, baseStake);
    if (live.doubled) await store.settle(roundId, "DOUBLE", "WIN", (mainStake/2), (mainStake/2));
    await store.closeRound(roundId);
    return { title: "WIN", detail: `${p.best} beats ${d.best}.` };
  } else if (p.best < d.best) {
    await store.settle(roundId, "MAIN", "LOSE", 0, 0);
    if (live.doubled) await store.settle(roundId, "DOUBLE", "LOSE", 0, 0);
    await store.closeRound(roundId);
    return { title: "LOSE", detail: `${p.best} loses to ${d.best}.` };
  } else {
    const baseStake = (mainStake/ (live.doubled?2:1));
    await store.settle(roundId, "MAIN", "PUSH", 0, baseStake);
    if (live.doubled) await store.settle(roundId, "DOUBLE", "PUSH", 0, (mainStake/2));
    await store.closeRound(roundId);
    return { title: "PUSH", detail: `${p.best} ties ${d.best}.` };
  }
}
