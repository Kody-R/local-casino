// games/djwild/djwild.engine.js
import { makeDeck, shuffle } from "../../core/cards.js";

export function makeDJDeck() {
  // 52 + 1 Joker (PDF)
  const deck = makeDeck();
  deck.push({ r: "JOKER", joker: true });
  return deck;
}

export function newDJState() {
  return {
    phase: "IDLE", // IDLE -> DECISION -> SHOW -> DONE
    deck: [],
    player: [],
    dealer: [],
    ante: 0,
    blind: 0,
    play: 0,
    trips: 0,
    badbeat: 0,
    result: null,
  };
}

export function dealDJ(state, ante, trips = 0, badbeat = 0) {
  state.deck = shuffle(makeDJDeck());
  state.player = [
    state.deck.pop(),
    state.deck.pop(),
    state.deck.pop(),
    state.deck.pop(),
    state.deck.pop(),
  ];
  state.dealer = [
    state.deck.pop(),
    state.deck.pop(),
    state.deck.pop(),
    state.deck.pop(),
    state.deck.pop(),
  ];

  state.ante = ante;
  state.blind = ante;
  state.play = 0;
  state.trips = trips;
  state.badbeat = badbeat;

  state.phase = "DECISION";
  state.result = null;
  return state;
}

export function foldDJ(state) {
  if (state.phase !== "DECISION") return state;
  state.phase = "DONE";
  return state;
}

export function playDJ(state) {
  if (state.phase !== "DECISION") return state;
  state.play = 2 * state.ante;
  state.phase = "SHOW";
  return state;
}
