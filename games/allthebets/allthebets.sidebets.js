import { SIDE_BET_PAYTABLES } from "./allthebets.payouts.js";

const RED_SUITS = new Set(["hearts", "diamonds"]);

function rankValue(rank) {
  if (["J", "Q", "K"].includes(rank)) return 10;
  if (rank === "A") return 11;
  return Number(rank);
}

function cardColor(card) {
  return RED_SUITS.has(card.suit) ? "red" : "black";
}

function isSuited(cards) {
  return cards.every(c => c.suit === cards[0].suit);
}

function sortRanksForStraight(cards) {
  const map = { A: 14, K: 13, Q: 12, J: 11 };
  const vals = cards
    .map(c => (map[c.rank] ?? Number(c.rank)))
    .sort((a, b) => a - b);

  const lowAce = [...vals].map(v => (v === 14 ? 1 : v)).sort((a, b) => a - b);
  return { high: vals, lowAce };
}

function isStraight(cards) {
  const { high, lowAce } = sortRanksForStraight(cards);
  const check = arr => arr[1] === arr[0] + 1 && arr[2] === arr[1] + 1;
  return check(high) || check(lowAce);
}

function countRanks(cards) {
  const counts = new Map();
  for (const c of cards) counts.set(c.rank, (counts.get(c.rank) || 0) + 1);
  return counts;
}

function payoutResult(name, win, multiplier = 0, label = "") {
  return { name, win, multiplier, label };
}

export function evalPerfectPairs(playerCards) {
  const pt = SIDE_BET_PAYTABLES.perfectPairs;
  if (playerCards.length < 2) return payoutResult("Perfect Pairs", false);
  const [a, b] = playerCards;
  if (a.rank !== b.rank) return payoutResult("Perfect Pairs", false);
  if (a.suit === b.suit) return payoutResult("Perfect Pairs", true, pt.perfectPair, "Perfect Pair");
  if (cardColor(a) === cardColor(b)) return payoutResult("Perfect Pairs", true, pt.coloredPair, "Colored Pair");
  return payoutResult("Perfect Pairs", true, pt.mixedPair, "Mixed Pair");
}

export function eval21Plus3(playerCards, dealerUpcard) {
  const pt = SIDE_BET_PAYTABLES.twentyOnePlusThree;
  const cards = [...playerCards.slice(0, 2), dealerUpcard];
  if (cards.length !== 3) return payoutResult("21+3", false);

  const suited = isSuited(cards);
  const straight = isStraight(cards);
  const rankCounts = [...countRanks(cards).values()].sort((a, b) => b - a);
  const threeKind = rankCounts[0] === 3;
  const suitedTrips = threeKind && suited;

  if (suitedTrips) return payoutResult("21+3", true, pt.suitedTrips, "Suited Trips");
  if (straight && suited) return payoutResult("21+3", true, pt.straightFlush, "Straight Flush");
  if (threeKind) return payoutResult("21+3", true, pt.threeOfKind, "Three of a Kind");
  if (straight) return payoutResult("21+3", true, pt.straight, "Straight");
  if (suited) return payoutResult("21+3", true, pt.flush, "Flush");
  return payoutResult("21+3", false);
}

export function evalLuckyLadies(playerCards, dealerCards) {
  const pt = SIDE_BET_PAYTABLES.luckyLadies;
  const [a, b] = playerCards;
  if (!a || !b) return payoutResult("Lucky Ladies", false);

  const total = rankValue(a.rank) + rankValue(b.rank);
  if (total !== 20) return payoutResult("Lucky Ladies", false);

  const bothQH = a.rank === "Q" && b.rank === "Q" && a.suit === "hearts" && b.suit === "hearts";
  const dealerBJ = dealerCards?.length >= 2 && handValue(dealerCards) === 21 && dealerCards.length === 2;

  if (bothQH && dealerBJ) {
    return payoutResult("Lucky Ladies", true, pt.queenHeartsPairDealerBlackjack, "Q♥ + Q♥ with Dealer Blackjack");
  }
  if (bothQH) return payoutResult("Lucky Ladies", true, pt.queenHeartsPair, "Q♥ + Q♥");
  if (a.rank === b.rank) return payoutResult("Lucky Ladies", true, pt.matched20, "Matched 20");
  if (a.suit === b.suit) return payoutResult("Lucky Ladies", true, pt.suited20, "Suited 20");
  return payoutResult("Lucky Ladies", true, pt.any20, "Any 20");
}

export function evalLuckyLucky(playerCards, dealerUpcard) {
  const pt = SIDE_BET_PAYTABLES.luckyLucky;
  const cards = [...playerCards.slice(0, 2), dealerUpcard];
  if (cards.length !== 3) return payoutResult("Lucky Lucky", false);

  const total = cards.reduce((s, c) => s + Math.min(rankValue(c.rank), 10), 0);
  const suited = isSuited(cards);
  const ranks = cards.map(c => c.rank).sort();
  const nums = cards.map(c => ({ ...c, n: Math.min(rankValue(c.rank), 10) })).sort((a, b) => a.n - b.n);

  const is678 = nums[0].n === 6 && nums[1].n === 7 && nums[2].n === 8;
  const is777 = cards.every(c => c.rank === "7");

  if (is777 && suited) return payoutResult("Lucky Lucky", true, pt.suited777, "Suited 777");
  if (is777) return payoutResult("Lucky Lucky", true, pt.triple7, "777");
  if (is678 && suited) return payoutResult("Lucky Lucky", true, pt.suited678, "Suited 678");
  if (is678) return payoutResult("Lucky Lucky", true, pt.straight678, "678");
  if (total === 21 && suited) return payoutResult("Lucky Lucky", true, pt.suited21, "Suited 21");
  if (total === 21) return payoutResult("Lucky Lucky", true, pt.total21, "21");
  if (total === 20) return payoutResult("Lucky Lucky", true, pt.total20, "20");
  if (total === 19) return payoutResult("Lucky Lucky", true, pt.total19, "19");

  return payoutResult("Lucky Lucky", false);
}

export function evalOverUnder13(playerCards, side = "over") {
  const pt = SIDE_BET_PAYTABLES.overUnder13;
  const total = playerCards.slice(0, 2).reduce((s, c) => s + Math.min(rankValue(c.rank), 10), 0);
  if (total === 13) {
    if (pt.exactly13Mode === "push") return payoutResult(side === "over" ? "Over 13" : "Under 13", true, 0, "Push 13");
    if (pt.exactly13Mode === "win") return payoutResult(side === "over" ? "Over 13" : "Under 13", true, pt.exactly13 || 1, "Exact 13");
    return payoutResult(side === "over" ? "Over 13" : "Under 13", false);
  }
  if (side === "over" && total > 13) return payoutResult("Over 13", true, pt.over, `Total ${total}`);
  if (side === "under" && total < 13) return payoutResult("Under 13", true, pt.under, `Total ${total}`);
  return payoutResult(side === "over" ? "Over 13" : "Under 13", false);
}

export function evalMatchDealer(playerCards, dealerUpcard) {
  const pt = SIDE_BET_PAYTABLES.matchDealer;
  const matches = playerCards.slice(0, 2).filter(c => c.rank === dealerUpcard.rank);
  if (!matches.length) return payoutResult("Match the Dealer", false);

  const suitedMatches = matches.filter(c => c.suit === dealerUpcard.suit).length;
  if (suitedMatches > 0) return payoutResult("Match the Dealer", true, pt.suited * suitedMatches, suitedMatches === 2 ? "Two Suited Matches" : "Suited Match");
  return payoutResult("Match the Dealer", true, pt.unsuited * matches.length, matches.length === 2 ? "Two Matches" : "Match");
}

export function evalRoyalMatch(playerCards) {
  const pt = SIDE_BET_PAYTABLES.royalMatch;
  const [a, b] = playerCards;
  if (!a || !b || a.suit !== b.suit) return payoutResult("Royal Match", false);
  const royal = new Set([a.rank, b.rank]);
  if (royal.has("K") && royal.has("Q")) return payoutResult("Royal Match", true, pt.kingQueenSuited, "Suited KQ");
  return payoutResult("Royal Match", true, pt.suited, "Suited Cards");
}

export function evalBlazing7s(playerCards) {
  const pt = SIDE_BET_PAYTABLES.blazing7s;
  const cards = playerCards;
  const sevens = cards.filter(c => c.rank === "7");
  if (sevens.length === 0) return payoutResult("Blazing 7s", false);
  if (sevens.length === 1) return payoutResult("Blazing 7s", true, pt.single7, "Single 7");
  if (sevens.length === 2) {
    if (sevens[0].suit === sevens[1].suit) return payoutResult("Blazing 7s", true, pt.suitedTwo7s, "Suited 77");
    return payoutResult("Blazing 7s", true, pt.two7s, "77");
  }
  if (sevens.length >= 3) {
    const sameSuit = sevens.every(c => c.suit === sevens[0].suit);
    if (sameSuit) return payoutResult("Blazing 7s", true, pt.suitedThree7s, "Suited 777");
    return payoutResult("Blazing 7s", true, pt.three7s, "777");
  }
  return payoutResult("Blazing 7s", false);
}

export function evalBustIt(dealerCards) {
  const pt = SIDE_BET_PAYTABLES.bustIt;
  const total = handValue(dealerCards);
  if (total <= 21) return payoutResult("Bust It", false);
  const n = dealerCards.length;
  if (n <= 3) return payoutResult("Bust It", true, pt.bust3, "3 Card Bust");
  if (n === 4) return payoutResult("Bust It", true, pt.bust4, "4 Card Bust");
  if (n === 5) return payoutResult("Bust It", true, pt.bust5, "5 Card Bust");
  if (n === 6) return payoutResult("Bust It", true, pt.bust6, "6 Card Bust");
  return payoutResult("Bust It", true, pt.bust7Plus, "7+ Card Bust");
}

export function handValue(cards) {
  let total = 0;
  let aces = 0;
  for (const c of cards) {
    if (c.rank === "A") {
      total += 11;
      aces += 1;
    } else if (["K", "Q", "J"].includes(c.rank)) {
      total += 10;
    } else {
      total += Number(c.rank);
    }
  }
  while (total > 21 && aces > 0) {
    total -= 10;
    aces -= 1;
  }
  return total;
}

export function evaluateOpeningSideBets({ playerCards, dealerUpcard, dealerCards, sideBets }) {
  const results = [];

  if (sideBets.perfectPairs > 0) results.push({ wager: sideBets.perfectPairs, ...evalPerfectPairs(playerCards) });
  if (sideBets.twentyOnePlusThree > 0) results.push({ wager: sideBets.twentyOnePlusThree, ...eval21Plus3(playerCards, dealerUpcard) });
  if (sideBets.luckyLadies > 0) results.push({ wager: sideBets.luckyLadies, ...evalLuckyLadies(playerCards, dealerCards) });
  if (sideBets.luckyLucky > 0) results.push({ wager: sideBets.luckyLucky, ...evalLuckyLucky(playerCards, dealerUpcard) });
  if (sideBets.over13 > 0) results.push({ wager: sideBets.over13, ...evalOverUnder13(playerCards, "over") });
  if (sideBets.under13 > 0) results.push({ wager: sideBets.under13, ...evalOverUnder13(playerCards, "under") });
  if (sideBets.matchDealer > 0) results.push({ wager: sideBets.matchDealer, ...evalMatchDealer(playerCards, dealerUpcard) });
  if (sideBets.royalMatch > 0) results.push({ wager: sideBets.royalMatch, ...evalRoyalMatch(playerCards) });
  if (sideBets.blazing7s > 0) results.push({ wager: sideBets.blazing7s, ...evalBlazing7s(playerCards) });

  return results.map(r => ({
    ...r,
    payout: r.win ? r.wager * r.multiplier : 0,
    push: r.win && r.multiplier === 0,
  }));
}

export function evaluateClosingSideBets({ dealerCards, sideBets }) {
  const results = [];
  if (sideBets.bustIt > 0) {
    const r = evalBustIt(dealerCards);
    results.push({ wager: sideBets.bustIt, ...r, payout: r.win ? sideBets.bustIt * r.multiplier : 0, push: false });
  }
  return results;
}