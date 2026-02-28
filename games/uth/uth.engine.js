// games/uth/uth.engine.js
import { makeDeck, shuffle } from "../../core/cards.js";
import { evalBest5of7, compareEval5 } from "../../core/eval5.js";
import { blindMult, tripsMult } from "./uth.payouts.js";

function dealerQualifies(bestDealerEval) {
  // Dealer needs at least a pair to qualify. :contentReference[oaicite:6]{index=6}
  // eval5 codes: PR or better qualifies
  return bestDealerEval.code !== "HI";
}

function playerHasStraightPlus(bestPlayerEval) {
  // Straight+ codes include ST, FL, FH, FK, SF, RF
  return ["ST", "FL", "FH", "FK", "SF", "RF"].includes(bestPlayerEval.code);
}

export async function dealUTHRound(store, { ante, trips, payouts }) {
  const round = await store.startRound("UTH");

  // equal Ante + Blind :contentReference[oaicite:7]{index=7}
  await store.placeBet(round.id, "ANTE", ante);
  await store.placeBet(round.id, "BLIND", ante);
  if (trips > 0) await store.placeBet(round.id, "TRIPS", trips);

  const deck = shuffle(makeDeck());

  const player = [deck.pop(), deck.pop()];
  const dealer = [deck.pop(), deck.pop()];
  const board = [deck.pop(), deck.pop(), deck.pop(), deck.pop(), deck.pop()];

  return {
    roundId: round.id,
    live: {
      ante,
      blind: ante,
      trips,
      payouts,
      street: "PREFLOP", // PREFLOP -> FLOP -> RIVER -> DONE
      playWager: 0,
      player,
      dealer,
      board,
      // reveal control
      flopRevealed: false,
      riverRevealed: false,
    },
  };
}

export async function betPreflop(store, roundId, live, mult /*3 or 4*/) {
  if (live.street !== "PREFLOP") throw new Error("Not preflop.");
  if (![3, 4].includes(mult)) throw new Error("Preflop bet must be 3x or 4x.");

  const amt = live.ante * mult;
  await store.placeBet(roundId, "PLAY", amt);

  live.playWager = amt;
  live.street = "DONE"; // no more decisions once Play is placed
  live.flopRevealed = true;
  live.riverRevealed = true;

  return live;
}

export function checkPreflop(live) {
  if (live.street !== "PREFLOP") throw new Error("Not preflop.");
  live.street = "FLOP";
  live.flopRevealed = true;
  return live;
}

export async function betFlop(store, roundId, live) {
  if (live.street !== "FLOP") throw new Error("Not flop street.");
  const amt = live.ante * 2;
  await store.placeBet(roundId, "PLAY", amt);
  live.playWager = amt;
  live.street = "DONE";
  live.riverRevealed = true;
  return live;
}

export function checkFlop(live) {
  if (live.street !== "FLOP") throw new Error("Not flop street.");
  live.street = "RIVER";
  live.riverRevealed = true;
  return live;
}

export async function betRiver(store, roundId, live) {
  if (live.street !== "RIVER") throw new Error("Not river street.");
  const amt = live.ante;
  await store.placeBet(roundId, "PLAY", amt);
  live.playWager = amt;
  live.street = "DONE";
  return live;
}

export async function foldRiver(store, roundId, live) {
  if (live.street !== "RIVER") throw new Error("Not river street.");

  // folding loses wagers (Ante/Blind/Trips) per typical flow; PDF only says "fold" at river decision point
  await store.settle(roundId, "ANTE", "LOSE", 0, 0);
  await store.settle(roundId, "BLIND", "LOSE", 0, 0);
  if (live.trips > 0) await store.settle(roundId, "TRIPS", "LOSE", 0, 0);

  await store.closeRound(roundId);
  return { title: "FOLD", detail: "Ante/Blind/Trips lost." };
}

export async function resolveUTH(store, roundId, live) {
  if (live.playWager <= 0) throw new Error("No Play bet placed.");

  // Build best hands from 7 cards
  const p7 = [...live.player, ...live.board];
  const d7 = [...live.dealer, ...live.board];

  const pBest = evalBest5of7(p7);
  const dBest = evalBest5of7(d7);

  // Trips resolves independent
  if (live.trips > 0) {
    const mult = tripsMult(live.payouts, pBest.code);
    if (mult > 0)
      await store.settle(
        roundId,
        "TRIPS",
        "WIN",
        mult * live.trips,
        live.trips,
      );
    else await store.settle(roundId, "TRIPS", "LOSE", 0, 0);
  }

  const dealerQual = dealerQualifies(dBest);

  const cmp = compareEval5(pBest, dBest);

  // helper settle even-money win/lose/push
  async function settleEven(type, amt, outcome) {
    if (outcome === "WIN") return store.settle(roundId, type, "WIN", amt, amt);
    if (outcome === "LOSE") return store.settle(roundId, type, "LOSE", 0, 0);
    return store.settle(roundId, type, "PUSH", 0, amt);
  }

  let title = "";
  let detail = `Player: ${pBest.code} | Dealer: ${dBest.code}. `;

  if (!dealerQual) {

    await store.settle(roundId, "ANTE", "PUSH", 0, live.ante);

    if (cmp > 0) await settleEven("PLAY", live.playWager, "WIN");
    else if (cmp < 0) await settleEven("PLAY", live.playWager, "LOSE");
    else await settleEven("PLAY", live.playWager, "PUSH");
    if (cmp > 0 && playerHasStraightPlus(pBest)) {
      const mult = blindMult(live.payouts, pBest.code);
      await store.settle(
        roundId,
        "BLIND",
        "WIN",
        mult * live.blind,
        live.blind,
      );
    } else {
      await store.settle(roundId, "BLIND", "PUSH", 0, live.blind);
    }

    title = "Dealer did NOT qualify";
    detail += "Ante returned; Play/Blind resolved normally.";
  } else {
    if (cmp > 0) {
      await settleEven("ANTE", live.ante, "WIN");
      await settleEven("PLAY", live.playWager, "WIN");


      if (playerHasStraightPlus(pBest)) {
        const mult = blindMult(live.payouts, pBest.code);
        await store.settle(
          roundId,
          "BLIND",
          "WIN",
          mult * live.blind,
          live.blind,
        );
      } else {
        await store.settle(roundId, "BLIND", "PUSH", 0, live.blind);
      }

      title = "PLAYER WINS";
      detail += "Ante+Play even money; Blind pays only on Straight+.";
    } else if (cmp < 0) {
      await settleEven("ANTE", live.ante, "LOSE");
      await settleEven("PLAY", live.playWager, "LOSE");
      await settleEven("BLIND", live.blind, "LOSE");

      title = "DEALER WINS";
      detail += "All main bets lose.";
    } else {
      await settleEven("ANTE", live.ante, "PUSH");
      await settleEven("PLAY", live.playWager, "PUSH");
      await settleEven("BLIND", live.blind, "PUSH");

      title = "TIE / PUSH";
      detail += "Main bets push.";
    }
  }

  await store.closeRound(roundId);
  return { title, detail, pBest, dBest };
}
