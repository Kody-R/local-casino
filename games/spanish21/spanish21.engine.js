// games/spanish21/spanish21.engine.js

const SUITS = ["S", "H", "D", "C"];
// Spanish 21 removes all TEN ranks ("T") from the deck.
const SPANISH_RANKS = ["2","3","4","5","6","7","8","9","J","Q","K","A"];

const VALUE = {
  "2":2,"3":3,"4":4,"5":5,"6":6,"7":7,"8":8,"9":9,
  "J":10,"Q":10,"K":10,"A":11
};

export function makeSpanishDeck({ decks = 6 } = {}) {
  const deck = [];
  for (let d = 0; d < decks; d++) {
    for (const s of SUITS) for (const r of SPANISH_RANKS) deck.push({ r, s });
  }
  return deck;
}

export function shuffle(deck, rng = Math.random) {
  for (let i = deck.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [deck[i], deck[j]] = [deck[j], deck[i]];
  }
  return deck;
}

export function handValue(hand) {
  let total = 0;
  let aces = 0;
  for (const c of hand) {
    total += VALUE[c.r] ?? 0;
    if (c.r === "A") aces++;
  }
  while (total > 21 && aces > 0) {
    total -= 10; // convert A from 11 -> 1
    aces--;
  }
  // soft if there exists an Ace still counted as 11
  const isSoft = hand.some(c => c.r === "A") && total <= 21 && (hand.reduce((a,c)=>a+(VALUE[c.r]??0),0) !== total);
  return { total, isSoft };
}

export function isBlackjack(hand) {
  if (hand.length !== 2) return false;
  const r1 = hand[0].r, r2 = hand[1].r;
  return (r1 === "A" && isTenValue(r2)) || (r2 === "A" && isTenValue(r1));
}
function isTenValue(r) {
  return r === "J" || r === "Q" || r === "K";
}

export function canSplit(hand) {
  return hand.length === 2 && hand[0].r === hand[1].r;
}

export function newSpanish21State({
  decks = 6,
  dealerHitsSoft17 = true,
  maxHands = 4,
  doubleAfterSplit = true,
  rng = Math.random
} = {}) {
  const shoe = shuffle(makeSpanishDeck({ decks }), rng);
  return {
    cfg: { decks, dealerHitsSoft17, maxHands, doubleAfterSplit },
    shoe,
    stage: "BET", // BET -> PLAYER -> DEALER -> SETTLE
    dealer: [],
    hands: [],
    bets: [],
    active: 0,
    results: [] // per-hand settlement objects
  };
}

function draw(state) {
  if (state.shoe.length < 20) {
    // simple reshuffle when low
    state.shoe = shuffle(makeSpanishDeck({ decks: state.cfg.decks }), Math.random);
  }
  return state.shoe.shift();
}

export function startRound(state, ante) {
  if (state.stage !== "BET") return state;

  state.dealer = [draw(state), draw(state)];
  state.hands = [[draw(state), draw(state)]];
  state.bets = [ante];
  state.active = 0;
  state.results = [];
  state.stage = "PLAYER";

  // Spanish 21: player BJ always wins, even if dealer BJ.
  // We still allow player to act if not blackjack.
  const playerBJ = isBlackjack(state.hands[0]);
  if (playerBJ) {
    state.stage = "SETTLE";
    state.results = settleAll(state);
  }
  return state;
}

export function availableActions(state) {
  if (state.stage !== "PLAYER") return [];

  const hand = state.hands[state.active];
  const bet = state.bets[state.active];

  const { total } = handValue(hand);
  if (total >= 21) return ["STAND"]; // at 21 you effectively stand

  const actions = ["HIT", "STAND"];

  // double on any 2 cards; also allow after split if configured
  if (hand.length === 2) {
    if (state.cfg.doubleAfterSplit || state.hands.length === 1) actions.push("DOUBLE");
  }

  // split
  if (canSplit(hand) && state.hands.length < state.cfg.maxHands) actions.push("SPLIT");

  return actions;
}

export function step(state, action) {
  if (state.stage !== "PLAYER") return state;

  const i = state.active;
  const hand = state.hands[i];

  if (action === "HIT") {
    hand.push(draw(state));
    const { total } = handValue(hand);
    if (total >= 21) advanceHandOrDealer(state);
    return state;
  }

  if (action === "STAND") {
    advanceHandOrDealer(state);
    return state;
  }

  if (action === "DOUBLE") {
    // UI should have already verified player can afford; engine just marks doubled
    state.bets[i] *= 2;
    hand.push(draw(state));
    advanceHandOrDealer(state);
    return state;
  }

  if (action === "SPLIT") {
    const c1 = hand[0], c2 = hand[1];
    // create two hands
    const h1 = [c1, draw(state)];
    const h2 = [c2, draw(state)];
    const bet = state.bets[i];

    // replace current hand with h1, insert h2 after it
    state.hands.splice(i, 1, h1, h2);
    state.bets.splice(i, 1, bet, bet);
    // stay on current index to play h1 first
    return state;
  }

  return state;
}

function advanceHandOrDealer(state) {
  // move to next hand if exists, else dealer
  if (state.active < state.hands.length - 1) {
    state.active++;
    return;
  }
  state.stage = "DEALER";
  playDealer(state);
  state.stage = "SETTLE";
  state.results = settleAll(state);
}

function playDealer(state) {
  const { dealerHitsSoft17 } = state.cfg;
  while (true) {
    const { total, isSoft } = handValue(state.dealer);
    if (total < 17) {
      state.dealer.push(draw(state));
      continue;
    }
    if (total === 17 && dealerHitsSoft17 && isSoft) {
      state.dealer.push(draw(state));
      continue;
    }
    break;
  }
}

function settleAll(state) {
  const dealerBJ = isBlackjack(state.dealer);
  const dealerV = handValue(state.dealer);

  return state.hands.map((hand, idx) => {
    const bet = state.bets[idx];
    const pv = handValue(hand);
    const playerBJ = isBlackjack(hand);

    // Bust
    if (pv.total > 21) {
      return { idx, outcome: "LOSE", reason: "BUST", net: -bet };
    }

    // Spanish 21 special: player blackjack always wins (even vs dealer blackjack)
    if (playerBJ) {
      const win = Math.floor(bet * 1.5); // 3:2 winnings (not including returning stake)
      return { idx, outcome: "WIN", reason: dealerBJ ? "BJ_BEATS_BJ" : "BLACKJACK", net: win };
    }

    // Dealer blackjack beats non-blackjack
    if (dealerBJ) {
      return { idx, outcome: "LOSE", reason: "DEALER_BLACKJACK", net: -bet };
    }

    // Dealer bust
    if (dealerV.total > 21) {
      return { idx, outcome: "WIN", reason: "DEALER_BUST", net: bet };
    }

    // Compare totals
    if (pv.total > dealerV.total) return { idx, outcome: "WIN", reason: "HIGHER_TOTAL", net: bet };
    if (pv.total < dealerV.total) return { idx, outcome: "LOSE", reason: "LOWER_TOTAL", net: -bet };
    return { idx, outcome: "PUSH", reason: "TIE", net: 0 };
  });
}

// Utility for UI
export function cardToString(c) {
  return `${c.r}${c.s}`;
}
