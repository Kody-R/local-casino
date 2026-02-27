// games/threecard/threecard.engine.js
import { makeDeck, shuffle } from "../../core/cards.js";
import {
  eval3,
  compareEval3,
  dealerQualifies,
  handName3,
} from "../../core/eval3.js";
import { evalBest5of6 } from "../../core/eval5.js";

export async function dealThreeCardRound(
  store,
  { ante, pairPlus, sixCard, payouts },
) {
  const round = await store.startRound("THREECARD");

  await store.placeBet(round.id, "ANTE", ante);
  if (pairPlus > 0) await store.placeBet(round.id, "PAIR_PLUS", pairPlus);
  if (sixCard > 0) await store.placeBet(round.id, "SIX_CARD_BONUS", sixCard);

  const deck = shuffle(makeDeck());
  const player = [deck.pop(), deck.pop(), deck.pop()];
  const dealer = [deck.pop(), deck.pop(), deck.pop()];

  return {
    roundId: round.id,
    live: { ante, pairPlus, sixCard, payouts, player, dealer },
  };
}

export async function foldThreeCard(store, roundId, live) {
  // Folding forfeits Ante and any bonus wager. :contentReference[oaicite:0]{index=0}
  await store.settle(roundId, "ANTE", "LOSE", 0, 0);
  if (live.pairPlus > 0) await store.settle(roundId, "PAIR_PLUS", "LOSE", 0, 0);
  if (live.sixCard > 0)
    await store.settle(roundId, "SIX_CARD_BONUS", "LOSE", 0, 0);

  await store.closeRound(roundId);

  return { detail: "Ante + bonus bets lost." };
}

export async function playThreeCard(store, roundId, live) {
  // Play wager equals Ante. :contentReference[oaicite:1]{index=1}
  await store.placeBet(roundId, "PLAY", live.ante);

  const pEval = eval3(live.player);
  const dEval = eval3(live.dealer);
  const qualifies = dealerQualifies(dEval, live.dealer);

  // Pair Plus (independent)
  if (live.pairPlus > 0) {
    const mult = live.payouts.pairPlus[pEval.rankCode] ?? 0;
    if (mult > 0) {
      await store.settle(
        roundId,
        "PAIR_PLUS",
        "WIN",
        mult * live.pairPlus,
        live.pairPlus,
      );
    } else {
      await store.settle(roundId, "PAIR_PLUS", "LOSE", 0, 0);
    }
  }

  // 6-card bonus (best 5 of 6)
  if (live.sixCard > 0) {
    const best6 = evalBest5of6([...live.player, ...live.dealer]);
    const mult = live.payouts.sixCard[best6.code] ?? 0;
    if (mult > 0) {
      await store.settle(
        roundId,
        "SIX_CARD_BONUS",
        "WIN",
        mult * live.sixCard,
        live.sixCard,
      );
    } else {
      await store.settle(roundId, "SIX_CARD_BONUS", "LOSE", 0, 0);
    }
  }

  let title = "";
  let detail = `Player: ${handName3(pEval.rankCode)} | Dealer: ${handName3(dEval.rankCode)}. `;

  if (!qualifies) {
    // Dealer doesn't qualify: Ante wins, Play returned. :contentReference[oaicite:2]{index=2}
    await store.settle(roundId, "ANTE", "WIN", live.ante, live.ante);
    await store.settle(roundId, "PLAY", "PUSH", 0, live.ante);
    title = "Dealer did NOT qualify";
    detail += "Ante wins; Play returned.";
  } else {
    const cmp = compareEval3(pEval, dEval);
    if (cmp > 0) {
      await store.settle(roundId, "ANTE", "WIN", live.ante, live.ante);
      await store.settle(roundId, "PLAY", "WIN", live.ante, live.ante);
      title = "PLAYER WINS";
      detail += "Player beats dealer.";
    } else if (cmp < 0) {
      await store.settle(roundId, "ANTE", "LOSE", 0, 0);
      await store.settle(roundId, "PLAY", "LOSE", 0, 0);
      title = "DEALER WINS";
      detail += "Dealer beats player.";
    } else {
      await store.settle(roundId, "ANTE", "PUSH", 0, live.ante);
      await store.settle(roundId, "PLAY", "PUSH", 0, live.ante);
      title = "TIE / PUSH";
      detail += "Ante + Play returned.";
    }
  }

  await store.closeRound(roundId);
  return { title, detail };
}
