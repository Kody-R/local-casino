// games/baccarat/baccarat.engine.js
import { freshShoe, draw } from "../../core/cards.js";

export function newBaccaratShoe({ decks = 8, cutCards = 52 } = {}) {
  const shoe = {
    decks,
    cutCards, // reshuffle when remaining <= cutCards
    cards: freshShoe(decks),
    needsShuffle: false,
  };
  updateShuffleFlag(shoe);
  return shoe;
}

export function remaining(shoe) {
  return shoe.cards.length;
}

function updateShuffleFlag(shoe) {
  shoe.needsShuffle = shoe.cards.length <= shoe.cutCards;
}

function cardValue(c) {
  const r = c.r;
  if (r === "A") return 1;
  if (r === "K" || r === "Q" || r === "J") return 0;
  if (r === "T" || r === "10") return 0;
  return Number(r);
}

export function baccaratTotal(hand) {
  return hand.reduce((s, c) => s + cardValue(c), 0) % 10;
}

function isPair2(hand) {
  return hand.length >= 2 && hand[0].r === hand[1].r;
}

function shouldBankerDraw(bTotal, playerThird) {
  // If player stands, banker draws on 0–5, stands 6–7
  if (!playerThird) return bTotal <= 5;

  const p3 = cardValue(playerThird);

  if (bTotal <= 2) return true;
  if (bTotal === 3) return p3 !== 8;
  if (bTotal === 4) return p3 >= 2 && p3 <= 7;
  if (bTotal === 5) return p3 >= 4 && p3 <= 7;
  if (bTotal === 6) return p3 === 6 || p3 === 7;
  return false; // 7 stands
}

export function dealBaccaratRound(shoe) {
  // reshuffle if cut card reached (do it before the round)
  if (shoe.needsShuffle) {
    shoe.cards = freshShoe(shoe.decks);
    shoe.needsShuffle = false;
  }

  const player = [draw(shoe.cards), draw(shoe.cards)];
  const banker = [draw(shoe.cards), draw(shoe.cards)];

  const p2 = baccaratTotal(player);
  const b2 = baccaratTotal(banker);

  const natural = p2 >= 8 || b2 >= 8;

  let playerThird = null;
  let bankerThird = null;

  if (!natural) {
    // Player draws on 0–5
    if (p2 <= 5) {
      playerThird = draw(shoe.cards);
      player.push(playerThird);
    }

    // Banker draw depends on banker total and player's third card (if any)
    const bNow = baccaratTotal(banker);
    if (shouldBankerDraw(bNow, playerThird)) {
      bankerThird = draw(shoe.cards);
      banker.push(bankerThird);
    }
  }

  const pFinal = baccaratTotal(player);
  const bFinal = baccaratTotal(banker);

  let winner = "TIE";
  if (pFinal > bFinal) winner = "PLAYER";
  else if (bFinal > pFinal) winner = "BANKER";

  // Side bet qualifiers
  const playerPair = isPair2(player);
  const bankerPair = isPair2(banker);

  const panda8 = winner === "PLAYER" && player.length === 3 && pFinal === 8;

  const dragon7 = winner === "BANKER" && banker.length === 3 && bFinal === 7;

  updateShuffleFlag(shoe);

  return {
    player,
    banker,
    pTotal: pFinal,
    bTotal: bFinal,
    winner,
    natural,
    playerPair,
    bankerPair,
    panda8,
    dragon7,
    remaining: remaining(shoe),
    needsShuffle: shoe.needsShuffle,
  };
}
